// Run with Node.js to generate icons
// Requires: npm install sharp
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateIcons() {
  const sourceIcon = 'source-icon.png'; // Your 512x512 source icon
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  // Create icons directory if it doesn't exist
  try {
    await fs.mkdir('icons', { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
  
  for (const size of sizes) {
    await sharp(sourceIcon)
      .resize(size, size)
      .png()
      .toFile(`icons/icon-${size}x${size}.png`);
    
    console.log(`Generated icon-${size}x${size}.png`);
  }
  
  // Create maskable icon for Android
  await sharp(sourceIcon)
    .resize(192, 192)
    .composite([{
      input: Buffer.from(
        '<svg><rect x="0" y="0" width="192" height="192" rx="48" ry="48"/></svg>'
      ),
      blend: 'dest-in'
    }])
    .png()
    .toFile('icons/maskable-icon-192x192.png');
  
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);