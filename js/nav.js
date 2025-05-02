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