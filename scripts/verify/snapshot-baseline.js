// scripts/verify/snapshot-baseline.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const BASELINE_DIR = path.join(ROOT, '.baseline');

const FILES_TO_SNAPSHOT = [
  'index.html',
  'case/index.html',
  'case/CASE1-localization-proxy-tool.html',
  'case/CASE2-tractable-migration.html',
  'case/amex-reporting.html',
  'prd/index.html',
  'prd/PRD1-intelligent-triage.html',
  'prd/PRD2-multi-brand-migration.html',
  'prd/whatsapp-chatbot.html',
  'prd/failover-mechanism.html',
  'icebox/index.html',
  'icebox/youtube-extension.html',
];

fs.rmSync(BASELINE_DIR, { recursive: true, force: true });
fs.mkdirSync(BASELINE_DIR, { recursive: true });

for (const relPath of FILES_TO_SNAPSHOT) {
  const src = path.join(ROOT, relPath);
  const dest = path.join(BASELINE_DIR, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

console.log(`Snapshotted ${FILES_TO_SNAPSHOT.length} files to .baseline/`);
