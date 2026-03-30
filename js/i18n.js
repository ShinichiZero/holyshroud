/**
 * i18n — Internationalisation for Santa Sindone
 * Supports IT (Italian, primary), EN (English), LA (Latin, partial).
 * Uses data-i18n attributes on HTML elements.
 */
(function () {
  'use strict';

  var SUPPORTED_LANGS = ['it', 'en', 'la'];
  var DEFAULT_LANG = 'it';
  var STORAGE_KEY = 'shroud-lang';
  var localeCache = {};
  var currentLang = DEFAULT_LANG;

  /**
   * Detect preferred language from storage, browser, or default.
   */
  function detectLanguage() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.indexOf(stored) !== -1) {
      return stored;
    }
    var browserLang = (navigator.language || '').substring(0, 2).toLowerCase();
    if (SUPPORTED_LANGS.indexOf(browserLang) !== -1) {
      return browserLang;
    }
    return DEFAULT_LANG;
  }

  /**
   * Resolve a nested key like "hero.title" from a flat or nested object.
   */
  function resolveKey(obj, key) {
    var parts = key.split('.');
    var current = obj;
    for (var i = 0; i < parts.length; i++) {
      if (current === undefined || current === null) return null;
      current = current[parts[i]];
    }
    return current !== undefined ? current : null;
  }

  /**
   * Apply translations to all elements with data-i18n attribute.
   */
  function applyTranslations(translations) {
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var key = el.getAttribute('data-i18n');
      var value = resolveKey(translations, key);

      if (value === null) {
        // For Latin: fall back to Italian if key not found
        if (currentLang === 'la' && localeCache['it']) {
          value = resolveKey(localeCache['it'], key);
        }
        if (value === null) continue;
      }

      // Check if the element needs HTML rendering
      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = window.shroudPolicy.createHTML(value);
      } else {
        el.textContent = value;
      }
    }

    // Update placeholder attributes
    var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < placeholders.length; j++) {
      var ph = placeholders[j];
      var phKey = ph.getAttribute('data-i18n-placeholder');
      var phValue = resolveKey(translations, phKey);
      if (phValue) {
        ph.setAttribute('placeholder', phValue);
      }
    }

    // Update aria-label attributes
    var ariaEls = document.querySelectorAll('[data-i18n-aria]');
    for (var k = 0; k < ariaEls.length; k++) {
      var arEl = ariaEls[k];
      var arKey = arEl.getAttribute('data-i18n-aria');
      var arValue = resolveKey(translations, arKey);
      if (arValue) {
        arEl.setAttribute('aria-label', arValue);
      }
    }
  }

  /**
   * Emit a locale change event for scripts that need post-i18n updates.
   */
  function emitLocaleUpdated(lang) {
    try {
      if (typeof window.CustomEvent === 'function') {
        document.dispatchEvent(new CustomEvent('i18n:updated', {
          detail: { lang: lang }
        }));
      } else {
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent('i18n:updated', false, false, { lang: lang });
        document.dispatchEvent(evt);
      }
    } catch (e) {
      // No-op: translation updates must not fail because event dispatch failed.
    }
  }

  /**
   * Load a locale JSON file and apply translations.
   */
  function loadLocale(lang) {
    currentLang = lang;
    document.documentElement.setAttribute('lang', lang === 'la' ? 'la' : lang);
    localStorage.setItem(STORAGE_KEY, lang);

    // Update active state on language buttons
    var langBtns = document.querySelectorAll('.lang-btn');
    for (var i = 0; i < langBtns.length; i++) {
      langBtns[i].classList.toggle('active', langBtns[i].getAttribute('data-lang') === lang);
    }

    // Use cache if available
    if (localeCache[lang]) {
      applyTranslations(localeCache[lang]);
      emitLocaleUpdated(lang);
      return;
    }

    // Determine the base path for locale files
    var scripts = document.querySelectorAll('script[src*="i18n.js"]');
    var basePath = './js/locales/';
    if (scripts.length > 0) {
      var src = scripts[0].getAttribute('src');
      basePath = src.replace('i18n.js', 'locales/');
    }

    fetch(basePath + lang + '.json')
      .then(function (response) {
        if (!response.ok) throw new Error('Locale not found: ' + lang);
        return response.json();
      })
      .then(function (data) {
        localeCache[lang] = data;
        // For Latin, also pre-load Italian as fallback
        if (lang === 'la' && !localeCache['it']) {
          return fetch(basePath + 'it.json')
            .then(function (r) { return r.json(); })
            .then(function (itData) {
              localeCache['it'] = itData;
              applyTranslations(data);
              emitLocaleUpdated(lang);
            });
        }
        applyTranslations(data);
        emitLocaleUpdated(lang);
      })
      .catch(function (err) {
        console.warn('[i18n] Failed to load locale:', err);
        // Fall back to Italian
        if (lang !== DEFAULT_LANG) {
          loadLocale(DEFAULT_LANG);
        }
      });
  }

  /**
   * Initialize the i18n system.
   */
  function init() {
    var lang = detectLanguage();

    // Bind language switcher buttons
    var langBtns = document.querySelectorAll('.lang-btn');
    for (var i = 0; i < langBtns.length; i++) {
      langBtns[i].addEventListener('click', function (e) {
        var targetLang = this.getAttribute('data-lang');
        if (targetLang && targetLang !== currentLang) {
          loadLocale(targetLang);
        }
      });
    }

    loadLocale(lang);
  }

  // Expose for external use
  window.i18n = {
    init: init,
    loadLocale: loadLocale,
    getCurrentLang: function () { return currentLang; }
  };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
