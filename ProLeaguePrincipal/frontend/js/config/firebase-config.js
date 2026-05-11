/**
 * firebase-config.js — Configuración de Firebase
 * 
 * Inicializa Firebase App, Authentication y Cloud Firestore.
 * Se usa en el frontend para:
 * - Autenticación (registro, login, verificación email)
 * - Firestore (perfiles, favoritos, dream teams, chat, interacciones)
 * 
 * @author Andoni Villanueva
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyByQy2d_UWJ-Itkh7L9lnuwnKgKySGWlBc",
  authDomain: "proleague-b1b5c.firebaseapp.com",
  databaseURL: "https://proleague-b1b5c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "proleague-b1b5c",
  storageBucket: "proleague-b1b5c.firebasestorage.app",
  messagingSenderId: "1049407382258",
  appId: "1:1049407382258:web:1bbd3a3e9cc3a4e71e266b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
