import { db } from "../config/firebase-config.js";
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

const socket = io("http://localhost:3000");

const userObj = JSON.parse(localStorage.getItem("user"));
const username = userObj ? userObj.username : "Anónimo";

const nbaMessagesDiv = document.getElementById("nba-messages");
const nbaForm = document.getElementById("nba-form");
const nbaInput = document.getElementById("nba-input");

const nflMessagesDiv = document.getElementById("nfl-messages");
const nflForm = document.getElementById("nfl-form");
const nflInput = document.getElementById("nfl-input");

// 1. CARGAR HISTORIAL DESDE FIRESTORE
async function loadChatHistory(room) {
    const container = room === "nba" ? nbaMessagesDiv : nflMessagesDiv;
    try {
        const q = query(
            collection(db, "messages"),
            where("room", "==", room),
            orderBy("timestamp", "asc"),
            limit(50)
        );

        const querySnapshot = await getDocs(q);
        container.innerHTML = "";
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            addMessageToDOM(data, room);
        });
    } catch (error) {
        console.error("Error Firestore:", error);
    }
}

loadChatHistory("nba");
loadChatHistory("nfl");

// 2. SOCKET.IO (Real-time y Bot)
socket.on("connect", () => {
    socket.emit("joinRoom", "nba");
    socket.emit("joinRoom", "nfl");
});

socket.on("message", (msg) => {
    addMessageToDOM(msg, msg.room);
});

// 3. ENVIAR MENSAJE
async function sendMessage(room, input) {
    const text = input.value.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const messageData = {
        user: username,
        text: text,
        room: room,
        time: time,
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "messages"), messageData);
        socket.emit("chatMessage", { room, user: username, text, time });
        input.value = "";
        input.focus();
    } catch (error) {
        console.error("Error enviando mensaje:", error);
    }
}

nbaForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage("nba", nbaInput);
});

nflForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage("nfl", nflInput);
});

function addMessageToDOM(msg, room) {
    const container = room === "nba" ? nbaMessagesDiv : nflMessagesDiv;
    if (!container) return;

    const div = document.createElement("div");
    div.classList.add("message");
    
    if (msg.user === username) {
        div.classList.add("my-message");
    } else if (msg.user.includes("Bot")) {
        div.classList.add("bot-message");
    } else {
        div.classList.add("other-message");
    }
    
    div.innerHTML = `
        <div class="meta">
            <span class="username">${msg.user === username ? "Tú" : msg.user}</span>
            <span class="time">${msg.time || "--:--"}</span>
        </div>
        <p class="text">${msg.text}</p>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}
