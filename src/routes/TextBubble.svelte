<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	const { children, size = 'md', color = 'teal', ...restProps } = $props();

	const sizeClasses: Record<string, string> = {
		sm: 'px-2 py-1 text-xs',
		md: 'px-2 py-1 text-sm',
	};

	const colorClasses: Record<string, string> = {
		teal: 'glow:bg-glow/10 glow:text-teal-300 bg-teal-200/50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-500',
		pink: 'glow:bg-glow/10 glow:text-pink-300 bg-pink-300/40 text-pink-800 dark:bg-pink-500/10 dark:text-pink-400',
	};
</script>

<div
	class={twMerge(
		'rounded-full font-semibold',
		sizeClasses[size],
		colorClasses[color],
		restProps.class
	)}
>
	{@render children()}
</div>
