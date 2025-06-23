import { getBlogPosts } from '$lib/blog';
import { getProjects } from '$lib/projects';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  return {
    madLibPicks: Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)),
    blogPosts: getBlogPosts(),
    projects: getProjects(),
  };
};
