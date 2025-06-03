import Sortable from 'sortablejs';
import type { Action } from 'svelte/action';

// Definimos las opciones que nuestra acción puede recibir
interface SortableOptions extends Sortable.Options {
	onSort?: (event: Sortable.SortableEvent) => void;
    // No necesitamos 'disabled' aquí explícitamente si Sortable.Options ya lo tiene,
    // pero es bueno saber que existe. Sortable.Options incluye 'disabled'.
}

export const sortable: Action<HTMLElement, SortableOptions | undefined> = (
	node,
	options?
) => {
	const currentOptions = {
		animation: 150,
		ghostClass: 'sortable-ghost',
		dragClass: 'sortable-drag',
		...options, // Sobrescribir con las opciones pasadas
		onEnd: (event: Sortable.SortableEvent) => { // Asegurar tipo aquí
			if (options?.onSort) {
				options.onSort(event);
			}
		}
	};

	const instance = Sortable.create(node, currentOptions);

	const styleElement = document.createElement('style');
	styleElement.innerHTML = `
        .sortable-ghost {
            opacity: 0.4;
            background-color: #4a5568; /* Un color grisáceo, ajusta según tu tema */
        }
        .sortable-drag {
            /* Puedes añadir estilos si quieres que el elemento original cambie mientras se arrastra */
            /* opacity: 0.5; */
        }
        /* Evitar selección de texto mientras se arrastra */
        .sortable-chosen {
             user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
             -ms-user-select: none;
        }

    `;
	document.head.appendChild(styleElement);

	return {
		destroy() {
			styleElement.remove();
			instance.destroy();
		},
		update(newOptions?) {
			if (newOptions) {
				// Actualizar todas las opciones pasadas, incluyendo 'disabled'
				Object.keys(newOptions).forEach((key) => {
					const optionKey = key as keyof Sortable.Options;
					if (optionKey in instance.options || optionKey === 'disabled') { // Verificar si es una opción válida o 'disabled'
						instance.option(optionKey, newOptions[optionKey as keyof SortableOptions]);
					}
				});
                if (newOptions.onSort && options) { // Mantener la callback onSort si se actualiza
                    options.onSort = newOptions.onSort;
                }
			}
		}
	};
};