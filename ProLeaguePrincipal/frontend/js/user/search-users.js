import { db } from "../config/firebase-config.js";
import { API_BASE_URL } from "../config/config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


const searchInput = document.getElementById("user-search-input");
const searchBtn = document.getElementById("user-search-btn");
const resultsGrid = document.getElementById("user-results-grid");

let allUsersCache = []; // Cache para filtrado en vivo

// Obtener el ID del usuario actual para no mostrarlo
const currentUser = JSON.parse(localStorage.getItem("user"));
const currentUserId = currentUser ? currentUser.uid : null;

// Filtrado en vivo (Real-time Filtering)
searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();
    renderUsers(allUsersCache, searchTerm);
});

// El botón de buscar ahora solo fuerza una recarga de datos de Firebase si se desea
searchBtn.onclick = async () => {
    await fetchAndCacheUsers();
};

async function fetchAndCacheUsers() {
    const placeholder = document.getElementById("search-placeholder");
    
    // Mostrar Skeletons mientras carga
    showSkeletons();
    
    try {
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        
        allUsersCache = [];
        querySnapshot.forEach(doc => {
            allUsersCache.push({ id: doc.id, ...doc.data() });
        });

        renderUsers(allUsersCache, searchInput.value.trim().toLowerCase());
    } catch (err) {
        console.error("Error buscando usuarios:", err);
        resultsGrid.innerHTML = `<div class="empty-state"><p>Error al conectar con la comunidad.</p></div>`;
    }
}

function showSkeletons() {
    resultsGrid.innerHTML = "";
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement("div");
        skeleton.className = "user-card-social skeleton";
        skeleton.style.height = "280px";
        resultsGrid.appendChild(skeleton);
    }
}

async function init() {
    await fetchAndCacheUsers();
}

init();

function renderUsers(users, searchTerm = "") {
    const placeholder = document.getElementById("search-placeholder");
    resultsGrid.innerHTML = "";
    
    let matchCount = 0;

    users.forEach((data) => {
        const userId = data.id;
        
        // Evitar mostrarse a uno mismo
        if (userId === currentUserId) return;

        // Búsqueda súper flexible (busca en nombre y email)
        if (searchTerm) {
            const username = (data.username || "").toLowerCase();
            const email = (data.email || "").toLowerCase();
            if (!username.includes(searchTerm) && !email.includes(searchTerm)) {
                return;
            }
        }

        matchCount++;
        
        const card = document.createElement("div");
        card.className = "user-card-social";
        
        const avatarUrl = data.avatar 
            ? (data.avatar.startsWith('http') ? data.avatar : `${API_BASE_URL}${data.avatar}`)
            : `https://ui-avatars.com/api/?name=${data.username}&background=random`;

        card.innerHTML = `
            <div class="user-card-header">
                <img src="${avatarUrl}" alt="Avatar" class="user-card-avatar">
            </div>
            <div class="user-card-body">
                <div style="display:flex; align-items:center; justify-content:center; gap:5px;">
                    <h4>${data.username}</h4>
                    <button class="copy-btn-mini" data-copy="${data.username}" title="Copiar nombre">
                        📋
                    </button>
                </div>
                <p class="user-card-bio">${data.bio ? (data.bio.substring(0, 50) + "...") : "Fan de ProLeague"}</p>
                <div class="user-card-stats">
                    <span>🏀 ${data.dreamTeamNBA ? 'Con equipo' : 'Sin NBA'}</span>
                    <span>🏈 ${data.dreamTeamNFL ? 'Con equipo' : 'Sin NFL'}</span>
                </div>
                <a href="public-profile.html?id=${userId}" class="btn-secondary">VER PERFIL</a>
            </div>
        `;

        // Lógica de copiar
        const copyBtn = card.querySelector('.copy-btn-mini');
        copyBtn.onclick = (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(data.username);
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = "✅";
            setTimeout(() => copyBtn.innerHTML = originalText, 1500);
        };

        resultsGrid.appendChild(card);
    });

    if (matchCount === 0) {
        if (placeholder) placeholder.style.display = "block";
        resultsGrid.innerHTML = '<div class="empty-state"><p>No se encontraron usuarios con ese nombre.</p></div>';
    } else {
        if (placeholder) placeholder.style.display = "none";
    }
}

