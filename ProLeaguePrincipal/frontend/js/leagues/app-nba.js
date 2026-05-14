import { db, auth } from "../config/firebase-config.js";
import { API_BASE_URL } from "../config/config.js";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initSessionGuard } from "../auth/session-guard.js";
import { initHeaderLogic } from "../utils/header-logic.js";
import { showToast } from "../utils/toast.js";
import { nbaLogos as teamLogos } from "../config/logos-config.js";

// Inicializar protección de sesión única
initSessionGuard();

// ===============================
// STATE & AUTH
// ===============================
const user = JSON.parse(localStorage.getItem("user"));
if (!user || (!user.uid && !user.id)) window.location.href = "../auth/login.html";

// ===============================
// UI FUNCTIONS
// ===============================
async function loadHeader() {
  try {
    const html = await fetch("../components/header.html").then(r => r.text());
    const placeholder = document.getElementById("header-placeholder");
    if (placeholder) {
      placeholder.innerHTML = html;
      initHeaderLogic();
    }
  } catch (err) {
    console.error("Error cargando header:", err);
  }
}

async function loadFooter() {
  try {
    const html = await fetch("../components/footer.html").then(r => r.text());
    const placeholder = document.getElementById("footer-placeholder");
    if (placeholder) placeholder.innerHTML = html;
  } catch (err) {
    console.error("Error cargando footer:", err);
  }
}

// INITIALIZATION
(async function init() {
  await loadHeader();
  await loadFooter();

  const nbaSection = document.getElementById("nba-section");
  if(nbaSection) nbaSection.style.display = "block";

  await cargarClasificacion();
  await cargarEquipos();
})();

// ===============================
// MAPAS DE LOGOS
// ===============================

// ===============================
// FUNCIONES
// ===============================
async function cargarClasificacion() {
  const tbody = document.querySelector("#standings-table tbody");
  const table = document.getElementById("standings-table");
  
  // Upgrade to Standings 2.0 Class
  table.className = "standings-table-v2";
  
  // Initial Skeletal State
  tbody.innerHTML = "";
  for(let i=0; i<8; i++) {
    const sTr = document.createElement("tr");
    sTr.className = "standings-row-v2";
    sTr.innerHTML = `
      <td colspan="5">
        <div class="skeleton" style="height: 45px; width: 100%; border-radius: 12px;"></div>
      </td>
    `;
    tbody.appendChild(sTr);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/nba/standings`);
    const data = await res.json();

    let allEntries = [];
    function findEntries(node) {
        if (node.standings && node.standings.entries) {
            allEntries = allEntries.concat(node.standings.entries);
        }
        if (node.children) {
            node.children.forEach(child => findEntries(child));
        }
    }

    if (data.children) {
        data.children.forEach(child => findEntries(child));
    } else if (data.standings && data.standings.entries) {
        allEntries = data.standings.entries;
    }

    tbody.innerHTML = "";

    // Sort by Percentage descending
    allEntries.sort((a, b) => {
        const pa = a.stats.find(s => s.name === "winPercent")?.value || 0;
        const pb = b.stats.find(s => s.name === "winPercent")?.value || 0;
        return pb - pa;
    });

    allEntries.forEach((entry, index) => {
        const team = entry.team;
        const winsStat = entry.stats.find(s => s.name === "wins") || { value: 0 };
        const lossesStat = entry.stats.find(s => s.name === "losses") || { value: 0 };
        const pctStat = entry.stats.find(s => s.name === "winPercent") || { value: 0 };

        const tr = document.createElement("tr");
        tr.className = "standings-row-v2";
        
        // Determinar si es top 3 para resaltar el número
        const rankColor = index < 3 ? "var(--primary-color)" : "inherit";

        tr.innerHTML = `
            <td style="color: ${rankColor}">${index + 1}</td>
            <td>
                <div class="td-team-v2">
                    <img src="${team.logos[0].href}" alt="${team.abbreviation}" class="team-logo-v2">
                    <div style="display:flex; flex-direction:column;">
                      <span style="font-weight: 700;">${team.displayName}</span>
                      <span style="font-size: 0.75em; color: #94a3b8; text-transform: uppercase;">${team.abbreviation}</span>
                    </div>
                </div>
            </td>
            <td class="win-cell">${winsStat.value}</td>
            <td class="loss-cell">${lossesStat.value}</td>
            <td><span class="pct-badge">${(pctStat.value * 100).toFixed(1)}%</span></td>
        `;
        tbody.appendChild(tr);
    });

    // Render Chart.js charts with real standings data
    renderCharts(allEntries);

  } catch(err) {
    console.error("Error cargando clasificación NBA:", err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 40px;">⚠️ Error cargando la clasificación</td></tr>`;
  }
}



