# 标牌生成器 · 一期 PRD

**版本**：v1.1.7（2026-11-03）  
**修订**：展示类型位于标牌画布与标牌基本信息之间。

一期交付独立 Tauri 桌面标牌生成工具：纯 2D canvas 导出 PNG，历史仅本机 JSON。

---

## 1. 目标

- 按本文档从零实现独立桌面标牌生成工具
- 打开应用进入列表；支持新建 / 编辑 / 复制 / 删除 / 导出 PNG
- 标牌绘制对齐 house-map-vue · ModelFormat · `generateSignTexture`；字色 / 描边按文案可配
- 技术栈：Tauri 2 + React + Vite + TypeScript + antd（主题 `#3370ff`）

---

## 2. 范围

- 列表、编辑、本机 JSON 历史、PNG 导出
- 展示类型勾选、字色、描边、透明底
- 标牌填充色（预备色 + 取色）
- 空态视觉（列表等，见设计）

---

## 3. 窗口与壳

- frameless 窗口；Header：**标题**、编辑页**返回**、**最小化**、**关闭**
- 仅标题区可拖窗（`data-tauri-drag-region`）
- 窗口固定 **800 × 720**（列表与编辑同尺寸）

---

## 4. 列表页

- 打开应用进入列表页
- 卡片视图（自定义控件），一行 3 卡；卡片展示名称 + 预览图（预览图在**保存时**生成并随记录存储，列表只读展示）
- **仅卡片区可滚**；按记录名搜索，先过滤再分页；每页 **12**；分页条文案「1/N · 共 M 条」，固定于底栏上方；表格式换页（改 `page`）
- 底栏「新建」进入编辑；点击卡片进入编辑
- 复制：新记录默认名「原名 - 副本」
- 删除：二次确认「确定删除「{name}」？删除后不可恢复。」
- 空态引导新建；空态样式见设计（Magic OS）

---

## 5. 编辑页

布局自上而下：**Header → 实时预览 → 表单（可滚）→ 固定底栏**。

底栏：左侧「透明底」**默认勾选**；右侧取消 / 导出 PNG / 保存。未保存返回按 Prototype `unsavedLeave` 拦截。

### 5.1 表单结构

| 块 | 字段 | 说明 |
| --- | --- | --- |
| **1. 基本信息** | 记录名称 | 见 §5.1.1 新建默认；可改 |
| **2. 标牌画布** | 宽、高、圆角、背景色 | 见 §5.1.1；背景 = 圆角**内**填充色 |
| **3. 展示类型** | 多选：栋 / 层 / 单元 / 房 / 面积 | 对应 `buildInfo` / `floorInfo` / `unitInfo` / `roomInfo` / `areaInfo`；`buildInfo` 与 `floorInfo` 映射为绘制行 `basicInfo`；新建默认**全选** |
| **4. 标牌基本信息** | `buildingNum`（楼栋号）、`totalFloorNum`（楼层数） | **记录级、整牌各一份**；新建默认为空；各自可配**字色 + 描边** |
| **5. 标牌房号信息** | 支持排序的列表；每条：`unitNum` + `roomId`（室号）+ `area` | 多条；支持增删与**拖拽排序**；新建默认为**空列表**，点击新增才加行；**每个字段**各自可配字色 + 描边 |

表单自上而下顺序：**基本信息 → 标牌画布 → 展示类型 → 标牌基本信息 → 房号信息列表**。

#### 5.1.1 新建默认值

进入新建编辑时：

| 项 | 默认 |
| --- | --- |
| 名称 | `YYYY-MM-dd hh:mm:ss 创建的记录`（精确到秒） |
| 画布宽 / 高 / 圆角 | `400` / `100` / `15` |
| 底色 | 预备粉 `#ef7296` |
| 展示类型 | **全选**（栋 / 层 / 单元 / 房 / 面积） |
| 楼栋号、楼层数 | 空 |
| 房号列表 | **空列表**（支持排序的列表）；用户点击新增后再出现行 |

**字色 / 描边**：按**每一条文案**独立配置；默认字色 / 描边色 `#ffffff`、描边宽 `0`（范围 0–24，步进 4）；样式行可折叠、默认收起；标签列宽 112px。颜色控件含 `DEFAULT_PRESETS` + 取色（与底色共用组件）。

**底色预备项**：粉 `#ef7296`（新建默认）、蓝 `#5dabd7`、白 `#ffffff`、深灰 `#2B2F36`、品牌蓝 `#3370ff` + 自定义。

### 5.2 绘制与画布像素

完整牌典型 **4 行**：

1. 行 1：楼号 + 楼层（记录级 `buildingNum` / `totalFloorNum` + 展示类型）
2. 行 2–4：房号相关行（单元 / 室号 / 面积等，由 `showInfoLs` + 展示类型驱动）
3. 行 2、3 按单元号等规则做**单元格合并**（对齐 `generateSignTexture`）

参考实现：

- 例：`/Users/xiejun/Desktop/house-map-vue/src/components/ModelFormat/utils/generateSignTexture.js`
- 例：`/Users/xiejun/Desktop/house-map-vue/src/components/ModelFormat/hooks/useModelRender.js`

**画布尺寸**：表单宽高即 canvas 像素，导出同尺寸。

绘制参数：边框线宽 2、分割线虚线、文案居中与自适应字号、面积单位 `m²` 上标。

### 5.3 预览与导出

| 项 | 约定 |
| --- | --- |
| 实时预览 | 整块 canvas；标牌在预览容器内**始终 fit**；四周 **padding 24px**；预览台底色仅为 UI |
| 导出 PNG | **仅标牌本体**（设定宽高）；另存为可选路径；默认文件名与记录名一致并加 `.png` |
| 透明底 | **默认开**：圆角**外**透明；关：圆角外**白底**。与圆角**内**填充色是两层概念 |

参考图：`docs/assets/preview-fit-padding.png`、`docs/assets/export-example.png`。

---

## 6. 数据与存储

- 本机 JSON 历史；单文件数组，`version: 1`
- 单条字段：`id`、`name`、`width`/`height`、`borderRadius`、`background`（填充色）、`transparentBackground`（默认 `true`）、`buildingNum`、`totalFloorNum`、`showTypes`、`showInfoLs`（房号多条及各字段字色描边）、整牌楼栋/楼层字色描边、`preview`（保存时 dataURL）、`createdAt`/`updatedAt`
- 保存：写入或更新历史，并生成预览图写入该条
- 复制：新 `id`，默认名「原名 - 副本」
- 宽高合法范围建议 40–2000，非法失焦回退

---

## 7. 参考

| 项 | 值 |
| --- | --- |
| Magic OS | `2aF2VCH32P8EcrCKpPjTSf` |
| 列表 / 编辑 / 色板 / Prototype | 同 OS 内既有帧；空态由设计补帧 |
| 设计规范 | `projects/tools-signage-builder/design/spec.md`（若仓库有） |
| 绘制与表单参考 | 例：house-map-vue · `generateSignTexture` / `drawAdaptiveText` / `SignFormDialog` / `HexColorPicker` |
| 前端规范 | 例：`/Users/xiejun/Desktop/sc-datav-pc/.cursor` |
| 主题色 | `#3370ff` |
