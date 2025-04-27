<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { playPopSound } from '$lib/utils/sound';

	const { children, onClick } = $props();

	function handleClick() {
		playPopSound();
		onClick();
	}
</script>

<button
	onclick={handleClick}
	class={twMerge(
		'glow:bg-glow/50 glow:text-white group relative inline-flex w-80 transform items-center justify-center rounded-lg bg-teal-400 px-6 py-3 text-lg text-slate-900 shadow-lg shadow-teal-400/20 transition-all duration-150 hover:scale-105 hover:bg-teal-300 hover:shadow-teal-300/40 active:scale-100'
	)}
>
	<div class="relative z-10">{@render children()}</div>
	<div
		class="glow-overlay pointer-events-none absolute inset-0 z-10 transition-all duration-400 will-change-[mask] select-none"
		style="--glow-color: #0d9488"
	></div>
</button>
