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
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const itemsRef = ref(db, "antiques");

// DOM elemek
const showcase         = document.getElementById("showcase");
const filterEl         = document.getElementById("categoryFilter");
const dropdown         = document.getElementById("categoryDropdown");
const selected         = dropdown.querySelector(".selected");
const optionsContainer = dropdown.querySelector(".options");
const mainCategoryFilter = document.getElementById("mainCategoryFilter");


// URL-ből jövő kezdeti szűrő
const urlParams     = new URLSearchParams(window.location.search);


let allItems = [];

// --- Egyetlen adatbetöltés + filter + render ---
onValue(ref(db, "antiques"), snap => {
  const data = snap.val() || {};
  allItems = Object.entries(data).map(([id, it]) => ({ id, ...it }));

  const selectedMain = mainCategoryFilter.value || urlParams.get("category") || "";
  mainCategoryFilter.value = selectedMain;
mainSelected.textContent = selectedMain || "Összes";
mainOptions.querySelectorAll("li").forEach(li =>
  li.classList.toggle("active", li.dataset.value === selectedMain)
);


  // Másodlagos kategóriák kigyűjtése az adott fő kategóriához
  const subcategories = Array.from(
    new Set(
      allItems
        .filter(i => !selectedMain || i.mainCategory === selectedMain)
        .map(i => i.category)
        .filter(Boolean)
    )
  );

  // Szűrők újratöltése
  filterEl.innerHTML =
    '<option value="all">Összes</option>' +
    subcategories.map(c => `<option value="${c}">${c}</option>`).join("");

  optionsContainer.innerHTML =
    '<li data-value="all">Összes</li>' +
    subcategories.map(c => `<li data-value="${c}">${c}</li>`).join("");

  // Beállítjuk a dropdownokat a korábban megadott értékek alapján
  const currentSub = filterEl.value;
  const validSub = subcategories.includes(currentSub) ? currentSub : "all";
  filterEl.value = validSub;
  selected.textContent = validSub === "all" ? "Összes" : validSub;

  optionsContainer
    .querySelectorAll("li")
    .forEach(li =>
      li.classList.toggle("active", li.dataset.value === validSub)
    );

  const toRender = allItems.filter(item => {
    const matchMain = !selectedMain || item.mainCategory === selectedMain;
    const matchSub = validSub === "all" || item.category === validSub;
    return matchMain && matchSub;
  });

  renderItems(toRender);
});
mainCategoryFilter.addEventListener("change", () => {
  const newMain = mainCategoryFilter.value;
  const url = newMain ? `?category=${encodeURIComponent(newMain)}` : "";
  window.history.replaceState(null, "", window.location.pathname + url);
  location.reload(); // újratöltés a friss URL-paraméterrel
});

// natív select változás
filterEl.onchange = () => {
  const selectedSub = filterEl.value;
  const selectedMain = mainCategoryFilter.value;
  selected.textContent = filterEl.options[filterEl.selectedIndex].text;

  const filtered = allItems.filter(item => {
    const matchMain = !selectedMain || item.mainCategory === selectedMain;
    const matchSub = selectedSub === "all" || item.category === selectedSub;
    return matchMain && matchSub;
  });

  renderItems(filtered);
};

// --- Render függvény változatlanul ---
function renderItems(items) {
  showcase.innerHTML = "";
  items.forEach(({ title, desc, price, imageUrls = [] }, index) => {
    const galleryData = JSON.stringify(imageUrls);
    const main = imageUrls[0] || "";
    const thumbs = imageUrls
      .map(u => `<img src="${u}" class="thumb" data-gallery='${galleryData}'>`)
      .join("");
    const card = document.createElement("article");
    card.className = "item-card";
    card.style.animationDelay = `${index * 100}ms`; // kis késleltetés
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

// --- Custom dropdown a fő kategóriához (ugyanolyan logikával) ---
const mainDropdown = document.getElementById("mainCategoryDropdown");
const mainSelected = mainDropdown.querySelector(".selected");
const mainOptions = mainDropdown.querySelector(".options");
const mainFilter = document.getElementById("mainCategoryFilter");

mainSelected.addEventListener("click", () => {
  mainDropdown.classList.toggle("open");
});

mainOptions.addEventListener("click", e => {
  if (e.target.tagName === "LI") {
    const value = e.target.dataset.value;
    mainFilter.value = value;
    mainSelected.textContent = e.target.textContent;
    mainDropdown.classList.remove("open");

    // Aktív kijelölés stílus
    mainOptions.querySelectorAll("li").forEach(li => li.classList.remove("active"));
    e.target.classList.add("active");

    // URL frissítés + oldal újratöltés
    const url = value ? `?category=${encodeURIComponent(value)}` : "";
    window.history.replaceState(null, "", window.location.pathname + url);
    location.reload();
  }
});

// Kívülre kattintásra zárjuk a dropdown-t
document.addEventListener("click", e => {
  if (!mainDropdown.contains(e.target)) mainDropdown.classList.remove("open");
});


