import type { Action } from 'svelte/action';

// La acción recibe una callback que se ejecutará cuando se presione Escape
export const escape: Action<HTMLElement, () => void> = (node, callback) => {
	if (!callback) {
		// Si no se pasa callback, no hacer nada (o lanzar error)
		console.warn('Escape action used without a callback.');
		return {};
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			callback();
		}
	};

	// Añadir el listener al montar el elemento (o cuando la acción se aplica)
	document.addEventListener('keydown', handleKeyDown, true); // Usar 'true' para captura

	// Devolver un objeto con un método destroy para limpiar
	return {
		destroy() {
			// Quitar el listener cuando el elemento se destruye
			document.removeEventListener('keydown', handleKeyDown, true);
		}
		// No necesitamos 'update' para esta acción simple
	};
};