const isProduction = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

export const API_BASE_URL = isProduction 
    ? "https://proleague-backend.onrender.com" 
    : "http://localhost:3000";

export const SOCKET_URL = isProduction
    ? "https://proleague-backend.onrender.com"
    : "http://localhost:3000";
