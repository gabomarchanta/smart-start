<!-- src/lib/components/SettingsDropdown.svelte -->
<script lang="ts">
	import { Settings, Sun, Moon, Monitor, Download, Upload } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
    import ThemeToggle from './ThemeToggle.svelte';
    import { browser } from '$app/environment'; // <-- IMPORTAR 'browser'
    import LanguageSwitcher from './LanguageSwitcher.svelte';
    import { t } from 'svelte-i18n';

    export let onExportData: () => void;
    export let onImportDataRequest: () => void;

	let isOpen = false;
	let dropdownElement: HTMLDivElement;

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownElement && !dropdownElement.contains(event.target as Node) && isOpen) {
			isOpen = false;
		}
	}

	onMount(() => {
        if (browser) { // <-- AÑADIR ESTA COMPROBACIÓN
		    document.addEventListener('click', handleClickOutside, true);
        }
	});

	onDestroy(() => {
        if (browser) { // <-- AÑADIR ESTA COMPROBACIÓN
		    document.removeEventListener('click', handleClickOutside, true);
        }
	});
</script>

<div class="relative" bind:this={dropdownElement}>
	<!-- Botón del Icono de Configuración -->
	<button
		on:click|stopPropagation={toggleDropdown}
		class="p-2 rounded-full transition-colors
               text-slate-500 hover:text-slate-900 hover:bg-slate-200 focus:ring-offset-slate-100
               dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-800
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
		aria-haspopup="true"
		aria-expanded={isOpen}
		aria-label="Abrir menú de configuración"
        title="Configuración"
	>
		<Settings size={24} />
	</button>

	<!-- Menú Desplegable -->
	{#if isOpen}
		<div
			transition:fade={{ duration: 100 }}
			class="absolute right-0 mt-2 w-56 origin-top-right rounded-md shadow-lg z-50
                   bg-white ring-1 ring-black ring-opacity-5 focus:outline-none
                   dark:bg-slate-800 dark:ring-slate-700"
			role="menu"
			aria-orientation="vertical"
			aria-labelledby="settings-button"
		>
			<div class="py-1" role="none">
				<!-- Theme Toggle (usamos el componente) -->
                <div class="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 flex items-center justify-between">
                    <span>{$t('theme_label')}</span>
                    <ThemeToggle />
                </div>

                <!-- Language Switcher -->
                <div class="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 flex items-center justify-between">
                    <span>{$t('language_label')}</span>
                    <LanguageSwitcher />
                </div>

                <div class="border-t border-slate-200 dark:border-slate-700 my-1"></div>

				<!-- Exportar Datos -->
				<button
					on:click={() => { onExportData(); isOpen = false; }}
					class="w-full text-left flex items-center gap-3 px-4 py-2 text-sm transition-colors
                           text-slate-700 hover:bg-slate-100 hover:text-indigo-600
                           dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
					role="menuitem"
				>
                    <Download size={16} />
					{$t('export_data_button')}
				</button>

				<!-- Importar Datos -->
                <button
					on:click={() => { onImportDataRequest(); isOpen = false; }}
					class="w-full text-left flex items-center gap-3 px-4 py-2 text-sm transition-colors
                           text-slate-700 hover:bg-slate-100 hover:text-teal-600
                           dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-teal-400"
					role="menuitem"
				>
                    <Upload size={16} />
					{$t('import_data_button')}
				</button>
                <!-- Puedes añadir más opciones aquí -->
			</div>
		</div>
	{/if}
</div>