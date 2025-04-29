import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  push,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDuyEa0t2FUFGGcVspBLomreRxmkMaeYZE",
  authDomain:        "antique-showcase-website.firebaseapp.com",
  databaseURL:       "https://antique-showcase-website-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "antique-showcase-website",
  storageBucket:     "antique-showcase-website.firebasestorage.app",
  messagingSenderId: "287979700668",
  appId:             "1:287979700668:web:7cda667f12b7e8a061abb9"
};
initializeApp(firebaseConfig);

const auth    = getAuth();
const db      = getDatabase();
const storage = getStorage();

// ha nincs bejelentkezve, irányítsa vissza a publikus index.html-re
onAuthStateChanged(auth, user => {
  if (!user) location.href = "index.html";
  else loadAdmin();
});

// kijelentkezés
document.getElementById("logoutBtn").onclick = () => signOut(auth);

function loadAdmin(){
  const list      = document.getElementById("admin-showcase"),
        itemsRef  = dbRef(db, "antiques"),
        addNewBtn = document.getElementById("addNew"),
        modal     = document.getElementById("addItemModal"),
        closeBtn  = document.getElementById("modal-close-btn"),
        form      = document.getElementById("addItemForm"),
        imageIn   = document.getElementById("imageInput");

  // 1) Lista és szerkesztés/törlés gombok
  onValue(itemsRef, snap => {
    list.innerHTML = "";
    Object.entries(snap.val()||{}).forEach(([id, it]) => {
      const card = document.createElement("article");
      card.className = "item-card";
      card.innerHTML = `
        <img src="${it.imageUrl}" alt="${it.title}">
        <div class="card-body">
          <h3><input class="edit-title" data-id="${id}" value="${it.title}"></h3>
          <p><textarea class="edit-desc" data-id="${id}">${it.desc}</textarea></p>
          <p><input class="edit-price" data-id="${id}" value="${it.price}"></p>
          <button class="save-btn"   data-id="${id}">Mentés</button>
          <button class="delete-btn" data-id="${id}" data-image-url="${it.imageUrl}">Törlés</button>
        </div>`;
      list.appendChild(card);
    });

    // mentés
    list.querySelectorAll(".save-btn").forEach(b => {
      b.onclick = () => {
        const id    = b.dataset.id;
        const title = document.querySelector(`.edit-title[data-id="${id}"]`).value;
        const desc  = document.querySelector(`.edit-desc[data-id="${id}"]`).value;
        const price = document.querySelector(`.edit-price[data-id="${id}"]`).value;
        update(dbRef(db, `antiques/${id}`), { title, desc, price });
      };
    });

    // törlés: előbb storage-ból, majd RTDB-ből
    list.querySelectorAll(".delete-btn").forEach(b => {
      b.onclick = async () => {
        if (!confirm("Biztos törlöd?")) return;
        const id       = b.dataset.id;
        const imageUrl = b.dataset.imageUrl;
        try {
          // kicsomagoljuk a storage path-et az URL-ből
          const encodedPath = imageUrl.split('/o/')[1].split('?')[0];
          const filePath    = decodeURIComponent(encodedPath);
          await deleteObject(storageRef(storage, filePath));
        } catch(err) {
          console.error("Hiba a Storage törlésekor:", err);
        }
        await remove(dbRef(db, `antiques/${id}`));
      };
    });
  });

  // 2) Új tétel modal show/hide
  addNewBtn.onclick   = () => modal.classList.add("show");
  closeBtn.onclick   = () => modal.classList.remove("show");

  // 3) Form beküldése: Storage ↑ + RTDB ↑
  form.onsubmit = async e => {
    e.preventDefault();
    const title = form.title.value.trim(),
          desc  = form.desc.value.trim(),
          price = Number(form.price.value),
          file  = imageIn.files[0];

    if (!file) {
      alert("Válassz ki egy képet!");
      return;
    }

    // --- FIREBASE STORAGE UPLOAD ---
    const sRef = storageRef(storage, `antiques/${Date.now()}_${file.name}`);
    await uploadBytes(sRef, file);
    const imageUrl = await getDownloadURL(sRef);

    // --- RTDB-be mentés ---
    const newRef = push(dbRef(db, "antiques"));
    await update(newRef, { title, desc, price, imageUrl });

    form.reset();
    modal.classList.remove("show");
  };
}