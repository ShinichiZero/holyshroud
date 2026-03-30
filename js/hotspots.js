/**
 * hotspots.js — SVG Annotation / Hotspot System
 *
 * Renders interactive SVG hotspots over the OSD deep-zoom viewer.
 * Each hotspot maps to a wound location on the Shroud; tapping/clicking
 * a hotspot opens the annotation panel with a Gospel verse and STURP finding.
 *
 * Positions are normalised (0–1) relative to the viewer container so they
 * remain stable regardless of viewport size.
 */
(function () {
  'use strict';

  /* -------------------------------------------------------------------------
   * Annotation data
   * Positions (x, y) are proportional coordinates in the [0, 1] range
   * mapping to the Shroud image width / height.
   * ------------------------------------------------------------------------- */
  const HOTSPOTS = [
    {
      id: 'crown',
      label: 'Crown of Thorns',
      x: 0.48,
      y: 0.11,
      verse: {
        ref: 'Matthew 27:29',
        text: '"And plaiting a crown of thorns they put it on his head, and put a reed in his right hand. And kneeling before him they mocked him, saying, \'Hail, King of the Jews!\'"'
      },
      sturp: 'STURP analysis identified approximately 100 thorn-wound puncture marks around the scalp in a circumferential pattern, consistent with a woven cap of thorns rather than a simple ring crown. Bloodstains show fibrin retraction typical of clotted serum separation.'
    },
    {
      id: 'side',
      label: 'Side Wound',
      x: 0.40,
      y: 0.37,
      verse: {
        ref: 'John 19:34',
        text: '"But one of the soldiers pierced his side with a spear, and at once blood and water came out."'
      },
      sturp: 'A large elliptical wound (~4.5 × 1.5 cm) on the right side between the 5th and 6th ribs shows an unusual flow of both blood (haemoglobin) and a clear fluid, consistent with post-mortem separation of serum from clotted blood in the pericardial sac.'
    },
    {
      id: 'wrists',
      label: 'Wrist Wounds (Nail)',
      x: 0.27,
      y: 0.43,
      verse: {
        ref: 'Isaiah 53:5',
        text: '"But he was pierced for our transgressions; he was crushed for our iniquities; upon him was the chastisement that brought us peace, and with his wounds we are healed."'
      },
      sturp: 'Nail wounds are located in the Destot's space of the wrist rather than the palm. This placement is anatomically consistent with the mechanical requirement of supporting full body weight; the median nerve would have been severed, causing the thumb to retract — precisely matching the absence of thumbs in the image.'
    },
    {
      id: 'feet',
      label: 'Foot Wounds (Nail)',
      x: 0.48,
      y: 0.83,
      verse: {
        ref: 'Psalm 22:16',
        text: '"For dogs encompass me; a company of evildoers encircles me; they have pierced my hands and feet."'
      },
      sturp: 'A single nail was driven through both feet with the left foot placed over the right. Analysis shows soil particles of travertine aragonite — consistent with Jerusalem limestone — embedded in the image area corresponding to the heel.'
    },
    {
      id: 'scourge',
      label: 'Scourge Marks',
      x: 0.52,
      y: 0.54,
      verse: {
        ref: '1 Peter 2:24',
        text: '"He himself bore our sins in his body on the tree, that we might die to sin and live to righteousness. By his wounds you have been healed."'
      },
      sturp: 'Over 120 dumbbell-shaped lesions distributed across the back, buttocks, and legs correspond to the Roman flagrum — a whip with two or three leather thongs, each tipped with lead balls (plumbatae). The wound pattern implies two separate executioners striking from either side.'
    }
  ];

  /* -------------------------------------------------------------------------
   * renderHotspots(manifest)
   * Called from app.js after integrity verification.
   * Optionally merges manifest hotspot positions if provided.
   * ------------------------------------------------------------------------- */
  function renderHotspots(manifest) {
    const svg = document.getElementById('hotspot-overlay');
    if (!svg) return;

    // Clear existing hotspots
    svg.innerHTML = '';

    // Optionally override positions from verified manifest
    const positions = {};
    if (manifest && Array.isArray(manifest.hotspots)) {
      manifest.hotspots.forEach(h => { positions[h.id] = { x: h.x, y: h.y }; });
    }

    HOTSPOTS.forEach(hotspot => {
      const px = positions[hotspot.id]?.x ?? hotspot.x;
      const py = positions[hotspot.id]?.y ?? hotspot.y;
      const r  = 0.018;   // hotspot radius in SVG-unit space
      const lr = 0.028;   // outer ring radius

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.classList.add('hotspot-group');
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', hotspot.label);
      g.dataset.hotspotId = hotspot.id;

      // Outer animated ring
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.classList.add('hotspot-ring');
      ring.setAttribute('cx', px);
      ring.setAttribute('cy', py);
      ring.setAttribute('r', lr);

      // Inner dot
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.classList.add('hotspot-dot');
      dot.setAttribute('cx', px);
      dot.setAttribute('cy', py);
      dot.setAttribute('r', r);

      // Label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.classList.add('hotspot-label');
      text.setAttribute('x', px);
      text.setAttribute('y', py + lr + 0.008);
      text.textContent = hotspot.label;

      g.appendChild(ring);
      g.appendChild(dot);
      g.appendChild(text);
      svg.appendChild(g);

      // Events: click and keyboard
      const openAnnotation = () => openPanel(hotspot);
      g.addEventListener('click', openAnnotation);
      g.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openAnnotation();
        }
      });
    });
  }

  /* -------------------------------------------------------------------------
   * openPanel(hotspot)  — shows the annotation side-panel
   * ------------------------------------------------------------------------- */
  function openPanel(hotspot) {
    const panel = document.getElementById('annotation-panel');
    const title   = document.getElementById('annotation-title');
    const verse   = document.getElementById('annotation-verse');
    const forensic = document.getElementById('annotation-forensic');

    if (!panel) return;

    title.textContent   = hotspot.label;
    verse.innerHTML     = `<cite>${hotspot.verse.ref}</cite><br>${hotspot.verse.text}`;
    forensic.textContent = hotspot.sturp;

    panel.removeAttribute('hidden');
    panel.focus?.();
  }

  /* -------------------------------------------------------------------------
   * Wire close button
   * ------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('annotation-close');
    closeBtn?.addEventListener('click', () => {
      document.getElementById('annotation-panel')?.setAttribute('hidden', '');
    });
  });

  // Expose for app.js
  window.__shroudHotspots = { renderHotspots, HOTSPOTS };
}());
