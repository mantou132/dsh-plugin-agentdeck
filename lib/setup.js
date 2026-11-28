import { spawn } from 'node:child_process';
import {
  accessSync,
  constants as fsConstants,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  chmodSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { arch, homedir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import QRCode from 'qrcode';
import { parseDocument } from 'yaml';

export const DEFAULT_RELAY_URL = 'wss://agentdeck.xianqiao.wang/ws';
const LEGACY_DEFAULT_RELAY_URL = 'wss://agent-deck.xianqiao.wang/ws';

export const ACP_PLUGIN_PACKAGES = [
  '@openma/deepseek-harness-acp',
  '@cnctem/dsh-acp',
];
export const DEFAULT_ACP_PLUGIN = '@openma/deepseek-harness-acp@latest';
export const AWAKE_MODES = ['never', 'plugged', 'active', 'always'];

const BUILTIN_DEEPSEEK_PROVIDERS = new Set([
  'deepseek-official',
  'deepseek-account',
]);

const PATCH_HEADER =
  '# Your patch layer for this dsh profile, applied after every bundle layer:\n' +
  '# a top-level YAML array of loader patch entries (id-targeted config\n' +
  '# overrides, disables, and insert lists; `!!js` expressions allowed).\n';

const JS_YAML_TAG = {
  tag: 'tag:yaml.org,2002:js',
  resolve: (str) => str,
  identify: () => false,
};

/**
 * Resolve AgentDeck's local data directory, matching `dirs::data_local_dir()/agentdeck`.
 */
export function getAgentDeckDataDir({
  platform = process.platform,
  env = process.env,
  home = homedir(),
} = {}) {
  if (platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'agentdeck');
  }
  if (platform === 'win32') {
    const localAppData = env.LOCALAPPDATA || join(home, 'AppData', 'Local');
    return join(localAppData, 'agentdeck');
  }
  const xdgDataHome = env.XDG_DATA_HOME || join(home, '.local', 'share');
  return join(xdgDataHome, 'agentdeck');
}

/**
 * Build the AgentDeck pairing URI (`agentdeck://connect?pairingId=...`).
 * Includes `relayUrl` only when using a non-default Relay.
 */
export function buildPairingUri(relayId, relayUrl) {
  const effectiveRelay =
    relayUrl && relayUrl !== LEGACY_DEFAULT_RELAY_URL
      ? relayUrl
      : DEFAULT_RELAY_URL;
  const url = new URL('agentdeck://connect');
  url.searchParams.set('pairingId', relayId);
  if (effectiveRelay !== DEFAULT_RELAY_URL) {
    url.searchParams.set('relayUrl', effectiveRelay);
  }
  return url.toString();
}

export async function generatePairingQrSvg(pairingUri) {
  return QRCode.toString(pairingUri, {
    type: 'svg',
    margin: 2,
    width: 220,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#111111',
      light: '#ffffff',
    },
  });
}

