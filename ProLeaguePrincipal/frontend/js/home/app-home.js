import { db, auth } from "../config/firebase-config.js";
import { API_BASE_URL } from "../config/config.js";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initSessionGuard } from "../auth/session-guard.js";

// Inicializar protección de sesión única
initSessionGuard();

// =======================
// SOCKET SETUP
// =======================
window.socket = typeof io !== 'undefined' ? io(API_BASE_URL) : null;

// =======================
// TOAST UTILITY
// =======================
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
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-visible')));
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// =======================
// LOGO MAPS (Scoreboard)
// =======================
const SB_NBA_LOGOS = {
  "Atlanta Hawks": "ATL.png",
  "Boston Celtics": "BOS.png",
  "Brooklyn Nets": "BKN.png",
  "Charlotte Hornets": "CHA.png",
  "Chicago Bulls": "CHI.png",
  "Cleveland Cavaliers": "CLE.png",
  "Dallas Mavericks": "DAL.png",
  "Denver Nuggets": "DEN.png",
  "Detroit Pistons": "DET.png",
  "Golden State Warriors": "GSW.png",
  "Houston Rockets": "HOU.png",
  "Indiana Pacers": "IND.png",
  "Los Angeles Clippers": "LAC.png",
  "Los Angeles Lakers": "LAL.png",
  "Memphis Grizzlies": "MEM.png",
  "Miami Heat": "MIA.png",
  "Milwaukee Bucks": "MIL.png",
  "Minnesota Timberwolves": "MIN.png",
  "New Orleans Pelicans": "NOP.png",
  "New York Knicks": "NYK.png",
  "Oklahoma City Thunder": "OKC.png",
  "Orlando Magic": "ORL.png",
  "Philadelphia 76ers": "PHI.png",
  "Phoenix Suns": "PHX.png",
  "Portland Trail Blazers": "POR.png",
  "Sacramento Kings": "SAC.png",
  "San Antonio Spurs": "SAS.png",
  "Toronto Raptors": "TOR.png",
  "Utah Jazz": "UTA.png",
  "Washington Wizards": "WIZ.png"
};
const SB_NFL_LOGOS = {
  "Arizona Cardinals": "NFL_ARI.png",
  "Atlanta Falcons": "NFL_ATL.png",
  "Baltimore Ravens": "NFL_BAL.png",
  "Buffalo Bills": "NFL_BUF.png",
  "Carolina Panthers": "NFL_CAR.png",
  "Chicago Bears": "NFL_CHI.svg",
  "Cincinnati Bengals": "NFL_CIN.png",
  "Cleveland Browns": "NFL_CLE.png",
  "Dallas Cowboys": "NFL_DAL.svg",
  "Denver Broncos": "NFL_DEN.svg",
  "Detroit Lions": "NFL_DET.png",
  "Green Bay Packers": "NFL_GB.png",
  "Houston Texans": "NFL_HOU.png",
  "Indianapolis Colts": "NFL_IND.svg",
  "Jacksonville Jaguars": "NFL_JAX.png",
  "Kansas City Chiefs": "NFL_KC.png",
  "Las Vegas Raiders": "NFL_LV.png",
  "Los Angeles Chargers": "NFL_LAC.png",
  "Los Angeles Rams": "NFL_LAR.png",
  "Miami Dolphins": "NFL_MIA.png",
  "Minnesota Vikings": "NFL_MIN.png",
  "New England Patriots": "NFL_NE.png",
  "New Orleans Saints": "NFL_NO.png",
  "New York Giants": "NFL_NYG.png",
  "New York Jets": "NFL_NYJ.svg",
  "Philadelphia Eagles": "NFL_PHI.png",
  "Pittsburgh Steelers": "NFL_PIT.png",
  "San Francisco 49ers": "NFL_SF.svg",
  "Seattle Seahawks": "NFL_SEA.png",
  "Tampa Bay Buccaneers": "NFL_TB.svg",
  "Tennessee Titans": "NFL_TEN.svg",
  "Washington Commanders": "NFL_WAS.png"
};


