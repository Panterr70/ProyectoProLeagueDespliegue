import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { pool as db } from "./db.js";

import authRoutes from "./routes/auth.routes.js";
import favoritesRoutes from "./routes/favorites.routes.js";
import newsRoutes from "./routes/news.routes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Ajustar en producción si es necesario
    methods: ["GET", "POST"],
  },
});

const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/news", newsRoutes);

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
  console.log("Nuevo cliente conectado:", socket.id);

  // Unirse a una sala (nba o nfl)
  socket.on("joinRoom", (room) => {
    if (room !== "nba" && room !== "nfl") return;

    socket.join(room);
    console.log(`Socket ${socket.id} se unió a ${room}`);

    // Enviar historial
    socket.emit("loadMessages", { room, messages: messages[room] });

    // 🤖 BOT: Mensaje de bienvenida personal
    const welcomeText = room === 'nba' ? "¡Bienvenido al chat NBA! 🏀" : "¡Bienvenido al chat NFL! 🏈";
    socket.emit("message", {
      user: "🤖 ProLeagueBot",
      text: welcomeText,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      room
    });

    // 🤖 BOT: Avisar a otros (opcional, puede ser spam)
    // socket.to(room).emit("message", { user: "🤖 ProLeagueBot", text: "Un nuevo usuario se ha unido.", ... });
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

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// 🤖 BOT: Eventos automáticos (Simulación)
setInterval(() => {
  const rooms = ["nba", "nfl"];
  rooms.forEach(room => {
    const events = [
      "📢 Recordatorio: Mantened el respeto en el chat.",
      "📊 ¿Sabías que? Puedes ver las estadísticas en la pestaña principal.",
      "🔥 ¡El partido está al rojo vivo!",
      "👀 ¡Ojo a esa jugada!",
      "🤖 Soy un bot, pero disfruto del deporte."
    ];
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    const botMsg = {
      user: "🤖 ProLeagueBot",
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
// NBA - EQUIPOS
// =======================
app.get("/api/nba/teams", async (req, res) => {
  try {
    const response = await axios.get("https://api.balldontlie.io/v1/teams", {
      headers: {
        Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
      },
    });

    res.json(response.data.data);
  } catch (err) {
    console.error("Error obteniendo equipos NBA:", err.message);
    res.status(500).json({ error: "Error obteniendo equipos NBA" });
  }
});

// =======================
// NFL - EQUIPOS
// =======================
app.get("/api/nfl/teams", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.balldontlie.io/nfl/v1/teams",
      {
        headers: {
          Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}`,
        },
      },
    );

    res.json(response.data.data);
  } catch (err) {
    console.error("Error obteniendo equipos NFL:", err.message);
    res.status(500).json({ error: "Error obteniendo equipos NFL" });
  }
});

// =======================
// NFL - JUGADORES POR EQUIPO
// =======================
app.get("/api/nfl/players", async (req, res) => {
  const { teamId } = req.query;
  if (!teamId) return res.status(400).json({ error: "teamId requerido" });

  try {
    const params = new URLSearchParams({
      "team_ids[]": teamId,
      per_page: 100
    });

    const response = await axios.get(
      `https://api.balldontlie.io/nfl/v1/players?${params}`,
      { headers: { Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}` } }
    );

    const data = response.data.data;
    res.json(data);
  } catch (err) {
    console.error("Error obteniendo jugadores NFL:", err.message);
    res.status(500).json({ error: "No se pudieron cargar los jugadores de NFL" });
  }
});
// =======================
// NBA - CLASIFICACIÓN
// =======================
app.get("/api/nba/standings", async (req, res) => {
  try {
    const response = await axios.get(
      "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings"
    );

    // Enviamos los datos crudos al frontend
    res.json(response.data);
  } catch (err) {
    console.error("Error obteniendo clasificación NBA:", err.message);
    res.status(500).json({ error: "No se pudo cargar la clasificación NBA" });
  }
});

// =======================
// NBA - JUGADORES POR EQUIPO
// =======================
app.get("/api/nba/players", async (req, res) => {
  const { teamId } = req.query;
  if (!teamId) return res.status(400).json({ error: "teamId requerido" });

  try {
    const params = new URLSearchParams({
      "team_ids[]": teamId,
      per_page: 100
    });

    const response = await axios.get(
      `https://api.balldontlie.io/v1/players?${params}`,
      { headers: { Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}` } }
    );

    // En la versión gratuita recogemos los 100 primeros que devuelva la API
    const data = response.data.data;
    
    res.json(data);
  } catch (err) {
    console.error("Error obteniendo jugadores NBA:", err.message);
    res.status(500).json({ error: "No se pudo cargar los jugadores" });
  }
});

// =======================
// NBA - PARTIDOS RECIENTES
// =======================
app.get("/api/nba/games", async (req, res) => {
  try {
    const today = new Date();
    // NBA: para asegurar que entran en 1 página de 100, sacamos últimos 10 días (aprox 70 partidos)
    const startDateDate = new Date(today.getTime() - (10 * 24 * 60 * 60 * 1000));
    const startDate = startDateDate.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const params = new URLSearchParams({
      "start_date": startDate,
      "end_date": endDate,
      "per_page": 100 
    });

    const response = await axios.get(
      `https://api.balldontlie.io/v1/games?${params}`,
      { headers: { Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}` } }
    );

    let games = response.data.data.filter(g => g.status === "Final");
    games.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(games.slice(0, 15));

  } catch (err) {
    console.error("Error obteniendo resultados de partidos NBA:", err.message);
    res.status(500).json({ error: "No se pudieron cargar los últimos partidos" });
  }
});

// =======================
// NFL - CLASIFICACIÓN
// =======================
app.get("/api/nfl/standings", async (req, res) => {
  try {
    const response = await axios.get(
      "https://site.api.espn.com/apis/v2/sports/football/nfl/standings"
    );

    res.json(response.data);
  } catch (err) {
    console.error("Error obteniendo clasificación NFL:", err.message);
    res.status(500).json({ error: "No se pudo cargar la clasificación NFL" });
  }
});

// =======================
// NFL - PARTIDOS RECIENTES
// =======================
app.get("/api/nfl/games", async (req, res) => {
  try {
    const today = new Date();
    // NFL temporal: para traer los verdaderos últimos partidos de la temporada que acaba en 2026
    // pedimos directamente la fase de postemporada.
    const params = new URLSearchParams({
      "seasons[]": 2025,
      "postseason": true,
      "per_page": 100 
    });

    const response = await axios.get(
      `https://api.balldontlie.io/nfl/v1/games?${params}`,
      { headers: { Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}` } }
    );

    let games = response.data.data.filter(g => g.status === "Final");
    games.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(games.slice(0, 15));

  } catch (err) {
    console.error("Error obteniendo resultados NFL:", err.message);
    res.status(500).json({ error: "No se pudieron cargar los últimos partidos de NFL" });
  }
});
// Puerto
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`✅ Backend (Socket.io) activo en http://localhost:${PORT}`);
});
