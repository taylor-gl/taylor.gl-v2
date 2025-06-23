import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const getInitialValue = () => {
  if (!browser) {
    return 'dark';
  }

  const storedValue = window.localStorage.getItem('theme');
  if (storedValue) {
    return storedValue;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const theme = writable<string>(getInitialValue());

theme.subscribe((value) => {
  if (browser) {
    window.localStorage.setItem('theme', value);
    document.documentElement.className = value;
  }
});

export default theme;
