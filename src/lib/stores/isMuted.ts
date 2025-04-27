import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const getInitialMute = () => {
	if (!browser) return false;
	return localStorage.getItem('isMuted') === 'true';
};

const isMuted = writable<boolean>(getInitialMute());

isMuted.subscribe((value) => {
	if (browser) {
		localStorage.setItem('isMuted', value.toString());
	}
});

export default isMuted;
