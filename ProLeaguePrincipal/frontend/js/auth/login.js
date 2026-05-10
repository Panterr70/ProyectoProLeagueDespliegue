import { API_BASE_URL } from "../config/config.js";
import { auth } from "../config/firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const form = document.getElementById("login-form");
const errorEl = document.getElementById("login-error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    // 1. Login en el Backend (Node.js)
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error;
      return;
    }

    // 2. Login en Firebase (para las reglas de seguridad)
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase Auth sincronizado");
    } catch (fbErr) {
      console.warn("Error secundario en Firebase Auth:", fbErr.message);
    }

    // 3. Guardamos usuario en localStorage
    localStorage.setItem("user", JSON.stringify(data.user));

    // 4. Redirigimos a home
    window.location.href = "../home/home.html";
  } catch (err) {
    errorEl.textContent = "Error conectando al servidor";
    console.error(err);
  }
});