function isExecutableFile(filePath, platform = process.platform) {
  if (!filePath || !existsSync(filePath)) return false;
  if (platform === 'win32') return true;
  try {
    accessSync(filePath, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export function findExecutable(
  name,
  {
    platform = process.platform,
    env = process.env,
    home = homedir(),
    extraDirs = [],
  } = {},
) {
  const candidates =
    platform === 'win32'
      ? [`${name}.exe`, `${name}.cmd`, `${name}.bat`, name]
      : [name];
  const pathDirs = (env.PATH || '').split(delimiter).filter(Boolean);
  const nodeBinDir = dirname(process.execPath);
  const fallbackDirs =
    platform === 'win32'
      ? [
          nodeBinDir,
          join(home, 'scoop', 'shims'),
          join(env.APPDATA || join(home, 'AppData', 'Roaming'), 'npm'),
          join(home, '.cargo', 'bin'),
        ]
      : [
          nodeBinDir,
          join(home, '.local', 'bin'),
          '/opt/homebrew/bin',
          '/usr/local/bin',
          join(home, '.cargo', 'bin'),
          join(home, '.npm-global', 'bin'),
          join(home, 'Library', 'pnpm'),
          join(home, '.local', 'share', 'pnpm'),
        ];

  const seen = new Set();
  for (const dir of [...extraDirs, ...pathDirs, ...fallbackDirs]) {
    if (!dir || seen.has(dir)) continue;
    seen.add(dir);
    for (const file of candidates) {
      const full = join(dir, file);
      if (isExecutableFile(full, platform)) return full;
    }
  }
  return null;
}

function platformSuffix(platform = process.platform, cpu = arch()) {
  if (platform === 'darwin' && cpu === 'arm64') return 'darwin-arm64';
  if (platform === 'darwin' && cpu === 'x64') return 'darwin-x64';
  if (platform === 'linux' && cpu === 'x64') return 'linux-x64-gnu';
  if (platform === 'win32' && cpu === 'x64') return 'windows-x64';
  return null;
}

/**
 * Find `agentdeckd` executable on PATH, standard package-manager bin dirs,
 * or the plugin's dedicated fallback install prefix (`<dataDir>/cli`).
 */
export function findAgentDeckDaemon({
  dataDir = getAgentDeckDataDir(),
  platform = process.platform,
  env = process.env,
  home = homedir(),
  extraDirs = [],
} = {}) {
  const onPath = findExecutable('agentdeckd', { platform, env, home, extraDirs });
  if (onPath) return onPath;

  const cliDir = join(dataDir, 'cli');
  const suffix = platformSuffix(platform);
  const exe = platform === 'win32' ? 'agentdeckd.exe' : 'agentdeckd';
  if (suffix) {
    const directNative = join(
      cliDir,
      'node_modules',
      `agentdeckd-${suffix}`,
      'bin',
      exe,
    );
    if (isExecutableFile(directNative, platform)) return directNative;
    const nestedNative = join(
      cliDir,
      'node_modules',
      'agentdeckd',
      'node_modules',
      `agentdeckd-${suffix}`,
      'bin',
      exe,
    );
    if (isExecutableFile(nestedNative, platform)) return nestedNative;
  }

  return findExecutable('agentdeckd', {
    platform,
    env,
    home,
    extraDirs: [join(cliDir, 'node_modules', '.bin')],
  });
}

/**
 * Resolve the `dsh` executable path. Works for both CLI installs and
 * DeepSeek Harness Desktop (bundled `runtime/cli/bin/dsh`).
 */
export function resolveDshCommand({
  platform = process.platform,
  env = process.env,
  home = homedir(),
  resourcesPath = process.resourcesPath,
  argv1 = process.argv[1],
} = {}) {
  const bundledDirs = [];
  if (resourcesPath) {
    bundledDirs.push(join(resourcesPath, 'runtime', 'cli', 'bin'));
  }
  if (argv1) {
    let cursor = dirname(resolve(argv1));
    for (let i = 0; i < 6; i++) {
      bundledDirs.push(join(cursor, 'bin'));
      bundledDirs.push(join(cursor, 'runtime', 'cli', 'bin'));
      const parent = dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }

  // Prefer user PATH / ~/.local/bin first, then bundled Desktop CLI.
  const onPath = findExecutable('dsh', { platform, env, home });
  if (onPath) return onPath;
  return findExecutable('dsh', { platform, env, home, extraDirs: bundledDirs });
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err?.code === 'EPERM';
  }
}

const AUTO_UPDATABLE_METHODS = new Set([
  'local',
  'homebrew',
  'npm-global',
  'pnpm-global',
  'scoop',
]);
const LATEST_VERSION_CACHE_TTL_MS = 10 * 60 * 1000;
const NPM_LATEST_URL = 'https://registry.npmjs.org/agentdeckd/latest';
const GITHUB_LATEST_URL =
  'https://api.github.com/repos/mantou132/AgentDeck/releases/latest';

const daemonVersionCache = new Map();
let latestVersionCache = { version: null, fetchedAt: 0 };

export function clearDaemonVersionCaches() {
  daemonVersionCache.clear();
  latestVersionCache = { version: null, fetchedAt: 0 };
}

export function parseSemver(raw) {
  if (typeof raw !== 'string') return null;
  const match = raw.match(/\bv?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?\b/);
  if (!match) return null;
  const major = Number.parseInt(match[1], 10);
  const minor = Number.parseInt(match[2], 10);
  const patch = Number.parseInt(match[3], 10);
  const prerelease = match[4] || null;
  return {
    version: `${major}.${minor}.${patch}${prerelease ? `-${prerelease}` : ''}`,
    major,
    minor,
    patch,
    prerelease,
  };
}

export function compareSemver(aRaw, bRaw) {
  const a = typeof aRaw === 'string' ? parseSemver(aRaw) : aRaw;
  const b = typeof bRaw === 'string' ? parseSemver(bRaw) : bRaw;
  if (!a || !b) return 0;
  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;
  if (!a.prerelease && !b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;
  const aParts = a.prerelease.split('.');
  const bParts = b.prerelease.split('.');
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const ap = aParts[i];
    const bp = bParts[i];
    if (ap === undefined) return -1;
    if (bp === undefined) return 1;
    if (ap === bp) continue;
    const aNum = /^\d+$/.test(ap);
    const bNum = /^\d+$/.test(bp);
    if (aNum && bNum) return Number(ap) > Number(bp) ? 1 : -1;
    if (aNum !== bNum) return aNum ? -1 : 1;
    return ap > bp ? 1 : -1;
  }
  return 0;
}

function normalizePathForMatch(p, platform = process.platform) {
  const normalized = String(p || '').replace(/\\/g, '/');
  return platform === 'win32' ? normalized.toLowerCase() : normalized;
}

export function detectDaemonInstallMethod(
  binaryPath,
  {
    dataDir = getAgentDeckDataDir(),
    platform = process.platform,
    home = homedir(),
  } = {},
) {
  if (!binaryPath) return 'none';
  let resolvedPath = binaryPath;
  try {
    resolvedPath = realpathSync(binaryPath);
  } catch {
    // Keep original path if symlink resolution fails
  }

  const binNorm = normalizePathForMatch(binaryPath, platform);
  const realNorm = normalizePathForMatch(resolvedPath, platform);
  const cliDirNorm = normalizePathForMatch(join(dataDir, 'cli'), platform).replace(
    /\/+$/,
    '',
  );

  if (
    binNorm.startsWith(`${cliDirNorm}/`) ||
    realNorm.startsWith(`${cliDirNorm}/`)
  ) {
    return 'local';
  }

  const brewPattern = /(?:^|\/)(?:cellar\/agentdeckd|homebrew|linuxbrew)\//i;
  if (brewPattern.test(realNorm) || brewPattern.test(binNorm)) {
    return 'homebrew';
  }

  if (
    platform === 'win32' &&
    (/\/scoop\//i.test(binNorm) || /\/scoop\//i.test(realNorm))
  ) {
    return 'scoop';
  }

  const cargoBinNorm = normalizePathForMatch(
    join(home, '.cargo', 'bin'),
    platform,
  ).replace(/\/+$/, '');
  if (
    binNorm.startsWith(`${cargoBinNorm}/`) ||
    realNorm.startsWith(`${cargoBinNorm}/`)
  ) {
    return 'cargo';
  }

  if (/\/pnpm\//i.test(binNorm) || /\/pnpm\//i.test(realNorm)) {
    return 'pnpm-global';
  }

  if (
    realNorm.includes('/node_modules/') ||
    binNorm.includes('/node_modules/') ||
    existsSync(join(dirname(binaryPath), 'node_modules', 'agentdeckd'))
  ) {
    return 'npm-global';
  }

  return 'unknown';
}

export async function readDaemonVersion(binaryPath) {
  if (!binaryPath) return null;
  let cacheKey = binaryPath;
  let mtimeMs = 0;
  try {
    const real = realpathSync(binaryPath);
    cacheKey = real;
    mtimeMs = statSync(real).mtimeMs;
  } catch {
    try {
      mtimeMs = statSync(binaryPath).mtimeMs;
    } catch {
      return null;
    }
  }

  const cached = daemonVersionCache.get(cacheKey);
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.version;
  }

  try {
    const res = await runCommand(binaryPath, ['--version'], { timeoutMs: 5_000 });
    const parsed = parseSemver(`${res.stdout}\n${res.stderr}`);
    const version = parsed ? parsed.version : null;
    daemonVersionCache.set(cacheKey, { mtimeMs, version });
    return version;
  } catch {
    return null;
  }
}

async function readDaemonStatusJson(
  binaryPath,
  { dataDir, platform, env, home },
) {
  if (!binaryPath) return null;

  // `status --json` resolves the daemon's data directory through the platform
  // environment. Only use it when that directory matches the one requested by
  // the caller; custom data directories still use the file based fallback.
  const expectedDataDir = getAgentDeckDataDir({ platform, env, home });
  if (resolve(dataDir) !== resolve(expectedDataDir)) return null;

  const daemonEnv = { ...env };
  if (platform === 'darwin') {
    daemonEnv.HOME = home;
  } else if (platform === 'win32') {
    daemonEnv.LOCALAPPDATA =
      env.LOCALAPPDATA || join(home, 'AppData', 'Local');
  } else {
    daemonEnv.XDG_DATA_HOME =
      env.XDG_DATA_HOME || join(home, '.local', 'share');
  }

  try {
    const result = await runCommand(binaryPath, ['status', '--json'], {
      env: daemonEnv,
      timeoutMs: 5_000,
    });
    if (result.code !== 0) return null;
    const status = JSON.parse(result.stdout.trim());
    return status && typeof status.running === 'boolean' ? status : null;
  } catch {
    // Older daemon versions may not support `status --json`.
    return null;
  }
}

export async function fetchLatestDaemonVersion({
  force = false,
  fetchImpl = globalThis.fetch,
  timeoutMs = 5_000,
} = {}) {
  const now = Date.now();
  if (
    !force &&
    latestVersionCache.version &&
    now - latestVersionCache.fetchedAt < LATEST_VERSION_CACHE_TTL_MS
  ) {
    return latestVersionCache.version;
  }
  if (typeof fetchImpl !== 'function') return latestVersionCache.version;

  const tryJsonUrl = async (url, extractor) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const parsed = parseSemver(extractor(data));
      return parsed ? parsed.version : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  let version = await tryJsonUrl(NPM_LATEST_URL, (d) => d?.version);
  if (!version) {
    version = await tryJsonUrl(GITHUB_LATEST_URL, (d) => d?.tag_name);
  }

  if (version) {
    latestVersionCache = { version, fetchedAt: now };
  }
  return version;
}

export async function checkDaemonUpdate({
  dataDir = getAgentDeckDataDir(),
  platform = process.platform,
  env = process.env,
  home = homedir(),
  force = false,
  fetchImpl = globalThis.fetch,
} = {}) {
  const binaryPath = findAgentDeckDaemon({ dataDir, platform, env, home });
  const installMethod = detectDaemonInstallMethod(binaryPath, {
    dataDir,
    platform,
    home,
  });
  const canUpdate = AUTO_UPDATABLE_METHODS.has(installMethod);
  const [currentVersion, latestVersion] = await Promise.all([
    readDaemonVersion(binaryPath),
    fetchLatestDaemonVersion({ force, fetchImpl }),
  ]);
  const updateAvailable = Boolean(
    currentVersion &&
      latestVersion &&
      compareSemver(latestVersion, currentVersion) > 0,
  );
  return {
    currentVersion,
    latestVersion,
    updateAvailable,
    installMethod,
    canUpdate,
  };
}

export async function readDaemonState(
  dataDir,
  { platform = process.platform, env = process.env, home = homedir() } = {},
) {
  const binaryPath = findAgentDeckDaemon({ dataDir, platform, env, home });
  const installMethod = detectDaemonInstallMethod(binaryPath, {
    dataDir,
    platform,
    home,
  });
  const canUpdate = AUTO_UPDATABLE_METHODS.has(installMethod);
  const version = binaryPath ? await readDaemonVersion(binaryPath) : null;

  const jsonStatus = await readDaemonStatusJson(binaryPath, {
    dataDir,
    platform,
    env,
    home,
  });
  if (jsonStatus) {
    const relayId =
      typeof jsonStatus.pairingId === 'string' && jsonStatus.pairingId.trim()
        ? jsonStatus.pairingId.trim()
        : null;
    const statusRelayUrl =
      typeof jsonStatus.relayUrl === 'string' && jsonStatus.relayUrl.trim()
        ? jsonStatus.relayUrl.trim()
        : DEFAULT_RELAY_URL;
    const relayUrl =
      statusRelayUrl === LEGACY_DEFAULT_RELAY_URL
        ? DEFAULT_RELAY_URL
        : statusRelayUrl;
    const hasCustomRelay = relayUrl !== DEFAULT_RELAY_URL;
    const awakeMode = AWAKE_MODES.includes(jsonStatus.awake?.mode)
      ? jsonStatus.awake.mode
      : 'never';
    const running = jsonStatus.running;
    const qrSvg = relayId
      ? await generatePairingQrSvg(buildPairingUri(relayId, relayUrl))
      : null;

    return {
      installed: Boolean(binaryPath) || running,
      binaryPath,
      version: parseSemver(jsonStatus.version)?.version || version,
      installMethod,
      canUpdate,
      running,
      pid:
        running && Number.isInteger(jsonStatus.pid) ? jsonStatus.pid : null,
      pairedReady: Boolean(relayId),
      maskedPairingId: relayId
        ? relayId.length > 14
          ? `${relayId.slice(0, 9)}…${relayId.slice(-4)}`
          : relayId
        : null,
      relayUrl,
      hasCustomRelay,
      qrSvg,
      awake: {
        mode: awakeMode,
        active: running && jsonStatus.awake?.on === true,
        error:
          typeof jsonStatus.awake?.error === 'string'
            ? jsonStatus.awake.error
            : null,
      },
    };
  }

  const configPath = join(dataDir, 'daemon.json');
  const lockPath = join(dataDir, 'daemon.lock');

  let pid = null;
  let running = false;
  if (existsSync(lockPath)) {
    try {
      const parsed = Number.parseInt(readFileSync(lockPath, 'utf8').trim(), 10);
      if (Number.isInteger(parsed) && parsed > 0) {
        pid = parsed;
        running = isPidAlive(parsed);
      }
    } catch {
      // Ignore unreadable lock file
    }
  }

  let relayId = null;
  let relayUrl = DEFAULT_RELAY_URL;
  let hasCustomRelay = false;
  let awakeMode = 'never';
  if (existsSync(configPath)) {
    try {
      const raw = JSON.parse(readFileSync(configPath, 'utf8'));
      if (typeof raw?.relay_id === 'string' && raw.relay_id.trim()) {
        relayId = raw.relay_id.trim();
      }
      if (
        typeof raw?.relay_url === 'string' &&
        raw.relay_url.trim() &&
        raw.relay_url.trim() !== LEGACY_DEFAULT_RELAY_URL
      ) {
        relayUrl = raw.relay_url.trim();
        hasCustomRelay = relayUrl !== DEFAULT_RELAY_URL;
      }
      if (typeof raw?.awake === 'string' && AWAKE_MODES.includes(raw.awake)) {
        awakeMode = raw.awake;
      }
    } catch {
      // Ignore corrupt daemon.json
    }
  }

  const awakeStatusPath = join(dataDir, 'awake_status.json');
  let awakeActive = false;
  let awakeError = null;
  if (running && existsSync(awakeStatusPath)) {
    try {
      const st = JSON.parse(readFileSync(awakeStatusPath, 'utf8'));
      if (st?.pid === pid && st?.mode === awakeMode) {
        awakeActive = Boolean(st.on);
        awakeError = typeof st.error === 'string' ? st.error : null;
      }
    } catch {
      // Ignore unreadable awake_status.json
    }
  }

  let qrSvg = null;
  let maskedPairingId = null;
  if (relayId) {
    const uri = buildPairingUri(relayId, relayUrl);
    qrSvg = await generatePairingQrSvg(uri);
    maskedPairingId =
      relayId.length > 14
        ? `${relayId.slice(0, 9)}…${relayId.slice(-4)}`
        : relayId;
  }

  return {
    installed: Boolean(binaryPath) || running,
    binaryPath,
    version,
    installMethod,
    canUpdate,
    running,
    pid: running ? pid : null,
    pairedReady: Boolean(relayId),
    maskedPairingId,
    relayUrl,
    hasCustomRelay,
    qrSvg,
    awake: {
      mode: awakeMode,
      active: awakeActive,
      error: awakeError,
    },
  };
}

export function readAcpPluginState(dshHome) {
  const acpDir = join(dshHome, 'profiles', 'acp');
  const pkgPath = join(acpDir, 'package.json');
  if (!existsSync(pkgPath)) {
    return { installed: false, packageName: null, version: null, acpDir };
  }
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const deps = { ...(pkg.devDependencies || {}), ...(pkg.dependencies || {}) };
    for (const candidate of ACP_PLUGIN_PACKAGES) {
      if (deps[candidate]) {
        const installedPkgJson = join(
          acpDir,
          'node_modules',
          ...candidate.split('/'),
          'package.json',
        );
        if (existsSync(installedPkgJson)) {
          let version = deps[candidate];
          try {
            const inner = JSON.parse(readFileSync(installedPkgJson, 'utf8'));
            if (inner.version) version = inner.version;
          } catch {
            // Fall back to declared version range
          }
          return { installed: true, packageName: candidate, version, acpDir };
        }
      }
    }
  } catch {
    // Ignore malformed profile package.json
  }
  return { installed: false, packageName: null, version: null, acpDir };
}

export function parsePatchDocument(text) {
  const doc = parseDocument(text || '[]', {
    customTags: [JS_YAML_TAG],
    keepSourceTokens: false,
  });
  if (!doc.contents || !Array.isArray(doc.contents.items)) {
    doc.contents = doc.createNode([]);
  }
  return doc;
}

function findPatchEntryIndex(items, id) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item && typeof item.get === 'function' && item.get('id') === id) {
      return i;
    }
  }
  return -1;
}

