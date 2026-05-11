-- ========================================
-- ProLeague - Schema de Base de Datos
-- Autor: Andoni Villanueva
-- ========================================

CREATE DATABASE IF NOT EXISTS proleague;
USE proleague;

-- Tabla principal de usuarios (autenticación backend)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  bio TEXT DEFAULT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de equipos favoritos (legacy — migrado a Firestore)
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  league VARCHAR(10) NOT NULL,
  team_id VARCHAR(50) NOT NULL,
  team_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_fav (user_id, league, team_id)
);