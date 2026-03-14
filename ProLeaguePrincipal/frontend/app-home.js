// =======================
// AUTH & STATE
// =======================
const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "login.html";

let currentFilter = "all";

// =======================
// CUSTOM CURSOR
// =======================
function initCustomCursor() {
  const cursor = document.createElement("div");
  const dot = document.createElement("div");
  cursor.className = "custom-cursor";
  dot.className = "custom-cursor-dot";
  document.body.appendChild(cursor);
  document.body.appendChild(dot);

  document.addEventListener("mousemove", (e) => {
    cursor.style.transform = `translate(${e.clientX - 10}px, ${e.clientY - 10}px)`;
    dot.style.transform = `translate(${e.clientX - 2}px, ${e.clientY - 2}px)`;
  });

  document.querySelectorAll("a, button, .dot, .nav-logo").forEach(el => {
    el.addEventListener("mouseenter", () => cursor.style.transform += " scale(2)");
    el.addEventListener("mouseleave", () => cursor.style.transform = cursor.style.transform.replace(" scale(2)", ""));
  });
}
initCustomCursor();

// =======================
// FAVORITES BADGE
// =======================
function updateFavBadge() {
  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  const badge = document.getElementById("fav-badge");
  const favLink = document.getElementById("nav-favorites");
  
  if (!favLink) return; // Header not loaded yet

  if (favorites.length > 0) {
    if (badge) {
      badge.textContent = favorites.length;
      badge.style.display = "inline-block";
    }
    favLink.style.display = "inline";
  } else {
    if (badge) badge.style.display = "none";
    favLink.style.display = "inline"; 
  }
}

// =======================
// HERO SLIDER
// =======================
let currentSlide = 0;
const slides = document.querySelectorAll(".hero-slider .slide");
const dotsContainer = document.getElementById("slider-dots");

function createDots() {
  slides.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "dot" + (i === 0 ? " active" : "");
    dot.addEventListener("click", () => {
      currentSlide = i;
      showSlide(currentSlide);
    });
    dotsContainer.appendChild(dot);
  });
}

function showSlide(index) {
  slides.forEach((s, i) => s.classList.toggle("active", i === index));
  const dots = document.querySelectorAll(".dot");
  dots.forEach((d, i) => d.classList.toggle("active", i === index));
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

if (slides.length > 0) {
  createDots();
  showSlide(0);
  setInterval(nextSlide, 5000);
}

// =======================
// SPORTS CLOCK (ET Time)
// =======================
function updateClock() {
  const options = {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  };
  const formatter = new Intl.DateTimeFormat([], options);
  const timeStr = formatter.format(new Date());
  const clockEl = document.getElementById("clock-time");
  if (clockEl) clockEl.textContent = timeStr;
}
setInterval(updateClock, 1000);
updateClock();

// =======================
// NEWS SEARCH & FILTERING
// =======================
const searchInput = document.getElementById("news-search");
let allNewsCards = [];

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    filterNews(term, currentFilter);
  });
}

function filterNews(term = "", category = "all") {
  allNewsCards.forEach(card => {
    const title = card.querySelector("h3").textContent.toLowerCase();
    const desc = card.querySelector("p").textContent.toLowerCase();
    const matchesTerm = title.includes(term) || desc.includes(term);
    const matchesCat = category === "all" || card.classList.contains(category);
    
    card.style.display = (matchesTerm && matchesCat) ? "block" : "none";
  });
}

// =======================
// SKELETON SCREENS
// =======================
const newsList = document.getElementById("news-list");

function showSkeletons() {
  newsList.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const skel = document.createElement("div");
    skel.className = "news-card skeleton";
    skel.style.height = "250px";
    newsList.appendChild(skel);
  }
}

