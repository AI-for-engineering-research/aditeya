document.documentElement.style.background = '#06080d';

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('visible'));
}

const progress = document.querySelector('.scroll-progress');
const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function updateScrollUI() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const percent = max > 0 ? (window.scrollY / max) * 100 : 0;
  if (progress) progress.style.setProperty('--scroll', `${percent}%`);

  let current = '';
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= 140) current = `#${section.id}`;
  });
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === current));
}
updateScrollUI();
window.addEventListener('scroll', updateScrollUI, { passive: true });

const canTilt = window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (canTilt) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -4}deg) rotateY(${x * 5}deg) translateY(-2px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

function burstEmojis(target, event) {
  const emojis = (target.dataset.emojis || '🎉').split(',');
  const rect = target.getBoundingClientRect();
  const originX = event?.clientX ?? rect.left + rect.width / 2;
  const originY = event?.clientY ?? rect.top + rect.height / 2;
  const particles = 9;

  for (let index = 0; index < particles; index += 1) {
    const particle = document.createElement('span');
    const angle = (-150 + index * (300 / (particles - 1))) * (Math.PI / 180);
    const distance = 48 + Math.random() * 46;

    particle.className = 'emoji-burst';
    particle.textContent = emojis[index % emojis.length].trim();
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--dy', `${Math.sin(angle) * distance - 18}px`);
    particle.style.setProperty('--rot', `${Math.random() * 120 - 60}deg`);
    document.body.appendChild(particle);
    window.setTimeout(() => particle.remove(), 1350);
  }
}

document.querySelectorAll('.burst-word').forEach((word) => {
  let burstTimer;
  let lastEvent;

  const startBursting = (event) => {
    lastEvent = event;
    if (burstTimer) return;
    burstEmojis(word, lastEvent);
    burstTimer = window.setInterval(() => burstEmojis(word, lastEvent), 900);
  };

  const stopBursting = () => {
    window.clearInterval(burstTimer);
    burstTimer = undefined;
  };

  word.addEventListener('pointerenter', startBursting);
  word.addEventListener('pointermove', (event) => { lastEvent = event; });
  word.addEventListener('pointerleave', stopBursting);
  word.addEventListener('focus', startBursting);
  word.addEventListener('blur', stopBursting);
  word.addEventListener('click', (event) => burstEmojis(word, event));
});

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

function setCopyStatus(button, label) {
  const original = button.dataset.originalLabel || button.textContent;
  button.dataset.originalLabel = original;
  button.textContent = label;
  window.setTimeout(() => { button.textContent = original; }, 1400);
}

document.querySelectorAll('.copy-email').forEach((button) => {
  button.addEventListener('click', async () => {
    const email = button.dataset.email;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(email);
      } else if (!fallbackCopy(email)) {
        throw new Error('Copy failed');
      }
      setCopyStatus(button, 'Copied');
    } catch {
      setCopyStatus(button, email);
    }
  });
});

const payloadRangePoints = {
  'max-payload': {
    title: 'A · Maximum structural payload',
    copy: 'This point anchors the structural payload limit. It is useful for understanding payload capacity, but it is not a range-sizing condition.',
    x: 58, y: 72, payload: 100, range: 0, fuel: 8, regime: 'structural payload limit',
  },
  'max-payload-range': {
    title: 'B · Maximum-payload range',
    copy: 'This is the farthest range at maximum payload. Past this point, the aircraft trades payload for fuel while staying within gross-weight and fuel-volume constraints.',
    x: 210, y: 72, payload: 100, range: 42, fuel: 50, regime: 'payload limited',
  },
  sizing: {
    title: 'C · Selected-payload maximum-range sizing mission',
    copy: 'This project sizes the B737-800-like model here: the maximum range for the selected sizing payload on the highest-gross-weight APD line. It is fuel/MTOW-limited, but not the ferry point.',
    x: 360, y: 158, payload: 58, range: 72, fuel: 88, regime: 'fuel / MTOW limited',
  },
  ferry: {
    title: 'D · Zero-payload ferry range',
    copy: 'The ferry point is the maximum range with no payload. It is useful as a held-out validation point, but it is not the passenger sizing mission.',
    x: 490, y: 260, payload: 0, range: 100, fuel: 100, regime: 'fuel limited ferry',
  },
};

