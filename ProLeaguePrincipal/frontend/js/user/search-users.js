import { db } from "../config/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const searchInput = document.getElementById("user-search-input");
const searchBtn = document.getElementById("user-search-btn");
const resultsGrid = document.getElementById("user-results-grid");

// Obtener el ID del usuario actual para no mostrarlo
const currentUser = JSON.parse(localStorage.getItem("user"));
const currentUserId = currentUser ? currentUser.uid : null;


searchBtn.onclick = async () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    searchBtn.disabled = true;
    searchBtn.textContent = "...";

    try {
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        
        // Filtrado dinámico: encuentra cualquier coincidencia en el nombre
        renderUsers(querySnapshot, searchTerm);
    } catch (err) {
        console.error("Error buscando usuarios:", err);
        resultsGrid.innerHTML = `<div class="empty-state"><p>Error al conectar con la comunidad.</p></div>`;
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "BUSCAR";
    }
};

async function init() {
    try {
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        // Mostramos todos (o los primeros) pero sin filtro de término
        renderUsers(querySnapshot, "");
    } catch (err) {
        console.error("Error cargando usuarios iniciales:", err);
    }
}

init();

function renderUsers(snapshot, searchTerm = "") {
    const placeholder = document.getElementById("search-placeholder");
    resultsGrid.innerHTML = "";
    
    let matchCount = 0;

    snapshot.forEach((doc) => {
        const data = doc.data();
        const userId = doc.id;
        
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
            ? (data.avatar.startsWith('http') ? data.avatar : `http://localhost:3000${data.avatar}`)
            : `https://ui-avatars.com/api/?name=${data.username}&background=random`;

        card.innerHTML = `
            <div class="user-card-header">
                <img src="${avatarUrl}" alt="Avatar" class="user-card-avatar">
            </div>
            <div class="user-card-body">
                <h4>${data.username}</h4>
                <p class="user-card-bio">${data.bio ? (data.bio.substring(0, 50) + "...") : "Fan de ProLeague"}</p>
                <div class="user-card-stats">
                    <span>🏀 ${data.dreamTeamNBA ? 'Con equipo' : 'Sin NBA'}</span>
                    <span>🏈 ${data.dreamTeamNFL ? 'Con equipo' : 'Sin NFL'}</span>
                </div>
                <a href="public-profile.html?id=${userId}" class="btn-secondary">VER PERFIL</a>
            </div>
        `;
        resultsGrid.appendChild(card);
    });

    if (matchCount === 0) {
        if (placeholder) placeholder.style.display = "block";
        resultsGrid.innerHTML = '<div class="empty-state"><p>No se encontraron usuarios con ese nombre.</p></div>';
    } else {
        if (placeholder) placeholder.style.display = "none";
    }
}