function getSbLogoImg(teamName, isNBA) {
  const map = isNBA ? SB_NBA_LOGOS : SB_NFL_LOGOS;
  const file = map[teamName];
  if (!file) return '';
  return `<img src="../../logos/${file}" class="sb-team-logo" alt="${teamName}" onerror="this.style.display='none'">`;
}

// =======================
// AUTH & STATE
// =======================
const user = JSON.parse(localStorage.getItem("user"));
if (!user) {
  window.location.href = "../auth/login.html";
} else {
  // Comprobar verificación en segundo plano (QoL: Seguridad extra)
  auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      await firebaseUser.reload();
      if (!firebaseUser.emailVerified) {
        console.warn("Usuario no verificado detectado en Home. Redirigiendo...");
        localStorage.removeItem("user");
        window.location.href = "../auth/login.html";
      }
    }
  });
}

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
    skel.style.minHeight = "250px";
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
      fetch(`${API_BASE_URL}/api/nba/games`).catch(() => null),
      fetch(`${API_BASE_URL}/api/nfl/games`).catch(() => null)
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
      
      const visitorLogoImg = getSbLogoImg(visitorTeam.full_name || visitorTeam.name || '', isNBA);
      const homeLogoImg = getSbLogoImg(homeTeam.full_name || homeTeam.name || '', isNBA);

      card.innerHTML = `
        <div style="font-size: 0.75em; color: #94a3b8; display: flex; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
          <span style="font-weight: 800; color: ${sportColor};">${game.sport}</span>
          <span>${gameDate} · FINAL</span>
        </div>

        <div class="sb-card-body">
          <div class="sb-team-row" style="justify-content: space-between; color: ${isVisitorWinner ? '#fff' : '#94a3b8'}; font-weight: ${isVisitorWinner ? '700' : '400'};">
            <div style="display:flex; align-items:center; gap:7px;">
              ${visitorLogoImg}
              <span style="font-size: 1em;">${visitorAbbr}</span>
              ${isVisitorWinner ? '<span style="font-size:0.7em; color:' + sportColor + '; background:' + sportColor + '22; padding:1px 6px; border-radius:8px; font-weight:800;">W</span>' : ''}
            </div>
            <span style="font-size: 1.25em; min-width:28px; text-align:right;">${vScore}</span>
          </div>

          <div class="sb-team-row" style="justify-content: space-between; color: ${isHomeWinner ? '#fff' : '#94a3b8'}; font-weight: ${isHomeWinner ? '700' : '400'};">
            <div style="display:flex; align-items:center; gap:7px;">
              ${homeLogoImg}
              <span style="font-size: 1em;">${homeAbbr}</span>
              ${isHomeWinner ? '<span style="font-size:0.7em; color:' + sportColor + '; background:' + sportColor + '22; padding:1px 6px; border-radius:8px; font-weight:800;">W</span>' : ''}
            </div>
            <span style="font-size: 1.25em; min-width:28px; text-align:right;">${hScore}</span>
          </div>
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
    const res = await fetch(`${API_BASE_URL}/api/news?category=${feed.category.toLowerCase()}`);
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
    const image = category === "NBA" ? "../../images/nba-logo.png" : "../../images/nfl-logo.png";
    const newsId = btoa(item.link).replace(/[^a-zA-Z0-9]/g, "").slice(-50); // ID único real (usamos el final del base64)

    const card = document.createElement("div");
    card.className = `news-card ${category.toLowerCase()}`;
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
      <img src="${image}" alt="${category}" loading="lazy" onerror="this.src='../../logos/logo-png.png'">
      <div class="news-card-content">
        <span class="news-tag ${category.toLowerCase()}">${category}</span>
        <h3>${item.title}</h3>
        <p>${item.description.replace(/<[^>]*>?/gm, "").slice(0, 140)}...</p>
        <div class="news-footer">
          <a href="${item.link}" target="_blank">Leer más →</a>
          <small>${item.pubDate ? new Date(item.pubDate).toLocaleDateString() : ""}</small>
        </div>

        <div class="news-interactions">
          <button class="interaction-btn like-btn" data-id="${newsId}">
             <span class="like-icon">🤍</span> <span class="like-count">0</span>
          </button>
          <button class="interaction-btn comment-btn" data-id="${newsId}">
             💬 Comentar
          </button>
        </div>

        <div class="comments-container" style="display: none;" id="comments-${newsId}">
          <div class="comments-list"></div>
          <div class="comment-input-group">
            <input type="text" class="comment-input" placeholder="Escribe un comentario...">
            <button class="comment-submit" data-id="${newsId}">Enviar</button>
          </div>
        </div>
      </div>
    `;

    newsList.appendChild(card);
    allNewsCards.push(card);
    
    setupNewsInteractions(card, newsId, item.title, category);
  });
}

