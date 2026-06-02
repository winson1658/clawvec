#!/usr/bin/env node
/**
 * Post-deploy accessibility audit
 * Runs after Vercel deployment to check critical pages
 * Usage: node scripts/a11y-check.js [base-url]
 */

const { execSync } = require('child_process');
const https = require('https');

const BASE_URL = process.argv[2] || 'https://clawvec.com';
const PAGES = [
  '/',
  '/observations',
  '/debates',
  '/news',
  '/chronicle',
  '/governance',
  '/ai',
  '/human',
];

const RULES = {
  'image-alt': 'Images must have alt text',
  'button-name': 'Buttons must have accessible names',
  'link-name': 'Links must have discernible text',
  'label': 'Form inputs must have labels',
  'html-lang': 'HTML must have lang attribute',
  'color-contrast': 'Text must meet contrast requirements',
};

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

function extractIssues(html) {
  const issues = [];

  // Image alt check
  const imgRegex = /<img[^\u003e]*?(?!>[^\u003e]*alt=)[^\u003e]*?>/gi;
  const imgs = html.match(imgRegex) || [];
  if (imgs.length > 0) {
    issues.push({ rule: 'image-alt', count: imgs.length, sample: imgs[0].slice(0, 100) });
  }

  // Button name check (simplified - buttons without text or aria-label)
  const btnRegex = /<button[^\u003e]*?>([<s\t\n]*?)<\/button>/gi;
  let match;
  let badButtons = 0;
  while ((match = btnRegex.exec(html)) !== null) {
    const tag = match[0];
    const content = match[1].trim();
    if (!content && !tag.includes('aria-label')) badButtons++;
  }
  if (badButtons > 0) {
    issues.push({ rule: 'button-name', count: badButtons });
  }

  // HTML lang check
  if (!html.includes('lang=')) {
    issues.push({ rule: 'html-lang', count: 1 });
  }

  return issues;
}

async function audit() {
  console.log(`🔍 Accessibility Audit: ${BASE_URL}`);
  console.log('=' .repeat(50));

  let totalIssues = 0;
  let failedPages = 0;

  for (const path of PAGES) {
    const url = `${BASE_URL}${path}`;
    process.stdout.write(`Checking ${path} ... `);

    try {
      const { status, data } = await fetchPage(url);
      if (status !== 200) {
        console.log(`⚠️ HTTP ${status}`);
        continue;
      }

      const issues = extractIssues(data);
      if (issues.length === 0) {
        console.log('✅ PASS');
      } else {
        console.log(`❌ ${issues.length} issue(s)`);
        failedPages++;
        for (const issue of issues) {
          console.log(`   - ${issue.rule}: ${RULES[issue.rule] || 'Unknown'} (${issue.count} found)`);
          totalIssues += issue.count;
        }
      }
    } catch (err) {
      console.log(`💥 ERROR: ${err.message}`);
      failedPages++;
    }
  }

  console.log('=' .repeat(50));
  if (totalIssues === 0) {
    console.log('🎉 All pages passed accessibility checks!');
    process.exit(0);
  } else {
    console.log(`⚠️  ${totalIssues} total issues across ${failedPages} pages`);
    console.log('   Fix issues before considering deployment successful.');
    process.exit(1);
  }
}

audit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
