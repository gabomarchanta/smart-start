<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import categoriesStore, { addCategory } from '$lib/stores/linkStore'; // Importa el store y un helper
	import { searchTerm } from '$lib/stores/searchStore';
	import { derived } from 'svelte/store'; // <-- Importar derived
	import type { Category, Subcategory, Link, SmartStartData } from '$lib/types/definitions'; // Importar tipos
	// --- Fuse.js Imports ---
	import Fuse from 'fuse.js';
	import type { IFuseOptions, FuseResult } from 'fuse.js'; // Importar tipos de Fuse
	import CategoryComponent from '$lib/components/Category.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte'; // Asumimos que ya existe (lo creamos antes)
	import { flip } from 'svelte/animate';
	import { PlusCircle, Settings, Download, Upload, Search as SearchIcon } from 'lucide-svelte';
	import type { SortableEvent } from 'sortablejs';
	import { sortable } from '$lib/actions/sortable'; // <-- Importar la acción
	import { moveCategory } from '$lib/stores/linkStore'; // <-- Importar el helper
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import SaveIndicator from '$lib/components/SaveIndicator.svelte';
	import { escape } from '$lib/actions/escapeHandler';

	// Acceso reactivo al valor del store
	const categories = categoriesStore; // Svelte automáticamente subscribe/unsubscribe con el $

    // --- Estado para el motor de búsqueda seleccionado ---
    type SearchEngineKey = 
        | 'google'
        | 'duckduckgo'
        | 'bing'
        | 'youtube'
        | 'wikipedia'
        | 'amazon'
        | 'mercadolibre' // (Añadiremos Argentina como ejemplo, se puede generalizar)
        | 'github'
        | 'stackoverflow';
    let selectedSearchEngine: SearchEngineKey = 'google'; // Google por defecto

    interface SearchEngineDetails {
        baseUrl: string;
        queryParam: string;
        placeholder: string;
        name: string; // Nombre para mostrar en el dropdown
    }

    const searchEngines: Record<SearchEngineKey, SearchEngineDetails> = {
        google: {
            baseUrl: 'https://www.google.com/search',
            queryParam: 'q',
            placeholder: 'Buscar en Google...',
            name: 'Google'
        },
        duckduckgo: {
            baseUrl: 'https://duckduckgo.com/',
            queryParam: 'q',
            placeholder: 'Buscar en DuckDuckGo...',
            name: 'DuckDuckGo'
        },
        bing: {
            baseUrl: 'https://www.bing.com/search',
            queryParam: 'q',
            placeholder: 'Buscar en Bing...',
            name: 'Bing'
        },
        youtube: {
            baseUrl: 'https://www.youtube.com/results',
            queryParam: 'search_query',
            placeholder: 'Buscar en YouTube...',
            name: 'YouTube'
        },
        wikipedia: {
            baseUrl: 'https://es.wikipedia.org/w/index.php', // Ejemplo para Wikipedia en Español
            queryParam: 'search',
            placeholder: 'Buscar en Wikipedia (ES)...',
            name: 'Wikipedia (ES)'
        },
        amazon: { // Amazon.com (USA) como ejemplo, necesitarías el dominio local para otros países
            baseUrl: 'https://www.amazon.com/s',
            queryParam: 'k',
            placeholder: 'Buscar en Amazon.com...',
            name: 'Amazon.com'
        },
        mercadolibre: { // MercadoLibre Argentina como ejemplo
            baseUrl: 'https://listado.mercadolibre.com.ar/', // El query va directo en la URL path
            queryParam: '_Desde', // Este es más para paginación, el query real es parte del path
                                   // Necesitamos una forma de construir la URL diferente para ML
            placeholder: 'Buscar en MercadoLibre (AR)...',
            name: 'MercadoLibre AR'
            // Nota: MercadoLibre es un poco diferente, ver abajo.
        },
        github: {
            baseUrl: 'https://github.com/search',
            queryParam: 'q',
            placeholder: 'Buscar en GitHub...',
            name: 'GitHub'
        },
        stackoverflow: {
            baseUrl: 'https://stackoverflow.com/search',
            queryParam: 'q',
            placeholder: 'Buscar en Stack Overflow...',
            name: 'Stack Overflow'
        }
    };

    let webSearchTerm = '';

    // Para MercadoLibre, la URL de búsqueda es diferente
    // ej. https://listado.mercadolibre.com.ar/QUERY_AQUI
    // Así que necesitamos ajustar la acción del formulario o la construcción de la URL.

    // Variable reactiva para la acción del formulario
    $: formActionUrl = selectedSearchEngine === 'mercadolibre'
        ? searchEngines.mercadolibre.baseUrl // Para ML, el query irá al final
        : searchEngines[selectedSearchEngine].baseUrl;

    // Nombre del input, también dinámico
    $: queryInputName = selectedSearchEngine === 'mercadolibre'
        ? 'as_word' // MercadoLibre usa 'as_word' como parámetro si se envía como query,
                      // pero es más común que el término sea parte de la ruta.
                      // Para simplificar, mantendremos la lógica de queryParam para los otros.
                      // Para ML, la forma más fácil es que el usuario escriba y el form action cambie.
        : searchEngines[selectedSearchEngine].queryParam;

    // Placeholder dinámico
    $: currentPlaceholder = searchEngines[selectedSearchEngine].placeholder;


    // Función para construir la URL final, especialmente para MercadoLibre
    function getSearchUrl() {
        const engine = searchEngines[selectedSearchEngine];
        if (selectedSearchEngine === 'mercadolibre') {
            // Para ML, el término de búsqueda se añade directamente a la URL base,
            // reemplazando espacios con guiones.
            return `${engine.baseUrl}${encodeURIComponent(webSearchTerm.trim().replace(/\s+/g, '-'))}`;
        } else {
            // Para otros motores, se usa la URL base y se añade el parámetro de consulta.
            // El formulario se encargará de añadir "?queryParam=value"
            return engine.baseUrl;
        }
    }

    // --- Lógica de Fuse.js ---

    // Preparamos una estructura de datos plana para las subcategorías y enlaces para Fuse
    interface SearchableSubcategory extends Subcategory {
        categoryId: string; // Para saber a qué categoría pertenece
    }
    interface SearchableLink extends Link {
        parentId: string; // ID de la categoría o subcategoría
        parentType: 'category' | 'subcategory';
        // Opcional: añadir categoryId si parentType es subcategory para facilitar reconstrucción
        grandParentCategoryId?: string;
    }

    // Opciones para Fuse.js
    const categoryFuseOptions: IFuseOptions<Category> = {
        keys: ['title'], // Buscar solo en el título de la categoría
        threshold: 0.4, // Umbral de coincidencia (0 = exacto, 1 = cualquier cosa)
        // includeScore: true, // Opcional: para ver la puntuación de coincidencia
    };

    const subcategoryFuseOptions: IFuseOptions<SearchableSubcategory> = {
        keys: ['title'],
        threshold: 0.4,
    };

    const linkFuseOptions: IFuseOptions<SearchableLink> = {
        keys: ['title', 'url'], // Buscar en título y URL del enlace
        threshold: 0.3,
    };

    // Stores derivados para las instancias de Fuse.js
    // Estas instancias se recrean si $categoriesStore cambia.
    const fuseInstanceCategory = derived(categoriesStore, ($categoriesStore) => {
        return new Fuse($categoriesStore, categoryFuseOptions);
    });

    const fuseInstanceSubcategory = derived(categoriesStore, ($categoriesStore) => {
        const allSubcategories: SearchableSubcategory[] = [];
        $categoriesStore.forEach(cat => {
            cat.subcategories.forEach(sub => {
                allSubcategories.push({ ...sub, categoryId: cat.id });
            });
        });
        return new Fuse(allSubcategories, subcategoryFuseOptions);
    });

    const fuseInstanceLink = derived(categoriesStore, ($categoriesStore) => {
        const allLinks: SearchableLink[] = [];
        $categoriesStore.forEach(cat => {
            // Enlaces directos de la categoría
            cat.links.forEach(link => {
                allLinks.push({ ...link, parentId: cat.id, parentType: 'category' });
            });
            // Enlaces de subcategorías
            cat.subcategories.forEach(sub => {
                sub.links.forEach(link => {
                    allLinks.push({ ...link, parentId: sub.id, parentType: 'subcategory', grandParentCategoryId: cat.id });
                });
            });
        });
        return new Fuse(allLinks, linkFuseOptions);
    });

	// --- Funciones Auxiliares para el Filtrado ---

