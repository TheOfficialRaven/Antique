import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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
const showcase         = document.getElementById("showcase");
const filterEl         = document.getElementById("categoryFilter");
const dropdown         = document.getElementById("categoryDropdown");
const selected         = dropdown.querySelector(".selected");
const optionsContainer = dropdown.querySelector(".options");

// URL-ből jövő kezdeti szűrő
const urlParams     = new URLSearchParams(window.location.search);
const initialFilter = urlParams.get("category") || "all";

let allItems = [];

// --- Egyetlen adatbetöltés + filter + render ---
onValue(ref(db, "antiques"), snap => {
  const data = snap.val() || {};
  allItems = Object.entries(data).map(([id, it]) => ({ id, ...it }));

  // 1) Kategóriák kigyűjtése
  const categories = Array.from(
    new Set(allItems.map(i => i.category).filter(c => c))
  );

  // 2) Natív <select> feltöltése
  filterEl.innerHTML =
    '<option value="all">Összes</option>' +
    categories.map(c => `<option value="${c}">${c}</option>`).join("");

  // 3) Custom dropdown feltöltése
  optionsContainer.innerHTML =
    '<li data-value="all">Összes</li>' +
    categories.map(c => `<li data-value="${c}">${c}</li>`).join("");

  // 4) Kezdeti filter beállítása (URL alapján)
  if (initialFilter !== "all" && categories.includes(initialFilter)) {
    filterEl.value       = initialFilter;
    selected.textContent = initialFilter;
    optionsContainer
      .querySelectorAll("li")
      .forEach(li => li.classList.toggle("active", li.dataset.value === initialFilter));
  } else {
    filterEl.value       = "all";
    selected.textContent = "Összes";
    optionsContainer
      .querySelectorAll("li")
      .forEach(li => li.classList.toggle("active", li.dataset.value === "all"));
  }

  // 5) Első render az initialFilter szerint
  const toRender = initialFilter === "all"
    ? allItems
    : allItems.filter(i => i.category === initialFilter);
  renderItems(toRender);
});

// natív select változás
filterEl.onchange = () => {
  const sel = filterEl.value;
  selected.textContent = filterEl.options[filterEl.selectedIndex].text;
  renderItems(
    sel === "all" 
      ? allItems 
      : allItems.filter(item => item.category === sel)
  );
};

// --- Render függvény változatlanul ---
function renderItems(items) {
  showcase.innerHTML = "";
  items.forEach(({ title, desc, price, imageUrls = [] }) => {
    const galleryData = JSON.stringify(imageUrls);
    const main = imageUrls[0] || "";
    const thumbs = imageUrls
      .map(u => `<img src="${u}" class="thumb" data-gallery='${galleryData}'>`)
      .join("");
    const card = document.createElement("article");
    card.className = "item-card";
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

// kattintás máshova: dropdown bezárása
document.addEventListener("click", e => {
  if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
});

// Thumbnail hover: main image váltás
document.addEventListener("mouseover", e => {
  const thumb = e.target;
  if (thumb.classList.contains("thumb")) {
    const card = thumb.closest(".item-card");
    const mainImg = card.querySelector(".main-image img");
    if (mainImg) mainImg.src = thumb.src;
  }
});

// Thumb-row automatikus scrollolás
(() => {
  const speed    = 5;
  const deadZone = 0.1;
  let rafId      = null;
  let currentRow = null;
  let mouseX     = 0;
  let rowLeft    = 0;
  let rowWidth   = 0;

  function step() {
    if (currentRow) {
      const center = rowLeft + rowWidth / 2;
      const delta  = mouseX - center;
      const zone   = rowWidth * deadZone;
      let dir = 0;
      if (delta > zone)       dir = +1;
      else if (delta < -zone) dir = -1;
      if (dir !== 0) {
        currentRow.scrollLeft += dir * speed;
      }
      rafId = requestAnimationFrame(step);
    } else {
      rafId = null;
    }
  }

  document.addEventListener("pointermove", e => {
    const row = e.target.closest(".thumb-row");
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

// modal bezárása
const toggleClose = () => imgModal.classList.remove("show");
modalCloser.onclick = toggleClose;

// kép vagy thumbnail kattintás
document.addEventListener("click", e => {
  const tgt = e.target;
  if (tgt.tagName === "IMG" && tgt.closest(".item-card")) {
    currentGallery = JSON.parse(tgt.dataset.gallery || "[]");
    currentIndex   = currentGallery.indexOf(tgt.src);
    if (currentIndex < 0) currentIndex = 0;
    modalImg.src = currentGallery[currentIndex];
    imgModal.classList.add("show");
  }
});

// modalInner kattintás: lapozás
modalInner.addEventListener("click", e => {
  if (e.target === modalCloser) return;
  if (currentGallery.length < 2) return;
  const rect   = modalInner.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  if (clickX < rect.width / 2) {
    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
  } else {
    currentIndex = (currentIndex + 1) % currentGallery.length;
  }
  modalImg.src = currentGallery[currentIndex];
});

// háttérre kattintás: bezárás
imgModal.addEventListener("click", e => {
  if (e.target === imgModal) toggleClose();
});

// custom dropdown események
selected.addEventListener("click", () => {
  dropdown.classList.toggle("open");
});
optionsContainer.addEventListener("click", e => {
  if (e.target.tagName === "LI") {
    const val = e.target.dataset.value;
    filterEl.value = val;
    filterEl.onchange();
    selected.textContent = e.target.textContent;
    dropdown.classList.remove("open");
    optionsContainer.querySelectorAll("li").forEach(li => li.classList.remove("active"));
    e.target.classList.add("active");
  }
});

