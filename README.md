# API Monitor

**[English](#english) | [简体中文](#简体中文)**

---

## English

API Monitor is a lightweight Electron desktop widget for tracking API balances, usage windows, and credits. It supports built-in providers plus user-defined providers configured directly from the Settings window.

### Providers

| Provider | What it monitors |
| --- | --- |
| DeepSeek | Total, granted, and topped-up account balance in CNY |
| Codex (ChatGPT) | 5-hour and 7-day usage windows plus credit balance |
| Custom Provider | User-defined balance rows and dashboard links from JSON APIs |

### Highlights

- **Always-on-top desktop widget**: frameless floating window with tray support.
- **Multiple monitor entries**: switch entries from the logo dropdown, each with its own provider, API key/auth path, refresh interval, and display mode.
- **DeepSeek compact mode**: a smaller balance-only widget that still keeps refresh controls.
- **DeepSeek dashboard shortcut**: open the official usage dashboard from the widget.
- **Codex proxy-friendly requests**: provider HTTP requests prefer Electron's network stack so they can use system proxy/PAC settings.
- **Custom Providers**: configure providers in Settings with a base URL, cropped logo, balance blocks, dashboard blocks, and drag-and-drop ordering.
- **Saved custom widget layout**: custom provider widget size and UI template are generated when the provider is saved, then reused during refresh.
- **Auto-refresh**: per-entry refresh interval or global default.
- **Bilingual UI**: English and Simplified Chinese.
- **Auto-update**: packaged builds check GitHub Releases and preserve saved entries/settings.

### Install

Download the latest release from [GitHub Releases](https://github.com/qaqliu/API-Monitor/releases).

- Recommended installer: `API-Monitor-Setup-x.x.x.exe`
- Portable build: `API-Monitor-x.x.x.exe`

The installer supports auto-update through GitHub Releases. The portable build is useful for quick testing or running without installation.

### Build From Source

```bash
npm install
npm run build
```

Build output is written to `dist/` and includes both the NSIS installer and portable executable.

### Custom Provider Setup

1. Open **Settings > Custom Providers**.
2. Add a provider name, base URL, and optional logo.
3. Add monitor blocks:
   - **Balance**: display label, relative API path, and JSON path for the numeric value.
   - **Dashboard**: display label and external URL.
4. Save the provider.
5. Open **Settings > Monitoring**, add an entry, search/select the custom provider, and enter its API key.

Custom providers call `baseUrl + relativePath` with `Authorization: Bearer <API Key>` and extract numbers using simple JSON paths such as `balance_infos[0].total_balance`.

### Built-in Provider Development

For code-level built-in providers:

1. Create `src/services/providers/<name>.js`.
2. Export a provider object with `id`, `name`, `logo`, and `fetchBalance(...)`.
3. Register it in `src/services/providers/index.js`.
4. Add renderer UI only if the provider needs a layout different from DeepSeek, Codex, or Custom Provider views.

### Versioning

Official releases use `x.y.z` versions and tags named `vX.Y.Z`.

- `x`: architecture-level refactors
- `y`: new provider/model types
- `z`: existing provider changes, fixes, docs, and smaller maintenance updates

See [VERSIONING.md](VERSIONING.md).

### License

MIT

---

## 简体中文

API Monitor 是一个轻量级 Electron 桌面悬浮小组件，用于监控 API 余额、用量窗口和积分额度。它支持内置 Provider，也支持在设置页直接配置用户自定义 Provider。

### Provider

| Provider | 监控内容 |
| --- | --- |
| DeepSeek | 人民币总余额、赠送余额、充值余额 |
| Codex (ChatGPT) | 5 小时 / 7 天用量窗口，以及积分额度 |
| 自定义 Provider | 从 JSON API 中提取用户自定义余额行，并添加官网仪表盘链接 |

### 功能亮点

- **桌面置顶悬浮窗**：无边框小组件，支持托盘隐藏。
- **多监控条目**：通过 Logo 下拉列表切换条目，每个条目可独立配置 Provider、API Key/auth 路径、刷新间隔和显示模式。
- **DeepSeek 精简模式**：更窄的小组件，只显示总余额，同时保留刷新按钮和刷新时间。
- **DeepSeek 官网仪表盘入口**：可从小组件直接打开官方 usage 页面。
- **Codex 代理兼容**：Provider HTTP 请求优先走 Electron 网络栈，便于继承系统代理/PAC 设置。
- **自定义 Provider**：可在设置页配置 Base URL、裁剪 Logo、余额积木、官网仪表盘积木和拖拽排序。
- **自定义小组件布局缓存**：保存 Provider 时生成并保存小组件高度和 UI 模板，刷新时只更新数值。
- **自动刷新**：支持每个条目独立刷新间隔，也可使用全局默认值。
- **中英双语**：支持 English / 简体中文。
- **自动更新**：安装版从 GitHub Releases 检查更新，并保留已保存条目和设置。

### 安装

从 [GitHub Releases](https://github.com/qaqliu/API-Monitor/releases) 下载最新版本。

- 推荐安装包：`API-Monitor-Setup-x.x.x.exe`
- 便携版：`API-Monitor-x.x.x.exe`

安装版支持通过 GitHub Releases 自动更新。便携版适合临时测试或无需安装时直接运行。

### 从源码构建

```bash
npm install
npm run build
```

构建产物会输出到 `dist/`，包含 NSIS 安装包和便携版可执行文件。

### 自定义 Provider 配置

1. 打开 **设置 > 自定义提供商**。
2. 填写 Provider 名称、Base URL，并可选择/裁剪 Logo。
3. 添加监控积木：
   - **余额**：显示名称、相对 API 路径、数值所在 JSON 路径。
   - **官网仪表盘**：显示名称和外部 URL。
4. 保存 Provider。
5. 打开 **设置 > 监控**，新增条目，搜索并选择该自定义 Provider，然后填写 API Key。

自定义 Provider 会使用 `baseUrl + relativePath` 请求接口，并通过 `Authorization: Bearer <API Key>` 传入密钥。JSON 路径示例：`balance_infos[0].total_balance`。

### 内置 Provider 开发

如果需要在代码层新增内置 Provider：

1. 新建 `src/services/providers/<name>.js`。
2. 导出包含 `id`、`name`、`logo`、`fetchBalance(...)` 的 provider 对象。
3. 在 `src/services/providers/index.js` 中注册。
4. 如果显示布局不同于 DeepSeek、Codex 或自定义 Provider，再补充对应的 renderer UI。

### 版本规则

正式版本使用 `x.y.z`，tag 使用 `vX.Y.Z`。

- `x`：架构级重构
- `y`：新增 Provider / 模型类型
- `z`：已有 Provider 修改、修复、文档和较小维护更新

详见 [VERSIONING.md](VERSIONING.md)。

### 许可证

MIT
