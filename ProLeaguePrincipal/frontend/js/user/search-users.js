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
const currentUsername = currentUser ? currentUser.username : null;

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
    const seenUsernames = new Set(); // Para evitar duplicados visuales

    users.forEach((data) => {
        const userId = data.id;
        const rawUsername = (data.username || "").trim();
        const cleanName = rawUsername.toLowerCase();
        const userEmail = (data.email || "").toLowerCase();
        
        // 1. FILTRO DE BASURA: No mostrar usuarios sin nombre, "undefined" o muy cortos
        if (!rawUsername || cleanName === "undefined" || rawUsername.length < 3) return;

        // 2. FILTRO DE DUPLICADOS: Si ya hemos mostrado este nombre (en cualquier formato), saltar
        if (seenUsernames.has(cleanName)) {
            return;
        }
        seenUsernames.add(cleanName);

        // 3. FILTRO DE UNO MISMO: (Triple check: ID, Nombre, Email)
        const myName = (currentUsername || "").toLowerCase();
        const myEmail = (currentUser && currentUser.email) ? currentUser.email.toLowerCase() : "";
        const myUid = currentUserId;

        if (userId === myUid || cleanName === myName || (userEmail && userEmail === myEmail)) {
            return;
        }

        // 4. BÚSQUEDA: Filtrado por término
        if (searchTerm) {
            const email = (data.email || "").toLowerCase();
            if (!rawUsername.toLowerCase().includes(searchTerm) && !email.includes(searchTerm)) {
                return;
            }
        }

        matchCount++;
        
        const card = document.createElement("div");
        card.className = "user-card-social";
        
        // Construcción inteligente de la URL del avatar
        let avatarUrl = "";
        if (data.avatar) {
            if (data.avatar.startsWith('http')) {
                avatarUrl = data.avatar;
            } else {
                // Asegurar que empiece por /uploads/
                let path = data.avatar.startsWith('/') ? data.avatar : `/${data.avatar}`;
                if (!path.startsWith('/uploads/')) {
                    path = `/uploads${path}`;
                }
                avatarUrl = `${API_BASE_URL}${path}`;
            }
        } else {
            avatarUrl = `https://ui-avatars.com/api/?name=${rawUsername}&background=random&color=fff`;
        }

        card.innerHTML = `
            <div class="user-card-header">
                <img src="${avatarUrl}" 
                     alt="Avatar" 
                     class="user-card-avatar" 
                     onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${rawUsername}&background=random&color=fff'">
            </div>
            <div class="user-card-body">
                <div style="display:flex; align-items:center; justify-content:center; gap:5px;">
                    <h4>${rawUsername}</h4>
                    <button class="copy-btn-mini" data-copy="${rawUsername}" title="Copiar nombre">
                        <span class="material-icons" style="font-size: 14px;">content_copy</span>
                    </button>
                </div>
                <p class="user-card-bio">${data.bio ? (data.bio.substring(0, 50) + "...") : "Fan de ProLeague"}</p>
                <div class="user-card-stats">
                    <span><span class="material-icons" style="font-size: 14px; vertical-align: middle; color: #ff8c00;">sports_basketball</span> ${data.dreamTeamNBA ? 'Con equipo' : 'Sin NBA'}</span>
                    <span><span class="material-icons" style="font-size: 14px; vertical-align: middle; color: #5271ff;">sports_football</span> ${data.dreamTeamNFL ? 'Con equipo' : 'Sin NFL'}</span>
                </div>
                <a href="public-profile.html?id=${userId}" class="btn-secondary">VER PERFIL</a>
            </div>
        `;

        // Lógica de copiar
        const copyBtn = card.querySelector('.copy-btn-mini');
        copyBtn.onclick = (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(rawUsername);
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="material-icons" style="font-size: 14px; color: #00f2ff;">check_circle</span>';
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

