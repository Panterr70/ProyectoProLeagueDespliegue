# 🗺️ MAPA FUNCIONAL - ProLeague

Este documento sirve como guía rápida para navegar por el código y las funcionalidades de ProLeague. Ideal para responder preguntas del tribunal.

---

## 1. 🔐 SISTEMA DE AUTENTICACIÓN (Dual)

ProLeague usa un sistema híbrido para maximizar la seguridad y funcionalidad.

- **Backend (MySQL):** Gestiona el registro y login básico (username, email, password hasheado con bcrypt).
  - *Archivo clave:* `backend/controllers/auth.controller.js`
- **Frontend (Firebase Auth):** Gestiona la verificación de email y las reglas de seguridad de la base de datos en tiempo real.
  - *Archivo clave:* `frontend/js/auth/login.js` y `register.js`
- **Session Guard:** Protege que no haya dos personas con la misma cuenta a la vez.
  - *Archivo clave:* `frontend/js/auth/session-guard.js` (Usa `onSnapshot` de Firestore).

---

## 2. 🏠 HOME & DASHBOARD

La pantalla principal centraliza la información más reciente.

- **Scoreboard (Resultados):** Muestra los últimos 15 partidos finalizados de NBA y NFL.
  - *Lógica:* `app-home.js` -> `cargarScoreboard()`
  - *API:* Proxy en `server.js` (`/api/nba/games` y `/api/nfl/games`) con **caché de 1 hora**.
- **Noticias (RSS):** Noticias en tiempo real de ESPN.
  - *Backend:* `backend/controllers/news.controller.js` (Usa `cheerio` para parsear el XML).
  - *Frontend:* `app-home.js` -> `cargarNoticias()`
- **Interacciones (Likes/Comments):** Sistema en tiempo real sobre las noticias.
  - *Tecnología:* Firebase Firestore (`onSnapshot`).
  - *Lógica:* `app-home.js` -> `setupInteractions()`

---

## 3. 🏀🏈 MÓDULOS DE LIGAS (NBA / NFL)

Pantallas dedicadas a cada deporte con datos profundos.

- **Clasificaciones (Standings):** Tablas interactivas con victorias, derrotas y %.
  - *API:* ESPN API (vía proxy en `server.js`).
  - *Gráficos:* Chart.js (Barras para Top 5, Radar para rendimiento, Doughnut para Win/Loss).
- **Listado de Equipos:** Tarjetas con efecto hover (glassmorphism).
  - *Logos:* Centralizados en `frontend/js/config/logos-config.js`.
  - *Favoritos:* Guardados en la colección `users` -> `favorites` de Firestore.

---

## 4. 👥 COMUNIDAD & SOCIAL

- **Chat en Tiempo Real:** 3 salas (General, NBA, NFL).
  - *Tecnología:* Socket.io (tiempo real) + Firestore (historial persistente).
  - *Bot:* `ProLeagueBot` en `server.js` envía mensajes automáticos cada 45s.
- **Búsqueda de Usuarios:** Filtro en tiempo real de todos los usuarios registrados.
  - *Lógica:* `search-users.js` consultando la colección `users` de Firestore.
- **Perfiles Públicos:** Permite ver el Dream Team y los favoritos de otros usuarios.
  - *Lógica:* `public-profile.js`.

---

## 5. 📊 HERRAMIENTAS ANALÍTICAS (Premium)

- **Dream Team Builder:** Creación de equipos ideales sobre un campo visual.
  - *Lógica:* `dreamteam.js`.
  - *QoL:* Guardado con Ctrl+S, aviso de cambios sin guardar, sugerencias trending.
- **Comparador de Jugadores:** Búsqueda de dos jugadores y comparativa estadística.
  - *Gráfico:* Chart.js Radar Chart.
  - *Caché:* El backend cachea las búsquedas de jugadores para evitar errores 429.
- **Trending Players:** Muestra qué jugadores son los más elegidos por la comunidad.
  - *Lógica:* `trending.js` (Escanea todos los Dream Teams de la DB).

---

## 🛠️ RESUMEN TÉCNICO PARA PREGUNTAS

- **¿Cómo evitas que la API se bloquee (Error 429)?**
  - "He implementado un sistema de **caché en el backend** (Node.js) que guarda las respuestas de la API por 1 hora. También tengo una caché en memoria para las búsquedas de jugadores."
- **¿Por qué usas MySQL y Firestore a la vez?**
  - "MySQL para la gestión de usuarios tradicional y Firestore por su capacidad de **actualización en tiempo real** para el chat y las interacciones sociales sin necesidad de refrescar la página."
- **¿Cómo funciona el tiempo real del chat?**
  - "Uso **Socket.io** para la entrega inmediata del mensaje y **Firestore** para que, cuando un usuario entre, pueda ver los últimos 50 mensajes de historial."
- **¿Tu web es segura?**
  - "Sí. Las contraseñas están hasheadas con **bcrypt**, uso **JWT** (conceptualmente), verificación de email obligatoria y un **Session Guard** que impide logins simultáneos."
