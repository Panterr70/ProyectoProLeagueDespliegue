# Memoria del Proyecto — ProLeague

## 1. Portada

- **Alumno:** Andoni Villanueva Urrestarazu
- **Ciclo:** Desarrollo de Aplicaciones Multiplataforma — 2º curso
- **Proyecto:** ProLeague
- **Centro:** Maria Ana Sanz 2025-2026

---

## 2. Índice

1. Portada
2. Índice
3. Resumen / Abstract
4. Descripción y justificación del proyecto
5. Objetivos del proyecto (PMV + Ampliaciones)
6. Recursos hardware, software y arquitectura
7. Fases del desarrollo
8. Conclusiones
9. Bibliografía y referencias

---

## 3. Resumen

ProLeague es una plataforma web educativa y recreativa diseñada para el análisis y seguimiento de ligas deportivas profesionales (NBA y NFL) desde una perspectiva analítica. La aplicación centraliza estadísticas detalladas, clasificaciones en tiempo real, resultados recientes (scoreboard), noticias RSS, un sistema de comunidad con chat en vivo, perfiles públicos, búsqueda de usuarios, Dream Team personalizable y comparador de jugadores con gráficos interactivos.

La aplicación está desarrollada bajo una arquitectura cliente-servidor híbrida:
- **Backend:** Node.js con Express, desplegado en Render.
- **Base de datos dual:** MySQL (autenticación básica) + Firebase Cloud Firestore (perfiles, favoritos, dream teams, chat persistente, interacciones de noticias, sesiones).
- **Autenticación:** Sistema dual Backend + Firebase Auth con verificación de email obligatoria y protección de sesión única (Session Guard).
- **Comunicación en tiempo real:** WebSockets (Socket.io) para el chat + Firestore onSnapshot para likes/comentarios en tiempo real.
- **Frontend:** HTML5, CSS3 (Glassmorphism, dark mode), JavaScript Vanilla con módulos ES6.
- **Visualización de datos:** Chart.js (gráficos radar para comparador de jugadores).
- **APIs externas:** BallDontLie (equipos y jugadores NBA/NFL), ESPN (clasificaciones y partidos), ESPN RSS (noticias).
- **Despliegue:** Frontend en Vercel, Backend en Render.

### Abstract

ProLeague is an educational and recreational web platform designed for analytical monitoring of professional sports leagues (NBA and NFL). The application centralizes detailed statistics, real-time standings, recent game scores, RSS news feeds, and integrates community features including live chat, public user profiles, a customizable Dream Team builder, and an interactive player comparison tool with radar charts.

The system follows a hybrid client-server architecture using Node.js/Express as the backend (deployed on Render), a dual database approach with MySQL for basic authentication and Firebase Cloud Firestore for user profiles, favorites, dream teams, persistent chat history, and news interactions. Authentication is handled through a dual Backend + Firebase Auth system with mandatory email verification and single-session protection. Real-time communication uses Socket.io for chat and Firestore listeners for live interactions. The frontend is built with standard web technologies (HTML5, CSS3, Vanilla JavaScript with ES6 modules) and Chart.js for data visualization. The platform is deployed with the frontend on Vercel and the backend on Render.

---

## 4. Descripción y justificación del proyecto

ProLeague es un dashboard deportivo interactivo que permite a los usuarios consultar el estado actual de las ligas NBA y NFL, visualizar estadísticas de equipos y jugadores, comparar jugadores con gráficos radar, crear su Dream Team ideal, participar en una comunidad a través de un chat en tiempo real con historial persistente, interactuar con noticias (likes y comentarios en tiempo real), y visitar perfiles de otros usuarios.

### 4.1. Justificación de la necesidad

- **Problema detectado:** Falta de plataformas que fomenten la interpretación de datos estadísticos y el debate comunitario sin el ruido de las apuestas deportivas.
- **Necesidad:** Los aficionados analíticos requieren herramientas visuales (gráficos, comparativas, dream teams) que no solo digan "quién ganó", sino que permitan analizar el rendimiento.
- **Beneficio:** ProLeague ofrece una interfaz limpia, libre de publicidad de apuestas, centrada en la visualización de datos y la interacción social.

### 4.2. Comparativa con soluciones existentes

