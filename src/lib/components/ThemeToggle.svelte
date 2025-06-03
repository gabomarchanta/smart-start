<script lang="ts">
	import themeStore from '$lib/stores/themeStore'; // Importar store del tema
	import type { Theme } from '$lib/stores/themeStore';
	import { Sun, Moon, Monitor } from 'lucide-svelte'; // Iconos para los temas

	// Acceso reactivo al valor del store
	const currentTheme = themeStore;

	// Función para ciclar al siguiente tema
	function toggleTheme() {
		let nextTheme: Theme;
		switch ($currentTheme) {
			case 'light':
				nextTheme = 'dark';
				break;
			case 'dark':
				nextTheme = 'system'; // O ir directo a 'light' si no quieres 'system'
				break;
			case 'system':
			default:
				nextTheme = 'light';
				break;
		}
		themeStore.set(nextTheme); // Actualizar el store
	}

    // Objeto para mapear tema a icono y tooltip
    const themeDetails = {
        light: { icon: Sun, label: 'Cambiar a tema Oscuro', title: 'Tema Claro'},
        dark: { icon: Moon, label: 'Cambiar a tema del Sistema', title: 'Tema Oscuro'},
        system: { icon: Monitor, label: 'Cambiar a tema Claro', title: 'Tema del Sistema'},
    }
</script>

<button
	on:click={toggleTheme}
	class="p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
           text-slate-500 hover:text-slate-900 hover:bg-slate-200 focus:ring-offset-slate-100
           dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-800
    "
	aria-label={themeDetails[$currentTheme].label}
    title={themeDetails[$currentTheme].title}
>
	{#if $currentTheme === 'light'}
		<Sun size={20} />
	{:else if $currentTheme === 'dark'}
		<Moon size={20} />
	{:else}
		<Monitor size={20} />
	{/if}
</button>