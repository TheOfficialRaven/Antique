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
  const newCatInput    = document.getElementById("newCategoryInput");
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const confirmModal   = document.getElementById('confirmModal');
  const yesBtn         = document.getElementById('confirmYes');
  const noBtn          = document.getElementById('confirmNo');
  const catSelect   = document.getElementById("categorySelect");
  const adminDD     = document.getElementById("adminCategoryDropdown");
  const adminSel    = adminDD.querySelector('.selected');
  const adminOpts   = adminDD.querySelector('.options');

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

  onValue(categoriesRef, snap => {
    const cats = [];
    catSelect.innerHTML = '<option value="">-- Válassz kategóriát --</option>';
    snap.forEach(ch => {
      cats.push(ch.key);
      catSelect.innerHTML += `<option value="${ch.key}">${ch.key}</option>`;
    });
    // custom dropdown
    adminOpts.innerHTML = '<li data-value="">-- Válassz kategóriát --</li>' +
      cats.map(c => `<li data-value="${c}">${c}</li>`).join('');
  });
  
  // custom dropdown események (ugyanúgy mint fent):
  adminSel.addEventListener('click', () => adminDD.classList.toggle('open'));
  adminOpts.addEventListener('click', e => {
    if (e.target.tagName !== 'LI') return;
    const v = e.target.dataset.value;
    catSelect.value = v;
    adminSel.textContent = e.target.textContent;
    adminDD.classList.remove('open');
    adminOpts.querySelectorAll('li').forEach(li=>li.classList.remove('active'));
    e.target.classList.add('active');
  });
  document.addEventListener('click', e => {
    if (!adminDD.contains(e.target)) adminDD.classList.remove('open');
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
      const thumbsHTML = Array.isArray(it.imageUrls)
        ? it.imageUrls.map(url => `<img src="${url}" class="thumb" data-url="${url}">`).join("")
        : "";
      const imageUrls = Array.isArray(it.imageUrls) ? it.imageUrls : [];
      const storagePaths = Array.isArray(it.storagePaths) ? it.storagePaths : [];
      const mainImgSrc = imageUrls[0] || '';

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
          <p><textarea class="edit-desc" data-id="${id}">${it.desc}</textarea></p>
          <p><input class="edit-price" data-id="${id}" value="${it.price}"></p>
          <div class="button-group">
            <button class="save-btn" data-id="${id}">Mentés</button>
            <button class="delete-btn" data-id="${id}" data-paths='${JSON.stringify(storagePaths)}'>Törlés</button>
          </div>
        </div>`;
      list.appendChild(card);

      // Thumbnail hover → fő kép frissítése
      card.querySelectorAll('.thumb').forEach(thumb => {
        thumb.addEventListener('mouseover', () => {
          card.querySelector('.main-image img').src = thumb.dataset.url;
        });
      });

      // Thumb-row Scrolling
      (() => {
        const speed    = 5;     // px/frame
        const deadZone = 0.1;   // 10% középső zóna
        let rafId      = null;
        let currentRow = null;
        let mouseX     = 0;
        let rowLeft    = 0;
        let rowWidth   = 0;

        function step() {
          if (!currentRow) return void (rafId = null);
          const center = rowLeft + rowWidth / 2;
          const delta  = mouseX - center;
          const zone   = rowWidth * deadZone;
          let dir = 0;
          if (delta > zone)       dir = +1;
          else if (delta < -zone) dir = -1;
          if (dir !== 0) currentRow.scrollLeft += dir * speed;
          rafId = requestAnimationFrame(step);
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

      // 6) SortableJS – minden kártyán egyszer, scrollRow helyett a row változót használva
      const thumbRowEl = card.querySelector('.thumb-row');
      if (thumbRowEl.children.length > 1) {
        Sortable.create(thumbRowEl, {
          animation: 150,
          onEnd: async () => {
            const newOrder = Array.from(thumbRowEl.children)
              .map(imgEl => imgEl.dataset.url);
            await update(dbRef(db, `antiques/${id}`), { imageUrls: newOrder });
          }
        });
      }
    });

    // Mentés gomb események (a listán belül)
    list.querySelectorAll('.save-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const title = document.querySelector(`.edit-title[data-id="${id}"]`).value;
        const desc = document.querySelector(`.edit-desc[data-id="${id}"]`).value;
        const price = document.querySelector(`.edit-price[data-id="${id}"]`).value;
        await update(dbRef(db, `antiques/${id}`), { title, desc, price });
      };
    });

    // Szépített törlés modal logika… (felhasználói confirm helyett custom modal)
    const confirmModal = document.getElementById('confirmModal');
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');
    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const id = btn.dataset.id;
        const paths = JSON.parse(btn.dataset.paths || '[]');
        confirmModal.classList.add('show');
        yesBtn.onclick = async () => {
          for (const p of paths) {
            try { await deleteObject(storageRef(storage, p)); } catch {};
          }
          await remove(dbRef(db, `antiques/${id}`));
          confirmModal.classList.remove('show');
        };
        noBtn.onclick = () => confirmModal.classList.remove('show');
      });
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
    if (!files.length) return alert("Legalább egy képet válassz!");
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