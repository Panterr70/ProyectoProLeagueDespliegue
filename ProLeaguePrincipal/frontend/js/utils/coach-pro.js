/**
 * coach-pro.js — Asistente Virtual Inteligente
 * 
 * Añade una mascota animada con consejos dinámicos y navegación.
 * 
 * @author Coach Pro AI
 */

const COACH_PHRASES = [
    "¡Ey! No olvides pulir tu Dream Team antes de la jornada. <span class='material-icons' style='font-size:16px; vertical-align:middle;'>sports_basketball</span>",
    "¿Has visto los últimos resultados de la NFL? ¡Vaya locura! <span class='material-icons' style='font-size:16px; vertical-align:middle;'>sports_football</span>",
    "Recuerda: el respeto en el chat es lo que nos hace grandes. <span class='material-icons' style='font-size:16px; vertical-align:middle;'>handshake</span>",
    "¿Buscas a alguien? Usa el buscador de la comunidad. <span class='material-icons' style='font-size:16px; vertical-align:middle;'>search</span>",
    "¡Bienvenido de nuevo! Soy tu Coach Pro, listo para el análisis. <span class='material-icons' style='font-size:16px; vertical-align:middle;'>smart_toy</span>",
    "Tip: Los gráficos de radar te dicen quién es el mejor de verdad. <span class='material-icons' style='font-size:16px; vertical-align:middle;'>trending_up</span>",
    "¿Sabías que puedes comparar jugadores de distintas ligas? Prueba el Comparador. <span class='material-icons' style='font-size:16px; vertical-align:middle;'>diamond</span>",
    "Nota técnica: Las fotos de perfil en la nube (Render) son temporales por el hosting. <span class='material-icons' style='font-size:16px; vertical-align:middle;'>cloud_off</span>"
];

export function initCoachPro() {
    if (document.getElementById("coach-pro-container")) return;

    const coachContainer = document.createElement("div");
    coachContainer.id = "coach-pro-container";
    coachContainer.innerHTML = `
        <div class="coach-bubble" id="coach-bubble">¡Hola! Soy tu Coach Pro. <span class='material-icons' style='font-size:16px; vertical-align:middle;'>sports_basketball</span></div>
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
        
        bubble.innerHTML = phrase;
        bubble.classList.add("show");
        
        setTimeout(() => {
            bubble.classList.remove("show");
        }, 5000);
    };

    // Primer mensaje rápido
    setTimeout(() => showMessage("¡Eh! Bienvenido a la zona VIP de ProLeague. <span class='material-icons' style='font-size:16px; vertical-align:middle;'>military_tech</span>"), 2000);

    // Intervalo más corto para que parezca vivo (20 segundos)
    setInterval(showMessage, 20000);

    // Clic: Mensaje aleatorio y animación
    coachContainer.onclick = () => {
        const randomTips = [
            "¡Vamooos! A por la victoria hoy. <span class='material-icons' style='font-size:16px; vertical-align:middle;'>local_fire_department</span>",
            "¿Sabías que soy 100% código puro? <span class='material-icons' style='font-size:16px; vertical-align:middle;'>code</span>",
            "¡No me pinches, que me desconecto! <span class='material-icons' style='font-size:16px; vertical-align:middle;'>electrical_services</span>",
            "¿Has visto los Dream Teams de hoy? Están on fire. <span class='material-icons' style='font-size:16px; vertical-align:middle;'>trending_up</span>"
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