| Característica | ProLeague | NBA/NFL Apps Oficiales | Flashscore/Apuestas |
|---|---|---|---|
| Enfoque | Educativo / Analítico | Informativo / Comercial | Resultados / Apuestas |
| Comunidad | Chat en tiempo real + Perfiles + Comentarios | Limitada | Inexistente |
| Visualización | Gráficos interactivos (Chart.js) + Comparador | Tablas estáticas | Solo números |
| Dream Team | ✅ NBA + NFL personalizable | ❌ | ❌ |
| Interfaz | Moderna (Glassmorphism, Dark Mode) | Corporativa | Utilitaria |
| Coste | Gratuito | Parcialmente gratuito | Monetización por apuestas |

---

## 5. Objetivos del proyecto

### 5.1. Producto Mínimo Viable (PMV) — COMPLETADO ✅

- **[AUTH-01]** Registro de usuarios (username, email, password hasheado con bcrypt).
- **[AUTH-02]** Inicio de sesión seguro (Backend + Firebase Auth).
- **[AUTH-03]** Verificación de email obligatoria (Firebase Auth).
- **[AUTH-04]** Protección de sesión única — Session Guard (Firestore onSnapshot).
- **[DATA-01]** Obtención de listado de equipos NBA y NFL (BallDontLie API).
- **[DATA-02]** Clasificaciones en tiempo real NBA y NFL (ESPN API).
- **[DATA-03]** Resultados/Scoreboard de partidos recientes (BallDontLie API).
- **[DATA-04]** Noticias deportivas en tiempo real (ESPN RSS, parseado con Cheerio).
- **[CHAT-01]** Chat en tiempo real con salas separadas (Socket.io + Firestore persistente).
- **[CHAT-02]** Bot automático de sistema (ProLeagueBot).
- **[USER-01]** Perfil de usuario editable (avatar, bio, credenciales).
- **[USER-02]** Equipos favoritos (añadir/eliminar, almacenados en Firestore).
- **[RESP-01]** Interfaz responsiva (escritorio, tablet, móvil con menú hamburguesa).
- **[UX-01]** Sistema de notificaciones toast (reemplazando alerts nativos del navegador).

### 5.2. Ampliaciones implementadas (más allá del PMV) ✅

- **[AMP-01]** Dream Team Builder: Quinteto NBA (PG, SG, SF, PF, C) y Ofensiva NFL (QB, RB, WR1, WR2, TE) con campo visual interactivo.
- **[AMP-02]** Comparador de jugadores: Búsqueda de 2 jugadores NBA, tabla comparativa + gráfico radar (Chart.js).
- **[AMP-03]** Trending Players: Análisis de los jugadores más elegidos por la comunidad en sus Dream Teams.
- **[AMP-04]** Perfiles públicos: Cualquier usuario puede ver el Dream Team y favoritos de otro.
- **[AMP-05]** Búsqueda de usuarios: Directorio de la comunidad con filtrado en vivo.
- **[AMP-06]** Interacciones en noticias: Likes y comentarios en tiempo real (Firestore onSnapshot).
- **[AMP-07]** Scoreboard: Resultados recientes de NBA y NFL con logos, filtros por liga y diseño premium.
- **[AMP-08]** Hero Slider animado en la página principal.
- **[AMP-09]** Reloj deportivo (hora ET — Eastern Time de EEUU).
- **[AMP-10]** Sistema de caché en el backend para evitar errores 429 de las APIs externas.
- **[AMP-11]** Skeleton loading screens en búsquedas.
- **[AMP-12]** Cursor personalizado en la home.
- **[AMP-13]** Protección de cambios sin guardar (beforeunload) en Dream Team y Perfil.
- **[AMP-14]** Atajos de teclado (Ctrl+S para guardar Dream Team).
- **[AMP-15]** Modales de confirmación premium (reemplazando confirm() nativos).
- **[AMP-16]** Despliegue completo en producción: Frontend (Vercel) + Backend (Render).
- **[AMP-17]** Búsqueda inteligente de jugadores: detecta nombres de equipos y filtra automáticamente.
- **[AMP-18]** Sugerencias trending en el Dream Team Builder basadas en la comunidad.

---

## 6. Recursos hardware, software y arquitectura

### 6.1. Recursos necesarios

