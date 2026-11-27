# dsh-plugin-agentdeck

Mobile remote control plugin for [DeepSeek Harness (`dsh`)](https://github.com/deepseek-ai/deepseek-harness), powered by [AgentDeck](https://agentdeck.xianqiao.wang).

Control DeepSeek Harness from your **iPhone or Android** over native ACP — end-to-end encrypted (`XChaCha20-Poly1305`), with push notifications, file & diff viewing, terminal output, and zero tunnel/VPN setup.

## What It Does

Adds an **AgentDeck** tab inside DeepSeek Harness **Settings** (`web` and `desktop`, English & 中文) that handles the entire setup in **one click**:

1. **Interactive ACP Adapter**: Installs `@openma/deepseek-harness-acp` into your `acp` profile if missing.
2. **Model & Provider Sync**: Mirrors model & provider settings into `~/.dsh/profiles/acp/cordis.patch.yml` (and sets `acp-plugin.config.provider` for non-DeepSeek providers like OpenRouter).
3. **AgentDeck Registration**: Adds `dsh` (`--profile acp`) to AgentDeck's `custom_agents.json` while keeping your other agents untouched.
4. **Daemon & Autostart**: Automatically installs `agentdeckd` (via Homebrew, npm, Scoop, or a self-contained fallback prefix) and runs `agentdeckd start` to register OS login autostart (`launchd` / `systemd --user` / Windows Task Scheduler).
5. **In-App Pairing QR Code**: Displays your live scannable pairing QR code right inside DSH Settings, plus Start / Restart / Stop controls.

## Install

### DeepSeek Harness Web / CLI

```bash
dsh plugin --profile web add dsh-plugin-agentdeck
dsh web
```

### DeepSeek Harness Desktop

Open **Settings → Plugins**, install `dsh-plugin-agentdeck`, then open **Settings → AgentDeck**.

## Pair Your Phone

1. Open **Settings → AgentDeck** in DeepSeek Harness and click **One-Click Setup & Start**.
2. Install [AgentDeck](https://agentdeck.xianqiao.wang) on your phone:
   - [App Store (iOS)](https://apps.apple.com/app/id6821905390)
   - [Google Play (Android)](https://play.google.com/store/apps/details?id=com.mantou.agentdeck)
   - [Android APK (GitHub Releases)](https://github.com/mantou132/AgentDeck/releases/latest)
3. Scan the QR code shown in **Settings → AgentDeck** and select **DeepSeek Harness** when creating a new session.

## Manual Setup (Optional)

If you prefer configuring without the plugin:

```bash
dsh plugin --profile acp add @openma/deepseek-harness-acp@latest
npm install -g agentdeckd   # or: brew install mantou132/tap/agentdeckd
agentdeckd start
```

Then add `dsh` to AgentDeck's `custom_agents.json` (`~/Library/Application Support/agentdeck/custom_agents.json` on macOS, `~/.local/share/agentdeck/custom_agents.json` on Linux, `%LOCALAPPDATA%\agentdeck\custom_agents.json` on Windows):

```json
{
  "agents": [
    {
      "id": "dsh",
      "name": "DeepSeek Harness",
      "command": "dsh",
      "args": ["--profile", "acp"]
    }
  ]
}
```

---

## 中文说明

[AgentDeck](https://agentdeck.xianqiao.wang/zh) 的 DeepSeek Harness (`dsh`) 手机远控插件，在 DSH 设置面板中新增 **AgentDeck 手机远控** 标签页，**一键完成全部配置并开启自启动**：

1. **自动安装 ACP 适配器**：为 `acp` profile 安装 `@openma/deepseek-harness-acp`。
2. **同步模型与服务商**：将当前界面的模型与服务商配置同步到 `~/.dsh/profiles/acp/cordis.patch.yml`（自动补齐 OpenRouter 等第三方服务商的 `acp-plugin.config.provider`）。
3. **注册自定义 Agent**：将 `dsh --profile acp` 写入 AgentDeck 的 `custom_agents.json`（保留你原有的其他 Agent）。
4. **自动安装并自启 `agentdeckd`**：未安装时自动通过 Homebrew / npm / Scoop 或本地目录安装 `agentdeckd`，并执行 `agentdeckd start` 注册开机自启（macOS LaunchAgent / Linux systemd / Windows 计划任务）。
5. **界面内直接扫码配对**：配置完成后直接展示实时配对二维码，并提供启动 / 重启 / 停止并取消自启按钮。

### 安装使用

```bash
dsh plugin --profile web add dsh-plugin-agentdeck
dsh web
```

打开 DSH 的 **设置 → AgentDeck 手机远控**，点击 **一键配置并启动**，用手机端 AgentDeck 扫描二维码即可开始远程控制：

- [App Store (iOS)](https://apps.apple.com/app/id6821905390)
- [Google Play (Android)](https://play.google.com/store/apps/details?id=com.mantou.agentdeck)
- [Android APK](https://github.com/mantou132/AgentDeck/releases/latest)
- [AgentDeck 官网](https://agentdeck.xianqiao.wang/zh)

## License

MIT