function filterSubcategoryChildren(
    subcategory: Subcategory,
    lowerSearchTerm: string,
    matchedLinkOriginals: Map<string, SearchableLink>
): { shouldInclude: boolean; linksToShow: Link[] } {
    let subcategoryTitleMatches = subcategory.title.toLowerCase().includes(lowerSearchTerm);
    // Si usamos Fuse para subcategorías, podríamos pasar el resultado aquí
    // const fuseSubResult = $fuseSub.search(subcategory.title).find(r => r.item.id === subcategory.id);
    // subcategoryTitleMatches = !!fuseSubResult;

    let linksToShow: Link[] = [];
    let hasMatchingLink = false;

    if (subcategoryTitleMatches) {
        // Si la subcategoría coincide por título, mostrar TODOS sus enlaces
        linksToShow = [...subcategory.links];
        hasMatchingLink = linksToShow.length > 0; // O simplemente true si queremos incluirla solo por título
    } else {
        for (const link of subcategory.links) {
            // const fuseLinkResult = $fuseLink.search(link.title).find(r => r.item.id === link.id); // Si usamos Fuse para links
            // if (fuseLinkResult || link.url.toLowerCase().includes(lowerSearchTerm)) {
            if (matchedLinkOriginals.has(link.id)) { // Usando el Map pre-calculado
                linksToShow.push(link);
                hasMatchingLink = true;
            }
        }
    }
    return { shouldInclude: subcategoryTitleMatches || hasMatchingLink, linksToShow };
}

