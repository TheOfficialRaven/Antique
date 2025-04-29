// js/login.js
import { auth } from "./firebase-init.js";
import { signInWithEmailAndPassword, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Ha már be vagy, ugorj rögtön az admin felületre
onAuthStateChanged(auth, user => {
  if (user) window.location.replace("admin.html");
});

document.getElementById("login-form")
  .addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const pw    = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, pw)
      .then(() => { window.location.replace("admin.html"); })
      .catch(err => alert("Hiba: " + err.message));
});