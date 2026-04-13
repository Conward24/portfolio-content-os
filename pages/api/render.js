import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// HTML templates for each brand and card type
function buildMyluaStatsHTML({ stat1, label1, stat2, label2, stat3, label3, headline, rightStat, rightLabel, missionLine1, missionLine2, contextLabel }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1080px; height: 1080px; overflow: hidden; font-family: 'Poppins', sans-serif; background: #FAF7F2; }
.card { width: 1080px; height: 1080px; display: grid; grid-template-columns: 580px 1fr; position: relative; }
.card::before { content: ''; position: absolute; left: 0; top: 0; width: 7px; height: 100%; background: #2C4D45; z-index: 10; }
.left { background: #FAF7F2; padding: 72px 56px 72px 68px; display: flex; flex-direction: column; justify-content: space-between; }
.pilot-label { font-size: 13px; font-weight: 700; letter-spacing: 0.18em; color: #2C4D45; text-transform: uppercase; margin-bottom: 20px; }
.headline { font-size: 42px; font-weight: 700; color: #2C4D45; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 48px; }
.stats { display: flex; flex-direction: column; gap: 0; flex: 1; justify-content: center; }
.stat-row { padding: 28px 0; border-top: 1px solid rgba(44,77,69,0.15); }
.stat-row:last-child { border-bottom: 1px solid rgba(44,77,69,0.15); }
.stat-number { font-size: 86px; font-weight: 800; color: #A86D53; line-height: 1; letter-spacing: -0.03em; margin-bottom: 4px; }
.stat-label { font-size: 18px; font-weight: 400; color: #2C4D45; letter-spacing: -0.01em; line-height: 1.3; }
.left-bottom { margin-top: 40px; }
.attribution { font-size: 13px; color: rgba(44,77,69,0.5); letter-spacing: 0.01em; border-top: 1px solid rgba(44,77,69,0.15); padding-top: 20px; margin-bottom: 20px; }
.logo-text { font-size: 26px; font-weight: 700; color: #2C4D45; letter-spacing: -0.02em; }
.logo-url { font-size: 14px; color: rgba(44,77,69,0.45); margin-top: 4px; }
.right { background: #2C4D45; padding: 64px 52px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
.lotus { position: absolute; bottom: -80px; right: -80px; width: 380px; height: 380px; }
.lotus-ring { position: absolute; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.bmhw-label { font-size: 12px; font-weight: 700; letter-spacing: 0.2em; color: #DFAC7A; text-transform: uppercase; margin-bottom: 16px; }
.right-divider { width: 100%; height: 1px; background: rgba(223,172,122,0.4); margin-bottom: 40px; }
.right-stat { font-size: 110px; font-weight: 800; color: #DFAC7A; line-height: 1; letter-spacing: -0.04em; }
.right-stat-label { font-size: 22px; font-weight: 400; color: rgba(250,247,242,0.8); line-height: 1.3; letter-spacing: -0.01em; margin-bottom: 40px; }
.right-middle-divider { width: 100%; height: 1px; background: rgba(223,172,122,0.2); margin-bottom: 36px; }
.system-line { font-size: 18px; font-weight: 600; color: #DFAC7A; letter-spacing: -0.01em; margin-bottom: 10px; }
.mission-line { font-size: 18px; font-weight: 400; color: rgba(250,247,242,0.75); line-height: 1.5; }
</style>
</head>
<body>
<div class="card">
  <div class="left">
    <div>
      <div class="pilot-label">Pilot Outcomes</div>
      <div class="headline">${headline}</div>
      <div class="stats">
        <div class="stat-row"><div class="stat-number">${stat1}</div><div class="stat-label">${label1}</div></div>
        <div class="stat-row"><div class="stat-number">${stat2}</div><div class="stat-label">${label2}</div></div>
        <div class="stat-row"><div class="stat-number">${stat3}</div><div class="stat-label">${label3}</div></div>
      </div>
    </div>
    <div class="left-bottom">
      <div class="attribution">University-based research pilot · HIPAA-compliant</div>
      <div class="logo-text">MyLÚA Health</div>
      <div class="logo-url">myluahealth.com</div>
    </div>
  </div>
  <div class="right">
    <div class="lotus">
      <div class="lotus-ring" style="width:380px;height:380px;background:rgba(30,55,48,0.6);"></div>
      <div class="lotus-ring" style="width:280px;height:280px;background:rgba(44,77,69,0.8);"></div>
      <div class="lotus-ring" style="width:190px;height:190px;background:#3A6B5E;"></div>
      <div class="lotus-ring" style="width:110px;height:110px;background:#DFAC7A;opacity:0.6;"></div>
    </div>
    <div>
      <div class="bmhw-label">${contextLabel}</div>
      <div class="right-divider"></div>
      <div class="right-stat">${rightStat}</div>
      <div class="right-stat-label">${rightLabel}</div>
      <div class="right-middle-divider"></div>
      <div class="system-line">${missionLine1}</div>
      <div class="mission-line">${missionLine2}</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

function buildMyluaAnnounceHTML({ headline, subhead, stat, statLabel, eventLabel }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1080px; height: 1080px; overflow: hidden; font-family: 'Poppins', sans-serif; background: #2C4D45; }
.card { width: 1080px; height: 1080px; position: relative; display: flex; flex-direction: column; justify-content: space-between; padding: 72px 72px 64px; }
.card::before { content: ''; position: absolute; left: 0; top: 0; width: 7px; height: 100%; background: #DFAC7A; }
.grad { position: absolute; inset: 0; background: radial-gradient(ellipse at 20% 80%, rgba(223,172,122,0.1) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(168,109,83,0.08) 0%, transparent 50%); pointer-events: none; }
.lotus-bg { position: absolute; bottom: -120px; right: -120px; width: 500px; height: 500px; opacity: 0.06; }
.lotus-ring { position: absolute; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #DFAC7A; }
.top { position: relative; z-index: 2; }
.event-label { font-size: 12px; font-weight: 700; letter-spacing: 0.2em; color: #DFAC7A; text-transform: uppercase; margin-bottom: 32px; }
.headline { font-size: 64px; font-weight: 800; color: #FFFFFF; line-height: 1.05; letter-spacing: -0.03em; margin-bottom: 20px; }
.subhead { font-size: 22px; font-weight: 400; color: rgba(250,247,242,0.7); line-height: 1.4; letter-spacing: -0.01em; }
.stat-chip { display: inline-block; margin-top: 48px; background: rgba(250,247,242,0.08); border: 1px solid rgba(223,172,122,0.3); border-radius: 12px; padding: 20px 32px; }
.stat-num { font-size: 72px; font-weight: 800; color: #DFAC7A; line-height: 1; letter-spacing: -0.04em; }
.stat-lbl { font-size: 17px; font-weight: 400; color: rgba(250,247,242,0.75); margin-top: 6px; }
.bottom { position: relative; z-index: 2; }
.logo-text { font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em; }
.logo-url { font-size: 14px; color: rgba(250,247,242,0.4); margin-top: 6px; }
</style>
</head>
<body>
<div class="card">
  <div class="grad"></div>
  <div class="lotus-bg">
    <div class="lotus-ring" style="width:500px;height:500px;"></div>
    <div class="lotus-ring" style="width:360px;height:360px;opacity:0.7;"></div>
    <div class="lotus-ring" style="width:240px;height:240px;opacity:0.5;"></div>
    <div class="lotus-ring" style="width:130px;height:130px;opacity:0.3;"></div>
  </div>
  <div class="top">
    <div class="event-label">${eventLabel}</div>
    <div class="headline">${headline}</div>
    <div class="subhead">${subhead}</div>
    <div class="stat-chip">
      <div class="stat-num">${stat}</div>
      <div class="stat-lbl">${statLabel}</div>
    </div>
  </div>
  <div class="bottom">
    <div class="logo-text">MyLÚA Health</div>
    <div class="logo-url">myluahealth.com</div>
  </div>
</div>
</body>
</html>`;
}

function buildMyluaQuoteHTML({ quote, attribution }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,400;1,700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1080px; height: 1080px; overflow: hidden; font-family: 'Poppins', sans-serif; background: #FAF7F2; }
.card { width: 1080px; height: 1080px; position: relative; display: flex; flex-direction: column; justify-content: center; padding: 80px 96px; }
.card::before { content: ''; position: absolute; left: 0; top: 0; width: 7px; height: 100%; background: #2C4D45; }
.card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: #2C4D45; }
.quote-mark { font-family: 'Playfair Display', serif; font-size: 180px; font-weight: 700; color: #DFAC7A; line-height: 0.7; margin-bottom: 32px; }
.quote-text { font-family: 'Playfair Display', serif; font-style: italic; font-size: 40px; font-weight: 400; color: #2C4D45; line-height: 1.4; letter-spacing: -0.01em; margin-bottom: 48px; }
.rule { width: 80px; height: 4px; background: #DFAC7A; margin-bottom: 32px; }
.attribution-name { font-size: 20px; font-weight: 600; color: #2C4D45; letter-spacing: -0.01em; margin-bottom: 6px; }
.attribution-role { font-size: 16px; font-weight: 400; color: rgba(44,77,69,0.55); }
.bottom { position: absolute; bottom: 64px; left: 96px; right: 96px; display: flex; align-items: flex-end; justify-content: space-between; }
.logo-text { font-size: 22px; font-weight: 700; color: #2C4D45; letter-spacing: -0.02em; }
.lotus-mark { width: 64px; height: 64px; position: relative; }
.lotus-ring-sm { position: absolute; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%,-50%); background: #DFAC7A; }
</style>
</head>
<body>
<div class="card">
  <div class="quote-mark">"</div>
  <div class="quote-text">${quote}</div>
  <div class="rule"></div>
  <div class="attribution-name">${attribution.split(',')[0] || attribution}</div>
  <div class="attribution-role">${attribution.split(',').slice(1).join(',').trim() || ''}</div>
  <div class="bottom">
    <div class="logo-text">MyLÚA Health</div>
    <div class="lotus-mark">
      <div class="lotus-ring-sm" style="width:64px;height:64px;opacity:0.2;"></div>
      <div class="lotus-ring-sm" style="width:44px;height:44px;opacity:0.35;"></div>
      <div class="lotus-ring-sm" style="width:26px;height:26px;opacity:0.6;"></div>
      <div class="lotus-ring-sm" style="width:12px;height:12px;opacity:1;"></div>
    </div>
  </div>
</div>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { brand, template, data } = req.body;
  if (!brand || !template) return res.status(400).json({ error: 'Missing brand or template' });

  let html = '';

  if (brand === 'mylua') {
    if (template === 'stats') {
      html = buildMyluaStatsHTML({
        stat1: data?.stat1 || '90%+',
        label1: data?.label1 || 'first-trimester PPD risk accuracy',
        stat2: data?.stat2 || '79%',
        label2: data?.label2 || 'comfortable sharing sensitive data',
        stat3: data?.stat3 || '64%',
        label3: data?.label3 || 'health risk assessment completion',
        headline: data?.headline || 'Early validation data\nfrom our pilots.',
        rightStat: data?.rightStat || '80%',
        rightLabel: data?.rightLabel || 'of maternal deaths\nare preventable.',
        missionLine1: data?.missionLine1 || 'The system failed them.',
        missionLine2: data?.missionLine2 || 'MyLÚA is built\nto change that.',
        contextLabel: data?.contextLabel || 'Black Maternal Health Week 2026',
      });
    } else if (template === 'announce') {
      html = buildMyluaAnnounceHTML({
        headline: data?.headline || 'MyLÚA Health',
        subhead: data?.subhead || 'Enterprise agentic AI for perinatal care.',
        stat: data?.stat || '90%+',
        statLabel: data?.statLabel || 'first-trimester PPD risk accuracy',
        eventLabel: data?.eventLabel || 'Black Maternal Health Week 2026',
      });
    } else if (template === 'quote') {
      html = buildMyluaQuoteHTML({
        quote: data?.quote || 'It felt targeted to my specific needs, so I trusted the information more.',
        attribution: data?.attribution || 'Mother, Pilot User',
      });
    }
  }

  if (!html) return res.status(400).json({ error: 'Unknown template' });

  // Write HTML to temp file
  const tmpHtml = `/tmp/graphic-${Date.now()}.html`;
  const tmpPng = `/tmp/graphic-${Date.now()}.png`;
  fs.writeFileSync(tmpHtml, html);

  try {
    // Use playwright CLI to render
    execSync(`python3 -c "
import asyncio
from playwright.async_api import async_playwright

async def render():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        page = await browser.new_page(viewport={'width': 1080, 'height': 1080}, device_scale_factor=2)
        await page.goto('file://${tmpHtml}')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(3000)
        await page.screenshot(path='${tmpPng}', full_page=False, type='png')
        await browser.close()

asyncio.run(render())
"`, { timeout: 30000 });

    const imageBuffer = fs.readFileSync(tmpPng);
    const base64 = imageBuffer.toString('base64');

    // Cleanup
    fs.unlinkSync(tmpHtml);
    fs.unlinkSync(tmpPng);

    return res.status(200).json({
      image: `data:image/png;base64,${base64}`,
      format: 'png',
    });
  } catch (err) {
    console.error('Render error:', err);
    return res.status(500).json({ error: 'Render failed', details: err.message });
  }
}
