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
    };

    const DICTIONARIES = {
      en: {
        nav: 'AgentDeck',
        title: 'AgentDeck Mobile Remote',
        subtitle:
          'Scan with AgentDeck on iPhone or Android to control DeepSeek Harness remotely — end-to-end encrypted.',
        provisioning: 'Setting up remote control & starting agentdeckd…',
        provisioningHint:
          'First-time setup installs the ACP adapter and local daemon automatically. Your QR code will appear here in a few seconds.',
        errorTitle: 'Automatic setup failed',
        btnRetry: 'Retry Setup',
        qrHint:
          'Open AgentDeck on your phone and scan this QR code to pair. Keep it private — it grants full access to this machine.',
        pairingIdLabel: 'Pairing ID',
        customRelayLabel: 'Relay',
        stoppedBanner:
          'Remote service is currently stopped. Start it below to connect from your phone.',
        serviceTitle: 'Remote Service & Autostart',
        serviceDescRunning: 'Running in background and starts on login.',
        serviceDescStopped: 'Stopped — mobile devices cannot connect.',
        statusRunning: 'Running',
        statusStopped: 'Stopped',
        btnStart: 'Start',
        btnStop: 'Stop',
        btnRestart: 'Restart',
        btnUpdate: 'Update',
        btnUpdating: 'Updating…',
        btnWorking: 'Working…',
        updateAvailable: 'Update available:',
        awakeTitle: 'Prevent Automatic Sleep',
        awakeActive: 'Active',
        awakeInactive: 'Inactive',
        awakeNever: 'Off',
        awakePlugged: 'On Power',
        awakeActiveMode: 'Active 1h',
        awakeAlways: 'Always',
        awakeHintNever: 'Let the OS sleep normally.',
        awakeHintPlugged: 'Stay awake while plugged into external power.',
        awakeHintActive: 'Stay awake for 1 hour after the last mobile interaction.',
        awakeHintAlways: 'Always stay awake while the remote service runs.',
        modelTitle: 'Mobile Default Model',
        modelDefault: 'DeepSeek Harness default',
        btnSyncModel: 'Sync current',
        downloadTitle: 'Get AgentDeck',
        linkAppStore: 'App Store',
        linkGooglePlay: 'Google Play',
        linkApk: 'Android APK',
        linkWebsite: 'Website',
        appStoreNote:
          'iOS App Store version is not available in Mainland China (requires a non-China Apple ID).',
        loading: 'Loading…',
        isZh: '0',
      },
      zh: {
        nav: 'AgentDeck 手机远控',
        title: 'AgentDeck 手机远控',
        subtitle:
          '打开手机上的 AgentDeck 扫码即可远程控制 DeepSeek Harness，端到端加密。',
        provisioning: '正在自动配置远程控制并启动服务…',
        provisioningHint:
          '首次安装会自动准备 ACP 适配器与本地守护服务并注册开机自启，完成后二维码会自动出现。',
        errorTitle: '自动初始化失败',
        btnRetry: '重试',
        qrHint:
          '打开手机上的 AgentDeck App 扫描此二维码即可配对。请勿泄露二维码——它代表本机远程访问权限。',
        pairingIdLabel: '配对 ID',
        customRelayLabel: 'Relay',
        stoppedBanner: '远程服务当前已停止，开启下方服务开关后手机即可连接。',
        serviceTitle: '远程服务与开机自启',
        serviceDescRunning: '已在后台运行并开启登录自启。',
        serviceDescStopped: '已停止，手机端暂时无法连接。',
        statusRunning: '运行中',
        statusStopped: '已停止',
        btnStart: '开启',
        btnStop: '停止',
        btnRestart: '重启',
        btnUpdate: '更新',
        btnUpdating: '更新中…',
        btnWorking: '处理中…',
        updateAvailable: '有新版本：',
        awakeTitle: '防自动休眠',
        awakeActive: '生效中',
        awakeInactive: '未激活',
        awakeNever: '关闭',
        awakePlugged: '插电常亮',
        awakeActiveMode: '活跃 1 小时',
        awakeAlways: '始终常亮',
        awakeHintNever: '跟随系统默认休眠策略。',
        awakeHintPlugged: '接通外接电源时防止电脑自动休眠。',
        awakeHintActive: '最近 1 小时有手机远控交互时保持唤醒。',
        awakeHintAlways: '远程服务运行期间始终防止自动休眠。',
        modelTitle: '手机端默认模型',
        modelDefault: '使用 DSH 默认模型',
        btnSyncModel: '同步当前模型',
        downloadTitle: '下载 AgentDeck',
        linkAppStore: 'App Store',
        linkGooglePlay: 'Google Play',
        linkApk: 'Android APK',
        linkWebsite: '官网',
        appStoreNote:
          '注：iOS 端暂未上架中国大陆区 App Store，需使用非国区 Apple ID 下载。',
        loading: '加载中…',
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
  gap: 14px;
}
.adk-desc {
  margin: 0;
  font-size: 12.5px;
  color: var(--dsw-alias-label-tertiary, #6b7280);
}
.adk-text-err {
  color: #ef4444;
}
.adk-qr-layout {
  display: flex;
  gap: 16px;
  align-items: center;
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
  min-width: 210px;
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
.adk-provisioning {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 0;
}
.adk-provisioning-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 500;
}
.adk-spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.3));
  border-top-color: var(--dsw-alias-button-primary-fill, #2563eb);
  animation: adk-spin 0.8s linear infinite;
  flex-shrink: 0;
}
@keyframes adk-spin {
  to { transform: rotate(360deg); }
}
.adk-banner {
  border-radius: var(--dsw-radius-md, 8px);
  padding: 10px 12px;
  font-size: 12.5px;
  line-height: 1.5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.adk-banner-err {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.32);
  color: #ef4444;
}
.adk-banner-warn {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #d97706;
}
.adk-rows {
  display: flex;
  flex-direction: column;
}
.adk-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.15));
  flex-wrap: wrap;
}
.adk-row:first-child {
  padding-top: 2px;
}
.adk-row:last-child {
  border-bottom: none;
  padding-bottom: 2px;
}
.adk-row-col {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}
.adk-row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.adk-row-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.adk-row-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary, #111827);
}
.adk-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  white-space: nowrap;
}
.adk-badge-ok {
  background: rgba(16, 185, 129, 0.14);
  color: #10b981;
}
.adk-badge-muted {
  background: rgba(127, 127, 127, 0.14);
  color: var(--dsw-alias-label-secondary, #6b7280);
}
.adk-version {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11.5px;
  font-weight: 400;
  color: var(--dsw-alias-label-tertiary, #6b7280);
}
.adk-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.adk-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  border-radius: var(--dsw-radius-md, 8px);
  font-size: 12px;
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
.adk-seg {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
}
.adk-seg-btn {
  height: 28px;
  padding: 0 10px;
  border-radius: var(--dsw-radius-md, 8px);
  border: 1px solid var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.25));
  background: transparent;
  color: var(--dsw-alias-label-secondary, #4b5563);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.adk-seg-btn:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.1));
}
.adk-seg-btn-active {
  background: var(--dsw-alias-button-primary-fill, #2563eb);
  border-color: var(--dsw-alias-button-primary-fill, #2563eb);
  color: var(--dsw-alias-label-primary-foreground, #ffffff);
}
.adk-seg-btn-active:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, #1d4ed8);
}
.adk-seg-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.adk-links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 10px;
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
.adk-links-note {
  flex-basis: 100%;
  margin: 0;
  font-size: 11.5px;
  color: var(--dsw-alias-label-tertiary, #6b7280);
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
      const [updateInfo, setUpdateInfo] = useState(null);
      const [error, setError] = useState(null);
      const [busy, setBusy] = useState(false);
      const [upgrading, setUpgrading] = useState(false);

      const loadStatus = useCallback(async () => {
        try {
          const res = await fetch('api/agentdeck/status', {
            cache: 'no-store',
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
          setStatus(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }, []);

      const checkUpdate = useCallback(async ({ force = false } = {}) => {
        try {
          const url = force
            ? 'api/agentdeck/update-check?force=1'
            : 'api/agentdeck/update-check';
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) return;
          const data = await res.json();
          if (data?.ok) setUpdateInfo(data);
        } catch {
          // Ignore offline / network errors during passive update check
        }
      }, []);

      useEffect(() => {
        loadStatus();
      }, [loadStatus]);

      const daemonVersion = status?.daemon?.version || null;
      useEffect(() => {
        if (!daemonVersion) return;
        checkUpdate();
      }, [daemonVersion, checkUpdate]);

      // Automatically poll while first-time background provisioning is running
      const isProvisioning = status?.provisioning?.state === 'running';
      useEffect(() => {
        if (!isProvisioning) return undefined;
        const timer = setTimeout(() => {
          loadStatus();
        }, 1500);
        return () => clearTimeout(timer);
      }, [isProvisioning, status, loadStatus]);

      const postAction = useCallback(async (url, body) => {
        setBusy(true);
        setError(null);
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          if (data?.status) setStatus(data.status);
          if (!res.ok || !data?.ok) {
            throw new Error(data?.error || `HTTP ${res.status}`);
          }
          return true;
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
          return false;
        } finally {
          setBusy(false);
        }
      }, []);

      const handleUpgrade = useCallback(async () => {
        setUpgrading(true);
        try {
          const ok = await postAction('api/agentdeck/daemon', {
            action: 'upgrade',
          });
          if (ok) {
            await checkUpdate({ force: true });
          }
        } finally {
          setUpgrading(false);
        }
      }, [postAction, checkUpdate]);

      const awakeMode = status?.daemon?.awake?.mode || 'never';
      const awakeOptions = [
        { id: 'never', label: t('awakeNever'), hint: t('awakeHintNever') },
        { id: 'plugged', label: t('awakePlugged'), hint: t('awakeHintPlugged') },
        { id: 'active', label: t('awakeActiveMode'), hint: t('awakeHintActive') },
        { id: 'always', label: t('awakeAlways'), hint: t('awakeHintAlways') },
      ];
      const currentAwakeHint =
        awakeOptions.find((o) => o.id === awakeMode)?.hint || '';

      const qrDataUrl = status?.daemon?.qrSvg
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(status.daemon.qrSvg)}`
        : null;
      const acpModelText = formatModel(status?.models?.acp?.defaultModel);
      const sourceModelText = formatModel(status?.models?.source?.defaultModel);
      const provisionError = status?.provisioning?.error || null;
      const anyBusy = busy || upgrading || isProvisioning;
      const latestVersion = updateInfo?.latestVersion || null;
      const hasDaemonUpdate = Boolean(
        updateInfo?.updateAvailable &&
          latestVersion &&
          daemonVersion &&
          latestVersion !== daemonVersion,
      );
      const canAutoUpdate = Boolean(status?.daemon?.canUpdate);

      return h(
        'div',
        { className: 'adk-root' },
        h(
          'div',
          null,
          h('h2', { className: 'adk-title' }, t('title')),
          h('p', { className: 'adk-subtitle' }, t('subtitle')),
        ),

        !status && !error
          ? h('div', { className: 'adk-card' }, t('loading'))
          : null,

        error || provisionError
          ? h(
              'div',
              { className: 'adk-banner adk-banner-err' },
              h('span', null, `${t('errorTitle')}: ${error || provisionError}`),
              h(
                'button',
                {
                  type: 'button',
                  className: 'adk-btn adk-btn-primary',
                  disabled: anyBusy,
                  onClick: () => postAction('api/agentdeck/setup', {}),
                },
                t('btnRetry'),
              ),
            )
          : null,

        status
          ? h(
              React.Fragment,
              null,
              // Card 1: Pairing QR Code (zero-click ready)
              h(
                'section',
                { className: 'adk-card' },
                isProvisioning && !qrDataUrl
                  ? h(
                      'div',
                      { className: 'adk-provisioning' },
                      h(
                        'div',
                        { className: 'adk-provisioning-title' },
                        h('span', { className: 'adk-spinner' }),
                        h('span', null, t('provisioning')),
                      ),
                      h('p', { className: 'adk-desc' }, t('provisioningHint')),
                    )
                  : qrDataUrl
                    ? h(
                        React.Fragment,
                        null,
                        !status.daemon?.running
                          ? h(
                              'div',
                              { className: 'adk-banner adk-banner-warn' },
                              t('stoppedBanner'),
                            )
                          : null,
                        h(
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
                            h('p', { className: 'adk-desc' }, t('qrHint')),
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
                          ),
                        ),
                      )
                    : h(
                        'div',
                        { className: 'adk-actions' },
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'adk-btn adk-btn-primary',
                            disabled: anyBusy,
                            onClick: () => postAction('api/agentdeck/setup', {}),
                          },
                          t('btnRetry'),
                        ),
                      ),

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
                  h('p', { className: 'adk-links-note' }, t('appStoreNote')),
                ),
              ),

              // Card 2: Essential Settings Only (Service, Keep Awake, Mobile Model)
              h(
                'section',
                { className: 'adk-card' },
                h(
                  'div',
                  { className: 'adk-rows' },
                  // 1. Remote Service & Autostart
                  h(
                    'div',
                    { className: 'adk-row' },
                    h(
                      'div',
                      { className: 'adk-row-main' },
                      h(
                        'div',
                        { className: 'adk-row-label' },
                        h('span', null, t('serviceTitle')),
                        h(
                          'span',
                          {
                            className: `adk-badge ${status.daemon?.running ? 'adk-badge-ok' : 'adk-badge-muted'}`,
                          },
                          status.daemon?.running
                            ? t('statusRunning')
                            : t('statusStopped'),
                        ),
                        daemonVersion
                          ? h(
                              'span',
                              { className: 'adk-version' },
                              `v${daemonVersion}`,
                            )
                          : null,
                      ),
                      h(
                        'p',
                        { className: 'adk-desc' },
                        status.daemon?.running
                          ? t('serviceDescRunning')
                          : t('serviceDescStopped'),
                        hasDaemonUpdate && !canAutoUpdate
                          ? ` · ${t('updateAvailable')} v${latestVersion}`
                          : null,
                      ),
                    ),
                    h(
                      'div',
                      { className: 'adk-actions' },
                      hasDaemonUpdate && canAutoUpdate
                        ? h(
                            'button',
                            {
                              type: 'button',
                              className: `adk-btn ${status.daemon?.running ? 'adk-btn-primary' : 'adk-btn-secondary'}`,
                              disabled: anyBusy,
                              onClick: handleUpgrade,
                            },
                            upgrading
                              ? t('btnUpdating')
                              : `${t('btnUpdate')} v${latestVersion}`,
                          )
                        : null,
                      status.daemon?.running
                        ? status.daemon?.binaryPath
                          ? h(
                              React.Fragment,
                              null,
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'adk-btn adk-btn-secondary',
                                  disabled: anyBusy,
                                  onClick: () =>
                                    postAction('api/agentdeck/daemon', {
                                      action: 'restart',
                                    }),
                                },
                                busy && !upgrading
                                  ? t('btnWorking')
                                  : t('btnRestart'),
                              ),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'adk-btn adk-btn-secondary',
                                  disabled: anyBusy,
                                  onClick: () =>
                                    postAction('api/agentdeck/daemon', {
                                      action: 'stop',
                                    }),
                                },
                                t('btnStop'),
                              ),
                            )
                          : null
                        : h(
                            'button',
                            {
                              type: 'button',
                              className: 'adk-btn adk-btn-primary',
                              disabled: anyBusy,
                              onClick: () =>
                                postAction('api/agentdeck/daemon', {
                                  action: 'start',
                                }),
                            },
                            busy && !upgrading ? t('btnWorking') : t('btnStart'),
                          ),
                    ),
                  ),

                  // 2. Keep Awake
                  h(
                    'div',
                    { className: 'adk-row adk-row-col' },
                    h(
                      'div',
                      { className: 'adk-row-head' },
                      h('span', { className: 'adk-row-label' }, t('awakeTitle')),
                      status.daemon?.running
                        ? h(
                            'span',
                            {
                              className: `adk-badge ${status.daemon?.awake?.active ? 'adk-badge-ok' : 'adk-badge-muted'}`,
                            },
                            status.daemon?.awake?.active
                              ? t('awakeActive')
                              : t('awakeInactive'),
                          )
                        : null,
                    ),
                    h(
                      'div',
                      {
                        className: 'adk-seg',
                        role: 'radiogroup',
                        'aria-label': t('awakeTitle'),
                      },
                      ...awakeOptions.map((opt) =>
                        h(
                          'button',
                          {
                            key: opt.id,
                            type: 'button',
                            role: 'radio',
                            'aria-checked': awakeMode === opt.id,
                            disabled: anyBusy,
                            className: `adk-seg-btn ${awakeMode === opt.id ? 'adk-seg-btn-active' : ''}`,
                            onClick: () =>
                              postAction('api/agentdeck/awake', {
                                mode: opt.id,
                              }),
                          },
                          opt.label,
                        ),
                      ),
                    ),
                    h('p', { className: 'adk-desc' }, currentAwakeHint),
                    status.daemon?.awake?.error
                      ? h(
                          'p',
                          { className: 'adk-desc adk-text-err' },
                          status.daemon.awake.error,
                        )
                      : null,
                  ),

                  // 3. Mobile Default Model
                  h(
                    'div',
                    { className: 'adk-row' },
                    h(
                      'div',
                      { className: 'adk-row-main' },
                      h('span', { className: 'adk-row-label' }, t('modelTitle')),
                      h(
                        'p',
                        { className: 'adk-desc' },
                        acpModelText || t('modelDefault'),
                      ),
                    ),
                    sourceModelText && status.models?.mismatch
                      ? h(
                          'button',
                          {
                            type: 'button',
                            className: 'adk-btn adk-btn-secondary',
                            disabled: anyBusy,
                            onClick: () =>
                              postAction('api/agentdeck/sync-models', {}),
                          },
                          `${t('btnSyncModel')} (${sourceModelText})`,
                        )
                      : null,
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
