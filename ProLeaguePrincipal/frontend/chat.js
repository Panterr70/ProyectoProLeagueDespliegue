// Conexión con el backend (Socket.io)
const socket = io("http://localhost:3000");

// Obtener usuario del localStorage
const userObj = JSON.parse(localStorage.getItem("user"));
const username = userObj ? userObj.username : "Anónimo";

// Referencias al DOM
const nbaMessagesDiv = document.getElementById("nba-messages");
const nbaForm = document.getElementById("nba-form");
const nbaInput = document.getElementById("nba-input");

const nflMessagesDiv = document.getElementById("nfl-messages");
const nflForm = document.getElementById("nfl-form");
const nflInput = document.getElementById("nfl-input");

// Unirse a las salas al conectar
socket.on("connect", () => {
  socket.emit("joinRoom", "nba");
  socket.emit("joinRoom", "nfl");
});

// Cargar mensajes históricos (cuando nos unimos)
socket.on("loadMessages", (messages) => {
 

});

// Manejar nuevo mensaje
socket.on("message", (msg) => {
  // msg debería tener { user, text, time, room } (añadiré room en server)
  addMessageToDOM(msg, msg.room);
});

// Listeners de envío
nbaForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = nbaInput.value.trim();
  if (!text) return;
  
  // Emitir
  socket.emit("chatMessage", { room: "nba", user: username, text });
  
  // Limpiar
  nbaInput.value = "";
  nbaInput.focus();
});

nflForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = nflInput.value.trim();
  if (!text) return;
  
  socket.emit("chatMessage", { room: "nfl", user: username, text });
  
  nflInput.value = "";
  nflInput.focus();
});


// Función DOM
function addMessageToDOM(msg, room) {
  const container = room === "nba" ? nbaMessagesDiv : nflMessagesDiv;
  if (!container) return;

  const div = document.createElement("div");
  div.classList.add("message");
  
  // Diferenciar remitente
  let userLabel = msg.user;
  if (msg.user === username) {
    div.classList.add("my-message");
    userLabel = "Tú";
  } else if (msg.user.includes("Bot")) {
    div.classList.add("bot-message");
  } else {
    div.classList.add("other-message");
  }
  
  div.innerHTML = `
    <div class="meta">
      <span class="username">${userLabel}</span>
      <span class="time">${msg.time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
    </div>
    <p class="text">${msg.text}</p>
  `;
  
  container.appendChild(div);
  
  // Scroll suave al final
  container.scrollTo({
    top: container.scrollHeight,
    behavior: 'smooth'
  });
}

// Historial (Revisar lógica server)
socket.on("loadMessages", (data) => {
  // data es { room: 'nba', messages: [] }
  if(data.room && data.messages) {
    const container = data.room === "nba" ? nbaMessagesDiv : nflMessagesDiv;
    container.innerHTML = ""; // Limpiar antes de cargar historial
    data.messages.forEach(m => addMessageToDOM(m, data.room));
  }
});
