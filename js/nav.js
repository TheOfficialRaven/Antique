// nav.js vagy index.js végén
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const body = document.body;
  
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        body.classList.toggle('nav-open');
      });
    }
  });

  document.querySelectorAll('.site-header nav a').forEach(link => {
    // compare full URLs (or you can compare just link.pathname to location.pathname)
    if (link.href === window.location.href) {
      link.classList.add('active');
    }
  });