const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const BASELINE_DIR = path.join(ROOT, '.baseline');
const SITE_DIR = path.join(ROOT, '_site');

const PATH_MAP = {
  'index.html': 'index.html',
  'case/index.html': 'case/index.html',
  'case/CASE1-localization-proxy-tool.html': 'case/CASE1-localization-proxy-tool.html',
  'case/CASE2-tractable-migration.html': 'case/CASE2-tractable-migration.html',
  'case/amex-reporting.html': 'case/amex-reporting.html',
  'prd/index.html': 'prd/index.html',
  'prd/PRD1-intelligent-triage.html': 'prd/PRD1-intelligent-triage.html',
  'prd/PRD2-multi-brand-migration.html': 'prd/PRD2-multi-brand-migration.html',
  'prd/whatsapp-chatbot.html': 'prd/whatsapp-chatbot.html',
  'prd/failover-mechanism.html': 'prd/failover-mechanism.html',
  'icebox/index.html': 'icebox/index.html',
  'icebox/youtube-extension.html': 'icebox/youtube-extension.html',
};

function extractBodyText(html) {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  let body = match ? match[1] : html;
  body = body.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  body = body.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  return body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

let failures = [];
for (const [baselineRel, siteRel] of Object.entries(PATH_MAP)) {
  const baselinePath = path.join(BASELINE_DIR, baselineRel);
  const sitePath = path.join(SITE_DIR, siteRel);

  if (!fs.existsSync(sitePath)) {
    failures.push(`${siteRel}: MISSING from _site/`);
    continue;
  }
  if (!fs.existsSync(baselinePath)) {
    failures.push(`${baselineRel}: MISSING from .baseline/ (was it deleted? re-run Task 1's snapshot script against a clean checkout if needed)`);
    continue;
  }

  const baselineText = extractBodyText(fs.readFileSync(baselinePath, 'utf8'));
  const siteText = extractBodyText(fs.readFileSync(sitePath, 'utf8'));

  if (baselineText !== siteText) {
    failures.push(`${siteRel}: visible text content differs from baseline`);
  }
}

if (failures.length > 0) {
  console.error('CONTENT DIFFERENCES FOUND:');
  failures.forEach(f => console.error(`  ${f}`));
  process.exit(1);
}

console.log(`All ${Object.keys(PATH_MAP).length} pages match baseline visible content.`);