**Hardware:**
- Portátil de desarrollo (Windows 11).
- Servidores cloud: Render (backend), Vercel (frontend), Firebase (BaaS).

**Software:**
- IDE: Visual Studio Code.
- Base de datos: MySQL (local/cloud) + Firebase Cloud Firestore.
- Control de versiones: Git y GitHub.
- Navegadores: Chrome / Edge para depuración.
- Node.js v18+ y npm.

**Dependencias del proyecto (package.json):**
- `express` — Framework web del backend.
- `axios` — Peticiones HTTP a APIs externas.
- `cors` — Middleware de seguridad CORS.
- `dotenv` — Variables de entorno.
- `bcrypt` — Hasheo de contraseñas.
- `jsonwebtoken` — Tokens JWT (preparado).
- `mysql2` — Conexión a MySQL.
- `socket.io` — Comunicación WebSocket en tiempo real.
- `multer` — Subida de archivos (avatares).
- `cheerio` — Parseo de XML/RSS (noticias ESPN).
- `rss` — Utilidades RSS.
- `node-fetch` — Fetch en backend.

**Frontend (CDN / imports externos):**
- Firebase SDK v10.8.0 (Auth + Firestore).
- Chart.js (gráficos radar).
- Socket.io Client.

### 6.2. Arquitectura del proyecto

