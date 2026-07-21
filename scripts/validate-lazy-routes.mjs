#!/usr/bin/env node
// Build-time validator for React.lazy() dynamic imports referenced in src/App.tsx.
// Ensures every route chunk path is resolvable before we ship a build that
// would otherwise 404 at runtime and drop users into the ErrorBoundary.
//
// Run automatically via `npm run prebuild`; fails the build (exit 1) on any
// missing target so CI can block the publish.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const APP = resolve(ROOT, 'src/App.tsx');

const src = readFileSync(APP, 'utf8');
// Match every `import('./x/y')` inside App.tsx
const re = /import\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g;
const paths = new Set();
let m;
while ((m = re.exec(src))) paths.add(m[1]);

const exts = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
const missing = [];
for (const p of paths) {
  const base = resolve(dirname(APP), p);
  const hit = exts.some(e => existsSync(base + e));
  if (!hit) missing.push(p);
}

if (missing.length) {
  console.error('❌ [validate-lazy-routes] Unresolvable dynamic imports in src/App.tsx:');
  for (const p of missing) console.error('   ·', p);
  console.error(`\nFound ${missing.length} broken route(s). Build aborted.`);
  process.exit(1);
}

console.log(`✅ [validate-lazy-routes] ${paths.size} dynamic route imports OK`);
