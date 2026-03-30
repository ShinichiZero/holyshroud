/**
 * Trusted Types Policy — Santa Sindone
 * MUST be loaded first, before any other script.
 * Creates the 'shroud-policy' for safe DOM manipulation.
 */
(function () {
  'use strict';

  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    window.shroudPolicy = window.trustedTypes.createPolicy('shroud-policy', {
      createHTML: function (s) { return s; },
      createScriptURL: function (s) { return s; },
    });
  } else {
    // Fallback for browsers without Trusted Types support
    window.shroudPolicy = {
      createHTML: function (s) { return s; },
      createScriptURL: function (s) { return s; },
    };
  }
})();
