import { API_BASE_URL } from "../config/config.js";

// ===================================
// TOAST NOTIFICATION SYSTEM
// ===================================
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

  // Entrada animada
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
  });

  // Auto-remove
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ===============================
// MAPAS DE LOGOS NBA
// ===============================
const nbaLogos = {
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

// ===============================
// MAPAS DE LOGOS NFL
// ===============================
const nflLogos = {
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

// ===============================
// STATE
// ===============================
const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "login.html";

let currentLeague = null;    // 'NBA' | 'NFL'
let allPlayers = [];         // todos los jugadores cargados
let allTeams = [];           // equipos de la liga actual
let searchTerm = '';
let selectedTeamId = '';

// ===============================
// LEAGUE TABS
// ===============================
function setLeague(league) {
  currentLeague = league;

  // Actualizar tabs
  document.querySelectorAll('.league-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.league === league);
  });

  // Resetear filtros
  document.getElementById('player-search').value = '';
  document.getElementById('team-filter').value = '';
  searchTerm = '';
  selectedTeamId = '';

  // Ocultar landing
  const landing = document.getElementById('players-landing');
  if (landing) landing.style.display = 'none';

  loadTeamsAndPlayers(league);
}
window.setLeague = setLeague;

document.querySelectorAll('.league-tab').forEach(tab => {
  tab.addEventListener('click', () => setLeague(tab.dataset.league));
});

// ===============================
// LOAD TEAMS
// ===============================
async function loadTeamsAndPlayers(league) {
  const grid = document.getElementById('players-grid');
  const countText = document.getElementById('players-count-text');
  countText.textContent = `Cargando equipos de ${league}...`;
  
  try {
    const path = league.toLowerCase();
    const res = await fetch(`${API_BASE_URL}/api/${path}/teams`);
    if (!res.ok) throw new Error('Error cargando equipos');

    allTeams = await res.json();
    populateTeamFilter(allTeams);

    countText.textContent = `Listado de ${league} listo. Busca un jugador o filtra por equipo.`;
    grid.innerHTML = `
      <div class="players-landing">
        <div class="landing-icon">${league === 'NBA' ? '🏀' : '🏈'}</div>
        <h2>Busca en la ${league}</h2>
        <p>Escribe arriba para encontrar jugadores</p>
      </div>`;

  } catch (err) {
    console.error('Error:', err);
    grid.innerHTML = `<div class="players-error"><span>⚠️</span><p>Error cargando equipos. Revisa tu conexión.</p></div>`;
    countText.textContent = 'Error';
  }
}

// ===============================
// FETCH PLAYERS (ON DEMAND)
// ===============================
async function fetchPlayers() {
  const grid = document.getElementById('players-grid');
  const countText = document.getElementById('players-count-text');
  
  if (!currentLeague) return;
  if (!searchTerm && !selectedTeamId) {
    countText.textContent = `Busca un jugador o filtra por equipo.`;
    return;
  }

  showLoadingSkeletons(grid);
  countText.textContent = `Buscando...`;

  try {
    const endpoint = currentLeague === 'NBA' ? '/api/nba/players' : '/api/nfl/players';
    const query = new URLSearchParams();
    if (searchTerm) query.append('search', searchTerm);
    if (selectedTeamId) query.append('teamId', selectedTeamId);

    const res = await fetch(`${API_BASE_URL}${endpoint}?${query.toString()}`);
    if (!res.ok) throw new Error('Error en la búsqueda');

    const players = await res.json();
    
    // Mapear nombres de equipos para los logos
    players.forEach(p => {
      const team = allTeams.find(t => t.id === (p.team?.id || p.team_id));
      p._teamName = team ? (team.full_name || team.name) : (p.team?.full_name || 'Desconocido');
      p._teamId = team ? team.id : null;
      p._league = currentLeague;
    });

    renderPlayers(players);
  } catch (err) {
    console.error('Fetch error:', err);
    showToast("Error en la búsqueda", 'error');
    grid.innerHTML = `<div class="players-error"><span>⚠️</span><p>No se pudo completar la búsqueda.</p></div>`;
  }
}

// ===============================
// RENDER PLAYERS
// ===============================
function renderPlayers(players) {
  const grid = document.getElementById('players-grid');
  const countText = document.getElementById('players-count-text');

  countText.textContent = `${players.length} jugador${players.length !== 1 ? 'es' : ''} encontrado${players.length !== 1 ? 's' : ''}`;

  if (players.length === 0) {
    grid.innerHTML = `
      <div class="players-empty">
        <span>🔍</span>
        <p>No se encontraron resultados para "<strong>${searchTerm || 'este filtro'}</strong>"</p>
      </div>`;
    return;
  }

  grid.innerHTML = '';
  players.forEach((player, i) => {
    const card = createPlayerCard(player, i);
    grid.appendChild(card);
  });
}

// ===============================
// CREATE PLAYER CARD
// ===============================
function createPlayerCard(player, index) {
  const league = player._league || currentLeague;
  const teamName = player._teamName || '';
  const logoMap = league === 'NBA' ? nbaLogos : nflLogos;
  const logoFile = logoMap[teamName];
  const logoPath = logoFile ? `../../logos/${logoFile}` : null;
  const isNBA = league === 'NBA';
  const sportColor = isNBA ? '#ff3b3b' : '#3b82f6';

  const firstName = player.first_name || '';
  const lastName = player.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Jugador';
  const position = player.position || '—';
  const number = player.jersey_number || player.height || '—';

  const card = document.createElement('div');
  card.className = 'player-card';
  card.style.animationDelay = `${(index % 20) * 0.04}s`;
  card.dataset.league = league;

  card.innerHTML = `
    <div class="player-card-sport-bar" style="background: ${sportColor};"></div>
    <div class="player-card-content">
      <div class="player-logo-wrap">
        ${logoPath
          ? `<img src="${logoPath}" alt="${teamName}" class="player-team-logo" onerror="this.style.display='none'">`
          : `<div class="player-logo-placeholder" style="color:${sportColor}">${league === 'NBA' ? '🏀' : '🏈'}</div>`
        }
      </div>
      <div class="player-info">
        <span class="player-league-badge" style="background:${sportColor}22; color:${sportColor}; border:1px solid ${sportColor}44;">${league}</span>
        <h3 class="player-name">${fullName}</h3>
        <p class="player-team">${teamName || '—'}</p>
        <div class="player-tags">
          ${position !== '—' ? `<span class="player-tag">${position}</span>` : ''}
        </div>
      </div>
      <button class="player-detail-btn" title="Ver detalles">→</button>
    </div>
  `;

  card.querySelector('.player-detail-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    openPlayerModal(player);
  });
  card.addEventListener('click', () => openPlayerModal(player));

  return card;
}

