<script lang="ts">
	import { searchTerm } from '$lib/stores/searchStore'; // Importar el store
	import { Search, X } from 'lucide-svelte'; // Añadir icono X para limpiar
    import { t } from 'svelte-i18n';

    // No necesitamos una variable local, bindeamos directamente al store ($searchTerm)
    // let localSearchTerm = ''; // <- Eliminar si la tenías

	// --- Exportar la referencia al elemento input ---
    export let inputElement: HTMLInputElement | undefined = undefined; // La variable que se bindea desde el padre

    function clearSearch() {
        searchTerm.set(''); // Poner el store a vacío
		inputElement?.focus(); // Opcional: re-enfocar después de limpiar
    }
</script>

<div class="mb-8 relative">
	<span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none">
		<Search size={20} />
	</span>
	<input
		type="search"
		bind:value={$searchTerm}
		bind:this={inputElement}
		placeholder={$t('search_placeholder_links')}
		class="w-full pl-10 pr-10 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150
            bg-white border-slate-300 text-slate-900 placeholder-slate-400
            dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100 dark:placeholder-gray-400
        "
	/>
    {#if $searchTerm}
	    <button
            on:click={clearSearch}
            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors
                text-slate-500 hover:text-slate-900 hover:bg-slate-200
                dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-600
            "
            aria-label="Limpiar búsqueda"
            title="Limpiar búsqueda"
        >
		    <X size={18} />
	    </button>
    {/if}
</div>