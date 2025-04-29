// js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth }           from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase }       from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "…IDE_KÉRD_AZ_OWN_API_KEY…",
  authDomain: "…IDE_KÉRD_AZ_OWN_AUTH_DOMAIN…",
  databaseURL: "…IDE_KÉRD_AZ_OWN_DATABASE_URL…",
  projectId: "…IDE_KÉRD_AZ_OWN_PROJECT_ID…",
  storageBucket: "…IDE_KÉRD_AZ_OWN_STORAGE_BUCKET…",
  messagingSenderId: "…IDE_KÉRD_AZ_OWN_MESSAGING_SENDER_ID…",
  appId: "…IDE_KÉRD_AZ_OWN_APP_ID…"
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getDatabase(app);