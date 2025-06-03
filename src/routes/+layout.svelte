<script lang="ts">
	// Importa tus estilos globales de Tailwind (ya debería estar)
	import '../app.css';
	// Importar el store SOLO para asegurar que se inicialice (el onMount ya no es necesario aquí)
    import '$lib/stores/themeStore';

    // El onMount que teníamos para forzar 'dark' ya no es necesario,
    // la lógica está encapsulada en themeStore.ts
</script>

<!-- El slot renderizará el contenido de tu página actual (+page.svelte) -->
<slot />
