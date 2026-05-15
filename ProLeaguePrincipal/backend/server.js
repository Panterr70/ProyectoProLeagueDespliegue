/**
 * server.js — Servidor principal de ProLeague
 * 
 * Arquitectura: Express + Socket.io + MySQL + APIs externas
 * 
 * Funciones principales:
 * - API REST proxy para datos de BallDontLie (equipos, jugadores, stats NBA/NFL)
 * - API REST proxy para clasificaciones ESPN (standings NBA/NFL)
 * - Proxy RSS para noticias deportivas (ESPN)
 * - Chat en tiempo real con WebSockets (Socket.io)
 * - Bot automático (ProLeagueBot)
 * - Autenticación de usuarios (registro, login, perfil) contra MySQL
 * - Subida de avatares (Multer)
 * - Sistema de caché para evitar errores 429 (Too Many Requests)
 * 
 * @author Andoni Villanueva
 */

import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { exec } from "child_process";
import { pool as db } from "./db.js";

import newsRoutes from "./routes/news.routes.js";
import authRoutes from "./routes/auth.routes.js";
import multer from "multer";
import fs from "fs";

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(express.json());

// Servir archivos estáticos (Avatares)
app.use("/uploads", express.static("uploads"));

const allowedOrigins = [
  "https://proyecto-pro-league-despliegue.vercel.app",
  "https://proyecto-pro-league-despliegue-avillanurr10s-projects.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

// Middleware extra para asegurar cabeceras en cada respuesta (Brute force CORS)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && origin.endsWith(".vercel.app"))) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Config Multer para subida local de avatares
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Endpoint para subir avatar local (para ahorrar en Firebase Storage)
app.post("/api/auth/upload-avatar/:uid", upload.single("avatar"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo" });
  const avatarUrl = `/uploads/${req.file.filename}`;
  res.json({ avatarUrl });
});


const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
    credentials: true
  },
});

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "../frontend")));

// Rutas
app.use("/api/news", newsRoutes);
app.use("/api/auth", authRoutes);


// Ruta principal
app.get("/", (req, res) => {
  res.send("ProLeague backend funcionando");
});

// =======================
// CHAT - SOCKET.IO
// =======================
// Almacén temporal de mensajes (se pierde al reiniciar server)
const messages = {
  nba: [],
  nfl: [],
};

io.on("connection", (socket) => {

  // Unirse a una sala (nba o nfl)
  socket.on("joinRoom", (room) => {
    if (room !== "nba" && room !== "nfl") return;

    socket.join(room);

    // Enviar historial
    socket.emit("loadMessages", { room, messages: messages[room] });

    // [BOT] Mensaje de bienvenida personal
    const welcomeText = room === 'nba' ? "¡Bienvenido al chat NBA! <span class='material-icons' style='font-size:16px; vertical-align:middle; color:#ff8c00;'>sports_basketball</span>" : "¡Bienvenido al chat NFL! <span class='material-icons' style='font-size:16px; vertical-align:middle; color:#5271ff;'>sports_football</span>";
    socket.emit("message", {
      user: "ProLeagueBot",
      text: `${welcomeText} <span class='material-icons' style='font-size:16px; vertical-align:middle;'>star</span>`,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      room
    });

    // [BOT] Avisar a otros (opcional, puede ser spam)
    // socket.to(room).emit("message", { user: "ProLeagueBot", text: "Un nuevo usuario se ha unido.", ... });
  });

  // Recibir mensaje
  socket.on("chatMessage", (data) => {
    const { room, user, text } = data;
    if (!room || !user || !text) return;

    const newMessage = {
      user,
      text,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      room 
    };

    // Guardar en memoria
    if (messages[room]) {
      messages[room].push(newMessage);
      if (messages[room].length > 50) messages[room].shift();
    }

    // Emitir a todos en la sala
    io.to(room).emit("message", newMessage);
  });

  socket.on("newsComment", (data) => {
    const { username, title, text, category } = data;
    const room = category.toLowerCase(); // 'nba' o 'nfl'
    
    const botMsg = {
      user: "ProLeagueBot",
      text: `¡${username} ha comentado en la noticia: "${title}"! <span class='material-icons' style='font-size:16px; vertical-align:middle; color:#00f2ff;'>chat_bubble</span> "${text}"`,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      room
    };

    io.to(room).emit("message", botMsg);
  });

  socket.on("disconnect", () => {
  });
});

