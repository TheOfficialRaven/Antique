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
const dropdown = document.getElementById('categoryDropdown');
const selected = dropdown.querySelector('.selected');
const optionsContainer = dropdown.querySelector('.options');
let allItems = [];

// Adatok betöltése és szűrő opciók generálása
onValue(ref(db, "antiques"), snap => {
  const data = snap.val() || {};
  allItems = Object.entries(data).map(([id, it]) => ({ id, ...it }));

  // native select opciók
  const categories = Array.from(new Set(allItems.map(i => i.category).filter(c => c)));
  filterEl.innerHTML = '<option value="all">Összes</option>' +
    categories.map(c => `<option value="${c}">${c}</option>`).join('');

  // custom dropdown opciók
  optionsContainer.innerHTML = '<li data-value="all">Összes</li>' +
    categories.map(c => `<li data-value="${c}">${c}</li>`).join('');

  renderItems(allItems);
});

// native select onchange
filterEl.onchange = () => {
  const sel = filterEl.value;
  selected.textContent = filterEl.options[filterEl.selectedIndex].text;
  renderItems(sel === 'all' ? allItems : allItems.filter(i => i.category === sel));
};

// render
function renderItems(items) {
  showcase.innerHTML = '';
  items.forEach(({ title, desc, price, imageUrls = [] }) => {
        const galleryData = JSON.stringify(imageUrls);
    const main = imageUrls[0] || '';
    const thumbs = imageUrls
      .map(u => `<img src="${u}" class="thumb" data-gallery='${galleryData}'>`)
      .join('');
      const card = document.createElement('article');
          card.className = 'item-card';
          card.innerHTML = `
            <div class="main-image">
              <img src="${main}" data-gallery='${galleryData}' alt="${title}">
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

// Adatok betöltése és szűrő opciók generálása
onValue(ref(db, "antiques"), snap => {
  const data = snap.val() || {};
  allItems = Object.entries(data).map(([id, it]) => ({ id, ...it }));

  // native select opciók
  const categories = Array.from(new Set(allItems.map(i => i.category).filter(c => c)));
  filterEl.innerHTML = '<option value="all">Összes</option>' +
    categories.map(c => `<option value="${c}">${c}</option>`).join('');

  // custom dropdown opciók
  optionsContainer.innerHTML = '<li data-value="all">Összes</li>' +
    categories.map(c => `<li data-value="${c}">${c}</li>`).join('');

  renderItems(allItems);
});

// kattintás máshova: dropdown bezárása
document.addEventListener('click', e => {
  if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
});



// Thumbnail hover: main image frissítése
document.addEventListener('mouseover', e => {
  const thumb = e.target;
  if (thumb.classList.contains('thumb')) {
    const card = thumb.closest('.item-card');
    const mainImg = card.querySelector('.main-image img');
    if (mainImg) mainImg.src = thumb.src;
  }
});


// Thumb-row Scrolling
(() => {
  const speed    = 5;    // px/frame
  const deadZone = 0.1;    // a sor szélességének 10%-a középső zónának
  let rafId      = null;
  let currentRow = null;
  let mouseX     = 0;
  let rowLeft    = 0;
  let rowWidth   = 0;

  function step() {
    if (currentRow) {
      const center = rowLeft + rowWidth / 2;
      const delta  = mouseX - center;
      const zone   = rowWidth * deadZone; // 10% középső zóna
      let dir = 0;

      if (delta > zone)       dir = +1;   // jobb oldalon → scroll balra
      else if (delta < -zone) dir = -1;   // bal oldalon → scroll jobbra

      if (dir !== 0) {
        currentRow.scrollLeft += dir * speed;
      }
      rafId = requestAnimationFrame(step);
    } else {
      rafId = null;
    }
  }

  document.addEventListener('pointermove', e => {
    const row = e.target.closest('.thumb-row');
    if (row) {
      currentRow = row;
      const rect = row.getBoundingClientRect();
      rowLeft    = rect.left;
      rowWidth   = rect.width;
      mouseX     = e.clientX;

      if (!rafId) rafId = requestAnimationFrame(step);
    } else {
      currentRow = null;
    }
  });
})();

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

// custom dropdown események
selected.addEventListener('click', () => {
  dropdown.classList.toggle('open');
});
optionsContainer.addEventListener('click', e => {
  if (e.target.tagName === 'LI') {
    const val = e.target.dataset.value;
    // native select érték
    filterEl.value = val;
    filterEl.onchange();
    // ui update
    selected.textContent = e.target.textContent;
    dropdown.classList.remove('open');
    // aktív li
    optionsContainer.querySelectorAll('li').forEach(li => li.classList.remove('active'));
    e.target.classList.add('active');
  }
});

// kattintás máshova: dropdown bezárása
document.addEventListener('click', e => {
  if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
});



