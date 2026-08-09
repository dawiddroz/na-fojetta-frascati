/* ============================================================
   'NA FOJETTA — main.js (non-GSAP)
   Status aperto/chiuso, riga oggi, burger, counters, carousel,
   cookie banner + mappa differita, sticky CTA, anchor smooth,
   safety net 4s gated. Nessun indicizzamento [i], solo forEach.
   ============================================================ */

(function () {
  'use strict';

  var doc = document;

  /* ---------- Orari (dal brief — indicativi) ---------- */
  // Indice JS: 0=Domenica ... 6=Sabato. Tutti i giorni: pranzo 12:30-15:00, cena 19:30-23:00.
  var HOURS = [];
  for (var d = 0; d < 7; d += 1) {
    HOURS.push([[12.5, 15], [19.5, 23]]);
  }

  function fmtHour(h) {
    var hh = Math.floor(h);
    var mm = Math.round((h - hh) * 60);
    return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  }

  function getStatus(now) {
    var day = now.getDay();
    var mins = now.getHours() + now.getMinutes() / 60;
    var windows = HOURS[day];
    var i;
    for (i = 0; i < windows.length; i += 1) {
      if (mins >= windows[i][0] && mins < windows[i][1]) {
        return { open: true, closesAt: windows[i][1], day: day };
      }
    }
    for (i = 0; i < windows.length; i += 1) {
      if (mins < windows[i][0]) {
        return { open: false, opensAt: windows[i][0], when: 'today', day: day };
      }
    }
    var tomorrow = (day + 1) % 7;
    return { open: false, opensAt: HOURS[tomorrow][0][0], when: 'tomorrow', day: tomorrow };
  }

  var pillTopbar = doc.getElementById('statusPill');
  var pillHero = doc.getElementById('statusHero');

  function updateStatus() {
    var st = getStatus(new Date());
    var openClass = 'status-pill--open';
    var closedClass = 'status-pill--closed';
    var msgTop, msgHero;

    if (st.open) {
      msgTop = 'Aperto ora';
      msgHero = 'Aperto ora — chiudiamo alle ' + fmtHour(st.closesAt);
    } else if (st.when === 'today') {
      msgTop = 'Chiuso ora';
      msgHero = 'Chiuso — apre oggi alle ' + fmtHour(st.opensAt);
    } else {
      msgTop = 'Chiuso ora';
      msgHero = 'Chiuso — riapriamo domani alle ' + fmtHour(st.opensAt);
    }

    if (pillTopbar) {
      var topText = pillTopbar.querySelector('.status-pill__text');
      if (topText) topText.textContent = msgTop;
      pillTopbar.classList.remove(openClass, closedClass);
      pillTopbar.classList.add(st.open ? openClass : closedClass);
    }
    if (pillHero) {
      var heroText = pillHero.querySelector('.status-pill__text');
      if (heroText) heroText.textContent = msgHero;
      pillHero.classList.remove(openClass, closedClass);
      pillHero.classList.add(st.open ? openClass : closedClass);
    }

    /* riga oggi nella tabella orari (1=Lunedì ... 7=Domenica) */
    var todayNum = st.day === 0 ? 7 : st.day;
    doc.querySelectorAll('.hours-table tr[data-day]').forEach(function (tr) {
      tr.classList.toggle('is-today', Number(tr.getAttribute('data-day')) === todayNum);
    });
  }

  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- Burger / menu mobile ---------- */

  var burger = doc.getElementById('burger');
  var mobileMenu = doc.getElementById('mobileMenu');

  function closeMenu() {
    if (!burger || !mobileMenu) return;
    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
    doc.body.style.overflow = '';
    if (window.__lenis) window.__lenis.start();
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
      mobileMenu.classList.toggle('is-open', !open);
      doc.body.style.overflow = open ? '' : 'hidden';
      if (window.__lenis) {
        if (open) window.__lenis.start();
        else window.__lenis.stop();
      }
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
  }

  /* ---------- Anchor smooth (Lenis se disponibile) ---------- */

  doc.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var target = doc.getElementById(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (window.__lenis) {
        window.__lenis.scrollTo(target, { offset: -Math.round(parseFloat(getComputedStyle(doc.documentElement).getPropertyValue('--header-h')) || 84) - 8, duration: 1.2 });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- Counter animati (IntersectionObserver + rAF) ---------- */

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var divisor = Math.pow(10, decimals);
    var start = null;
    var DURATION = 1500;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / DURATION, 1);
      var value = (target * easeOutCubic(p)) / divisor;
      var text = value.toFixed(decimals).replace('.', ',') + suffix;
      el.textContent = text;
      if (p < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    doc.querySelectorAll('.counter[data-count]').forEach(function (el) {
      counterObserver.observe(el);
    });
  } else {
    doc.querySelectorAll('.counter[data-count]').forEach(function (el) {
      el.textContent = (parseFloat(el.getAttribute('data-count')) / Math.pow(10, parseInt(el.getAttribute('data-decimals'), 10) || 0)).toFixed(parseInt(el.getAttribute('data-decimals'), 10) || 0).replace('.', ',') + (el.getAttribute('data-suffix') || '');
    });
  }

  /* ---------- Carousel recensioni (autoplay, hover, swipe, dots) ---------- */

  var carousel = doc.querySelector('.carousel');
  if (carousel) {
    var track = carousel.querySelector('.carousel__track');
    var slides = track ? Array.prototype.slice.call(track.children) : [];
    var dotsWrap = carousel.querySelector('.carousel__dots');
    var prevBtn = carousel.querySelector('.carousel__arrow--prev');
    var nextBtn = carousel.querySelector('.carousel__arrow--next');
    var index = 0;
    var timer = null;
    var AUTOPLAY = 5000;

    function goTo(i) {
      if (!slides.length) return;
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + index * 100 + '%)';
      dotsWrap.querySelectorAll('.carousel__dot').forEach(function (dot, di) {
        dot.setAttribute('aria-selected', di === index ? 'true' : 'false');
      });
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function startTimer() {
      stopTimer();
      timer = setInterval(next, AUTOPLAY);
    }

    function stopTimer() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    if (slides.length) {
      slides.forEach(function (slide, si) {
        slide.setAttribute('aria-hidden', si === 0 ? 'false' : 'true');
      });
      /* dots generati in JS (role=tab) */
      slides.forEach(function (slide, si) {
        var dot = doc.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel__dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', si === 0 ? 'true' : 'false');
        dot.setAttribute('aria-label', 'Vai alla recensione ' + (si + 1));
        dot.addEventListener('click', function () {
          goTo(si);
          slides.forEach(function (s, si2) {
            s.setAttribute('aria-hidden', si2 === si ? 'false' : 'true');
          });
          startTimer();
        });
        dotsWrap.appendChild(dot);
      });
      if (prevBtn) prevBtn.addEventListener('click', function () { prev(); startTimer(); });
      if (nextBtn) nextBtn.addEventListener('click', function () { next(); startTimer(); });
      carousel.addEventListener('mouseenter', stopTimer);
      carousel.addEventListener('mouseleave', startTimer);

      /* swipe touch >= 40px */
      var startX = null;
      carousel.addEventListener('touchstart', function (e) {
        startX = e.changedTouches[0].clientX;
        stopTimer();
      }, { passive: true });
      carousel.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var delta = e.changedTouches[0].clientX - startX;
        if (Math.abs(delta) >= 40) {
          if (delta < 0) next(); else prev();
        }
        startX = null;
        startTimer();
      }, { passive: true });

      startTimer();
    }
  }

  /* ---------- Sticky CTA mobile ---------- */

  var stickyCta = doc.getElementById('stickyCta');
  var footerEl = doc.getElementById('siteFooter');
  var lastY = 0;

  function onScroll() {
    if (!stickyCta) return;
    var y = window.scrollY || doc.documentElement.scrollTop;
    if (y > 300) stickyCta.classList.add('visible');
    else stickyCta.classList.remove('visible');
    lastY = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (stickyCta && footerEl && 'IntersectionObserver' in window) {
    var footerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        stickyCta.classList.toggle('hidden', entry.isIntersecting);
      });
    }, { threshold: 0.05 });
    footerObserver.observe(footerEl);
  }

  /* ---------- Lightbox galleria ---------- */

  var lightbox = doc.getElementById('lightbox');
  if (lightbox) {
    var lightboxImg = lightbox.querySelector('.lightbox__img');
    var lightboxCount = doc.getElementById('lightboxCount');
    var galleryItems = Array.prototype.slice.call(doc.querySelectorAll('.gallery-item'));
    var lbIndex = 0;

    function showLightbox(i) {
      if (!galleryItems.length) return;
      lbIndex = (i + galleryItems.length) % galleryItems.length;
      var full = galleryItems[lbIndex].getAttribute('data-full');
      lightboxImg.setAttribute('src', full);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      doc.body.style.overflow = 'hidden';
      if (window.__lenis) window.__lenis.stop();
      if (lightboxCount) lightboxCount.textContent = (lbIndex + 1) + ' / ' + galleryItems.length;
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      doc.body.style.overflow = '';
      if (window.__lenis) window.__lenis.start();
    }

    galleryItems.forEach(function (item, gi) {
      item.addEventListener('click', function () { showLightbox(gi); });
    });

    lightbox.querySelector('.lightbox__btn--close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox__btn--prev').addEventListener('click', function () { showLightbox(lbIndex - 1); });
    lightbox.querySelector('.lightbox__btn--next').addEventListener('click', function () { showLightbox(lbIndex + 1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    doc.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showLightbox(lbIndex - 1);
      if (e.key === 'ArrowRight') showLightbox(lbIndex + 1);
    });
  }

  /* ---------- Safety net 4s gated (solo se GSAP non è pronto) ---------- */

  setTimeout(function () {
    if (window.__gsapReady) return;
    var selectors = '.reveal, .hero__title .word span, .hero__badge, .hero__sub, .hero__status-row, .hero__cta-row, .hero__rating, .hero__scroll';
    doc.querySelectorAll(selectors).forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.animation = 'none';
    });
  }, 4000);
})();
