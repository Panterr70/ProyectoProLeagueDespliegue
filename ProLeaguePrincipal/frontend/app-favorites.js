import { auth, db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, arrayRemove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ===============================
// TOAST UTILITY
// ===============================
function showToast(message, type = 'success', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]||'📢'}</span><span class="toast-message">${message}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-visible')));
  setTimeout(() => { toast.classList.remove('toast-visible'); toast.classList.add('toast-hiding'); setTimeout(() => toast.remove(), 400); }, duration);
}

// ===============================
// MAPAS DE LOGOS
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
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || (!user.uid && !user.id)) {
    window.location.href = "login.html";
    return;
  }

  await loadHeader();
  await loadFooter();

  cargarFavoritos(user.uid || user.id);
});

// ===============================
// HEADER / FOOTER
// ===============================
async function loadHeader() {
  const html = await fetch("header.html").then(r => r.text());
  document.getElementById("header-placeholder").innerHTML = html; 
}

async function loadFooter() {
  const html = await fetch("footer.html").then(r => r.text());
  document.getElementById("footer-placeholder").innerHTML = html;
}

// ===============================
// CARGAR FAVORITOS
// ===============================
async function cargarFavoritos(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const favoritos = userData.favorites || [];

    const contenedor = document.getElementById("favorites-list");
    contenedor.innerHTML = "";

    if (favoritos.length === 0) {
      contenedor.innerHTML = "<p>No tienes favoritos todavía ⭐</p>";
      return;
    }

    favoritos.forEach(fav => {
      const logo =
        fav.league === "NBA"
          ? nbaLogos[fav.teamName]
          : nflLogos[fav.teamName];

      const logoPath = logo
        ? `logos/${logo}`
        : "logos/default.png";

      const card = document.createElement("div");
      card.className = "team-card";
      card.innerHTML = `
        <div class="team-card-inner">
          <div class="team-card-front">
            <img class="team-logo" src="${logoPath}" alt="${fav.teamName}">
            <div class="team-name">${fav.teamName}</div>
            <div class="team-info">Liga: ${fav.league}</div>
            <button class="remove-fav">❌ Quitar</button>
          </div>
        </div>
      `;

      contenedor.appendChild(card);

      card.querySelector(".remove-fav").addEventListener("click", async (e) => {
        e.stopPropagation();

        try {
          const userRef = doc(db, "users", uid);
          await updateDoc(userRef, {
            favorites: arrayRemove(fav)
          });

          card.style.transition = "opacity 0.3s, transform 0.3s";
          card.style.opacity = "0";
          card.style.transform = "scale(0.9)";
          setTimeout(() => card.remove(), 300);
          showToast(`${fav.teamName} eliminado de favoritos`, 'info');
        } catch (err) {
          console.error(err);
          showToast("Error al quitar favorito", 'error');
        }
      });
    });

  } catch (err) {
    console.error("❌ Error cargando favoritos:", err);
  }
}
