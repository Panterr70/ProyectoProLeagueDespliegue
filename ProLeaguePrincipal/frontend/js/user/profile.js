import { auth, db } from "../config/firebase-config.js";
import { API_BASE_URL } from "../config/config.js";
import { nbaLogos, nflLogos } from "../config/logos-config.js";
import { updateProfile, updatePassword, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from "../utils/toast.js";

// Variable para rastrear cambios sin guardar [QoL-01]
let isDirty = false;
const markDirty = () => { isDirty = true; };

// Interceptar navegación interna para mostrar modal bonito [WOW]
document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link && isDirty) {
        const targetUrl = link.href;
        // Solo si es navegación a otra página de nuestra web y no es un hash o javascript
        if (targetUrl && !targetUrl.includes("#") && !targetUrl.startsWith("javascript:") && !targetUrl.includes("mailto:")) {
            e.preventDefault();
            const modal = document.getElementById("exit-modal");
            if (modal) {
                modal.style.display = "flex";
                
                const confirmBtn = document.getElementById("confirm-exit");
                const cancelBtn = document.getElementById("cancel-exit");
                
                confirmBtn.onclick = () => {
                    isDirty = false; // Reset dirty para permitir salir
                    window.location.href = targetUrl;
                };
                
                cancelBtn.onclick = () => {
                    modal.style.display = "none";
                };
            }
        }
    }
});

// ===== CARGAR USUARIO =====
let user = JSON.parse(localStorage.getItem("user"));
if (!user || (!user.uid && !user.id)) {
  window.location.href = "../auth/login.html";
}

// Función para refrescar los datos del perfil desde Firestore
async function loadUserProfile() {
  onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      const uid = firebaseUser ? firebaseUser.uid : (user.uid || user.id);
      if (!uid) {
        window.location.href = "../auth/login.html";
        return;
      }

      const userDoc = await getDoc(doc(db, "users", uid));
      
      if (!userDoc.exists()) {
        mostrarDatosPerfil(user);
        return;
      }
      
      const userData = userDoc.data();
      user = { ...user, ...userData };
      localStorage.setItem("user", JSON.stringify(user));
      mostrarDatosPerfil(user);

    } catch (err) {
      console.error("Error en loadUserProfile:", err);
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

  // NBA Mini Grid
  if (userData.dreamTeamNBA) {
    for (const pos in userData.dreamTeamNBA) {
      const el = document.getElementById(`nba-${pos}`);
      if (el && userData.dreamTeamNBA[pos]) {
        const p = userData.dreamTeamNBA[pos];
        el.textContent = `${p.first_name.charAt(0)}. ${p.last_name}`;
      }
    }
  }

  // NFL Mini Grid
  if (userData.dreamTeamNFL) {
    for (const pos in userData.dreamTeamNFL) {
      const el = document.getElementById(`nfl-${pos}`);
      if (el && userData.dreamTeamNFL[pos]) {
        const p = userData.dreamTeamNFL[pos];
        el.textContent = `${p.first_name.charAt(0)}. ${p.last_name}`;
      }
    }
  }

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
    const logo = fav.league === "NBA" ? nbaLogos[fav.teamName] : nflLogos[fav.teamName];
    const logoUrl = logo ? `../../logos/${logo}` : `../../logos/logo-png.png`;
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

// Detectar cambios
document.getElementById("profile-bio").addEventListener("input", markDirty);
document.getElementById("new-username").addEventListener("input", markDirty);
document.getElementById("new-password").addEventListener("input", markDirty);
document.getElementById("current-password")?.addEventListener("input", markDirty);

// Imagen Avatar
document.getElementById("avatar-input").addEventListener("change", () => {
  const file = document.getElementById("avatar-input").files[0];
  if (file) {
    document.getElementById("profile-img").src = URL.createObjectURL(file);
    markDirty();
  }
});

// Guardar Bio y Avatar
document.getElementById("save-profile").addEventListener("click", async () => {
  const bio = document.getElementById("profile-bio").value;
  const avatarInput = document.getElementById("avatar-input");
  const uid = user.uid || user.id;
  let avatarUrl = user.avatar || null;

  try {
    showToast("Guardando cambios...", 'info', 1500);
    if (avatarInput.files && avatarInput.files[0]) {
      const formData = new FormData();
      formData.append("avatar", avatarInput.files[0]);
      const upRes = await fetch(`${API_BASE_URL}/api/auth/upload-avatar/${uid}`, { method: "POST", body: formData });
      const upData = await upRes.json();
      
      // Cache busting: añadir un timestamp para que el navegador no use la imagen vieja
      avatarUrl = `${upData.avatarUrl}?t=${Date.now()}`;
      user.avatar = avatarUrl;
    }

    await updateDoc(doc(db, "users", uid), { bio, avatar: avatarUrl });
    user.bio = bio;
    user.avatar = avatarUrl; // Asegurar que el objeto local tiene la nueva URL
    
    localStorage.setItem("user", JSON.stringify(user));
    
    // Forzar refresco visual de la imagen
    document.getElementById("profile-img").src = avatarUrl.startsWith('http') 
        ? avatarUrl 
        : `${API_BASE_URL}${avatarUrl}`;

    isDirty = false;
    showToast("Perfil actualizado correctamente", 'success');
  } catch (err) {
    console.error("Error al guardar perfil:", err);
    showToast("Error al actualizar perfil", 'error');
  }
});

// ===== CAMBIAR CREDENCIALES (RE-AUTH) =====
document.getElementById("change-credentials").addEventListener("click", async () => {
  const currentPassword = document.getElementById("current-password").value;
  const newUsername = document.getElementById("new-username").value.trim();
  const newPassword = document.getElementById("new-password").value.trim();

  if (!currentPassword) {
    showToast("Introduce tu contraseña actual para confirmar", 'warning');
    return;
  }
  if (!newUsername && !newPassword) {
    showToast("No has introducido ningún cambio", 'info');
    return;
  }

  try {
    showToast("Verificando seguridad...", 'info', 2000);
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("No hay usuario autenticado");

    // 1. RE-AUTENTICAR (Imprescindible para seguridad)
    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);

    const uid = firebaseUser.uid;

    // 2. CAMBIAR USERNAME
    if (newUsername) {
      await updateDoc(doc(db, "users", uid), { username: newUsername });
      await updateProfile(firebaseUser, { displayName: newUsername });
      user.username = newUsername;
      document.getElementById("profile-username").textContent = newUsername;
    }

    // 3. CAMBIAR PASSWORD
    if (newPassword) {
      await updatePassword(firebaseUser, newPassword);
    }

    localStorage.setItem("user", JSON.stringify(user));
    isDirty = false;
    
    // Limpiar campos
    document.getElementById("current-password").value = "";
    document.getElementById("new-username").value = "";
    document.getElementById("new-password").value = "";
    
    showToast("¡Credenciales actualizadas con éxito!", 'success');

  } catch (err) {
    console.error(err);
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      showToast("La contraseña actual es incorrecta", 'error');
    } else if (err.code === 'auth/weak-password') {
      showToast("La nueva contraseña es muy débil", 'warning');
    } else {
      showToast("Error de seguridad: " + err.message, 'error');
    }
  }
});

// Prevenir salida (browser default as backup)
window.addEventListener("beforeunload", (e) => {
  if (isDirty) { e.preventDefault(); e.returnValue = ""; }
});
