import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase, ref, onValue, push, update, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// init
const firebaseConfig = { /* ide a TE saját configod */ };
initializeApp(firebaseConfig);
const auth = getAuth();
const db   = getDatabase();

// csak bejelentkezett user folytathatja
onAuthStateChanged(auth, user => {
  if (!user) {
    // ha nincs bejelentkezve, visszadobjuk index.html-re
    location.href = "index.html";
  } else {
    loadAdminItems();
  }
});

// kijelentkezés gomb
document.getElementById("logoutBtn").onclick = () => signOut(auth);

// CRUD-feltöltés, szerkesztés, törlés ugyanaz, mint korábban
function loadAdminItems() {
  const adminContainer = document.getElementById("admin-showcase");
  const refItems = ref(db, "antiques");

  onValue(refItems, snap => {
    adminContainer.innerHTML = "";
    Object.entries(snap.val() || {}).forEach(([id, item]) => {
      const card = document.createElement("article");
      card.className = "card admin";
      card.innerHTML = `
        <img src="${item.imageUrl}" alt="${item.title}">
        <div class="card-body">
          <h3><input value="${item.title}" data-id="${id}" class="edit-title"></h3>
          <p><textarea data-id="${id}" class="edit-desc">${item.desc}</textarea></p>
          <p><input value="${item.price}" data-id="${id}" class="edit-price"></p>
          <button class="save-btn" data-id="${id}">Mentés</button>
          <button class="delete-btn" data-id="${id}">Törlés</button>
        </div>
      `;
      adminContainer.appendChild(card);
    });

    // mentés
    adminContainer.querySelectorAll(".save-btn").forEach(btn => {
      btn.onclick = () => {
        const id    = btn.dataset.id;
        const title = adminContainer.querySelector(`.edit-title[data-id="${id}"]`).value;
        const desc  = adminContainer.querySelector(`.edit-desc[data-id="${id}"]`).value;
        const price = adminContainer.querySelector(`.edit-price[data-id="${id}"]`).value;
        update(refItems.child(id), { title, desc, price });
      };
    });
    // törlés
    adminContainer.querySelectorAll(".delete-btn").forEach(btn => {
      btn.onclick = () => {
        if (confirm("Biztos törlöd?")) remove(refItems.child(btn.dataset.id));
      };
    });
  });

  // új tétel létrehozása
  document.getElementById("addNew").onclick = () => {
    const newRef = push(ref(db, "antiques"));
    update(newRef, {
      title: "Új tétel",
      desc:  "Leírás...",
      price: 0,
      imageUrl: "images/placeholder.jpg"
    });
  };
}