function pointFromPayload(payload) {
  const p = Math.max(0, Math.min(100, payload));
  if (p >= payloadRangePoints.sizing.payload) {
    const t = (100 - p) / (100 - payloadRangePoints.sizing.payload);
    return {
      x: payloadRangePoints['max-payload-range'].x + t * (payloadRangePoints.sizing.x - payloadRangePoints['max-payload-range'].x),
      y: payloadRangePoints['max-payload-range'].y + t * (payloadRangePoints.sizing.y - payloadRangePoints['max-payload-range'].y),
      range: payloadRangePoints['max-payload-range'].range + t * (payloadRangePoints.sizing.range - payloadRangePoints['max-payload-range'].range),
      fuel: payloadRangePoints['max-payload-range'].fuel + t * (payloadRangePoints.sizing.fuel - payloadRangePoints['max-payload-range'].fuel),
      regime: t < 0.18 ? 'payload limited' : 'fuel / MTOW trade',
    };
  }
  const t = (payloadRangePoints.sizing.payload - p) / payloadRangePoints.sizing.payload;
  return {
    x: payloadRangePoints.sizing.x + t * (payloadRangePoints.ferry.x - payloadRangePoints.sizing.x),
    y: payloadRangePoints.sizing.y + t * (payloadRangePoints.ferry.y - payloadRangePoints.sizing.y),
    range: payloadRangePoints.sizing.range + t * (payloadRangePoints.ferry.range - payloadRangePoints.sizing.range),
    fuel: payloadRangePoints.sizing.fuel + t * (payloadRangePoints.ferry.fuel - payloadRangePoints.sizing.fuel),
    regime: 'fuel limited / payload traded away',
  };
}

function updatePayloadRangeUI(point, activeKey) {
  document.querySelectorAll('[data-pr-point]').forEach((el) => {
    el.classList.toggle('active', el.dataset.prPoint === activeKey);
  });

  const title = document.querySelector('#pr-title');
  const copy = document.querySelector('#pr-copy');
  if (title) title.textContent = point.title;
  if (copy) copy.textContent = point.copy;

  const guideX = document.querySelector('.pr-guide-x');
  const guideY = document.querySelector('.pr-guide-y');
  if (guideX) {
    guideX.setAttribute('x1', point.x);
    guideX.setAttribute('x2', point.x);
    guideX.setAttribute('y1', point.y);
  }
  if (guideY) {
    guideY.setAttribute('x2', point.x);
    guideY.setAttribute('y1', point.y);
    guideY.setAttribute('y2', point.y);
  }

  document.querySelector('.pr-live-point')?.setAttribute('transform', `translate(${point.x} ${point.y})`);
  const payloadBar = document.querySelector('.pr-payload-bar');
  const fuelBar = document.querySelector('.pr-fuel-bar');
  if (payloadBar) payloadBar.setAttribute('width', `${1.2 * point.payload}`);
  if (fuelBar) fuelBar.setAttribute('width', `${1.2 * point.fuel}`);

  const payload = document.querySelector('#pr-payload');
  const range = document.querySelector('#pr-range');
  const regime = document.querySelector('#pr-regime');
  const sliderValue = document.querySelector('#payload-slider-value');
  if (payload) payload.textContent = `${Math.round(point.payload)}% of max`;
  if (range) range.textContent = `${Math.round(point.range)}% of diagram max`;
  if (regime) regime.textContent = point.regime;
  if (sliderValue) sliderValue.textContent = `${Math.round(point.payload)}%`;
}

function setPayloadRangePoint(key) {
  const point = payloadRangePoints[key];
  if (!point) return;
  const slider = document.querySelector('#payload-slider');
  if (slider) slider.value = point.payload;
  updatePayloadRangeUI(point, key);
}

function setPayloadSlider(payload) {
  const curvePoint = pointFromPayload(payload);
  const point = {
    title: `Payload slider · ${Math.round(payload)}% of maximum payload`,
    copy: 'The slider moves along the feasible payload-range boundary. Moving left-to-right shows the trade from high-payload missions toward low-payload, fuel-limited range.',
    payload: Number(payload),
    ...curvePoint,
  };
  updatePayloadRangeUI(point, '');
}