// =======================
// SCOREBOARD
// =======================
async function cargarScoreboard() {
  const ticker = document.getElementById("games-ticker");
  if (!ticker) return;

  try {
    const [nbaRes, nflRes] = await Promise.all([
      fetch("http://localhost:3000/api/nba/games").catch(() => null),
      fetch("http://localhost:3000/api/nfl/games").catch(() => null)
    ]);

    let games = [];
    if (nbaRes && nbaRes.ok) {
      const nbaData = await nbaRes.json();
      games = games.concat(nbaData.map(g => ({ ...g, sport: 'NBA' })));
    }
    if (nflRes && nflRes.ok) {
      const nflData = await nflRes.json();
      games = games.concat(nflData.map(g => ({ ...g, sport: 'NFL' })));
    }

    // Ordenar de más reciente a más antiguo
    games.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (games.length === 0) {
      ticker.innerHTML = '<p style="color: #94a3b8; font-style: italic; margin: 0 auto;">No hay resultados recientes de la NBA o NFL.</p>';
      return;
    }

    ticker.innerHTML = "";
    
    // Equilibrar: cogemos hasta 8 NBA + hasta 7 NFL para asegurar que salgan ambas ligas
    const nbaGames = games.filter(g => g.sport === 'NBA').slice(0, 8);
    const nflGames = games.filter(g => g.sport === 'NFL').slice(0, 7);
    const gamesDisplay = [...nbaGames, ...nflGames].sort((a, b) => new Date(b.date) - new Date(a.date));

    gamesDisplay.forEach(game => {
      const isNBA = game.sport === 'NBA';
      const gameDate = new Date(game.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      
      // Defensa contra objetos nulos
      const homeTeam = game.home_team || {};
      const visitorTeam = game.visitor_team || {};
      const homeAbbr = homeTeam.abbreviation || homeTeam.name || '---';
      const visitorAbbr = visitorTeam.abbreviation || visitorTeam.name || '---';
      
      const hScore = game.home_team_score ?? '?';
      const vScore = game.visitor_team_score ?? '?';

      const isHomeWinner = Number(hScore) > Number(vScore);
      const isVisitorWinner = Number(vScore) > Number(hScore);
      const sportColor = isNBA ? '#ff3b3b' : '#3b82f6';

      const card = document.createElement("div");
      card.className = "sb-card";
      card.dataset.sport = game.sport;
      
      card.style.cssText = `
        min-width: 210px;
        background: rgba(30, 41, 59, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.05);
        border-top: 2px solid ${sportColor};
        border-radius: 12px;
        padding: 12px 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        transition: transform 0.3s, background 0.3s, border-color 0.3s, opacity 0.3s;
        cursor: default;
      `;
      
      card.onmouseenter = () => {
        card.style.background = 'rgba(40, 52, 75, 0.9)';
        card.style.boxShadow = `0 8px 20px ${sportColor}40`;
      };
      card.onmouseleave = () => {
        card.style.background = 'rgba(30, 41, 59, 0.7)';
        card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
      };
      
      card.innerHTML = `
        <div style="font-size: 0.75em; color: #94a3b8; display: flex; justify-content: space-between; margin-bottom: 2px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
          <span style="font-weight: 800; color: ${sportColor};">${game.sport}</span>
          <span>${gameDate} - FINAL</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; color: ${isVisitorWinner ? '#fff' : '#94a3b8'}; font-weight: ${isVisitorWinner ? 'bold' : 'normal'}; margin-top: 5px;">
          <span style="font-size: 1.1em;">${visitorAbbr}</span>
          <span style="font-size: 1.25em;">${vScore}</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; color: ${isHomeWinner ? '#fff' : '#94a3b8'}; font-weight: ${isHomeWinner ? 'bold' : 'normal'};">
          <span style="font-size: 1.1em;">${homeAbbr}</span>
          <span style="font-size: 1.25em;">${hScore}</span>
        </div>
      `;
      
      ticker.appendChild(card);
    });
    
  } catch (err) {
    console.error("Error Scoreboard:", err);
    ticker.innerHTML = '<p style="color: #f87171; font-style: italic; margin: 0 auto;">Error cargando resultados</p>';
  }
}

// Filtros funcionales para el Scoreboard
function instanciarFiltrosScoreboard() {
  const btns = document.querySelectorAll(".sb-filter-btn");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Remover clase activo
      btns.forEach(b => {
        b.classList.remove("active");
        b.style.background = "rgba(255,255,255,0.1)";
        b.style.color = "#fff";
      });
      // Setear clase activo
      btn.classList.add("active");
      btn.style.background = "var(--primary-color)";
      btn.style.color = "#000";

      const sportFiltro = btn.dataset.sb;
      const cards = document.querySelectorAll(".sb-card");

      cards.forEach(card => {
        if (sportFiltro === "all" || card.dataset.sport === sportFiltro) {
          card.style.display = "flex";
          setTimeout(() => card.style.opacity = "1", 50);
        } else {
          card.style.opacity = "0";
          setTimeout(() => card.style.display = "none", 300);
        }
      });
    });
  });
}

