// @ts-check
import fs from 'node:fs';
import path from 'node:path';

const buildDir = path.join(process.cwd(), 'dist');

const manifestPath = path.join(buildDir, '_routes.json');

if (!fs.existsSync(manifestPath)) {
  console.error('Manifest file not found:', manifestPath);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

manifest.exclude.push('/_build/*');

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
