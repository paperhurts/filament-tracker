#!/usr/bin/env node
// Render index.html in headless Chromium and check the dashboard actually drew.
// Catches data.js edits that pass validation but break rendering.
//
//   npm install --no-save --no-package-lock playwright
//   npx playwright install chromium
//   node tools/smoke_dashboard.js
//
// CHARTJS_FILE=/path/to/chart.umd.min.js serves Chart.js from disk instead of
// the CDN (for offline or proxied sandboxes).
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const problems = [];
  page.on('pageerror', e => problems.push(`page error: ${e.message}`));
  page.on('requestfailed', r => {
    if (r.resourceType() === 'script') problems.push(`script failed to load: ${r.url()}`);
  });
  if (process.env.CHARTJS_FILE) {
    await page.route('**/chart.umd.min.js', r => r.fulfill({
      path: process.env.CHARTJS_FILE, contentType: 'application/javascript',
    }));
  }

  await page.goto('file://' + path.join(__dirname, '..', 'index.html'), { waitUntil: 'load' });

  const r = await page.evaluate(() => {
    const d = INVENTORY_DATA;
    const canvases = [...document.querySelectorAll('canvas')];
    return {
      chartJs: typeof Chart !== 'undefined',
      printLog: d.printLog.length,
      rows: document.querySelectorAll('#print-log-body tr').length,
      spools: d.spools.length,
      cards: document.querySelectorAll('#inventory-grid .spool-card').length,
      amsSlots: document.querySelectorAll('#ams-slots .ams-slot').length,
      ams: d.ams.length,
      emptyStats: [...document.querySelectorAll('.stat-value')]
        .filter(e => e.textContent.trim() === '—').map(e => e.id),
      canvases: canvases.length,
      drawn: typeof Chart !== 'undefined' ? canvases.filter(c => Chart.getChart(c)).length : 0,
    };
  });
  await browser.close();

  if (!r.chartJs) problems.push('Chart.js did not load');
  if (r.rows !== r.printLog) problems.push(`print log shows ${r.rows} rows, data has ${r.printLog}`);
  if (r.cards !== r.spools) problems.push(`inventory shows ${r.cards} spool cards, data has ${r.spools}`);
  if (r.amsSlots !== r.ams) problems.push(`AMS shows ${r.amsSlots} slots, data has ${r.ams}`);
  if (r.emptyStats.length) problems.push(`summary stats never filled in: ${r.emptyStats.join(', ')}`);
  if (r.canvases < 3 || r.drawn !== r.canvases) problems.push(`${r.drawn}/${r.canvases} charts drawn`);

  if (problems.length) {
    console.error('FAIL\n  ' + problems.join('\n  '));
    process.exit(1);
  }
  console.log(`dashboard OK (${r.rows} prints, ${r.cards} spools, ${r.drawn} charts)`);
})().catch(e => { console.error(e); process.exit(1); });