if (document.querySelector('.interactive-pr')) {
  document.querySelectorAll('[data-pr-point]').forEach((el) => {
    el.addEventListener('click', () => setPayloadRangePoint(el.dataset.prPoint));
  });
  const slider = document.querySelector('#payload-slider');
  slider?.addEventListener('input', () => setPayloadSlider(Number(slider.value)));
  setPayloadRangePoint('sizing');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function renderInlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function renderMarkdown(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let index = 0;

  const isTable = (line) => line.includes('|') && line.trim().startsWith('|');
  const readTable = () => {
    const rows = [];
    while (index < lines.length && isTable(lines[index])) rows.push(lines[index++]);
    if (rows.length < 2) return `<p>${renderInlineMarkdown(rows.join(' '))}</p>`;
    const cells = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
    const head = cells(rows[0]);
    const body = rows.slice(2).map(cells);
    return `<div class="markdown-table-wrap"><table><thead><tr>${head.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join('')}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) { index += 1; continue; }

    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      index += 1;
      const code = [];
      while (index < lines.length && !lines[index].trim().startsWith('```')) code.push(lines[index++]);
      index += 1;
      html.push(`<pre class="markdown-code"><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (isTable(trimmed) && index + 1 < lines.length && lines[index + 1].includes('---')) {
      html.push(readTable());
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) items.push(lines[index++].trim().replace(/^[-*]\s+/, ''));
      html.push(`<ul>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) items.push(lines[index++].trim().replace(/^\d+\.\s+/, ''));
      html.push(`<ol>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ol>`);
      continue;
    }

    const paragraph = [trimmed];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,4})\s+/.test(lines[index].trim()) && !/^[-*]\s+/.test(lines[index].trim()) && !/^\d+\.\s+/.test(lines[index].trim()) && !lines[index].trim().startsWith('```') && !isTable(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`);
  }

  return html.join('\n');
}

function renderAttachedMarkdown(root = document) {
  root.querySelectorAll('.attached-file').forEach((pre) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'markdown-file';
    wrapper.innerHTML = renderMarkdown(pre.textContent);
    pre.replaceWith(wrapper);
  });

  root.querySelectorAll('[data-markdown-src]').forEach(async (container) => {
    if (container.dataset.loaded) return;
    container.dataset.loaded = 'true';
    container.classList.add('markdown-file');
    container.innerHTML = '<p class="muted">Loading attached file…</p>';
    try {
      const response = await fetch(container.dataset.markdownSrc);
      if (!response.ok) throw new Error('Fetch failed');
      const text = await response.text();
      const isMarkdown = /\.md($|\?)/.test(container.dataset.markdownSrc);
      container.innerHTML = isMarkdown ? renderMarkdown(text) : `<pre class="markdown-code"><code>${escapeHtml(text)}</code></pre>`;
    } catch {
      container.innerHTML = '<p class="muted">Could not load this attachment.</p>';
    }
  });
}

renderAttachedMarkdown();

document.querySelectorAll('[data-modal-open]').forEach((button) => {
  button.addEventListener('click', () => {
    const modal = document.getElementById(button.dataset.modalOpen);
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-is-open');
    modal.querySelector('.modal-panel')?.focus();
  });
});

function closeModal(modal) {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-is-open');
}

document.querySelectorAll('.modal').forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target.closest('[data-modal-close]')) closeModal(modal);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.modal.open').forEach(closeModal);
});

document.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) return;

  const url = new URL(link.href, window.location.href);
  const isSamePageHash = url.pathname === window.location.pathname && url.hash;
  const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  const opensElsewhere = link.target && link.target !== '_self';

  if (isModifiedClick || opensElsewhere || link.protocol === 'mailto:' || url.origin !== window.location.origin || isSamePageHash) return;

  event.preventDefault();
  document.body.classList.add('is-leaving');
  window.setTimeout(() => {
    window.location.href = url.href;
  }, 120);
});

window.addEventListener('pageshow', () => {
  document.body.classList.remove('is-leaving');
});