function readPatchFile(patchPath) {
  if (!patchPath || !existsSync(patchPath)) return null;
  try {
    return readFileSync(patchPath, 'utf8');
  } catch {
    return null;
  }
}

export function extractModelSummary(patchPath) {
  const text = readPatchFile(patchPath);
  if (!text) {
    return {
      exists: false,
      defaultModel: null,
      acpPlugin: null,
      hasCustomProviders: false,
      customProviderNames: [],
    };
  }
  try {
    const doc = parsePatchDocument(text);
    const arr = doc.toJS();
    if (!Array.isArray(arr)) {
      return {
        exists: true,
        defaultModel: null,
        acpPlugin: null,
        hasCustomProviders: false,
        customProviderNames: [],
      };
    }
    const defaultEntry = arr.find((e) => e?.id === 'agent-default-model');
    const acpEntry = arr.find((e) => e?.id === 'acp-plugin');
    const piAiEntry = arr.find((e) => e?.id === 'llm-pi-ai');
    const providers =
      piAiEntry?.config?.providers &&
      typeof piAiEntry.config.providers === 'object'
        ? Object.keys(piAiEntry.config.providers)
        : [];
    return {
      exists: true,
      defaultModel: defaultEntry?.config
        ? {
            provider: defaultEntry.config.provider || null,
            model: defaultEntry.config.model || null,
            reasoningEffort: defaultEntry.config.reasoningEffort || null,
          }
        : null,
      acpPlugin: acpEntry?.config
        ? {
            provider: acpEntry.config.provider || null,
            model: acpEntry.config.model || null,
          }
        : null,
      hasCustomProviders: providers.length > 0,
      customProviderNames: providers,
    };
  } catch {
    return {
      exists: true,
      defaultModel: null,
      acpPlugin: null,
      hasCustomProviders: false,
      customProviderNames: [],
    };
  }
}

