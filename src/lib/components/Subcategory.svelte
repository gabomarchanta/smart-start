<!-- src/lib/components/Subcategory.svelte -->
<script lang="ts">
	// --- Type Imports ---
	import type { Subcategory as SubcategoryType } from '$lib/types/definitions';
	import type { SortableEvent } from 'sortablejs';

	// --- Component Imports ---
	import LinkItem from './LinkItem.svelte';
	import IconPicker from './IconPicker.svelte';

	// --- Icon Imports ---
	import { ChevronDown, Plus, Link as LinkIcon, Trash2, Pencil, Folder } from 'lucide-svelte';
    import { lucideIcons } from '$lib/icons/lucideIconMap';
    import type { LucideIconName } from '$lib/icons/lucideIconMap';

	// --- Store/Helper Imports ---
	import { addLink, deleteSubcategory, updateSubcategory } from '$lib/stores/linkStore';

	// --- Svelte Imports ---
	import { browser } from '$app/environment';
	import { fade, slide } from 'svelte/transition'; // Usaremos slide para el form
    import { flip } from 'svelte/animate';

	import { sortable } from '$lib/actions/sortable';
	import { moveLink } from '$lib/stores/linkStore'; // <-- Importar moveLink
    import { searchTerm } from '$lib/stores/searchStore'; // <-- Importar searchTerm

	import { escape } from '$lib/actions/escapeHandler';


	// --- Props ---
	export let subcategory: SubcategoryType;
	export let categoryId: string; // ID de la categoría padre (necesario para borrar)

	// --- Local State ---
	let isOpen = true; // Para plegar/desplegar
	let showAddLinkForm = false;
	let newLinkTitle = '';
	let newLinkUrl = '';

  	// --- Edición ---
  	let isEditing = false;
    let editedTitle = '';
	let editedIcon: LucideIconName | undefined = undefined;
	let showIconPicker = false;

    function startEditing() {
        editedTitle = subcategory.title;
		editedIcon = subcategory.icon as LucideIconName | undefined; // Cargar icono actual
        isEditing = true;
    }

    function cancelEditing() {
        isEditing = false;
		showIconPicker = false;
    }

    function handleSaveEdit() {
         if (browser) {
            if (!editedTitle.trim()) {
                alert("El título no puede estar vacío.");
                return;
            }
            updateSubcategory(categoryId, subcategory.id, { title: editedTitle, icon: editedIcon });
            isEditing = false;
			showIconPicker = false;
         }
    }

	function handleIconSelected(event: CustomEvent<LucideIconName>) {
        editedIcon = event.detail;
    }
	// --- Fin Edición ---

	// --- Event Handlers ---
	function handleAddLink() {
		if (browser) {
			// Usamos subcategory.id como parentId y 'subcategory' como parentType
			addLink(subcategory.id, { title: newLinkTitle, url: newLinkUrl }, 'subcategory');
			newLinkTitle = ''; // Limpiar
			newLinkUrl = ''; // Limpiar
			showAddLinkForm = false; // Ocultar formulario
		}
	}

	function handleDeleteSubcategory() {
		if (
			browser &&
			confirm(
				`¿Seguro que quieres eliminar la subcategoría "${subcategory.title}" y TODOS sus enlaces?`
			)
		) {
			// Usamos categoryId (el padre de esta subcategoría) y el id de esta subcategoría
			deleteSubcategory(categoryId, subcategory.id);
		}
	}

	// --- Handler para reordenar enlaces dentro de la subcategoría ---
    function handleSubcategoryLinkSort(event: SortableEvent) {
        if (event.oldIndex !== undefined && event.newIndex !== undefined) {
            if (browser) {
                // Llamar a moveLink con el ID de *esta* subcategoría y tipo 'subcategory'
                moveLink(subcategory.id, 'subcategory', event.oldIndex, event.newIndex);
            }
        } else {
            console.warn('Sortable event missing indices:', event);
        }
    }

  function handleToggleOpen(event: MouseEvent | KeyboardEvent) {
        if (isEditing || (event.target instanceof Element && event.target.closest('form'))) {
           return;
        }
        isOpen = !isOpen;
    }

	// La función para cancelar/ocultar el form de añadir enlace:
    function cancelAddLinkForm() {
        showAddLinkForm = false;
        newLinkTitle = ''; // Opcional: limpiar campos
        newLinkUrl = '';
    }
