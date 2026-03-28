import { auth, db } from "../config/firebase-config.js";
import { updateProfile, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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
  try {
    const uid = user.uid || user.id;
    const userDoc = await getDoc(doc(db, "users", uid));
    
    if (!userDoc.exists()) throw new Error("No se pudo cargar el perfil");
    
    const userData = userDoc.data();
    // Actualizar variable global y localStorage
    user = { ...user, ...userData };
    localStorage.setItem("user", JSON.stringify(user));

    // Mostrar datos en profile.html
    document.getElementById("profile-username").textContent = user.username || "Usuario";
    document.getElementById("profile-email").textContent = user.email || "email@email.com";
    document.getElementById("profile-bio").value = user.bio || "";

    // Imagen del avatar (por ahora local o default)
    document.getElementById("profile-img").src = user.avatar
      ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:3000${user.avatar}`)
      : "../../images/default-avatar.png";
  } catch (err) {
    console.error(err);
    showToast("Error cargando perfil", 'error');
  }
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

      const upRes = await fetch(`http://localhost:3000/api/auth/upload-avatar/${uid}`, {
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
        : `http://localhost:3000${avatarUrl}`;
    
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
