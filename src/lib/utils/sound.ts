import { get } from 'svelte/store';
import isMuted from '$lib/stores/isMuted';

function playSound(soundPath: string) {
	if (get(isMuted)) return;

	try {
		const audio = new Audio(soundPath);
		audio.currentTime = 0;
		audio.play().catch(() => {
			// Fail silently if audio can't be played
		});
	} catch {
		// Fail silently if audio creation fails
	}
}

export function playPopSound() {
	playSound('/pop.wav');
}

export function playMadLibPopSound() {
	playSound('/pop-2.wav');
}

export function playCustomSound(soundPath: string) {
	playSound(soundPath);
}