function filterCategoryDirectLinks(
    category: Category,
    lowerSearchTerm: string,
    matchedLinkOriginals: Map<string, SearchableLink>
): { shouldInclude: boolean; linksToShow: Link[] } {
    let hasMatchingLink = false;
    const linksToShow: Link[] = [];
    for (const link of category.links) {
        // const fuseLinkResult = $fuseLink.search(link.title).find(r => r.item.id === link.id);
        // if (fuseLinkResult || link.url.toLowerCase().includes(lowerSearchTerm)) {
        if (matchedLinkOriginals.has(link.id)) {
            linksToShow.push(link);
            hasMatchingLink = true;
        }
    }
    return { shouldInclude: hasMatchingLink, linksToShow };
}


// --- Lógica de Filtrado (AHORA USA LAS FUNCIONES AUXILIARES Y FUSE) ---
const filteredCategories = derived(
    [categoriesStore, searchTerm, fuseInstanceCategory, fuseInstanceSubcategory, fuseInstanceLink],
    ([$categoriesStore, $searchTerm, $fuseCat, $fuseSub, $fuseLink]) => {
        if (!$searchTerm.trim()) {
            return $categoriesStore;
        }

        const lowerSearchTerm = $searchTerm.trim().toLowerCase();
        const result: SmartStartData = [];

        const fuseCategoryResults: FuseResult<Category>[] = $fuseCat.search(lowerSearchTerm);
        const fuseSubcategoryResults: FuseResult<SearchableSubcategory>[] = $fuseSub.search(lowerSearchTerm); // Estos son SearchableSubcategory
        const fuseLinkResults: FuseResult<SearchableLink>[] = $fuseLink.search(lowerSearchTerm);

        const matchedCategoryIds = new Set(fuseCategoryResults.map((r: FuseResult<Category>) => r.item.id));
        // Usaremos estos para verificar si un ID de subcategoría/enlace coincidió con la búsqueda de Fuse
        const matchedSubcategoryIdsFromFuse = new Set(fuseSubcategoryResults.map((r: FuseResult<SearchableSubcategory>) => r.item.id));
        const matchedLinkIdsFromFuse = new Set(fuseLinkResults.map((r: FuseResult<SearchableLink>) => r.item.id));


        for (const originalCategory of $categoriesStore) {
            let categoryTitleMatches = matchedCategoryIds.has(originalCategory.id);
            let hasMatchingChild = false;

            const finalSubcategories: Subcategory[] = [];
            for (const originalSubcategory of originalCategory.subcategories) {
                const subcategoryTitleMatchesFuse = matchedSubcategoryIdsFromFuse.has(originalSubcategory.id);
                let subcategoryLinksToShow: Link[] = [];
                let subcategoryShouldBeIncluded = subcategoryTitleMatchesFuse;

                if (subcategoryTitleMatchesFuse) {
                    // Si el título de la subcategoría coincide, mostrar todos sus enlaces
                    subcategoryLinksToShow = [...originalSubcategory.links];
                } else {
                    // Si el título no coincide, ver si alguno de sus enlaces coincide
                    for (const link of originalSubcategory.links) {
                        if (matchedLinkIdsFromFuse.has(link.id)) {
                            subcategoryLinksToShow.push(link);
                            subcategoryShouldBeIncluded = true; // Incluir subcategoría si un enlace coincide
                        }
                    }
                }

                if (subcategoryShouldBeIncluded) {
                    finalSubcategories.push({
                        ...originalSubcategory,
                        links: subcategoryLinksToShow,
                    });
                    hasMatchingChild = true;
                }
            }

            const finalDirectLinks: Link[] = [];
            for (const link of originalCategory.links) {
                if (matchedLinkIdsFromFuse.has(link.id)) {
                    finalDirectLinks.push(link);
                    hasMatchingChild = true;
                }
            }

            // Incluir la categoría si su título coincide O si tiene algún hijo (subcategoría o enlace directo) que coincida
            if (categoryTitleMatches || hasMatchingChild) {
                const categoryToAdd: Category = {
                    ...originalCategory,
                    // Si el título de la categoría coincidió, pero no se filtraron hijos específicos,
                    // entonces mostramos los hijos originales.
                    // Si el título NO coincidió, pero un hijo SÍ, entonces solo mostramos los hijos filtrados.
                    subcategories: categoryTitleMatches && finalSubcategories.length === 0 && !hasMatchingChildWithFuse(originalCategory, matchedSubcategoryIdsFromFuse, matchedLinkIdsFromFuse, 'subcategory')
                                   ? originalCategory.subcategories.map(s => ({...s, links: [...s.links]})) // Clonar para evitar mutación
                                   : finalSubcategories,
                    links: categoryTitleMatches && finalDirectLinks.length === 0 && !hasMatchingChildWithFuse(originalCategory, matchedSubcategoryIdsFromFuse, matchedLinkIdsFromFuse, 'link')
                           ? [...originalCategory.links] // Clonar
                           : finalDirectLinks,
                };
                result.push(categoryToAdd);
            }
        }
        return result;
    }
);