function writeFileAtomic(filePath, content, { mode } = {}) {
  mkdirSync(dirname(filePath), { recursive: true });
  let targetMode = mode;
  if (targetMode === undefined && existsSync(filePath)) {
    try {
      targetMode = statSync(filePath).mode & 0o777;
    } catch {
      // Fall back to default umask
    }
  }
  const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
  try {
    writeFileSync(tmpPath, content, {
      encoding: 'utf8',
      ...(targetMode !== undefined ? { mode: targetMode } : {}),
    });
    if (targetMode !== undefined && process.platform !== 'win32') {
      try {
        chmodSync(tmpPath, targetMode);
      } catch {
        // Ignore chmod failure on unsupported filesystems
      }
    }
    renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      unlinkSync(tmpPath);
    } catch {
      // Ignore cleanup failure
    }
    throw err;
  }
}

/**
 * Sync model/provider configuration from the active profile into the `acp` profile
 * `cordis.patch.yml`, preserving unrelated entries and `!!js` expressions.
 *
 * Also mirrors non-DeepSeek `provider`/`model` into `acp-plugin.config` so
 * `@openma/deepseek-harness-acp` validates the matching provider credential
 * instead of requiring `DEEPSEEK_API_KEY`.
 */
export function syncAcpPatch({
  sourcePatchPath,
  acpPatchPath,
  syncModels = false,
}) {
  const sourceText = readPatchFile(sourcePatchPath);
  const acpText = readPatchFile(acpPatchPath);

  const acpDoc = parsePatchDocument(acpText || '[]');
  const acpItems = acpDoc.contents.items;
  let changed = false;

  const acpExistingDefaultIdx = findPatchEntryIndex(
    acpItems,
    'agent-default-model',
  );
  const shouldSyncFromSource =
    Boolean(sourceText) && (syncModels || acpExistingDefaultIdx === -1);

  if (shouldSyncFromSource) {
    const sourceDoc = parsePatchDocument(sourceText);
    const sourceItems = sourceDoc.contents.items;

    for (const id of ['llm-pi-ai', 'agent-default-model']) {
      const srcIdx = findPatchEntryIndex(sourceItems, id);
      if (srcIdx === -1) continue;
      const cloned = sourceItems[srcIdx].clone();
      const dstIdx = findPatchEntryIndex(acpItems, id);
      if (dstIdx === -1) {
        acpItems.push(cloned);
      } else {
        acpItems[dstIdx] = cloned;
      }
      changed = true;
    }
  }

  const effectiveDefaultIdx = findPatchEntryIndex(
    acpItems,
    'agent-default-model',
  );
  if (effectiveDefaultIdx !== -1) {
    const defObj = acpItems[effectiveDefaultIdx].toJS(acpDoc);
    const provider = defObj?.config?.provider;
    const model = defObj?.config?.model;
    const acpPluginIdx = findPatchEntryIndex(acpItems, 'acp-plugin');
    const existingAcpPlugin =
      acpPluginIdx !== -1 ? acpItems[acpPluginIdx].toJS(acpDoc) : null;

    if (provider && !BUILTIN_DEEPSEEK_PROVIDERS.has(provider)) {
      const nextConfig = {
        ...(existingAcpPlugin?.config || {}),
        provider,
        ...(model ? { model } : {}),
      };
      const needsUpdate =
        !existingAcpPlugin ||
        existingAcpPlugin?.config?.provider !== nextConfig.provider ||
        (model && existingAcpPlugin?.config?.model !== nextConfig.model);
      if (needsUpdate) {
        const entryNode = acpDoc.createNode({
          id: 'acp-plugin',
          config: nextConfig,
        });
        if (acpPluginIdx === -1) {
          acpItems.push(entryNode);
        } else {
          acpItems[acpPluginIdx] = entryNode;
        }
        changed = true;
      }
    } else if (
      shouldSyncFromSource &&
      provider &&
      BUILTIN_DEEPSEEK_PROVIDERS.has(provider) &&
      acpPluginIdx !== -1
    ) {
      const nextConfig = { ...(existingAcpPlugin?.config || {}) };
      nextConfig.provider = provider;
      if (model) nextConfig.model = model;
      acpItems[acpPluginIdx] = acpDoc.createNode({
        id: 'acp-plugin',
        config: nextConfig,
      });
      changed = true;
    }
  }

  if (changed) {
    const body = acpDoc.toString({ lineWidth: 0 });
    const output = acpText ? body : `${PATCH_HEADER}${body}`;
    writeFileAtomic(acpPatchPath, output);
  }

  return { changed, syncedFromSource: shouldSyncFromSource };
}

