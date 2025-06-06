// src/lib/i18n/index.ts
import { browser } from '$app/environment';
import { register, init, getLocaleFromNavigator, locale as currentLocaleStore } from 'svelte-i18n';

// Importar los archivos de idioma (el loader se encargará de cargarlos)
// Si tienes muchos idiomas, podrías cargarlos dinámicamente.
import es from '$lib/translations/es.json';
import en from '$lib/translations/en.json';

const INIT_OPTIONS = {
	fallbackLocale: 'es', // Idioma por defecto si no se detecta o no está soportado
	initialLocale: null, // Se establecerá más abajo
	// formats: {}, // Para formatos de fecha/número específicos si los necesitas
	// warnOnMissingMessages: true, // Muestra warnings si falta una clave
};

// Función para registrar todos los idiomas que soportas
function registerLocales() {
	register('es', () => Promise.resolve(es)); // Carga directa para este ejemplo
	register('en', () => Promise.resolve(en));
	// Para carga dinámica:
	// register('de', () => import('../locales/de.json'));
}

// Preferencia guardada en localStorage
const LOCALE_STORAGE_KEY = 'preferred_locale_v1';

export function initializeLocalization() {
	registerLocales();

	let initialLocaleToSet: string | null = null;

	if (browser) {
		const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
		if (storedLocale) {
			initialLocaleToSet = storedLocale;
		} else {
			// Si no hay preferencia guardada, intentar detectar del navegador
			const browserLocale = getLocaleFromNavigator(); // ej. 'en-US', 'es-ES'
			if (browserLocale) {
				// Simplificar a 'en' o 'es' si es posible
				const langPart = browserLocale.split('-')[0];
				if (langPart === 'en' || langPart === 'es') { // Solo si soportamos la base
					initialLocaleToSet = langPart;
				}
			}
		}
	}
	// Si después de todo no se pudo determinar, usará el fallbackLocale
	init({ ...INIT_OPTIONS, initialLocale: initialLocaleToSet });
}

// Exportar el store del locale actual y la función para cambiarlo
export const locale = {
	subscribe: currentLocaleStore.subscribe,
	set: (newLocale: string) => {
		if (browser) {
			localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
		}
		currentLocaleStore.set(newLocale); // Esto actualiza el idioma en svelte-i18n
	}
};

// Llama a la inicialización cuando este módulo se carga
// (Asegúrate que se importe en un layout o página raíz)
if (browser) { // La inicialización que interactúa con localStorage y navigator debe ser client-side
    initializeLocalization();
} else {
    // Para SSR, podríamos querer inicializar con un locale por defecto o basado en cabeceras
    // Por ahora, nos enfocamos en el cliente para la detección automática
    registerLocales(); // Registrar para que el servidor pueda acceder a los mensajes
    init({ ...INIT_OPTIONS, initialLocale: INIT_OPTIONS.fallbackLocale });
}

// No necesitas exportar _ y t directamente si usas el $t automático en componentes Svelte
// Pero si los necesitas en archivos .js/.ts:
// import { get } from 'svelte/store';
// import { _, t as translate } from 'svelte-i18n';
// export const t = derived(locale, $locale => get(translate)); // o similar