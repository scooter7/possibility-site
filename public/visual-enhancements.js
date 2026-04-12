/* ============================================================
   VISUAL ENHANCEMENTS — Sitewide polish layer
   Lenis smooth scroll · GSAP ScrollTrigger reveals ·
   Cursor glow · Ambient particles · Magnetic buttons
   ============================================================ */

(function () {
  'use strict';

  // Bail on reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ===== 1. LENIS SMOOTH SCROLL ===== */
  var lenis;
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false
    });

    // Connect Lenis to GSAP ScrollTrigger if available
    if (typeof gsap !== 'undefined' && gsap.ticker) {
      lenis.on('scroll', function () {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
      });
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
  }

  /* ===== 2. GSAP SCROLL REVEALS ===== */
  function initScrollReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Upgrade existing .reveal elements with GSAP (smoother, spring-like)
    var reveals = document.querySelectorAll('.reveal:not(.visible)');
    reveals.forEach(function (el) {
      // Get existing delay from class
      var delay = 0;
      for (var i = 1; i <= 5; i++) {
        if (el.classList.contains('reveal-delay-' + i)) {
          delay = i * 0.1;
          break;
        }
      }

      gsap.fromTo(el, {
        opacity: 0,
        y: 28
      }, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        },
        onComplete: function () { el.classList.add('visible'); }
      });
    });

    // Upgrade .reveal-scale elements
    document.querySelectorAll('.reveal-scale:not(.visible)').forEach(function (el) {
      gsap.fromTo(el, {
        opacity: 0,
        scale: 0.92,
        y: 16
      }, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        },
        onComplete: function () { el.classList.add('visible'); }
      });
    });

    // Stagger children upgrade
    document.querySelectorAll('.stagger-children:not(.visible)').forEach(function (parent) {
      var children = parent.children;
      if (!children.length) return;
      gsap.fromTo(children, {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: parent,
          start: 'top 88%',
          once: true
        },
        onComplete: function () { parent.classList.add('visible'); }
      });
    });

    // Glass card parallax-on-scroll (subtle vertical shift)
    document.querySelectorAll('.gc, .ps-card, .portal-card').forEach(function (card) {
      gsap.fromTo(card, {
        y: 20
      }, {
        y: -10,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8
        }
      });
    });

    // Hero parallax (background image moves slower)
    document.querySelectorAll('.hero-bg-img, .hero-image-wrap img').forEach(function (img) {
      gsap.to(img, {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: img.closest('.hero') || img.parentElement,
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      });
    });
  }

  /* ===== 3. CURSOR GLOW ===== */
  function initCursorGlow() {
    // Only on pointer devices
    if (!window.matchMedia('(hover: hover)').matches) return;
    if (window.innerWidth < 769) return;

    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    var mx = -500, my = -500;
    var cx = -500, cy = -500;
    var active = false;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      if (!active) {
        active = true;
        glow.classList.add('active');
      }
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      active = false;
      glow.classList.remove('active');
    });

    // Detect hovering on interactive elements
    var interactiveSelectors = 'a, button, .gc, .portal-card, .ps-card, .cross-nav-card, [role="button"]';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(interactiveSelectors)) {
        glow.classList.add('hovering');
      }
    }, { passive: true });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(interactiveSelectors)) {
        glow.classList.remove('hovering');
      }
    }, { passive: true });

    // Smooth follow with lerp
    function animate() {
      cx += (mx - cx) * 0.08;
      cy += (my - cy) * 0.08;
      glow.style.left = cx + 'px';
      glow.style.top = cy + 'px';
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  /* ===== 4. AMBIENT PARTICLES ===== */
  function initParticles() {
    var canvas = document.createElement('canvas');
    canvas.className = 'ambient-particles';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var particles = [];
    var particleCount = Math.min(30, Math.floor(window.innerWidth / 60));
    var dpr = window.devicePixelRatio || 1;

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Brand colors for particles (teal, align, become, white)
    var colors = [
      { r: 51, g: 163, b: 163 },  // teal
      { r: 99, g: 102, b: 241 },  // align
      { r: 52, g: 211, b: 153 },  // become
      { r: 255, g: 252, b: 250 }  // warm white
    ];

    for (var i = 0; i < particleCount; i++) {
      var color = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 1.5 + 0.5,
        color: color,
        alpha: Math.random() * 0.15 + 0.03,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.1,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.008 + 0.003
      });
    }

    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        // Wrap around
        if (p.x < -10) p.x = window.innerWidth + 10;
        if (p.x > window.innerWidth + 10) p.x = -10;
        if (p.y < -10) p.y = window.innerHeight + 10;
        if (p.y > window.innerHeight + 10) p.y = -10;

        var alpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.color.r + ',' + p.color.g + ',' + p.color.b + ',' + alpha + ')';
        ctx.fill();

        // Subtle glow
        if (p.radius > 1) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + p.color.r + ',' + p.color.g + ',' + p.color.b + ',' + (alpha * 0.15) + ')';
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    }
    draw();

    // Fade in
    requestAnimationFrame(function () { canvas.classList.add('loaded'); });
  }

  /* ===== 5. MAGNETIC BUTTONS ===== */
  function initMagnetic() {
    if (!window.matchMedia('(hover: hover)').matches) return;

    var targets = document.querySelectorAll('.card-cta, .cross-nav-arrow, .back-to-top, [data-magnetic]');
    targets.forEach(function (el) {
      el.classList.add('magnetic-target');

      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = 'translate(' + (x * 0.2) + 'px, ' + (y * 0.2) + 'px)';
      }, { passive: true });

      el.addEventListener('mouseleave', function () {
        el.style.transform = 'translate(0, 0)';
      }, { passive: true });
    });
  }

  /* ===== 6. SMOOTH NUMBER COUNT-UP UPGRADE ===== */
  function initCountUp() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    document.querySelectorAll('.stat-number, .hero-stat .val').forEach(function (el) {
      if (el.dataset.enhanced) return;
      el.dataset.enhanced = '1';

      var text = el.textContent.trim();
      var match = text.match(/^([^\d]*)(\d+)(.*)/);
      if (!match) return;

      var prefix = match[1];
      var target = parseInt(match[2]);
      var suffix = match[3];
      var obj = { val: 0 };

      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: function () {
          gsap.to(obj, {
            val: target,
            duration: 2,
            ease: 'power2.out',
            onUpdate: function () {
              el.textContent = prefix + Math.round(obj.val) + suffix;
            }
          });
        }
      });
    });
  }

  /* ===== 7. HEADING TEXT REVEAL ENHANCEMENT ===== */
  function initTextReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // Animate hero h1 with word-by-word reveal
    document.querySelectorAll('.hero h1, .hero-title').forEach(function (el) {
      if (el.dataset.textRevealed) return;
      el.dataset.textRevealed = '1';

      // Don't interfere with existing animations that haven't completed
      if (getComputedStyle(el).opacity === '0') return;

      var words = el.innerHTML.split(/(\s+)/);
      var html = '';
      var wordIndex = 0;
      words.forEach(function (word) {
        if (/^\s+$/.test(word)) {
          html += word;
        } else {
          html += '<span class="word-reveal" style="display:inline-block;opacity:0;transform:translateY(12px);filter:blur(4px)">' + word + '</span>';
          wordIndex++;
        }
      });
      el.innerHTML = html;

      var wordEls = el.querySelectorAll('.word-reveal');
      gsap.to(wordEls, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.7,
        stagger: 0.04,
        ease: 'power3.out',
        delay: 0.3,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true
        }
      });
    });
  }

  /* ===== 8. ENHANCED HOVER DEPTH FOR CARDS ===== */
  function initCardDepth() {
    if (!window.matchMedia('(hover: hover)').matches) return;

    document.querySelectorAll('.gc, .ps-card, .portal-card .card-inner').forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        if (typeof gsap !== 'undefined') {
          gsap.to(card, {
            y: -6,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 0 40px rgba(51,163,163,0.06)',
            duration: 0.4,
            ease: 'power2.out'
          });
        }
      }, { passive: true });

      card.addEventListener('mouseleave', function () {
        if (typeof gsap !== 'undefined') {
          gsap.to(card, {
            y: 0,
            boxShadow: card.dataset.originalShadow || '',
            duration: 0.5,
            ease: 'power2.out'
          });
        }
      }, { passive: true });

      // Store original shadow
      card.dataset.originalShadow = getComputedStyle(card).boxShadow;
    });
  }

  /* ===== INIT ===== */
  function init() {
    initLenis();
    initCursorGlow();
    initParticles();
    initMagnetic();

    // GSAP-dependent features: wait for GSAP to be ready
    if (typeof gsap !== 'undefined') {
      initScrollReveals();
      initCountUp();
      initTextReveals();
      initCardDepth();
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to let other page scripts set up first
    setTimeout(init, 100);
  }
})();