export function readCustomAgentState(customAgentsPath) {
  if (!existsSync(customAgentsPath)) {
    return { configured: false, entry: null, path: customAgentsPath };
  }
  try {
    const data = JSON.parse(readFileSync(customAgentsPath, 'utf8'));
    const agents = Array.isArray(data?.agents) ? data.agents : [];
    const entry = agents.find((a) => a?.id === 'dsh') || null;
    const configured = Boolean(
      entry &&
        typeof entry.command === 'string' &&
        entry.command.trim() &&
        Array.isArray(entry.args) &&
        entry.args.includes('--profile') &&
        entry.args.includes('acp'),
    );
    return { configured, entry, path: customAgentsPath };
  } catch {
    return { configured: false, entry: null, path: customAgentsPath };
  }
}

export function upsertCustomAgent({ customAgentsPath, dshCommand }) {
  let data = { agents: [] };
  if (existsSync(customAgentsPath)) {
    try {
      const parsed = JSON.parse(readFileSync(customAgentsPath, 'utf8'));
      if (parsed && typeof parsed === 'object') {
        data = {
          ...parsed,
          agents: Array.isArray(parsed.agents) ? [...parsed.agents] : [],
        };
      }
    } catch {
      // Start fresh if file is empty/corrupt JSON
    }
  }

  const nextEntry = {
    id: 'dsh',
    name: 'DeepSeek Harness',
    command: dshCommand,
    args: ['--profile', 'acp'],
  };

  const idx = data.agents.findIndex((a) => a?.id === 'dsh');
  if (idx === -1) {
    data.agents.push(nextEntry);
  } else {
    data.agents[idx] = { ...data.agents[idx], ...nextEntry };
  }

  writeFileAtomic(customAgentsPath, `${JSON.stringify(data, null, 2)}\n`);
  return nextEntry;
}

function runCommand(
  command,
  args,
  { cwd, env = process.env, timeoutMs = 180_000 } = {},
) {
  return new Promise((resolvePromise, reject) => {
    const needsWindowsShell =
      process.platform === 'win32' && /\.(cmd|bat)$/i.test(command);
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      shell: needsWindowsShell,
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(
        new Error(`Command timed out after ${Math.round(timeoutMs / 1000)}s`),
      );
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
      if (stdout.length > 16_000) stdout = stdout.slice(-16_000);
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
      if (stderr.length > 16_000) stderr = stderr.slice(-16_000);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolvePromise({ code, stdout, stderr });
    });
  });
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

/**
 * Install `agentdeckd` automatically:
 * 1. macOS: Homebrew (`mantou132/tap/agentdeckd`) if available (signed native binary)
 * 2. Global `npm install -g agentdeckd --include=optional` (macOS/Linux/Windows)
 * 3. Windows: `scoop` fallback if available
 * 4. Universal user-local fallback in `<dataDir>/cli` via DSH's bundled `packageManager` (pnpm) or `npm`
 */
export async function installAgentDeckDaemon({
  dataDir = getAgentDeckDataDir(),
  platform = process.platform,
  env = process.env,
  home = homedir(),
  packageManager = null,
} = {}) {
  const existing = findAgentDeckDaemon({ dataDir, platform, env, home });
  if (existing) {
    return { installed: false, method: 'existing', binaryPath: existing };
  }

  const errors = [];
  const brewBin =
    platform === 'darwin' || platform === 'linux'
      ? findExecutable('brew', { platform, env, home })
      : null;
  const npmBin = findExecutable('npm', { platform, env, home });
  const scoopBin =
    platform === 'win32'
      ? findExecutable('scoop', { platform, env, home })
      : null;

  const tryBrew = async () => {
    if (!brewBin) return null;
    const res = await runCommand(
      brewBin,
      ['install', 'mantou132/tap/agentdeckd'],
      {
        env: { ...env, HOMEBREW_NO_AUTO_UPDATE: '1', HOMEBREW_NO_ENV_HINTS: '1' },
        timeoutMs: 240_000,
      },
    );
    if (res.code === 0) {
      const bin = findAgentDeckDaemon({ dataDir, platform, env, home });
      if (bin) return { installed: true, method: 'homebrew', binaryPath: bin };
    }
    errors.push(
      `brew: ${(res.stderr || res.stdout || `exit ${res.code}`).trim().slice(-240)}`,
    );
    return null;
  };

  const tryNpmGlobal = async () => {
    if (!npmBin) return null;
    const res = await runCommand(
      npmBin,
      ['install', '-g', 'agentdeckd', '--include=optional'],
      { env, timeoutMs: 180_000 },
    );
    if (res.code === 0) {
      const npmExtraDirs = [dirname(npmBin)];
      try {
        const prefixRes = await runCommand(npmBin, ['prefix', '-g'], {
          env,
          timeoutMs: 15_000,
        });
        const prefix = prefixRes.code === 0 ? prefixRes.stdout.trim() : '';
        if (prefix) {
          npmExtraDirs.push(platform === 'win32' ? prefix : join(prefix, 'bin'));
        }
      } catch {
        // Ignore prefix lookup failure
      }
      const bin = findAgentDeckDaemon({
        dataDir,
        platform,
        env,
        home,
        extraDirs: npmExtraDirs,
      });
      if (bin) return { installed: true, method: 'npm-global', binaryPath: bin };
    }
    errors.push(
      `npm -g: ${(res.stderr || res.stdout || `exit ${res.code}`).trim().slice(-240)}`,
    );
    return null;
  };

  const tryScoop = async () => {
    if (!scoopBin) return null;
    await runCommand(
      scoopBin,
      ['bucket', 'add', 'mantou132', 'https://github.com/mantou132/scoop-bucket'],
      { env, timeoutMs: 60_000 },
    );
    const res = await runCommand(scoopBin, ['install', 'agentdeckd'], {
      env,
      timeoutMs: 180_000,
    });
    if (res.code === 0) {
      const bin = findAgentDeckDaemon({ dataDir, platform, env, home });
      if (bin) return { installed: true, method: 'scoop', binaryPath: bin };
    }
    errors.push(
      `scoop: ${(res.stderr || res.stdout || `exit ${res.code}`).trim().slice(-240)}`,
    );
    return null;
  };

  const tryLocalPrefix = async () => {
    const cliDir = join(dataDir, 'cli');
    mkdirSync(cliDir, { recursive: true });
    const pkgPath = join(cliDir, 'package.json');
    if (!existsSync(pkgPath)) {
      writeFileAtomic(
        pkgPath,
        `${JSON.stringify({ name: 'agentdeck-cli', private: true }, null, 2)}\n`,
      );
    }

    if (packageManager?.command) {
      const res = await runCommand(
        packageManager.command,
        [...(packageManager.args || []), 'add', 'agentdeckd'],
        {
          cwd: cliDir,
          env: { ...env, ...(packageManager.env || {}) },
          timeoutMs: 180_000,
        },
      );
      if (res.code === 0) {
        const bin = findAgentDeckDaemon({ dataDir, platform, env, home });
        if (bin) {
          return { installed: true, method: 'local-pnpm', binaryPath: bin };
        }
      }
      errors.push(
        `bundled pnpm: ${(res.stderr || res.stdout || `exit ${res.code}`).trim().slice(-240)}`,
      );
    }

    if (npmBin) {
      const res = await runCommand(
        npmBin,
        ['install', '--prefix', cliDir, 'agentdeckd', '--include=optional'],
        { env, timeoutMs: 180_000 },
      );
      if (res.code === 0) {
        const bin = findAgentDeckDaemon({ dataDir, platform, env, home });
        if (bin) {
          return { installed: true, method: 'local-npm', binaryPath: bin };
        }
      }
      errors.push(
        `local npm: ${(res.stderr || res.stdout || `exit ${res.code}`).trim().slice(-240)}`,
      );
    }
    return null;
  };

  const attempts =
    platform === 'darwin'
      ? [tryBrew, tryNpmGlobal, tryLocalPrefix]
      : platform === 'win32'
        ? [tryNpmGlobal, tryScoop, tryLocalPrefix]
        : [tryNpmGlobal, tryBrew, tryLocalPrefix];

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result) return result;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error(
    `Failed to install agentdeckd automatically. ${errors.join(' | ')}`,
  );
}

