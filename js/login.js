import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

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
const auth = getAuth();

const loginBtn = document.getElementById("loginBtn"),
      errMsg   = document.getElementById("loginError");

loginBtn.onclick = () => {
  const email = document.getElementById("email").value,
        pw    = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, pw)
    .then(() => location.href = "admin.html")
    .catch(e => errMsg.textContent = e.message);
};