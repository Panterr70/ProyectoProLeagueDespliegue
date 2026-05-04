const form = document.getElementById("login-form");
const errorEl = document.getElementById("login-error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })  // ⬅ enviar email
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error;
      return;
    }

    // Guardamos usuario en localStorage
    localStorage.setItem("user", JSON.stringify(data.user));

    // Redirigimos a home
    window.location.href = "../home/home.html";
  } catch (err) {
    errorEl.textContent = "Error conectando al servidor";
    console.error(err);
  }
});
