#!/usr/bin/env node
/* Screenshots the site at every scroll stage, on desktop and phone, so changes can be
   checked visually instead of guessed at.

     node tools/screenshots.js            → all stages, desktop + phone
     node tools/screenshots.js phone      → only one device (desktop | tablet | phone)

   Images go to screenshots/ (git-ignored). Console errors and failed requests are
   printed at the end; the script exits with code 1 if there were any.
   Needs Playwright (preinstalled in Claude cloud sessions; locally: npm i -g playwright
   && npx playwright install chromium). */
'use strict';

const path = require('path');
const fs = require('fs');
const { chromium, devices } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PAGE = 'file://' + path.join(ROOT, 'CAS website', 'index.html');
const OUT = path.join(ROOT, 'screenshots');

// Progress values P (0 → 1) from the timeline at the top of assets/js/main.js.
const STAGES = [
  ['01-cover', 0.00],
  ['02-title-flying', 0.12],
  ['03-what-is-cas', 0.30],
  ['04-portal-opening', 0.47],
  ['05-about-intro', 0.62],
  ['06-about-sliding', 0.79],
  ['07-about-info', 0.96],
];

const DEVICES = {
  desktop: { viewport: { width: 1440, height: 900 } },
  tablet: { ...devices['iPad (gen 7)'] },
  phone: { ...devices['iPhone 13'] },
};

async function settle(page) {
  // main.js eases its smoothed progress toward the scroll position; wait until it arrives.
  await page.waitForFunction(() => {
    const s = window.CASSite && window.CASSite.progress();
    return s && Math.abs(s.P - s.Ps) < 0.0002;
  }, null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(700); // let CSS transitions triggered by class toggles finish
}

async function goTo(page, p) {
  await page.evaluate((p) => {
    const stage = document.getElementById('stage');
    const sticky = document.querySelector('.stage__sticky');
    const range = Math.max(1, stage.offsetHeight - sticky.offsetHeight);
    window.scrollTo({ top: stage.offsetTop + p * range, behavior: 'instant' });
  }, p);
  await settle(page);
}

(async () => {
  const only = process.argv[2];
  const which = only ? [only] : ['desktop', 'phone'];
  for (const d of which) if (!DEVICES[d]) { console.error('Unknown device: ' + d); process.exit(2); }

  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle'] });
  const problems = [];

  for (const name of which) {
    const ctx = await browser.newContext({ ...DEVICES[name], deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) problems // missing files are reported (with their URL) by requestfailed below
.push(`[${name}] console: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`[${name}] page error: ${e.message}`));
    page.on('requestfailed', (r) => {
      if (!/about-\d\.jpg$/.test(r.url())) problems.push(`[${name}] request failed: ${r.url()}`); // missing photos are expected until uploaded
    });

    await page.goto(PAGE, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(1200); // intro animations

    for (const [label, p] of STAGES) {
      await goTo(page, p);
      const file = path.join(OUT, `${name}-${label}.png`);
      await page.screenshot({ path: file });
      console.log(file);
    }

    // the "What is CAS?" diagram with one circle opened
    await goTo(page, 0.30);
    await page.evaluate(() => window.CASSite.open('c'));
    await page.waitForTimeout(1200);
    const file = path.join(OUT, `${name}-03b-circle-open.png`);
    await page.screenshot({ path: file });
    console.log(file);

    // anything wider than the screen means a horizontal scrollbar on phones
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) problems.push(`[${name}] page is ${overflow}px wider than the screen (horizontal scroll)`);

    await ctx.close();
  }

  await browser.close();
  if (problems.length) {
    console.log('\nProblems:\n' + problems.map((p) => '  - ' + p).join('\n'));
    process.exit(1);
  }
  console.log('\nNo console errors or failed requests.');
})();
