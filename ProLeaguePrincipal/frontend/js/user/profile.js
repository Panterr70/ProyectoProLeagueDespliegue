import { auth, db } from "../config/firebase-config.js";
import { API_BASE_URL } from "../config/config.js";
import { updateProfile, updatePassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ===== TOAST UTILITY =====
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]||'📢'}</span><span class="toast-message">${message}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-visible')));
  setTimeout(() => { toast.classList.remove('toast-visible'); toast.classList.add('toast-hiding'); setTimeout(() => toast.remove(), 400); }, duration);
}

// ===== CARGAR USUARIO =====
let user = JSON.parse(localStorage.getItem("user"));
if (!user || (!user.uid && !user.id)) {
  window.location.href = "../auth/login.html";
}

// Función para refrescar los datos del perfil desde Firestore
async function loadUserProfile() {
  // Esperar a que Firebase Auth esté listo para evitar errores de permisos
  onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      const uid = firebaseUser ? firebaseUser.uid : (user.uid || user.id);
      if (!uid) {
        window.location.href = "../auth/login.html";
        return;
      }

      const userDoc = await getDoc(doc(db, "users", uid));
      
      if (!userDoc.exists()) {
        console.warn("El documento del usuario no existe en Firestore.");
        // Si no existe, al menos mostramos lo del localStorage
        mostrarDatosPerfil(user);
        return;
      }
      
      const userData = userDoc.data();
      user = { ...user, ...userData };
      localStorage.setItem("user", JSON.stringify(user));
      mostrarDatosPerfil(user);

    } catch (err) {
      console.error("Error en loadUserProfile:", err);
      if (err.code === 'permission-denied') {
        showToast("Error de permisos en Firebase. Revisa las reglas de Firestore.", 'error');
      } else {
        showToast("Error cargando perfil", 'error');
      }
    }
  });
}

function mostrarDatosPerfil(userData) {
  document.getElementById("profile-username").textContent = userData.username || "Usuario";
  document.getElementById("profile-email").textContent = userData.email || "email@email.com";
  document.getElementById("profile-bio").value = userData.bio || "";

  const avatarBase = userData.username || "User";
  document.getElementById("profile-img").src = userData.avatar
    ? (userData.avatar.startsWith('http') ? userData.avatar : `${API_BASE_URL}${userData.avatar}`)
    : `https://ui-avatars.com/api/?name=${avatarBase}&background=random`;

  // Mostrar Quinteto NBA
  if (userData.dreamTeamNBA) {
    for (const pos in userData.dreamTeamNBA) {
      const el = document.getElementById(`nba-${pos}`);
      if (el && userData.dreamTeamNBA[pos]) {
        const p = userData.dreamTeamNBA[pos];
        el.textContent = `${p.first_name.charAt(0)}. ${p.last_name}`;
      }
    }
  }

  // Mostrar Ofensiva NFL
  if (userData.dreamTeamNFL) {
    for (const pos in userData.dreamTeamNFL) {
      const el = document.getElementById(`nfl-${pos}`);
      if (el && userData.dreamTeamNFL[pos]) {
        const p = userData.dreamTeamNFL[pos];
        el.textContent = `${p.first_name.charAt(0)}. ${p.last_name}`;
      }
    }
  }

  // Mostrar Favoritos
  renderFavoritos(userData.favorites || []);
}

function renderFavoritos(favorites) {
  const container = document.getElementById("favorites-container");
  if (!container) return;
  container.innerHTML = "";

  if (favorites.length === 0) {
    container.innerHTML = "<p style='color: #94a3b8; font-size: 0.9rem;'>Aún no tienes equipos favoritos.</p>";
    return;
  }

  favorites.forEach(fav => {
    const logoUrl = fav.logo || `../../logos/logo-png.png`;
    const favItem = document.createElement("div");
    favItem.className = "fav-item-mini";
    favItem.innerHTML = `
        <img src="${logoUrl}" alt="${fav.teamName}" class="fav-mini-logo" title="${fav.teamName}" onerror="this.src='../../logos/logo-png.png'">
        <span style="font-size: 0.6rem; color: #fff; margin-top: 5px; text-align:center;">${fav.teamName}</span>
    `;
    container.appendChild(favItem);
  });
}
loadUserProfile();

