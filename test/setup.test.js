import assert from 'node:assert/strict';
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  buildPairingUri,
  findAgentDeckDaemon,
  generatePairingQrSvg,
  getAgentDeckStatus,
  setAgentDeckAwake,
  syncAcpPatch,
  upsertCustomAgent,
} from '../lib/setup.js';

test('buildPairingUri omits default and legacy relays, includes custom relay', () => {
  assert.equal(
    buildPairingUri('adk1_test123'),
    'agentdeck://connect?pairingId=adk1_test123',
  );
  assert.equal(
    buildPairingUri('adk1_test123', 'wss://agentdeck.xianqiao.wang/ws'),
    'agentdeck://connect?pairingId=adk1_test123',
  );
  assert.equal(
    buildPairingUri('adk1_test123', 'wss://agent-deck.xianqiao.wang/ws'),
    'agentdeck://connect?pairingId=adk1_test123',
  );
  assert.equal(
    buildPairingUri('adk1_test123', 'wss://relay.example/ws'),
    'agentdeck://connect?pairingId=adk1_test123&relayUrl=wss%3A%2F%2Frelay.example%2Fws',
  );
});

test('generatePairingQrSvg produces valid SVG', async () => {
  const svg = await generatePairingQrSvg(
    'agentdeck://connect?pairingId=adk1_sample',
  );
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('</svg>'));
});

