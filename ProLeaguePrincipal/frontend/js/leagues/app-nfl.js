import { auth, db } from "../config/firebase-config.js";
import { doc, updateDoc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ===============================
// STATE & AUTH
// ===============================
const user = JSON.parse(localStorage.getItem("user"));
if (!user || (!user.uid && !user.id)) window.location.href = "../auth/login.html";

// ===============================
// UI FUNCTIONS
// ===============================
async function loadHeader() {
  const html = await fetch("../components/header.html").then(r => r.text());
  document.getElementById("header-placeholder").innerHTML = html;
  
  if (typeof google !== "undefined" && google.translate) {
      googleTranslateElementInit();
  }
  
  const logoutLink = document.getElementById("nav-logout");
  const profileLink = document.getElementById("nav-profile");
  
  if (user) {
    if (logoutLink) logoutLink.style.display = "inline";
    if (profileLink) profileLink.style.display = "inline";
  }

  if (logoutLink) {
    logoutLink.addEventListener("click", e => {
      e.preventDefault();
      auth.signOut();
      localStorage.removeItem("user");
      window.location.href = "../auth/login.html";
    });
  }
}

async function loadFooter() {
  document.getElementById("footer-placeholder").innerHTML =
    await fetch("../components/footer.html").then(r => r.text());
}

// INIT
document.addEventListener("DOMContentLoaded", async () => {
  await loadHeader();
  await loadFooter();

  const nflSection = document.getElementById("nfl-section");
  if(nflSection) nflSection.style.display = "block";

  await cargarClasificacion();
  await cargarEquipos();
  
  // ===== MODAL =====
  const modal = document.getElementById("team-modal");
  if(modal) {
    document.getElementById("modal-close").onclick = () => modal.style.display = "none";
    window.onclick = e => { if(e.target === modal) modal.style.display = "none"; };
  }
});

// ===============================
// TOAST NOTIFICATION SYSTEM
// ===============================
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
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '📢'}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
  });
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// Cargar equipos NFL
const teamLogos = {
  "Arizona Cardinals":"NFL_ARI.png","Atlanta Falcons":"NFL_ATL.png","Baltimore Ravens":"NFL_BAL.png",
  "Buffalo Bills":"NFL_BUF.png","Carolina Panthers":"NFL_CAR.png","Chicago Bears":"NFL_CHI.svg",
  "Cincinnati Bengals":"NFL_CIN.png","Cleveland Browns":"NFL_CLE.png","Dallas Cowboys":"NFL_DAL.svg",
  "Denver Broncos":"NFL_DEN.svg","Detroit Lions":"NFL_DET.png","Green Bay Packers":"NFL_GB.png",
  "Houston Texans":"NFL_HOU.png","Indianapolis Colts":"NFL_IND.svg","Jacksonville Jaguars":"NFL_JAX.png",
  "Kansas City Chiefs":"NFL_KC.png","Las Vegas Raiders":"NFL_LV.png","Los Angeles Chargers":"NFL_LAC.png",
  "Los Angeles Rams":"NFL_LAR.png","Miami Dolphins":"NFL_MIA.png","Minnesota Vikings":"NFL_MIN.png",
  "New England Patriots":"NFL_NE.png","New Orleans Saints":"NFL_NO.png","New York Giants":"NFL_NYG.png",
  "New York Jets":"NFL_NYJ.svg","Philadelphia Eagles":"NFL_PHI.png","Pittsburgh Steelers":"NFL_PIT.png",
  "San Francisco 49ers":"NFL_SF.svg","Seattle Seahawks":"NFL_SEA.png","Tampa Bay Buccaneers":"NFL_TB.svg",
  "Tennessee Titans":"NFL_TEN.svg","Washington Commanders":"NFL_WAS.png"
};

// Cargar Clasificación NFL
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
    const res = await fetch("http://localhost:3000/api/nfl/standings");
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

    // Sort by Win %
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

        const rankColor = index < 3 ? "var(--nfl-blue)" : "inherit";

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
            <td><span class="pct-badge" style="background: rgba(30, 58, 138, 0.2); color: #93c5fd;">${(pctStat.value * 100).toFixed(1)}%</span></td>
        `;
        tbody.appendChild(tr);
    });

    // Render Chart.js charts with real standings data
    renderCharts(allEntries);

  } catch(err) {
    console.error("Error cargando clasificación NFL:", err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 40px;">⚠️ Error cargando la clasificación</td></tr>`;
  }
}

// Exponer globalmente para el refresh
window.cargarClasificacion = cargarClasificacion;

