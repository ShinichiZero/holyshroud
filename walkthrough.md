# Holy Shroud Website — Build Walkthrough

## What Was Built

Complete rebuild of the Holy Shroud / Santa Sindone static website from a single-page PWA viewer into a full multi-page devotional site with Dark Cathedral design system.

### Files Created (27 new files)

| Category | Files |
|---|---|
| **CSS** (6) | [tokens.css](file:///c:/Users/Raffaele/holyshroud/css/tokens.css), [base.css](file:///c:/Users/Raffaele/holyshroud/css/base.css), [layout.css](file:///c:/Users/Raffaele/holyshroud/css/layout.css), [components.css](file:///c:/Users/Raffaele/holyshroud/css/components.css), [viewer.css](file:///c:/Users/Raffaele/holyshroud/css/viewer.css), [animations.css](file:///c:/Users/Raffaele/holyshroud/css/animations.css) |
| **JS** (5) | [trustedTypes.js](file:///c:/Users/Raffaele/holyshroud/js/trustedTypes.js), [i18n.js](file:///c:/Users/Raffaele/holyshroud/js/i18n.js), [main.js](file:///c:/Users/Raffaele/holyshroud/js/main.js), [viewer.js](file:///c:/Users/Raffaele/holyshroud/js/viewer.js), [imageComparison.js](file:///c:/Users/Raffaele/holyshroud/js/imageComparison.js) |
| **Locales** (3) | [it.json](file:///c:/Users/Raffaele/holyshroud/js/locales/it.json), [en.json](file:///c:/Users/Raffaele/holyshroud/js/locales/en.json), [la.json](file:///c:/Users/Raffaele/holyshroud/js/locales/la.json) |
| **HTML** (6) | [index.html](file:///c:/Users/Raffaele/holyshroud/index.html), [viewer.html](file:///c:/Users/Raffaele/holyshroud/viewer.html), [about.html](file:///c:/Users/Raffaele/holyshroud/about.html), [image.html](file:///c:/Users/Raffaele/holyshroud/image.html), [sources.html](file:///c:/Users/Raffaele/holyshroud/sources.html), [404.html](file:///c:/Users/Raffaele/holyshroud/404.html) |
| **Assets** (3) | [favicon.svg](file:///c:/Users/Raffaele/holyshroud/assets/icons/favicon.svg), [shroud-preview.jpg](file:///c:/Users/Raffaele/holyshroud/assets/images/shroud-preview.jpg), [og-image.jpg](file:///c:/Users/Raffaele/holyshroud/assets/images/og-image.jpg) |
| **Scripts** (2) | [download-source.js](file:///c:/Users/Raffaele/holyshroud/scripts/download-source.js), [prepare-tiles.js](file:///c:/Users/Raffaele/holyshroud/scripts/prepare-tiles.js) |
| **Config** (2) | [.nojekyll](file:///c:/Users/Raffaele/holyshroud/.nojekyll), [CNAME](file:///c:/Users/Raffaele/holyshroud/CNAME) |

### Files Removed (7 legacy files)
[app.css](file:///c:/Users/Raffaele/holyshroud/css/app.css), [app.js](file:///c:/Users/Raffaele/holyshroud/js/app.js), [hotspots.js](file:///c:/Users/Raffaele/holyshroud/js/hotspots.js), [integrity.js](file:///c:/Users/Raffaele/holyshroud/js/integrity.js), [sw.js](file:///c:/Users/Raffaele/holyshroud/sw.js), [manifest.json](file:///c:/Users/Raffaele/holyshroud/manifest.json), [SECURITY.md](file:///c:/Users/Raffaele/holyshroud/SECURITY.md)

---

## Browser Verification

### Landing Page — Hero & Feature Cards
![Landing page hero section with Latin translation active](hero_screenshot.png)

![Feature cards with gold borders and i18n in English](cards_screenshot.png)

### About Page — Latin i18n with Italian body text fallback
![About page with Latin headings on dark cathedral background](about_screenshot.png)

### Verified Features
- ✅ Dark Cathedral color palette with gold accents renders across all pages
- ✅ i18n switcher cycles IT → EN → LA with Latin headings falling back to Italian body text
- ✅ Hero image fades in with radial vignette overlay
- ✅ Nav blur and scroll-triggered `scrolled` class working
- ✅ Feature cards with gold hover glow and border-top accent
- ✅ Scroll-triggered fade-in animations (IntersectionObserver)
- ✅ Before/after image comparison sliders drag correctly
- ✅ History timeline with gold dot markers
- ✅ John Paul II quote section renders in all 3 languages
- ✅ 404 branded error page with cross icon
- ✅ Footer disclaimer, official links, and credits present on all pages
- ✅ CSP meta tags and Trusted Types policy on every page
- ✅ All paths are relative (`./css/...`) for GitHub Pages compatibility

---

## Quickstart — Deploy to GitHub Pages

```bash
cd holyshroud
git add -A
git commit -m "Complete Santa Sindone website rebuild"
git push origin main
```

Then in GitHub → Settings → Pages → Source: **main** / **root** → Save.

### Optional: Gigapixel Tiles

```bash
node scripts/download-source.js      # Download official high-resolution source
npm install sharp                      # Install tile generator dep
node scripts/prepare-tiles.js          # Generate DZI tiles
# Upload tiles/ folder to Cloudflare R2
# Set <meta name="shroud-tile-url" ...> in viewer.html (optional override)
```