test('findAgentDeckDaemon locates binary in local fallback prefix', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adk-dsh-bin-'));
  try {
    const binDir = join(dir, 'cli', 'node_modules', '.bin');
    mkdirSync(binDir, { recursive: true });
    const binPath = join(binDir, 'agentdeckd');
    writeFileSync(binPath, '#!/bin/sh\necho ok\n');
    chmodSync(binPath, 0o755);

    const found = findAgentDeckDaemon({
      dataDir: dir,
      platform: 'darwin',
      env: { PATH: '' },
      home: dir,
    });
    assert.equal(found, binPath);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('syncAcpPatch syncs non-DeepSeek model, pins acp-plugin, and preserves !!js entries', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adk-dsh-sync-'));
  try {
    const sourcePatch = join(dir, 'web.patch.yml');
    const acpPatch = join(dir, 'acp.patch.yml');

    writeFileSync(
      sourcePatch,
      `- id: llm-pi-ai
  config:
    providers:
      openrouter:
        apiKeyEnv: OPENROUTER_API_KEY
        api: openai-completions
        baseURL: https://openrouter.ai/api/v1
- id: agent-default-model
  config:
    provider: openrouter
    model: openrouter/free
`,
    );

    writeFileSync(
      acpPatch,
      `- id: custom-dynamic
  config:
    expr: !!js process.env.MY_FLAG
- id: permission
  config:
    defaultPreset: workspace-write
`,
    );

    const res = syncAcpPatch({
      sourcePatchPath: sourcePatch,
      acpPatchPath: acpPatch,
      syncModels: false,
    });
    assert.equal(res.changed, true);
    assert.equal(res.syncedFromSource, true);

    const out = readFileSync(acpPatch, 'utf8');
    assert.ok(out.includes('!!js'));
    assert.ok(out.includes('permission'));
    assert.ok(out.includes('id: llm-pi-ai'));
    assert.ok(out.includes('id: agent-default-model'));
    assert.ok(out.includes('id: acp-plugin'));
    assert.ok(out.includes('provider: openrouter'));
    assert.ok(out.includes('model: openrouter/free'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('syncAcpPatch preserves existing acp model when syncModels is false', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adk-dsh-preserve-'));
  try {
    const sourcePatch = join(dir, 'desktop.patch.yml');
    const acpPatch = join(dir, 'acp.patch.yml');

    writeFileSync(
      sourcePatch,
      `- id: agent-default-model
  config:
    provider: deepseek-account
    model: deepseek-flash
`,
    );

    writeFileSync(
      acpPatch,
      `- id: agent-default-model
  config:
    provider: openrouter
    model: openrouter/free
`,
    );

    const res = syncAcpPatch({
      sourcePatchPath: sourcePatch,
      acpPatchPath: acpPatch,
      syncModels: false,
    });
    assert.equal(res.syncedFromSource, false);
    assert.equal(res.changed, true);

    const out = readFileSync(acpPatch, 'utf8');
    assert.ok(out.includes('provider: openrouter'));
    assert.ok(!out.includes('deepseek-account'));
    assert.ok(out.includes('id: acp-plugin'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('upsertCustomAgent preserves existing entries and updates dsh', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adk-dsh-agents-'));
  try {
    const file = join(dir, 'custom_agents.json');
    writeFileSync(
      file,
      JSON.stringify({
        agents: [{ id: 'other', name: 'Other', command: 'other-bin', args: [] }],
      }),
    );

    upsertCustomAgent({ customAgentsPath: file, dshCommand: '/usr/local/bin/dsh' });
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(parsed.agents.length, 2);
    assert.equal(parsed.agents[0].id, 'other');
    assert.deepEqual(parsed.agents[1], {
      id: 'dsh',
      name: 'DeepSeek Harness',
      command: '/usr/local/bin/dsh',
      args: ['--profile', 'acp'],
    });

    upsertCustomAgent({ customAgentsPath: file, dshCommand: '/opt/dsh' });
    const parsed2 = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(parsed2.agents.length, 2);
    assert.equal(parsed2.agents[1].command, '/opt/dsh');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('getAgentDeckStatus reads daemon.json, lock PID, and acp plugin state', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adk-dsh-status-'));
  try {
    const dshHome = join(dir, '.dsh');
    const dataDir = join(dir, 'agentdeck');
    mkdirSync(
      join(dshHome, 'profiles', 'acp', 'node_modules', '@openma', 'deepseek-harness-acp'),
      { recursive: true },
    );
    mkdirSync(dataDir, { recursive: true });

    writeFileSync(
      join(dshHome, 'profiles', 'acp', 'package.json'),
      JSON.stringify({
        dependencies: { '@openma/deepseek-harness-acp': '^0.4.43' },
      }),
    );
    writeFileSync(
      join(
        dshHome,
        'profiles',
        'acp',
        'node_modules',
        '@openma',
        'deepseek-harness-acp',
        'package.json',
      ),
      JSON.stringify({ name: '@openma/deepseek-harness-acp', version: '0.4.43' }),
    );
    writeFileSync(
      join(dataDir, 'daemon.json'),
      JSON.stringify({ relay_id: 'adk1_mock_pairing_id_123456' }),
    );
    writeFileSync(join(dataDir, 'daemon.lock'), `${process.pid}\n`);
    writeFileSync(
      join(dataDir, 'custom_agents.json'),
      JSON.stringify({
        agents: [
          { id: 'dsh', name: 'DeepSeek Harness', command: '/usr/local/bin/dsh', args: ['--profile', 'acp'] },
        ],
      }),
    );

    const status = await getAgentDeckStatus({ dshHome, dataDir });
    assert.equal(status.acpPlugin.installed, true);
    assert.equal(status.acpPlugin.version, '0.4.43');
    assert.equal(status.customAgent.configured, true);
    assert.equal(status.daemon.running, true);
    assert.equal(status.daemon.pairedReady, true);
    assert.ok(status.daemon.qrSvg.includes('<svg'));
    assert.equal(status.ready, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('setAgentDeckAwake updates daemon.json awake mode while preserving pairing config', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adk-dsh-awake-'));
  try {
    const dshHome = join(dir, '.dsh');
    const dataDir = join(dir, 'agentdeck');
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(
      join(dataDir, 'daemon.json'),
      JSON.stringify({
        relay_id: 'adk1_keep_me',
        relay_url: 'wss://relay.example/ws',
        awake: 'never',
      }),
    );
    writeFileSync(join(dataDir, 'daemon.lock'), `${process.pid}\n`);
    writeFileSync(
      join(dataDir, 'awake_status.json'),
      JSON.stringify({ pid: process.pid, mode: 'plugged', on: true, error: null }),
    );

    const res = await setAgentDeckAwake({ mode: 'plugged', dshHome, dataDir });
    assert.equal(res.ok, true);
    assert.equal(res.status.daemon.awake.mode, 'plugged');
    assert.equal(res.status.daemon.awake.active, true);

    const saved = JSON.parse(readFileSync(join(dataDir, 'daemon.json'), 'utf8'));
    assert.equal(saved.relay_id, 'adk1_keep_me');
    assert.equal(saved.relay_url, 'wss://relay.example/ws');
    assert.equal(saved.awake, 'plugged');

    await assert.rejects(
      () => setAgentDeckAwake({ mode: 'invalid', dshHome, dataDir }),
      /Invalid awake mode/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
