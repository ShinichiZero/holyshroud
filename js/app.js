/**
 * app.js — Digital Shroud PWA — Main Application
 *
 * Boot sequence:
 *  1. Register service worker
 *  2. Call verifyIntegrity() — blocks viewer init until JWS checks pass
 *  3. Initialise OpenSeadragon with the verified tile sources
 *  4. Render hotspot annotations
 *  5. Wire layer-toggle buttons
 *  6. Handle URL param ?layer=<name> on launch
 */
(function () {
  'use strict';

  /* -------------------------------------------------------------------------
   * Constants
   * ------------------------------------------------------------------------- */
  const LAYER_FILTERS = {
    visible:  '',
    negative: 'invert(1) sepia(0.2) hue-rotate(180deg)',
    forensic: 'contrast(220%) brightness(0.75) sepia(0.4) hue-rotate(200deg)'
  };

  // Placeholder tile source used when real gigapixel tiles are not yet deployed.
  // In production, replace with a real DZI endpoint or IIIF manifest URL.
  const PLACEHOLDER_TILE_SOURCE = {
    type: 'image',
    url: 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="2400" viewBox="0 0 1200 2400">
        <rect width="1200" height="2400" fill="#1A1410"/>
        <rect x="440" y="80"  width="320" height="2240" rx="10" fill="#2D2018" opacity="0.9"/>
        <rect x="200" y="480" width="800" height="320"  rx="10" fill="#2D2018" opacity="0.9"/>
        <text x="600" y="1260" font-family="serif" font-size="48" fill="#6B5030"
              text-anchor="middle" dominant-baseline="middle">
          Gigapixel tiles load here
        </text>
        <text x="600" y="1320" font-family="serif" font-size="24" fill="#4A3820"
              text-anchor="middle" dominant-baseline="middle">
          Place DZI tile sources in /tiles/
        </text>
      </svg>
    `)
  };

  /* -------------------------------------------------------------------------
   * Utility: update loading status text
   * ------------------------------------------------------------------------- */
  function setStatus(msg) {
    const el = document.getElementById('loading-status');
    if (el) el.textContent = msg;
  }

  /* -------------------------------------------------------------------------
   * Service Worker Registration
   * ------------------------------------------------------------------------- */
  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register('sw.js', { scope: '/' });
      console.log('[SW] Registered, scope:', reg.scope);

      // Periodic Background Sync — refresh last-active to bypass iOS 7-day eviction
      if ('periodicSync' in reg) {
        try {
          await reg.periodicSync.register('shroud-refresh', { minInterval: 24 * 60 * 60 * 1000 });
          console.log('[SW] Periodic sync registered');
        } catch {
          // periodicSync requires permission; fall back to last-active timestamp
          localStorage.setItem('shroud-last-active', Date.now().toString());
        }
      } else {
        // Fallback: touch a timestamp so iOS doesn't evict caches
        localStorage.setItem('shroud-last-active', Date.now().toString());
      }
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
    }

    // Snapshot Lockdown: listen for SW-issued lockdown messages
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'lockdown') {
        console.error('[Lockdown] SW security lockdown triggered:', event.data.reason);
        // Flush all client-side state and hard-reload from secure origin
        caches.keys().then(names => Promise.all(names.map(n => caches.delete(n)))).finally(() => {
          location.replace(location.origin + '/');
        });
      }
      if (event.data?.type === 'last-active-refresh') {
        localStorage.setItem('shroud-last-active', Date.now().toString());
      }
    });
  }

  /* -------------------------------------------------------------------------
   * Layer Toggle
   * ------------------------------------------------------------------------- */
  let currentLayer = 'visible';

  function applyLayer(layer, viewer) {
    if (!LAYER_FILTERS.hasOwnProperty(layer)) return;
    currentLayer = layer;

    const osdEl = document.getElementById('osd-viewer');
    // Remove all layer classes and apply the new one
    Object.keys(LAYER_FILTERS).forEach(l => osdEl.classList.remove(`layer-${l}`));
    osdEl.classList.add(`layer-${layer}`);

    // Also apply the filter directly to each OSD canvas for browsers
    // that don't support CSS class-based canvas filter
    const canvases = osdEl.querySelectorAll('canvas');
    canvases.forEach(c => { c.style.filter = LAYER_FILTERS[layer]; });

    // Update button states
    document.querySelectorAll('.layer-btn').forEach(btn => {
      const active = btn.dataset.layer === layer;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function wireLayerButtons(viewer) {
    document.querySelectorAll('.layer-btn').forEach(btn => {
      btn.addEventListener('click', () => applyLayer(btn.dataset.layer, viewer));
    });
  }

  /* -------------------------------------------------------------------------
   * OSD Viewer Initialisation
   * ------------------------------------------------------------------------- */
  function initViewer(manifest) {
    // Derive tile source from verified manifest or fall back to placeholder
    let tileSource = PLACEHOLDER_TILE_SOURCE;
    if (manifest?.tileSources?.visible) {
      tileSource = manifest.tileSources.visible;
    }

    if (typeof OpenSeadragon === 'undefined') {
      throw new Error('OpenSeadragon not loaded. Check CDN SRI or network.');
    }

    const viewer = OpenSeadragon({
      id: 'osd-viewer',
      tileSources: tileSource,
      prefixUrl: 'https://cdn.jsdelivr.net/npm/openseadragon@4.1.0/build/openseadragon/images/',
      showNavigator: true,
      navigatorPosition: 'BOTTOM_RIGHT',
      navigatorSizeRatio: 0.15,
      animationTime: 0.6,
      blendTime: 0.1,
      constrainDuringPan: true,
      maxZoomPixelRatio: 4,
      minZoomImageRatio: 0.8,
      visibilityRatio: 0.7,
      zoomPerScroll: 1.2,
      showRotationControl: false,
      immediateRender: false,
      wrapHorizontal: false,
      wrapVertical: false,
      defaultZoomLevel: 0,
      gestureSettingsTouch: {
        scrolltozoom: false,
        clicktozoom: true,
        pinchtozoom: true,
        flickenabled: true,
        flickminspeed: 20,
        flickmomentum: 0.4
      }
    });

    viewer.addHandler('open', () => {
      // Apply the initial layer CSS class
      applyLayer(currentLayer, viewer);
      // Hook canvas filter re-apply after OSD draws new tiles
      viewer.addHandler('tile-drawn', () => {
        const canvases = document.querySelectorAll('#osd-viewer canvas');
        canvases.forEach(c => { c.style.filter = LAYER_FILTERS[currentLayer]; });
      });
    });

    return viewer;
  }

  /* -------------------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------------------- */
  async function boot() {
    // Register SW immediately — do not block on it
    registerServiceWorker();

    // Read initial layer from URL param
    const params = new URLSearchParams(location.search);
    if (params.has('layer') && LAYER_FILTERS.hasOwnProperty(params.get('layer'))) {
      currentLayer = params.get('layer');
    }

    setStatus('Verifying Shroud integrity…');

    let manifest = null;

    try {
      manifest = await window.__shroudIntegrity.verifyIntegrity();
      setStatus('Verification Passed: Shroud Integrity Confirmed');
    } catch (err) {
      console.error('[Integrity] Verification error:', err);
      setStatus(`Integrity check failed — viewer blocked. (${err.message})`);
      // Integrity failure is terminal: block viewer initialisation to prevent
      // display of potentially tampered content. Do not proceed.
      return;
    }

    // Initialise OpenSeadragon
    let viewer;
    try {
      viewer = initViewer(manifest);
    } catch (err) {
      console.error('[OSD] Initialisation failed:', err);
      setStatus(`Viewer error: ${err.message}`);
      return;
    }

    // Render hotspots with verified manifest positions
    if (window.__shroudHotspots) {
      window.__shroudHotspots.renderHotspots(manifest);
    }

    // Wire layer buttons
    wireLayerButtons(viewer);

    // Show the app, fade out loading screen
    document.getElementById('app').removeAttribute('hidden');
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('fade-out');
    loadingScreen.addEventListener('transitionend', () => loadingScreen.remove(), { once: true });
  }

  // Wait for DOM + deferred scripts
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
