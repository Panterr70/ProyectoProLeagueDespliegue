/**
 * db.js — Conexión a la base de datos MySQL
 * 
 * Pool de conexiones para la autenticación de usuarios.
 * Los datos de usuario avanzados (favoritos, dream teams, etc.)
 * se gestionan en Firebase Cloud Firestore desde el frontend.
 * 
 * @author Andoni Villanueva
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
