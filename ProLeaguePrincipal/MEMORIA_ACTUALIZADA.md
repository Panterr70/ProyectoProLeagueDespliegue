# MEMORIA FINAL PROYECTO INTERMODULAR

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
4. Descripción y justificación del proyecto
5. Objetivos del proyecto (PMV y Mejoras)
6. Recursos hardware, software y arquitectura
7. Fases del desarrollo
8. Conclusiones
9. Bibliografía y referencias

---

## 3. Resumen
ProLeague es una plataforma web avanzada diseñada para el análisis, seguimiento y dinamización comunitaria de las dos grandes ligas deportivas estadounidenses: la NBA y la NFL. La aplicación permite consultar clasificaciones vivas, resultados recientes, noticias de última hora, y ofrece herramientas exclusivas como un constructor de "Dream Teams", comparadores de jugadores mediante gráficos interactivos y un sistema de chat persistente.

### Abstract
ProLeague is an advanced web platform designed for the analysis and community engagement of the NBA and NFL. Featuring a hybrid architecture (Firebase + MySQL) and a premium glassmorphism UI, it provides real-time statistics, a Dream Team builder, and secure user management.

---

## 4. Descripción y justificación del proyecto
### 4.1. Justificación de la necesidad
- **Análisis Visual:** Transforma tablas áridas en gráficos de radar e interactivos.
- **Interacción Social:** Chat persistente y perfiles públicos para el debate deportivo.
- **Eficiencia de Datos:** Centralización de APIs (ESPN, BallDontLie) en un único dashboard.

---

## 5. Objetivos del proyecto
### 5.1. Producto Mínimo Viable (PMV)
- Registro/Login con verificación de email.
- Clasificaciones y resultados en tiempo real.
- Feed de noticias RSS y Chat general.

### 5.2. Ampliaciones (Implementadas hoy)
- **Login Híbrido:** Acceso mediante Email o Nombre de Usuario.
- **Seguridad Reactiva:** Re-autenticación obligatoria para cambios de credenciales.
- **Diseño Premium:** Campo de la NFL realista con texturas CSS y yardas dinámicas.
- **Sincronización Automática:** Sistema de "Auto-fichaje" entre Firebase y MySQL para consistencia de datos.

---

## 6. Recursos y Arquitectura
### 6.2. Arquitectura del Proyecto (Híbrida)
A diferencia de aplicaciones estándar, ProLeague utiliza un enfoque de **Doble Persistencia**:
1.  **MySQL:** Gestión de perfiles y mapeo de usuarios para búsquedas rápidas por nombre de usuario.
2.  **Firebase Firestore:** Almacenamiento en tiempo real para el Chat, Dream Teams e interacciones sociales.
3.  **Firebase Auth:** Gestión de identidad, verificación de email y seguridad de sesiones (Session Guard).

---

## 7. Fases del desarrollo
### 7.3. Hitos de Ingeniería
- **A. Cache Middleware:** Sistema en Node.js que evita el Error 429 de las APIs externas mediante almacenamiento en memoria.
- **B. Session Guard:** Control de sesión única para evitar accesos concurrentes mediante listeners en tiempo real.
- **C. Re-autenticación Segura:** Implementación de flujos de seguridad de Firebase que exigen la contraseña actual para cambios sensibles.
- **D. Obfuscación de Recuperación:** Sistema de recuperación de cuenta que protege la privacidad ocultando el email vinculado durante el proceso.

### 7.4. Fase de pruebas y depuración
| Código | Error Detectado | Solución Aplicada |
| :--- | :--- | :--- |
| TEST-01 | Error 429 en APIs | Implementación de Cache en Backend |
| TEST-02 | Permisos en Login | Migración de búsqueda de usuario al Backend (API Proxy) |
| TEST-03 | Sesión concurrente | Implementación de Session Guard |
| TEST-04 | UX NFL estática | Rediseño completo con gradientes y texturas realistas |

---

## 8. Conclusiones
El desarrollo de ProLeague ha culminado en una herramienta robusta y escalable. Se ha logrado un equilibrio perfecto entre **Seguridad** (validaciones de backend), **Estética** (Glassmorphism) y **Funcionalidad** (Sincronización híbrida). El proyecto supera los requisitos iniciales, ofreciendo una experiencia de usuario de nivel comercial lista para su despliegue.

---

## 9. Bibliografía
- **Node.js:** https://nodejs.org/
- **Firebase:** https://firebase.google.com/
- **Socket.io:** https://socket.io/
- **ESPN/BallDontLie APIs:** Documentación oficial de proveedores de datos.
