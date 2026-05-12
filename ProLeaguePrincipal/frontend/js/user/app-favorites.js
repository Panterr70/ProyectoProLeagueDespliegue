import { auth, db } from "../config/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, setDoc, arrayRemove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from "../utils/toast.js";
import { nbaLogos, nflLogos } from "../config/logos-config.js";

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  await loadHeader();
  await loadFooter();

  // Esperar a que Firebase detecte la sesión real
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      cargarFavoritos(firebaseUser.uid);
    } else {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && (user.uid || user.id)) {
        cargarFavoritos(user.uid || user.id);
      } else {
        window.location.href = "../auth/login.html";
      }
    }
  });
});

// ===============================
// HEADER / FOOTER
// ===============================
async function loadHeader() {
  const html = await fetch("../components/header.html").then(r => r.text());
  document.getElementById("header-placeholder").innerHTML = html; 
}

async function loadFooter() {
  const html = await fetch("../components/footer.html").then(r => r.text());
  document.getElementById("footer-placeholder").innerHTML = html;
}

// ===============================
// CARGAR FAVORITOS
// ===============================
async function cargarFavoritos(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const favoritos = userData.favorites || [];

    const contenedor = document.getElementById("favorites-list");
    contenedor.innerHTML = "";

    if (favoritos.length === 0) {
      contenedor.innerHTML = "<p>No tienes favoritos todavía ⭐</p>";
      return;
    }

    favoritos.forEach(fav => {
      const logo =
        fav.league === "NBA"
          ? nbaLogos[fav.teamName]
          : nflLogos[fav.teamName];

      const logoPath = logo
        ? `../../logos/${logo}`
        : "../../logos/default.png";

      const card = document.createElement("div");
      card.className = "fav-team-card";
      card.innerHTML = `
        <div class="fav-card-glow"></div>
        <div class="fav-card-content">
          <div class="fav-league-badge ${fav.league.toLowerCase()}">${fav.league}</div>
          <img class="fav-team-logo" src="${logoPath}" alt="${fav.teamName}">
          <h3 class="fav-team-name">${fav.teamName}</h3>
          <button class="remove-fav-btn" title="Quitar de favoritos">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            Eliminar
          </button>
        </div>
      `;


      contenedor.appendChild(card);

      card.querySelector(".remove-fav-btn").addEventListener("click", async (e) => {

        e.stopPropagation();

        try {
          const userRef = doc(db, "users", uid);
          await updateDoc(userRef, {
            favorites: arrayRemove(fav)
          });

          card.style.transition = "opacity 0.3s, transform 0.3s";
          card.style.opacity = "0";
          card.style.transform = "scale(0.9)";
          setTimeout(() => card.remove(), 300);
          showToast(`${fav.teamName} eliminado de favoritos`, 'info');
        } catch (err) {
          console.error(err);
          showToast("Error al quitar favorito", 'error');
        }
      });
    });

  } catch (err) {
    console.error("❌ Error cargando favoritos:", err);
  }
}
