/**
 * coach-pro.js — Asistente Virtual Inteligente
 * 
 * Añade una mascota animada con consejos dinámicos y navegación.
 * 
 * @author Coach Pro AI
 */

const COACH_PHRASES = [
    "¡Ey! No olvides pulir tu Dream Team antes de la jornada. 🏀",
    "¿Has visto los últimos resultados de la NFL? ¡Vaya locura! 🏈",
    "Recuerda: el respeto en el chat es lo que nos hace grandes. 🤝",
    "¿Buscas a alguien? Usa el buscador de la comunidad. 🔍",
    "¡Bienvenido de nuevo! Soy tu Coach Pro, listo para el análisis. 🤖",
    "Tip: Los gráficos de radar te dicen quién es el mejor de verdad. 📈",
    "¿Sabías que puedes comparar jugadores de distintas ligas? Prueba el Comparador. 💎",
    "Nota técnica: Las fotos de perfil en la nube (Render) son temporales porque usamos almacenamiento gratuito. ¡En local son permanentes! ☁️🔧"
];

export function initCoachPro() {
    if (document.getElementById("coach-pro-container")) return;

    const coachContainer = document.createElement("div");
    coachContainer.id = "coach-pro-container";
    coachContainer.innerHTML = `
        <div class="coach-bubble" id="coach-bubble">¡Hola! Soy tu Coach Pro. 🏀</div>
        <div class="coach-avatar">
            <div class="coach-eye left"></div>
            <div class="coach-eye right"></div>
            <div class="coach-mouth"></div>
        </div>
    `;

    document.body.appendChild(coachContainer);

    const showMessage = (forcedText = null) => {
        const bubble = document.getElementById("coach-bubble");
        if (!bubble) return;

        const phrase = forcedText || COACH_PHRASES[Math.floor(Math.random() * COACH_PHRASES.length)];
        
        bubble.textContent = phrase;
        bubble.classList.add("show");
        
        setTimeout(() => {
            bubble.classList.remove("show");
        }, 5000);
    };

    // Primer mensaje rápido
    setTimeout(() => showMessage("¡Eh! Bienvenido a la zona VIP de ProLeague. 🦾"), 2000);

    // Intervalo más corto para que parezca vivo (20 segundos)
    setInterval(showMessage, 20000);

    // Clic: Mensaje aleatorio y animación
    coachContainer.onclick = () => {
        const randomTips = [
            "¡Vamooos! A por la victoria hoy. 🔥",
            "¿Sabías que soy 100% código puro? 🤖",
            "¡No me pinches, que me desconecto! 😂",
            "¿Has visto los Dream Teams de hoy? Están on fire. 📈"
        ];
        showMessage(randomTips[Math.floor(Math.random() * randomTips.length)]);
        
        coachContainer.classList.add("jump");
        setTimeout(() => coachContainer.classList.remove("jump"), 500);
    };
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoachPro);
} else {
    initCoachPro();
}
