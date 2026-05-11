# 🎯 PLAN FINAL - ProLeague | Proyecto Intermodular

> **Última actualización:** 10 de mayo 2026  
> **Autor:** Andoni Villanueva  
> **Estado:** EN PROGRESO - Fase final antes de entrega

---

## 📅 CALENDARIO CRÍTICO

| Fecha | Evento | Estado |
|-------|--------|--------|
| **10 mayo (HOY)** | Planificación y organización | ✅ |
| **11-14 mayo** | Correcciones finales y últimas mejoras | ⏳ |
| **15 mayo** | 🔴 **DEADLINE: Entrega memoria + ÚLTIMO COMMIT** | ❌ |
| **16-20 mayo** | Preparar presentación (slides + ensayar) | ❌ |
| **21-22 mayo** | Probar setup en clase (HDMI/SmartMirror) | ❌ |
| **25-29 mayo** | 🎤 **PRESENTACIONES** (puede tocar desde el 25) | ❌ |
| **29 mayo** | Publicación de notas | ❌ |

### ⚠️ DESPUÉS DEL 15 DE MAYO:
- **PROHIBIDO** hacer más commits → se considera entrega fuera de plazo → **NOTA 0**
- La memoria debe estar entregada ese día

---

## 🕐 FORMATO DE LA PRESENTACIÓN

```
XX:00 - Entras al aula y preparas todo (5 min)
XX:05 - EMPIEZA la presentación (10 min EXACTOS)
XX:15 - TERMINA presentación → turno de preguntas (10 min)
XX:25 - FIN preguntas → recoges y sales
XX:30 - Entra el siguiente alumno
```

### Reglas clave:
- **10 minutos de presentación** → pasarse penaliza (máximo 1 min extra, luego te cortan)
- **10 minutos de preguntas** → preguntas técnicas sobre TU código
- **Puntualidad ABSOLUTA** → si llegas tarde, pierdes tiempo de presentación
- **No hay excusas** salvo emergencias médicas reales

---

## 🖥️ RECURSOS PARA LA PRESENTACIÓN

- [ ] Presentación (slides) preparada
- [ ] Código del proyecto accesible
- [ ] IDE abierto con el proyecto cargado
- [ ] Conexión probada: HDMI o SmartMirror
- [ ] Cronómetro en el móvil para controlar tiempo
- [ ] Practicar presentación desde casa (mínimo 3 veces)

---

## ❓ PREGUNTAS DEL TRIBUNAL - PREPARACIÓN

### ¿Qué van a preguntar?
- **¿En qué parte del código se hace X funcionalidad?** → Debes ir directo al archivo y línea
- **¿Cómo funciona X funcionalidad exactamente?** → Explicar flujo completo
- **¿En qué tabla/colección se guardan X datos?** → Saber la estructura de Firestore

### ⚠️ PENALIZACIONES POR NO SABER RESPONDER:
- Si dudas o tardas → se considera que NO sabes la respuesta
- La penalización es **EXPONENCIAL** (cada pregunta fallada pesa más)
- Si fallas **2-3 preguntas** → se puede considerar que el trabajo NO es tuyo
- Esto incluye sospecha de uso de código de terceros o uso excesivo de IA

### 📍 MAPA DEL CÓDIGO (COMPLETAR ANTES DE LA PRESENTACIÓN)
> TODO: Crear un mapa detallado de dónde está cada funcionalidad

#### Frontend
- **Autenticación (login/registro):** `frontend/js/auth/`
- **Páginas de ligas (NBA/NFL):** `frontend/js/leagues/`
- **Dream Team:** `frontend/js/dreamteam/`
- **Perfil de usuario:** `frontend/js/user/`
- **Comparador de jugadores:** `frontend/js/analytics/comparison.js`
- **Trending:** `frontend/js/analytics/trending.js`
- **Sistema de toasts:** `frontend/js/utils/toast.js`
- **Configuración API:** `frontend/js/config/config.js`
- **Header/Navegación:** `frontend/js/utils/header-logic.js`

#### Backend
- **Servidor principal:** `backend/`
- **Rutas API:** (completar)
- **Middleware:** (completar)
- **Conexión Firebase/Firestore:** (completar)

#### Base de datos (Firestore)
- **Colección usuarios:** (completar estructura)
- **Colección favoritos:** (completar estructura)
- **Colección dream teams:** (completar estructura)

---

## 🔧 PLAN DE TRABAJO: 11-14 MAYO (4 DÍAS)

### Día 1 - Domingo 11 mayo
- [ ] Revisión general del proyecto: identificar bugs pendientes
- [ ] Listar todas las correcciones necesarias
- [ ] Empezar con las correcciones más críticas

### Día 2 - Lunes 12 mayo
- [ ] Continuar correcciones
- [ ] Mejoras de UX/UI finales
- [ ] Probar todo el flujo completo de la aplicación

### Día 3 - Martes 13 mayo
- [ ] Terminar correcciones
- [ ] Testing completo (todas las funcionalidades)
- [ ] Empezar a completar el mapa del código (arriba)

### Día 4 - Miércoles 14 mayo
- [ ] 🔴 **ÚLTIMO DÍA REAL DE TRABAJO** (dejar margen para el 15)
- [ ] Testing final
- [ ] Últimos ajustes
- [ ] Commit final y verificar que el repositorio es accesible

### Día 5 - Jueves 15 mayo
- [ ] 🔴 **DEADLINE**
- [ ] Entregar memoria
- [ ] Verificar que el repositorio está accesible para el tribunal
- [ ] **NO TOCAR NADA MÁS DESPUÉS DE ESTE DÍA**

---

## 🎤 PLAN DE PREPARACIÓN: 16-24 MAYO

### Semana del 16-20 mayo
- [ ] Crear slides de la presentación
- [ ] Estructurar los 10 minutos:
  - Intro del proyecto (1 min)
  - Tecnologías usadas (1 min)
  - Demo en vivo de funcionalidades (5-6 min)
  - Conclusiones y aprendizajes (2-3 min)
- [ ] Ensayar con cronómetro (mínimo 3 veces)
- [ ] Completar el MAPA DEL CÓDIGO para las preguntas

### 21-22 mayo (en clase)
- [ ] Probar conexión HDMI / SmartMirror
- [ ] Probar que la presentación se ve bien
- [ ] Probar que el IDE carga rápido con el proyecto
- [ ] Ensayo final cronometrado

### 23-24 mayo
- [ ] Último ensayo de la presentación
- [ ] Repasar mapa del código
- [ ] Preparar todo lo necesario para el día D

---

## 📋 RECUPERACIONES (si suspendes)

| Fecha | Evento |
|-------|--------|
| 3 junio | Entrega memoria y código (recuperación) |
| 8-12 junio | Presentaciones de recuperación |

---

## 💡 NOTAS IMPORTANTES

1. **El tribunal incluye al tutor + 2 docentes del ciclo** (el profesor de la asignatura NO está en el tribunal pero pone las normas)
2. **Llevar el código estudiado** — no vale improvisar
3. **No alargar la presentación** — la penalización pesa más que lo que puedas añadir
4. **Verificar acceso al repositorio** antes del 15 de mayo
5. **Rúbricas** — revisarlas detenidamente (están en Moodle)

---

> **¡Ánimo Andoni! 5 días de trabajo intenso y luego a preparar la presentación. Tú puedes! 💪**
