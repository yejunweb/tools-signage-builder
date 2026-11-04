# 标牌生成器 · 一期设计规范

## 版本锁

- **设计版本：v1.1.7（2026-11-03 jun 锁定）**（对齐权威 PRD `docs/PRD-phase1.md` v1.1.7；项目内 `projects/.../docs/PRD-phase1.md` 仍偏旧，由产品同步）
- 权威 Magic OS：`2aF2VCH32P8EcrCKpPjTSf` → https://www.magicpatterns.com/os/2aF2VCH32P8EcrCKpPjTSf
- **未经 jun 明确要求，不改视觉与交互基线**；意见先交 jun，未点名不交前端落地、不提交代码。

### v1.1.7 锁版要点（2026-11-03 jun 锁定；含 v1.1.0 改稿 + 空态定稿；封版清理去掉 roomsEmpty/previewEmpty 两 arg）

1. **编辑表单 IA 拆分**：旧实现把楼栋/楼层/单元/房/面积都塞进「每条户信息」→ 现改为（顺序锁定）：
   - **基本信息**：记录名称
   - **标牌画布**：宽、高、圆角、背景色（预备粉/蓝/白/深灰/品牌蓝 + 自定义取色）
   - **展示类型**：勾选 栋 / 层 / 单元 / 房 / 面积（在画布与标牌基本信息之间）
   - **标牌基本信息**（整牌一份）：楼栋号、楼层数；各自字色+描边（折叠样式行，默认收起；标签列 112px）
   - **房号信息**（可多条 **增删 + 拖拽排序**，⋮⋮ 手柄 `cursor:grab`）：单元号、室号、面积；各自字色+描边（按字段折叠，默认收起）
2. **实时预览四行**（对齐旧 `generateSignTexture` / `export-example.png`）：
   - 第1行：楼号 `N#` | 楼层 `NF`（两格）
   - 第2行：单元号（相邻相同单元号 **合并单元格**，对齐 unitMergeMap）
   - 第3行：室号（等分）
   - 第4行：面积 `Nm²`（等分；² 上标示意）
   - 未勾选的展示类型对应行/格不画；预览台棋盘格（透明底开）或浅底；标牌 fit + ~24px 内边距语义
3. **编辑 args**：`default` / `unsavedLeave`（**封版清理已去掉** `roomsEmpty` / `previewEmpty` 两独立 arg）。新建空态交互以 **`default` 示意/实现为准**：房号列表空时表单展示虚线空态（区标题 +「添加房号」CTA）；楼栋/层与房号皆空时预览为**填标牌背景色**的圆角矩形 + **白描边**，**不写**「暂无预览」文字；棋盘格预览台可保留
4. **数据模型**：`buildingNum` / `totalFloorNum` + `basicStyles`；`rooms[{ id, unit, room, area, styles }]`；勿再把 building/floor 放进每条 room
5. **透明底**（底栏左侧，**默认勾选**）两层概念：
   - **开**：画布矩形上，标牌圆角**外**区域 = 透明（预览台棋盘格衬托）；圆角**内**仍为填充色
   - **关**：圆角外 = **白**（不是填充色铺满整张画布）
   - 填充色（预备粉/蓝等）只填圆角内；预览台 padding/台底是 UI，导出仅标牌本体
6. **`default` arg（权威示意，含可交互空态）**：完整四行示意（有房号）方便目视完整牌；同时表单/预览按数据驱动空态——清空房号即虚线空态，楼栋/层与房号皆空即填底色白描边预览（无「暂无预览」文案）
7. **新建进编辑产品默认**（实现侧，非独立 Magic arg）：记录名时间戳、画布 400×100、圆角 15、底色默认 **预备粉 `#ef7296`**、展示类型全选、楼栋/层空、房号空 → 走上述 `default` 内空态交互

### 锁版后仍属基线的增量（原 v1.0.0，2026-11-02 jun）

1. **列表分页**：传参换页（类似表格）；**禁止**横滑/轮播
2. **默认每页 12 条**；文案「1/N · 共 M 条」
3. **分页条固定**：贴底栏上方
4. **搜索**仍先过滤再分页
5. **窗口**：列表 + 编辑整体 **800×720**

### 权威帧

| 帧 | file id | 预览 |
| --- | --- | --- |
| 列表 | `kEoQowLtqzCKjkfxDQKpSM` | https://www.magicpatterns.com/os/2aF2VCH32P8EcrCKpPjTSf?file=kEoQowLtqzCKjkfxDQKpSM |
| 编辑 | `3tMV3ARtNfsghY9wUsSKps` | https://www.magicpatterns.com/os/2aF2VCH32P8EcrCKpPjTSf?file=3tMV3ARtNfsghY9wUsSKps |
| 颜色选择通用组件 | `x4Qnhc6udDJMdpPNHDASBH` | https://www.magicpatterns.com/os/2aF2VCH32P8EcrCKpPjTSf?file=x4Qnhc6udDJMdpPNHDASBH |
| Canvas 总览 | `erDiiYkPr2HQxoeRLccfCy` | https://www.magicpatterns.com/os/2aF2VCH32P8EcrCKpPjTSf?file=erDiiYkPr2HQxoeRLccfCy |

