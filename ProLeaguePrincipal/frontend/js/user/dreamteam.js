import { db, auth } from "../config/firebase-config.js";
import { API_BASE_URL } from "../config/config.js";
import { doc, getDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let currentUser = null;
let currentLeague = "NBA";
let currentPos = null;
let dreamTeamNBA = { PG: null, SG: null, SF: null, PF: null, C: null };
let dreamTeamNFL = { QB: null, RB: null, WR1: null, WR2: null, TE: null };

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

searchBtn.onclick = async () => {
    if (!currentPos) return alert("Selecciona primero una posición en el campo.");
    const query = searchInput.value.trim();
    if (query.length < 3) return;

    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="loader"></i>';

    try {
        const path = CONFIG[currentLeague].apiPath;
        const res = await fetch(`${API_BASE_URL}/api/${path}/players?search=${query}`);
        const players = await res.json();

        resultsList.innerHTML = "";
        if (Array.isArray(players)) {
            players.slice(0, 6).forEach(p => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <span>${p.first_name} ${p.last_name}</span>
                    <small>${p.team.abbreviation}</small>
                `;
                li.onclick = () => {
                    const team = currentLeague === "NBA" ? dreamTeamNBA : dreamTeamNFL;
                    team[currentPos] = p;
                    renderField();
                    resultsList.innerHTML = "";
                    searchInput.value = "";
                };
                resultsList.appendChild(li);
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "BUSCAR";
    }
};

saveBtn.onclick = async () => {
    try {
        saveBtn.disabled = true;
        await updateDoc(doc(db, "users", currentUser.uid), {
            dreamTeamNBA,
            dreamTeamNFL
        });
        alert("¡Equipos guardados correctamente!");
    } catch (e) {
        alert("Error al guardar.");
    } finally {
        saveBtn.disabled = false;
    }
};