/**
 * Control the local `agentdeckd` autostart service (`start` / `stop` / `restart`).
 * `agentdeckd start` registers OS autostart (launchd / systemd / Task Scheduler),
 * starts the background daemon, and creates `daemon.json` with a Pairing ID.
 */
export async function controlAgentDeckDaemon({
  action,
  profileName = 'web',
  dshHome = join(homedir(), '.dsh'),
  sourcePatchPath = null,
  dataDir = getAgentDeckDataDir(),
  platform = process.platform,
  packageManager = null,
} = {}) {
  if (!['start', 'stop', 'restart'].includes(action)) {
    throw new Error(`Unsupported daemon action: ${action}`);
  }

  let binaryPath = findAgentDeckDaemon({ dataDir, platform });
  if (!binaryPath && action === 'start') {
    const installed = await installAgentDeckDaemon({
      dataDir,
      platform,
      packageManager,
    });
    binaryPath = installed.binaryPath;
  }
  if (!binaryPath) {
    throw new Error(
      'Could not locate the `agentdeckd` executable. Click One-Click Setup first.',
    );
  }

  const res = await runCommand(binaryPath, [action], { timeoutMs: 30_000 });
  if (res.code !== 0) {
    const detail = (res.stderr || res.stdout || '').trim().slice(-400);
    throw new Error(
      `agentdeckd ${action} failed (exit ${res.code})${detail ? `: ${detail}` : ''}`,
    );
  }

  // Wait briefly for daemon.lock / daemon.json to settle
  const expectRunning = action !== 'stop';
  for (let i = 0; i < 10; i++) {
    const daemonState = await readDaemonState(dataDir, { platform });
    if (daemonState.running === expectRunning) break;
    await sleep(200);
  }

  const status = await getAgentDeckStatus({
    profileName,
    dshHome,
    sourcePatchPath,
    dataDir,
    platform,
  });

  return { ok: true, action, status };
}

/**
 * Upgrade the local `agentdeckd` installation using the package manager that
 * installed it, following AgentDeck's stop -> upgrade -> start workflow.
 * Never runs automatically on startup — only triggered explicitly by the user.
 */
