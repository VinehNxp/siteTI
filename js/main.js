/**
 * main.js - TechFix Suporte Tecnico
 *
 * Modulos:
 *   1. Nav: efeito de scroll e menu mobile
 *   2. Scroll animations: fade-up via IntersectionObserver
 *   3. Counter animation
 *   4. Status de atendimento
 *   5. FAQ accordion
 *   6. Smooth scroll
 */

'use strict';


/* --- 1. NAV --- */

const nav = document.getElementById('nav');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const mobileNavMedia = window.matchMedia('(max-width: 860px), (hover: none) and (pointer: coarse)');

function setMobileNavState(isOpen) {
  if (!navToggle || !navLinks) return;

  document.body.classList.toggle('nav-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
}

if (nav) {
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

if (navToggle && navLinks) {
  const toggleMobileMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const isOpen = navToggle.getAttribute('aria-expanded') !== 'true';
    setMobileNavState(isOpen);
  };

  navToggle.addEventListener('click', toggleMobileMenu);
  navToggle.addEventListener('pointerup', toggleMobileMenu);
  navToggle.addEventListener('touchend', toggleMobileMenu, { passive: false });

  navLinks.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (mobileNavMedia.matches) {
        setMobileNavState(false);
      }
    });
  });

  window.addEventListener('resize', () => {
    if (!mobileNavMedia.matches) {
      setMobileNavState(false);
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (!mobileNavMedia.matches) return;

    const clickedInsideNav = nav.contains(event.target);
    if (!clickedInsideNav) {
      setMobileNavState(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMobileNavState(false);
    }
  });

  setMobileNavState(false);
}


/* --- 2. SCROLL ANIMATIONS --- */

const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        target.classList.add('visible');
        fadeObserver.unobserve(target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.fade-up').forEach((el) => fadeObserver.observe(el));


/* --- 3. COUNTER ANIMATION --- */

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix ?? '';
  const duration = 1800;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.floor(easeOutCubic(progress) * target);
    const formatted = target >= 1000 ? value.toLocaleString('pt-BR') : String(value);

    el.textContent = formatted + suffix;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        animateCounter(target);
        counterObserver.unobserve(target);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll('.sband-num[data-target]').forEach((el) => {
  counterObserver.observe(el);
});


/* --- 4. STATUS DE ATENDIMENTO --- */

const serviceStatus = document.getElementById('service-status');

function getOpeningMessage(day, hour) {
  if (day >= 1 && day <= 4 && hour >= 18) return 'volta amanha as 14h';
  if (day === 5 && hour >= 18) return 'volta sabado as 14h';
  if (day === 6 && hour >= 17) return 'volta domingo as 14h';
  if (day === 0 && hour >= 17) return 'volta segunda as 14h';
  if (day === 6 || day === 0) return 'volta as 14h';
  return 'volta as 14h';
}

function updateServiceStatus() {
  if (!serviceStatus) return;

  const label = serviceStatus.querySelector('.service-status__label');
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const isWeekend = day === 0 || day === 6;
  const openHour = 14;
  const closeHour = isWeekend ? 17 : 18;
  const isOpen = hour >= openHour && hour < closeHour;

  serviceStatus.classList.toggle('is-open', isOpen);
  serviceStatus.classList.toggle('is-closed', !isOpen);

  if (label) {
    label.textContent = isOpen
      ? `Aberto agora - atendimento ate ${closeHour}h`
      : `Fechado - ${getOpeningMessage(day, hour)}`;
  }
}

updateServiceStatus();


/* --- 5. FAQ ACCORDION --- */

const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const answer = item?.querySelector('.faq-answer');
    const isExpanded = button.getAttribute('aria-expanded') === 'true';

    faqQuestions.forEach((otherButton) => {
      otherButton.setAttribute('aria-expanded', 'false');
      otherButton.closest('.faq-item')?.classList.remove('is-open');

      const otherAnswer = otherButton.closest('.faq-item')?.querySelector('.faq-answer');
      if (otherAnswer) {
        otherAnswer.hidden = true;
      }
    });

    button.setAttribute('aria-expanded', String(!isExpanded));
    item?.classList.toggle('is-open', !isExpanded);

    if (answer) {
      answer.hidden = isExpanded;
    }
  });
});


/* --- 6. SMOOTH SCROLL --- */

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const target = document.querySelector(anchor.getAttribute('href'));

    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
