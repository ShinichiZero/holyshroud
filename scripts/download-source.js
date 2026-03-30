/**
 * download-source.js — Santa Sindone
 * Node script to download the best available free source image.
 * Run locally with: node scripts/download-source.js
 * This script is NOT deployed to GitHub Pages.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SOURCE_URL = 'https://www.sindone.org/telo/sindone.jpg';
const OUTPUT_DIR = path.join(__dirname, '..', 'source-images');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'shroud-original.jpg');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('✓ Created directory: source-images/');
}

if (fs.existsSync(OUTPUT_FILE)) {
  console.log('⚠ File already exists: source-images/shroud-original.jpg');
  console.log('  Delete it first if you want to re-download.');
  process.exit(0);
}

console.log('⬇ Downloading Shroud image from official high-resolution source...');
console.log('  URL:', SOURCE_URL);

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log('  → Redirecting to:', response.headers.location);
        file.close();
        fs.unlinkSync(dest);
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const totalBytes = parseInt(response.headers['content-length'], 10);
      let downloadedBytes = 0;

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes) {
          const pct = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          process.stdout.write(`\r  Progress: ${pct}% (${(downloadedBytes / 1024 / 1024).toFixed(1)} MB)`);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('\n✓ Downloaded to: source-images/shroud-original.jpg');
        console.log(`  Size: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

download(SOURCE_URL, OUTPUT_FILE)
  .then(() => {
    console.log('\n─────────────────────────────────────────────');
    console.log('ALTERNATIVE SOURCES (optional):');
    console.log('─────────────────────────────────────────────');
    console.log('');
    console.log('If you need alternate files or licensing checks, see:');
    console.log('');
    console.log('  Archdiocese of Turin (official reader):');
    console.log('    https://www.sindone.org/telo/index1.html');
    console.log('');
    console.log('  Wikimedia Commons (public-domain negative reference):');
    console.log('    https://upload.wikimedia.org/wikipedia/commons/9/9b/Full_length_negatives_of_the_shroud_of_Turin.jpg');
    console.log('');
    console.log('  Haltadefinizione (12.8 billion pixel scan, 2008):');
    console.log('    https://www.haltadefinizione.com');
    console.log('    Contact for licensing terms.');
    console.log('');
    console.log('  STERA Archive (Barrie Schwortz):');
    console.log('    https://www.shroud.com/stera.htm');
    console.log('    Free for non-commercial/educational use.');
    console.log('');
    console.log('Replace source-images/shroud-original.jpg with your HQ file');
    console.log('then run: npm run prepare-tiles');
    console.log('─────────────────────────────────────────────');
  })
  .catch((err) => {
    console.error('\n✗ Download failed:', err.message);
    process.exit(1);
  });
