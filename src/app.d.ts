// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '*.svg?component' {
	import type { ComponentType, SvelteComponent } from 'svelte';
	const content: ComponentType<SvelteComponent>;
	export default content;
  }
  
  // Puedes tener otras definiciones aquí también
  // Ejemplo:
  // /// <reference types="@sveltejs/kit" />

export {};