export async function upgradeAgentDeckDaemon({
  profileName = 'web',
  dshHome = join(homedir(), '.dsh'),
  sourcePatchPath = null,
  dataDir = getAgentDeckDataDir(),
  platform = process.platform,
  env = process.env,
  home = homedir(),
  packageManager = null,
  runCommandImpl = runCommand,
} = {}) {
  const daemonBefore = await readDaemonState(dataDir, { platform, env, home });
  let binaryPath = daemonBefore.binaryPath;
  if (!binaryPath) {
    const installed = await installAgentDeckDaemon({
      dataDir,
      platform,
      env,
      home,
      packageManager,
    });
    clearDaemonVersionCaches();
    const status = await getAgentDeckStatus({
      profileName,
      dshHome,
      sourcePatchPath,
      dataDir,
      platform,
      env,
      home,
    });
    return {
      ok: true,
      method: installed.method,
      previousVersion: null,
      version: status.daemon.version,
      status,
    };
  }

  const method = daemonBefore.installMethod;
  if (!AUTO_UPDATABLE_METHODS.has(method)) {
    throw new Error(
      `Cannot auto-update agentdeckd installed at ${binaryPath} (${method}). Please update it manually.`,
    );
  }

  const wasRunning = daemonBefore.running;
  const previousVersion = daemonBefore.version;

  const waitForRunningState = async (expectRunning, attempts = 15) => {
    for (let i = 0; i < attempts; i++) {
      const check = await readDaemonState(dataDir, { platform, env, home });
      if (check.running === expectRunning) break;
      await sleep(200);
    }
  };

  if (wasRunning) {
    const stopRes = await runCommandImpl(binaryPath, ['stop'], {
      env,
      timeoutMs: 30_000,
    });
    if (stopRes.code !== 0) {
      const detail = (stopRes.stderr || stopRes.stdout || '').trim().slice(-400);
      throw new Error(
        `agentdeckd stop failed before upgrade (exit ${stopRes.code})${detail ? `: ${detail}` : ''}`,
      );
    }
    await waitForRunningState(false);
  }

  const runUpgradeCommand = async () => {
    if (method === 'local') {
      const cliDir = join(dataDir, 'cli');
      mkdirSync(cliDir, { recursive: true });
      if (packageManager?.command) {
        const res = await runCommandImpl(
          packageManager.command,
          [...(packageManager.args || []), 'add', 'agentdeckd@latest'],
          {
            cwd: cliDir,
            env: { ...env, ...(packageManager.env || {}) },
            timeoutMs: 180_000,
          },
        );
        if (res.code === 0) return;
        const detail = (res.stderr || res.stdout || '').trim().slice(-400);
        throw new Error(
          `Failed to upgrade agentdeckd via bundled package manager (exit ${res.code})${detail ? `: ${detail}` : ''}`,
        );
      }
      const npmBin = findExecutable('npm', { platform, env, home });
      if (!npmBin) {
        throw new Error('Could not find npm to upgrade local agentdeckd.');
      }
      const res = await runCommandImpl(
        npmBin,
        ['install', '--prefix', cliDir, 'agentdeckd@latest', '--include=optional'],
        { env, timeoutMs: 180_000 },
      );
      if (res.code !== 0) {
        const detail = (res.stderr || res.stdout || '').trim().slice(-400);
        throw new Error(
          `Failed to upgrade local agentdeckd via npm (exit ${res.code})${detail ? `: ${detail}` : ''}`,
        );
      }
      return;
    }

    if (method === 'homebrew') {
      const brewBin = findExecutable('brew', { platform, env, home });
      if (!brewBin) {
        throw new Error('Could not find Homebrew (`brew`) to upgrade agentdeckd.');
      }
      const brewEnv = { ...env, HOMEBREW_NO_ENV_HINTS: '1' };
      delete brewEnv.HOMEBREW_NO_AUTO_UPDATE;
      const res = await runCommandImpl(
        brewBin,
        ['upgrade', 'mantou132/tap/agentdeckd'],
        { env: brewEnv, timeoutMs: 240_000 },
      );
      if (res.code !== 0) {
        const detail = (res.stderr || res.stdout || '').trim().slice(-400);
        throw new Error(
          `brew upgrade failed (exit ${res.code})${detail ? `: ${detail}` : ''}`,
        );
      }
      return;
    }

    if (method === 'pnpm-global') {
      const pnpmBin = findExecutable('pnpm', { platform, env, home });
      if (pnpmBin) {
        const res = await runCommandImpl(
          pnpmBin,
          ['add', '-g', 'agentdeckd@latest'],
          { env, timeoutMs: 180_000 },
        );
        if (res.code !== 0) {
          const detail = (res.stderr || res.stdout || '').trim().slice(-400);
          throw new Error(
            `pnpm global upgrade failed (exit ${res.code})${detail ? `: ${detail}` : ''}`,
          );
        }
        return;
      }
    }

    if (method === 'npm-global' || method === 'pnpm-global') {
      const npmBin = findExecutable('npm', { platform, env, home });
      if (!npmBin) {
        throw new Error('Could not find npm to upgrade global agentdeckd.');
      }
      const res = await runCommandImpl(
        npmBin,
        ['install', '-g', 'agentdeckd@latest', '--include=optional'],
        { env, timeoutMs: 180_000 },
      );
      if (res.code !== 0) {
        const detail = (res.stderr || res.stdout || '').trim().slice(-400);
        throw new Error(
          `npm global upgrade failed (exit ${res.code})${detail ? `: ${detail}` : ''}`,
        );
      }
      return;
    }

    if (method === 'scoop') {
      const scoopBin = findExecutable('scoop', { platform, env, home });
      if (!scoopBin) {
        throw new Error('Could not find Scoop to upgrade agentdeckd.');
      }
      const res = await runCommandImpl(scoopBin, ['update', 'agentdeckd'], {
        env,
        timeoutMs: 180_000,
      });
      if (res.code !== 0) {
        const detail = (res.stderr || res.stdout || '').trim().slice(-400);
        throw new Error(
          `scoop update failed (exit ${res.code})${detail ? `: ${detail}` : ''}`,
        );
      }
    }
  };

  try {
    await runUpgradeCommand();
  } catch (err) {
    if (wasRunning) {
      try {
        const fallbackBin =
          findAgentDeckDaemon({ dataDir, platform, env, home }) || binaryPath;
        await runCommandImpl(fallbackBin, ['start'], { env, timeoutMs: 30_000 });
      } catch {
        // Best-effort restart of previous daemon on upgrade failure
      }
    }
    throw err;
  }

  clearDaemonVersionCaches();
  const nextBinaryPath =
    findAgentDeckDaemon({ dataDir, platform, env, home }) || binaryPath;

  if (wasRunning) {
    const startRes = await runCommandImpl(nextBinaryPath, ['start'], {
      env,
      timeoutMs: 30_000,
    });
    if (startRes.code !== 0) {
      const detail = (startRes.stderr || startRes.stdout || '').trim().slice(-400);
      throw new Error(
        `agentdeckd start failed after upgrade (exit ${startRes.code})${detail ? `: ${detail}` : ''}`,
      );
    }
    await waitForRunningState(true, 10);
  }

  const status = await getAgentDeckStatus({
    profileName,
    dshHome,
    sourcePatchPath,
    dataDir,
    platform,
    env,
    home,
  });

  return {
    ok: true,
    action: 'upgrade',
    method,
    previousVersion,
    version: status.daemon.version,
    status,
  };
}

export async function getAgentDeckStatus({
  profileName = 'web',
  dshHome = join(homedir(), '.dsh'),
  sourcePatchPath = null,
  dataDir = getAgentDeckDataDir(),
  platform = process.platform,
  env = process.env,
  home = homedir(),
} = {}) {
  const acpPatchPath = join(dshHome, 'profiles', 'acp', 'cordis.patch.yml');
  const customAgentsPath = join(dataDir, 'custom_agents.json');
  const dshCommand = resolveDshCommand({ platform, env, home });
  const acpPlugin = readAcpPluginState(dshHome);
  const sourceModel = extractModelSummary(sourcePatchPath);
  const acpModel = extractModelSummary(acpPatchPath);
  const customAgent = readCustomAgentState(customAgentsPath);
  const daemon = await readDaemonState(dataDir, { platform, env, home });

  const modelMismatch = Boolean(
    sourceModel.defaultModel &&
      acpModel.defaultModel &&
      (sourceModel.defaultModel.provider !== acpModel.defaultModel.provider ||
        sourceModel.defaultModel.model !== acpModel.defaultModel.model),
  );

  const acpNeedsProviderPin = Boolean(
    acpModel.defaultModel?.provider &&
      !BUILTIN_DEEPSEEK_PROVIDERS.has(acpModel.defaultModel.provider) &&
      acpModel.acpPlugin?.provider !== acpModel.defaultModel.provider,
  );

  const ready = Boolean(
    acpPlugin.installed &&
      customAgent.configured &&
      !acpNeedsProviderPin &&
      daemon.running &&
      daemon.pairedReady,
  );

  return {
    platform,
    profileName,
    dshHome,
    dshCommand,
    ready,
    acpPlugin,
    models: {
      source: sourceModel,
      acp: acpModel,
      mismatch: modelMismatch,
      acpNeedsProviderPin,
    },
    customAgent,
    daemon,
  };
}

