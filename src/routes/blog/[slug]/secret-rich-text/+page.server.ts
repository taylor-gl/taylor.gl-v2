import { error } from '@sveltejs/kit';
import { getBlogPost } from '$lib/blog';

export const load = ({ params }) => {
  const post = getBlogPost(params.slug);

  if (!post) {
    throw error(404, 'Not found');
  }

  return {
    post,
  };
};
