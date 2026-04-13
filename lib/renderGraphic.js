import { PLATFORM_SIZES } from './constants';

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawLotusMark(ctx, cx, cy, size, opacity = 0.06) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(cx, cy);
  const petalCount = 8;
  const petalLen = size * 0.5;
  ctx.fillStyle = '#DFAC7A';
  for (let i = 0; i < petalCount; i++) {
    ctx.save();
    ctx.rotate((i / petalCount) * Math.PI * 2);
    ctx.beginPath();
    ctx.ellipse(0, -petalLen * 0.55, petalLen * 0.18, petalLen * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────
// MYLÚA TEMPLATES (5)
// ─────────────────────────────────────────────────────────────────

function drawMyluaAnnounce(ctx, w, h, data) {
  const { headline = 'MyLÚA Health', subhead = 'Enterprise agentic AI for perinatal care', stat = '90%+', statLabel = 'first-trimester PPD accuracy', logoImg, ibmLogoImg, photoImg } = data;

  ctx.fillStyle = '#2C4D45';
  ctx.fillRect(0, 0, w, h);

  const grad = ctx.createRadialGradient(w * 0.2, h * 0.8, 0, w * 0.2, h * 0.8, w * 0.7);
  grad.addColorStop(0, 'rgba(223,172,122,0.12)');
  grad.addColorStop(1, 'rgba(223,172,122,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (photoImg) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.drawImage(photoImg, w * 0.5, 0, w * 0.5, h);
    ctx.restore();
    const pg = ctx.createLinearGradient(w * 0.5, 0, w, 0);
    pg.addColorStop(0, '#2C4D45');
    pg.addColorStop(0.4, 'rgba(44,77,69,0.6)');
    pg.addColorStop(1, 'rgba(44,77,69,0.1)');
    ctx.fillStyle = pg;
    ctx.fillRect(w * 0.5, 0, w * 0.5, h);
  }

  drawLotusMark(ctx, w * 0.75, h * 0.42, w * 0.45, 0.05);

  ctx.fillStyle = '#DFAC7A';
  ctx.font = `600 ${Math.round(w * 0.022)}px Poppins, sans-serif`;
  ctx.fillText('MYLÚA HEALTH', Math.round(w * 0.06), Math.round(h * 0.1));

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 ${Math.round(w * 0.058)}px Poppins, sans-serif`;
  wrapText(ctx, headline, w * 0.82).forEach((line, i) => {
    ctx.fillText(line, Math.round(w * 0.06), Math.round(h * 0.26) + i * Math.round(w * 0.075));
  });

  ctx.fillStyle = 'rgba(250,247,242,0.75)';
  ctx.font = `400 ${Math.round(w * 0.03)}px Poppins, sans-serif`;
  wrapText(ctx, subhead, w * 0.75).forEach((line, i) => {
    ctx.fillText(line, Math.round(w * 0.06), Math.round(h * 0.44) + i * Math.round(w * 0.042));
  });

  ctx.fillStyle = 'rgba(250,247,242,0.1)';
  roundRect(ctx, Math.round(w * 0.06), Math.round(h * 0.54), Math.round(w * 0.4), Math.round(h * 0.15), 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(223,172,122,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#DFAC7A';
  ctx.font = `700 ${Math.round(w * 0.065)}px Poppins, sans-serif`;
  ctx.fillText(stat, Math.round(w * 0.1), Math.round(h * 0.635));

  ctx.fillStyle = 'rgba(250,247,242,0.8)';
  ctx.font = `400 ${Math.round(w * 0.024)}px Poppins, sans-serif`;
  ctx.fillText(statLabel, Math.round(w * 0.1), Math.round(h * 0.665));

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, h * 0.82, w, h * 0.18);

  if (logoImg) {
    ctx.drawImage(logoImg, Math.round(w * 0.06), Math.round(h * 0.86), Math.round(w * 0.22), Math.round(h * 0.055));
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 ${Math.round(w * 0.038)}px Poppins, sans-serif`;
    ctx.fillText('MyLÚA Health', Math.round(w * 0.06), Math.round(h * 0.895));
  }

  if (ibmLogoImg) {
    ctx.save();
    ctx.filter = 'brightness(10)';
    ctx.globalAlpha = 0.85;
    ctx.drawImage(ibmLogoImg, w - Math.round(w * 0.32), Math.round(h * 0.865), Math.round(w * 0.24), Math.round(h * 0.05));
    ctx.restore();
  }
}

function drawMyluaQuote(ctx, w, h, data) {
  const { quote = '"It felt targeted to my specific needs, so I trusted the information more."', attribution = 'Mother, Pilot User', logoImg, photoImg } = data;

  ctx.fillStyle = '#FAF7F2';
  ctx.fillRect(0, 0, w, h);

  if (photoImg) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w * 0.38, h);
    ctx.clip();
    ctx.drawImage(photoImg, 0, 0, w * 0.38, h);
    ctx.restore();
    const pg = ctx.createLinearGradient(0, 0, w * 0.38, 0);
    pg.addColorStop(0.6, 'rgba(250,247,242,0)');
    pg.addColorStop(1, '#FAF7F2');
    ctx.fillStyle = pg;
    ctx.fillRect(0, 0, w * 0.38, h);
  }

  ctx.fillStyle = '#2C4D45';
  ctx.fillRect(0, 0, Math.round(w * 0.012), h);

  drawLotusMark(ctx, w * 0.72, h * 0.48, w * 0.4, 0.07);

  ctx.fillStyle = '#2C4D45';
  ctx.fillRect(Math.round(w * 0.44), Math.round(h * 0.1), Math.round(w * 0.5), 2);

  ctx.fillStyle = '#DFAC7A';
  ctx.font = `700 ${Math.round(w * 0.14)}px Georgia, serif`;
  ctx.fillText('"', Math.round(w * 0.42), Math.round(h * 0.28));

  ctx.fillStyle = '#2C4D45';
  ctx.font = `400 ${Math.round(w * 0.042)}px Georgia, serif`;
  const qLines = wrapText(ctx, quote.replace(/['"]/g, ''), w * 0.5);
  qLines.forEach((line, i) => {
    ctx.fillText(line, Math.round(w * 0.44), Math.round(h * 0.36) + i * Math.round(w * 0.057));
  });

  const attrY = Math.round(h * 0.36) + qLines.length * Math.round(w * 0.057) + Math.round(h * 0.06);
  ctx.fillStyle = '#A86D53';
  ctx.font = `600 ${Math.round(w * 0.026)}px Poppins, sans-serif`;
  ctx.fillText(`— ${attribution}`, Math.round(w * 0.44), attrY);

  ctx.fillStyle = '#2C4D45';
  ctx.fillRect(Math.round(w * 0.44), h * 0.84, Math.round(w * 0.5), 1);

  if (logoImg) {
    ctx.drawImage(logoImg, Math.round(w * 0.44), Math.round(h * 0.88), Math.round(w * 0.2), Math.round(h * 0.05));
  }
}

function drawMyluaStats(ctx, w, h, data) {
  const { logoImg, ibmLogoImg, photoImg } = data;
  const STATS = [
    { num: '90%+', label: 'first-trimester PPD risk accuracy' },
    { num: '79%', label: 'comfortable sharing sensitive data' },
    { num: '64%', label: 'health risk assessment completion' },
  ];

  ctx.fillStyle = '#FAF7F2';
  ctx.fillRect(0, 0, w, h);

  if (photoImg) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(w * 0.58, 0, w * 0.42, h);
    ctx.clip();
    ctx.drawImage(photoImg, w * 0.58, 0, w * 0.42, h);
    ctx.restore();
    const pg = ctx.createLinearGradient(w * 0.58, 0, w, 0);
    pg.addColorStop(0, '#FAF7F2');
    pg.addColorStop(0.25, 'rgba(250,247,242,0.5)');
    pg.addColorStop(1, 'rgba(250,247,242,0.1)');
    ctx.fillStyle = pg;
    ctx.fillRect(w * 0.58, 0, w * 0.42, h);
  }

  ctx.fillStyle = '#2C4D45';
  ctx.fillRect(0, 0, Math.round(w * 0.012), h);

  ctx.fillStyle = '#2C4D45';
  ctx.font = `600 ${Math.round(w * 0.018)}px Poppins, sans-serif`;
  ctx.fillText('PILOT OUTCOMES', Math.round(w * 0.06), Math.round(h * 0.1));

  ctx.font = `700 ${Math.round(w * 0.048)}px Poppins, sans-serif`;
  ctx.fillText('Early validation data', Math.round(w * 0.06), Math.round(h * 0.2));
  ctx.fillText('from our pilots.', Math.round(w * 0.06), Math.round(h * 0.268));

  STATS.forEach((s, i) => {
    const y = Math.round(h * 0.36) + i * Math.round(h * 0.17);
    ctx.fillStyle = 'rgba(44,77,69,0.15)';
    ctx.fillRect(Math.round(w * 0.06), y - 10, Math.round(w * 0.48), 1);
    ctx.fillStyle = '#A86D53';
    ctx.font = `700 ${Math.round(w * 0.068)}px Poppins, sans-serif`;
    ctx.fillText(s.num, Math.round(w * 0.06), y + Math.round(h * 0.09));
    ctx.fillStyle = '#2C4D45';
    ctx.font = `400 ${Math.round(w * 0.026)}px Poppins, sans-serif`;
    ctx.fillText(s.label, Math.round(w * 0.06), y + Math.round(h * 0.125));
  });

  ctx.fillStyle = 'rgba(44,77,69,0.45)';
  ctx.font = `400 ${Math.round(w * 0.02)}px Poppins, sans-serif`;
  ctx.fillText('University-based research pilot · HIPAA-compliant', Math.round(w * 0.06), Math.round(h * 0.84));

  ctx.fillStyle = 'rgba(44,77,69,0.2)';
  ctx.fillRect(Math.round(w * 0.06), h * 0.87, Math.round(w * 0.5), 1);

  if (logoImg) ctx.drawImage(logoImg, Math.round(w * 0.06), Math.round(h * 0.9), Math.round(w * 0.2), Math.round(h * 0.05));
  if (ibmLogoImg) ctx.drawImage(ibmLogoImg, Math.round(w * 0.32), Math.round(h * 0.9), Math.round(w * 0.18), Math.round(h * 0.04));
}

function drawMyluaInsight(ctx, w, h, data) {
  const { headline = 'When mothers have the right resources early,\nit decreases the hopelessness.', attribution = 'SVP of Health Services, Payer', logoImg, photoImg } = data;

  ctx.fillStyle = '#1E3730';
  ctx.fillRect(0, 0, w, h);

  if (photoImg) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.drawImage(photoImg, 0, 0, w, h);
    ctx.restore();
  }

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(30,55,48,0.3)');
  grad.addColorStop(0.5, 'rgba(30,55,48,0.6)');
  grad.addColorStop(1, 'rgba(30,55,48,0.95)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  drawLotusMark(ctx, w * 0.5, h * 0.38, w * 0.5, 0.04);

  ctx.fillStyle = '#DFAC7A';
  ctx.fillRect(Math.round(w * 0.06), Math.round(h * 0.08), Math.round(w * 0.12), 3);

  ctx.font = `600 ${Math.round(w * 0.02)}px Poppins, sans-serif`;
  ctx.fillText('INSIGHT', Math.round(w * 0.06), Math.round(h * 0.15));

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 ${Math.round(w * 0.052)}px Poppins, sans-serif`;
  headline.split('\n').forEach((line, i) => {
    ctx.fillText(line, Math.round(w * 0.06), Math.round(h * 0.52) + i * Math.round(w * 0.068));
  });

  ctx.fillStyle = 'rgba(250,247,242,0.6)';
  ctx.font = `400 ${Math.round(w * 0.025)}px Poppins, sans-serif`;
  ctx.fillText(`— ${attribution}`, Math.round(w * 0.06), Math.round(h * 0.72));

  ctx.fillStyle = 'rgba(223,172,122,0.3)';
  ctx.fillRect(Math.round(w * 0.06), h * 0.82, Math.round(w * 0.88), 1);

  if (logoImg) {
    ctx.save();
    ctx.filter = 'brightness(10)';
    ctx.globalAlpha = 0.9;
    ctx.drawImage(logoImg, Math.round(w * 0.06), Math.round(h * 0.87), Math.round(w * 0.2), Math.round(h * 0.05));
    ctx.restore();
  }
}

function drawMyluaEvent(ctx, w, h, data) {
  const { eventLabel = 'BLACK MATERNAL HEALTH WEEK', eventDate = 'April 11–17, 2026', headline = 'MyLÚA Health', subhead = 'Supporting birthing parents before, during, and after.', logoImg, photoImg } = data;

  if (photoImg) {
    ctx.drawImage(photoImg, 0, 0, w, h);
  } else {
    ctx.fillStyle = '#2C4D45';
    ctx.fillRect(0, 0, w, h);
  }

  const grad = ctx.createLinearGradient(0, h * 0.3, 0, h);
  grad.addColorStop(0, 'rgba(15,36,32,0.2)');
  grad.addColorStop(1, 'rgba(15,36,32,0.92)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#DFAC7A';
  roundRect(ctx, Math.round(w * 0.06), Math.round(h * 0.07), Math.round(w * 0.6), Math.round(h * 0.065), 6);
  ctx.fill();
  ctx.fillStyle = '#1E3730';
  ctx.font = `700 ${Math.round(w * 0.022)}px Poppins, sans-serif`;
  ctx.fillText(eventLabel, Math.round(w * 0.09), Math.round(h * 0.115));

  ctx.fillStyle = 'rgba(250,247,242,0.75)';
  ctx.font = `400 ${Math.round(w * 0.026)}px Poppins, sans-serif`;
  ctx.fillText(eventDate, Math.round(w * 0.06), Math.round(h * 0.22));

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 ${Math.round(w * 0.058)}px Poppins, sans-serif`;
  ctx.fillText(headline, Math.round(w * 0.06), Math.round(h * 0.74));

  ctx.fillStyle = 'rgba(250,247,242,0.7)';
  ctx.font = `400 ${Math.round(w * 0.028)}px Poppins, sans-serif`;
  wrapText(ctx, subhead, w * 0.82).forEach((line, i) => {
    ctx.fillText(line, Math.round(w * 0.06), Math.round(h * 0.8) + i * Math.round(w * 0.038));
  });

  if (logoImg) {
    ctx.save();
    ctx.filter = 'brightness(10)';
    ctx.globalAlpha = 0.9;
    ctx.drawImage(logoImg, Math.round(w * 0.06), Math.round(h * 0.89), Math.round(w * 0.2), Math.round(h * 0.05));
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────
// HENWAY TEMPLATES (5)
// ─────────────────────────────────────────────────────────────────

function drawHenwayStatCard(ctx, w, h, data) {
  const { stat = '40%', statLabel = 'YOUR STAT LABEL HERE', body = 'Your one-line systems take goes here — what it means for founders and operators.', logoImg } = data;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#FFCC00';
  ctx.fillRect(0, 0, Math.round(w * 0.012), h);
  ctx.fillRect(Math.round(w * 0.083), Math.round(h * 0.1), Math.round(w * 0.42), 3);

  ctx.fillStyle = '#FFCC00';
  ctx.font = `700 ${Math.round(w * 0.183)}px Raleway, Arial, sans-serif`;
  ctx.fillText(stat, Math.round(w * 0.083), Math.round(h * 0.32));

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `400 ${Math.round(w * 0.034)}px Raleway, Arial, sans-serif`;
  ctx.fillText(statLabel.toUpperCase(), Math.round(w * 0.083), Math.round(h * 0.39));

  ctx.fillStyle = '#333333';
  ctx.fillRect(Math.round(w * 0.083), Math.round(h * 0.44), Math.round(w * 0.833), 1);

  ctx.fillStyle = '#CCCCCC';
  ctx.font = `400 ${Math.round(w * 0.03)}px Raleway, Arial, sans-serif`;
  wrapText(ctx, body, w * 0.82).forEach((line, i) => {
    ctx.fillText(line, Math.round(w * 0.083), Math.round(h * 0.535) + i * Math.round(w * 0.042));
  });

  ctx.fillStyle = '#222222';
  ctx.fillRect(Math.round(w * 0.083), h * 0.78, Math.round(w * 0.833), 1);

  if (logoImg) {
    ctx.drawImage(logoImg, Math.round(w * 0.083), Math.round(h * 0.82), Math.round(w * 0.28), Math.round(h * 0.065));
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 ${Math.round(w * 0.042)}px Raleway, Arial, sans-serif`;
    ctx.fillText('HENWAY', Math.round(w * 0.083), Math.round(h * 0.87));
  }
  ctx.fillStyle = '#666666';
  ctx.font = `400 ${Math.round(w * 0.022)}px Raleway, Arial, sans-serif`;
  ctx.fillText('henwayai.com', Math.round(w * 0.083), Math.round(h * 0.91));
}

function drawHenwayCarouselSlide1(ctx, w, h, data) {
  const { headline = 'Your bold claim\nor framework\ntitle here', slideNum = '1 / 6', logoImg } = data;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#FFCC00';
  ctx.fillRect(0, 0, Math.round(w * 0.012), h);
  ctx.fillRect(Math.round(w * 0.04), Math.round(h * 0.06), w - Math.round(w * 0.08), 1);

  ctx.fillStyle = '#888888';
  ctx.font = `400 ${Math.round(w * 0.028)}px Raleway, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(slideNum, w - Math.round(w * 0.04), Math.round(h * 0.055));
  ctx.textAlign = 'left';

  ctx.fillStyle = '#FFCC00';
  ctx.font = `700 ${Math.round(w * 0.022)}px Raleway, Arial, sans-serif`;
  ctx.fillText('SLIDE 1 — HOOK', Math.round(w * 0.04), Math.round(h * 0.14));

  const headLines = headline.split('\n');
  headLines.forEach((line, i) => {
    ctx.fillStyle = i === headLines.length - 1 ? '#FFCC00' : '#FFFFFF';
    ctx.font = `700 ${Math.round(w * 0.075)}px Georgia, serif`;
    ctx.fillText(line, Math.round(w * 0.04), Math.round(h * 0.32) + i * Math.round(w * 0.1));
  });

  ctx.fillStyle = '#666666';
  ctx.font = `400 ${Math.round(w * 0.027)}px Raleway, Arial, sans-serif`;
  ctx.fillText('Swipe to see the full breakdown →', Math.round(w * 0.04), Math.round(h * 0.87));

  if (logoImg) {
    ctx.drawImage(logoImg, Math.round(w * 0.04), Math.round(h * 0.9), Math.round(w * 0.3), Math.round(h * 0.07));
  }
}

function drawHenwayCarouselContent(ctx, w, h, data) {
  const { title = 'Point title goes here', body = 'Supporting explanation in 2 sentences max. Keep it tight and scannable.', slideNum = '2 / 6', logoImg } = data;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#FFCC00';
  ctx.fillRect(0, 0, Math.round(w * 0.012), h);

  ctx.fillStyle = '#FFCC00';
  ctx.font = `700 ${Math.round(w * 0.02)}px Raleway, Arial, sans-serif`;
  ctx.fillText(`SLIDE ${slideNum.split('/')[0].trim()}`, Math.round(w * 0.06), Math.round(h * 0.1));

  ctx.fillStyle = '#000000';
  ctx.fillRect(Math.round(w * 0.06), Math.round(h * 0.14), Math.round(w * 0.15), 2);

  ctx.font = `700 ${Math.round(w * 0.058)}px Georgia, serif`;
  wrapText(ctx, title, w * 0.85).forEach((line, i) => {
    ctx.fillText(line, Math.round(w * 0.06), Math.round(h * 0.28) + i * Math.round(w * 0.075));
  });

  ctx.fillStyle = '#555555';
  ctx.font = `400 ${Math.round(w * 0.03)}px Raleway, Arial, sans-serif`;
  wrapText(ctx, body, w * 0.85).forEach((line, i) => {
    ctx.fillText(line, Math.round(w * 0.06), Math.round(h * 0.5) + i * Math.round(w * 0.042));
  });

  ctx.fillStyle = '#CCCCCC';
  ctx.font = `400 ${Math.round(w * 0.025)}px Raleway, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(slideNum, w - Math.round(w * 0.06), Math.round(h * 0.93));
  ctx.textAlign = 'left';

  if (logoImg) ctx.drawImage(logoImg, Math.round(w * 0.06), Math.round(h * 0.9), Math.round(w * 0.22), Math.round(h * 0.055));
}

function drawHenwayCarouselClose(ctx, w, h, data) {
  const { closing = 'Your closing question\nor key takeaway', cta = 'Follow for weekly AI systems thinking.', logoImg } = data;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#FFCC00';
  ctx.fillRect(0, 0, Math.round(w * 0.012), h);

  ctx.font = `700 ${Math.round(w * 0.022)}px Raleway, Arial, sans-serif`;
  ctx.fillText('SLIDE 6 — CLOSE', Math.round(w * 0.04), Math.round(h * 0.14));

  ctx.fillRect(Math.round(w * 0.04), Math.round(h * 0.17), Math.round(w * 0.15), 2);

  closing.split('\n').forEach((line, i) => {
    ctx.fillStyle = i === closing.split('\n').length - 1 ? '#FFCC00' : '#FFFFFF';
    ctx.font = `700 ${Math.round(w * 0.065)}px Georgia, serif`;
    ctx.fillText(line, Math.round(w * 0.04), Math.round(h * 0.38) + i * Math.round(w * 0.088));
  });

  ctx.fillStyle = '#888888';
  ctx.font = `400 ${Math.round(w * 0.028)}px Raleway, Arial, sans-serif`;
  ctx.fillText(cta, Math.round(w * 0.04), Math.round(h * 0.76));

  if (logoImg) ctx.drawImage(logoImg, Math.round(w * 0.04), Math.round(h * 0.88), Math.round(w * 0.3), Math.round(h * 0.07));
}

function drawHenwayQuoteCard(ctx, w, h, data) {
  const { quote = 'Your pull-quote goes here — one sharp line that stands alone.', attribution = 'Dr. Michael Conward', role = 'Founder, Henway', logoImg } = data;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#FFCC00';
  ctx.fillRect(0, 0, w, Math.round(h * 0.012));
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, h - Math.round(h * 0.012), w, Math.round(h * 0.012));

  ctx.fillStyle = '#FFCC00';
  ctx.font = `700 ${Math.round(w * 0.17)}px Georgia, serif`;
  ctx.fillText('"', Math.round(w * 0.11), Math.round(h * 0.25));

  ctx.fillStyle = '#000000';
  ctx.font = `700 ${Math.round(w * 0.048)}px Georgia, serif`;
  const qLines = wrapText(ctx, quote, w * 0.78);
  qLines.forEach((line, i) => {
    ctx.fillText(line, Math.round(w * 0.11), Math.round(h * 0.36) + i * Math.round(w * 0.063));
  });

  const ruleY = Math.round(h * 0.36) + qLines.length * Math.round(w * 0.063) + Math.round(h * 0.05);
  ctx.fillStyle = '#FFCC00';
  ctx.fillRect(Math.round(w * 0.11), ruleY, Math.round(w * 0.12), 3);

  ctx.fillStyle = '#555555';
  ctx.font = `400 ${Math.round(w * 0.03)}px Raleway, Arial, sans-serif`;
  ctx.fillText(attribution, Math.round(w * 0.11), ruleY + Math.round(h * 0.08));

  ctx.fillStyle = '#999999';
  ctx.font = `400 ${Math.round(w * 0.026)}px Raleway, Arial, sans-serif`;
  ctx.fillText(role, Math.round(w * 0.11), ruleY + Math.round(h * 0.13));

  if (logoImg) ctx.drawImage(logoImg, w - Math.round(w * 0.36), h - Math.round(h * 0.13), Math.round(w * 0.26), Math.round(h * 0.065));
}

// ─────────────────────────────────────────────────────────────────
// BLABBING TEMPLATES (2)
// ─────────────────────────────────────────────────────────────────

function drawBlabbingIntelBrief(ctx, w, h, data) {
  const { headline = 'Market signal headline goes here', body = 'What Blabbing detected and why it matters for your business this week.', sentimentLabel = 'Rising frustration', source = 'Blabbing · 847 sources', logoImg } = data;

  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, w, h);

  const glow1 = ctx.createRadialGradient(w * 0.85, h * 0.15, 0, w * 0.85, h * 0.15, w * 0.5);
  glow1.addColorStop(0, 'rgba(94,23,235,0.12)');
  glow1.addColorStop(1, 'rgba(94,23,235,0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, w, h);

  const glow2 = ctx.createRadialGradient(w * 0.1, h * 0.9, 0, w * 0.1, h * 0.9, w * 0.4);
  glow2.addColorStop(0, 'rgba(255,189,89,0.08)');
  glow2.addColorStop(1, 'rgba(255,189,89,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#5e17eb';
  ctx.fillRect(0, 0, Math.round(w * 0.012), h);

  ctx.fillStyle = '#ffbd59';
  ctx.font = `700 ${Math.round(w * 0.022)}px Inter, Arial, sans-serif`;
  ctx.fillText('INTELLIGENCE BRIEF', Math.round(w * 0.06), Math.round(h * 0.1));

  ctx.fillStyle = 'rgba(255,189,89,0.3)';
  ctx.fillRect(Math.round(w * 0.06), Math.round(h * 0.125), Math.round(w * 0.88), 1);

  ctx.fillStyle = '#5e17eb';
  roundRect(ctx, Math.round(w * 0.06), Math.round(h * 0.145), Math.round(w * 0.32), Math.round(h * 0.058), 6);
  ctx.fill();
  ctx.fillStyle = '#e6e0f8';
  ctx.font = `500 ${Math.round(w * 0.026)}px Inter, Arial, sans-serif`;
  ctx.fillText(sentimentLabel, Math.round(w * 0.078), Math.round(h * 0.185));

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 ${Math.round(w * 0.054)}px Inter, Arial, sans-serif`;
  wrapText(ctx, headline, w * 0.86).forEach((line, i) => {
    ctx.fillText(line, Math.round(w * 0.06), Math.round(h * 0.31) + i * Math.round(w * 0.072));
  });

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(Math.round(w * 0.06), Math.round(h * 0.53), Math.round(w * 0.88), 1);

  ctx.fillStyle = '#aaaacc';
  ctx.font = `400 ${Math.round(w * 0.029)}px Inter, Arial, sans-serif`;
  wrapText(ctx, body, w * 0.86).forEach((line, i) => {
    ctx.fillText(line, Math.round(w * 0.06), Math.round(h * 0.595) + i * Math.round(w * 0.041));
  });

  ctx.fillStyle = '#444466';
  ctx.font = `500 ${Math.round(w * 0.024)}px Inter, Arial, sans-serif`;
  ctx.fillText(`Source: ${source}`, Math.round(w * 0.06), Math.round(h * 0.86));

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(Math.round(w * 0.06), h * 0.88, Math.round(w * 0.88), 1);

  if (logoImg) {
    ctx.save();
    ctx.filter = 'brightness(10)';
    ctx.globalAlpha = 0.85;
    ctx.drawImage(logoImg, w - Math.round(w * 0.34), Math.round(h * 0.9), Math.round(w * 0.28), Math.round(h * 0.065));
    ctx.restore();
  } else {
    ctx.fillStyle = '#ffbd59';
    ctx.font = `700 ${Math.round(w * 0.04)}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('blabbing', w - Math.round(w * 0.06), Math.round(h * 0.935));
    ctx.textAlign = 'left';
  }
}

function drawBlabbingSignalCard(ctx, w, h, data) {
  const { flaggedDay = 'Tuesday', publishedDay = 'Thursday', publication = 'TechCrunch', topic = 'AI-generated content regulatory anxiety', daysAhead = '11 days', logoImg } = data;

  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.6);
  glow.addColorStop(0, 'rgba(94,23,235,0.15)');
  glow.addColorStop(1, 'rgba(94,23,235,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#5e17eb';
  ctx.fillRect(0, 0, Math.round(w * 0.012), h);

  ctx.fillStyle = '#ffbd59';
  ctx.font = `700 ${Math.round(w * 0.022)}px Inter, Arial, sans-serif`;
  ctx.fillText('SIGNAL PROOF', Math.round(w * 0.06), Math.round(h * 0.1));

  // Flagged block
  ctx.fillStyle = '#5e17eb';
  roundRect(ctx, Math.round(w * 0.06), Math.round(h * 0.16), Math.round(w * 0.4), Math.round(h * 0.18), 8);
  ctx.fill();

  ctx.fillStyle = '#e6e0f8';
  ctx.font = `700 ${Math.round(w * 0.02)}px Inter, Arial, sans-serif`;
  ctx.fillText('BLABBING FLAGGED', Math.round(w * 0.09), Math.round(h * 0.215));

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 ${Math.round(w * 0.048)}px Inter, Arial, sans-serif`;
  ctx.fillText(flaggedDay, Math.round(w * 0.09), Math.round(h * 0.305));

  // Arrow
  ctx.fillStyle = '#ffbd59';
  ctx.font = `700 ${Math.round(w * 0.05)}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('→', w * 0.57, Math.round(h * 0.27));
  ctx.textAlign = 'left';

  // Published block
  ctx.fillStyle = '#1a1a1a';
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  roundRect(ctx, Math.round(w * 0.64), Math.round(h * 0.16), Math.round(w * 0.3), Math.round(h * 0.18), 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#666666';
  ctx.font = `700 ${Math.round(w * 0.02)}px Inter, Arial, sans-serif`;
  ctx.fillText(publication.toUpperCase(), Math.round(w * 0.665), Math.round(h * 0.215));

  ctx.fillStyle = '#888888';
  ctx.font = `700 ${Math.round(w * 0.048)}px Inter, Arial, sans-serif`;
  ctx.fillText(publishedDay, Math.round(w * 0.665), Math.round(h * 0.305));

  // Days ahead
  ctx.fillStyle = '#ffbd59';
  ctx.font = `700 ${Math.round(w * 0.07)}px Inter, Arial, sans-serif`;
  ctx.fillText(`${daysAhead} ahead`, Math.round(w * 0.06), Math.round(h * 0.5));

  ctx.fillStyle = 'rgba(255,189,89,0.5)';
  ctx.font = `400 ${Math.round(w * 0.028)}px Inter, Arial, sans-serif`;
  ctx.fillText('of mainstream coverage', Math.round(w * 0.06), Math.round(h * 0.555));

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `400 ${Math.round(w * 0.032)}px Inter, Arial, sans-serif`;
  wrapText(ctx, `Topic: ${topic}`, w * 0.86).forEach((line, i) => {
    ctx.fillText(line, Math.round(w * 0.06), Math.round(h * 0.64) + i * Math.round(w * 0.042));
  });

  ctx.fillStyle = '#444466';
  ctx.font = `400 ${Math.round(w * 0.026)}px Inter, Arial, sans-serif`;
  ctx.fillText('Know your market before everyone else does.', Math.round(w * 0.06), Math.round(h * 0.82));

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(Math.round(w * 0.06), h * 0.87, Math.round(w * 0.88), 1);

  if (logoImg) {
    ctx.save();
    ctx.filter = 'brightness(10)';
    ctx.globalAlpha = 0.85;
    ctx.drawImage(logoImg, w - Math.round(w * 0.34), Math.round(h * 0.9), Math.round(w * 0.28), Math.round(h * 0.065));
    ctx.restore();
  } else {
    ctx.fillStyle = '#5e17eb';
    ctx.font = `700 ${Math.round(w * 0.038)}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('blabbing.io', w - Math.round(w * 0.06), Math.round(h * 0.935));
    ctx.textAlign = 'left';
  }
}

// ─────────────────────────────────────────────────────────────────
// CAROUSEL ZIP RENDERER
// ─────────────────────────────────────────────────────────────────

export function renderCarouselSlides(brand, data, images = {}) {
  const size = PLATFORM_SIZES['Instagram Feed'];
  const slides = [];

  if (brand === 'henway') {
    const c1 = document.createElement('canvas');
    c1.width = size.w; c1.height = size.h;
    drawHenwayCarouselSlide1(c1.getContext('2d'), size.w, size.h, {
      headline: data.slide1Headline || 'Your bold claim\nor framework\ntitle here',
      slideNum: '1 / 6', logoImg: images.logo,
    });
    slides.push({ name: 'slide-1-hook.png', dataUrl: c1.toDataURL('image/png') });

    const points = data.points || [
      { title: 'Point one', body: 'Supporting explanation — keep it tight and scannable.' },
      { title: 'Point two', body: 'The key insight here. Two sentences maximum.' },
      { title: 'Point three', body: 'What this means for founders and operators.' },
      { title: 'Point four', body: 'The practical takeaway. What to do with this.' },
    ];
    points.slice(0, 4).forEach((pt, i) => {
      const c = document.createElement('canvas');
      c.width = size.w; c.height = size.h;
      drawHenwayCarouselContent(c.getContext('2d'), size.w, size.h, {
        title: pt.title, body: pt.body, slideNum: `${i + 2} / 6`, logoImg: images.logo,
      });
      slides.push({ name: `slide-${i + 2}-content.png`, dataUrl: c.toDataURL('image/png') });
    });

    const c6 = document.createElement('canvas');
    c6.width = size.w; c6.height = size.h;
    drawHenwayCarouselClose(c6.getContext('2d'), size.w, size.h, {
      closing: data.closing || 'Your closing question\nor key takeaway',
      cta: data.cta || 'Follow for weekly AI systems thinking.',
      logoImg: images.logo,
    });
    slides.push({ name: 'slide-6-close.png', dataUrl: c6.toDataURL('image/png') });
  }

  return slides;
}

// ─────────────────────────────────────────────────────────────────
// TEMPLATE REGISTRY
// ─────────────────────────────────────────────────────────────────

export function getTemplatesForBrand(brand) {
  if (brand === 'henway') return [
    { id: 'stat', label: 'Stat card', desc: 'Black bg · yellow number' },
    { id: 'carousel-hook', label: 'Carousel slide 1', desc: 'Black bg · hook' },
    { id: 'carousel-content', label: 'Carousel slide 2–5', desc: 'White bg · content' },
    { id: 'carousel-close', label: 'Carousel slide 6', desc: 'Black bg · close' },
    { id: 'quote', label: 'Quote card', desc: 'White bg · yellow bars' },
  ];
  if (brand === 'blabbing') return [
    { id: 'intel', label: 'Intelligence brief', desc: 'Dark bg · indigo + gold' },
    { id: 'signal', label: 'Signal proof card', desc: 'Dark bg · proof loop' },
  ];
  return [
    { id: 'announce', label: 'Announce', desc: 'Teal bg · stat chip' },
    { id: 'quote', label: 'Quote card', desc: 'Cream bg · user quote' },
    { id: 'stats', label: 'Stats card', desc: 'Three stat blocks' },
    { id: 'insight', label: 'Insight card', desc: 'Dark overlay · quote' },
    { id: 'event', label: 'Event card', desc: 'Full bleed · BMHW/launch' },
  ];
}

// ─────────────────────────────────────────────────────────────────
// MAIN RENDERER
// ─────────────────────────────────────────────────────────────────

export function renderGraphic(canvas, { brand, template, platform, data = {}, images = {} }) {
  const size = PLATFORM_SIZES[platform] || PLATFORM_SIZES['Instagram Feed'];
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size.w, size.h);

  const d = { logoImg: images.logo || null, ibmLogoImg: images.ibm || null, photoImg: images.photo || null, ...data };

  if (brand === 'henway') {
    if (template === 'stat') drawHenwayStatCard(ctx, size.w, size.h, d);
    else if (template === 'carousel-hook') drawHenwayCarouselSlide1(ctx, size.w, size.h, d);
    else if (template === 'carousel-content') drawHenwayCarouselContent(ctx, size.w, size.h, d);
    else if (template === 'carousel-close') drawHenwayCarouselClose(ctx, size.w, size.h, d);
    else if (template === 'quote') drawHenwayQuoteCard(ctx, size.w, size.h, d);
    else drawHenwayStatCard(ctx, size.w, size.h, d);
  } else if (brand === 'blabbing') {
    if (template === 'signal') drawBlabbingSignalCard(ctx, size.w, size.h, d);
    else drawBlabbingIntelBrief(ctx, size.w, size.h, d);
  } else {
    if (template === 'quote') drawMyluaQuote(ctx, size.w, size.h, d);
    else if (template === 'stats') drawMyluaStats(ctx, size.w, size.h, d);
    else if (template === 'insight') drawMyluaInsight(ctx, size.w, size.h, d);
    else if (template === 'event') drawMyluaEvent(ctx, size.w, size.h, d);
    else drawMyluaAnnounce(ctx, size.w, size.h, d);
  }
}
