import { db } from "../config/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function initTrendingPlayers() {
    const container = document.getElementById("trending-container");
    if (!container) return;

    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const nbaCounts = {};
        const nflCounts = {};

        usersSnapshot.forEach(doc => {
            const data = doc.data();
            
            // NBA Dream Team
            if (data.dreamTeamNBA) {
                Object.values(data.dreamTeamNBA).forEach(player => {
                    if (player && player.id) {
                        const key = `${player.first_name} ${player.last_name}`;
                        nbaCounts[key] = (nbaCounts[key] || 0) + 1;
                    }
                });
            }

            // NFL Dream Team
            if (data.dreamTeamNFL) {
                Object.values(data.dreamTeamNFL).forEach(player => {
                    if (player && player.id) {
                        const key = `${player.first_name} ${player.last_name}`;
                        nflCounts[key] = (nflCounts[key] || 0) + 1;
                    }
                });
            }
        });

        // Ordenar y sacar Top 3 de cada
        const topNBA = Object.entries(nbaCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const topNFL = Object.entries(nflCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

        container.innerHTML = "";

        // Renderizar NBA
        if (topNBA.length > 0) {
            renderLeagueTrending(container, "NBA", topNBA, "nba-color");
        }
        
        // Renderizar NFL
        if (topNFL.length > 0) {
            renderLeagueTrending(container, "NFL", topNFL, "nfl-color");
        }

        if (topNBA.length === 0 && topNFL.length === 0) {
            container.innerHTML = "<p class='loading-trending'>Aún no hay suficientes datos de la comunidad.</p>";
        }

    } catch (error) {
        console.error("Error cargando tendencias:", error);
        container.innerHTML = "<p>Error analizando la comunidad.</p>";
    }
}

function renderLeagueTrending(container, league, players, colorClass) {
    if (players.length === 0) return;

    const sectionTitle = document.createElement("div");
    sectionTitle.className = "trending-league-title";
    sectionTitle.style.gridColumn = "1 / -1";
    sectionTitle.style.marginTop = league === "NFL" ? "40px" : "0";
    sectionTitle.style.textAlign = "left";
    sectionTitle.style.borderBottom = `2px solid ${league === 'NBA' ? 'var(--nba-red)' : 'var(--nfl-blue)'}`;
    sectionTitle.style.paddingBottom = "10px";
    sectionTitle.style.marginBottom = "20px";
    sectionTitle.innerHTML = `<h3 style="display:flex; align-items:center; gap:10px;">${league === 'NBA' ? '🏀' : '🏈'} Top Picks ${league}</h3>`;
    container.appendChild(sectionTitle);

    players.forEach(([name, count], index) => {
        const card = document.createElement("div");
        card.className = `trending-card ${colorClass}`;
        card.innerHTML = `
            <div class="trending-rank">#${index + 1}</div>
            <div class="trending-info">
                <h3>${name}</h3>
                <p>${count} ${count === 1 ? 'voto' : 'votos'}</p>
            </div>
            <div class="trending-icon">${league === 'NBA' ? '🏀' : '🏈'}</div>
        `;
        container.appendChild(card);
    });
}

initTrendingPlayers();
