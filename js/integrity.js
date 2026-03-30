/**
 * integrity.js — JWS Signature Verification
 *
 * Verifies the tile manifest against an ECDSA P-256 public key (ES256/JWS).
 * The public key and signed manifest are embedded at build time; this module
 * must resolve before the OSD viewer is allowed to initialise.
 *
 * No external network calls are made; the public key is bundled with the app.
 *
 * Exports: window.__shroudIntegrity = { verifyIntegrity }
 */
(function () {
  'use strict';

  /* -------------------------------------------------------------------------
   * Embedded ECDSA P-256 Public Key (JWK)
   * Generated offline; private key is never shipped with the client.
   * ------------------------------------------------------------------------- */
  const PUBLIC_KEY_JWK = {
    key_ops: ['verify'],
    ext: true,
    kty: 'EC',
    x: 'rDcQ-oka01IAVebIGkRvzjPUdu8sJrWHgbDIj_r3EVI',
    y: 'yoF-h2aRk1r9J5NMsLPmOUYWhDZqIcx8i6rmdNi57_o',
    crv: 'P-256'
  };

  /* -------------------------------------------------------------------------
   * Base64URL helpers
   * ------------------------------------------------------------------------- */
  function base64urlDecode(str) {
    const base64 = str
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(str.length + (4 - (str.length % 4)) % 4, '=');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function base64urlDecodeToString(str) {
    return new TextDecoder().decode(base64urlDecode(str));
  }

  /* -------------------------------------------------------------------------
   * verifyIntegrity()
   *
   * 1. Fetches /tiles/manifest.jws
   * 2. Parses the Compact JWS (header.payload.signature) or JSON JWS
   * 3. Imports the embedded public key via SubtleCrypto
   * 4. Verifies the ES256 signature
   * 5. Returns the decoded manifest payload on success
   * ------------------------------------------------------------------------- */
  async function verifyIntegrity() {
    // Step 1 – fetch the signed manifest
    const response = await fetch('tiles/manifest.jws', { credentials: 'same-origin' });
    if (!response.ok) {
      throw new Error(`Failed to fetch tile manifest: HTTP ${response.status}`);
    }

    const jws = await response.json();

    // Step 2 – parse JWS parts
    const { protected: headerB64, payload: payloadB64, signature: sigB64 } = jws;
    if (!headerB64 || !payloadB64 || !sigB64) {
      throw new Error('Malformed JWS: missing protected, payload, or signature field');
    }

    // Step 3 – decode and validate header
    let header;
    try {
      header = JSON.parse(base64urlDecodeToString(headerB64));
    } catch {
      throw new Error('JWS header is not valid JSON');
    }

    if (header.alg !== 'ES256') {
      throw new Error(`Unsupported JWS algorithm: ${header.alg}. Expected ES256.`);
    }

    // Step 4 – import public key
    let cryptoKey;
    try {
      cryptoKey = await crypto.subtle.importKey(
        'jwk',
        PUBLIC_KEY_JWK,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify']
      );
    } catch (err) {
      throw new Error(`Failed to import public key: ${err.message}`);
    }

    // Step 5 – verify signature
    const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64urlDecode(sigB64);

    const valid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      cryptoKey,
      signature,
      signingInput
    );

    if (!valid) {
      throw new Error('JWS signature verification FAILED — manifest may have been tampered with');
    }

    // Step 6 – decode and return manifest
    let manifest;
    try {
      manifest = JSON.parse(base64urlDecodeToString(payloadB64));
    } catch {
      throw new Error('JWS payload is not valid JSON');
    }

    console.log('%c✔ Verification Passed: Shroud Integrity Confirmed', 'color:#D4AF37;font-weight:bold;');
    return manifest;
  }

  // Expose on window so app.js can call it without module imports
  window.__shroudIntegrity = { verifyIntegrity };
}());
