import { db } from "../config/firebase-config.js";
import { API_BASE_URL, SOCKET_URL } from "../config/config.js";
import { initSessionGuard } from "../auth/session-guard.js";
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Inicializar protección de sesión única
initSessionGuard();

const socket = io(SOCKET_URL);
const userObj = JSON.parse(localStorage.getItem("user"));
const username = userObj ? userObj.username : "Anónimo";

// DOM Elements
const chatMessages = document.getElementById("chat-messages-container");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const currentRoomName = document.getElementById("current-room-name");
const channelItems = document.querySelectorAll(".channel-item");
const sidebarUsername = document.getElementById("sidebar-username");
const sidebarAvatar = document.getElementById("sidebar-avatar");

let currentRoom = "general";

// 1. INIT
document.addEventListener("DOMContentLoaded", () => {
    if (userObj) {
        sidebarUsername.textContent = username;
        sidebarAvatar.textContent = username.charAt(0).toUpperCase();
    }
    
    setupChannels();
    switchRoom("general");
});

function setupChannels() {
    channelItems.forEach(item => {
        item.onclick = () => {
            const room = item.getAttribute("data-room");
            if (room === currentRoom) return;

            // Update UI
            channelItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            
            switchRoom(room);
        };
    });
}

async function switchRoom(newRoom) {
    // Socket leave/join
    socket.emit("leaveRoom", currentRoom);
    currentRoom = newRoom;
    socket.emit("joinRoom", currentRoom);

    // UI Updates
    currentRoomName.textContent = newRoom;
    chatInput.placeholder = `Enviar mensaje a #${newRoom}...`;
    chatMessages.innerHTML = `<div class="loading-chat">Cargando #${newRoom}...</div>`;

    await loadChatHistory(newRoom);

    // 🤖 BOT: Mensaje de bienvenida con reglas
    setTimeout(() => {
        addMessageToDOM({
            user: "🤖 ProLeagueBot",
            text: `¡Bienvenido a #${newRoom}! 🏀🏈 Recuerda: mantén el respeto, evita insultos y disfruta del deporte. El chat se limpia automáticamente para mantener la fluidez.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        scrollToBottom();
    }, 1000);
}

// 2. FIRESTORE HISTORY
async function loadChatHistory(room) {
    try {
        const q = query(
            collection(db, "messages"),
            where("room", "==", room),
            orderBy("timestamp", "asc"),
            limit(50)
        );

        const querySnapshot = await getDocs(q);
        chatMessages.innerHTML = "";
        
        if (querySnapshot.empty) {
            chatMessages.innerHTML = `<div class="loading-chat">No hay mensajes en #${room}. ¡Sé el primero!</div>`;
        }

        querySnapshot.forEach((doc) => {
            addMessageToDOM(doc.data());
        });
        
        scrollToBottom();
    } catch (error) {
        console.error("Error historial:", error);
    }
}

// 3. SOCKET EVENTS
socket.on("message", (msg) => {
    // Si el mensaje es mío, ya lo añadí con el UI Optimista
    if (msg.user === username) return;

    if (msg.room === currentRoom) {
        const emptyMsg = chatMessages.querySelector(".loading-chat");
        if (emptyMsg) emptyMsg.remove();
        
        addMessageToDOM(msg);
        scrollToBottom();
    }
});


chatForm.onsubmit = async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const messageData = {
        user: username,
        text: text,
        room: currentRoom,
        time: time,
        timestamp: serverTimestamp()
    };

    // OPTIMISTIC UI
    addMessageToDOM({
        user: username,
        text: text,
        time: time
    });
    scrollToBottom();
    chatInput.value = "";

    try {
        addDoc(collection(db, "messages"), messageData).catch(err => console.error("Error backup:", err));
        socket.emit("chatMessage", { room: currentRoom, user: username, text, time });
    } catch (error) {
        console.error("Error envío:", error);
    }
};



function addMessageToDOM(msg) {
    const isMine = msg.user === username;
    const isBot = msg.user.includes("Bot");
    
    const msgDiv = document.createElement("div");
    msgDiv.className = `msg-v2 ${isMine ? 'mine' : ''} ${isBot ? 'bot-msg' : ''}`;
    
    const initial = msg.user.charAt(0).toUpperCase();
    
    msgDiv.innerHTML = `
        <div class="msg-avatar">${initial}</div>
        <div class="msg-body">
            <div class="msg-meta">
                <span class="name">${isMine ? 'Tú' : msg.user}</span>
                <span class="time">${msg.time || '--:--'}</span>
            </div>
            <div class="msg-text">${msg.text}</div>
        </div>
    `;
    
    chatMessages.appendChild(msgDiv);
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==========================================
// QoL: BOTÓN FLOTANTE PARA BAJAR EL CHAT
// ==========================================
const scrollDownBtn = document.createElement("button");
scrollDownBtn.innerHTML = "⬇️";
scrollDownBtn.className = "scroll-down-btn";
scrollDownBtn.style.cssText = `
    position: absolute;
    bottom: 80px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--primary-color);
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 100;
    transition: all 0.3s;
`;

const chatView = document.querySelector(".chat-view") || document.querySelector(".chat-content");
if (chatView) {
    chatView.appendChild(scrollDownBtn);
}


scrollDownBtn.onclick = scrollToBottom;

chatMessages.addEventListener("scroll", () => {
    // Mostrar si el usuario ha subido más de 100px desde el fondo
    const isAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 100;
    scrollDownBtn.style.display = isAtBottom ? "none" : "flex";
});
