/**
 * Main JS — Santa Sindone
 * Site-wide: nav scroll effect, mobile menu, scroll animations (IntersectionObserver).
 */
(function () {
  'use strict';

  /* ── Nav scroll effect ── */
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var scrollThreshold = 60;
    var ticking = false;

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          if (window.scrollY > scrollThreshold) {
            nav.classList.add('scrolled');
          } else {
            nav.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /* ── Mobile nav toggle ── */
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');

      var isOpen = navLinks.classList.contains('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close nav when clicking a link
    var links = navLinks.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    }
  }

  /* ── Scroll-triggered reveal animations ── */
  var revealElements = document.querySelectorAll('.reveal');

  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: show all elements if IntersectionObserver is not supported
    revealElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ── Hero image lazy-load trigger ── */
  var heroImg = document.querySelector('.hero-image img');
  if (heroImg) {
    if (heroImg.complete) {
      heroImg.classList.add('loaded');
    } else {
      heroImg.addEventListener('load', function () {
        heroImg.classList.add('loaded');
      });
    }
  }

  /* ── Parallax on page headers ── */
  var pageHeaderBg = document.querySelector('.page-header-bg');
  if (pageHeaderBg) {
    var parallaxTicking = false;
    window.addEventListener('scroll', function () {
      if (!parallaxTicking) {
        window.requestAnimationFrame(function () {
          var scrolled = window.scrollY;
          pageHeaderBg.style.transform = 'scale(1.1) translateY(' + (scrolled * 0.3) + 'px)';
          parallaxTicking = false;
        });
        parallaxTicking = true;
      }
    });
  }

  /* ── Active nav link highlight ── */
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  var navAnchors = document.querySelectorAll('.nav-links a');
  for (var j = 0; j < navAnchors.length; j++) {
    var href = navAnchors[j].getAttribute('href');
    if (href === currentPage || href === './' + currentPage) {
      navAnchors[j].classList.add('active');
    }
  }

})();
