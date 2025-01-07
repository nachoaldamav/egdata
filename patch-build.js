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

// Remove all the exlcuded routes that start with /assets and replace them with /assets/*
manifest.exclude = manifest.exclude.filter(
  (route) => !route.startsWith('/assets'),
);
manifest.exclude.push('/assets/*');

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
