/* =============================================
   M7 CAR WASH — script.js
   Static hero version
   ============================================= */

(function () {
  'use strict';

  /* ============================================
     ELEMENTS
     ============================================ */
  const navbar        = document.getElementById('navbar');
  const navToggle     = document.getElementById('nav-toggle');
  const navLinks      = document.getElementById('nav-links');
  const heroBrand     = document.getElementById('hero-brand');

  /* ============================================
     NAVBAR
     ============================================ */
  const sections = document.querySelectorAll('section[id]');

  function updateNavbar() {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    const scrollY = window.scrollY + 140;
    sections.forEach(sec => {
      const lnk = document.querySelector(`.nav-link[href="#${sec.getAttribute('id')}"]`);
      if (lnk) lnk.classList.toggle('active', scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight);
    });
  }

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });
  }
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navToggle && navToggle.classList.remove('active');
      navLinks  && navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ============================================
     SMOOTH ANCHOR SCROLL
     ============================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#' || id === '#home') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - (navbar ? navbar.offsetHeight : 70);
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ============================================
     SCROLL REVEAL
     ============================================ */
  function setupReveal() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          setTimeout(() => el.classList.add('revealed'), parseInt(el.dataset.delay || 0));
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
  }

  /* ============================================
     ANIMATED COUNTERS
     ============================================ */
  let statsRan = false;
  const statsBar = document.getElementById('stats-bar');
  if (statsBar) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !statsRan) {
        statsRan = true;
        document.querySelectorAll('.stat-number[data-target]').forEach(el => {
          const target = parseFloat(el.dataset.target);
          const dec    = parseInt(el.dataset.decimals || 0);
          const dur    = 1800;
          const t0     = performance.now();
          const tick   = (now) => {
            const p = Math.min((now - t0) / dur, 1);
            const v = target * (1 - Math.pow(1 - p, 3));
            el.textContent = dec ? v.toFixed(dec) : Math.floor(v);
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = dec ? target.toFixed(dec) : target;
          };
          requestAnimationFrame(tick);
        });
      }
    }, { threshold: 0.5 }).observe(statsBar);
  }

  /* ============================================
     REVIEW CARDS
     ============================================ */
  document.querySelectorAll('.review-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.background = `radial-gradient(circle at ${((e.clientX-r.left)/r.width)*100}% ${((e.clientY-r.top)/r.height)*100}%, #1e1e26 0%, #16161b 60%)`;
    });
    card.addEventListener('mouseleave', () => { card.style.background = ''; });
  });

  function buildReviewDots() {
    if (window.innerWidth > 768) return;
    const wrap  = document.querySelector('.reviews-track-wrap');
    const track = document.querySelector('.reviews-track');
    if (!wrap || !track) return;
    const cards = track.querySelectorAll('.review-card');
    if (cards.length < 2) return;
    const dots = document.createElement('div');
    dots.style.cssText = 'display:flex;justify-content:center;gap:7px;margin-top:20px;';
    cards.forEach((_, i) => {
      const d = document.createElement('span');
      d.style.cssText = `width:${i===0?'22px':'7px'};height:7px;border-radius:4px;background:${i===0?'var(--clr-yellow)':'rgba(255,255,255,0.2)'};transition:width .3s,background .3s;cursor:pointer;display:block;`;
      d.addEventListener('click', () => wrap.scrollTo({ left: cards[i].offsetLeft - 20, behavior: 'smooth' }));
      dots.appendChild(d);
    });
    wrap.parentNode.insertBefore(dots, wrap.nextSibling);
    wrap.addEventListener('scroll', () => {
      const active = Math.round(wrap.scrollLeft / (cards[0].offsetWidth + 16));
      dots.querySelectorAll('span').forEach((d, i) => {
        d.style.width      = i === active ? '22px' : '7px';
        d.style.background = i === active ? 'var(--clr-yellow)' : 'rgba(255,255,255,0.2)';
      });
    }, { passive: true });
  }

  /* ============================================
     INIT
     ============================================ */
  function init() {
    setupReveal();
    buildReviewDots();
    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });

    // Show hero brand immediately
    if (heroBrand) heroBrand.classList.add('visible');
  }

  document.addEventListener('touchstart', () => {}, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('%cM7 Car Wash 🚗💛', 'color:#f5c518;font-size:18px;font-weight:900;');
  console.log('%cStatic version', 'color:#888;');

})();
