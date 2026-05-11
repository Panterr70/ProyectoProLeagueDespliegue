/**
 * config.js — Configuración de URLs de la aplicación
 * 
 * Detecta automáticamente si la app se ejecuta en local o producción
 * y selecciona la URL del backend correspondiente.
 * 
 * Producción: Backend desplegado en Render
 * Desarrollo: Backend local en localhost:3000
 * 
 * @author Andoni Villanueva
 */

const isProduction = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

export const API_BASE_URL = isProduction 
    ? "https://proleague-backend.onrender.com" 
    : "http://localhost:3000";

export const SOCKET_URL = isProduction
    ? "https://proleague-backend.onrender.com"
    : "http://localhost:3000";
