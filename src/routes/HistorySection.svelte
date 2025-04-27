<script>
	import { twMerge } from 'tailwind-merge';

	const { children, ...restProps } = $props();
</script>

<div class={twMerge('flex flex-col items-center', restProps.class)}>
	{@render children()}
</div>
