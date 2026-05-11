import { API_BASE_URL } from "../config/config.js";
import { auth } from "../config/firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { showToast } from "../utils/toast.js";

// =======================
// SI YA ESTÁ LOGUEADO
// =======================
const existingUser = JSON.parse(localStorage.getItem("user"));
if (existingUser) {
  window.location.href = "../home/home.html";
}

// =======================
// FORMULARIO DE REGISTRO
// =======================
const form = document.getElementById("register-form");
const errorEl = document.getElementById("register-error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("register-username").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();

  if (!username || !email || !password) {
    errorEl.textContent = "Todos los campos son obligatorios";
    return;
  }

  try {
    // 1. Registro en el Backend (Node.js)
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || "Error creando la cuenta";
      return;
    }

    // 2. Registro en Firebase (para las reglas de seguridad)
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Usuario creado en Firebase Auth");
    } catch (fbErr) {
      console.warn("Error secundario en Firebase Auth:", fbErr.message);
      // Nota: Si el usuario ya existe en Firebase pero no en tu DB, 
      // esto dará error, pero el flujo principal sigue.
    }

    showToast("Cuenta creada correctamente. Ahora puedes iniciar sesión.", "success");
    
    setTimeout(() => {
      window.location.href = "../auth/login.html";
    }, 2000);

  } catch (err) {
    console.error(err);
    errorEl.textContent = "Error conectando con el servidor";
  }
});
