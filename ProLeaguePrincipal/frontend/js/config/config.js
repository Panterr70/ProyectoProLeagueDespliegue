const isProduction = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

export const API_BASE_URL = isProduction 
    ? "https://tu-backend-proleague.onrender.com" // Esto lo cambiaremos luego
    : "http://localhost:3000";

export const SOCKET_URL = isProduction
    ? "https://tu-backend-proleague.onrender.com"
    : "http://localhost:3000";
