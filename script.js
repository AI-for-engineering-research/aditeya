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