Prototype：https://www.magicpatterns.com/os/2aF2VCH32P8EcrCKpPjTSf?file=tT2a5F3AauH81weh1SFjHn  
列表 args：`list` / `empty` / `deleteConfirm`  
编辑 args：`default` / `unsavedLeave`（已去掉 `roomsEmpty` / `previewEmpty`）

## 已定能力摘要（v1.1.7）

- 主题色 `#3370ff`
- 窗口 **800 × 720**，无边框；header 右上角自定义 **最小化 / 关闭**
- **列表**：固定底栏「新建」；搜索；表格式分页每页 **12**；空态「新建标牌」引导（已齐，本改稿未大改列表）
- **编辑**：Header → 预览画布 → 表单（可滚）→ 固定底栏；IA 见上；透明底默认勾选；文案样式可折叠默认收起
- **颜色选择通用组件**：SV + Hue + `DEFAULT_PRESETS` + Hex

## 统一视觉 Token（列表 / 编辑 / 色板同级控件）

| Token | 值 |
| --- | --- |
| 页面底 | `#f7f8fb` |
| 正文色 | `#1f2329` |
| 次文 / 图标默认 | `#8b95a8` · 标签 `#5c6573` |
| Header | 高 **52** · 左右 **20** · 白底 · 底边 `1px solid rgba(15,23,42,.06)` |
| 窗控 | 28×28 · 图标 14 · gap 2 · 默认色 `#8b95a8` · 最小化 hover 浅灰底 · 关闭 hover 红底白标 |
| 底栏 | 高 **56** · 左右 **20** · 白底 · 顶边 `#eef1f6` |
| 主按钮 | 高 32 · radius **8** · 左右 16 · `#3370ff` · 阴影 `0 4px 12px rgba(51,112,255,.25)` |
| 次按钮 | 高 32 · radius **8** · 左右 14 · 边 `#e5e8ef` |
| 输入 / 色触发器 | 边 `#e5e8ef` · radius **6** · 触发器高 **28** · 色块 18 · Hex 12px mono |
| 卡片 / 面板 / Modal | radius **12** |
| Modal 遮罩 | `rgba(15,23,42,.4)` + `blur(2px)` · 卡片阴影 `0 20px 48px …` |
| 色板选中描边 | **主题蓝** `#3370ff`（勿用青绿） |
| 字体 | PingFang SC / Microsoft YaHei / system-ui |

## 列表

- Header：仅标题「标牌生成器」+ 右上最小化/关闭；**无**顶栏「新建」
- **固定底栏**：右对齐主按钮「新建」
- 搜索；表格式分页每页 **12**；分页条固定
- 卡片栅格：`repeat(3, minmax(0, 1fr))`
- **空态**：图标虚线框 +「还没有标牌」+「创建第一条，导出 PNG 到本机」+ 主按钮「新建标牌」（v1.1.0 确认保留，未大改）

## 编辑（v1.1.7 IA）

- 窗口 **800×720**
- **布局**：Header → 预览画布 → 表单（可滚）→ **固定底栏**
- Header：返回 + 右上最小化/关闭
- 表单分区顺序：基本信息 → 标牌画布 → **展示类型** → 标牌基本信息 → 房号信息（可拖拽排序）
- 底栏左侧 **透明底**（默认勾选）；右侧 取消 / 导出 PNG / 保存
- 画布默认 400×100；圆角默认 15
- 底色预备：`#ef7296` / `#5dabd7` / `#ffffff` / `#2B2F36` / `#3370ff` + 自定义；**新建默认预备粉**
- 文案样式：标签列 **112px**；默认字色/描边 `#ffffff`、描边宽 `0`（步进 0–24 / 4）；**可折叠默认收起**
- **default 示意数据**：预备蓝；楼栋 6、楼层 17；4 条房（面积 143/168/168/168）；前两格同单元、后两格同单元；完整四行预览
- **空态（数据驱动，无独立 arg）**：房号 `length===0` 时虚线空态（+ /「暂无房号，点击添加」/「添加房号」）；楼栋/层与房号皆空时预览填背景色圆角白描边，勿「暂无预览」文字；新建产品默认（预备粉、楼栋/层空、房号空）在实现侧套用同一套交互
- **unsavedLeave**：未保存离开遮罩保留

## 颜色选择通用组件

- 独立帧展示全貌；编辑页字色/描边/自定义底色共用
- 触发器：色块 + Hex + 下拉；高 28 · radius 6
- Panel：SV + Hue + 两行预设 + Hex；选中描边主题 `#3370ff`
- 预设 hex：`#FFFFFF` `#000000` `#FF0000` `#FFA500` `#FFFF00` `#00FF00` `#00FFFF` `#0000FF` `#800080` `#CE0000` `#E99394` `#B00049` `#FF8C00` `#327600` `#4CA50A` `#5DABD7` `#0A66A9` `#8FA7D7` `#AA77F5` `#733C8F`
