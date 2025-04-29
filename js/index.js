import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Firebase konfiguráció
const firebaseConfig = {
  apiKey: "AIzaSyDuyEa0t2FUFGGcVspBLomreRxmkMaeYZE",
  authDomain: "antique-showcase-website.firebaseapp.com",
  databaseURL: "https://antique-showcase-website-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "antique-showcase-website",
  storageBucket: "antique-showcase-website.appspot.com",
  messagingSenderId: "287979700668",
  appId: "1:287979700668:web:7cda667f12b7e8a061abb9",
  measurementId: "G-1JDT9QWSBR"
};
initializeApp(firebaseConfig);
const db = getDatabase();

// DOM elemek
const showcase = document.getElementById("showcase");
const filterEl = document.getElementById('categoryFilter');
let allItems = [];

// Adatok betöltése és szűrő opciók generálása
onValue(ref(db, "antiques"), snap => {
  const data = snap.val() || {};
  allItems = Object.entries(data).map(([id, it]) => ({ id, ...it }));

  // Kategóriák a szűrőnek
  const categories = Array.from(
    new Set(allItems.map(item => item.category).filter(c => c))
  );
  filterEl.innerHTML = '<option value="all">Összes</option>' +
    categories.map(c => `<option value="${c}">${c}</option>`).join('');

  // Alapértelmezett renderelés
  renderItems(allItems);
});

// Szűrő esemény
filterEl.onchange = () => {
  const sel = filterEl.value;
  const filtered = sel === 'all'
    ? allItems
    : allItems.filter(item => item.category === sel);
  renderItems(filtered);
};

// Tételek kirenderelése a showcase szekcióba, thumbnail slider-rel
function renderItems(items) {
  showcase.innerHTML = '';
  items.forEach(({ title, desc, price, imageUrls = [] }) => {
    // fő kép és thumbnail-ek
    const mainImgSrc = imageUrls[0] || '';
    const thumbs = imageUrls.map(url => 
      `<img src="${url}" alt="${title}" class="thumb" data-gallery='${JSON.stringify(imageUrls)}'>`
    ).join('');

    const card = document.createElement('article');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="main-image">
        <img src="${mainImgSrc}" alt="${title}" data-gallery='${JSON.stringify(imageUrls)}'>
      </div>
      <div class="thumb-row">
        ${thumbs}
      </div>
      <div class="card-body">
        <h3>${title}</h3>
        <p>${desc}</p>
        <p class="price">${price} Ft</p>
      </div>`;
    showcase.appendChild(card);
  });
}

// Thumbnail hover: main image frissítése
document.addEventListener('mouseover', e => {
  const thumb = e.target;
  if (thumb.classList.contains('thumb')) {
    const card = thumb.closest('.item-card');
    const mainImg = card.querySelector('.main-image img');
    if (mainImg) mainImg.src = thumb.src;
  }
});

// --- Lightbox galéria ---
const imgModal    = document.getElementById("imageModal");
const modalInner  = document.querySelector(".img-modal-inner");
const modalImg    = document.getElementById("modalImage");
const modalCloser = document.querySelector(".img-modal-close");
let currentGallery = [];
let currentIndex   = 0;

// Modal bezárása
const toggleClose = () => imgModal.classList.remove("show");
modalCloser.onclick = toggleClose;

// Kép vagy thumbnail-re kattintás: galéria megnyitása
document.addEventListener("click", e => {
  const tgt = e.target;
  if (tgt.tagName === "IMG" && tgt.closest(".item-card")) {
    currentGallery = JSON.parse(tgt.dataset.gallery || '[]');
    currentIndex   = currentGallery.indexOf(tgt.src);
    if (currentIndex < 0) currentIndex = 0;
    modalImg.src   = currentGallery[currentIndex];
    imgModal.classList.add("show");
  }
});

// ModalInner kattintás: lapozás nyilakra és kép két oldalára
modalInner.addEventListener('click', e => {
  // ne zárja be a close gomb
  if (e.target === modalCloser) return;
  if (currentGallery.length < 2) return;

  // kattintási pozíció a modalInneren
  const rect = modalInner.getBoundingClientRect();
  const clickX = e.clientX - rect.left;

  if (clickX < rect.width / 2) {
    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
  } else {
    currentIndex = (currentIndex + 1) % currentGallery.length;
  }
  modalImg.src = currentGallery[currentIndex];
});

// Háttérre kattintás: bezárás
imgModal.addEventListener('click', e => {
  if (e.target === imgModal) toggleClose();
});