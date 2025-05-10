import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import {
  getDatabase,
  ref as dbRef,
  query,
  orderByKey,
  limitToLast,
  onValue
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js';

// Firebase konfiguráció (maradjon, ahogy a regisegek.js-ben is van)
const firebaseConfig = {
  apiKey: "AIzaSyDuyEa0t2FUFGGcVspBLomreRxmkMaeYZE",
  authDomain: "antique-showcase-website.firebaseapp.com",
  databaseURL: "https://antique-showcase-website-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "antique-showcase-website",
  storageBucket: "antique-showcase-website.appspot.com",
  messagingSenderId: "287979700668",
  appId: "1:287979700668:web:7cda667f12b7e8a061abb9"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
  const row = document.querySelector('.thumb-row-recent');
  if (!row) {
    console.error('thumb-row-recent elem nem található!');
    return;
  }

  // Lekérjük a legutolsó 6 bejegyzést push-key szerint:
  const antiquesQuery = query(
    dbRef(db, 'antiques'),
    orderByKey(),
    limitToLast(6)
  );

  function animateThumbsWhenReady() {
    const thumbs = document.querySelectorAll('.thumb-recent');
    if (!thumbs.length) return;
  
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // csak egyszer animáljuk
        }
      });
    }, { threshold: 0.2 });
  
    thumbs.forEach(thumb => observer.observe(thumb));
  }

 onValue(antiquesQuery, snap => {
  row.innerHTML = ''; // törlés

  const data = snap.val() || {};
Object.entries(data)
  .reverse()
  .forEach(([id, item]) => {
    const url = Array.isArray(item.imageUrls) && item.imageUrls[0];
    if (!url) return;

    const a = document.createElement('a');
    a.href = `regisegek.html?id=${encodeURIComponent(id)}&openModal=true`;
    a.className = 'thumb-recent';

    const img = document.createElement('img');
    img.src = url;
    img.alt = item.title || '';
    a.appendChild(img);

    // ➕ Kattintásra page transition után navigálás
    a.addEventListener("click", e => {
      e.preventDefault();
      document.body.style.opacity = "0";
      setTimeout(() => {
        window.location.href = a.href;
      }, 400);
    });

    row.appendChild(a);
  });
});
});

//////////////////////// GYIK

document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    item.classList.toggle('open');
  });
});

////////////////////////// Vélemények Corousel

(function() {
  const track = document.querySelector('.carousel-track');
  const dots = Array.from(document.querySelectorAll('.dot'));
  let current = 0;
  const slideCount = dots.length;

  function goToSlide(n) {
    track.style.transform = `translateX(-${n * 33.3333}%)`;
    dots.forEach(dot => dot.classList.remove('active'));
    dots[n].classList.add('active');
    current = n;
  }

  dots.forEach(dot => dot.addEventListener('click', () => {
    goToSlide(parseInt(dot.dataset.slide, 10));
    resetInterval();
  }));

  let interval = setInterval(() => {
    const next = (current + 1) % slideCount;
    goToSlide(next);
  }, 5000);

  function resetInterval() {
    clearInterval(interval);
    interval = setInterval(() => {
      const next = (current + 1) % slideCount;
      goToSlide(next);
    }, 5000);
  }
})();

function observeRecentThumbnails() {
  const recentSection = document.querySelector('.thumb-row-recent');
  if (!recentSection) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const thumbnails = recentSection.querySelectorAll('.thumb-recent');
        thumbnails.forEach(el => el.classList.add('visible'));
        observer.disconnect(); // csak egyszer animáljuk
      }
    });
  }, { threshold: 0.2 });

  observer.observe(recentSection);
}

document.addEventListener('DOMContentLoaded', () => {
  observeRecentThumbnails();
});

function observeCategoryCards() {
  const cards = document.querySelectorAll('.category-card');
  if (!cards.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // csak egyszer animáljuk
      }
    });
  }, { threshold: 0.2 });

  cards.forEach(card => observer.observe(card));
}

document.addEventListener('DOMContentLoaded', () => {
  observeCategoryCards();
});