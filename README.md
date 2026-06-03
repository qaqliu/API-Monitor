# API Monitor

**[English](#english) | [简体中文](#简体中文)**

---

## English

A lightweight desktop widget for tracking API usage and quotas. Extensible provider architecture — add any API that exposes usage/balance data.

### Current Providers

| Provider | Monitors |
|----------|----------|
| DeepSeek | Account balance (total, granted, topped-up in CNY) |
| Codex (ChatGPT) | Rate limit usage (5h / 7d windows) + credit balance |

### Features

- **Desktop widget** — always-on-top, frameless window sits in the corner of your screen
- **System tray** — minimize to tray with at-a-glance usage tooltip
- **Multi-provider** — switch between entries via dropdown, each with its own API configuration
- **Auto-refresh** — configurable intervals (1–60 min per entry or global default)
- **Extensible** — add a new provider in 3 steps: create a `fetchBalance()` module, register it, wire up the UI
- **Bilingual** — English / 简体中文, switchable in settings
- **Portable** — single `.exe`, no installation required (NSIS installer also available)
- **Auto-update** — checks for new releases on startup (when published via GitHub Releases)

### Install

Download the latest `API Monitor x.x.x.exe` from [Releases]() and run it. No install needed.

Or use the NSIS installer (`API Monitor Setup x.x.x.exe`) for Start Menu shortcuts and uninstall support.

### Build from source

```bash
npm install
npm run build
```

Output goes to `dist/` — both a portable `.exe` and an NSIS installer.

### Adding a provider

1. Create `src/services/providers/<name>.js` exporting:
   - `id` — unique string identifier
   - `name` — display name
   - `logo` — SVG string for the UI
   - `fetchBalance(apiKey)` — async function returning provider-specific data

2. Register it in `src/services/providers/index.js`:
   ```js
   register(require('./<name>'));
   ```

3. Add UI wiring:
   - `src/renderer/settings/settings.html` — add an `<option value="<id>">` to the provider dropdown
   - `src/renderer/settings/settings.js` — add the logo to `PROVIDER_LOGOS`
   - `src/renderer/widget/widget.js` — add the logo and UI rendering logic for display
   - Optionally add provider-specific CSS / HTML if the display layout differs from existing views

### License

MIT

---

## 简体中文

轻量级桌面悬浮组件，用于追踪各类 API 用量与配额。可扩展的 Provider 架构 —— 任何能返回用量/余额数据的 API 均可接入。

### 内置 Provider

| Provider | 监控内容 |
|----------|----------|
| DeepSeek | 账户余额（总余额、赠送余额、充值余额，人民币） |
| Codex (ChatGPT) | 速率限额用量（5 小时 / 7 天窗口）+ 积分额度 |

### 功能特性

- **桌面悬浮窗** — 置顶无边框窗口，常驻屏幕角落
- **系统托盘** — 最小化到托盘，悬停显示用量摘要
- **多条目切换** — 下拉菜单切换不同条目，每个条目独立配置
- **自动刷新** — 可配置刷新间隔（每条目 1–60 分钟，或使用全局默认值）
- **易于扩展** — 新增一个 Provider 只需三步：写 `fetchBalance()` 模块、注册、接入 UI
- **中英双语** — 设置中可切换 English / 简体中文
- **便携版** — 单个 `.exe` 文件，无需安装（同时提供 NSIS 安装程序）
- **自动更新** — 启动时检查新版本（需配置 GitHub Releases 发布）

### 安装

从 [Releases]() 下载最新 `API Monitor x.x.x.exe`，直接运行即可，无需安装。

也可使用 NSIS 安装程序（`API Monitor Setup x.x.x.exe`），获得开始菜单快捷方式和卸载支持。

### 从源码构建

```bash
npm install
npm run build
```

产物在 `dist/` 目录 —— 包含便携版 `.exe` 和 NSIS 安装程序。

### 新增 Provider

1. 创建 `src/services/providers/<name>.js`，导出：
   - `id` — 唯一标识字符串
   - `name` — 显示名称
   - `logo` — SVG 字符串，用于界面显示
   - `fetchBalance(apiKey)` — 异步函数，返回 provider 自定义的数据结构

2. 在 `src/services/providers/index.js` 中注册：
   ```js
   register(require('./<name>'));
   ```

3. 接入 UI：
   - `src/renderer/settings/settings.html` — 在 provider 下拉菜单中添加 `<option value="<id>">`
   - `src/renderer/settings/settings.js` — 在 `PROVIDER_LOGOS` 中添加 logo
   - `src/renderer/widget/widget.js` — 添加 logo 和显示逻辑
   - 如果显示布局与已有视图差异较大，可额外添加对应的 CSS / HTML

### 许可证

MIT
