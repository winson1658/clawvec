#!/usr/bin/env node
/**
 * Full accessibility audit with axe-core via browser automation
 * Checks all pages in both light and dark modes
 * Usage: node scripts/a11y-full-check.js [base-url]
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.argv[2] || 'https://clawvec.com';
const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/observations', name: 'Observations' },
  { path: '/debates', name: 'Debates' },
  { path: '/news', name: 'News' },
  { path: '/chronicle', name: 'Chronicle' },
  { path: '/governance', name: 'Governance' },
  { path: '/agents', name: 'Agents' },
  { path: '/register/human', name: 'Register Human' },
  { path: '/dilemma', name: 'Daily Dilemma' },
  { path: '/manifesto', name: 'Manifesto' },
  { path: '/ai-perspective', name: 'AI Perspective' },
];

const AXE_SCRIPT = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';

async function runAxe(page) {
  // Inject axe-core
  await page.addScriptTag({ url: AXE_SCRIPT });
  
  // Run axe
  const results = await page.evaluate(() => {
    return new Promise((resolve) => {
      axe.run(document, {
        resultTypes: ['violations', 'incomplete'],
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: false }, // WCAG AA only
        }
      }, (err, results) => {
        if (err) resolve({ error: err.message });
        else resolve(results);
      });
    });
  });
  
  return results;
}

async function auditPage(browser, pageConfig, theme) {
  const url = `${BASE_URL}${pageConfig.path}`;
  const page = await browser.newPage();
  
  try {
    // Set viewport
    await page.setViewport({ width: 1280, height: 900 });
    
    // Navigate
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Set theme via localStorage (Clawvec uses 'clawvec_theme')
    if (theme === 'dark') {
      await page.evaluate(() => {
        localStorage.setItem('clawvec_theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      // Reload to apply theme
      await page.reload({ waitUntil: 'networkidle2' });
    } else {
      await page.evaluate(() => {
        localStorage.setItem('clawvec_theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
      });
      await page.reload({ waitUntil: 'networkidle2' });
    }
    
    // Wait for content to settle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run axe
    const results = await runAxe(page);
    
    if (results.error) {
      return { error: results.error };
    }
    
    // Process violations
    const violations = results.violations || [];
    const critical = violations.filter(v => v.impact === 'critical');
    const serious = violations.filter(v => v.impact === 'serious');
    const moderate = violations.filter(v => v.impact === 'moderate');
    const minor = violations.filter(v => v.impact === 'minor');
    
    // Filter color-contrast issues
    const contrastIssues = violations.filter(v => v.id === 'color-contrast');
    
    return {
      total: violations.length,
      critical: critical.length,
      serious: serious.length,
      moderate: moderate.length,
      minor: minor.length,
      contrastIssues: contrastIssues.map(v => ({
        count: v.nodes.length,
        description: v.description,
        help: v.help,
        sample: v.nodes[0]?.html?.substring(0, 150) || 'N/A'
      })),
      otherIssues: violations.filter(v => v.id !== 'color-contrast').map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        count: v.nodes.length
      }))
    };
    
  } catch (err) {
    return { error: err.message };
  } finally {
    await page.close();
  }
}

async function audit() {
  console.log(`🔍 Full Accessibility Audit: ${BASE_URL}`);
  console.log(`📄 Pages: ${PAGES.length} | 🌗 Themes: light + dark`);
  console.log('=' .repeat(70));
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  let totalViolations = 0;
  let totalContrast = 0;
  const results = [];
  
  for (const pageConfig of PAGES) {
    for (const theme of ['light', 'dark']) {
      const label = `${pageConfig.name} (${theme})`;
      process.stdout.write(`Checking ${label.padEnd(35)} ... `);
      
      const result = await auditPage(browser, pageConfig, theme);
      
      if (result.error) {
        console.log(`💥 ${result.error}`);
        continue;
      }
      
      totalViolations += result.total;
      totalContrast += result.contrastIssues.reduce((sum, c) => sum + c.count, 0);
      
      if (result.total === 0) {
        console.log('✅ PASS');
      } else {
        const parts = [];
        if (result.critical) parts.push(`${result.critical} critical`);
        if (result.serious) parts.push(`${result.serious} serious`);
        if (result.moderate) parts.push(`${result.moderate} moderate`);
        if (result.minor) parts.push(`${result.minor} minor`);
        console.log(`❌ ${result.total} issues (${parts.join(', ')})`);
        
        results.push({ page: label, ...result });
      }
    }
  }
  
  await browser.close();
  
  console.log('=' .repeat(70));
  
  // Summary
  if (totalViolations === 0) {
    console.log('🎉 All pages passed in both light and dark modes!');
    process.exit(0);
  }
  
  console.log(`\n📊 SUMMARY`);
  console.log(`   Total violations: ${totalViolations}`);
  console.log(`   Color contrast issues: ${totalContrast} elements`);
  console.log(`   Pages with issues: ${results.length}/${PAGES.length * 2}`);
  
  // Detail report
  console.log(`\n📋 DETAIL REPORT`);
  for (const r of results) {
    console.log(`\n   ${r.page}:`);
    
    if (r.contrastIssues.length > 0) {
      console.log(`   🎨 Color Contrast:`);
      for (const c of r.contrastIssues) {
        console.log(`      - ${c.count} elements: ${c.description}`);
        console.log(`        Sample: ${c.sample.substring(0, 80)}...`);
      }
    }
    
    if (r.otherIssues.length > 0) {
      console.log(`   ⚠️  Other Issues:`);
      for (const issue of r.otherIssues) {
        console.log(`      - [${issue.impact}] ${issue.id}: ${issue.description} (${issue.count} elements)`);
      }
    }
  }
  
  console.log('\n' + '=' .repeat(70));
  process.exit(1);
}

audit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
