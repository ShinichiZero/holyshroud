/**
 * Image Comparison — Santa Sindone
 * Pure CSS/JS before-after drag slider. No external libraries.
 */
(function () {
  'use strict';

  var containers = document.querySelectorAll('.comparison-container');

  containers.forEach(function (container) {
    var beforeWrapper = container.querySelector('.comparison-before');
    var handle = container.querySelector('.comparison-handle');
    if (!beforeWrapper || !handle) return;

    var isDragging = false;

    function getPosition(e) {
      var rect = container.getBoundingClientRect();
      var x;
      if (e.touches) {
        x = e.touches[0].clientX - rect.left;
      } else {
        x = e.clientX - rect.left;
      }
      // Clamp between 5% and 95%
      var percent = (x / rect.width) * 100;
      return Math.max(5, Math.min(95, percent));
    }

    function updatePosition(percent) {
      beforeWrapper.style.width = percent + '%';
      handle.style.left = percent + '%';
      handle.setAttribute('aria-valuenow', String(Math.round(percent)));
    }

    function onStart(e) {
      e.preventDefault();
      isDragging = true;
      container.style.cursor = 'ew-resize';
    }

    function onMove(e) {
      if (!isDragging) return;
      e.preventDefault();
      var percent = getPosition(e);
      updatePosition(percent);
    }

    function onEnd() {
      isDragging = false;
      container.style.cursor = '';
    }

    // Mouse events
    handle.addEventListener('mousedown', onStart);
    container.addEventListener('mousedown', function (e) {
      if (e.target === handle) return;
      isDragging = true;
      var percent = getPosition(e);
      updatePosition(percent);
    });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    // Touch events
    handle.addEventListener('touchstart', onStart, { passive: false });
    container.addEventListener('touchstart', function (e) {
      if (e.target === handle) return;
      isDragging = true;
      var percent = getPosition(e);
      updatePosition(percent);
    }, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);

    // Keyboard accessibility
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('role', 'slider');
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', '100');
    handle.setAttribute('aria-valuenow', '50');
    handle.setAttribute('aria-label', 'Confronto immagini');

    handle.addEventListener('keydown', function (e) {
      var currentVal = parseFloat(handle.getAttribute('aria-valuenow'));
      var step = 2;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        var newVal = Math.max(5, currentVal - step);
        updatePosition(newVal);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        var newValR = Math.min(95, currentVal + step);
        updatePosition(newValR);
      }
    });
  });
})();
