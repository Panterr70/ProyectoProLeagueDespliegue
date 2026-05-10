import { auth } from "../config/firebase-config.js";

/**
 * Inicializa toda la lógica del header después de que se haya insertado en el DOM.
 */
export function initHeaderLogic() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('nav-menu');
  const userContainer = document.getElementById('user-menu-container');
  const userInitials = document.getElementById('user-initials');
  const userName = document.getElementById('user-nav-name');
  const logoutBtn = document.getElementById('nav-logout-btn');
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  // 1. Lógica de Menú Móvil
  if(menuBtn && menu) {
    menuBtn.onclick = () => {
      menu.classList.toggle('active');
      menuBtn.classList.toggle('active');
    };
  }

  // 2. Lógica de Sesión de Usuario
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && userContainer) {
    userContainer.style.display = 'block';
    const name = user.username || user.displayName || 'Usuario';
    if (userName) userName.textContent = name;
    if (userInitials) userInitials.textContent = name.charAt(0).toUpperCase();
  }

  // 3. Logout
  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem('user');
      auth.signOut().then(() => {
        window.location.href = "../auth/login.html";
      });
    };
  }

  // Cerrar menú al clickar fuera
  document.addEventListener('click', (e) => {
    if(menu && !menu.contains(e.target) && !menuBtn.contains(e.target) && menu.classList.contains('active')) {
      menu.classList.remove('active');
      menuBtn.classList.remove('active');
    }
  });
}

