import { error } from '@sveltejs/kit';
import { getBlogPosts } from '$lib/blog';

export function entries() {
	const posts = getBlogPosts();
	return posts.map((post) => ({ slug: post.slug }));
}

export const load = async ({ params }: { params: { slug: string } }) => {
	const { slug } = params;
	const posts = getBlogPosts();
	const post = posts.find((p) => p.slug === slug);

	if (!post) {
		throw error(404, 'Post not found');
	}

	return { post };
};
