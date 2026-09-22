const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

// Verify locally with Google's rotating public keys, never trust decoded claims alone.
function createGoogleVerifier({ fetchKeys = globalThis.fetch, now = Date.now } = {}) {
  let keys = new Map(), expiresAt = 0, lastFetch = 0, pending;
  async function refresh() {
    if (pending) return pending;
    pending = (async () => {
      lastFetch = now();
      const response = await fetchKeys('https://www.googleapis.com/oauth2/v3/certs', {
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) throw new Error('Google public keys unavailable');
      const data = await response.json();
      const next = new Map();
      for (const key of data.keys || []) {
        if (key.kty === 'RSA' && key.use === 'sig' && key.alg === 'RS256' && key.kid) {
          next.set(key.kid, crypto.createPublicKey({ key, format: 'jwk' }));
        }
      }
      if (!next.size) throw new Error('Google public keys unavailable');
      keys = next;
      const maxAge = Number((response.headers.get('cache-control') || '').match(/max-age=(\d+)/)?.[1] || 300);
      expiresAt = now() + Math.min(maxAge, 3600) * 1000;
    })().finally(() => { pending = null; });
    return pending;
  }
  return async function verifyGoogleCredential(credential, clientId) {
    if (!clientId || typeof credential !== 'string' || credential.length > 8192) throw new Error('Invalid Google credential');
    const decoded = jwt.decode(credential, { complete: true });
    if (!decoded || decoded.header.alg !== 'RS256' || typeof decoded.header.kid !== 'string') throw new Error('Invalid Google credential');
    if (now() >= expiresAt || (!keys.has(decoded.header.kid) && now() - lastFetch > 60_000)) await refresh();
    const key = keys.get(decoded.header.kid);
    if (!key) throw new Error('Unknown Google signing key');
    const payload = jwt.verify(credential, key, {
      algorithms: ['RS256'], audience: clientId,
      issuer: ['accounts.google.com', 'https://accounts.google.com'],
      clockTimestamp: Math.floor(now() / 1000)
    });
    if (!Number.isFinite(payload.exp) || typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 255) throw new Error('Invalid Google identity');
    if (payload.email_verified !== true || typeof payload.email !== 'string' || payload.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) throw new Error('Unverified Google email');
    return payload;
  };
}

module.exports = { createGoogleVerifier };
