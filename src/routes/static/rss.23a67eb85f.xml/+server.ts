import { redirect } from '@sveltejs/kit';

export const prerender = true;

export const GET = () => {
	redirect(301, 'https://taylorgordonlunt.substack.com/feed');
};