// ===============================
// SKELETON LOADER
// ===============================
function showLoadingSkeletons(grid) {
  grid.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const skel = document.createElement('div');
    skel.className = 'player-card skeleton';
    skel.style.height = '120px';
    grid.appendChild(skel);
  }
}

// ===============================
// PLAYER MODAL
// ===============================
function openPlayerModal(player) {
  const modal = document.getElementById('player-modal');
  const league = player._league || currentLeague;
  const isNBA = league === 'NBA';
  const sportColor = isNBA ? '#ff3b3b' : '#3b82f6';

  const fullName = `${player.first_name || ''} ${player.last_name || ''}`.trim();

  document.getElementById('modal-player-name').textContent = fullName || 'Jugador';
  document.getElementById('modal-league-badge').textContent = league;
  document.getElementById('modal-league-badge').style.background = sportColor;
  document.getElementById('modal-team-val').textContent = player._teamName || '—';
  document.getElementById('modal-pos-val').textContent = player.position || '—';
  document.getElementById('modal-num-val').textContent = player.jersey_number || '—';
  document.getElementById('modal-college-val').textContent = player.college || '—';
  document.getElementById('modal-country-val').textContent = player.country || '—';
  document.getElementById('modal-height-val').textContent = player.height || '—';
  document.getElementById('modal-weight-val').textContent = player.weight ? `${player.weight} lbs` : '—';

  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('modal-open'));
}

function closePlayerModal() {
  const modal = document.getElementById('player-modal');
  modal.classList.remove('modal-open');
  setTimeout(() => modal.style.display = 'none', 300);
}

document.getElementById('modal-close').addEventListener('click', closePlayerModal);
document.getElementById('player-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('player-modal')) closePlayerModal();
});

// ===============================
// POPULATE TEAM SELECT
// ===============================
function populateTeamFilter(teams) {
  const select = document.getElementById('team-filter');
  select.innerHTML = '<option value="">Todos los equipos</option>';
  const sorted = [...teams].sort((a, b) => (a.full_name || a.name || '').localeCompare(b.full_name || b.name || ''));
  sorted.forEach(team => {
    const opt = document.createElement('option');
    opt.value = team.id;
    opt.textContent = team.full_name || team.name;
    select.appendChild(opt);
  });
}

// ===============================
// SEARCH INPUT
// ===============================
let searchDebounce;
document.getElementById('player-search').addEventListener('input', (e) => {
  searchTerm = e.target.value.trim();
  clearTimeout(searchDebounce);
  // Require at least 3 characters to avoid API rate limiting (429)
  if (searchTerm.length > 0 && searchTerm.length < 3) return;
  searchDebounce = setTimeout(() => {
    fetchPlayers();
  }, 600);
});

document.getElementById('clear-search').addEventListener('click', () => {
  document.getElementById('player-search').value = '';
  searchTerm = '';
  fetchPlayers();
});

// ===============================
// TEAM FILTER
// ===============================
document.getElementById('team-filter').addEventListener('change', (e) => {
  selectedTeamId = e.target.value;
  fetchPlayers();
});
