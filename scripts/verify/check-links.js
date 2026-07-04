const fs = require('fs');
const path = require('path');

const SITE_DIR = path.resolve(__dirname, '../../_site');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const htmlFiles = walk(SITE_DIR);
let brokenLinks = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const hrefMatches = [...html.matchAll(/href="(\/[^"#]*)"/g)];

  for (const [, href] of hrefMatches) {
    if (href.startsWith('//') || href.includes('.pdf')) continue;
    let target = path.join(SITE_DIR, href);
    if (href.endsWith('/')) target = path.join(target, 'index.html');
    if (!fs.existsSync(target) && !fs.existsSync(target + '.html')) {
      brokenLinks.push(`${path.relative(SITE_DIR, file)} -> ${href}`);
    }
  }
}

if (brokenLinks.length > 0) {
  console.error('BROKEN INTERNAL LINKS:');
  brokenLinks.forEach(l => console.error(`  ${l}`));
  process.exit(1);
}

console.log(`No broken internal links found across ${htmlFiles.length} pages.`);
