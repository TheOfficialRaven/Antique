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

const auth = getAuth();
const db = getDatabase();
const storage = getStorage();

// Auth állapot ellenőrzése
onAuthStateChanged(auth, user => {
  if (!user) location.href = "index.html";
  else loadAdmin();
});

document.getElementById("logoutBtn").onclick = () => signOut(auth);

function loadAdmin() {
  const list = document.getElementById("admin-showcase");
  const addNewBtn = document.getElementById("addNew");
  const modal = document.getElementById("addItemModal");
  const closeBtn = document.getElementById("modal-close-btn");
  const form = document.getElementById("addItemForm");
  const imageIn = document.getElementById("imageInput");
  const catSelect = document.getElementById("categorySelect");
  const newCatInput = document.getElementById("newCategoryInput");
  const addCategoryBtn = document.getElementById("addCategoryBtn");

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
      const imageUrls = Array.isArray(it.imageUrls) ? it.imageUrls : [];
      const storagePaths = Array.isArray(it.storagePaths) ? it.storagePaths : [];
      const mainImgSrc = imageUrls[0] || '';
      const thumbs = imageUrls.map(url =>
        `<img src="${url}" class="thumb" data-url="${url}" />`
      ).join('');

      const card = document.createElement('article');
      card.className = 'item-card admin';
      card.innerHTML = `
        <div class="main-image">
          <img src="${mainImgSrc}" alt="${it.title}" />
        </div>
        <div class="thumb-row">
          ${thumbs}
        </div>
        <div class="card-body">
          <p><strong>Kategória:</strong> ${it.category || 'Nincs'}</p>
          <h3><input class="edit-title" data-id="${id}" value="${it.title}"></h3>
          <p><textarea class="edit-desc" data-id="${id}">${it.desc}</textarea></p>
          <p><input class="edit-price" data-id="${id}" value="${it.price}"></p>
          <div class="button-group">
            <button class="save-btn" data-id="${id}">Mentés</button>
            <button class="delete-btn" data-id="${id}" data-paths='${JSON.stringify(storagePaths)}'>Törlés</button>
          </div>
        </div>`;
      list.appendChild(card);
    });

    // Thumbnail hover: fő kép frissítése
    list.querySelectorAll('.thumb').forEach(thumb => {
      thumb.addEventListener('mouseover', () => {
        const card = thumb.closest('.item-card');
        const mainImg = card.querySelector('.main-image img');
        mainImg.src = thumb.dataset.url;
      });
    });

    // Mentés gomb események
    list.querySelectorAll('.save-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const title = document.querySelector(`.edit-title[data-id="${id}"]`).value;
        const desc = document.querySelector(`.edit-desc[data-id="${id}"]`).value;
        const price = document.querySelector(`.edit-price[data-id="${id}"]`).value;
        const category = catSelect.value;
        await update(dbRef(db, `antiques/${id}`), { title, desc, price, category });
      };
    });

    // Törlés gomb események
    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm("Biztos törlöd?")) return;
        const id = btn.dataset.id;
        const paths = JSON.parse(btn.dataset.paths || '[]');
        for (const p of paths) {
          try { await deleteObject(storageRef(storage, p)); } catch (err) { console.error(err); }
        }
        await remove(dbRef(db, `antiques/${id}`));
      };
    });
  });

  // Modal megjelenítése/elrejtése
  addNewBtn.onclick = () => modal.classList.add("show");
  closeBtn.onclick = () => modal.classList.remove("show");

  // Új tétel mentése (párhuzamos upload)
  form.onsubmit = async e => {
    e.preventDefault();
    const title = form.title.value.trim();
    const desc = form.desc.value.trim();
    const price = Number(form.price.value);
    const category = catSelect.value;
    const files = Array.from(imageIn.files);
    if (!title || !desc || !price || !category) return alert("Tölts ki minden mezőt!");
    if (files.length === 0) return alert("Legalább egy képet válassz!");
    const uploadOps = files.map(async file => {
      const filePath = `antiques/${Date.now()}_${file.name}`;
      const sRef = storageRef(storage, filePath);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      return { url, path: filePath };
    });
    const results = await Promise.all(uploadOps);
    const imageUrls = results.map(r => r.url);
    const storagePaths = results.map(r => r.path);
    const newRef = push(dbRef(db, "antiques"));
    await update(newRef, { title, desc, price, category, imageUrls, storagePaths });
    form.reset();
    modal.classList.remove("show");
  };
}