// ===== HEADER / FOOTER =====
async function loadHeaderFooter() {
  try {
    const headerHtml = await fetch("../components/header.html").then(r => r.text());
    document.getElementById("header-placeholder").innerHTML = headerHtml;

    const navProfile = document.getElementById("nav-profile");
    const navLogout = document.getElementById("nav-logout");

    if (user) {
      if (navProfile) navProfile.style.display = "inline";
      if (navLogout) navLogout.style.display = "inline";
    }

    if (navLogout) {
      navLogout.addEventListener("click", e => {
        e.preventDefault();
        auth.signOut();
        localStorage.removeItem("user");
        window.location.href = "../auth/login.html";
      });
    }

    // Lógica de Menú Móvil
    const menuBtn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('nav-menu');
    if(menuBtn && menu) {
      menuBtn.onclick = () => {
        menu.classList.toggle('active');
        menuBtn.classList.toggle('active');
      };
    }

    const footerHtml = await fetch("../components/footer.html").then(r => r.text());
    document.getElementById("footer-placeholder").innerHTML = footerHtml;
  } catch (err) {
    console.error("Error cargando header/footer:", err);
  }
}
loadHeaderFooter();

// ===== VISTA PREVIA AVATAR =====
document.getElementById("avatar-input").addEventListener("change", () => {
  const file = document.getElementById("avatar-input").files[0];
  if (file) {
    document.getElementById("profile-img").src = URL.createObjectURL(file);
  }
});

// ===== GUARDAR PERFIL (BIO + AVATAR) =====
document.getElementById("save-profile").addEventListener("click", async () => {
  const bio = document.getElementById("profile-bio").value;
  const avatarInput = document.getElementById("avatar-input");
  const uid = user.uid || user.id;
  let avatarUrl = user.avatar || null;

  try {
    // 1. Si hay una nueva imagen, subirla al backend local
    if (avatarInput.files && avatarInput.files[0]) {
      const formData = new FormData();
      formData.append("avatar", avatarInput.files[0]);

      const upRes = await fetch(`${API_BASE_URL}/api/auth/upload-avatar/${uid}`, {
        method: "POST",
        body: formData
      });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || "Error subiendo avatar");
      
      avatarUrl = upData.avatarUrl; // URL relativa del servidor local
      user.avatar = avatarUrl;
    }

    // 2. Actualizar Firestore con la BIO y la nueva URL del avatar
    await updateDoc(doc(db, "users", uid), { 
      bio: bio,
      avatar: avatarUrl 
    });
    
    user.bio = bio;
    localStorage.setItem("user", JSON.stringify(user));
    
    // Actualizar vista
    document.getElementById("profile-img").src = avatarUrl.startsWith('http') 
        ? avatarUrl 
        : `${API_BASE_URL}${avatarUrl}`;
    
    showToast("¡Perfil actualizado con éxito!", 'success');
  } catch (err) {
    console.error(err);
    showToast("Error actualizando perfil", 'error');
  }
});

// ===== CAMBIAR CREDENCIALES =====
document.getElementById("change-credentials").addEventListener("click", async () => {
  const newUsername = document.getElementById("new-username").value.trim();
  const newPassword = document.getElementById("new-password").value.trim();

  if (!newUsername && !newPassword) {
    showToast("Introduce al menos un cambio", 'warning');
    return;
  }

  try {
    const uid = user.uid || user.id;
    
    if (newUsername) {
      // 1. Firestore
      await updateDoc(doc(db, "users", uid), { username: newUsername });
      // 2. Auth Profile
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: newUsername });
      
      user.username = newUsername;
      document.getElementById("profile-username").textContent = newUsername;
    }

    if (newPassword && auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword);
    }

    localStorage.setItem("user", JSON.stringify(user));
    showToast("Credenciales actualizadas", 'success');

  } catch (err) {
    console.error(err);
    if (err.code === 'auth/requires-recent-login') {
      showToast("Por seguridad, vuelve a iniciar sesión para cambiar la contraseña", 'warning');
    } else {
      showToast("Error actualizando credenciales", 'error');
    }
  }
});