// Nueva función helper para la lógica compleja de "mostrar hijos originales"
function hasMatchingChildWithFuse(
    category: Category,
    matchedSubIds: Set<string>,
    matchedLinkIds: Set<string>,
    childType: 'subcategory' | 'link'
): boolean {
    if (childType === 'subcategory') {
        for (const sub of category.subcategories) {
            if (matchedSubIds.has(sub.id)) return true;
            for (const link of sub.links) {
                if (matchedLinkIds.has(link.id)) return true;
            }
        }
    } else if (childType === 'link') {
        for (const link of category.links) {
            if (matchedLinkIds.has(link.id)) return true;
        }
    }
    return false;
}

	// --- Lógica para añadir categoría (ejemplo) ---
	let newCategoryTitle = '';
	function handleAddCategory() {
		if (newCategoryTitle.trim() && browser) { // Asegúrate que no esté vacío y estemos en el navegador
			addCategory(newCategoryTitle.trim());
			newCategoryTitle = ''; // Limpia el input
		}
	}

	// Función para cancelar/limpiar el formulario de añadir categoría
    function cancelAddCategoryForm() {
        newCategoryTitle = '';
        // No hay un 'showForm' aquí, pero podríamos querer desenfocar el input
        // o simplemente limpiar el texto es suficiente.
    }

	// --- Handler para el evento onSort de la acción ---
    function handleCategorySort(event: SortableEvent) {
        // Asegurarnos que los índices existen y son números
        if (event.oldIndex !== undefined && event.newIndex !== undefined) {
             if (browser) { // Asegurarse que corre en el navegador
                 moveCategory(event.oldIndex, event.newIndex);
             }
        } else {
             console.warn('Sortable event missing indices:', event);
        }
    }

	// --- Lógica de Exportación ---
    function exportData() {
        if (!browser) return;

        const dataToExport = JSON.stringify($categoriesStore, null, 2); // El 'null, 2' es para pretty-print el JSON
        const blob = new Blob([dataToExport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'smart-start-data.json'; // Nombre del archivo a descargar
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Liberar el objeto URL
        alert('¡Datos exportados con éxito!'); // O una notificación más sutil
    }

    // --- Lógica de Importación ---
    async function importData(event: Event) {
        if (!browser) return;

        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) {
            alert('No se seleccionó ningún archivo.');
            return;
        }

        const file = input.files[0];
        if (file.type !== 'application/json') {
            alert('Por favor, selecciona un archivo JSON válido.');
            return;
        }

        try {
            const fileContent = await file.text();
            const importedData = JSON.parse(fileContent);

            // --- Validación (MUY BÁSICA - se puede mejorar) ---
            if (!Array.isArray(importedData) || !importedData.every(isValidCategoryStructure)) {
                 throw new Error('El archivo JSON no tiene la estructura esperada para Smart Start.');
            }

            // Confirmación antes de sobrescribir (recomendado)
            if (confirm('¿Estás seguro de que quieres reemplazar tus datos actuales con los del archivo? Esta acción no se puede deshacer.')) {
                categoriesStore.set(importedData as SmartStartData); // Sobrescribir el store
                alert('¡Datos importados con éxito!');
            }
        } catch (error) {
            console.error("Error al importar datos:", error);
            if (error instanceof Error) {
                alert(`Error al importar: ${error.message}`);
            } else {
                alert('Ocurrió un error desconocido al importar el archivo.');
            }
        } finally {
            // Resetear el input para permitir cargar el mismo archivo de nuevo si es necesario
            input.value = '';
        }
    }

    // Función de validación de estructura (ejemplo básico)
    function isValidCategoryStructure(item: any): boolean {
        // Comprueba si 'item' tiene las propiedades mínimas de una categoría
        // y si 'links' y 'subcategories' son arrays.
        // Puedes hacer esta validación tan profunda como necesites.
        return (
            typeof item === 'object' &&
            item !== null &&
            typeof item.id === 'string' &&
            typeof item.title === 'string' &&
            Array.isArray(item.links) &&
            Array.isArray(item.subcategories) &&
            item.links.every(isValidLinkStructure) && // Validar estructura de enlaces
            item.subcategories.every(isValidSubcategoryStructure) // Validar estructura de subcategorías
        );
    }

    function isValidLinkStructure(link: any): boolean {
        return (
            typeof link === 'object' &&
            link !== null &&
            typeof link.id === 'string' &&
            typeof link.title === 'string' &&
            typeof link.url === 'string'
        );
    }

    function isValidSubcategoryStructure(sub: any): boolean {
         return (
            typeof sub === 'object' &&
            sub !== null &&
            typeof sub.id === 'string' &&
            typeof sub.title === 'string' &&
            Array.isArray(sub.links) &&
            sub.links.every(isValidLinkStructure)
        );
    }

	// --- Referencia al input de búsqueda ---
    let searchBarInput: HTMLInputElement | undefined = undefined; // Lo bindearemos al input en SearchBar.svelte

	// --- Manejo de Atajos de Teclado ---
	function handleGlobalKeyDown(event: KeyboardEvent) {
		if (!browser) return;

        // Atajo para enfocar la búsqueda: Ctrl+K (o Cmd+K) o /
        if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !isInputActive(event))) {
            event.preventDefault(); // Evitar que '/' se escriba en el input si no es el objetivo
            searchBarInput?.focus();
        }

        // Atajo Escape
        if (event.key === 'Escape') {
            // 1. Si hay texto en la búsqueda, limpiarlo
            if ($searchTerm.trim()) {
                searchTerm.set('');
                // event.preventDefault(); // Evitar otros comportamientos de Escape
                return; // Prioridad
            }

            // 2. Si hay algún formulario de edición/añadir abierto, cerrarlo
            // (Esto requerirá que los componentes hijos expongan una función o evento para cerrarse,
            // o que manejemos un estado global de "formulario activo".
            // Por ahora, dejaremos un placeholder para esta lógica más compleja)
            // console.log('Escape presionado - lógica para cerrar formularios aquí');
        }
	}

    // Helper para verificar si un input/textarea está activo (para evitar que '/' active la búsqueda al escribir)
    function isInputActive(event: KeyboardEvent): boolean {
        const target = event.target as HTMLElement;
        return (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        );
    }

	onMount(() => {
		if (browser) {
			window.addEventListener('keydown', handleGlobalKeyDown);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('keydown', handleGlobalKeyDown);
		}
	});