El proyecto sigue una arquitectura híbrida cliente-servidor:

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│        HTML5 + CSS3 + JavaScript (ES6 Modules)       │
│              Desplegado en VERCEL                     │
├────────────┬────────────────────┬────────────────────┤
│            │                    │                    │
│   ┌────────▼────────┐  ┌───────▼───────┐  ┌────────▼────────┐
│   │  Backend API     │  │  Firebase     │  │  Socket.io      │
│   │  (Express/Render)│  │  (Auth+DB)    │  │  (WebSocket)    │
│   └────────┬────────┘  └───────────────┘  └────────┬────────┘
│            │                                        │
│   ┌────────▼────────┐                     ┌────────▼────────┐
│   │  MySQL           │                     │  Chat en vivo   │
│   │  (Auth básica)   │                     │  + Bot          │
│   └─────────────────┘                     └─────────────────┘
│            │
│   ┌────────▼────────────────────────┐
│   │  APIs Externas                   │
│   │  - BallDontLie (equipos/jugadores)│
│   │  - ESPN (clasificaciones/partidos)│
│   │  - ESPN RSS (noticias)           │
│   └──────────────────────────────────┘
```

**Flujo de datos:**
1. El frontend solicita datos deportivos al backend Express (proxy a APIs externas con caché).
2. El frontend se comunica directamente con Firebase para autenticación, perfiles, favoritos, dream teams y comentarios.
3. El chat usa Socket.io para mensajes en tiempo real + Firestore para persistencia del historial.
4. Las interacciones de noticias (likes/comentarios) usan Firestore onSnapshot para actualizaciones en tiempo real.

### 6.3. Estructura del proyecto

```
ProLeaguePrincipal/
├── backend/
│   ├── server.js              # Servidor Express + Socket.io + rutas API
│   ├── db.js                  # Conexión MySQL (pool)
│   ├── .env                   # Variables de entorno
│   ├── controllers/
│   │   ├── auth.controller.js # Registro, login, perfil (MySQL)
│   │   └── news.controller.js # Parseo RSS noticias ESPN
│   ├── routes/
│   │   ├── auth.routes.js     # Rutas autenticación + upload avatar
│   │   ├── favorites.routes.js# Rutas favoritos (MySQL legacy)
│   │   └── news.routes.js     # Ruta noticias
│   ├── services/
│   │   └── nbaService.js      # (Reservado)
│   ├── database/
│   │   └── proleague.sql      # Schema SQL
│   └── uploads/               # Avatares subidos
├── frontend/
│   ├── index.html             # Redirect inicial
│   ├── css/
│   │   └── style.css          # Hoja de estilos global (~112KB)
│   ├── js/
│   │   ├── config/
│   │   │   ├── config.js          # API_BASE_URL (prod/dev)
│   │   │   └── firebase-config.js # Inicialización Firebase
│   │   ├── auth/
│   │   │   ├── login.js           # Login dual (Backend + Firebase)
│   │   │   ├── register.js        # Registro dual
│   │   │   └── session-guard.js   # Protección sesión única
│   │   ├── home/
│   │   │   └── app-home.js        # Home: noticias, scoreboard, slider, reloj
│   │   ├── leagues/
│   │   │   ├── app-nba.js         # Página liga NBA
│   │   │   └── app-nfl.js         # Página liga NFL
│   │   ├── players/
│   │   │   └── app-players.js     # Buscador de jugadores
│   │   ├── analytics/
│   │   │   ├── comparison.js      # Comparador de jugadores (Chart.js)
│   │   │   └── trending.js        # Jugadores trending de la comunidad
│   │   ├── user/
│   │   │   ├── profile.js         # Perfil propio editable
│   │   │   ├── public-profile.js  # Perfil público de otros usuarios
│   │   │   ├── search-users.js    # Búsqueda de usuarios
│   │   │   ├── dreamteam.js       # Dream Team Builder (NBA+NFL)
│   │   │   └── app-favorites.js   # Gestión de favoritos
│   │   ├── chat/
│   │   │   └── chat.js            # Chat en tiempo real
│   │   └── utils/
│   │       ├── toast.js           # Sistema de notificaciones toast
│   │       └── header-logic.js    # Lógica del header compartido
│   ├── vistas/                    # Páginas HTML organizadas por módulo
│   │   ├── auth/ (login.html, register.html)
│   │   ├── home/ (home.html)
│   │   ├── leagues/ (nba.html, nfl.html)
│   │   ├── players/ (players.html)
│   │   ├── analytics/ (comparison.html, trending.html)
│   │   ├── user/ (profile.html, public-profile.html, search-users.html, dreamteam.html, favorites.html)
│   │   ├── chat/ (chat.html)
│   │   └── components/ (header.html, footer.html)
│   ├── logos/                     # Logos de equipos NBA y NFL
│   └── images/                    # Imágenes estáticas
└── package.json
```

### 6.4. Costes

- Licencias: Software de código abierto → 0€.
- APIs: Free Tier (BallDontLie, ESPN pública).
- Hosting: Vercel (free) + Render (free) + Firebase Spark (free) → 0€.

### 6.5. Base de datos

**MySQL (autenticación básica):**

| Campo | Tipo | Descripción |
|---|---|---|
| id | INT (PK, AUTO_INCREMENT) | ID del usuario |
| username | VARCHAR(50) UNIQUE | Nombre de usuario |
| email | VARCHAR(100) UNIQUE | Email |
| password | VARCHAR(255) | Contraseña hasheada (bcrypt) |
| bio | TEXT | Biografía |
| avatar | VARCHAR(255) | URL del avatar |
| created_at | TIMESTAMP | Fecha de registro |

**Firebase Cloud Firestore:**

Colección `users` (documento por UID de Firebase Auth):
- `username` (string)
- `email` (string)
- `bio` (string)
- `avatar` (string — URL)
- `favorites` (array de objetos: {league, teamName, teamId})
- `dreamTeamNBA` (map: {PG, SG, SF, PF, C} — cada uno objeto jugador)
- `dreamTeamNFL` (map: {QB, RB, WR1, WR2, TE} — cada uno objeto jugador)
- `currentSessionId` (string — para Session Guard)

Colección `messages` (un documento por mensaje de chat):
- `user` (string)
- `text` (string)
- `room` (string: "general", "nba", "nfl")
- `time` (string)
- `timestamp` (serverTimestamp)

Colección `news_interactions` (un documento por noticia):
- `likes` (array de UIDs)
- `comments` (array de objetos: {uid, username, text, date})

---

## 7. Fases del desarrollo

### 7.1. Fase de análisis

**Requisitos Funcionales Implementados:**

| Código | Requisito | Estado |
|---|---|---|
| AUTH-01 | Registro de usuarios (username, email, password) | ✅ |
| AUTH-02 | Inicio de sesión seguro (dual Backend + Firebase) | ✅ |
| AUTH-03 | Verificación de email obligatoria | ✅ |
| AUTH-04 | Protección de sesión única (Session Guard) | ✅ |
| DATA-01 | Listado de equipos NBA y NFL | ✅ |
| DATA-02 | Clasificaciones en vivo (ESPN API) | ✅ |
| DATA-03 | Resultados/Scoreboard recientes | ✅ |
| DATA-04 | Noticias deportivas (RSS ESPN) | ✅ |
| CHAT-01 | Chat en tiempo real con salas | ✅ |
| CHAT-02 | Bot automático (ProLeagueBot) | ✅ |
| USER-01 | Perfil editable (avatar, bio, credenciales) | ✅ |
| USER-02 | Equipos favoritos | ✅ |
| USER-03 | Dream Team Builder (NBA + NFL) | ✅ |
| USER-04 | Perfiles públicos | ✅ |
| USER-05 | Búsqueda de usuarios | ✅ |
| PLAY-01 | Buscador de jugadores (NBA + NFL) | ✅ |
| PLAY-02 | Comparador de jugadores con gráfico radar | ✅ |
| PLAY-03 | Trending Players de la comunidad | ✅ |
| NEWS-01 | Likes y comentarios en tiempo real | ✅ |
| RESP-01 | Interfaz responsiva (escritorio, tablet, móvil) | ✅ |

**Requisitos No Funcionales:**
- Escalabilidad: Backend modular (routes, controllers, services).
- Rendimiento: APIs asíncronas (async/await), sistema de caché en el backend.
- Seguridad: Passwords hasheados (bcrypt), CORS configurado, verificación email, session guard.
- UX: Toast notifications, skeleton loaders, protección de cambios sin guardar.

### 7.2. Fase de diseño

**Interfaz:**
- Diseño oscuro (Modern Dark UI).
- Glassmorphism (backdrop-filter: blur) para tarjetas y paneles.
- Colores: Cyan (#00f2ff — general), Rojo (#ff3b3b — NBA), Azul (#3b82f6 — NFL).
- Responsiva con menú hamburguesa para móvil.
- Hoja de estilos unificada (~112KB, style.css).

**Cambio tecnológico justificado (durante el desarrollo):**

1. **MySQL → Firebase Firestore (parcial):** Se mantuvo MySQL para la autenticación básica del backend, pero se migró la persistencia de datos de usuario (favoritos, dream teams, interacciones) a Firestore por su capacidad de actualización en tiempo real (onSnapshot) y su integración nativa con Firebase Auth.

2. **Google Charts → Chart.js:** Se migró a Chart.js por mejor soporte de gráficos radar, menor peso y mejor documentación.

3. **Chat en memoria → Chat persistente:** El chat inicialmente solo guardaba mensajes en memoria del servidor (se perdían al reiniciar). Se implementó persistencia en Firestore manteniendo Socket.io para la entrega en tiempo real.

### 7.3. Fase de desarrollo

**Estado actual:** ~95% del proyecto completado, superando ampliamente el PMV original.

**Retos resueltos:**
- **Error 429 (Too Many Requests):** Implementación de sistema de caché en el backend con `fetchWithCache()` y caché por búsqueda de jugadores (Map).
- **CORS en producción:** Configuración de allowedOrigins + middleware brute-force para garantizar cabeceras en Vercel/Render.
- **Autenticación dual:** Sincronización entre Backend (MySQL) y Firebase Auth para mantener compatibilidad.
- **Sesión única:** Implementación de Session Guard usando Firestore onSnapshot para detectar logins concurrentes.
- **Logos dinámicos:** Mapas de logos locales (62 logos NBA+NFL) para evitar dependencia de CDNs externos.

**Repositorio:**
- https://github.com/avillanurr10/ProyectoIntermodularAndoniVillanueva2dam.b.git

**Despliegue:**
- Frontend: https://proyecto-pro-league-despliegue.vercel.app
- Backend: https://proleague-backend.onrender.com

### 7.4. Fase de pruebas y depuración

| Código | Descripción / Resultado esperado | Estado |
|---|---|---|
| AUTH-01 | Registro con usuario duplicado → mensaje de error | ✅ |
| AUTH-02 | Login con credenciales correctas → acceso | ✅ |
| AUTH-02 | Login con credenciales incorrectas → error | ✅ |
| AUTH-03 | Login sin verificar email → bloqueado | ✅ |
| AUTH-04 | Login en 2 dispositivos → sesión anterior se cierra | ✅ |
| DATA-01 | Carga de equipos NBA (30 equipos) | ✅ |
| DATA-01 | Carga de equipos NFL (32 equipos) | ✅ |
| DATA-02 | Clasificaciones NBA y NFL actualizadas | ✅ |
| DATA-03 | Scoreboard con resultados recientes | ✅ |
| CHAT-01 | Enviar mensaje → aparece en tiempo real | ✅ |
| CHAT-01 | Historial persistente al recargar | ✅ |
| USER-01 | Cambiar avatar → se actualiza en perfil | ✅ |
| USER-01 | Cambiar bio → se guarda en Firestore | ✅ |
| USER-03 | Crear Dream Team NBA completo | ✅ |
| USER-03 | Crear Dream Team NFL completo | ✅ |
| USER-04 | Ver perfil público de otro usuario | ✅ |
| USER-05 | Buscar usuario por nombre | ✅ |
| PLAY-01 | Buscar jugador NBA/NFL por nombre | ✅ |
| PLAY-02 | Comparar 2 jugadores → tabla + gráfico radar | ✅ |
| NEWS-01 | Dar like a noticia → contador actualiza en tiempo real | ✅ |
| NEWS-01 | Comentar noticia → aparece para todos | ✅ |
| RESP-01 | Vista móvil (menú hamburguesa funcional) | ✅ |
| RESP-01 | Vista tablet | ✅ |
| RESP-01 | Vista escritorio | ✅ |
| CACHE | API saturada (429) → servidor sirve datos de caché | ✅ |
| DEPLOY | Frontend accesible en Vercel | ✅ |
| DEPLOY | Backend accesible en Render | ✅ |

### 7.5. Fase de lanzamiento

- **Frontend desplegado en Vercel** (despliegue automático desde repositorio Git).
- **Backend desplegado en Render** (servidor Node.js con variable de entorno configuradas).
- **Firebase configurado** con reglas de seguridad para Firestore.
- **Dominio de producción:** proyecto-pro-league-despliegue.vercel.app

---

## 8. Conclusiones

El desarrollo de ProLeague ha permitido integrar conocimientos complejos de arquitectura web, comunicación en tiempo real, gestión de bases de datos híbridas y despliegue en la nube.

**Logros principales:**
- Desarrollo de una plataforma completa que supera ampliamente el PMV propuesto inicialmente.
- Implementación exitosa de una arquitectura híbrida (MySQL + Firestore + Socket.io).
- Despliegue completo en producción con frontend y backend separados.
- Sistema de seguridad robusto (verificación email, session guard, bcrypt, CORS).
- Experiencia de usuario premium (glassmorphism, toasts, skeletons, animaciones).

**Mayores dificultades:**
- Integración fiable de APIs de terceros (errores 429, cambios en endpoints) → solucionado con sistema de caché.
- Migración de MySQL a Firestore sin perder compatibilidad → solucionado con arquitectura dual.
- Configuración de CORS entre Vercel y Render → solucionado con middleware personalizado.
- Gestión de estados en el chat y persistencia de mensajes.

**Aprendizajes técnicos clave:**
- Arquitectura cliente-servidor con múltiples servicios (Express, Firebase, Socket.io).
- Despliegue en plataformas PaaS (Vercel, Render).
- Integración de APIs externas con manejo de errores y caché.
- Firebase Auth y Firestore para autenticación y base de datos NoSQL en tiempo real.
- WebSockets para comunicación bidireccional en tiempo real.

---

## 9. Bibliografía y referencias

- Socket.io Documentation. (2024). https://socket.io/docs/v4/
- MDN Web Docs. (2024). Fetch API, ES6 Modules. Mozilla.
- Firebase Documentation. (2024). https://firebase.google.com/docs
- Chart.js Documentation. (2024). https://www.chartjs.org/docs/
- Express.js Documentation. (2024). https://expressjs.com/
- BallDontLie API. https://www.balldontlie.io/
- ESPN API (unofficial community resources).
- ESPN RSS Feeds. https://www.espn.com/espn/rss/
- Cheerio Documentation. https://cheerio.js.org/
- Multer Documentation. https://github.com/expressjs/multer
- Bcrypt.js. https://github.com/kelektiv/node.bcrypt.js
- MySQL2 Documentation. https://github.com/sidorares/node-mysql2
- Vercel Documentation. https://vercel.com/docs
- Render Documentation. https://render.com/docs
