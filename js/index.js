import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// saját configod
const firebaseConfig = {
    apiKey: "…IDE_KÉRD_AZ_OWN_API_KEY…",
    authDomain: "…IDE_KÉRD_AZ_OWN_AUTH_DOMAIN…",
    databaseURL: "…IDE_KÉRD_AZ_OWN_DATABASE_URL…",
    projectId: "antique-showcase-website",
    storageBucket: "…IDE_KÉRD_AZ_OWN_STORAGE_BUCKET…",
    messagingSenderId: "…IDE_KÉRD_AZ_OWN_MESSAGING_SENDER_ID…",
    appId: "…IDE_KÉRD_AZ_OWN_APP_ID…"
  };
initializeApp(firebaseConfig);
const db = getDatabase();

const container = document.getElementById("items-container");
const antiquesRef = ref(db, "antiques");

onValue(antiquesRef, snapshot => {
  container.innerHTML = "";
  if (!snapshot.exists()) {
    container.innerHTML = "<p>Nincsenek régiségek.</p>";
    return;
  }
  Object.entries( snapshot.val() ).forEach(([id, item]) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.title}" class="card-img">
      <div class="card-body">
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
        <p class="price">${item.price} Ft</p>
      </div>
    `;
    container.appendChild(card);
  });
});