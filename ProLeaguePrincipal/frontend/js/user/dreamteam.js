import { db, auth } from "../config/firebase-config.js";
import { API_BASE_URL } from "../config/config.js";
import { doc, getDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { showToast } from "../utils/toast.js";

let currentUser = null;
let currentLeague = "NBA";
let currentPos = null;
let dreamTeamNBA = { PG: null, SG: null, SF: null, PF: null, C: null };
let dreamTeamNFL = { QB: null, RB: null, WR1: null, WR2: null, TE: null };

// Registro de cambios sin guardar [QoL-01]
let isDirty = false;
window.addEventListener("beforeunload", (e) => {
    if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
    }
});

const sportField = document.getElementById("sport-field");
const selectorTitle = document.getElementById("selector-title");
const searchInput = document.getElementById("dt-search-input");
const searchBtn = document.getElementById("dt-search-btn");
const resultsList = document.getElementById("dt-results");
const saveBtn = document.getElementById("save-dreamteam");
const leagueBtns = document.querySelectorAll(".tab-btn");

const CONFIG = {
    NBA: {
        fieldClass: "basketball-court",
        positions: ["PG", "SG", "SF", "PF", "C"],
        posNames: { PG: "Base (PG)", SG: "Escolta (SG)", SF: "Alero (SF)", PF: "Ala-Pívot (PF)", C: "Pívot (C)" },
        apiPath: "nba",
        teamKey: "dreamTeamNBA"
    },
    NFL: {
        fieldClass: "football-field",
        positions: ["QB", "RB", "WR1", "WR2", "TE"],
        posNames: { QB: "Quarterback", RB: "Running Back", WR1: "Wide Receiver 1", WR2: "Wide Receiver 2", TE: "Tight End" },
        apiPath: "nfl",
        teamKey: "dreamTeamNFL"
    }
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await loadTeams();
        initUI();
    } else {
        window.location.href = "../auth/login.html";
    }
});

async function loadTeams() {
    const docSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.dreamTeamNBA) dreamTeamNBA = data.dreamTeamNBA;
        if (data.dreamTeamNFL) dreamTeamNFL = data.dreamTeamNFL;
        // Migración si solo existía dreamTeam (era solo NBA)
        if (data.dreamTeam && !data.dreamTeamNBA) dreamTeamNBA = data.dreamTeam;
    }
}

function initUI() {
    leagueBtns.forEach(btn => {
        btn.onclick = () => {
            leagueBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentLeague = btn.getAttribute("data-league");
            renderField();
        };
    });
    renderField();
    loadTrendingSuggestions();
}

async function loadTrendingSuggestions() {
    const suggestionContainer = document.getElementById("trending-suggestions");
    if (!suggestionContainer) return;
    
    suggestionContainer.innerHTML = "<p style='font-size:0.8rem; color:#94a3b8;'>Cargando sugerencias...</p>";

    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const counts = {};
        const teamKey = CONFIG[currentLeague].teamKey;

        usersSnapshot.forEach(doc => {
            const team = doc.data()[teamKey];
            if (team) {
                Object.values(team).forEach(p => {
                    if (p && p.last_name) {
                        const name = `${p.first_name} ${p.last_name}`;
                        counts[name] = (counts[name] || 0) + 1;
                    }
                });
            }
        });

        const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 4);
        
        suggestionContainer.innerHTML = "";
        if (sorted.length > 0) {
            const hint = document.createElement("span");
            hint.style.width = "100%";
            hint.style.textAlign = "center";
            hint.style.fontSize = "0.75rem";
            hint.style.color = "#94a3b8";
            hint.style.marginBottom = "5px";
            hint.textContent = "🔥 POPULARES:";
            suggestionContainer.appendChild(hint);

            sorted.forEach(([name]) => {
                const chip = document.createElement("div");
                chip.className = "suggestion-chip";
                chip.textContent = name;
                chip.onclick = () => {
                    searchInput.value = name;
                    searchBtn.click();
                };
                suggestionContainer.appendChild(chip);
            });
        }
    } catch (e) {
        suggestionContainer.innerHTML = "";
    }
}

