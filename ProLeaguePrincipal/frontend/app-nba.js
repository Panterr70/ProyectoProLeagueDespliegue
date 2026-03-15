import { auth, db } from "./firebase-config.js";
import { doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ===============================
// STATE & AUTH
// ===============================
const user = JSON.parse(localStorage.getItem("user"));
if (!user || (!user.uid && !user.id)) window.location.href = "login.html";

// ===============================
// UI FUNCTIONS
// ===============================
async function loadHeader() {
  const html = await fetch("header.html").then(r => r.text());
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
      window.location.href = "login.html";
    });
  }
}

async function loadFooter() {
  document.getElementById("footer-placeholder").innerHTML =
    await fetch("footer.html").then(r => r.text());
}

// INIT
document.addEventListener("DOMContentLoaded", async () => {
  await loadHeader();
  await loadFooter();

  const nbaSection = document.getElementById("nba-section");
  if(nbaSection) nbaSection.style.display = "block";

  // ===== CARGAR CLASIFICACIÓN Y EQUIPOS =====
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

// ===== GOOGLE CHARTS =====
google.charts.load("current", { packages: ["corechart"] });

const teamLogos = {
  "Atlanta Hawks": "ATL.png","Boston Celtics": "BOS.png","Brooklyn Nets": "BKN.png",
  "Charlotte Hornets": "CHA.png","Chicago Bulls": "CHI.png","Cleveland Cavaliers": "CLE.png",
  "Dallas Mavericks": "DAL.png","Denver Nuggets": "DEN.png","Detroit Pistons": "DET.png",
  "Golden State Warriors": "GSW.png","Houston Rockets": "HOU.png","Indiana Pacers": "IND.png",
  "Los Angeles Clippers": "LAC.png","Los Angeles Lakers": "LAL.png","Memphis Grizzlies": "MEM.png",
  "Miami Heat": "MIA.png","Milwaukee Bucks": "MIL.png","Minnesota Timberwolves": "MIN.png",
  "New Orleans Pelicans": "NOP.png","New York Knicks": "NYK.png","Oklahoma City Thunder": "OKC.png",
  "Orlando Magic": "ORL.png","Philadelphia 76ers": "PHI.png","Phoenix Suns": "PHX.png",
  "Portland Trail Blazers": "POR.png","Sacramento Kings": "SAC.png","San Antonio Spurs": "SAS.png",
  "Toronto Raptors": "TOR.png","Utah Jazz": "UTA.png","Washington Wizards": "WIZ.png"
};

// ===== FUNCIONES =====
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
    const res = await fetch("http://localhost:3000/api/nba/standings");
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

  } catch(err) {
    console.error("Error cargando clasificación NBA:", err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 40px;">⚠️ Error cargando la clasificación</td></tr>`;
  }
}



async function cargarEquipos() {
  try {
    const res = await fetch("http://localhost:3000/api/nba/teams");
    const equipos = await res.json();

    equipos.forEach(team => {
      team.numPlayers = 0;
      team.avgAge = 0;
      team.conference = (team.conference || "Desconocido").trim();
      team.division = (team.division || "Desconocido").trim();
      team.city = (team.city || "Desconocido").trim();
    });

    mostrarEquipos(equipos);

    google.charts.setOnLoadCallback(() => {
      dibujarGraficoConferencia(equipos);
      dibujarGraficoDivision(equipos);
      dibujarGraficoCiudades(equipos);
      dibujarGraficoJugadores(equipos);
    });
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
          <img class="team-logo" src="logos/${logoSrc}" alt="${team.full_name}">
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
      const user = JSON.parse(localStorage.getItem("user"));
      try {
        const uid = user.uid || user.id;
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
          favorites: arrayUnion({
            league: "NBA",
            teamId: team.id,
            teamName: team.full_name
          })
        });
        showToast("¡Añadido a favoritos! ⭐", "success");
      } catch (err) {
        console.error(err);
        showToast("Error al añadir a favoritos", "error");
      }
    };
    card.querySelector(".team-card-front").appendChild(favBtn);

    contenedor.appendChild(card);

    card.onclick = () => {
      const modal = document.getElementById("team-modal");
      modal.style.display = "flex";
      document.getElementById("modal-logo").src = `logos/${logoSrc}`;
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
          const res = await fetch(`http://localhost:3000/api/nba/players?teamId=${team.id}`);
          const players = await res.json();
          
          newBtn.style.display = "none";
          playersContainer.style.display = "block";
          
          if (!players || players.length === 0) {
            playersContainer.innerHTML = "<p style='text-align:center; padding: 10px;'>No se encontraron jugadores activos para este equipo.</p>";
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
            <p style="margin-top: 10px; font-size: 1.1em; color: #fff;"><strong>Jugadores Activos:</strong> <span style="color:var(--primary-color); text-shadow: 0 0 10px var(--primary-glow);">${players.length}</span></p>
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

// ===== GRÁFICOS =====
function dibujarGraficoConferencia(equipos){
  const data = google.visualization.arrayToDataTable([
    ["Conferencia", "Equipos"],
    ["Este", equipos.filter(t=>t.conference==="East").length],
    ["Oeste", equipos.filter(t=>t.conference==="West").length]
  ]);
  
  const options = {
    title: "Equipos por Conferencia",
    backgroundColor: 'transparent',
    titleTextStyle: { color: '#ffffff', fontSize: 16, fontName: 'Outfit' },
    legend: { position: "none" },
    hAxis: { textStyle: { color: '#94a3b8' }, gridlines: { color: 'rgba(255,255,255,0.05)' } },
    vAxis: { textStyle: { color: '#94a3b8' }, gridlines: { color: 'rgba(255,255,255,0.05)' } },
    colors: ['#ff3b3b', '#00f2ff'],
    animation: { startup: true, duration: 1000, easing: 'out' }
  };
  
  new google.visualization.ColumnChart(document.getElementById("chart_conferences")).draw(data, options);
}

function dibujarGraficoDivision(equipos){
  const divisions = {};
  equipos.forEach(t => divisions[t.division] = (divisions[t.division]||0)+1);
  const data = google.visualization.arrayToDataTable([["División","Equipos"], ...Object.entries(divisions)]);
  
  const options = {
    title: "Equipos por División",
    backgroundColor: 'transparent',
    titleTextStyle: { color: '#ffffff', fontSize: 16, fontName: 'Outfit' },
    legend: { textStyle: { color: '#94a3b8' } },
    pieHole: 0.4,
    pieSliceBorderStyle: 'none',
    colors: ['#00f2ff', '#7000ff', '#ff00c8', '#3b82f6', '#ff3b3b', '#fbbf24'],
    animation: { startup: true, duration: 1000, easing: 'out' }
  };
  
  new google.visualization.PieChart(document.getElementById("chart_divisions")).draw(data, options);
}

function dibujarGraficoCiudades(equipos){
  const cityCounts = {};
  equipos.forEach(t=>{ const c=t.city[0]; cityCounts[c]=(cityCounts[c]||0)+1; });
  const data = google.visualization.arrayToDataTable([["Inicial Ciudad","Equipos"], ...Object.entries(cityCounts)]);
  
  const options = {
    title: "Equipos por inicial de la ciudad",
    backgroundColor: 'transparent',
    titleTextStyle: { color: '#ffffff', fontSize: 16, fontName: 'Outfit' },
    legend: { position: "none" },
    hAxis: { textStyle: { color: '#94a3b8' }, gridlines: { color: 'rgba(255,255,255,0.05)' } },
    vAxis: { textStyle: { color: '#94a3b8' }, gridlines: { color: 'rgba(255,255,255,0.05)' } },
    colors: ['#7000ff'],
    animation: { startup: true, duration: 1000, easing: 'out' }
  };
  
  new google.visualization.BarChart(document.getElementById("chart_cities")).draw(data, options);
}

function dibujarGraficoJugadores(equipos){
  const data = google.visualization.arrayToDataTable([["Equipo","Jugadores"], ...equipos.map(t=>[t.full_name, t.numPlayers||0])]);
  
  const options = {
    title: "Jugadores por Equipo",
    backgroundColor: 'transparent',
    titleTextStyle: { color: '#ffffff', fontSize: 16, fontName: 'Outfit' },
    legend: { position: "none" },
    hAxis: { textStyle: { color: '#94a3b8', fontSize: 10 } },
    vAxis: { textStyle: { color: '#94a3b8' }, gridlines: { color: 'rgba(255,255,255,0.05)' } },
    colors: ['#ff3b3b'],
    animation: { startup: true, duration: 1000, easing: 'out' }
  };
  
  new google.visualization.ColumnChart(document.getElementById("chart_players")).draw(data, options);
}
