<script lang="ts">
    import type { Link } from '$lib/types/definitions';
    import { ExternalLink, Trash2, Pencil, Globe } from 'lucide-svelte';
	import DefaultFavicon from './DefaultFavicon.svelte';
  
    export let link: Link;
    // Necesitamos saber quién es el padre para llamar a deleteLink correctamente
	export let parentId: string;
	export let parentType: 'category' | 'subcategory';

    // ¡Importante! Importa la función deleteLink
	import { deleteLink, updateLink } from '$lib/stores/linkStore';
	import { browser } from '$app/environment';

	// --- Svelte Imports ---
    import { fade } from 'svelte/transition'; // Para aparecer/desaparecer

	import { escape } from '$lib/actions/escapeHandler';
	import { t } from 'svelte-i18n';

    // Estado para controlar el modo edición
	let isEditing = false;
	let editedTitle = '';
	let editedUrl = '';

	// --- Favicon Logic ---
	let faviconSrc: string | null = null;
	let faviconError = false;

	// $: reacciona a cambios en link.url
	$: {
		if (browser && link.url) {
			faviconError = false; // Resetear error
			try {
                // Obtener solo el hostname (ej: 'figma.com')
				const hostname = new URL(link.url).hostname;
                // Construir la URL del servicio de Google
                // Puedes ajustar 'sz=32' para tamaño (16, 32, 64, etc.)
                faviconSrc = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;

			} catch (e) {
				console.error(`Invalid URL: ${link.url}`, e);
				faviconError = true;
				faviconSrc = null;
			}
		} else {
			faviconError = true;
			faviconSrc = null;
		}
	}
	// --- Fin Favicon Logic ---

	function startEditing() {
		editedTitle = link.title; // Cargar datos actuales en el formulario
		editedUrl = link.url;
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
		// No necesitamos resetear editedTitle/Url ya que se recargan al abrir
	}

	function handleSaveEdit() {
		if (browser) {
            // Validar antes de guardar (aunque el store también valida)
            if (!editedTitle.trim() || !editedUrl.trim()) {
                alert("El título y la URL no pueden estar vacíos.");
                return;
            }
			updateLink(parentId, link.id, parentType, { title: editedTitle, url: editedUrl });
			isEditing = false; // Salir del modo edición
		}
	}

	  function handleDelete() {
		// Opcional: Añadir confirmación
		  if (browser && confirm(`¿Seguro que quieres eliminar el enlace "${link.title}"?`)) {
			  deleteLink(parentId, link.id, parentType);
		  }
	  }
</script>
  
{#if !isEditing}
	<!-- MODO VISTA NORMAL -->
	<div transition:fade={{ duration: 150 }} class="flex items-center rounded group relative pr-16 transition-colors duration-150
                bg-slate-100 border border-slate-200/80
                dark:bg-slate-700 dark:border-transparent
         ">
		<a
			href={link.url}
			target="_blank"
			rel="noopener noreferrer"
			class="flex-grow flex items-center p-2 rounded-l transition-colors duration-150 min-w-0 group-hover:bg-slate-200/50 dark:group-hover:bg-slate-600/50"
			title={link.url}
		>
			<!-- Favicon / Default Icon -->
			<span class="mr-2 ml-1 flex-shrink-0 h-4 w-4 flex items-center justify-center">
				{#if faviconError || !faviconSrc}
					<DefaultFavicon size={16} className="text-slate-400 dark:text-slate-500" />
				{:else}
					<img
						src={faviconSrc}
						alt=""
						class="h-full w-full object-contain"
						loading="lazy"
						on:error={() => (faviconError = true)}
					/>
				{/if}
			</span>
			<span class="truncate transition-colors
                       text-slate-800 group-hover:text-blue-600
                       dark:text-slate-100 dark:group-hover:text-blue-300
            ">{link.title}</span>
		</a>
		<!-- Botón Editar (aparece al hover) -->
		<button
			on:click={startEditing}
			aria-label={`${$t('edit_button_title')} ${link.title}`}
			class="absolute right-8 top-0 bottom-0 px-2 flex items-center justify-center text-slate-600 hover:text-yellow-600 dark:text-slate-500 dark:hover:text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus:opacity-100"
			title={$t('link.edit_button_title')}
		>
			<Pencil size={14} />
		</button>
		<!-- Botón Eliminar (aparece al hover) -->
		<button
			on:click={handleDelete}
			aria-label={`${$t('delete_button_title')} ${link.title}`}
			class="absolute right-0 top-0 bottom-0 px-2 flex items-center justify-center text-slate-600 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus:opacity-100"
			title={$t('link.delete_button_title')}
		>
			<Trash2 size={14} />
		</button>
	</div>
{:else}
	<!-- MODO EDICIÓN -->
	<form 
		use:escape={cancelEditing}
		transition:fade={{ duration: 150 }} 
		on:submit|preventDefault={handleSaveEdit} 
		class="flex flex-col gap-2 items-stretch bg-slate-100 dark:bg-slate-700 p-2 rounded border border-slate-200/80 dark:border-transparent
    ">
        <input
            type="text"
            bind:value={editedTitle}
            required
            placeholder={$t('edit_link_title_placeholder')}
            class="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors
                   bg-white border border-slate-300 text-slate-900 placeholder-slate-400
                   dark:bg-slate-600 dark:border-slate-500 dark:text-gray-100 dark:placeholder-gray-400"
        />
        <input
            type="text"
            bind:value={editedUrl}
            required
            placeholder={$t('edit_link_url_placeholder')}
            class="w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors
                   bg-white border border-slate-300 text-slate-900 placeholder-slate-400
                   dark:bg-slate-600 dark:border-slate-500 dark:text-gray-100 dark:placeholder-gray-400"
			pattern=".*\..*"
			title={$t('add_link_url_placeholder')}
        />
        <div class="flex gap-2 justify-end flex-shrink-0">
             <button type="submit" class="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-semibold disabled:opacity-50" disabled={!editedTitle.trim() || !editedUrl.trim()}>{$t('save_button')}</button>
             <button type="button" on:click={cancelEditing} class="px-2 py-1 text-xs transition-colors
                        text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200
             ">{$t('cancel_button')}</button>
        </div>
    </form>
{/if}