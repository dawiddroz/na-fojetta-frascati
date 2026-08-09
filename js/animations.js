/* ============================================================
   'NA FOJETTA — animations.js (GSAP + ScrollTrigger + Lenis)
   Lenis: UNA istanza + retry-loop. GSAP: retry-loop.
   Sync lenis.on('scroll', ScrollTrigger.update) con flag
   __lenisSynced in entrambi i loop. Reveal con once:true,
   scrub sulle card, parallax sottile, head one-shot.
   MAI animazioni GSAP sopra la fold (hero = CSS @keyframes).
   ============================================================ */

(function () {
  'use strict';

  var attempts = 0;
  var MAX_ATTEMPTS = 40;

  function init() {
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    var LenisCtor = window.Lenis;

    if (!gsap || !ScrollTrigger || !LenisCtor) {
      attempts += 1;
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(init, 150);
      }
      return;
    }

    window.__gsapReady = true;

    gsap.registerPlugin(ScrollTrigger);

    /* Lenis — una sola istanza, sync con ScrollTrigger (flag in entrambi i loop) */
    if (!window.__lenis) {
      window.__lenis = new LenisCtor({
        duration: 1.1,
        smoothWheel: true
      });
    }
    var lenis = window.__lenis;

    if (!window.__lenisSynced) {
      lenis.on('scroll', ScrollTrigger.update);
      window.__lenisSynced = true;
    }

    function rafLoop(time) {
      lenis.raf(time);
      requestAnimationFrame(rafLoop);
    }
    requestAnimationFrame(rafLoop);

    /* Pre-hide anti-blink di tutti i target animati (dopo registerPlugin) */
    gsap.set('.reveal', { opacity: 0, y: 28 });

    /* Head di sezione — one-shot once:true */
    gsap.utils.toArray('.section-head').forEach(function (head) {
      gsap.fromTo(head, { opacity: 0, y: 24 }, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: head,
          start: 'top 88%',
          once: true
        }
      });
    });

    /* Card/stagger — reveal con scrub (start 88%, end 30%, scrub 0.6, once) */
    gsap.utils.toArray('.reveal').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 28 }, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          end: 'top 30%',
          scrub: 0.6,
          once: true
        }
      });
    });

    /* Rating badge — one-shot */
    gsap.utils.toArray('.rating-badge').forEach(function (badge) {
      gsap.fromTo(badge, { opacity: 0, y: 20 }, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: badge,
          start: 'top 88%',
          once: true
        }
      });
    });

    /* Parallax sottile (±6) sulle foto delle sezioni — mai sulle card */
    gsap.utils.toArray('.parallax').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: img.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    /* Refresh dopo il load (immagini + layout) */
    window.addEventListener('load', function () {
      ScrollTrigger.refresh();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
