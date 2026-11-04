# 标牌生成器

一期桌面端标牌工具：列表 / 编辑 / 本机历史 / PNG 导出。

## 技术栈

- Tauri 2
- React + Vite + TypeScript
- antd（主题主色 `#3370ff`）
- 纯 canvas 绘制（对齐 house-map-vue `generateSignTexture`，画布像素=表单宽高）

## 开发

```bash
pnpm install
pnpm tauri dev
```

仅前端预览（无桌面壳）：

```bash
pnpm dev
```

自检：

```bash
pnpm exec tsc --noEmit
pnpm lint
```

## 构建

```bash
pnpm tauri build
```

窗口固定 **800×720**、无边框；历史存本机 `localStorage`（`version: 1` JSON）。

## 目录要点

- `src/views`：列表 / 编辑页
- `src/components`：壳、色板、预览
- `src/utils`：绘制与导出
- `src/services`：本机历史
- `design/` · `docs/`：设计与 PRD
