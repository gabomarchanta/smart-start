<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import '$lib/stores/themeStore';
	import '$lib/i18n'; // Importar para inicializar svelte-i18n

	import { locale } from '$lib/i18n'; // El store reactivo del locale
	import { page } from '$app/stores';   // Para el lang en SSR (aunque no lo estamos usando mucho para SSR lang ahora)
    import { browser } from '$app/environment'; // Para verificar si estamos en el navegador
    import { onMount } from 'svelte'; // Si decides usar onMount para la primera vez

    // Variable reactiva para el idioma
    let currentLang: string;

    // Suscribirse a los cambios del store 'locale' y actualizar 'currentLang'
    // y el atributo lang del HTML
    locale.subscribe(value => {
        const newLang = value || ($page.data.localeFromHook as string | undefined) || 'es';
        currentLang = newLang; // Para usar en svelte:head si es necesario para otras cosas
        if (browser) {
            document.documentElement.setAttribute('lang', newLang);
        }
    });

    // Opcional: Establecer al montar, por si la suscripción no se dispara inmediatamente
    // o si el valor inicial del store es null y quieres el fallback de $page.data
    // onMount(() => {
    //     if (browser) {
    //         const initialLang = $locale || ($page.data.localeFromHook as string | undefined) || 'es';
    //         document.documentElement.setAttribute('lang', initialLang);
    //     }
    // });

</script>

<!-- svelte:head es para elementos que van DENTRO del <head> del HTML,
     como <title>, <meta>, <link>. NO para modificar el tag <html> directamente. -->
<svelte:head>
    <!-- <title> y <meta> pueden seguir usando $t() aquí si es necesario -->
</svelte:head>

<slot />