#!/usr/bin/env node
/**
 * Scan public/screenshots/* and generate a manifest.json describing
 * the available flows (subfolders) and screenshots (image files).
 *
 * Run automatically as part of the Vercel build (see package.json).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'public', 'screenshots');
const OUT = path.join(ROOT, 'manifest.json');
const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif']);

function titleCase(s) {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function labelFromFilename(filename) {
  const base = filename.replace(/\.[^.]+$/, '').replace(/^\d+[-_]?/, '');
  return titleCase(base) || filename;
}

function main() {
  if (!fs.existsSync(ROOT)) {
    fs.mkdirSync(ROOT, { recursive: true });
  }

  const flows = [];
  const entries = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const dir of entries) {
    const flowPath = path.join(ROOT, dir.name);
    const files = fs.readdirSync(flowPath)
      .filter(f => IMG_EXT.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (!files.length) continue;

    const titleSrc = dir.name.replace(/^\d+[-_]?/, '');
    flows.push({
      slug: dir.name,
      title: titleCase(titleSrc),
      shots: files.map(f => ({
        filename: f,
        label: labelFromFilename(f),
        url: `/screenshots/${dir.name}/${f}`
      }))
    });
  }

  const manifest = { generated_at: new Date().toISOString(), flows };
  fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
  const totalShots = flows.reduce((n, f) => n + f.shots.length, 0);
  console.log(`[screenshots] manifest: ${flows.length} flows, ${totalShots} screenshots`);
}

main();
