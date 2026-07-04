const fs = require('fs');
const path = require('path');

const SITE_DIR = path.resolve(__dirname, '../../_site');

const EXPECTED_URLS = [
  '/index.html',
  '/case/index.html',
  '/case/CASE1-localization-proxy-tool.html',
  '/case/CASE2-tractable-migration.html',
  '/case/amex-reporting.html',
  '/prd/index.html',
  '/prd/PRD1-intelligent-triage.html',
  '/prd/PRD2-multi-brand-migration.html',
  '/prd/whatsapp-chatbot.html',
  '/prd/failover-mechanism.html',
  '/icebox/index.html',
  '/icebox/youtube-extension.html',
];

let missing = [];
for (const url of EXPECTED_URLS) {
  const filePath = path.join(SITE_DIR, url);
  if (!fs.existsSync(filePath)) {
    missing.push(url);
  }
}

if (missing.length > 0) {
  console.error('MISSING URLS:');
  missing.forEach(u => console.error(`  ${u}`));
  process.exit(1);
}

console.log(`All ${EXPECTED_URLS.length} expected URLs present in _site/.`);
