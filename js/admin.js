import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  push,
  update,
  remove,
  set
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.14.0/modular/sortable.esm.js";

// Firebase konfiguráció
const firebaseConfig = {
  apiKey: "AIzaSyDuyEa0t2FUFGGcVspBLomreRxmkMaeYZE",
  authDomain: "antique-showcase-website.firebaseapp.com",
  databaseURL: "https://antique-showcase-website-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "antique-showcase-website",
  storageBucket: "antique-showcase-website.firebasestorage.app",
  messagingSenderId: "287979700668",
  appId: "1:287979700668:web:7cda667f12b7e8a061abb9"
};
initializeApp(firebaseConfig);

const auth    = getAuth();
const db      = getDatabase();
const storage = getStorage();

// Auth állapot ellenőrzése
onAuthStateChanged(auth, user => {
  if (!user) location.href = "index.html";
  else loadAdmin();
});

document.getElementById("logoutBtn").onclick = () => signOut(auth);

async function loadAdmin() {
  const list           = document.getElementById("admin-showcase");
  const addNewBtn      = document.getElementById("addNew");
  const modal          = document.getElementById("addItemModal");
  const closeBtn       = document.getElementById("modal-close-btn");
  const form           = document.getElementById("addItemForm");
  const imageIn        = document.getElementById("imageInput");
  const catSelect      = document.getElementById("categorySelect");
  const newCatInput    = document.getElementById("newCategoryInput");
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const confirmModal   = document.getElementById('confirmModal');
  const yesBtn         = document.getElementById('confirmYes');
  const noBtn          = document.getElementById('confirmNo');

  // Kategóriák kezelése
  const categoriesRef = dbRef(db, "categories");
  let categories = [];
  onValue(categoriesRef, snap => {
    categories = [];
    catSelect.innerHTML = '<option value="">-- Válassz kategóriát --</option>';
    snap.forEach(child => {
      const cat = child.key;
      categories.push(cat);
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      catSelect.appendChild(opt);
    });
  });

  addCategoryBtn.onclick = async () => {
    const name = newCatInput.value.trim();
    if (!name) return alert("Adj meg egy kategória nevet!");
    if (categories.includes(name)) return alert("Ez a kategória már létezik.");
    await set(dbRef(db, `categories/${name}`), true);
    newCatInput.value = "";
  };

  // Antik tárgyak betöltése (több kép támogatással)
  const itemsRef = dbRef(db, "antiques");
  onValue(itemsRef, snap => {
    list.innerHTML = "";
    const data = snap.val() || {};

    Object.entries(data).forEach(([id, it]) => {
      // Thumb-ek HTML
      const thumbsHTML = Array.isArray(it.imageUrls)
        ? it.imageUrls.map(url => `<img src="${url}" class="thumb" data-url="${url}">`).join("")
        : "";

      // Main kép src és storagePaths
      const mainImgSrc   = it.imageUrls?.[0] || "";
      const storagePaths = Array.isArray(it.storagePaths) ? it.storagePaths : [];

      // Kártya markup
      const card = document.createElement('article');
      card.className = 'item-card admin';
      card.innerHTML = `
        <div class="main-image">
          <img src="${mainImgSrc}" alt="${it.title}">
        </div>
        <div class="thumb-row">
          ${thumbsHTML}
        </div>
        <div class="card-body">
          <p><strong>Kategória:</strong> ${it.category || 'Nincs'}</p>
          <h3><input class="edit-title" data-id="${id}" value="${it.title}"></h3>
          <textarea class="edit-desc" data-id="${id}">${it.desc}</textarea>
          <input class="edit-price" data-id="${id}" value="${it.price}">
          <div class="button-group">
            <button class="save-btn" data-id="${id}">Mentés</button>
            <button class="delete-btn" data-id="${id}" data-paths='${JSON.stringify(storagePaths)}'>Törlés</button>
          </div>
        </div>`;

      // Append
      list.appendChild(card);

      // Thumbnail hover → fő kép
      card.querySelectorAll('.thumb').forEach(thumb => {
        thumb.addEventListener('mouseover', () => {
          const mainImg = card.querySelector('.main-image img');
          mainImg.src = thumb.dataset.url;
        });
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
    });

    // Mentés esemény
    list.querySelectorAll('.save-btn').forEach(btn => {
      btn.onclick = async () => {
        const id    = btn.dataset.id;
        const title = list.querySelector(`.edit-title[data-id="${id}"]`).value;
        const desc  = list.querySelector(`.edit-desc[data-id="${id}"]`).value;
        const price = list.querySelector(`.edit-price[data-id="${id}"]`).value;
        await update(dbRef(db, `antiques/${id}`), { title, desc, price });
      };
    });

    // Törlés esemény
    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const id    = btn.dataset.id;
        const paths = JSON.parse(btn.dataset.paths || '[]');

        // Megjelenítjük a modalt
        confirmModal.classList.add('show');

        // Igen
        yesBtn.onclick = async () => {
          for (const p of paths) {
            try { await deleteObject(storageRef(storage, p)); }
            catch (err) { console.error(err); }
          }
          await remove(dbRef(db, `antiques/${id}`));
          confirmModal.classList.remove('show');
        };

        // Mégse
        noBtn.onclick = () => {
          confirmModal.classList.remove('show');
        };
      });
    });
  });

  // Modal show/hide és új tétel mentés
  addNewBtn.onclick = () => modal.classList.add("show");
  closeBtn.onclick  = () => modal.classList.remove("show");

  form.onsubmit = async e => {
    e.preventDefault();
    const title    = form.title.value.trim();
    const desc     = form.desc.value.trim();
    const price    = Number(form.price.value);
    const category = catSelect.value;
    const files    = Array.from(imageIn.files);

    if (!title || !desc || !price || !category) return alert("Tölts ki minden mezőt!");
    if (files.length === 0) return alert("Legalább egy képet válassz!");

    const uploadOps = files.map(async file => {
      const filePath = `antiques/${Date.now()}_${file.name}`;
      const sRef     = storageRef(storage, filePath);
      await uploadBytes(sRef, file);
      const url      = await getDownloadURL(sRef);
      return { url, path: filePath };
    });
    const results = await Promise.all(uploadOps);
    const imageUrls    = results.map(r => r.url);
    const storagePaths = results.map(r => r.path);

    const newRef = push(dbRef(db, "antiques"));
    await update(newRef, { title, desc, price, category, imageUrls, storagePaths });

    form.reset();
    modal.classList.remove("show");
  };
}