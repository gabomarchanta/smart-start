import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {}
	},

	plugins: [
		require('tailwind-scrollbar')
	],
	darkMode: 'class' 
} as Config;
