/**
 * auth.controller.js — Controlador de autenticación
 * 
 * Gestiona registro, login, actualización de perfil y consulta de usuarios
 * contra la base de datos MySQL. Las contraseñas se hashean con bcrypt.
 * 
 * Nota: Este controlador se complementa con Firebase Auth en el frontend
 * para la verificación de email y la protección de sesión única.
 * 
 * @author Andoni Villanueva
 */

      import bcrypt from "bcrypt";
      import fetch from "node-fetch";
      import { pool as db } from "../db.js"; // renombramos pool como db aquí

      export const register = async (req, res) => {
        const { username, email, password } = req.body;
        if (!username || !email || !password)
          return res.status(400).json({ error: "Faltan campos" });

        try {
          // Verificar si ya existe usuario o email
          const [existing] = await db.query(
            "SELECT * FROM users WHERE username = ? OR email = ?",
            [username, email]
          );

          if (existing.length > 0)
            return res.status(400).json({ error: "Usuario o email ya existe" });

          // Hashear contraseña
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insertar en BD
          await db.query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword]
          );

          res.json({ message: "Usuario registrado correctamente" });
        } catch (err) {
          console.error("Error en register:", err);
          res.status(500).json({ error: "Error registrando usuario" });
        }
      };

      export const login = async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password)
          return res.status(400).json({ error: "Faltan campos" });

        try {
          const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
          );

          if (rows.length === 0)
            return res.status(401).json({ error: "Credenciales incorrectas" });

          const user = rows[0];
          const valid = await bcrypt.compare(password, user.password);

          if (!valid)
            return res.status(401).json({ error: "Credenciales incorrectas" });

          res.json({
            message: "Login correcto",
            user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, bio: user.bio }
          });
        } catch (err) {
          console.error("Error en login:", err);
          res.status(500).json({ error: "Error iniciando sesión" });
        }
      };
      export const updateProfile = async (req, res) => {
    const { userId, username, password, bio, avatar } = req.body;

    if (!userId) return res.status(400).json({ error: "Falta userId" });

    try {
      const updates = [];
      const params = [];

      if (username) {
        updates.push("username = ?");
        params.push(username);
      }
      if (password) {
        const hashed = await bcrypt.hash(password, 10);
        updates.push("password = ?");
        params.push(hashed);
      }
      if (bio !== undefined) {
        updates.push("bio = ?");
        params.push(bio);
      }
      if (avatar !== undefined) {
        updates.push("avatar = ?");
        params.push(avatar);
      }

      if (updates.length === 0)
        return res.status(400).json({ error: "No hay datos a actualizar" });

      params.push(userId);

      await db.query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        params
      );

      // Devolver los datos actualizados
      const [rows] = await db.query("SELECT id, username, email, bio, avatar FROM users WHERE id = ?", [userId]);
      res.json({ message: "Perfil actualizado", user: rows[0] });

    } catch (err) {
      console.error("Error actualizando perfil:", err);
      res.status(500).json({ error: "Error actualizando perfil" });
    }
  };

  export const getUserProfile = async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(400).json({ error: "Falta ID" });

    try {
      const [rows] = await db.query(
        "SELECT id, username, email, bio, avatar FROM users WHERE id = ?",
        [id]
      );

      if (rows.length === 0)
        return res.status(404).json({ error: "Usuario no encontrado" });

      res.json({ user: rows[0] });
    } catch (err) {
      console.error("Error obteniendo perfil:", err);
      res.status(500).json({ error: "Error cargando perfil" });
    }
  };

  export const findEmailByUsername = async (req, res) => {
    const { username } = req.params;
    
    try {
      // 1. INTENTO CON FIRESTORE REST API (Para que funcione en Render/Nube)
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/proleague-b1b5c/databases/(default)/documents:runQuery`;
      const query = {
        structuredQuery: {
          from: [{ collectionId: "users" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "username" },
              op: "EQUAL",
              value: { stringValue: username }
            }
          },
          limit: 1
        }
      };

      const fsResponse = await fetch(firestoreUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query)
      });

      if (fsResponse.ok) {
        const results = await fsResponse.json();
        // Firestore runQuery devuelve un array. El primer elemento tiene el documento si existe.
        if (results && results.length > 0 && results[0].document) {
          const email = results[0].document.fields.email.stringValue;
          return res.json({ email });
        }
      }

      // 2. FALLBACK A MYSQL (Si Firestore falla o no encuentra, probamos local por si acaso)
      try {
        const [rows] = await db.query("SELECT email FROM users WHERE username = ?", [username]);
        if (rows.length > 0) {
          return res.json({ email: rows[0].email });
        }
      } catch (mysqlErr) {
        console.warn("MySQL lookup skipped or failed.");
      }

      return res.status(404).json({ error: "Usuario no encontrado en ningún sistema" });

    } catch (err) {
      console.error("Error global en findEmailByUsername:", err);
      res.status(500).json({ error: "Error interno del servidor al buscar usuario" });
    }
  };

