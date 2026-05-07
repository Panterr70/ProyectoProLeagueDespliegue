import { db, auth } from "../config/firebase-config.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * [AUTH03] Session Guard
 * Evita que el usuario mantenga dos sesiones activas al mismo tiempo.
 * Si el currentSessionId en Firestore cambia, se cierra la sesión local.
 */
export function initSessionGuard() {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData || !userData.uid || !userData.sessionId) return;

    // Escuchar cambios en el documento del usuario en tiempo real
    const userDocRef = doc(db, "users", userData.uid);
    
    onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const remoteData = docSnap.data();
            const remoteSessionId = remoteData.currentSessionId;

            // Si el ID remoto es distinto al local, significa que hubo un nuevo login
            if (remoteSessionId && remoteSessionId !== userData.sessionId) {
                console.warn("Nueva sesión detectada en otro dispositivo. Cerrando sesión local...");
                
                // Mostrar aviso si existe toast utility
                if (window.showToast) {
                    window.showToast("Se ha iniciado sesión en otro dispositivo. Cerrando sesión...", "warning", 5000);
                } else {
                    alert("Se ha iniciado sesión en otro dispositivo. Cerrando sesión...");
                }

                // Esperar un poco para que el usuario vea el mensaje y cerrar
                setTimeout(() => {
                    auth.signOut();
                    localStorage.removeItem("user");
                    window.location.href = "../auth/login.html";
                }, 3000);
            }
        }
    });
}
