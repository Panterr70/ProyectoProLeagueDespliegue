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
      card.className = "team-card";
      card.innerHTML = `
        <div class="team-card-inner">
          <div class="team-card-front">
            <img class="team-logo" src="${logoPath}" alt="${fav.teamName}">
            <div class="team-name">${fav.teamName}</div>
            <div class="team-info">Liga: ${fav.league}</div>
            <button class="remove-fav">❌ Quitar</button>
          </div>
        </div>
      `;

      contenedor.appendChild(card);

      card.querySelector(".remove-fav").addEventListener("click", async (e) => {
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