// [BOT] Eventos automáticos (Simulación)
setInterval(() => {
  const rooms = ["nba", "nfl"];
  rooms.forEach(room => {
    const events = [
      "<span class='material-icons' style='font-size:16px; vertical-align:middle; color:#ffc107;'>campaign</span> Recordatorio: El respeto es la base de nuestra comunidad. ¡Hablemos de deporte!",
      "<span class='material-icons' style='font-size:16px; vertical-align:middle; color:#00f2ff;'>cleaning_services</span> Info: El historial del chat se refresca periódicamente.",
      "<span class='material-icons' style='font-size:16px; vertical-align:middle; color:#ef4444;'>block</span> Prohibido: Insultos o toxicidad. El Bot está vigilando...",
      "<span class='material-icons' style='font-size:16px; vertical-align:middle; color:#4ade80;'>assessment</span> Tip: Usa los comparadores de jugadores para ganar tus debates.",
      "<span class='material-icons' style='font-size:16px; vertical-align:middle; color:#5271ff;'>diamond</span> ProLeague: El sitio oficial de los fans de la NBA y NFL."
    ];
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    const botMsg = {
      user: "ProLeagueBot",
      text: randomEvent,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      room
    };

    // No guardamos esto en el historial para no ensuciar, o sí. Decidimos NO guardar.
    // Solo emitir
    io.to(room).emit("message", botMsg);
  });
}, 45000); // Cada 45 segundos


// =======================
// API CACHE SYSTEM (Fix for 429 Errors)
// =======================
const apiCache = {
  nbaTeams: { data: null, timestamp: 0 },
  nflTeams: { data: null, timestamp: 0 },
  nbaGames: { data: null, timestamp: 0 },
  nflGames: { data: null, timestamp: 0 },
  players: new Map() // Cache para búsquedas frecuentes
};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora de caché

// Helper para peticiones con caché
async function fetchWithCache(cacheKey, url, axiosConfig) {
  const now = Date.now();
  const cacheEntry = apiCache[cacheKey];

  // Si tenemos datos en caché y no han expirado, devolverlos
  if (cacheEntry && cacheEntry.data && (now - cacheEntry.timestamp < CACHE_DURATION)) {
    console.log(`[Cache] Sirviendo ${cacheKey} desde caché.`);
    return cacheEntry.data;
  }

  try {
    const response = await axios.get(url, axiosConfig);
    const data = response.data.data;
    
    // Guardar en caché
    apiCache[cacheKey] = { data, timestamp: now };
    console.log(`✅ ${cacheKey} actualizado desde API.`);
    return data;
  } catch (err) {
    if (err.response?.status === 429 && cacheEntry && cacheEntry.data) {
      console.warn(`[API] API saturada (429). Rescatando ${cacheKey} de la última caché disponible.`);
      return cacheEntry.data;
    }
    throw err;
  }
}

// =======================
// NBA - EQUIPOS
// =======================
app.get("/api/nba/teams", async (req, res) => {
  try {
    const data = await fetchWithCache("nbaTeams", "https://api.balldontlie.io/v1/teams", {
      headers: { Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}` },
    });
    res.json(data || []);
  } catch (err) {
    console.error("❌ Error NBA Teams API:", err.message);
    res.status(500).json([]); // Devolvemos array vacío para evitar errores de .forEach en el front
  }
});

// =======================
// NFL - EQUIPOS
// =======================
app.get("/api/nfl/teams", async (req, res) => {
  try {
    const data = await fetchWithCache("nflTeams", "https://api.balldontlie.io/nfl/v1/teams", {
      headers: { Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}` },
    });
    res.json(data || []);
  } catch (err) {
    console.error("❌ Error NFL Teams API:", err.message);
    res.status(500).json([]);
  }
});

