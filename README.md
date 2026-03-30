# 🕊️ La Santa Sindone — Holy Shroud of Turin

A sacred, non-commercial website dedicated to the Shroud of Turin.
Explore the Shroud in gigapixel resolution, learn about its history, science,
and the enduring mystery that surrounds it.

**Live site:** [shinichizero.github.io/holyshroud](https://shinichizero.github.io/holyshroud/)

---

## ✨ Features

- **Gigapixel Viewer** — OpenSeadragon-powered deep zoom into the Shroud
- **Resilient Viewer Sources** — Automatic fallback from custom DZI to official/public image sources
- **Image Comparisons** — Interactive before/after sliders (negative, UV, 3D)
- **History & Science** — Comprehensive article with timeline, STURP analysis, carbon dating
- **Trilingual** — Italian (primary) / English / Latin (partial, liturgical)
- **Privacy-first** — No cookies, no tracking, no backend, no donations
- **Accessible** — ARIA landmarks, keyboard navigation, high contrast

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/ShinichiZero/holyshroud.git
cd holyshroud
```

### 2. Download the source image

```bash
npm install
node scripts/download-source.js
```

This downloads the Wikimedia Commons public-domain shroud image (~14 MB).

### 3. Generate tiles (optional, for gigapixel viewer)

```bash
npm install sharp
node scripts/prepare-tiles.js
```

This creates Deep Zoom Image (DZI) tiles in `tiles/` directory.

### 4. Optional: host your own DZI tiles

The viewer works out of the box with built-in high-quality public sources, so this step is optional.

If you host your own tiles:

1. Sign up for [Cloudflare R2](https://www.cloudflare.com/products/r2/) (free tier: 10GB, 10M reads/month, zero egress)
2. Create a new R2 bucket (e.g., `holyshroud-tiles`)
3. Enable **public access** for the bucket
4. Upload the entire `tiles/` directory to the bucket root
5. Open `viewer.html` and set:

`<meta name="shroud-tile-url" content="https://YOUR-BUCKET.r2.dev/tiles/shroud.dzi">`

### 5. Deploy to GitHub Pages

1. Go to **Settings → Pages** in your GitHub repository
2. Set source to: **Deploy from a branch**
3. Select branch: **main**, directory: **/ (root)**
4. Click **Save**

Your site will be live at `https://shinichizero.github.io/holyshroud/`

### 6. Custom domain (optional)

1. In GitHub Pages settings, add your custom domain
2. Edit the `CNAME` file in root with your domain name
3. Configure DNS records as instructed by GitHub

## 🏗️ Project Structure

```
holyshroud/
├── index.html              ← Hero / landing page
├── viewer.html             ← Gigapixel OpenSeadragon viewer
├── about.html              ← History, science, carbon dating
├── image.html              ← Negative / UV / 3D comparisons
├── sources.html            ← Credits, image licenses, bibliography
├── 404.html                ← Branded error page
├── css/
│   ├── tokens.css          ← CSS custom properties (design tokens)
│   ├── base.css            ← Reset, typography, body
│   ├── layout.css          ← Nav, footer, grid system
│   ├── components.css      ← Reusable UI components
│   ├── viewer.css          ← OpenSeadragon viewer styles
│   └── animations.css      ← Keyframes, transitions
├── js/
│   ├── trustedTypes.js     ← Trusted Types policy (loads first)
│   ├── i18n.js             ← IT / EN / LA language switching
│   ├── locales/            ← Translation JSON files
│   ├── viewer.js           ← OpenSeadragon init & controls
│   ├── imageComparison.js  ← Before/after slider component
│   └── main.js             ← Site-wide nav, scroll, lang picker
├── assets/
│   ├── icons/favicon.svg   ← Gold cross SVG favicon
│   └── images/             ← Hero preview and OG images
├── scripts/
│   ├── download-source.js  ← Download Wikimedia source image
│   └── prepare-tiles.js    ← Generate DZI tiles with sharp
├── .nojekyll               ← Disables Jekyll on GitHub Pages
├── CNAME                   ← Custom domain (user-configured)
└── README.md
```

## 📸 Image Sources & Credits

| Source | Description | License |
|--------|-------------|---------|
| [Archdiocese of Turin / Reading the Cloth](https://www.sindone.org/telo/index1.html) | Official high-resolution cloth reader | Official source (see provider terms) |
| [Archdiocese of Turin / Jubilee Digital Project](https://www.sindone.org/sindone-e-giubileo-a-torino) | 2025-2026 Jubilee digital initiative | Official source (see provider terms) |
| [Wikimedia Commons - Full length negatives](https://upload.wikimedia.org/wikipedia/commons/9/9b/Full_length_negatives_of_the_shroud_of_Turin.jpg) | High-contrast full-length negatives | Public Domain |
| [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Shroud_of_Turin_001.jpg) | Main Shroud image | Public Domain |
| [Haltadefinizione](https://www.haltadefinizione.com) | 12.8 Gpx scan (2008) | Contact for license |
| [STERA / Shroud.com](https://www.shroud.com) | STURP photo archive | Non-commercial / educational |

## ⚠️ Disclaimer

This site is **not affiliated** with the Archdiocese of Turin or the Holy See.
It is an independent, non-commercial project created for educational and
devotional purposes.

---

*Sito realizzato con ❤️ a Torino*