</script>

<!-- Contenedor principal: relative para posicionar botón delete, group para hover -->
<div transition:fade={{ duration: 150 }} class="mb-4 pl-4 relative group transition-colors border-l-2 border-slate-300 dark:border-slate-600">
	<!-- Cabecera: Cambiado a DIV -->
	<div
    role="button"
    tabindex={isEditing ? -1 : 0}
    on:click={handleToggleOpen}
    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') ? handleToggleOpen(e) : null}
    class="flex items-center w-full text-left mb-2 pr-16 sm:pr-12 cursor-pointer
           focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-sm
           focus:ring-offset-2 focus:ring-offset-white
           dark:focus:ring-offset-slate-800
           transition-shadow"
	>
		<!-- Icono, Título/Formulario Edición, Botones Edit/Delete -->
		 <!-- 1. CHEVRON -->
        <ChevronDown
            size={18}
            class="mr-2 text-slate-500 dark:text-slate-400 transition-transform duration-200 flex-shrink-0 {isOpen ? '' : '-rotate-90'} {isEditing ? 'opacity-50' : ''}"
        />
         <!-- 2. CONTENEDOR PARA ICONO Y TÍTULO/FORMULARIO -->
        <div class="flex items-center min-w-0">
            {#if !isEditing}
            <!-- Contenedor para Icono y Título (para agruparlos y que los botones de acción queden después) -->
            <div class="flex items-center min-w-0">
                <!-- Icono de Subcategoría -->
                {#if subcategory.icon && lucideIcons[subcategory.icon as LucideIconName]}
                    {@const IconComponent = lucideIcons[subcategory.icon as LucideIconName]}
                    <svelte:component
                        this={IconComponent}
                        size={18}
                        class="mr-1.5 text-slate-600 dark:text-slate-300 flex-shrink-0 group-hover:text-blue-600 dark:group-hover:text-blue-300"
                    />
                {:else}                    
                    <Folder size={18} class="mr-1.5 text-slate-600 dark:text-slate-300 flex-shrink-0 group-hover:text-blue-600 dark:group-hover:text-blue-300"/>
                {/if}
                <h3 class="text-lg font-semibold truncate transition-colors
                       text-slate-700 group-hover:text-blue-600
                       dark:text-slate-300 dark:group-hover:text-blue-300
                ">{subcategory.title}</h3>
            </div>
        <!-- Botones Editar/Eliminar (AHORA JUNTO AL TÍTULO EN MODO VISTA) -->
        <div class="flex items-center ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
            <button
                on:click|stopPropagation={startEditing}
                aria-label={`Editar subcategoría ${subcategory.title}`}
                class="p-1 rounded text-slate-600 hover:text-yellow-600 dark:text-slate-500 dark:hover:text-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                title="Editar subcategoría"
             >
                <Pencil size={14} />
            </button>
            <button
                on:click|stopPropagation={handleDeleteSubcategory}
                aria-label={`Eliminar subcategoría ${subcategory.title}`}
                class="p-1 rounded text-slate-600 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                title="Eliminar subcategoría"
            >
                <Trash2 size={14} />
            </button>
        </div>
        {:else}
            <!-- Formulario Edición Título e Icono de Subcategoría -->
			<form use:escape={cancelEditing} on:submit|preventDefault={handleSaveEdit} class="flex-grow flex gap-2 items-center mr-1">
				<button
					type="button"
					on:click|stopPropagation={() => showIconPicker = true}
					class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
					title="Cambiar icono de subcategoría"
				>
					{#if editedIcon && lucideIcons[editedIcon]}
						{@const CurrentEditIcon = lucideIcons[editedIcon]}
						<svelte:component this={CurrentEditIcon} size={16} class="text-slate-700 dark:text-slate-200" />
					{:else}
						<Folder size={16} class="text-slate-700 dark:text-slate-200" />
					{/if}
				</button>
                <input
                    type="text"
                    bind:value={editedTitle}
                    required
                    class="w-full px-2 py-0.5 transition-colors
                              bg-white border border-slate-300 text-slate-900 placeholder-slate-400
                              dark:bg-slate-600 dark:border-slate-500 dark:text-gray-100 dark:placeholder-gray-400
							  rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    on:click|stopPropagation
                    on:keydown|stopPropagation
                />
                <button type="submit" class="px-1.5 py-0.5 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-semibold disabled:opacity-50" disabled={!editedTitle.trim()}>Ok</button>
                <button type="button" on:click|stopPropagation={cancelEditing} class="px-1.5 py-0.5 text-xs transition-colors
                           text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200
                ">X</button>
            </form>
        {/if}
		</div>
	</div>

	<!-- Contenido Desplegable -->
	{#if isOpen}
		<!-- Grid de Enlaces -->
		<div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-4"
            use:sortable={{ 
                group: `links-subcategory-${subcategory.id}`, 
                handle: '.link-drag-handle', 
                onSort: handleSubcategoryLinkSort,
                disabled: !!$searchTerm.trim() 
                }}
        >
			{#each subcategory.links as link (link.id)}
				<!-- Pasar props requeridas a LinkItem -->
				<div animate:flip={{ duration: 500 }} class="min-w-0">
					<div class="relative">
						<LinkItem {link} parentId={subcategory.id} parentType="subcategory" />
						{#if !$searchTerm.trim()}
							<button
                                class="link-drag-handle absolute top-1/2 left-[-10px] -translate-y-1/2 p-1 text-slate-600 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-300 cursor-move opacity-20 hover:opacity-100 transition-opacity focus:opacity-100"
                                aria-label={`Mover enlace ${link.title}`}
                                title="Mover enlace"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                            </button>
                        {/if}
                    </div>
				</div>
			{:else}
				{#if !showAddLinkForm}
					<!-- Mensaje si no hay enlaces Y no se muestra el form -->
					<p class="col-span-full text-sm italic transition-colors text-slate-400 dark:text-slate-500">Vacío</p>
				{/if}
			{/each}
		</div>

		<!-- Formulario Añadir Enlace (Oculto por defecto) -->
		{#if showAddLinkForm}
			<form
				use:escape={cancelAddLinkForm}
                transition:slide={{ duration: 500 }}
                on:submit|preventDefault={handleAddLink}
                class="mt-3 pl-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
            >
				<LinkIcon size={16} class="text-slate-500 dark:text-slate-500 flex-shrink-0 hidden sm:block mt-1.5" />
				<input
					type="text"
					bind:value={newLinkTitle}
					placeholder="Título enlace..."
					required
					class="w-full sm:w-auto flex-grow px-2 py-1 transition-colors
                               bg-white border border-slate-300 text-slate-900 placeholder-slate-400
                               dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100 dark:placeholder-gray-400
							   rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
				<input
					type="text"
					bind:value={newLinkUrl}
					placeholder="URL"
					required
					class="w-full sm:w-auto flex-grow px-2 py-1 transition-colors
                                bg-white border border-slate-300 text-slate-900 placeholder-slate-400
                                dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100 dark:placeholder-gray-400
								rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    pattern=".*\..*"
			        title="URL(ej: google.com)"
				/>
				<div class="flex gap-2 justify-end sm:justify-start mt-1 sm:mt-0">
					<button
						type="submit"
						class="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-semibold disabled:opacity-50"
						disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}>Guardar</button
					>
					<button
						type="button"
						on:click={() => (showAddLinkForm = false)}
						class="px-2 py-1 text-xs transition-colors
                                text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200
                    ">Cancelar
					</button>
				</div>
			</form>
		{/if}

		<!-- Botón para mostrar Formulario Añadir Enlace -->
		<div class="mt-3 pl-4">
			{#if !showAddLinkForm}
				<button
					on:click={() => (showAddLinkForm = true)}
					class="flex items-center gap-1 text-sm transition-colors
                           text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300
                ">
					<LinkIcon size={14} /> Añadir Enlace Aquí
				</button>
			{/if}
		</div>
	{/if}
</div>

<IconPicker
    bind:isOpen={showIconPicker}
    selectedIcon={editedIcon}
    on:select={handleIconSelected}
    on:close={() => showIconPicker = false}
/>