/**
 * Utilidad de Toasts Premium para ProLeague
 * Reemplaza los alerts clásicos por notificaciones visuales elegantes.
 */
export function showToast(message, type = 'success', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { 
        success: '✅', 
        error: '❌', 
        info: 'ℹ️', 
        warning: '⚠️' 
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Estructura del toast
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '📢'}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close">✕</button>
    `;

    container.appendChild(toast);

    // Animación de entrada
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('toast-visible');
        });
    });

    // Cerrar al hacer clic en la X
    toast.querySelector('.toast-close').onclick = () => {
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 400);
    };

    // Auto-cierre
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('toast-visible');
            toast.classList.add('toast-hiding');
            setTimeout(() => toast.remove(), 400);
        }
    }, duration);
}

// También lo exponemos globalmente por si acaso hay scripts no-módulo
window.showToast = showToast;
