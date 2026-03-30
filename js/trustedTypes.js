/**
 * Trusted Types Policy — Santa Sindone
 * MUST be loaded first, before any other script.
 * Creates the 'shroud-policy' for safe DOM manipulation.
 */
(function () {
  'use strict';

  function passthrough(input) {
    return input;
  }

  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    try {
      window.shroudPolicy = window.trustedTypes.createPolicy('shroud-policy', {
        createHTML: passthrough,
        createScriptURL: passthrough,
      });
    } catch (e) {
      window.shroudPolicy = {
        createHTML: passthrough,
        createScriptURL: passthrough,
      };
    }

    // If CSP permits, create the default policy so third-party libraries
    // (e.g. OpenSeadragon) can write trusted HTML under TT enforcement.
    try {
      window.trustedTypes.createPolicy('default', {
        createHTML: passthrough,
        createScriptURL: passthrough,
      });
    } catch (e) {
      // Ignore when default policy is already defined or not allowed by CSP.
    }
  } else {
    // Fallback for browsers without Trusted Types support
    window.shroudPolicy = {
      createHTML: passthrough,
      createScriptURL: passthrough,
    };
  }
})();
