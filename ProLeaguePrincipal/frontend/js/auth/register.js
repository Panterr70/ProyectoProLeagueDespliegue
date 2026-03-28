// =======================
// SI YA ESTÁ LOGUEADO
// =======================
const existingUser = JSON.parse(localStorage.getItem("user"));
if (existingUser) {
  // Redirigir al home si ya está logueado
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
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || "Error creando la cuenta";
      return;
    }

    alert("Cuenta creada correctamente. Ahora puedes iniciar sesión.");
    window.location.href = "../auth/login.html"; // redirige al login

  } catch (err) {
    console.error(err);
    errorEl.textContent = "Error conectando con el servidor";
  }
});
