import { API_BASE_URL } from "../config/config.js";
import { showToast } from "../utils/toast.js";
import { nbaLogos, nflLogos } from "../config/logos-config.js";

// ===============================
// STATE & CACHE
// ===============================
const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "login.html";

let currentLeague = null;    // 'NBA' | 'NFL'
let allPlayers = [];         // todos los jugadores cargados
let allTeams = [];           // equipos de la liga actual
let searchTerm = '';
let selectedTeamId = '';
const searchCache = new Map(); // Cache para evitar peticiones repetidas

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

  // BÚSQUEDA INTELIGENTE: Si el usuario escribe "Lakers", buscamos el equipo en vez del jugador
  let effectiveSearchTerm = searchTerm;
  let effectiveTeamId = selectedTeamId;

  if (searchTerm && !selectedTeamId) {
    const termLower = searchTerm.toLowerCase();
    const matchedTeam = allTeams.find(t => 
      (t.full_name || t.name || '').toLowerCase().includes(termLower)
    );
    if (matchedTeam) {
      effectiveTeamId = matchedTeam.id;
      effectiveSearchTerm = ''; // No buscar nombre de jugador, solo cargar el equipo
    }
  }

  const cacheKey = `${currentLeague}-${effectiveSearchTerm}-${effectiveTeamId}`;
  if (searchCache.has(cacheKey)) {
    renderPlayers(searchCache.get(cacheKey));
    return;
  }

  showLoadingSkeletons(grid);
  countText.textContent = `Buscando...`;

  try {
    const endpoint = currentLeague === 'NBA' ? '/api/nba/players' : '/api/nfl/players';
    const query = new URLSearchParams();
    if (effectiveSearchTerm) query.append('search', effectiveSearchTerm);
    if (effectiveTeamId) query.append('teamId', effectiveTeamId);

    const res = await fetch(`${API_BASE_URL}${endpoint}?${query.toString()}`);
    
    if (res.status === 429) {
      showToast("Demasiadas peticiones. Espera unos segundos...", 'warning');
      countText.textContent = "Límite de API alcanzado. Espera 30s.";
      grid.innerHTML = `<div class="players-error"><span>⏳</span><p>La API está saturada. Por favor, espera un momento antes de volver a buscar.</p></div>`;
      return;
    }

    if (!res.ok) throw new Error('Error en la búsqueda');

    const players = await res.json();
    
    // Mapear nombres de equipos para los logos y nombres
    players.forEach(p => {
      const teamId = p.team?.id || p.team_id;
      const team = allTeams.find(t => t.id === teamId);
      
      p._teamName = team ? (team.full_name || team.name) : (p.team?.full_name || p.team?.name || 'Agente Libre');
      p._teamId = teamId;
      p._league = currentLeague;
    });

    searchCache.set(cacheKey, players);
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
  
  // Búsqueda robusta de logo
  let logoFile = logoMap[teamName];
  if (!logoFile && teamName) {
    // Si no hay match exacto, buscamos si alguna clave del mapa está contenida en el nombre o viceversa
    const key = Object.keys(logoMap).find(k => 
      teamName.includes(k) || k.includes(teamName)
    );
    if (key) logoFile = logoMap[key];
  }

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
          : `<div class="player-logo-placeholder" style="color:${sportColor}; background:${sportColor}11;">
               ${league === 'NBA' ? '🏀' : '🏈'}
               <span class="vintage-badge">Vintage</span>
             </div>`
        }
      </div>
      <div class="player-info">
        <span class="player-league-badge" style="background:${sportColor}22; color:${sportColor}; border:1px solid ${sportColor}44;">${league}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <h3 class="player-name">${fullName}</h3>
          <button class="copy-btn-mini" data-copy="${fullName}" title="Copiar nombre">📋</button>
        </div>
        <p class="player-team">${teamName || 'Agente Libre'}</p>
        <div class="player-tags">
          ${position !== '—' ? `<span class="player-tag">${position}</span>` : ''}
          ${!logoPath ? `<span class="player-tag vintage-tag">Equipo Histórico</span>` : ''}
        </div>
      </div>
      <button class="player-detail-btn" title="Ver detalles">→</button>
    </div>

  `;

  // Lógica de copiar
  const copyBtn = card.querySelector('.copy-btn-mini');
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullName);
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = "✅";
    setTimeout(() => copyBtn.innerHTML = originalText, 1500);
  });


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
  for (let i = 0; i < 8; i++) {
    const skel = document.createElement('div');
    skel.className = 'player-card skeleton';
    skel.innerHTML = `
      <div style="height: 120px;"></div>
    `;
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