export async function runAgentDeckSetup({
  profileName = 'web',
  dshHome = join(homedir(), '.dsh'),
  sourcePatchPath = null,
  dataDir = getAgentDeckDataDir(),
  syncModels = false,
  startDaemon = true,
  platform = process.platform,
  packageManager = null,
} = {}) {
  const steps = [];
  const dshCommand = resolveDshCommand({ platform });
  if (!dshCommand) {
    throw new Error(
      'Could not locate the `dsh` executable. Install DeepSeek Harness CLI or add `dsh` to your PATH.',
    );
  }

  // Step 1: Ensure interactive ACP adapter is installed in the `acp` profile
  const acpState = readAcpPluginState(dshHome);
  if (acpState.installed) {
    steps.push({
      id: 'acp-plugin',
      status: 'skipped',
      detail: `${acpState.packageName}@${acpState.version}`,
    });
  } else {
    const result = await runCommand(
      dshCommand,
      ['plugin', '--profile', 'acp', 'add', DEFAULT_ACP_PLUGIN],
      {
        env: { ...process.env, DSH_HOME: dshHome },
      },
    );
    if (result.code !== 0) {
      const detail = (result.stderr || result.stdout || '').trim().slice(-600);
      throw new Error(
        `Failed to install ${DEFAULT_ACP_PLUGIN} (exit ${result.code})${detail ? `: ${detail}` : ''}`,
      );
    }
    steps.push({
      id: 'acp-plugin',
      status: 'installed',
      detail: DEFAULT_ACP_PLUGIN,
    });
  }

  // Step 2: Sync model/provider config into `acp/cordis.patch.yml`
  const acpPatchPath = join(dshHome, 'profiles', 'acp', 'cordis.patch.yml');
  const syncResult = syncAcpPatch({
    sourcePatchPath,
    acpPatchPath,
    syncModels,
  });
  steps.push({
    id: 'model-sync',
    status: syncResult.changed ? 'updated' : 'unchanged',
    detail: acpPatchPath,
  });

  // Step 3: Upsert `dsh` entry in AgentDeck's `custom_agents.json`
  const customAgentsPath = join(dataDir, 'custom_agents.json');
  const entry = upsertCustomAgent({ customAgentsPath, dshCommand });
  steps.push({
    id: 'custom-agents',
    status: 'updated',
    detail: `${entry.command} ${entry.args.join(' ')}`,
  });

  // Step 4: Install `agentdeckd` if not already installed or running
  const daemonBefore = await readDaemonState(dataDir, { platform });
  let daemonBin = daemonBefore.binaryPath;
  if (daemonBefore.running) {
    steps.push({
      id: 'agentdeckd-install',
      status: 'skipped',
      detail: daemonBin || `running (PID ${daemonBefore.pid})`,
    });
    steps.push({
      id: 'agentdeckd-autostart',
      status: 'skipped',
      detail: `PID ${daemonBefore.pid}`,
    });
  } else {
    if (!daemonBin) {
      const installRes = await installAgentDeckDaemon({
        dataDir,
        platform,
        packageManager,
      });
      daemonBin = installRes.binaryPath;
      steps.push({
        id: 'agentdeckd-install',
        status: installRes.installed ? 'installed' : 'skipped',
        detail: `${installRes.method}: ${daemonBin}`,
      });
    } else {
      steps.push({
        id: 'agentdeckd-install',
        status: 'skipped',
        detail: daemonBin,
      });
    }

    // Step 5: Register autostart service & start `agentdeckd`
    if (!startDaemon) {
      steps.push({
        id: 'agentdeckd-autostart',
        status: 'skipped',
        detail: 'stopped by user',
      });
    } else {
    const startRes = await runCommand(daemonBin, ['start'], {
      timeoutMs: 30_000,
    });
    if (startRes.code !== 0) {
      const detail = (startRes.stderr || startRes.stdout || '').trim().slice(-400);
      throw new Error(
        `agentdeckd start failed (exit ${startRes.code})${detail ? `: ${detail}` : ''}`,
      );
    }
    for (let i = 0; i < 10; i++) {
      const check = await readDaemonState(dataDir, { platform });
      if (check.running && check.pairedReady) break;
      await sleep(200);
    }
    steps.push({
      id: 'agentdeckd-autostart',
      status: 'started',
      detail: 'autostart enabled',
    });
    }
  }

  const status = await getAgentDeckStatus({
    profileName,
    dshHome,
    sourcePatchPath,
    dataDir,
    platform,
  });

  return { ok: true, steps, status };
}

/**
 * Update `daemon.json` `awake` mode atomically (preserving `relay_id`, `relay_url`,
 * and `features`). A running `agentdeckd` automatically hot-reloads this setting.
 */
export async function setAgentDeckAwake({
  mode,
  profileName = 'web',
  dshHome = join(homedir(), '.dsh'),
  sourcePatchPath = null,
  dataDir = getAgentDeckDataDir(),
  platform = process.platform,
} = {}) {
  if (!AWAKE_MODES.includes(mode)) {
    throw new Error(`Invalid awake mode "${mode}". Expected one of: ${AWAKE_MODES.join(', ')}`);
  }

  const configPath = join(dataDir, 'daemon.json');
  let config = {};
  if (existsSync(configPath)) {
    try {
      const parsed = JSON.parse(readFileSync(configPath, 'utf8'));
      if (parsed && typeof parsed === 'object') config = parsed;
    } catch {
      throw new Error(`Invalid daemon config at ${configPath}`);
    }
  }
  config.awake = mode;
  writeFileAtomic(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });

  // If daemon is running, wait briefly for awake_status.json to reflect the new mode
  const awakeStatusPath = join(dataDir, 'awake_status.json');
  const lockPath = join(dataDir, 'daemon.lock');
  let runningPid = null;
  if (existsSync(lockPath)) {
    const p = Number.parseInt(readFileSync(lockPath, 'utf8').trim(), 10);
    if (isPidAlive(p)) runningPid = p;
  }
  if (runningPid) {
    for (let i = 0; i < 12; i++) {
      if (existsSync(awakeStatusPath)) {
        try {
          const st = JSON.parse(readFileSync(awakeStatusPath, 'utf8'));
          if (st?.pid === runningPid && st?.mode === mode) break;
        } catch {
          // Ignore transient read
        }
      }
      await sleep(100);
    }
  }

  const status = await getAgentDeckStatus({
    profileName,
    dshHome,
    sourcePatchPath,
    dataDir,
    platform,
  });
  return { ok: true, mode, status };
}

export async function syncAgentDeckModels({
  profileName = 'web',
  dshHome = join(homedir(), '.dsh'),
  sourcePatchPath = null,
  dataDir = getAgentDeckDataDir(),
  platform = process.platform,
} = {}) {
  const acpPatchPath = join(dshHome, 'profiles', 'acp', 'cordis.patch.yml');
  syncAcpPatch({ sourcePatchPath, acpPatchPath, syncModels: true });
  const status = await getAgentDeckStatus({
    profileName,
    dshHome,
    sourcePatchPath,
    dataDir,
    platform,
  });
  return { ok: true, status };
}