function setupNewsInteractions(card, newsId, title, category) {
    const likeBtn = card.querySelector(".like-btn");
    const commentBtn = card.querySelector(".comment-btn");
    const commentsContainer = card.querySelector(".comments-container");
    const commentSubmit = card.querySelector(".comment-submit");
    const commentInput = card.querySelector(".comment-input");
    const commentsList = card.querySelector(".comments-list");

    // Escuchar cambios en tiempo real
    onSnapshot(doc(db, "news_interactions", newsId), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const likes = data.likes || [];
            const comments = data.comments || [];

            likeBtn.querySelector(".like-count").textContent = likes.length;
            if (likes.includes(user.uid)) {
                likeBtn.classList.add("liked");
                likeBtn.querySelector(".like-icon").textContent = "❤️";
            } else {
                likeBtn.classList.remove("liked");
                likeBtn.querySelector(".like-icon").textContent = "🤍";
            }

            commentsList.innerHTML = comments.map(c => `
                <div class="comment-item">
                    <span class="comment-author">${c.username}:</span> ${c.text}
                </div>
            `).join("");
            
            // Auto-scroll al último comentario
            setTimeout(() => {
                commentsList.scrollTop = commentsList.scrollHeight;
            }, 100);
        }
    }, (err) => {
        // Silenciamos el spam si no hay permisos, el usuario debe actualizar las reglas
        if (err.code === 'permission-denied') {
            likeBtn.title = "Actualiza las reglas de Firestore para interactuar";
        }
    });

    likeBtn.onclick = async () => {
        const docRef = doc(db, "news_interactions", newsId);
        const docSnap = await getDoc(docRef);
        let likes = [];
        
        if (docSnap.exists()) {
            likes = docSnap.data().likes || [];
        }

        if (likes.includes(user.uid)) {
            // Quitar like
            likes = likes.filter(id => id !== user.uid);
        } else {
            // Dar like
            likes.push(user.uid);
        }

        if (!docSnap.exists()) {
            await setDoc(docRef, { likes, comments: [] });
        } else {
            await updateDoc(docRef, { likes });
        }
    };

    commentBtn.onclick = () => {
        const isVisible = commentsContainer.style.display === "block";
        commentsContainer.style.display = isVisible ? "none" : "block";
    };

    commentSubmit.onclick = async () => {
        const text = commentInput.value.trim();
        if (!text) return;

        const docRef = doc(db, "news_interactions", newsId);
        const newComment = {
            uid: user.uid,
            username: user.username || "Anonimo",
            text: text,
            date: new Date().toISOString()
        };

        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            await setDoc(docRef, { likes: [], comments: [newComment] });
        } else {
            await updateDoc(docRef, { comments: arrayUnion(newComment) });
        }

        commentInput.value = "";
        showToast("¡Comentario publicado!", "success");

        // Opcional: Emitir a socket.io si está cargado
        if (window.socket && window.socket.emit) {
            window.socket.emit("newsComment", {
                username: user.username,
                title: title,
                text: text,
                category: category
            });
        }
    };
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
      auth.signOut();
      localStorage.removeItem("user");
      window.location.href = "../auth/login.html";
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

