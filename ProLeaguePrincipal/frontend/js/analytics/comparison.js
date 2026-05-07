import { API_BASE_URL } from "../config/config.js";
import { showToast } from "../utils/toast.js";

let player1 = null;
let player2 = null;
let comparisonChart = null;

const p1Search = document.getElementById("p1-search");
const p2Search = document.getElementById("p2-search");
const p1Results = document.getElementById("p1-results");
const p2Results = document.getElementById("p2-results");

// =======================
// SEARCH LOGIC
// =======================
async function searchPlayers(query, resultUl, pNumber) {
    if (query.length < 3) {
        resultUl.innerHTML = "";
        return;
    }

    try {
        // Buscamos primero en NBA
        const res = await fetch(`http://localhost:3000/api/nba/players?search=${query}`);
        const players = await res.json();

        resultUl.innerHTML = "";
        players.slice(0, 5).forEach(p => {
            const li = document.createElement("li");
            li.textContent = `${p.first_name} ${p.last_name} (${p.team.abbreviation})`;
            li.onclick = () => selectPlayer(p, pNumber, 'NBA');
            resultUl.appendChild(li);
        });
    } catch (err) {
        console.error(err);
    }
}

p1Search.oninput = (e) => searchPlayers(e.target.value, p1Results, 1);
p2Search.oninput = (e) => searchPlayers(e.target.value, p2Results, 2);

// =======================
// SELECTION
// =======================
async function selectPlayer(player, pNumber, league) {
    // Fetch detailed stats
    let stats = null;
    if (league === 'NBA') {
        const res = await fetch(`${API_BASE_URL}/api/nba/stats?playerId=${player.id}`);
        stats = await res.json();
    }

    const playerData = { ...player, stats, league };
    
    if (pNumber === 1) {
        player1 = playerData;
        p1Search.value = `${player.first_name} ${player.last_name}`;
        p1Results.innerHTML = "";
        renderMiniCard(player1, "p1-card-small");
    } else {
        player2 = playerData;
        p2Search.value = `${player.first_name} ${player.last_name}`;
        p2Results.innerHTML = "";
        renderMiniCard(player2, "p2-card-small");
    }

    if (player1 && player2) {
        if (!player1.stats || !player2.stats) {
            showToast("Uno de los jugadores seleccionados no tiene estadísticas disponibles para esta temporada.", "info");
        }
        performComparison();
    }
}

function renderMiniCard(p, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="mini-card">
            <strong>${p.first_name} ${p.last_name}</strong>
            <span>${p.team.full_name}</span>
            <small>${p.position} | ${p.height || 'N/A'}</small>
        </div>
    `;
}

// =======================
// COMPARISON
// =======================
function performComparison() {
    document.getElementById("no-data-msg").style.display = "none";
    document.getElementById("comparison-results").style.display = "grid";

    renderStatsTable();
    updateChart();
}

function renderStatsTable() {
    const table = document.getElementById("stats-comparison-table");
    const s1 = player1.stats || {};
    const s2 = player2.stats || {};

    const rows = [
        { label: "Puntos", v1: s1.pts || 0, v2: s2.pts || 0 },
        { label: "Rebotes", v1: s1.reb || 0, v2: s2.reb || 0 },
        { label: "Asistencias", v1: s1.ast || 0, v2: s2.ast || 0 },
        { label: "Robos", v1: s1.stl || 0, v2: s2.stl || 0 },
        { label: "Tapones", v1: s1.blk || 0, v2: s2.blk || 0 },
        { label: "Minutos", v1: s1.min || '0', v2: s2.min || '0' },
        { label: "FG %", v1: ((s1.fg_pct || 0) * 100).toFixed(1), v2: ((s2.fg_pct || 0) * 100).toFixed(1) }
    ];

    table.innerHTML = `
        <div class="stats-row header">
            <div class="stat-val-1">${player1.last_name}</div>
            <div class="stat-label">VS</div>
            <div class="stat-val-2">${player2.last_name}</div>
        </div>
    `;

    rows.forEach(row => {
        const val1 = parseFloat(row.v1);
        const val2 = parseFloat(row.v2);
        const win1 = val1 > val2;
        const win2 = val2 > val1;

        table.innerHTML += `
            <div class="stats-row">
                <div class="stat-value ${win1 ? 'winner' : ''}">${row.v1}</div>
                <div class="stat-label">${row.label}</div>
                <div class="stat-value ${win2 ? 'winner' : ''}">${row.v2}</div>
            </div>
        `;
    });
}

function updateChart() {
    const ctx = document.getElementById("comparison-chart").getContext("2d");
    const s1 = player1.stats || {};
    const s2 = player2.stats || {};

    const labels = ["PTS", "REB", "AST", "STL", "BLK"];
    // Normalización aproximada para Radar Chart (máximos típicos)
    const data1 = [s1.pts || 0, (s1.reb || 0) * 2, (s1.ast || 0) * 2, (s1.stl || 0) * 10, (s1.blk || 0) * 10];
    const data2 = [s2.pts || 0, (s2.reb || 0) * 2, (s2.ast || 0) * 2, (s2.stl || 0) * 10, (s2.blk || 0) * 10];

    if (comparisonChart) comparisonChart.destroy();

    comparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: player1.last_name,
                    data: data1,
                    backgroundColor: 'rgba(0, 242, 255, 0.2)',
                    borderColor: '#00f2ff',
                    pointBackgroundColor: '#00f2ff'
                },
                {
                    label: player2.last_name,
                    data: data2,
                    backgroundColor: 'rgba(255, 0, 200, 0.2)',
                    borderColor: '#ff00c8',
                    pointBackgroundColor: '#ff00c8'
                }
            ]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: '#94a3b8', font: { size: 12 } },
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });
}