</script>

<svelte:head>
	<title>Smart Start V2</title>
	<meta name="description" content="Tu launchpad digital" />
</svelte:head>

<div class="min-h-screen
    bg-slate-100 text-slate-900  /* <-- Estilos LIGHT MODE (Base) */
    dark:bg-gradient-to-br dark:from-gray-900 dark:to-slate-800 dark:text-gray-100 /* <-- Estilos DARK MODE */
    p-4 sm:p-8 transition-colors duration-300 ease-in-out"
>
	<main class="max-w-5xl mx-auto">
		<!-- --- H1 CON LOGO (IMG) Y TEXTO OCULTO --- -->
		<h1 class="mb-6 text-center">
			<span class="sr-only">Smart Start</span> <!-- Texto para accesibilidad -->
			<img
			   src="/smart-start-logo.svg" 
			   alt=""
			   class="w-auto h-12 sm:h-16 mx-auto
          		dark:filter dark:invert
          		transition-all duration-300"
			   aria-hidden="true"
			/>
		  </h1>
        
        <!-- --- NUEVA SECCIÓN: BUSCADOR WEB --- -->
        <div class="mb-8 px-4 sm:px-0">
            <form
                action={getSearchUrl()}
                method="GET"
                target="_blank"
                class="flex items-center gap-2 max-w-xl mx-auto"
                on:submit={() => {
                    // Para MercadoLibre, si el input se llama 'as_word', el form lo añade.
                    // Si no, y el form action ya contiene el término, no necesitamos hacer nada especial.
                    // Si el action es solo la base URL para ML, necesitamos asegurarnos que el query
                    // se envíe correctamente. El método más simple es que el 'action' cambie dinámicamente
                    // o que el 'name' del input sea el correcto.
                    // La solución getSearchUrl() para el action ya lo maneja para ML.
                }}
            >
                <!-- Selector de Motor de Búsqueda (Dropdown) -->
                <select
                    bind:value={selectedSearchEngine}
                    class="p-2.5 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                           bg-white border border-r-0 border-slate-300 text-slate-700
                           dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                    title="Seleccionar motor de búsqueda"
                >
                    {#each Object.entries(searchEngines) as [key, engine]}
                        <option value={key}>{engine.name}</option>
                    {/each}
                </select>

                <input
                    type="text"
                    name={queryInputName}
                    bind:value={webSearchTerm}
                    placeholder={currentPlaceholder}
                    required
                    class="flex-grow p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                           bg-white border border-slate-300 text-slate-900 placeholder-slate-400
                           dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100 dark:placeholder-gray-400"
                />
                <button
                    type="submit"
                    class="p-2.5 rounded-r-md transition-colors
                           bg-blue-600 hover:bg-blue-700 text-white
                           dark:bg-blue-500 dark:hover:bg-blue-600
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800"
                    aria-label="Buscar"
                    title="Buscar"
                >
                    <SearchIcon size={20} />
                </button>
            </form>
        </div>

		<!-- Barra de búsqueda (la funcionalidad se añadirá después) -->
		<div class="px-4 sm:px-0">
		    <SearchBar bind:inputElement={searchBarInput} />
        </div>

		<!-- Sección de Categorías -->
		<div class="mt-10">
			<!-- Renderizado usa AHORA el store derivado '$filteredCategories' -->
			{#if $filteredCategories.length > 0}
				<div
				class="space-y-6"
				use:sortable={{ 
                    handle: '.category-drag-handle', 
                    onSort: handleCategorySort,
                    disabled: !!$searchTerm.trim()
                    }}
				>
					{#each $filteredCategories as category (category.id)}
						<div animate:flip={{ duration: 500 }}>
							<div class="relative">
								<CategoryComponent {category} />
									{#if !$searchTerm.trim()}
										<button
										class="category-drag-handle absolute top-4 left-[-10px] p-1 text-slate-500 hover:text-slate-300 cursor-move opacity-20 hover:opacity-100 transition-opacity focus:opacity-100"
										aria-label={`Mover categoría ${category.title}`}
										title="Mover categoría"
									>
										<!-- Icono de agarrar (puedes usar otro de lucide) -->
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
										</button>
									{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else if $searchTerm.trim()}
                 <!-- Mensaje si hay búsqueda pero no resultados -->
                <div class="text-center py-10 px-6 bg-slate-800/50 rounded-lg">
					<p class="text-slate-400 text-lg">No se encontraron resultados para "{$searchTerm}"</p>
					<p class="text-slate-500 mt-2">Intenta con otro término.</p>
				</div>
            {:else}
				<!-- Mensaje si no hay categorías Y no hay búsqueda -->
				<div class="text-center py-10 px-6 bg-slate-800/50 rounded-lg">
					<p class="text-slate-400 text-lg">¡Parece que no hay nada aquí!</p>
					<p class="text-slate-500 mt-2">Empieza añadiendo tu primera categoría.</p>
				</div>
			{/if}
		</div>

		<!-- Formulario Añadir Categoría -->
		<div class="mt-10 pt-6 border-t transition-colors border-slate-200 dark:border-slate-700">
			<form 
				use:escape={cancelAddCategoryForm}
				on:submit|preventDefault={handleAddCategory}
				class="flex gap-3 items-center max-w-md mx-auto"
			>
				<input
					type="text"
					bind:value={newCategoryTitle}
					placeholder="Nueva categoría..."
					required
					class="flex-grow px-3 py-2 transition-colors
                           bg-white border border-slate-300 text-slate-900 placeholder-slate-400
                           dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100 dark:placeholder-gray-400
						   rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
				<button
					type="submit"
					class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!newCategoryTitle.trim()}
				>
					<PlusCircle size={18} />
					Añadir
				</button>
			</form>
		</div>

		<!-- --- Sección de Configuración: Importar/Exportar --- -->
        <div class="mt-12 pt-6 border-t transition-colors border-slate-200 dark:border-slate-700">
            <h2 class="text-xl font-semibold mb-4 text-center text-slate-700 dark:text-slate-300">
                <Settings size={22} class="inline mr-2 align-text-bottom" />
                Configuración
            </h2>
            <div class="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                <!-- Botón Exportar -->
                <button
                    on:click={exportData}
                    class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors
                           bg-indigo-600 hover:bg-indigo-700 text-white
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                           focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800"
                >
                    <Download size={18} />
                    Exportar Datos
                </button>

                <!-- Botón Importar (usa un label para el input file) -->
                <label
                    class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors cursor-pointer
                           bg-teal-600 hover:bg-teal-700 text-white
                           focus-within:outline-none focus-within:ring-2 focus-within:ring-teal-500 focus-within:ring-offset-2
                           focus-within:ring-offset-slate-100 dark:focus-within:ring-offset-slate-800"
                >
                    <Upload size={18} />
                    Importar Datos
                    <input
                        type="file"
                        accept=".json,application/json"
                        class="hidden"
                        on:change={importData}
                    />
                </label>
            </div>
        </div>
        <!-- --- Fin Sección de Configuración --- -->
	</main>

	<footer class="text-center mt-16 text-sm flex justify-center items-center gap-4 transition-colors
                 text-slate-500 dark:text-slate-400
    ">
		<span>Hecho con ❤️ usando SvelteKit & Tailwind CSS</span>
		<ThemeToggle />
	</footer>
	<SaveIndicator />
</div>