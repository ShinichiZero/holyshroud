/**
 * prepare-tiles.js — Santa Sindone
 * Node script to generate Deep Zoom Image (DZI) tiles from the source image.
 * Requires: npm install sharp
 * Run locally with: node scripts/prepare-tiles.js
 * This script is NOT deployed to GitHub Pages.
 */

const fs = require('fs');
const path = require('path');

// Check for sharp
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('✗ "sharp" package is required. Install it with:');
  console.error('  npm install sharp');
  process.exit(1);
}

const SOURCE_DIR = path.join(__dirname, '..', 'source-images');
const OUTPUT_DIR = path.join(__dirname, '..', 'tiles');
const TILE_SIZE = 254;
const OVERLAP = 1;
const QUALITY = 85;

// Find source image
const sourceFiles = ['shroud-original.jpg', 'shroud-original.tif', 'shroud-original.tiff', 'shroud-original.png'];
let sourceFile = null;

for (const name of sourceFiles) {
  const fullPath = path.join(SOURCE_DIR, name);
  if (fs.existsSync(fullPath)) {
    sourceFile = fullPath;
    break;
  }
}

if (!sourceFile) {
  console.error('✗ No source image found in source-images/');
  console.error('  Run "npm run download" first, or place your image as:');
  console.error('  source-images/shroud-original.jpg (or .tif, .tiff, .png)');
  process.exit(1);
}

console.log('─────────────────────────────────────────────');
console.log('DZI Tile Generation — Santa Sindone');
console.log('─────────────────────────────────────────────');
console.log('Source:', sourceFile);
console.log('Tile size:', TILE_SIZE, 'px');
console.log('Overlap:', OVERLAP, 'px');
console.log('Quality:', QUALITY);
console.log('');

async function generateTiles() {
  // Get image metadata
  const image = sharp(sourceFile);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  console.log(`Image dimensions: ${width} × ${height}`);

  // Calculate number of levels
  const maxDim = Math.max(width, height);
  const maxLevel = Math.ceil(Math.log2(maxDim));

  console.log(`Levels: 0 to ${maxLevel}`);

  // Create output directories
  const dziName = 'shroud';
  const filesDir = path.join(OUTPUT_DIR, dziName + '_files');

  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
  }

  // Write DZI descriptor
  const dziXml = `<?xml version="1.0" encoding="UTF-8"?>
<Image xmlns="http://schemas.microsoft.com/deepzoom/2008"
  Format="jpg"
  Overlap="${OVERLAP}"
  TileSize="${TILE_SIZE}">
  <Size Width="${width}" Height="${height}"/>
</Image>`;

  fs.writeFileSync(path.join(OUTPUT_DIR, dziName + '.dzi'), dziXml);
  console.log('✓ Created shroud.dzi');

  // Generate tiles for each level
  let totalTiles = 0;

  for (let level = maxLevel; level >= 0; level--) {
    const scale = Math.pow(2, level - maxLevel);
    const levelWidth = Math.max(1, Math.ceil(width * scale));
    const levelHeight = Math.max(1, Math.ceil(height * scale));

    const cols = Math.ceil(levelWidth / TILE_SIZE);
    const rows = Math.ceil(levelHeight / TILE_SIZE);

    const levelDir = path.join(filesDir, String(level));
    if (!fs.existsSync(levelDir)) {
      fs.mkdirSync(levelDir, { recursive: true });
    }

    console.log(`  Level ${level}: ${levelWidth}×${levelHeight} → ${cols}×${rows} tiles`);

    // Resize image for this level
    const resized = sharp(sourceFile).resize(levelWidth, levelHeight, {
      fit: 'fill',
      kernel: sharp.kernel.lanczos3,
    });

    const buffer = await resized.toBuffer();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * TILE_SIZE - (col > 0 ? OVERLAP : 0);
        const y = row * TILE_SIZE - (row > 0 ? OVERLAP : 0);

        let tileWidth = TILE_SIZE + (col > 0 ? OVERLAP : 0) + (col < cols - 1 ? OVERLAP : 0);
        let tileHeight = TILE_SIZE + (row > 0 ? OVERLAP : 0) + (row < rows - 1 ? OVERLAP : 0);

        // Clamp to image bounds
        const extractX = Math.max(0, x);
        const extractY = Math.max(0, y);
        tileWidth = Math.min(tileWidth, levelWidth - extractX);
        tileHeight = Math.min(tileHeight, levelHeight - extractY);

        if (tileWidth <= 0 || tileHeight <= 0) continue;

        const tilePath = path.join(levelDir, `${col}_${row}.jpg`);

        await sharp(buffer, { raw: undefined })
          .extract({
            left: extractX,
            top: extractY,
            width: tileWidth,
            height: tileHeight,
          })
          .jpeg({ quality: QUALITY })
          .toFile(tilePath);

        totalTiles++;
      }
    }
  }

  console.log('');
  console.log(`✓ Generated ${totalTiles} tiles across ${maxLevel + 1} levels`);
  console.log('');
  console.log('─────────────────────────────────────────────');
  console.log('NEXT STEPS:');
  console.log('─────────────────────────────────────────────');
  console.log('');
  console.log('1. Upload the entire /tiles folder to your Cloudflare R2 bucket:');
  console.log('   - Create a bucket at https://dash.cloudflare.com');
  console.log('   - Upload tiles/ directory (including shroud.dzi)');
  console.log('   - Enable public access for the bucket');
  console.log('');
  console.log('2. Set the custom DZI URL in viewer.html:');
  console.log('   <meta name="shroud-tile-url" content="https://YOUR-BUCKET.r2.dev/tiles/shroud.dzi">');
  console.log('');
  console.log('3. Commit and push to deploy on GitHub Pages.');
  console.log('─────────────────────────────────────────────');
}

generateTiles().catch((err) => {
  console.error('✗ Tile generation failed:', err.message);
  process.exit(1);
});
