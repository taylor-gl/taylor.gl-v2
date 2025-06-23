import { error } from '@sveltejs/kit';
import { getBlogPosts } from '$lib/blog';

export function entries() {
	const posts = getBlogPosts();
	const allTags = new Set<string>();

	posts.forEach((post) => {
		post.tags.forEach((tag) => allTags.add(tag));
	});

	return Array.from(allTags).map((tag) => ({ tag }));
}

export const load = async ({ params }: { params: { tag: string } }) => {
	const { tag } = params;
	const allPosts = getBlogPosts();
	const posts = allPosts.filter((post) => post.tags.includes(tag));

	if (posts.length === 0) {
		throw error(404, `No posts found with tag "${tag}"`);
	}

	return { posts, tag };
};
