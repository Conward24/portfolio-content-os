import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────
// FONT LOADER
// Reads bundled static TTFs once and returns Satori-shaped font
// descriptors. Static weights → deterministic rendering on Vercel.
// ─────────────────────────────────────────────────────────────────

const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts');

const FILES = {
  Poppins: { 400: 'Poppins-Regular.ttf', 600: 'Poppins-SemiBold.ttf', 700: 'Poppins-Bold.ttf', 800: 'Poppins-ExtraBold.ttf' },
  Raleway: { 400: 'Raleway-400.ttf', 600: 'Raleway-600.ttf', 700: 'Raleway-700.ttf', 800: 'Raleway-800.ttf' },
  Inter:   { 400: 'Inter-400.ttf', 600: 'Inter-600.ttf', 700: 'Inter-700.ttf', 800: 'Inter-800.ttf' },
};

const cache = new Map(); // family -> [{ name, data, weight, style }]

function loadFamily(family) {
  if (cache.has(family)) return cache.get(family);
  const weights = FILES[family];
  if (!weights) throw new Error(`Unknown font family: ${family}`);
  const fonts = Object.entries(weights).map(([weight, file]) => ({
    name: family,
    data: fs.readFileSync(path.join(FONT_DIR, file)),
    weight: Number(weight),
    style: 'normal',
  }));
  cache.set(family, fonts);
  return fonts;
}

// Returns the font set a brand needs for @vercel/og's `fonts` option.
export function fontsForFamily(family) {
  return loadFamily(family);
}
