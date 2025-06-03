import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Tipos posibles para el tema
export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme_preference_v1';

// Función para obtener la preferencia inicial
function getInitialTheme(): Theme {
    if (!browser) {
        return 'system'; // Default en SSR o si no hay acceso a localStorage/matchMedia
    }
    const storedPref = localStorage.getItem(STORAGE_KEY);
    if (storedPref && (storedPref === 'light' || storedPref === 'dark')) {
        return storedPref as Theme; // Retorna preferencia guardada válida
    }
    return 'system'; // Default si no hay preferencia o es inválida
}

// Función para aplicar el tema al DOM
function applyTheme(theme: Theme) {
    if (!browser) return;

    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let themeToApply: 'light' | 'dark';

    if (theme === 'system') {
        themeToApply = systemPrefersDark ? 'dark' : 'light';
    } else {
        themeToApply = theme;
    }

    const htmlElement = document.documentElement; // <-- Obtener elemento HTML

    console.log(`Applying theme: ${theme}, Resolved to: ${themeToApply}`); // <-- LOG PARA DEBUG

    if (themeToApply === 'dark') {
        htmlElement.classList.add('dark');
        console.log('Added dark class'); // <-- LOG PARA DEBUG
    } else {
        htmlElement.classList.remove('dark');
        console.log('Removed dark class'); // <-- LOG PARA DEBUG
    }
}

// --- Store ---
const initialTheme = getInitialTheme();
const theme = writable<Theme>(initialTheme);

// --- Efectos Secundarios (Aplicar tema y guardar preferencia) ---
if (browser) {
    // Aplicar tema inicial
    applyTheme(initialTheme);

    // Suscribirse a cambios en el store
    theme.subscribe((currentTheme) => {
        // Guardar preferencia si no es 'system'
        if (currentTheme === 'light' || currentTheme === 'dark') {
            localStorage.setItem(STORAGE_KEY, currentTheme);
        } else {
            // Si es 'system', quitar la preferencia explícita
            localStorage.removeItem(STORAGE_KEY);
        }
        // Aplicar el tema actual al DOM
        applyTheme(currentTheme);
    });

     // Escuchar cambios en la preferencia del sistema operativo
     const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
     const systemThemeChangeHandler = () => {
        // Solo re-aplicar si la preferencia actual es 'system'
        if (getInitialTheme() === 'system') { // Re-evalúa la preferencia actual desde localStorage
             applyTheme('system');
        }
     };
     mediaQuery.addEventListener('change', systemThemeChangeHandler);

     // Podríamos necesitar una forma de limpiar este listener si el layout se desmonta,
     // pero para el layout raíz es menos crítico.
}


export default theme; // Exportar el store como default