// =======================
// NFL - JUGADORES (Con Caché básica por búsqueda)
// =======================
app.get("/api/nfl/players", async (req, res) => {
  const { teamId, search } = req.query;
  const cacheKey = `nfl-p-${teamId || 'no'}-${search || 'no'}`;
  const now = Date.now();

  if (apiCache.players.has(cacheKey)) {
    const entry = apiCache.players.get(cacheKey);
    if (now - entry.timestamp < 1800000) return res.json(entry.data);
  }
  
  try {
    const params = new URLSearchParams();
    if (teamId) params.append("team_ids[]", teamId);
    if (search) params.append("search", search);
    params.append("per_page", 100);

    const url = `https://api.balldontlie.io/nfl/v1/players?${params.toString()}`;
    console.log(`[NFL] Query: ${url}`);

    const response = await axios.get(url, { 
      headers: { Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}` } 
    });

    const players = response.data.data || [];
    apiCache.players.set(cacheKey, { data: players, timestamp: now });
    res.json(players);
  } catch (err) {
    console.error("❌ Error NFL Players:", err.message);
    if (apiCache.players.has(cacheKey)) {
      return res.json(apiCache.players.get(cacheKey).data);
    }
    res.json([]); 
  }
});

// =======================
// NBA - CLASIFICACIÓN (ESPN no suele dar 429, pero lo dejamos igual)
// =======================
app.get("/api/nba/standings", async (req, res) => {
  try {
    const response = await axios.get("https://site.api.espn.com/apis/v2/sports/basketball/nba/standings");
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "No se pudo cargar" });
  }
});

// =======================
// NBA - JUGADORES
// =======================
app.get("/api/nba/players", async (req, res) => {
  const { teamId, search } = req.query;
  const cacheKey = `nba-p-${teamId || 'no'}-${search || 'no'}`;
  const now = Date.now();

  if (apiCache.players.has(cacheKey)) {
    const entry = apiCache.players.get(cacheKey);
    if (now - entry.timestamp < 1800000) return res.json(entry.data);
  }

  try {
    const params = new URLSearchParams();
    if (teamId) params.append("team_ids[]", teamId);
    if (search) params.append("search", search);
    params.append("per_page", 100);

    const url = `https://api.balldontlie.io/v1/players?${params.toString()}`;
    console.log(`[NBA] Query: ${url}`);

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}` }
    });

    const players = response.data.data || [];
    apiCache.players.set(cacheKey, { data: players, timestamp: now });
    res.json(players);
  } catch (err) {
    console.error("❌ Error NBA Players:", err.message);
    if (apiCache.players.has(cacheKey)) {
      return res.json(apiCache.players.get(cacheKey).data);
    }
    res.json([]);
  }
});



// =======================
// NBA - ESTADÍSTICAS
// =======================
app.get("/api/nba/stats", async (req, res) => {
  const { playerId } = req.query;
  const currentSeason = 2025; // Temporada actual para el año 2026
  try {
    const response = await axios.get(
      `https://api.balldontlie.io/v1/season_averages?season=${currentSeason}&player_ids[]=${playerId}`,
      { headers: { Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}` } }
    );
    res.json(response.data.data?.[0] || null);
  } catch (err) {
    res.json(null);
  }
});

// =======================
// NBA - PARTIDOS RECIENTES
// =======================
app.get("/api/nba/games", async (req, res) => {
  try {
    const now = Date.now();
    if (apiCache.nbaGames.data && (now - apiCache.nbaGames.timestamp < CACHE_DURATION)) {
      return res.json(apiCache.nbaGames.data);
    }

    const today = new Date();
    const startDateDate = new Date(today.getTime() - (10 * 24 * 60 * 60 * 1000));
    const startDate = startDateDate.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const response = await axios.get(
      `https://api.balldontlie.io/v1/games?start_date=${startDate}&end_date=${endDate}&per_page=100`,
      { headers: { Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}` } }
    );

    let games = response.data.data.filter(g => g.status === "Final");
    games.sort((a, b) => new Date(b.date) - new Date(a.date));
    const result = games.slice(0, 15);

    apiCache.nbaGames = { data: result, timestamp: now };
    res.json(result);
  } catch (err) {
    if (err.response?.status === 429 && apiCache.nbaGames.data) {
      return res.json(apiCache.nbaGames.data);
    }
    res.status(500).json([]);
  }
});

// =======================
// NFL - CLASIFICACIÓN
// =======================
app.get("/api/nfl/standings", async (req, res) => {
  try {
    const response = await axios.get("https://site.api.espn.com/apis/v2/sports/football/nfl/standings");
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Error NFL" });
  }
});

// =======================
// NFL - PARTIDOS RECIENTES
// =======================
app.get("/api/nfl/games", async (req, res) => {
  try {
    const now = Date.now();
    if (apiCache.nflGames.data && (now - apiCache.nflGames.timestamp < CACHE_DURATION)) {
      return res.json(apiCache.nflGames.data);
    }

    const response = await axios.get(
      `https://api.balldontlie.io/nfl/v1/games?seasons[]=2025&postseason=true&per_page=100`,
      { headers: { Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}` } }
    );

    let games = response.data.data.filter(g => g.status === "Final");
    games.sort((a, b) => new Date(b.date) - new Date(a.date));
    const result = games.slice(0, 15);

    apiCache.nflGames = { data: result, timestamp: now };
    res.json(result);
  } catch (err) {
    if (err.response?.status === 429 && apiCache.nflGames.data) {
      return res.json(apiCache.nflGames.data);
    }
    res.status(500).json([]);
  }
});

// Puerto
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`✅ Backend (Socket.io) activo en http://localhost:${PORT}`);
  const frontendUrl = `http://localhost:${PORT}/vistas/auth/register.html`;
  console.log(`Abriendo aplicación en: ${frontendUrl}`);
  const startCmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  exec(`${startCmd} ${frontendUrl}`);
});
