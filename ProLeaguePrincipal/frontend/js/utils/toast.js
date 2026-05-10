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

/**
 * Confirmación Premium (Reemplaza el clásico 'confirm()' del navegador)
 */
export function showConfirm(message) {
    return new Promise((resolve) => {
        // Inyectar estilos si no existen
        if (!document.getElementById('confirm-styles')) {
            const style = document.createElement('style');
            style.id = 'confirm-styles';
            style.innerHTML = `
                .confirm-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 99999; opacity: 0; transition: opacity 0.3s ease; }
                .confirm-dialog { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 30px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .confirm-overlay[style*="opacity: 1"] .confirm-dialog { transform: scale(1); }
                .confirm-dialog h3 { color: #fff; margin-bottom: 12px; font-size: 1.3rem; display: flex; align-items: center; justify-content: center; gap: 8px; }
                .confirm-dialog p { color: #94a3b8; margin-bottom: 25px; font-size: 0.95rem; line-height: 1.5; }
                .confirm-actions { display: flex; justify-content: center; gap: 15px; }
                .confirm-btn-cancel, .confirm-btn-ok { padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s ease; font-size: 0.9rem; }
                .confirm-btn-cancel { background: rgba(255,255,255,0.05); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.1); }
                .confirm-btn-cancel:hover { background: rgba(255,255,255,0.1); color: #fff; }
                .confirm-btn-ok { background: linear-gradient(135deg, #ff3b3b, #c53030); color: #fff; box-shadow: 0 4px 15px rgba(255, 59, 59, 0.3); }
                .confirm-btn-ok:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 59, 59, 0.4); }
            `;
            document.head.appendChild(style);
        }

        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <h3>⚠️ Confirmación</h3>
            <p>${message}</p>
            <div class="confirm-actions">
                <button class="confirm-btn-cancel">Cancelar</button>
                <button class="confirm-btn-ok">Aceptar</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Activar animación
        requestAnimationFrame(() => overlay.style.opacity = '1');
        
        const close = (result) => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
            resolve(result);
        };
        
        dialog.querySelector('.confirm-btn-cancel').onclick = () => close(false);
        dialog.querySelector('.confirm-btn-ok').onclick = () => close(true);
    });
}

window.showConfirm = showConfirm;
