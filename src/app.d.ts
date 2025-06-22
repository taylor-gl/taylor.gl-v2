// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {}
}

declare module '*.svelte' {
	import type { ComponentType, SvelteComponent } from 'svelte';

	const component: ComponentType<SvelteComponent>;
	export default component;
}

export {};
