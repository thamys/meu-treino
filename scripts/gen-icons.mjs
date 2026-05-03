import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(resolve(__dirname, '../public/icon.svg'));

const icons = [
  { size: 512, file: 'public/icon-512.png' },
  { size: 192, file: 'public/icon-192.png' },
  { size: 180, file: 'public/apple-touch-icon.png' },
];

for (const { size, file } of icons) {
  await sharp(svg).resize(size, size).png().toFile(resolve(__dirname, '..', file));
  console.log(`✓ ${file} (${size}x${size})`);
}
