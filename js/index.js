import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// saját configod
const firebaseConfig = {
    apiKey: "AIzaSyDuyEa0t2FUFGGcVspBLomreRxmkMaeYZE",
    authDomain: "antique-showcase-website.firebaseapp.com",
    databaseURL: "https://antique-showcase-website-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "antique-showcase-website",
    storageBucket: "antique-showcase-website.firebasestorage.app",
    messagingSenderId: "287979700668",
    appId: "1:287979700668:web:7cda667f12b7e8a061abb9",
    measurementId: "G-1JDT9QWSBR"
  };
initializeApp(firebaseConfig);
const db = getDatabase();

const showcase = document.getElementById("showcase");
onValue(ref(db, "antiques"), snap => {
  showcase.innerHTML = "";
  Object.entries(snap.val()||{}).forEach(([id, { title, desc, price, imageUrl }]) => {
    const card = document.createElement("article");
    card.className = "item-card";
    card.innerHTML = `
      <img src="${imageUrl}" alt="${title}">
      <div class="card-body">
        <h3>${title}</h3>
        <p>${desc}</p>
        <p class="price">${price} Ft</p>
      </div>`;
    showcase.appendChild(card);
  });
});

// --- Lightbox a képekre ---
const imgModal    = document.getElementById("imageModal");
const modalImg    = document.getElementById("modalImage");
const modalCloser = document.querySelector(".img-modal-close");

// Ha a modal close gombra kattintasz:
modalCloser.onclick = () => imgModal.classList.remove("show");

// Dinamikusan hozzáadjuk az összes .item-card img-hez:
document.addEventListener("click", e => {
  const tgt = e.target;
  // ha egy .item-card img-re kattintottunk
  if (tgt.tagName === "IMG" && tgt.closest(".item-card")) {
    modalImg.src = tgt.src;
    imgModal.classList.add("show");
  }
});