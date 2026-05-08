import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../config/firebase-config.js";
import { API_BASE_URL } from "../config/config.js";
import { showToast } from "../utils/toast.js";


const urlParams = new URLSearchParams(window.location.search);
const profileId = urlParams.get('id');

if (!profileId) {
    window.location.href = "search-users.html";
}

let userData = null;
let currentLeague = "NBA";

const publicUsername = document.getElementById("public-username");
const publicBio = document.getElementById("public-bio");
const publicAvatar = document.getElementById("public-avatar");
const sportField = document.getElementById("sport-field");
const leagueBtns = document.querySelectorAll(".tab-btn");

const CONFIG = {
    NBA: {
        fieldClass: "basketball-court",
        positions: ["PG", "SG", "SF", "PF", "C"],
        teamKey: "dreamTeamNBA"
    },
    NFL: {
        fieldClass: "football-field",
        positions: ["QB", "RB", "WR1", "WR2", "TE"],
        teamKey: "dreamTeamNFL"
    }
};

async function init() {
    try {
        const docSnap = await getDoc(doc(db, "users", profileId));
        if (docSnap.exists()) {
            userData = docSnap.data();
            renderProfile();
            initTabs();
        } else {
            showToast("Usuario no encontrado", "error");
            setTimeout(() => {
                window.location.href = "search-users.html";
            }, 2000);
        }
    } catch (err) {
        console.error(err);
    }
}

function renderProfile() {
    publicUsername.textContent = userData.username;
    publicBio.textContent = userData.bio || "Este usuario prefiere mantener el misterio...";
    
    publicAvatar.src = userData.avatar 
        ? (userData.avatar.startsWith('http') ? userData.avatar : `${API_BASE_URL}${userData.avatar}`)
        : `https://ui-avatars.com/api/?name=${userData.username}&background=random`;
    
    renderField();
    renderFavorites();
}

function initTabs() {
    leagueBtns.forEach(btn => {
        btn.onclick = () => {
            leagueBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentLeague = btn.getAttribute("data-league");
            renderField();
        };
    });
}

function renderField() {
    const conf = CONFIG[currentLeague];
    sportField.className = conf.fieldClass;
    sportField.innerHTML = "";
    
    const team = userData[conf.teamKey] || {};
    
    conf.positions.forEach(pos => {
        const player = team[pos];
        const slot = document.createElement("div");
        slot.className = "player-slot no-click";
        slot.setAttribute("data-pos", pos);
        
        slot.innerHTML = `
            <div class="slot-circle">${pos.substring(0, 2)}</div>
            <div class="player-info">${player ? player.last_name : "Vacio"}</div>
        `;
        sportField.appendChild(slot);
    });
}


function renderFavorites() {
    const favContainer = document.getElementById("fav-list");
    if (!favContainer) return;
    
    favContainer.innerHTML = "";
    
    // Si los favoritos están en el nuevo formato (array de objetos) o antiguo (ids)
    const favorites = userData.favorites || [];
    
    if (favorites.length === 0) {
        favContainer.innerHTML = "<p class='no-data'>Este usuario aún no tiene equipos favoritos.</p>";
        return;
    }



    favorites.forEach(fav => {
        const teamName = fav.team_name || fav.name || fav.full_name || "Equipo";
        const logoUrl = fav.logo || fav.logo_url || `../../logos/logo-png.png`;
        
        const favItem = document.createElement("div");
        favItem.className = "fav-item-mini";
        favItem.innerHTML = `
            <img src="${logoUrl}" alt="${teamName}" class="fav-mini-logo" title="${teamName}" onerror="this.src='../../logos/logo-png.png'">
        `;
        favContainer.appendChild(favItem);
    });
}

// Lógica de compartir perfil
const shareBtn = document.getElementById("copy-profile-link");
if (shareBtn) {
    shareBtn.onclick = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            const originalText = shareBtn.innerHTML;
            shareBtn.innerHTML = "✅ ¡Copiado!";
            showToast("Enlace de perfil copiado al portapapeles", "success");
            setTimeout(() => shareBtn.innerHTML = originalText, 2000);
        }).catch(err => {
            console.error("Error al copiar enlace:", err);
            showToast("No se pudo copiar el enlace", "error");
        });
    };
}

init();

