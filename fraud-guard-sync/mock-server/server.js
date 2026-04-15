const http = require('http');
const crypto = require('crypto');

const PORT = 54321;

// In-memory state
const passportCodes = new Map();  // code -> { owner, claimed: bool, deviceToken, revokedAt }
const events = [];
const devices = new Map();  // deviceToken -> { code, lastSeenAt }

// Seed a test passport code
const TEST_CODE = 'ABCD1234';
passportCodes.set(TEST_CODE, {
  owner: 'test-user',
  claimed: false,
  deviceToken: null,
  revokedAt: null,
  expiresAt: Date.now() + 48 * 60 * 60 * 1000,
});

console.log(`\n  Test passport code: ${TEST_CODE}\n`);

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  console.log(`${req.method} ${path}`);

  // ── claim-passport ──
  if (path === '/functions/v1/claim-passport' && req.method === 'POST') {
    const body = await parseBody(req);
    const code = body.code;
    const deviceInfo = body.device_info || 'unknown';

    if (!code) return json(res, 400, { error: 'missing_code' });

    const passport = passportCodes.get(code);
    if (!passport) return json(res, 400, { error: 'invalid' });
    if (passport.revokedAt) return json(res, 400, { error: 'revoked' });
    if (passport.expiresAt < Date.now()) return json(res, 400, { error: 'expired' });
    if (passport.claimed) return json(res, 400, { error: 'already_claimed' });

    const deviceToken = crypto.randomUUID();
    passport.claimed = true;
    passport.deviceToken = deviceToken;

    devices.set(deviceToken, { code, lastSeenAt: Date.now(), deviceInfo });

    console.log(`  ✓ Claimed! device_token=${deviceToken.slice(0, 8)}...`);
    return json(res, 200, { device_token: deviceToken });
  }

  // ── sync-saaya-event ──
  if (path === '/functions/v1/sync-saaya-event' && req.method === 'POST') {
    const deviceToken = req.headers['x-device-token'];
    if (!deviceToken || !devices.has(deviceToken)) {
      return json(res, 401, { error: 'invalid_device_token' });
    }

    const device = devices.get(deviceToken);
    const passport = passportCodes.get(device.code);
    if (passport?.revokedAt) return json(res, 403, { error: 'revoked' });

    const body = await parseBody(req);
    const eventId = crypto.randomUUID();

    // Dedup by client_event_id
    const existing = events.find(e => e.client_event_id === body.client_event_id);
    if (existing) {
      console.log(`  ↩ Dedup: ${body.client_event_id}`);
      return json(res, 200, { event_id: existing.id });
    }

    const event = { id: eventId, ...body, synced_at: new Date().toISOString() };
    events.push(event);
    device.lastSeenAt = Date.now();

    console.log(`  ✓ Event: ${body.sensitive_app_name} (${body.call_type})`);
    return json(res, 200, { event_id: eventId });
  }

  // ── heartbeat ──
  if (path === '/functions/v1/heartbeat' && req.method === 'POST') {
    const deviceToken = req.headers['x-device-token'];
    if (!deviceToken || !devices.has(deviceToken)) {
      return json(res, 401, { error: 'invalid_device_token' });
    }

    devices.get(deviceToken).lastSeenAt = Date.now();
    console.log(`  ✓ Heartbeat from ${deviceToken.slice(0, 8)}...`);
    return json(res, 200, { ok: true });
  }

  // ── Admin: list state (for debugging) ──
  if (path === '/admin/state' && req.method === 'GET') {
    return json(res, 200, {
      passportCodes: Object.fromEntries(passportCodes),
      devices: Object.fromEntries(devices),
      events,
    });
  }

  // ── Admin: create a new passport code ──
  if (path === '/admin/create-code' && req.method === 'POST') {
    const body = await parseBody(req);
    const code = body.code || crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
    passportCodes.set(code, {
      owner: 'test-user',
      claimed: false,
      deviceToken: null,
      revokedAt: null,
      expiresAt: Date.now() + 48 * 60 * 60 * 1000,
    });
    console.log(`  ✓ Created code: ${code}`);
    return json(res, 200, { code });
  }

  // ── Admin: revoke a passport code ──
  if (path === '/admin/revoke' && req.method === 'POST') {
    const body = await parseBody(req);
    const passport = passportCodes.get(body.code);
    if (!passport) return json(res, 404, { error: 'not_found' });
    passport.revokedAt = Date.now();
    console.log(`  ✓ Revoked: ${body.code}`);
    return json(res, 200, { ok: true });
  }

  json(res, 404, { error: 'not_found' });
});

server.listen(PORT, () => {
  console.log(`Mock Supabase server running on http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  POST /functions/v1/claim-passport      { code, device_info }`);
  console.log(`  POST /functions/v1/sync-saaya-event     x-device-token header + event body`);
  console.log(`  POST /functions/v1/heartbeat            x-device-token header`);
  console.log(`\nAdmin:`);
  console.log(`  GET  /admin/state                       View all state`);
  console.log(`  POST /admin/create-code                 { code? } Create new passport`);
  console.log(`  POST /admin/revoke                      { code } Revoke a passport`);
  console.log('');
});
