<!-- src/lib/components/Category.svelte -->
<script lang="ts">
    import type { Category as CategoryType } from '$lib/types/definitions';
    import Subcategory from '$lib/components/Subcategory.svelte'; // <-- CORRECTO
    import LinkItem from './LinkItem.svelte';
    import { Folder, ChevronDown, Plus, CornerDownRight, Link as LinkIcon, Trash2, Pencil } from 'lucide-svelte';
    import { addSubcategory, addLink, deleteCategory, updateCategory, moveSubcategory } from '$lib/stores/linkStore'; // Import deleteCategory
    import { browser } from '$app/environment';
    import { fade, slide } from 'svelte/transition';
    import type { SortableEvent } from 'sortablejs'; // Importar tipo SortableEvent
    import { sortable } from '$lib/actions/sortable'; // Importar acción
    import { searchTerm } from '$lib/stores/searchStore'; // Importar para deshabilitar drag
    import { flip } from 'svelte/animate';
    import { moveLink, moveLinkBetweenLists } from '$lib/stores/linkStore';
    import { escape } from '$lib/actions/escapeHandler';
    import IconPicker from './IconPicker.svelte';
    import { lucideIcons } from '$lib/icons/lucideIconMap';
    import type { LucideIconName } from '$lib/icons/lucideIconMap';
  
    export let category: CategoryType;
    let isOpen = true; // Hacerla plegable

    // Estados para los formularios de añadir
    let showAddSubcategoryForm = false;
    let showAddLinkForm = false;
    let newSubcategoryTitle = '';
    let newLinkTitle = '';
    let newLinkUrl = '';

    // --- Edición ---
    let isEditing = false;
    let editedTitle = '';
    let editedIcon: LucideIconName | undefined = undefined; // Para el icono a editar
    let showIconPicker = false; // Para controlar el modal

    // Necesitamos funciones "cancel" para los formularios de añadir
    function cancelAddSubcategoryForm() {
        showAddSubcategoryForm = false;
        newSubcategoryTitle = '';
    }

    function cancelAddDirectLinkForm() {
        showAddLinkForm = false; // Asumiendo que tienes una variable 'showAddLinkForm' para el enlace directo
        newLinkTitle = '';    // y variables para sus inputs
        newLinkUrl = '';
    }

    function startEditing() {
        editedTitle = category.title;
        editedIcon = category.icon as LucideIconName | undefined;
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
             // Llamar a updateCategory con título e icono
             updateCategory(category.id, { title: editedTitle, icon: editedIcon });
             isEditing = false;
             showIconPicker = false;
         }
    }

    function handleIconSelected(event: CustomEvent<LucideIconName>) {
        editedIcon = event.detail;
        // Opcional: si quieres guardar inmediatamente al seleccionar icono sin esperar al "Ok" del título:
        // updateCategory(category.id, { icon: editedIcon });
        // Pero es mejor guardarlo junto con el título al hacer clic en "Ok"
    }
    // --- Fin Edición ---

    // --- Handler para reordenar subcategorías ---
    function handleSubcategorySort(event: SortableEvent) {
        if (event.oldIndex !== undefined && event.newIndex !== undefined) {
            if (browser) {
                moveSubcategory(category.id, event.oldIndex, event.newIndex);
            }
        } else {
            console.warn('Sortable event missing indices:', event);
        }
    }

    // --- Handler para reordenar enlaces directos ---
    function handleDirectLinkSort(event: SortableEvent) {
        if (event.oldIndex === undefined || event.newIndex === undefined || !event.item.dataset.linkId) return;
        if (!browser) return;

        const linkId = event.item.dataset.linkId;
        const fromList = event.from as HTMLElement;
        const toList = event.to as HTMLElement;

        const originalParentId = fromList.dataset.parentId;
        const originalParentType = fromList.dataset.parentType as 'category' | 'subcategory';
        const newParentId = toList.dataset.parentId;
        const newParentType = toList.dataset.parentType as 'category' | 'subcategory';

        if (!originalParentId || !originalParentType || !newParentId || !newParentType) {
            console.error('Drag&Drop: Missing parent data attributes on lists.');
            return;
        }

        if (fromList === toList) {
            // Reordenar dentro de la misma lista de enlaces directos de ESTA categoría
            moveLink(category.id, 'category', event.oldIndex, event.newIndex);
        } else {
            // Mover a una lista diferente (podría ser otra categoría o una subcategoría)
            moveLinkBetweenLists(
                linkId,
                originalParentId,
                originalParentType,
                newParentId,
                newParentType,
                event.newIndex
            );
        }
    }

    function handleAddSubcategory() {
        if (browser) {
            addSubcategory(category.id, newSubcategoryTitle);
            newSubcategoryTitle = ''; // Limpiar
            showAddSubcategoryForm = false; // Ocultar formulario
        }
    }

    function handleAddLink() {
         if (browser) {
            addLink(category.id, { title: newLinkTitle, url: newLinkUrl }, 'category');
            newLinkTitle = ''; // Limpiar
            newLinkUrl = '';   // Limpiar
            showAddLinkForm = false; // Ocultar formulario
        }
    }
    
    function handleDeleteCategory() {
		if (browser && confirm(`¿Seguro que quieres eliminar la categoría "${category.title}" y TODO su contenido?`)) {
			deleteCategory(category.id);
		}
	}

    function handleToggleOpen(event: MouseEvent | KeyboardEvent) {
        // No plegar/desplegar si estamos editando o si el clic fue en un botón dentro del form
        if (isEditing || (event.target instanceof Element && event.target.closest('form'))) {
           return;
        }
        isOpen = !isOpen;
    }
