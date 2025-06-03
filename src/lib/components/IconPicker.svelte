<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { X as CloseIcon } from 'lucide-svelte';
	import { lucideIcons, lucideIconNames } from '$lib/icons/lucideIconMap'; // Nuestros iconos y nombres
	import type { LucideIconName } from '$lib/icons/lucideIconMap';

	export let isOpen = false; // Controla la visibilidad del modal
	export let selectedIcon: LucideIconName | undefined = undefined; // Icono actualmente seleccionado

	const dispatch = createEventDispatcher<{
		select: LucideIconName; // Evento cuando se selecciona un icono
		close: void; // Evento cuando se cierra el modal
	}>();

	function handleIconSelect(iconName: LucideIconName) {
		dispatch('select', iconName);
		closeModal();
	}

	function closeModal() {
		dispatch('close');
	}

	// Para filtrar iconos mientras se escribe (opcional pero útil)
	let searchTerm = '';
	let searchInput: HTMLInputElement;
    let modalContentElement: HTMLDivElement; // Referencia para enfocar

	$: filteredIconNames = searchTerm.trim()
		? lucideIconNames.filter((name) => name.toLowerCase().includes(searchTerm.toLowerCase()))
		: lucideIconNames;

    // Enfocar input al abrir (si se desea)
    $: if (isOpen && searchInput) {
        // Pequeño delay para asegurar que el DOM esté listo
        setTimeout(() => searchInput.focus(), 50);
    }

    function handleOverlayKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
            // Prevenir comportamiento por defecto si el div tuviera alguno (no en este caso)
			// event.preventDefault();
			closeModal();
		}
	}

    // Enfocar contenido del modal al abrir para atrapar el foco
    $: if (isOpen && modalContentElement) {
        setTimeout(() => {
            modalContentElement.focus(); // Enfocar el contenido del modal
            if (searchInput) searchInput.focus(); // Luego, si existe, el input de búsqueda
        }, 50);
    }

</script>

{#if isOpen}
	<!-- Fondo del Modal (Overlay) -->
	<div
		transition:fade={{ duration: 150 }}
		class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        role="button"
		tabindex="0"
		on:click|self={closeModal} 
        on:keydown={handleOverlayKeyDown}
		aria-label="Cerrar selector de iconos"
	>
		<!-- Contenido del Modal -->
		<div
            bind:this={modalContentElement}
			class="bg-slate-100 dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden z-[70]"
			role="dialog"
			aria-modal="true"
			aria-labelledby="icon-picker-title"
            tabindex="-1"
            on:click|stopPropagation
            on:keydown|stopPropagation={(e) => { if (e.key === 'Escape') closeModal(); }}
		>
			<!-- Cabecera del Modal -->
			<header class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
				<h2 id="icon-picker-title" class="text-lg font-semibold text-slate-800 dark:text-slate-100">
					Seleccionar Icono
				</h2>
				<button
					on:click={closeModal}
					class="p-1 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
					aria-label="Cerrar selector de iconos"
				>
					<CloseIcon size={20} />
				</button>
			</header>

			<!-- (Opcional) Barra de Búsqueda de Iconos -->
			<div class="p-3 border-b border-slate-200 dark:border-slate-700">
				<input
					type="search"
					bind:this={searchInput}
					bind:value={searchTerm}
					placeholder="Buscar icono por nombre..."
					class="w-full px-3 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                           bg-white border border-slate-300 text-slate-900 placeholder-slate-400
                           dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400
                           transition-colors"
				/>
			</div>

			<!-- Cuadrícula de Iconos -->
			<div class="p-4 overflow-y-auto flex-grow
                scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-700/50
                dark:scrollbar-thumb-slate-600 dark:scrollbar-track-slate-800/50
                hover:scrollbar-thumb-slate-500 dark:hover:scrollbar-thumb-slate-500
                scrollbar-thumb-rounded-full scrollbar-track-rounded-full
            ">
				{#if filteredIconNames.length > 0}
					<div class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
						{#each filteredIconNames as iconName (iconName)}
							{@const IconComponent = lucideIcons[iconName]}
							<button
								on:click={() => handleIconSelect(iconName)}
								class="flex flex-col items-center justify-center p-2 rounded-md aspect-square transition-colors
                                       text-slate-600 dark:text-slate-300
                                       hover:bg-blue-100 hover:text-blue-600
                                       dark:hover:bg-blue-700/50 dark:hover:text-blue-300
                                       focus:outline-none focus:ring-2 focus:ring-blue-500
                                       {selectedIcon === iconName
										? 'bg-blue-100 text-blue-600 dark:bg-blue-700/50 dark:text-blue-300 ring-2 ring-blue-500'
										: 'bg-slate-50 dark:bg-slate-700/50'}"
								title={iconName}
								aria-label={`Seleccionar icono ${iconName}`}
							>
								{#if IconComponent}
									<svelte:component this={IconComponent} size={36} />
									<span class="mt-1.5 text-xs truncate w-full text-center">{iconName}</span>
								{:else}
									<span class="text-xs text-red-500">?</span>
								{/if}
							</button>
						{/each}
					</div>
				{:else}
					<p class="text-center text-slate-500 dark:text-slate-400 py-8">
						No se encontraron iconos para "{searchTerm}".
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if}