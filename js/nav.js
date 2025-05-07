// nav.js vagy index.js végén
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const body = document.body;

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      body.classList.toggle('nav-open');
    });
  }

  // Aktív menüpont kiemelése
  document.querySelectorAll('.site-header nav a').forEach(link => {
    if (link.href === window.location.href) {
      link.classList.add('active');
    }
  });

  // Ha mobilmenüben kattintunk valamelyik linkre, zárja be
  document.querySelectorAll('.nav-overlay a').forEach(link => {
    link.addEventListener('click', () => {
      body.classList.remove('nav-open');
    });
  });
});