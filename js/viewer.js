/**
 * Viewer JS - Santa Sindone
 * OpenSeadragon initialization with resilient multi-source fallback.
 */
(function () {
  'use strict';

  var viewerContainer = document.getElementById('osd-viewer');
  if (!viewerContainer) return;

  var infoSource = document.getElementById('viewer-info-source');
  var infoRes = document.getElementById('viewer-info-res');

  var sourceConfigs = buildSourceConfigs();
  var activeSourceIndex = -1;
  var activeLoadNonce = 0;
  var viewer = null;

  if (typeof OpenSeadragon === 'undefined') {
    showError(localizedText({
      it: 'OpenSeadragon non e stato caricato. Controlla la connessione internet.',
      en: 'OpenSeadragon failed to load. Check your internet connection.',
      la: 'OpenSeadragon onerari non potuit. Conexionem interretialem inspice.'
    }));
    return;
  }

  if (sourceConfigs.length === 0) {
    showError(localizedText({
      it: 'Nessuna sorgente immagine disponibile.',
      en: 'No image source is available.',
      la: 'Nullus fons imaginis praesto est.'
    }));
    return;
  }

  loadSourceAt(0);

  function getMetaContent(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? (el.getAttribute('content') || '').trim() : '';
  }

  function buildSourceConfigs() {
    var customTileUrl = getMetaContent('shroud-tile-url');
    var configs = [];

    if (customTileUrl) {
      configs.push({
        id: 'custom-dzi',
        tileSource: customTileUrl,
        sourceLabel: {
          it: 'Fonte: Deep Zoom personalizzato',
          en: 'Source: Custom Deep Zoom',
          la: 'Fons: Deep Zoom personalis'
        },
        resolutionLabel: {
          it: 'Risoluzione: definita dal tuo endpoint DZI',
          en: 'Resolution: provided by your DZI endpoint',
          la: 'Resolutio: ab endpoint DZI tuo praebita'
        }
      });
    }

    configs.push(
      {
        id: 'archdiocese-jubilee-scan',
        tileSource: 'https://www.sindone.org/telo/sindone.jpg',
        sourceLabel: {
          it: 'Fonte: Arcidiocesi di Torino, lettura ufficiale del Telo',
          en: 'Source: Archdiocese of Turin, official cloth reader',
          la: 'Fons: Archidioecesis Taurinensis, lectio officialis Lintei'
        },
        resolutionLabel: {
          it: 'Risoluzione: scansione ufficiale ad alta definizione (8000 x 2333 px)',
          en: 'Resolution: official high-definition scan (8000 x 2333 px)',
          la: 'Resolutio: scanio officialis altae definitionis (8000 x 2333 px)'
        }
      },
      {
        id: 'miller-negative-public-mirror',
        tileSource: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Full_length_negatives_of_the_shroud_of_Turin.jpg',
        sourceLabel: {
          it: 'Fonte: Wikimedia Commons (dominio pubblico), negativo ad alto contrasto',
          en: 'Source: Wikimedia Commons (public domain), high-contrast negative',
          la: 'Fons: Wikimedia Commons (dominium publicum), negativum magnae oppositionis'
        },
        resolutionLabel: {
          it: 'Risoluzione: 2370 x 2321 px',
          en: 'Resolution: 2370 x 2321 px',
          la: 'Resolutio: 2370 x 2321 px'
        }
      },
      {
        id: 'local-preview',
        tileSource: './assets/images/shroud-preview.jpg',
        sourceLabel: {
          it: 'Fonte: Anteprima locale del progetto',
          en: 'Source: Local project preview',
          la: 'Fons: Praevisio localis propositi'
        },
        resolutionLabel: {
          it: 'Risoluzione: fallback locale',
          en: 'Resolution: local fallback',
          la: 'Resolutio: subsidium locale'
        }
      }
    );

    return configs;
  }

  function getCurrentLang() {
    if (window.i18n && typeof window.i18n.getCurrentLang === 'function') {
      return window.i18n.getCurrentLang();
    }

    var docLang = (document.documentElement.getAttribute('lang') || 'it').toLowerCase();
    if (docLang.indexOf('en') === 0) return 'en';
    if (docLang.indexOf('la') === 0) return 'la';
    return 'it';
  }

  function localizedText(map) {
    var lang = getCurrentLang();
    return map[lang] || map.it || map.en || '';
  }

  function updateInfoPanel(config) {
    if (!config) return;

    if (infoSource && config.sourceLabel) {
      infoSource.textContent = localizedText(config.sourceLabel);
    }

    if (infoRes && config.resolutionLabel) {
      infoRes.textContent = localizedText(config.resolutionLabel);
    }
  }

  function loadSourceAt(index) {
    activeSourceIndex = index;
    activeLoadNonce += 1;
    var loadNonce = activeLoadNonce;

    if (index >= sourceConfigs.length) {
      showError(localizedText({
        it: 'Impossibile caricare le immagini della Sindone da tutte le sorgenti disponibili.',
        en: 'Unable to load Shroud images from all available sources.',
        la: 'Imagines Sindonis ex omnibus fontibus disponibilibus onerari non possunt.'
      }));
      return;
    }

    var config = sourceConfigs[index];
    updateInfoPanel(config);

    try {
      initViewer(config, index, loadNonce);
    } catch (e) {
      handleSourceFailure('exception: ' + (e && e.message ? e.message : e), index, loadNonce);
    }
  }

  function initViewer(config, sourceIndex, loadNonce) {
    var loadSettled = false;

    destroyViewer();

    viewer = OpenSeadragon({
      id: 'osd-viewer',
      showNavigator: true,
      navigatorPosition: 'TOP_RIGHT',
      showFullPageControl: true,
      showHomeControl: true,
      showZoomControl: true,
      gestureSettingsMouse: { scrollToZoom: true },
      animationTime: 1.2,
      blendTime: 0.1,
      constrainDuringPan: true,
      visibilityRatio: 0.8,
      minZoomImageRatio: 0.5,
      maxZoomPixelRatio: 20,
      prefixUrl: 'https://cdn.jsdelivr.net/npm/openseadragon@4.1.0/build/openseadragon/images/',
      crossOriginPolicy: 'Anonymous',
      ajaxWithCredentials: false,
      background: '#0a0807'
    });

    var failoverTimeout = setTimeout(function () {
      if (loadSettled) return;
      if (loadNonce !== activeLoadNonce) return;
      if (sourceIndex !== activeSourceIndex) return;

      loadSettled = true;
      handleSourceFailure('timeout: ' + config.id, sourceIndex, loadNonce);
    }, 30000);

    viewer.addHandler('open', function () {
      if (loadSettled) return;
      if (loadNonce !== activeLoadNonce) return;
      if (sourceIndex !== activeSourceIndex) return;

      loadSettled = true;
      clearTimeout(failoverTimeout);
      console.info('[Viewer] Loaded source:', config.id);
      updateInfoPanel(config);
    });

    viewer.addHandler('open-failed', function (event) {
      if (loadSettled) return;
      if (loadNonce !== activeLoadNonce) return;
      if (sourceIndex !== activeSourceIndex) return;

      loadSettled = true;
      clearTimeout(failoverTimeout);
      handleSourceFailure('open-failed: ' + config.id + (event && event.message ? ' (' + event.message + ')' : ''), sourceIndex, loadNonce);
    });

    viewer.addHandler('tile-load-failed', function (event) {
      console.warn('[Viewer] Tile failed to load:', event);
    });

    try {
      viewer.open(config.tileSource);
    } catch (e) {
      if (loadSettled) return;
      if (loadNonce !== activeLoadNonce) return;
      if (sourceIndex !== activeSourceIndex) return;

      loadSettled = true;
      clearTimeout(failoverTimeout);
      handleSourceFailure('open-exception: ' + (e && e.message ? e.message : e), sourceIndex, loadNonce);
    }
  }

  function destroyViewer() {
    if (!viewer) return;

    try {
      viewer.destroy();
    } catch (e) {
      console.warn('[Viewer] Failed to destroy viewer instance:', e);
    }

    viewer = null;
  }

  function handleSourceFailure(reason, sourceIndex, loadNonce) {
    if (typeof sourceIndex === 'number' && sourceIndex !== activeSourceIndex) {
      return;
    }

    if (typeof loadNonce === 'number' && loadNonce !== activeLoadNonce) {
      return;
    }

    console.warn('[Viewer] Source failed:', reason);
    destroyViewer();

    var nextIndex = activeSourceIndex + 1;
    if (nextIndex < sourceConfigs.length) {
      loadSourceAt(nextIndex);
      return;
    }

    renderStaticFallback();
  }

  function renderStaticFallback() {
    var title = localizedText({
      it: 'Vista statica della Sindone',
      en: 'Static Shroud View',
      la: 'Conspectus staticus Sindonis'
    });

    var body = localizedText({
      it: 'Il visore interattivo non e disponibile in questo momento. E mostrata un\'immagine statica ad alta qualita.',
      en: 'The interactive viewer is unavailable right now. A high-quality static image is shown instead.',
      la: 'Conspectus interactivus nunc praesto non est. Imago statica altae qualitatis ostenditur.'
    });

    var imgAlt = localizedText({
      it: 'Anteprima statica della Sindone di Torino',
      en: 'Static preview of the Shroud of Turin',
      la: 'Praevisio statica Sindonis Taurinensis'
    });

    var fallbackHTML = '<div class="viewer-error">' +
      '<h2>' + escapeHtml(title) + '</h2>' +
      '<p>' + escapeHtml(body) + '</p>' +
      '<img src="./assets/images/shroud-preview.jpg" alt="' + escapeHtml(imgAlt) + '" style="max-width:min(96vw,980px); width:100%; border:1px solid #1e1a17; border-radius:8px; margin-top:1.25rem;" />' +
      '<a href="./index.html" class="btn" style="margin-top:2rem;" data-i18n="viewer.backHome">Torna alla Home</a>' +
      '</div>';

    if (window.shroudPolicy && typeof window.shroudPolicy.createHTML === 'function') {
      viewerContainer.innerHTML = window.shroudPolicy.createHTML(fallbackHTML);
    } else {
      viewerContainer.innerHTML = fallbackHTML;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showError(message) {
    var safeMessage = escapeHtml(message);
    var errorHTML = '<div class="viewer-error">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<circle cx="12" cy="12" r="10"/>' +
      '<line x1="12" y1="8" x2="12" y2="12"/>' +
      '<circle cx="12" cy="16" r="0.5" fill="currentColor"/>' +
      '</svg>' +
      '<h2 data-i18n="viewer.errorTitle">Errore di Caricamento</h2>' +
      '<p>' + safeMessage + '</p>' +
      '<a href="./index.html" class="btn" style="margin-top:2rem;" data-i18n="viewer.backHome">Torna alla Home</a>' +
      '</div>';

    if (window.shroudPolicy && typeof window.shroudPolicy.createHTML === 'function') {
      viewerContainer.innerHTML = window.shroudPolicy.createHTML(errorHTML);
    } else {
      viewerContainer.innerHTML = errorHTML;
    }
  }

  /* Keep source labels in sync after language switches. */
  document.addEventListener('i18n:updated', function () {
    if (activeSourceIndex >= 0 && sourceConfigs[activeSourceIndex]) {
      updateInfoPanel(sourceConfigs[activeSourceIndex]);
    }
  });

  /* Controls hint auto-fade */
  var hint = document.querySelector('.controls-hint');
  if (hint) {
    setTimeout(function () {
      hint.classList.add('fade-out');
    }, 5000);
  }

  /* Info panel dismiss */
  var infoPanel = document.querySelector('.info-panel');
  var infoPanelClose = document.querySelector('.info-panel-close');
  if (infoPanel && infoPanelClose) {
    infoPanelClose.addEventListener('click', function () {
      infoPanel.classList.add('hidden');
    });
  }
})();
