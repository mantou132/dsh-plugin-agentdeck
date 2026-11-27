window.__ModuleLoader__.load({
  id: 'dsh-plugin-agentdeck',
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const React = require('react');
    const { useCallback, useEffect, useState } = React;
    const h = React.createElement;

    const NS = 'settings.agentdeck';
    const STYLE_TAG_ID = 'dsh-plugin-agentdeck/styles.css';

    const STORE_LINKS = {
      appStore: 'https://apps.apple.com/app/id6821905390',
      googlePlay:
        'https://play.google.com/store/apps/details?id=com.mantou.agentdeck',
      apk: 'https://github.com/mantou132/AgentDeck/releases/latest',
      websiteEn: 'https://agentdeck.xianqiao.wang',
      websiteZh: 'https://agentdeck.xianqiao.wang/zh',
      pluginRepo: 'https://github.com/mantou132/dsh-plugin-agentdeck',
    };

    const DICTIONARIES = {
      en: {
        nav: 'AgentDeck',
        title: 'AgentDeck Mobile Remote',
        subtitle:
          'Control DeepSeek Harness from your iPhone or Android via native ACP — end-to-end encrypted, with push notifications, file & terminal inspection.',
        setupTitle: '1. One-Click Setup & Autostart',
        setupDesc:
          'Installs the interactive ACP adapter, syncs model & provider config, registers dsh in AgentDeck, installs agentdeckd, and enables login autostart.',
        itemAcp: 'Interactive ACP Adapter',
        itemModels: 'ACP Model & Provider',
        itemCustomAgents: 'AgentDeck custom_agents.json',
        itemDaemon: 'agentdeckd Daemon & Autostart',
        statusReady: 'Ready',
        statusMissing: 'Not configured',
        statusNeedsFix: 'Needs sync',
        statusNotInstalled: 'Not installed',
        statusStopped: 'Stopped',
        acpNotInstalledHint:
          'Will install @openma/deepseek-harness-acp into the acp profile.',
        modelNone: 'Using DSH default model',
        modelAcpLabel: 'acp profile:',
        modelSourceLabel: 'Current profile:',
        modelPinWarning:
          'Non-DeepSeek provider needs acp-plugin provider pin — click Setup to fix.',
        daemonNotInstalledHint:
          'Will install agentdeckd and register OS autostart automatically.',
        daemonStoppedHint:
          'Installed, but not running. Click Setup or Start to launch and enable autostart.',
        syncModelsToggle: 'Sync model & provider from current profile',
        dshNotFound:
          'Could not locate the `dsh` binary. Install dsh CLI or add it to PATH.',
        btnSetup: 'One-Click Setup & Start',
        btnResync: 'Re-sync & Repair',
        btnSettingUp: 'Installing & configuring…',
        btnRefresh: 'Refresh',
        btnDaemonStart: 'Start & Enable Autostart',
        btnDaemonRestart: 'Restart',
        btnDaemonStop: 'Stop & Disable Autostart',
        btnWorking: 'Working…',
        setupSuccess:
          'All set! Open AgentDeck on your phone and scan the QR code below.',
        pairTitle: '2. Pair with AgentDeck App',
        daemonRunning: 'Running',
        daemonStopped: 'Stopped',
        daemonMissing: 'Not installed',
        daemonStartHint:
          'Pairing ID is ready, but agentdeckd is stopped. Click Start to bring your host online and re-enable autostart.',
        daemonAutoHint:
          'Click "One-Click Setup & Start" above to automatically install agentdeckd, enable autostart, and generate your pairing QR code.',
        qrHint:
          'Open AgentDeck on your phone and scan this QR code to pair. Keep this code private — it grants full access to your host.',
        pairingIdLabel: 'Pairing ID',
        customRelayLabel: 'Custom Relay',
        downloadTitle: 'Get AgentDeck',
        linkAppStore: 'App Store (iOS)',
        linkGooglePlay: 'Google Play',
        linkApk: 'Android APK',
        linkWebsite: 'Website',
        loading: 'Checking local environment…',
        loadError: 'Operation failed',
        stepInstalled: 'Installed',
        stepSkipped: 'Already ready',
        stepUpdated: 'Updated',
        stepUnchanged: 'No changes needed',
        stepStarted: 'Started with autostart',
        isZh: '0',
      },
      zh: {
        nav: 'AgentDeck 手机远控',
        title: 'AgentDeck 手机远控',
        subtitle:
          '通过原生 ACP 协议在 iPhone / Android 手机上远程控制 DeepSeek Harness：端到端加密、推送通知、浏览文件与终端。',
        setupTitle: '1. 一键配置并开启自启动',
        setupDesc:
          '自动完成：安装交互式 ACP 适配器、同步模型与服务商配置、写入 custom_agents.json、安装 agentdeckd 并注册开机自启动。',
        itemAcp: '交互式 ACP 适配器',
        itemModels: 'ACP 模型与服务商',
        itemCustomAgents: 'AgentDeck custom_agents.json',
        itemDaemon: 'agentdeckd 守护服务与自启',
        statusReady: '已就绪',
        statusMissing: '未配置',
        statusNeedsFix: '待修复',
        statusNotInstalled: '未安装',
        statusStopped: '未运行',
        acpNotInstalledHint:
          '点击一键配置将自动为 acp profile 安装 @openma/deepseek-harness-acp。',
        modelNone: '使用 DSH 默认模型',
        modelAcpLabel: 'acp 配置：',
        modelSourceLabel: '当前界面：',
        modelPinWarning:
          '第三方服务商需要同步 acp-plugin 的 provider 配置，点击一键配置即可自动修复。',
        daemonNotInstalledHint:
          '点击一键配置将自动安装 agentdeckd 并注册系统开机自启。',
        daemonStoppedHint:
          '已安装但未运行，点击一键配置或下方「启动并开启自启」即可上线。',
        syncModelsToggle: '将当前界面的模型与服务商配置同步到 acp profile',
        dshNotFound:
          '未检测到 `dsh` 可执行文件，请先安装 DeepSeek Harness CLI 或加入 PATH。',
        btnSetup: '一键配置并启动',
        btnResync: '重新同步 / 修复',
        btnSettingUp: '正在安装与配置…',
        btnRefresh: '刷新状态',
        btnDaemonStart: '启动并开启自启',
        btnDaemonRestart: '重启',
        btnDaemonStop: '停止并取消自启',
        btnWorking: '处理中…',
        setupSuccess: '全部配置并启动完成！打开手机上的 AgentDeck 扫描下方二维码即可连接。',
        pairTitle: '2. 手机扫码配对',
        daemonRunning: '运行中',
        daemonStopped: '已停止',
        daemonMissing: '未安装',
        daemonStartHint:
          '已生成配对信息，但 agentdeckd 当前未运行。点击「启动并开启自启」即可上线。',
        daemonAutoHint:
          '点击上方「一键配置并启动」，插件会自动安装 agentdeckd、设置开机自启，并在此生成配对二维码。',
        qrHint:
          '打开手机上的 AgentDeck App 扫描此二维码即可配对。请勿泄露二维码——它代表本机远程访问权限。',
        pairingIdLabel: '配对 ID',
        customRelayLabel: '自定义 Relay',
        downloadTitle: '获取 AgentDeck',
        linkAppStore: 'App Store (iOS)',
        linkGooglePlay: 'Google Play',
        linkApk: 'Android APK',
        linkWebsite: '官网',
        loading: '正在检测本机环境…',
        loadError: '操作失败',
        stepInstalled: '已安装',
        stepSkipped: '已就绪',
        stepUpdated: '已更新',
        stepUnchanged: '无需变更',
        stepStarted: '已启动并开启自启',
        isZh: '1',
      },
    };

    const CSS_TEXT = `
.adk-root {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 24px;
  color: var(--dsw-alias-label-primary, #111827);
  font-size: 13px;
  line-height: 1.5;
}
.adk-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.adk-title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #111827);
}
.adk-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--dsw-alias-label-secondary, #4b5563);
}
.adk-card {
  border-radius: var(--dsw-radius-xl, 14px);
  background: var(--dsw-alias-settings-card-fill, rgba(127, 127, 127, 0.06));
  border: 1px solid var(--dsw-alias-settings-card-stroke, rgba(127, 127, 127, 0.16));
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.adk-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.adk-card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #111827);
}
.adk-card-desc {
  margin: 0;
  font-size: 12.5px;
  color: var(--dsw-alias-label-tertiary, #6b7280);
}
.adk-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.15));
}
.adk-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.15));
}
.adk-row:last-child {
  border-bottom: none;
  padding-bottom: 2px;
}
.adk-row-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.adk-row-label {
  font-weight: 500;
  color: var(--dsw-alias-label-primary, #111827);
}
.adk-row-detail {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #6b7280);
  word-break: break-all;
}
.adk-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}
.adk-badge-ok {
  background: rgba(16, 185, 129, 0.14);
  color: #10b981;
}
.adk-badge-warn {
  background: rgba(245, 158, 11, 0.16);
  color: #d97706;
}
.adk-badge-muted {
  background: rgba(127, 127, 127, 0.14);
  color: var(--dsw-alias-label-secondary, #6b7280);
}
.adk-checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--dsw-alias-label-secondary, #4b5563);
  cursor: pointer;
  user-select: none;
}
.adk-checkbox-row input {
  margin: 0;
  cursor: pointer;
}
.adk-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.adk-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: var(--dsw-radius-md, 8px);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}
.adk-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.adk-btn-primary {
  background: var(--dsw-alias-button-primary-fill, #2563eb);
  color: var(--dsw-alias-label-primary-foreground, #ffffff);
}
.adk-btn-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, #1d4ed8);
}
.adk-btn-secondary {
  background: transparent;
  border-color: var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.25));
  color: var(--dsw-alias-label-primary, #111827);
}
.adk-btn-secondary:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.1));
}
.adk-btn-sm {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
}
.adk-banner {
  border-radius: var(--dsw-radius-md, 8px);
  padding: 10px 12px;
  font-size: 12.5px;
  line-height: 1.5;
}
.adk-banner-ok {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--dsw-alias-label-primary, #065f46);
}
.adk-banner-err {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.32);
  color: #ef4444;
}
.adk-steps {
  margin: 6px 0 0;
  padding-left: 16px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #4b5563);
}
.adk-qr-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.adk-qr-frame {
  width: 168px;
  height: 168px;
  padding: 8px;
  box-sizing: border-box;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.adk-qr-frame img {
  width: 100%;
  height: 100%;
  display: block;
}
.adk-qr-info {
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.adk-meta-line {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #6b7280);
}
.adk-meta-line code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--dsw-alias-label-primary, #111827);
  background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.1));
  padding: 1px 5px;
  border-radius: 4px;
}
.adk-links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.15));
}
.adk-links-label {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #6b7280);
  margin-right: 4px;
}
.adk-link {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: var(--dsw-radius-md, 8px);
  border: 1px solid var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.24));
  color: var(--dsw-alias-label-primary, #111827);
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
}
.adk-link:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.1));
}
`;

    function injectStyles() {
      if (typeof document === 'undefined') return;
      if (
        document.querySelector(
          `style[data-plugin-css=${JSON.stringify(STYLE_TAG_ID)}]`,
        ) !== null
      ) {
        return;
      }
      const tag = document.createElement('style');
      tag.dataset.plugin = 'dsh-plugin-agentdeck';
      tag.dataset.pluginCss = STYLE_TAG_ID;
      tag.textContent = CSS_TEXT;
      document.head.appendChild(tag);
    }

    function PhoneIcon(props) {
      const size = props?.size ?? 16;
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
        },
        h('rect', { x: 6, y: 2.5, width: 12, height: 19, rx: 2.5 }),
        h('path', { d: 'M10 9.5L12.5 12L10 14.5' }),
        h('path', { d: 'M13.5 14.5H15' }),
        h('circle', { cx: 12, cy: 18, r: 0.7, fill: 'currentColor' }),
      );
    }

    function formatModel(entry) {
      if (!entry || (!entry.provider && !entry.model)) return null;
      return [entry.provider, entry.model].filter(Boolean).join(' / ');
    }

    function AgentDeckSettingsSection(props) {
      const t = props.t || ((k) => DICTIONARIES.en[k] || k);
      const isZh = t('isZh') === '1';

      const [status, setStatus] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      const [busy, setBusy] = useState(false);
      const [daemonBusy, setDaemonBusy] = useState(false);
      const [syncModels, setSyncModels] = useState(false);
      const [setupFeedback, setSetupFeedback] = useState(null);

      const loadStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch('/api/agentdeck/status', {
            cache: 'no-store',
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data?.error || `HTTP ${res.status}`);
          }
          setStatus(data);
          setSyncModels((prev) =>
            prev ? true : !data?.models?.acp?.defaultModel,
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setLoading(false);
        }
      }, []);

      useEffect(() => {
        loadStatus();
      }, [loadStatus]);

      const onSetup = useCallback(async () => {
        setBusy(true);
        setError(null);
        setSetupFeedback(null);
        try {
          const res = await fetch('/api/agentdeck/setup', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ syncModels }),
          });
          const data = await res.json();
          if (!res.ok || !data?.ok) {
            throw new Error(data?.error || `HTTP ${res.status}`);
          }
          if (data.status) setStatus(data.status);
          setSetupFeedback({ steps: data.steps || [] });
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setBusy(false);
        }
      }, [syncModels]);

      const onDaemonAction = useCallback(async (action) => {
        setDaemonBusy(true);
        setError(null);
        try {
          const res = await fetch('/api/agentdeck/daemon', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action }),
          });
          const data = await res.json();
          if (!res.ok || !data?.ok) {
            throw new Error(data?.error || `HTTP ${res.status}`);
          }
          if (data.status) setStatus(data.status);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setDaemonBusy(false);
        }
      }, []);

      const stepStatusLabel = (s) => {
        if (s === 'installed') return t('stepInstalled');
        if (s === 'skipped') return t('stepSkipped');
        if (s === 'updated') return t('stepUpdated');
        if (s === 'started') return t('stepStarted');
        return t('stepUnchanged');
      };

      const acpModelText = formatModel(status?.models?.acp?.defaultModel);
      const sourceModelText = formatModel(status?.models?.source?.defaultModel);
      const qrDataUrl = status?.daemon?.qrSvg
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(status.daemon.qrSvg)}`
        : null;
      const anyBusy = busy || daemonBusy;

      return h(
        'div',
        { className: 'adk-root' },
        h(
          'div',
          { className: 'adk-hero' },
          h(
            'div',
            null,
            h('h2', { className: 'adk-title' }, t('title')),
            h('p', { className: 'adk-subtitle' }, t('subtitle')),
          ),
        ),

        loading && !status
          ? h('div', { className: 'adk-card' }, t('loading'))
          : null,

        error
          ? h(
              'div',
              { className: 'adk-banner adk-banner-err' },
              `${t('loadError')}: ${error}`,
            )
          : null,

        status
          ? h(
              React.Fragment,
              null,
              // Card 1: One-click setup + autostart
              h(
                'section',
                { className: 'adk-card' },
                h(
                  'div',
                  { className: 'adk-card-head' },
                  h('h3', { className: 'adk-card-title' }, t('setupTitle')),
                  h(
                    'span',
                    {
                      className: `adk-badge ${status.ready ? 'adk-badge-ok' : 'adk-badge-warn'}`,
                    },
                    status.ready ? t('statusReady') : t('statusMissing'),
                  ),
                ),
                h('p', { className: 'adk-card-desc' }, t('setupDesc')),
                h(
                  'div',
                  { className: 'adk-list' },
                  // Row 1: ACP adapter
                  h(
                    'div',
                    { className: 'adk-row' },
                    h(
                      'div',
                      { className: 'adk-row-main' },
                      h('span', { className: 'adk-row-label' }, t('itemAcp')),
                      h(
                        'span',
                        { className: 'adk-row-detail' },
                        status.acpPlugin?.installed
                          ? `${status.acpPlugin.packageName}@${status.acpPlugin.version}`
                          : t('acpNotInstalledHint'),
                      ),
                    ),
                    h(
                      'span',
                      {
                        className: `adk-badge ${status.acpPlugin?.installed ? 'adk-badge-ok' : 'adk-badge-warn'}`,
                      },
                      status.acpPlugin?.installed
                        ? t('statusReady')
                        : t('statusNotInstalled'),
                    ),
                  ),
                  // Row 2: Model & provider
                  h(
                    'div',
                    { className: 'adk-row' },
                    h(
                      'div',
                      { className: 'adk-row-main' },
                      h('span', { className: 'adk-row-label' }, t('itemModels')),
                      h(
                        'span',
                        { className: 'adk-row-detail' },
                        `${t('modelAcpLabel')} ${acpModelText || t('modelNone')}`,
                      ),
                      sourceModelText
                        ? h(
                            'span',
                            { className: 'adk-row-detail' },
                            `${t('modelSourceLabel')} ${sourceModelText}`,
                          )
                        : null,
                      status.models?.acpNeedsProviderPin
                        ? h(
                            'span',
                            {
                              className: 'adk-row-detail',
                              style: { color: '#d97706' },
                            },
                            t('modelPinWarning'),
                          )
                        : null,
                    ),
                    h(
                      'span',
                      {
                        className: `adk-badge ${status.models?.acpNeedsProviderPin ? 'adk-badge-warn' : 'adk-badge-ok'}`,
                      },
                      status.models?.acpNeedsProviderPin
                        ? t('statusNeedsFix')
                        : t('statusReady'),
                    ),
                  ),
                  // Row 3: custom_agents.json
                  h(
                    'div',
                    { className: 'adk-row' },
                    h(
                      'div',
                      { className: 'adk-row-main' },
                      h(
                        'span',
                        { className: 'adk-row-label' },
                        t('itemCustomAgents'),
                      ),
                      h(
                        'span',
                        { className: 'adk-row-detail' },
                        status.customAgent?.configured
                          ? `${status.customAgent.entry.command} ${(status.customAgent.entry.args || []).join(' ')}`
                          : status.dshCommand || t('dshNotFound'),
                      ),
                    ),
                    h(
                      'span',
                      {
                        className: `adk-badge ${status.customAgent?.configured ? 'adk-badge-ok' : 'adk-badge-warn'}`,
                      },
                      status.customAgent?.configured
                        ? t('statusReady')
                        : t('statusMissing'),
                    ),
                  ),
                  // Row 4: agentdeckd daemon & autostart
                  h(
                    'div',
                    { className: 'adk-row' },
                    h(
                      'div',
                      { className: 'adk-row-main' },
                      h('span', { className: 'adk-row-label' }, t('itemDaemon')),
                      h(
                        'span',
                        { className: 'adk-row-detail' },
                        status.daemon?.running
                          ? `${status.daemon.binaryPath || 'agentdeckd'} (PID ${status.daemon.pid})`
                          : status.daemon?.installed
                            ? t('daemonStoppedHint')
                            : t('daemonNotInstalledHint'),
                      ),
                    ),
                    h(
                      'span',
                      {
                        className: `adk-badge ${status.daemon?.running ? 'adk-badge-ok' : status.daemon?.installed ? 'adk-badge-warn' : 'adk-badge-muted'}`,
                      },
                      status.daemon?.running
                        ? t('daemonRunning')
                        : status.daemon?.installed
                          ? t('statusStopped')
                          : t('statusNotInstalled'),
                    ),
                  ),
                ),

                sourceModelText
                  ? h(
                      'label',
                      { className: 'adk-checkbox-row' },
                      h('input', {
                        type: 'checkbox',
                        checked: syncModels,
                        disabled: anyBusy,
                        onChange: (e) => setSyncModels(e.target.checked),
                      }),
                      h(
                        'span',
                        null,
                        `${t('syncModelsToggle')} (${sourceModelText})`,
                      ),
                    )
                  : null,

                h(
                  'div',
                  { className: 'adk-actions' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'adk-btn adk-btn-primary',
                      disabled: anyBusy || !status.dshCommand,
                      onClick: onSetup,
                    },
                    busy
                      ? t('btnSettingUp')
                      : status.ready
                        ? t('btnResync')
                        : t('btnSetup'),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'adk-btn adk-btn-secondary',
                      disabled: anyBusy || loading,
                      onClick: loadStatus,
                    },
                    t('btnRefresh'),
                  ),
                ),

                setupFeedback
                  ? h(
                      'div',
                      { className: 'adk-banner adk-banner-ok' },
                      h('div', null, t('setupSuccess')),
                      setupFeedback.steps?.length
                        ? h(
                            'ul',
                            { className: 'adk-steps' },
                            ...setupFeedback.steps.map((step) =>
                              h(
                                'li',
                                { key: step.id },
                                `${step.id}: ${stepStatusLabel(step.status)}${step.detail ? ` (${step.detail})` : ''}`,
                              ),
                            ),
                          )
                        : null,
                    )
                  : null,
              ),

              // Card 2: Pairing QR & daemon controls
              h(
                'section',
                { className: 'adk-card' },
                h(
                  'div',
                  { className: 'adk-card-head' },
                  h('h3', { className: 'adk-card-title' }, t('pairTitle')),
                  h(
                    'span',
                    {
                      className: `adk-badge ${status.daemon?.running ? 'adk-badge-ok' : status.daemon?.installed ? 'adk-badge-warn' : 'adk-badge-muted'}`,
                    },
                    status.daemon?.running
                      ? `${t('daemonRunning')} (PID ${status.daemon.pid})`
                      : status.daemon?.installed
                        ? t('daemonStopped')
                        : t('daemonMissing'),
                  ),
                ),

                qrDataUrl
                  ? h(
                      'div',
                      { className: 'adk-qr-layout' },
                      h(
                        'div',
                        { className: 'adk-qr-frame' },
                        h('img', {
                          src: qrDataUrl,
                          alt: 'AgentDeck pairing QR code',
                        }),
                      ),
                      h(
                        'div',
                        { className: 'adk-qr-info' },
                        h('p', { className: 'adk-card-desc' }, t('qrHint')),
                        h(
                          'div',
                          { className: 'adk-meta-line' },
                          `${t('pairingIdLabel')}: `,
                          h('code', null, status.daemon.maskedPairingId),
                        ),
                        status.daemon.hasCustomRelay
                          ? h(
                              'div',
                              { className: 'adk-meta-line' },
                              `${t('customRelayLabel')}: `,
                              h('code', null, status.daemon.relayUrl),
                            )
                          : null,
                        !status.daemon.running
                          ? h(
                              'p',
                              { className: 'adk-card-desc' },
                              t('daemonStartHint'),
                            )
                          : null,
                        h(
                          'div',
                          { className: 'adk-actions' },
                          !status.daemon.running
                            ? h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'adk-btn adk-btn-primary adk-btn-sm',
                                  disabled: anyBusy,
                                  onClick: () => onDaemonAction('start'),
                                },
                                daemonBusy
                                  ? t('btnWorking')
                                  : t('btnDaemonStart'),
                              )
                            : status.daemon.binaryPath
                              ? h(
                                  React.Fragment,
                                  null,
                                  h(
                                    'button',
                                    {
                                      type: 'button',
                                      className:
                                        'adk-btn adk-btn-secondary adk-btn-sm',
                                      disabled: anyBusy,
                                      onClick: () => onDaemonAction('restart'),
                                    },
                                    daemonBusy
                                      ? t('btnWorking')
                                      : t('btnDaemonRestart'),
                                  ),
                                  h(
                                    'button',
                                    {
                                      type: 'button',
                                      className:
                                        'adk-btn adk-btn-secondary adk-btn-sm',
                                      disabled: anyBusy,
                                      onClick: () => onDaemonAction('stop'),
                                    },
                                    t('btnDaemonStop'),
                                  ),
                                )
                              : null,
                        ),
                      ),
                    )
                  : h('p', { className: 'adk-card-desc' }, t('daemonAutoHint')),

                h(
                  'div',
                  { className: 'adk-links' },
                  h(
                    'span',
                    { className: 'adk-links-label' },
                    t('downloadTitle'),
                  ),
                  h(
                    'a',
                    {
                      className: 'adk-link',
                      href: STORE_LINKS.appStore,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    },
                    t('linkAppStore'),
                  ),
                  h(
                    'a',
                    {
                      className: 'adk-link',
                      href: STORE_LINKS.googlePlay,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    },
                    t('linkGooglePlay'),
                  ),
                  h(
                    'a',
                    {
                      className: 'adk-link',
                      href: STORE_LINKS.apk,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    },
                    t('linkApk'),
                  ),
                  h(
                    'a',
                    {
                      className: 'adk-link',
                      href: isZh ? STORE_LINKS.websiteZh : STORE_LINKS.websiteEn,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    },
                    t('linkWebsite'),
                  ),
                ),
              ),
            )
          : null,
      );
    }

    function apply(ctx) {
      injectStyles();
      const t = ctx.locale.bind(NS);
      ctx.effect(
        () => ctx.locale.register(NS, DICTIONARIES),
        'agentdeck: dictionaries',
      );
      ctx.effect(
        () =>
          ctx.slots.inject('settings.section.icon', () =>
            ctx.slots.register(
              {
                name: 'settings.section.icon',
                id: 'agentdeck',
                locale: NS,
              },
              PhoneIcon,
            ),
          ),
        'agentdeck: settings section icon',
      );
      ctx.effect(
        () =>
          ctx.slots.inject('settings.section', () =>
            ctx.slots.register(
              {
                name: 'settings.section',
                id: 'agentdeck',
                order: 65,
                label: () => t('nav'),
                locale: NS,
              },
              AgentDeckSettingsSection,
            ),
          ),
        'agentdeck: settings section',
      );
    }

    exports.name = 'agentdeck-settings';
    exports.inject = ['slots', 'locale'];
    exports.apply = apply;
    return module.exports;
  },
});