function renderField() {
    const conf = CONFIG[currentLeague];
    sportField.className = conf.fieldClass;
    sportField.innerHTML = "";
    
    conf.positions.forEach(pos => {
        const team = currentLeague === "NBA" ? dreamTeamNBA : dreamTeamNFL;
        const player = team[pos];
        
        const slot = document.createElement("div");
        slot.className = "player-slot";
        slot.setAttribute("data-pos", pos);
        if (currentPos === pos) slot.classList.add("active");

        slot.innerHTML = `
            <div class="slot-circle">${pos.substring(0, 2)}</div>
            <div class="player-info">${player ? player.last_name : "Vacio"}</div>
        `;
        
        slot.onclick = () => {
            currentPos = pos;
            selectorTitle.textContent = `Seleccionando ${conf.posNames[pos]}`;
            renderField(); // Re-render to show active
        };
        
        sportField.appendChild(slot);
    });
}


let searchDebounce;
searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    clearTimeout(searchDebounce);
    
    if (query.length === 0) {
        resultsList.innerHTML = "";
        return;
    }
    
    if (query.length < 3) return;

    searchDebounce = setTimeout(() => {
        performSearch(query);
    }, 800); // Aumentamos a 800ms para ser más conservadores con la API
});

searchBtn.onclick = () => performSearch(searchInput.value.trim());

async function performSearch(query) {
    if (!currentPos) return showToast("Selecciona primero una posición en el campo.", "warning");
    if (!query || query.length < 3) return;

    // Bloquear UI para evitar spam
    searchBtn.disabled = true;
    const originalBtnText = searchBtn.textContent;
    searchBtn.textContent = "...";

    // Mostrar Skeletons
    resultsList.innerHTML = "";
    for (let i = 0; i < 3; i++) {
        const skel = document.createElement("li");
        skel.className = "skeleton";
        skel.style.height = "45px";
        skel.style.marginBottom = "8px";
        skel.style.borderRadius = "8px";
        resultsList.appendChild(skel);
    }

    try {
        const path = CONFIG[currentLeague].apiPath;
        const res = await fetch(`${API_BASE_URL}/api/${path}/players?search=${query}`);
        const players = await res.json();

        resultsList.innerHTML = "";
        if (Array.isArray(players) && players.length > 0) {
            players.slice(0, 6).forEach(p => {
                const li = document.createElement("li");
                li.className = "search-result-item";
                li.innerHTML = `
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:700;">${p.first_name} ${p.last_name}</span>
                        <small style="opacity:0.7;">${p.team.full_name}</small>
                    </div>
                    <span class="add-player-icon">+</span>
                `;
                li.onclick = () => {
                    const team = currentLeague === "NBA" ? dreamTeamNBA : dreamTeamNFL;
                    team[currentPos] = p;
                    isDirty = true; 
                    renderField();
                    resultsList.innerHTML = "";
                    searchInput.value = "";
                    showToast(`${p.last_name} añadido al equipo`, "success");
                };
                resultsList.appendChild(li);
            });
        } else {
            resultsList.innerHTML = `
                <div style="text-align:center; padding:15px; opacity:0.7;">
                    <p style="font-size:0.9rem; margin-bottom:5px;">No se encontraron jugadores.</p>
                    <small style="font-size:0.75rem; color:var(--primary-color);">La API podría estar saturada, reintenta en unos segundos.</small>
                </div>
            `;
        }
    } catch (e) {
        console.error(e);
        resultsList.innerHTML = "<p style='color:red; text-align:center;'>Error en la búsqueda.</p>";
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = originalBtnText;
    }
}



saveBtn.onclick = async () => {
    try {
        saveBtn.disabled = true;
        await updateDoc(doc(db, "users", currentUser.uid), {
            dreamTeamNBA,
            dreamTeamNFL
        });
        isDirty = false; // Guardado con éxito [QoL-01]
        showToast("¡Equipos guardados correctamente!", "success");
    } catch (e) {
        showToast("Error al guardar.", "error");
    } finally {
        saveBtn.disabled = false;
    }
};