async function cargarEquipos(){
  try {
    const res = await fetch("http://localhost:3000/api/nfl/teams");
    const equipos = await res.json();
    equipos.forEach(t => { 
      t.numPlayers = t.numPlayers || 0;
      t.avgAge = t.avgAge || 0;
      t.city = t.city || "Desconocido";
      t.conference = t.conference || "Desconocido";
      t.division = t.division || "Desconocido";
    });
    mostrarEquipos(equipos);
  } catch(err){ console.error("Error cargando equipos NFL:", err); }
}

function mostrarEquipos(equipos){
  const contenedor = document.getElementById("team-list");
  contenedor.innerHTML="";
  equipos.forEach(team=>{
    const logoSrc = teamLogos[team.full_name] || `${team.abbreviation}.png`;
    const card = document.createElement("div");
    card.className="team-card";
    card.innerHTML=`
      <div class="team-card-inner">
        <div class="team-card-front">
          <img class="team-logo" src="../../logos/${logoSrc}" alt="${team.full_name}">
          <div class="team-name">${team.full_name}</div>
          <div class="team-info">Ciudad: ${team.city}</div>
          <div class="team-info">Conferencia: ${team.conference}</div>
          <div class="team-info">División: ${team.division}</div>
        </div>
      </div>
    `;

    const favBtn = document.createElement("button");
    favBtn.textContent="⭐";
    favBtn.className="fav-btn";
    favBtn.onclick = async e => {
      e.stopPropagation();
      try {
        const uid = user.uid || user.id;
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, { favorites: arrayUnion({
            league: "NFL", teamId: team.id, teamName: team.full_name }) }, { merge: true });
        
        const animStar = document.createElement("div");
        animStar.textContent = "⭐";
        animStar.className = "fav-anim-star";
        card.querySelector(".team-card-front").appendChild(animStar);
        setTimeout(() => animStar.remove(), 1000);
        showToast("¡Añadido a favoritos! ⭐", "success");
      
      } catch (err) {
        console.error(err);
        showToast("No se pudo añadir a favoritos", "error");
      }
    };
    card.querySelector(".team-card-front").appendChild(favBtn);

    contenedor.appendChild(card);

    card.onclick=()=>{
      const modal=document.getElementById("team-modal");
      modal.style.display="flex";
      document.getElementById("modal-logo").src=`../../logos/${logoSrc}`;
      document.getElementById("modal-name").textContent=team.full_name;
      document.getElementById("modal-city").textContent=`Ciudad: ${team.city}`;
      document.getElementById("modal-conference").textContent=`Conferencia: ${team.conference}`;
      document.getElementById("modal-division").textContent=`División: ${team.division}`;
      
      const statsContainer = document.getElementById("modal-stats");
      statsContainer.innerHTML='';
      
      const btnLoadPlayers = document.getElementById("btn-load-players");
      const playersContainer = document.getElementById("modal-players");
      
      playersContainer.style.display = "none";
      playersContainer.innerHTML = "";
      btnLoadPlayers.style.display = "block";
      btnLoadPlayers.textContent = "Ver Equipo";
      btnLoadPlayers.disabled = false;
      
      const newBtn = btnLoadPlayers.cloneNode(true);
      btnLoadPlayers.parentNode.replaceChild(newBtn, btnLoadPlayers);
      
      newBtn.onclick = async () => {
        newBtn.textContent = "Cargando jugadores...";
        newBtn.disabled = true;
        
        try {
          const res = await fetch(`http://localhost:3000/api/nfl/players?teamId=${team.id}`);
          const players = await res.json();
          
          newBtn.style.display = "none";
          playersContainer.style.display = "block";
          
          if (!players || players.length === 0) {
            playersContainer.innerHTML = "<p style='text-align:center; padding: 10px;'>No se encontraron jugadores activos para este equipo.</p>";
            return;
          }
          
          players.sort((a,b) => {
            if(a.last_name < b.last_name) return -1;
            if(a.last_name > b.last_name) return 1;
            return 0;
          });
          
          let tableHTML = `
            <div style="overflow-x: auto; margin-top: 15px;">
              <table style="width: 100%; border-collapse: separate; border-spacing: 0 5px; font-size: 0.9em; text-align: left; color: #fff;">
                <thead>
                  <tr style="color: var(--nfl-blue); text-transform: uppercase; letter-spacing: 1px;">
                    <th style="padding: 12px 10px; border-bottom: 2px solid rgba(59, 130, 246, 0.2);">Jugador</th>
                    <th style="padding: 12px 10px; border-bottom: 2px solid rgba(59, 130, 246, 0.2);">Pos</th>
                    <th style="padding: 12px 10px; border-bottom: 2px solid rgba(59, 130, 246, 0.2);">#</th>
                    <th style="padding: 12px 10px; border-bottom: 2px solid rgba(59, 130, 246, 0.2);">Altura</th>
                    <th style="padding: 12px 10px; border-bottom: 2px solid rgba(59, 130, 246, 0.2);">Peso</th>
                  </tr>
                </thead>
                <tbody>
          `;
          
          players.forEach((p) => {
            const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || '-';
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
            <p style="margin-top: 10px; font-size: 1.1em; color: #fff;"><strong>Jugadores Activos:</strong> <span style="color:var(--nfl-blue); text-shadow: 0 0 10px rgba(59,130,246,0.3);">${players.length}</span></p>
          `;
          
        } catch (err) {
          console.error("Error cargando jugadores NFL:", err);
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

    Chart.defaults.color = '#cbd5e1';
    Chart.defaults.font.family = 'Space Grotesk, sans-serif';
    const gridColor = 'rgba(255, 255, 255, 0.05)';
    
    const getStat = (entry, statName) => entry.stats.find(s => s.name === statName)?.value || 0;
    
    const sortedByWins = [...entries].sort((a,b) => getStat(b, 'winPercent') - getStat(a, 'winPercent'));
    const top5 = sortedByWins.slice(0, 5);

    function tf(name) {
        if(!name) return '';
        const parts = name.split(' ');
        return parts.length > 1 ? parts[parts.length-1] : name;
    }

    if(document.getElementById('chart_top5')) {
        chartsInstance.top5 = new Chart(document.getElementById('chart_top5'), {
            type: 'bar',
            data: {
                labels: top5.map(e => tf(e.team.displayName || e.team.name)),
                datasets: [{
                    label: 'Victorias',
                    data: top5.map(e => getStat(e, 'wins')),
                    backgroundColor: 'rgba(0, 242, 255, 0.6)',
                    borderColor: '#00f2ff',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { grid: { color: gridColor } }, x: { grid: { display: false } } },
                plugins: { legend: { display: false } }
            }
        });
    }

    if(document.getElementById('chart_global_winloss')) {
        const totalWins = entries.reduce((acc, e) => acc + getStat(e, 'wins'), 0);
        const totalLosses = entries.reduce((acc, e) => acc + getStat(e, 'losses'), 0);
        chartsInstance.global = new Chart(document.getElementById('chart_global_winloss'), {
            type: 'doughnut',
            data: {
                labels: ['Victorias', 'Derrotas'],
                datasets: [{
                    data: [totalWins, totalLosses],
                    backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(239, 68, 68, 0.7)'],
                    borderColor: ['#10b981', '#ef4444'],
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: { cutout: '70%', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }

    if(document.getElementById('chart_points')) {
        const sortedByPts = [...entries].sort((a,b) => getStat(b, 'pointsFor') - getStat(a, 'pointsFor')).slice(0, 5);
        chartsInstance.points = new Chart(document.getElementById('chart_points'), {
            type: 'bar',
            data: {
                labels: sortedByPts.map(e => tf(e.team.displayName || e.team.name)),
                datasets: [{
                    label: 'Puntos A Favor',
                    data: sortedByPts.map(e => getStat(e, 'pointsFor')),
                    backgroundColor: 'rgba(251, 191, 36, 0.6)',
                    borderColor: '#fbbf24',
                    borderWidth: 2,
                    borderRadius: 4
                }, {
                    label: 'Puntos En Contra',
                    data: sortedByPts.map(e => getStat(e, 'pointsAgainst')),
                    backgroundColor: 'rgba(239, 68, 68, 0.4)',
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                scales: { x: { grid: { color: gridColor } }, y: { grid: { display: false } } }
            }
        });
    }

    if(document.getElementById('chart_radar')) {
        chartsInstance.radar = new Chart(document.getElementById('chart_radar'), {
            type: 'radar',
            data: {
                labels: ['Victorias', 'Rend. Local', 'Rend. Visita', 'Pts Fav(x10)', 'Racha'],
                datasets: top5.slice(0, 3).map((e, idx) => {
                    const colors = ['rgba(0, 242, 255,', 'rgba(112, 0, 255,', 'rgba(255, 0, 200,'];
                    const hex = ['#00f2ff', '#7000ff', '#ff00c8'];
                    return {
                        label: tf(e.team.displayName || e.team.name),
                        data: [
                            getStat(e, 'wins'),
                            getStat(e, 'homeWins') || (getStat(e, 'wins')/2),
                            getStat(e, 'awayWins') || (getStat(e, 'wins')/2),
                            (getStat(e, 'pointsFor') / 100),
                            getStat(e, 'streak') || 0
                        ],
                        backgroundColor: colors[idx] + ' 0.2)',
                        borderColor: hex[idx],
                        pointBackgroundColor: hex[idx],
                        borderWidth: 2
                    }
                })
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: gridColor },
                        grid: { color: gridColor },
                        pointLabels: { color: '#cbd5e1', font: {size: 10} },
                        ticks: { display: false }
                    }
                }
            }
        });
    }
}
