import { getBlogPosts } from '$lib/blog';

export const load = async () => {
	return { posts: getBlogPosts(), tag: null };
};
