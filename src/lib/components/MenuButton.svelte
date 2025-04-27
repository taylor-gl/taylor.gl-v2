<script lang="ts">
	import 'iconify-icon';
	import isMuted from '$lib/stores/isMuted';
	import { playCustomSound } from '$lib/utils/sound';

	export let onIcon: string;
	export let offIcon: string;
	export let onSound: string | null = null;
	export let offSound: string | null = null;
	export let toggled: boolean;
	export let ariaLabel: string;
	export let onToggle: () => void;
	export let isVolumeButton: boolean = false;

	let animating = false;
	let visibleIcon: 'on' | 'off' = toggled ? 'on' : 'off';

	$: if (!animating) {
		visibleIcon = toggled ? 'on' : 'off';
	}

	function handleClick() {
		if (animating) return;
		animating = true;

		const currentToggled = toggled;

		const shouldPlaySound = !$isMuted || (isVolumeButton && !currentToggled);

		if (shouldPlaySound) {
			if (currentToggled && offSound) {
				playCustomSound(offSound);
			} else if (!currentToggled && onSound) {
				playCustomSound(onSound);
			}
		}

		setTimeout(() => {
			visibleIcon = currentToggled ? 'off' : 'on';
			onToggle();
		}, 250);
	}

	function handleAnimationEnd() {
		animating = false;
	}
</script>

<button
	class="focus-visible:ring-focus-outline flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-slate-900 focus-visible:ring-2 dark:text-slate-400 dark:hover:text-slate-100"
	class:wiggle-animation={animating}
	onclick={handleClick}
	onanimationend={handleAnimationEnd}
	aria-label={ariaLabel}
	tabindex="0"
>
	<iconify-icon icon={visibleIcon === 'on' ? onIcon : offIcon} class="text-2xl"></iconify-icon>
</button>

<style>
	@keyframes wiggle {
		0% {
			transform: rotate(0deg);
		}
		33% {
			transform: rotate(-15deg);
		}
		66% {
			transform: rotate(15deg);
		}
		100% {
			transform: rotate(0deg);
		}
	}

	.wiggle-animation {
		animation: wiggle 0.5s ease-in-out;
	}
</style>
