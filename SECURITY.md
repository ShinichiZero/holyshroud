# SECURITY.md — Digital Shroud PWA
## Threat Model (STRIDE Framework)

> Archdiocese of Turin · Digital Shroud PWA · Version 1.0 · March 2026

---

### Overview

The Digital Shroud PWA serves high-resolution imagery and forensic annotation data to anonymous pilgrims worldwide. It operates as a client-side-only application; there is no backend authentication, no user accounts, and no personal data collection ("Ethos of Silence"). The primary security concerns are **data integrity** (ensuring tile manifests and image sources are not tampered with) and **delivery hardening** (preventing injection, hijacking, or man-in-the-middle attacks on the client).

---

## STRIDE Threat Analysis

### 1. Spoofing

| # | Threat | Component | Mitigation |
|---|--------|-----------|------------|
| S-1 | Attacker serves a modified tile manifest claiming to be the official one | `/tiles/manifest.jws` | Manifest is signed with ECDSA P-256 (ES256/JWS). The embedded public key is verified client-side via Web Crypto API before the viewer initialises. A tampered manifest will fail signature verification. |
| S-2 | DNS spoofing / CDN compromise serves a malicious OSD build | CDN `<script>` tag | Subresource Integrity (SRI) with `sha384` hash on the OpenSeadragon CDN script. Any altered file will be blocked by the browser. `crossorigin="anonymous"` is required for SRI to apply. |
| S-3 | Fake service worker registered by a third-party script | `sw.js` registration | The SW is scoped to `/` and registered from the same origin. The SW itself checks `self.location.origin` on activate; insecure origins trigger Snapshot Lockdown. |

### 2. Tampering

| # | Threat | Component | Mitigation |
|---|--------|-----------|------------|
| T-1 | Tile manifest altered in transit (MITM) | `/tiles/manifest.jws` | JWS signature verification (see S-1). Only served over HTTPS. |
| T-2 | In-transit modification of HTML/JS/CSS | All assets | HTTPS with HSTS (configure at server level). Service worker caches verified responses. |
| T-3 | Malicious cache injection via a compromised SW | Cache storage | Snapshot Lockdown: if an unexpected SW is detected or a lockdown message is received, all caches are flushed and clients hard-reload from the secure origin. |
| T-4 | DOM injection via XSS | HTML template | Strict CSP: `default-src 'self'`; `script-src 'self' cdn.jsdelivr.net`. `require-trusted-types-for 'script'` enforces TrustedHTML/TrustedScriptURL policies. Hotspot labels are set via `textContent`, not `innerHTML`. Annotation content uses `textContent` / `innerHTML` for `<cite>` only via the `default` Trusted Types policy. |

### 3. Repudiation

| # | Threat | Component | Mitigation |
|---|--------|-----------|------------|
| R-1 | Denial that a specific tile manifest version was served | Manifest | The JWS `timestamp` field in the payload provides a signed timestamp. The `custodian` field records the issuing authority. |
| R-2 | Client-side manipulation going undetected | App state | `verifyIntegrity()` logs a timestamped pass/fail to the browser console. Future versions should forward this to a transparency log. |

### 4. Information Disclosure

| # | Threat | Component | Mitigation |
|---|--------|-----------|------------|
| I-1 | User behaviour / browsing data leaked to third parties | All | Zero telemetry policy ("Ethos of Silence"). No analytics, no third-party fonts, no tracking pixels, no cookies. |
| I-2 | Sensitive system information exposed in error messages | `integrity.js`, `app.js` | Error messages are generic (do not expose key material, file paths, or stack traces to end users). Full errors are console-only. |
| I-3 | Private key exposure | Key management | Only the ECDSA public key is embedded in the client. The private key is held offline by the Archdiocese of Turin and used solely for manifest signing at build time. |

### 5. Denial of Service

| # | Threat | Component | Mitigation |
|---|--------|-----------|------------|
| D-1 | High-bandwidth tile requests exhausting origin server | Tile CDN | `Cache-First` caching in the service worker ensures tiles are served locally after the first visit. First 50 tiles are pre-populated on install for "First Meaningful Paint" without hitting the origin. |
| D-2 | Service worker preventing updates (cache poisoning) | `SHELL_CACHE` | `Stale-While-Revalidate` revalidates shell assets in the background. SW versioning (`CACHE_VERSION`) invalidates old caches on each deployment. |
| D-3 | iOS 7-day storage eviction clearing cached tiles | Cache storage | Periodic Background Sync (`shroud-refresh`) refreshes the `last-active` timestamp. Fallback: `localStorage.shroud-last-active` is updated on every page load. |

### 6. Elevation of Privilege

| # | Threat | Component | Mitigation |
|---|--------|-----------|------------|
| E-1 | Script injection gaining access to crypto keys | `integrity.js` | The ECDSA public key is read-only embedded data. No private key exists on the client. Strict CSP prevents unauthorised script execution. |
| E-2 | Malicious SW gaining full network interception | `sw.js` | SW scope is narrowly set to `/`. The `check-sw` lockdown mechanism flushes caches and reloads clients if a rogue SW is detected. SW update checks run on every navigation. |
| E-3 | Attacker escalating from content injection to SW registration | Service Worker API | The manifest `scope` is restricted to the app origin. HTTPS is required for SW registration; HTTP origins are blocked at the `activate` handler. |

---

## Security Controls Summary

| Control | Implementation |
|---------|---------------|
| **Transport security** | HTTPS required (enforced by SW activate check) |
| **Content Security Policy** | Strict CSP with `default-src 'self'`, SRI for CDN |
| **Trusted Types** | `require-trusted-types-for 'script'` with default policy |
| **Subresource Integrity** | SHA-384 on OpenSeadragon CDN script |
| **Data signing** | ECDSA P-256 / ES256 JWS on tile manifest |
| **Cache security** | Versioned caches + Snapshot Lockdown flush |
| **Privacy** | Zero telemetry; no cookies; no third-party resources |
| **Offline integrity** | SW pre-caches and re-verifies manifest on reactivation |

---

## Out of Scope (Server-Side)

The following controls are required at the HTTP server / CDN layer and are outside the scope of this client-side application:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (or `Content-Security-Policy: frame-ancestors 'none'`)
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- Certificate Transparency monitoring
- DNSSEC for the application domain

---

## Vulnerability Disclosure

To report a security vulnerability, contact the Archdiocese of Turin digital team at the address published on the official Shroud of Turin website. Please do not open public GitHub issues for security vulnerabilities.
