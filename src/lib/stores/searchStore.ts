// src/lib/stores/searchStore.ts
import { writable } from 'svelte/store';

// Store simple para mantener el término de búsqueda actual
export const searchTerm = writable<string>('');