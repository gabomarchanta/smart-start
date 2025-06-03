<script lang="ts">
	import { Globe } from 'lucide-svelte'; // O usa Link2, File, etc.

	// Podrías pasar props para tamaño, clase, etc. si quisieras más flexibilidad
	export let size: number = 16;
	export let className: string = '';
</script>

<Globe {size} class={className} />