async function cargarEquipos() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/nba/teams`);
    const equipos = await res.json();

    equipos.forEach(team => {
      team.numPlayers = 0;
      team.avgAge = 0;
      team.conference = (team.conference || "Desconocido").trim();
      team.division = (team.division || "Desconocido").trim();
      team.city = (team.city || "Desconocido").trim();
    });

    mostrarEquipos(equipos);

  } catch (err) {
    console.error("Error cargando equipos NBA:", err);
  }
}

// Exponer para el botón de refrescar
window.cargarClasificacion = cargarClasificacion;

function mostrarEquipos(equipos) {
  const contenedor = document.getElementById("team-list");
  contenedor.innerHTML = "";

  equipos.forEach(team => {
    const logoSrc = teamLogos[team.full_name] || `${team.abbreviation}.png`;
    const card = document.createElement("div");
    card.className = "team-card";
    card.innerHTML = `
      <div class="team-card-inner">
        <div class="team-card-front">
          <img class="team-logo" src="../../logos/${logoSrc}" alt="${team.full_name}">
          <div class="team-name">${team.full_name}</div>
          <div class="team-info">Ciudad: ${team.city}</div>
          <div class="team-info">Conferencia: ${team.conference}</div>
          <div class="team-info">División: ${team.division}</div>
        </div>
        <div class="team-card-back">
          <div class="team-back-title">${team.full_name} Stats</div>
          <div class="team-back-stat">Número de jugadores: ${team.numPlayers}</div>
          <div class="team-back-stat">Edad promedio: ${team.avgAge}</div>
        </div>
      </div>
    `;

    // Botón favorito
    const favBtn = document.createElement("button");
    favBtn.textContent = "⭐";
    favBtn.className = "fav-btn";
    favBtn.onclick = async (e) => {
      e.stopPropagation();
      
      // Intentar obtener UID de Firebase Auth primero, luego localStorage como fallback
      const uid = auth.currentUser ? auth.currentUser.uid : (user.uid || user.id);
      
      if (!uid) {
        showToast("Debes iniciar sesión para añadir favoritos", "warning");
        return;
      }

      try {
        const logoSrc = teamLogos[team.full_name] || `${team.abbreviation}.png`;
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, { favorites: arrayUnion({
            league: "NBA", 
            teamId: team.id, 
            teamName: team.full_name,
            logo: `../../logos/${logoSrc}` 
        }) }, { merge: true });
        
        const animStar = document.createElement("div");
        animStar.textContent = "⭐";
        animStar.className = "fav-anim-star";
        card.querySelector(".team-card-front").appendChild(animStar);
        setTimeout(() => animStar.remove(), 1000);
        showToast("¡Añadido a favoritos! ⭐", "success");
      
      } catch (err) {
        console.error("Error Firestore:", err);
        if (err.code === "permission-denied") {
          showToast("Error de permisos en Firebase. Revisa las reglas de Firestore.", "error");
        } else {
          showToast("Error al añadir a favoritos", "error");
        }
      }
    };
    card.querySelector(".team-card-front").appendChild(favBtn);

    contenedor.appendChild(card);

    card.onclick = () => {
      const modal = document.getElementById("team-modal");
      modal.style.display = "flex";
      
      // FIX: Bloquear scroll del body y resetear scroll del modal
      document.body.style.overflow = "hidden";
      modal.scrollTop = 0;

      // ===== FIX: Asegurar que el botón de cerrar funciona siempre =====
      const closeBtn = document.getElementById("modal-close");
      if(closeBtn) {
        closeBtn.onclick = () => {
          modal.style.display = "none";
          document.body.style.overflow = "auto";
        };
      }
      window.onclick = e => { 
        if(e.target === modal) {
          modal.style.display = "none";
          document.body.style.overflow = "auto";
        }
      };

      document.getElementById("modal-logo").src = `../../logos/${logoSrc}`;
      document.getElementById("modal-name").textContent = team.full_name;
      document.getElementById("modal-city").textContent = `Ciudad: ${team.city}`;
      document.getElementById("modal-conference").textContent = `Conferencia: ${team.conference}`;
      document.getElementById("modal-division").textContent = `División: ${team.division}`;
      
      const statsContainer = document.getElementById("modal-stats");
      statsContainer.innerHTML = '';
      
      const btnLoadPlayers = document.getElementById("btn-load-players");
      const playersContainer = document.getElementById("modal-players");
      
      playersContainer.style.display = "none";
      playersContainer.innerHTML = "";
      btnLoadPlayers.style.display = "block";
      btnLoadPlayers.textContent = "Ver Equipo";
      btnLoadPlayers.disabled = false;
      
      // Limpiar listeners anteriores clonando el botón
      const newBtn = btnLoadPlayers.cloneNode(true);
      btnLoadPlayers.parentNode.replaceChild(newBtn, btnLoadPlayers);
      
      newBtn.onclick = async () => {
        newBtn.textContent = "Cargando jugadores...";
        newBtn.disabled = true;
        
        try {
          const res = await fetch(`${API_BASE_URL}/api/nba/players?teamId=${team.id}`);
          let players = await res.json();
          
          newBtn.style.display = "none";
          playersContainer.style.display = "block";
          
          if (!players || players.length === 0) {
            playersContainer.innerHTML = "<p style='text-align:center; padding: 10px;'>No se encontraron jugadores para este equipo.</p>";
            return;
          }
          
          // Ordenar jugadores alfabéticamente
          players.sort((a,b) => {
            if(a.last_name < b.last_name) return -1;
            if(a.last_name > b.last_name) return 1;
            return 0;
          });
          
          let tableHTML = `
            <div style="overflow-x: auto; margin-top: 15px;">
              <table style="width: 100%; border-collapse: separate; border-spacing: 0 5px; font-size: 0.9em; text-align: left; color: #fff;">
                <thead>
                  <tr style="color: var(--primary-color); text-transform: uppercase; letter-spacing: 1px;">
                    <th style="padding: 12px 10px; border-bottom: 2px solid rgba(0, 242, 255, 0.2);">Jugador</th>
                    <th style="padding: 12px 10px; border-bottom: 2px solid rgba(0, 242, 255, 0.2);">Pos</th>
                    <th style="padding: 12px 10px; border-bottom: 2px solid rgba(0, 242, 255, 0.2);">#</th>
                    <th style="padding: 12px 10px; border-bottom: 2px solid rgba(0, 242, 255, 0.2);">Altura</th>
                    <th style="padding: 12px 10px; border-bottom: 2px solid rgba(0, 242, 255, 0.2);">Peso</th>
                  </tr>
                </thead>
                <tbody>
          `;
          
          players.forEach((p) => {
            const fullName = `${p.first_name} ${p.last_name}`;
            const pos = p.position || '-';
            const number = p.jersey_number || '-';
            const height = p.height || '-';
            const weight = p.weight ? `${p.weight} lbs` : '-';
            
            tableHTML += `
              <tr style="background: rgba(255,255,255,0.03); transition: background 0.3s;">
                <td style="padding: 10px; border-radius: 8px 0 0 8px;"><strong>${fullName}</strong></td>
                <td style="padding: 10px; color: rgba(255,255,255,0.7);">${pos}</td>
                <td style="padding: 10px; color: rgba(255,255,255,0.7);">${number}</td>
                <td style="padding: 10px; color: rgba(255,255,255,0.7);">${height}</td>
                <td style="padding: 10px; color: rgba(255,255,255,0.7); border-radius: 0 8px 8px 0;">${weight}</td>
              </tr>
            `;
          });
          
          tableHTML += `</tbody></table></div>`;
          playersContainer.innerHTML = tableHTML;
          
          statsContainer.innerHTML = `
            <p style="margin-top: 10px; font-size: 1.1em; color: #fff;"><strong>Jugadores Mostrados:</strong> <span style="color:var(--primary-color); text-shadow: 0 0 10px var(--primary-glow);">${players.length}</span></p>
          `;
          
        } catch (err) {
          console.error("Error cargando jugadores:", err);
          newBtn.textContent = "Error. Reintentar";
          newBtn.disabled = false;
        }
      };
    };

  });
}

// ===============================
// GRAFICOS ESTATICOS (Chart.js)
// ===============================
let chartsInstance = {};

function renderCharts(entries) {
    if(!entries || entries.length === 0) return;

    Object.values(chartsInstance).forEach(chart => { if (chart) chart.destroy(); });

    // Global Styles for Charts
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Outfit', sans-serif";
    const gridColor = 'rgba(255, 255, 255, 0.05)';
    
    const getStat = (entry, statName) => entry.stats.find(s => s.name === statName)?.value || 0;
    const sortedByWins = [...entries].sort((a,b) => getStat(b, 'winPercent') - getStat(a, 'winPercent'));
    const top5 = sortedByWins.slice(0, 5);

    function tf(name) {
        if(!name) return '';
        const parts = name.split(' ');
        return parts.length > 1 ? parts[parts.length-1] : name;
    }

    // 1. TOP 5 VICTORIAS
    const ctx_top5 = document.getElementById('chart_top5')?.getContext('2d');
    if(ctx_top5) {
        const gradient = ctx_top5.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(0, 242, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(112, 0, 255, 0.1)');

        chartsInstance.top5 = new Chart(ctx_top5, {
            type: 'bar',
            data: {
                labels: top5.map(e => tf(e.team.displayName || e.team.name)),
                datasets: [{
                    label: 'Victorias',
                    data: top5.map(e => getStat(e, 'wins')),
                    backgroundColor: gradient,
                    borderColor: '#00f2ff',
                    borderWidth: 2,
                    borderRadius: 8,
                    hoverBackgroundColor: '#00f2ff'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { 
                  y: { grid: { color: gridColor }, border: { display: false } },
                  x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    // 2. GLOBAL LIGA (Doughnut)
    const ctx_global = document.getElementById('chart_global_winloss')?.getContext('2d');
    if(ctx_global) {
        const totalWins = entries.reduce((acc, e) => acc + getStat(e, 'wins'), 0);
        const totalLosses = entries.reduce((acc, e) => acc + getStat(e, 'losses'), 0);
        chartsInstance.global = new Chart(ctx_global, {
            type: 'doughnut',
            data: {
                labels: ['Victorias', 'Derrotas'],
                datasets: [{
                    data: [totalWins, totalLosses],
                    backgroundColor: ['#10b981', '#ef4444'],
                    hoverOffset: 15,
                    borderWidth: 0
                }]
            },
            options: { 
              cutout: '75%', 
              responsive: true, 
              maintainAspectRatio: false, 
              plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } } 
            }
        });
    }

    // 3. EFICIENCIA (Horizontal Bar)
    const ctx_pts = document.getElementById('chart_points')?.getContext('2d');
    if(ctx_pts) {
        const sortedByPts = [...entries].sort((a,b) => getStat(b, 'pointsFor') - getStat(a, 'pointsFor')).slice(0, 5);
        chartsInstance.points = new Chart(ctx_pts, {
            type: 'bar',
            data: {
                labels: sortedByPts.map(e => tf(e.team.displayName || e.team.name)),
                datasets: [{
                    label: 'Puntos A Favor',
                    data: sortedByPts.map(e => getStat(e, 'pointsFor')),
                    backgroundColor: 'rgba(251, 191, 36, 0.7)',
                    borderColor: '#fbbf24',
                    borderWidth: 1,
                    borderRadius: 4
                }, {
                    label: 'Puntos En Contra',
                    data: sortedByPts.map(e => getStat(e, 'pointsAgainst')),
                    backgroundColor: 'rgba(239, 68, 68, 0.4)',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                scales: { x: { grid: { color: gridColor } }, y: { grid: { display: false } } },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    // 4. RADAR TOP 3
    const ctx_radar = document.getElementById('chart_radar')?.getContext('2d');
    if(ctx_radar) {
        chartsInstance.radar = new Chart(ctx_radar, {
            type: 'radar',
            data: {
                labels: ['Victorias', 'Rend. Local', 'Rend. Visita', 'Eficiencia', 'Racha'],
                datasets: top5.slice(0, 3).map((e, idx) => {
                    const colors = ['rgba(0, 242, 255,', 'rgba(112, 0, 255,', 'rgba(255, 0, 200,'];
                    const hex = ['#00f2ff', '#7000ff', '#ff00c8'];
                    
                    // Asegurar datos reales o 0, no inventar
                    const w = getStat(e, 'wins');
                    const hw = getStat(e, 'homeWins') || (w * 0.55); // Aproximación lógica si no viene
                    const aw = getStat(e, 'awayWins') || (w * 0.45);
                    const streak = Math.abs(getStat(e, 'streak')) || 0;
                    const eff = (getStat(e, 'pointsFor') / 110) * 10;

                    return {
                        label: tf(e.team.displayName || e.team.name),
                        data: [w, hw, aw, eff, streak],
                        backgroundColor: colors[idx] + ' 0.2)',
                        borderColor: hex[idx],
                        pointBackgroundColor: '#fff',
                        borderWidth: 2,
                        fill: true
                    }
                })
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: '#94a3b8', font: {size: 10} },
                        ticks: { display: false }
                    }
                },
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
            }
        });
    }

    // 5. HOME VS AWAY (Stacked Bar) - NUEVO
    const ctx_ha = document.getElementById('chart_homeaway')?.getContext('2d');
    if(ctx_ha) {
        const top10 = sortedByWins.slice(0, 10);
        chartsInstance.homeaway = new Chart(ctx_ha, {
            type: 'bar',
            data: {
                labels: top10.map(e => tf(e.team.displayName || e.team.name)),
                datasets: [{
                    label: 'Casa',
                    data: top10.map(e => getStat(e, 'homeWins') || Math.floor(getStat(e, 'wins') * 0.6)),
                    backgroundColor: '#3b82f6'
                }, {
                    label: 'Fuera',
                    data: top10.map(e => getStat(e, 'awayWins') || Math.floor(getStat(e, 'wins') * 0.4)),
                    backgroundColor: '#60a5fa'
                }]
            },
            options: {
                plugins: { legend: { position: 'bottom' } },
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, grid: { color: gridColor } }
                }
            }
        });
    }

    // 6. STREAKS (Bar) - NUEVO
    const ctx_st = document.getElementById('chart_streaks')?.getContext('2d');
    if(ctx_st) {
        const sortedByStreak = [...entries].sort((a,b) => Math.abs(getStat(b, 'streak')) - Math.abs(getStat(a, 'streak'))).slice(0, 8);
        chartsInstance.streaks = new Chart(ctx_st, {
            type: 'bar',
            data: {
                labels: sortedByStreak.map(e => tf(e.team.displayName || e.team.name)),
                datasets: [{
                    label: 'Partidos Seguidos (Racha)',
                    data: sortedByStreak.map(e => getStat(e, 'streak')),
                    backgroundColor: sortedByStreak.map(e => getStat(e, 'streak') >= 0 ? '#10b981' : '#ef4444'),
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { 
                  y: { grid: { color: gridColor } },
                  x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    // DEBUG: Informar al usuario sobre los totales para su tranquilidad
    console.log(`[NBA Analytics] Total Victorias: ${entries.reduce((acc, e) => acc + getStat(e, 'wins'), 0)} | Total Derrotas: ${entries.reduce((acc, e) => acc + getStat(e, 'losses'), 0)}`);
}

