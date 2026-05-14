# MEMORIA TÉCNICA: PROLEAGUE

## 1. Portada
**Alumno:** Andoni Villanueva Urrestarazu  
**Ciclo:** Desarrollo de Aplicaciones Multiplataforma — 2º curso  
**Proyecto:** ProLeague — Plataforma de Análisis Deportivo NBA/NFL  
**Centro:** Maria Ana Sanz  
**Curso Académico:** 2025-2026

---

## 2. Índice
1. Portada
2. Índice
3. Resumen / Abstract
4. Descripción y justificación
5. Objetivos (PMV y Ampliaciones)
6. Recursos y Arquitectura Híbrida
7. Fases del desarrollo e Ingeniería
8. Conclusiones y Logros
9. Bibliografía

---

## 3. Resumen
ProLeague es una plataforma web avanzada diseñada para el análisis, seguimiento y dinamización comunitaria de las dos grandes ligas deportivas estadounidenses: la NBA y la NFL. La aplicación combina datos estadísticos en tiempo real con una experiencia social moderna. Los usuarios pueden consultar clasificaciones, construir "Dream Teams", comparar jugadores mediante gráficos de radar y participar en un chat persistente moderado por un sistema automático.

**Novedad Final:** Se ha integrado un asistente virtual, **Coach Pro**, que utiliza lógica de gamificación para guiar al usuario y ofrecer soporte técnico contextual sobre la infraestructura cloud.

**Abstract:**
ProLeague is an advanced web platform designed for real-time statistical analysis and community engagement for NBA and NFL. Featuring a "Dream Team" builder, interactive player comparisons, and a persistent live chat, the system leverages a hybrid MySQL/Firestore architecture to deliver a professional sports dashboard experience.

---

## 4. Descripción y justificación
ProLeague nace para cubrir el vacío entre las aplicaciones de resultados simples y las plataformas de apuestas, centrándose exclusivamente en el análisis de rendimiento y la interacción social sana.
- **Análisis Visual:** Transforma tablas de números en gráficos interactivos.
- **Interacción Social:** Chat persistente y perfiles públicos para debatir sobre deporte.

---

## 5. Objetivos del proyecto
### 5.1. Producto Mínimo Viable (Cumplido)
- **Autenticación:** Registro e inicio de sesión con verificación de email.
- **Datos en Vivo:** Clasificaciones y resultados NBA/NFL en tiempo real.
- **Noticias:** Feed de noticias RSS actualizado al minuto.

### 5.2. Ampliaciones Premium (Implementadas)
- **Login Híbrido Avanzado:** Capacidad de acceder mediante Email o Nombre de Usuario indistintamente.
- **Asistente Coach Pro:** Mascota virtual animada con consejos dinámicos y soporte UX.
- **Comunidad Limpia:** Sistema de búsqueda con triple filtrado (UID, Email, Username) y prevención de duplicados.
- **Seguridad Reactiva:** Session Guard para control de sesión única y re-autenticación obligatoria.

---

## 6. Recursos y Arquitectura
6.2. Arquitectura del proyecto
La aplicación ProLeague utiliza una arquitectura híbrida cliente-servidor basada en microservicios cloud y comunicación en tiempo real. A continuación se detallan los pilares técnicos:

**A. Almacenamiento de Datos (Dual-Storage Strategy)**
El sistema gestiona la información en dos capas distintas según su persistencia y velocidad:
- **Capa Relacional (MySQL):** Almacenada en servidor gestionado, se utiliza para el núcleo de usuarios (IDs, correos, contraseñas hasheadas). Garantiza la integridad de la cuenta.
- **Capa NoSQL (Cloud Firestore):** Se emplea para la persistencia social y de alta frecuencia: Dream Teams, equipos favoritos, historial de chat e interacciones (likes/comentarios).

**B. APIs y Servicios Externos**
ProLeague actúa como un agregador de datos consumiendo los siguientes servicios:
- **BallDontLie API:** Fuente principal para base de datos de jugadores y estadísticas NBA/NFL.
- **ESPN API / RSS:** Utilizada para clasificaciones en vivo (standings) y noticias.
- **Firebase Auth & Firestore REST:** Gestión de identidad y búsqueda avanzada de perfiles para permitir el login híbrido (Email/Username).

**C. Comunicación entre Componentes**
La interacción se realiza mediante tres protocolos diferenciados:
- **Protocolo HTTPS (REST API):** Para obtención de datos y gestión de perfiles. El Backend actúa como Proxy e inyecta una **caché en memoria** para evitar errores 429.
- **Protocolo WebSockets (Socket.io):** Comunicación bidireccional para el chat en vivo y notificaciones del sistema.
- **SDK Firestore (onSnapshot):** Sincronización en tiempo real para interacciones sociales sin peticiones HTTP manuales.

**D. Dispositivos y Plataformas**
La plataforma ha sido desarrollada bajo la filosofía Web-Responsive:
- **Plataformas Cloud:** Desplegada en entornos PaaS (Vercel para cliente y Render para servidor).
- **Dispositivos:** Optimizada para navegadores modernos en equipos de escritorio, tablets y smartphones (iOS/Android).

---

## 7. Fases del desarrollo
### 7.3. Fase de desarrollo: Hitos de Ingeniería
- **Abstracción de APIs:** Sistema de caché `apiCache` en Node.js que reduce la latencia de ~1.2s a <150ms.
- **Login REST-Auth:** Implementación de un buscador de emails vía REST API de Firestore para habilitar el login por username en entornos de producción.
- **Coach Pro AI:** Desarrollo de un componente animado (CSS Glassmorphism) con lógica de interacción aleatoria para mejorar la retención del usuario.

### 7.4. Fase de pruebas y depuración (QA)
| Código | Error Detectado | Solución Aplicada | Estado |
| :--- | :--- | :--- | :--- |
| TEST-01 | Error 429 (API Overload) | Middleware de caché en el backend. | ✅ Resuelto |
| TEST-06 | Duplicados en búsqueda | Map de unicidad por `cleanUsername`. | ✅ Resuelto |
| TEST-07 | Error 403 Firestore Cloud | Ajuste de reglas de seguridad y API Key lookup. | ✅ Resuelto |
| TEST-08 | 404 en Avatares | Sistema de fallback dinámico con UI-Avatars. | ✅ Resuelto |

---

## 8. Conclusiones
### 8.1. Logros Técnicos
Se ha cumplido satisfactoriamente el 100% de los objetivos. El mayor logro técnico ha sido la creación de una arquitectura que combina la robustez de MySQL con la agilidad de Firestore. La inclusión del **Coach Pro** eleva el proyecto de una simple web de datos a una aplicación con identidad propia y soporte UX avanzado.

### 8.2. Retos Superados
El principal desafío fue la normalización de datos entre proveedores (ESPN vs BallDontLie). La solución mediante un diccionario centralizado (`logos-config.js`) y un middleware de mapeo garantizó la coherencia visual de la plataforma.

---

## 9. Bibliografía
- Node.js & Express.js Documentation (2024).
- Google Firebase Auth & Firestore SDK.
- Socket.io Real-time bidirectional communication.
- BallDontLie & ESPN Sports APIs.
