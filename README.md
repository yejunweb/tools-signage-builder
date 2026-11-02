# 标牌生成器

桌面端标牌工具脚手架（本轮仅搭框架，不含业务生成逻辑）。

## 技术栈

- Tauri 2
- React + Vite + TypeScript
- antd（主题主色 `#3370ff`）
- Prettier（规则对齐 sc-datav-pc）

## 开发

```bash
# 需要 Node（建议 pnpm）+ Rust（rustup）
pnpm install
pnpm tauri dev
```

仅前端预览（无桌面壳）：

```bash
pnpm dev
```

格式化：

```bash
pnpm format
pnpm format:check
```

## 构建与产物

```bash
pnpm tauri build
```

| 平台    | 产物                           | 说明                                                                          |
| ------- | ------------------------------ | ----------------------------------------------------------------------------- |
| macOS   | `.dmg` / `.app`                | 本机（macOS）可直接 `pnpm tauri build` 产出                                   |
| Windows | `.exe` / 安装包（如 NSIS/MSI） | **需在 Windows 环境或 CI 上构建**；本机 macOS **不会**打出 Windows 可执行文件 |

> 跨平台打包请使用对应 OS 的构建机或 GitHub Actions 等 CI，不要假设在 Mac 上能直接产出 `.exe`。

## 目录要点

- `src/`：React 前端
- `src-tauri/`：Tauri / Rust 壳与打包配置
- `.prettierrc.json`：代码风格

## 范围说明

当前仅为可运行脚手架与基础规范；标牌生成业务需求未纳入本轮。