// Empezamos la carga asincrónica al instante
cargarScoreboard().then(instanciarFiltrosScoreboard);

// =======================
// CARGAR NOTICIAS (RSS)
// =======================
const RSS_FEEDS = [
  { url: "https://www.espn.com/espn/rss/nba/news", category: "NBA" },
  { url: "https://www.espn.com/espn/rss/nfl/news", category: "NFL" }
];

async function loadRSS(feed) {
  try {
    const res = await fetch(`http://localhost:3000/api/news?category=${feed.category.toLowerCase()}`);
    if (!res.ok) throw new Error("Error al cargar noticias");
    
    const items = await res.json();
    return items.map(item => ({ ...item, category: feed.category }));
  } catch (err) {
    console.error("Error RSS", feed.category, err);
    return [];
  }
}

async function initNews() {
  showSkeletons();
  
  const results = await Promise.all(RSS_FEEDS.map(feed => loadRSS(feed)));
  const allItems = results.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  
  newsList.innerHTML = "";
  allItems.forEach((item, index) => {
    const category = item.category;
    const image = category === "NBA" ? "images/nba-logo.png" : "images/nfl-logo.png";

    const card = document.createElement("div");
    card.className = `news-card ${category.toLowerCase()}`;
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
      <img src="${image}" alt="${category}" loading="lazy" onerror="this.src='https://via.placeholder.com/50'">
      <div class="news-card-content">
        <span class="news-tag ${category.toLowerCase()}">${category}</span>
        <h3>${item.title}</h3>
        <p>${item.description.replace(/<[^>]*>?/gm, "").slice(0, 140)}...</p>
        <div class="news-footer">
          <a href="${item.link}" target="_blank">Leer más →</a>
          <small>${item.pubDate ? new Date(item.pubDate).toLocaleDateString() : ""}</small>
        </div>
      </div>
    `;

    newsList.appendChild(card);
    allNewsCards.push(card);
  });
}

// Initial load
initNews();
updateFavBadge();

function updateNavLinks() {
  const logoutLink = document.getElementById("nav-logout");
  const chatLink = document.getElementById("nav-chat");
  const profileLink = document.getElementById("nav-profile");

  if (user && logoutLink) {
    logoutLink.style.display = "inline";
    if (chatLink) chatLink.style.display = "inline";
    if (profileLink) profileLink.style.display = "inline";
    
    logoutLink.addEventListener("click", e => {
      e.preventDefault();
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }
}

// Poll for header load (simple way without changing home.html script much)
const headerCheck = setInterval(() => {
  if (document.getElementById("nav-home")) {
    updateFavBadge();
    updateNavLinks();
    clearInterval(headerCheck);
  }
}, 100);

// Update filter buttons to use global filterNews
const filterButtons = document.querySelectorAll(".filter-btn");
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    filterNews(searchInput ? searchInput.value.toLowerCase() : "", currentFilter);
  });
});

