import { getBlogPosts } from '$lib/blog';

export const load = async ({ url }: { url: URL }) => {
	const tag = url.searchParams.get('tag');
	let posts = getBlogPosts();
	if (tag) {
		posts = posts.filter((post) => post.tags.includes(tag));
	}
	return { posts, tag };
};
