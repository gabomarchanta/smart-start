<script lang="ts">
	import { isSaving } from '$lib/stores/linkStore'; // Importar el estado
	import { fade } from 'svelte/transition'; // Para transición suave
	import { Loader2 } from 'lucide-svelte'; // Icono de spinner
</script>

{#if $isSaving}
	<div
		transition:fade={{ duration: 200 }}
		class="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-slate-700/80 dark:bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-slate-200 dark:text-slate-300 shadow-lg"
        role="status"
        aria-live="polite"
	>
		<Loader2 size={14} class="animate-spin" />
		<span>Guardando...</span>
	</div>
{/if}