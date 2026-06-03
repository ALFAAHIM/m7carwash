/* =============================================
   M7 CAR WASH — script.js
   Scroll-driven frame animation
   ============================================= */

(function () {
  'use strict';

  /* ============================================
     CONFIG
     ============================================ */
  const TOTAL_FRAMES     = 120;
  const SCROLL_MULTIPLIER = 2; // screens of scroll to complete full animation
  const FRAME_PATH       = (n) => `frames/ezgif-frame-${String(n).padStart(3,'0')}.png`;

  /* ============================================
     ELEMENTS
     ============================================ */
  const canvas        = document.getElementById('hero-canvas');
  const ctx           = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const scrollPin     = document.getElementById('hero-scroll-pin');
  const progressFill  = document.getElementById('hero-progress-fill');
  const taillightGlow = document.getElementById('taillight-glow');
  const heroBrand     = document.getElementById('hero-brand');
  const scrollHint    = document.getElementById('scroll-hint');
  const navbar        = document.getElementById('navbar');
  const navToggle     = document.getElementById('nav-toggle');
  const navLinks      = document.getElementById('nav-links');

  /* ============================================
     CANVAS SETUP
     ============================================ */
  let canvasW = 0, canvasH = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeCanvas() {
    if (!canvas) return;
    canvasW = window.innerWidth;
    canvasH = window.innerHeight;
    canvas.width  = Math.round(canvasW * dpr);
    canvas.height = Math.round(canvasH * dpr);
    canvas.style.width  = canvasW + 'px';
    canvas.style.height = canvasH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (images[currentFrame] && images[currentFrame].complete) drawFrame(currentFrame);
  }

  /* ============================================
     IMAGE PRELOADING — all in parallel
     ============================================ */
  const images    = new Array(TOTAL_FRAMES + 1);
  const bitmaps   = new Array(TOTAL_FRAMES + 1);
  let loadedCount = 0;
  const hasBitmap = typeof createImageBitmap !== 'undefined';
  let firstFrameReady = false;

  function preloadFrames() {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      (function(n) {
        const img = new Image();
        img.onload = () => {
          images[n] = img;
          loadedCount++;
          // GPU bitmap for faster draw
          if (hasBitmap) {
            createImageBitmap(img).then(bm => { bitmaps[n] = bm; }).catch(() => {});
          }
          // Show first frame + brand as soon as frame 1 is ready
          if (n === 1 && !firstFrameReady) {
            firstFrameReady = true;
            drawFrame(1);
            setTimeout(() => { if (heroBrand) heroBrand.classList.add('visible'); }, 300);
          }
        };
        img.onerror = () => { loadedCount++; };
        img.src = FRAME_PATH(n);
      })(i);
    }
  }

  /* ============================================
     DRAW
     ============================================ */
  let lastCropW = 0, lastCropH = 0;
  let cropSX = 0, cropSY = 0, cropSW = 0, cropSH = 0;

  function computeCrop(srcW, srcH) {
    if (srcW === lastCropW && srcH === lastCropH) return;
    lastCropW = srcW; lastCropH = srcH;
    const imgAR = srcW / srcH;
    const canAR = canvasW / canvasH;
    if (imgAR > canAR) {
      cropSH = srcH;
      cropSW = Math.round(srcH * canAR);
      const bias = window.innerWidth < 768 ? 0.72 : 0.5;
      cropSX = Math.round((srcW - cropSW) * bias);
      cropSY = 0;
    } else {
      cropSW = srcW;
      cropSH = Math.round(srcW / canAR);
      cropSX = 0;
      cropSY = Math.round((srcH - cropSH) * 0.4);
    }
  }

  function drawFrame(n) {
    const src = bitmaps[n] || images[n];
    if (!src) return;
    const w = src.width || src.naturalWidth;
    const h = src.height || src.naturalHeight;
    computeCrop(w, h);
    ctx.drawImage(src, cropSX, cropSY, cropSW, cropSH, 0, 0, canvasW, canvasH);
  }

  /* ============================================
     SCROLL SETUP
     ============================================ */
  function setupScrollPin() {
    if (!scrollPin) return;
    scrollPin.style.height = (window.innerHeight * (SCROLL_MULTIPLIER + 1)) + 'px';
  }

  function getFrameFromScroll() {
    if (!scrollPin) return 1;
    const pinScrollable = scrollPin.offsetHeight - window.innerHeight;
    const scrolled      = Math.max(0, -scrollPin.getBoundingClientRect().top);
    const progress      = Math.min(1, scrolled / pinScrollable);
    return Math.max(1, Math.min(TOTAL_FRAMES, Math.round(progress * (TOTAL_FRAMES - 1)) + 1));
  }

  /* ============================================
     SCROLL-DRIVEN ANIMATION LOOP
     ============================================ */
  let currentFrame = 1;
  let targetFrame  = 1;
  let rafId        = null;
  let isLooping    = false;

  function onScroll() {
    targetFrame = getFrameFromScroll();

    // Progress bar
    if (progressFill) {
      progressFill.style.width = (((targetFrame - 1) / (TOTAL_FRAMES - 1)) * 100) + '%';
    }

    // Tail light glow fades after frame 25
    if (taillightGlow) {
      taillightGlow.style.opacity = Math.max(0, 1 - (targetFrame - 1) / 25);
    }

    // Scroll hint fades quickly
    if (scrollHint) {
      scrollHint.style.opacity = Math.max(0, 1 - targetFrame / 6);
    }

    if (!isLooping) {
      isLooping = true;
      rafId = requestAnimationFrame(animLoop);
    }
  }

  function animLoop() {
    if (currentFrame === targetFrame) {
      isLooping = false;
      return;
    }

    // Step toward target — max 2 frames per tick for smooth catch-up
    const diff = targetFrame - currentFrame;
    const step = Math.sign(diff) * Math.min(Math.abs(diff), 2);
    currentFrame = currentFrame + step;
    currentFrame = Math.max(1, Math.min(TOTAL_FRAMES, currentFrame));

    // Find nearest available frame
    if (!images[currentFrame] && !bitmaps[currentFrame]) {
      for (let d = 1; d < 8; d++) {
        const f = bitmaps[currentFrame - d] || images[currentFrame - d] ||
                  bitmaps[currentFrame + d] || images[currentFrame + d];
        if (f) { drawFrame(currentFrame - d || currentFrame + d); break; }
      }
    } else {
      drawFrame(currentFrame);
    }

    rafId = requestAnimationFrame(animLoop);
  }

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
     RESIZE
     ============================================ */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      lastCropW = 0;
      setupScrollPin();
      resizeCanvas();
    }, 150);
  });

  /* ============================================
     INIT
     ============================================ */
  function init() {
    if (!canvas || !ctx) return;
    setupScrollPin();
    resizeCanvas();
    preloadFrames();
    setupReveal();
    buildReviewDots();
    updateNavbar();
    window.addEventListener('scroll', onScroll,    { passive: true });
    window.addEventListener('scroll', updateNavbar, { passive: true });
  }

  document.addEventListener('touchstart', () => {}, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('%cM7 Car Wash 🚗💛', 'color:#f5c518;font-size:18px;font-weight:900;');
  console.log('%cScroll-driven · 120 frames · 2× sensitivity', 'color:#888;');

})();