</script>
  
<div transition:fade={{ duration: 150 }}
class="mb-6 p-4 rounded-lg shadow-md relative group transition-colors duration-150
bg-white/80 backdrop-blur-sm border border-slate-200/50
dark:bg-slate-800/60 dark:border-transparent
">
	<!-- Cabecera: Cambiado a DIV, añadido role y tabindex para accesibilidad -->
	<div
        role="button"
        tabindex={isEditing ? -1 : 0}
        on:click={handleToggleOpen}
        on:keydown={(e) => e.key === 'Enter' || e.key === ' ' ? handleToggleOpen(e) : null}
        class="flex items-center w-full text-left mb-4 sm:pr-12 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-sm
               focus:ring-offset-white dark:focus:ring-offset-slate-800"
    >
    <!-- 1. CHEVRON (a la izquierda) -->
    <ChevronDown
        size={20}
        class="text-slate-500 dark:text-slate-400 transition-transform duration-200 flex-shrink-0 mr-2
               {isOpen ? '' : '-rotate-90'} {isEditing ? 'opacity-50' : ''}"
    />

    <!-- 2. CONTENEDOR PARA ICONO Y TÍTULO/FORMULARIO (NO flex-grow aquí) -->
        <div class="flex items-center min-w-0">
            {#if !isEditing}
                <!-- Icono de Categoría (Modo Vista) -->
                {#if category.icon && lucideIcons[category.icon as LucideIconName]}
                    {@const IconComponent = lucideIcons[category.icon as LucideIconName]}
                    <svelte:component
                        this={IconComponent}
                        size={20}
                        class="mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0 group-hover:text-blue-500 dark:group-hover:text-blue-300"
                    />
                {:else}
                    <Folder
                        size={20}
                        class="mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0 group-hover:text-blue-500 dark:group-hover:text-blue-300 {isEditing ? 'opacity-50' : ''}"
                    />
                {/if}
                <!-- Título H2 (Modo Vista) -->
                <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-300">
                    {category.title}
                </h2>
                <!-- 3. BOTONES EDITAR/ELIMINAR (AHORA JUNTO AL TÍTULO EN MODO VISTA) -->
                <div class="flex items-center ml-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                    <button
                        on:click|stopPropagation={startEditing}
                        aria-label={`Editar categoría ${category.title}`}
                        class="p-1 rounded text-slate-600 hover:text-yellow-600 dark:text-slate-500 dark:hover:text-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        title="Editar categoría"
                    > <Pencil size={16} /> </button>
                    <button
                        on:click|stopPropagation={handleDeleteCategory}
                        aria-label={`Eliminar categoría ${category.title}`}
                        class="p-1 rounded text-slate-600 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                        title="Eliminar categoría"
                    > <Trash2 size={16} /> </button>
                </div>
            {:else}
                 <!-- Formulario Edición Título e Icono de Categoría -->
                 <form use:escape={cancelEditing} on:submit|preventDefault={handleSaveEdit} class="flex-grow flex gap-2 items-center">
                <!-- Botón para abrir IconPicker -->
                <button
                    type="button"
                    on:click|stopPropagation={() => showIconPicker = true}
                    class="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                    title="Cambiar icono"
                >
                    {#if editedIcon && lucideIcons[editedIcon]}
                        {@const CurrentEditIcon = lucideIcons[editedIcon]}
                        <svelte:component this={CurrentEditIcon} size={18} class="text-slate-700 dark:text-slate-200" />
                    {:else}
                        <Folder size={18} class="text-slate-700 dark:text-slate-200" />
                    {/if}
                </button>
                <input
                    type="text"
                    bind:value={editedTitle}
                    required
                    class="w-full px-2 py-1 rounded text-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 transition-colors
                           bg-white border border-slate-300 text-slate-900
                           dark:bg-slate-600 dark:border-slate-500 dark:text-gray-100 dark:placeholder-gray-400"
                    on:click|stopPropagation
                    on:keydown|stopPropagation
                />
                <button type="submit" class="px-1.5 py-0.5 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-semibold disabled:opacity-50" disabled={!editedTitle.trim()}>Ok</button>
                <button type="button" on:click|stopPropagation={cancelEditing} class="px-1.5 py-0.5 text-xs transition-colors
                           text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">X</button>
             </form>
        {/if}
        
        
        </div>
	</div>

    <!-- Contenido Desplegable -->
	{#if isOpen}
		<!-- Subcategorías -->
		{#if category.subcategories.length > 0}
			<div
                class="mb-4 space-y-3 transition-opacity"
                use:sortable={{ 
                    group: `subcategories-${category.id}`, 
                    handle: '.subcategory-drag-handle', 
                    onSort: handleSubcategorySort,
                    disabled: !!$searchTerm.trim()
                    }}
            >
				{#each category.subcategories as subcat (subcat.id)}
					<!-- ¡Pasar categoryId a Subcategory! -->
                    <div animate:flip={{ duration: 300 }}>
                        <div class="relative">
					        <Subcategory subcategory={subcat} categoryId={category.id} />
                            {#if !$searchTerm.trim()}
                                <button
                                    class="subcategory-drag-handle absolute top-1 left-[-10px] p-1 text-slate-600 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-300 cursor-move opacity-20 hover:opacity-100 transition-opacity focus:opacity-100"
                                    aria-label={`Mover subcategoría ${subcat.title}`}
                                    title="Mover subcategoría"
                                >
                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                                </button>
                            {/if}
                        </div>
                    </div>
				{/each}
			</div>
		{/if}

        <!-- Formulario Añadir Subcategoría (con transición) -->
        {#if showAddSubcategoryForm}
            <form
                use:escape={cancelAddSubcategoryForm}
                transition:slide={{ duration: 300 }}
                on:submit|preventDefault={handleAddSubcategory}
                class="mb-4 pl-4 ml-1 flex gap-2 items-center"
            >
                <CornerDownRight size=16 class="text-slate-500 dark:text-slate-500 flex-shrink-0" />
                <input
                    type="text"
                    bind:value={newSubcategoryTitle}
                    placeholder="Nombre subcategoría..."
                    required
                    class="flex-grow px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors
                              bg-white border border-slate-300 text-slate-900 placeholder-slate-400
                              dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100 dark:placeholder-gray-400
                       "/>
                <button type="submit" class="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-semibold disabled:opacity-50" disabled={!newSubcategoryTitle.trim()}>Guardar</button>
                <button type="button" on:click={() => showAddSubcategoryForm = false} class="px-2 py-1 text-xs transition-colors
                           text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200
                ">Cancelar</button>
            </form>
        {/if}

		<!-- Enlaces Directos -->
		{#if category.links.length > 0}
			<div class:mt-4={category.subcategories.length > 0 || showAddSubcategoryForm} class="pl-4 border-l-2 border-dashed transition-colors border-slate-300 dark:border-slate-700">
				<h4 class="text-sm uppercase mb-2 ml-1 font-semibold transition-colors text-slate-500 dark:text-slate-400">Enlaces directos</h4>
				<div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
                    use:sortable={{ 
                        group: `shared-links`, 
                        handle: '.link-drag-handle', 
                        onSort: handleDirectLinkSort,
                        disabled: !!$searchTerm.trim()
                        }}
                    class:opacity-70={$searchTerm.trim()}
                    class:cursor-not-allowed={$searchTerm.trim()}
                    
                    data-parent-id={category.id}
                    data-parent-type="category"                    
                >
					{#each category.links as link (link.id)}
						<!-- ¡Pasar parentId y parentType a LinkItem! -->
                        <div animate:flip={{ duration: 300 }} class="min-w-0" data-link-id={link.id}>
                            <div class="relative">
						        <LinkItem {link} parentId={category.id} parentType="category" />
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
					{/each}
				</div>
			</div>
		{/if}

         <!-- Formulario Añadir Enlace (con transición) -->
        {#if showAddLinkForm}
            <form
                use:escape={cancelAddDirectLinkForm}
                transition:slide={{ duration: 300 }}
                on:submit|preventDefault={handleAddLink}
                class="mt-3 pl-4 ml-1 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center border-l-2 border-dashed border-transparent"
            >
                 <LinkIcon size=16 class="text-slate-500 flex-shrink-0 hidden sm:block mt-1.5" />
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
                    placeholder="URL (ej: google.com)"
                    required
                    class="w-full sm:w-auto flex-grow px-2 py-1 transition-colors
                                bg-white border border-slate-300 text-slate-900 placeholder-slate-400
                                dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100 dark:placeholder-gray-400
                                rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    pattern=".*\..*"
			        title="URL(ej: google.com)"
                 />
                <div class="flex gap-2 justify-end sm:justify-start mt-1 sm:mt-0">
                    <button type="submit" class="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-semibold disabled:opacity-50" disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}>Guardar</button>
                    <button type="button" on:click={() => showAddLinkForm = false} class="px-2 py-1 text-xs transition-colors
                                text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200
                    ">Cancelar</button>
                </div>
            </form>
        {/if}


		<!-- Mensaje si está vacía -->
		{#if category.subcategories.length === 0 && category.links.length === 0 && !showAddSubcategoryForm && !showAddLinkForm}
			<p class="px-4 pb-2 text-sm italic transition-colors text-slate-400 dark:text-slate-500">Categoría vacía</p>
		{/if}

		<!-- Botones para añadir -->
		<div class="mt-4 pt-3 pl-4 border-t transition-colors border-slate-200 dark:border-slate-700/50 flex flex-wrap gap-x-4 gap-y-2">
            {#if !showAddSubcategoryForm}
			    <button on:click={() => { showAddSubcategoryForm = true; showAddLinkForm = false; }} class="flex items-center gap-1 text-sm transition-colors
                           text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300
                ">
				    <CornerDownRight size={14}/> Añadir Subcategoría
			    </button>
            {/if}
            {#if !showAddLinkForm}
                <button on:click={() => { showAddLinkForm = true; showAddSubcategoryForm = false; }} class="flex items-center gap-1 text-sm transition-colors
                           text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300
                ">
				    <LinkIcon size={14}/> Añadir Enlace Aquí
			    </button>
            {/if}
		</div>
	{/if}
</div>

<!-- Modal IconPicker (fuera del flujo principal del div de categoría) -->
<IconPicker
    bind:isOpen={showIconPicker}
    selectedIcon={editedIcon}
    on:select={handleIconSelected}
    on:close={() => showIconPicker = false}
/>