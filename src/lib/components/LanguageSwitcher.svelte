<!-- src/lib/components/LanguageSwitcher.svelte -->
<script lang="ts">
	import { locale } from '$lib/i18n'; // El store que exportamos
	import { Languages } from 'lucide-svelte';

	// Idiomas que soportas (podrías obtener esto dinámicamente o definirlo aquí)
	const supportedLocales = [
		{ code: 'es', name: 'Español' },
		{ code: 'en', name: 'English' }
		// Añade más aquí
	];

    function changeLanguage(event: Event) {
        const target = event.target as HTMLSelectElement;
        if (target.value) {
            locale.set(target.value);
        }
    }
</script>

<div class="relative inline-block text-left">
	<label for="lang-switcher" class="sr-only">Seleccionar idioma</label>
	<div class="flex items-center">
        <Languages size={18} class="mr-1.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
		<select
            id="lang-switcher"
			bind:value={$locale}
            on:change={changeLanguage}
			class="appearance-none py-1 pr-6 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors
                   bg-transparent border-none text-sm
                   text-slate-600 dark:text-slate-300
                   hover:text-slate-900 dark:hover:text-slate-100"
		>
			{#each supportedLocales as lang (lang.code)}
				<option value={lang.code}>{lang.name}</option>
			{/each}
		</select>
        <!-- Flecha custom si appearance-none la quita -->
         <div class="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
	</div>
</div>