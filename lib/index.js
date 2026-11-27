import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  controlAgentDeckDaemon,
  getAgentDeckStatus,
  runAgentDeckSetup,
} from './setup.js';

export const name = 'agentdeck';
export const inject = ['webServer'];

const STATUS_PATH = '/api/agentdeck/status';
const SETUP_PATH = '/api/agentdeck/setup';
const DAEMON_PATH = '/api/agentdeck/daemon';
const MAX_BODY_BYTES = 16 * 1024;

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(body);
}

function sendMethodNotAllowed(res, allow) {
  res.statusCode = 405;
  res.setHeader('allow', allow);
  res.setHeader('cache-control', 'no-store');
  res.end();
}

function readBoundedBody(req, maxBytes = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let exceeded = false;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        exceeded = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (exceeded) {
        resolve(null);
        return;
      }
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

async function parseJsonRequest(req, res) {
  const contentType = String(req.headers['content-type'] || '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase();
  if (contentType && contentType !== 'application/json') {
    sendJson(res, 415, {
      ok: false,
      error: 'content-type must be application/json',
    });
    return null;
  }

  let rawBody = '';
  try {
    rawBody = await readBoundedBody(req);
  } catch {
    sendJson(res, 400, { ok: false, error: 'request body unreadable' });
    return null;
  }
  if (rawBody === null) {
    sendJson(res, 413, { ok: false, error: 'request body too large' });
    return null;
  }

  if (!rawBody.trim()) return {};
  try {
    return JSON.parse(rawBody);
  } catch {
    sendJson(res, 400, { ok: false, error: 'invalid JSON body' });
    return null;
  }
}

function getProfileInfo(ctx) {
  const profile = ctx.get?.('profileContext');
  const dshHome =
    profile?.home || process.env.DSH_HOME || join(homedir(), '.dsh');
  const profileName = profile?.name || 'web';
  const sourcePatchPath =
    profile?.patchPath ||
    join(dshHome, 'profiles', profileName, 'cordis.patch.yml');
  const packageManager = profile?.packageManager || null;
  return { dshHome, profileName, sourcePatchPath, packageManager };
}

export function apply(ctx) {
  let opInFlight = null;

  const isRejected = (req, res) => {
    const connection = ctx.get?.('connection') ?? Reflect.get(ctx, 'connection');
    const rejection = connection?.requestRejection?.(req);
    if (rejection === undefined) return false;
    res.statusCode = rejection;
    res.end();
    return true;
  };

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: STATUS_PATH,
        handler: async (req, res) => {
          if (isRejected(req, res)) return;
          if (req.method !== 'GET') {
            sendMethodNotAllowed(res, 'GET');
            return;
          }
          try {
            const info = getProfileInfo(ctx);
            const status = await getAgentDeckStatus(info);
            sendJson(res, 200, status);
          } catch (err) {
            sendJson(res, 500, {
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        },
      }),
    `agentdeck: GET ${STATUS_PATH}`,
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: SETUP_PATH,
        handler: async (req, res) => {
          if (isRejected(req, res)) return;
          if (req.method !== 'POST') {
            sendMethodNotAllowed(res, 'POST');
            return;
          }
          const parsed = await parseJsonRequest(req, res);
          if (parsed === null) return;

          if (opInFlight) {
            sendJson(res, 409, {
              ok: false,
              error: 'Another AgentDeck operation is already in progress',
            });
            return;
          }

          const info = getProfileInfo(ctx);
          const task = runAgentDeckSetup({
            ...info,
            syncModels: Boolean(parsed?.syncModels),
          });
          opInFlight = task;
          try {
            const result = await task;
            sendJson(res, 200, result);
          } catch (err) {
            sendJson(res, 500, {
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            });
          } finally {
            if (opInFlight === task) opInFlight = null;
          }
        },
      }),
    `agentdeck: POST ${SETUP_PATH}`,
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: DAEMON_PATH,
        handler: async (req, res) => {
          if (isRejected(req, res)) return;
          if (req.method !== 'POST') {
            sendMethodNotAllowed(res, 'POST');
            return;
          }
          const parsed = await parseJsonRequest(req, res);
          if (parsed === null) return;

          const action = parsed?.action;
          if (!['start', 'stop', 'restart'].includes(action)) {
            sendJson(res, 400, {
              ok: false,
              error: 'action must be "start", "stop", or "restart"',
            });
            return;
          }

          if (opInFlight) {
            sendJson(res, 409, {
              ok: false,
              error: 'Another AgentDeck operation is already in progress',
            });
            return;
          }

          const info = getProfileInfo(ctx);
          const task = controlAgentDeckDaemon({ ...info, action });
          opInFlight = task;
          try {
            const result = await task;
            sendJson(res, 200, result);
          } catch (err) {
            sendJson(res, 500, {
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            });
          } finally {
            if (opInFlight === task) opInFlight = null;
          }
        },
      }),
    `agentdeck: POST ${DAEMON_PATH}`,
  );
}
