import { error } from '@sveltejs/kit';
import { getProjects } from '$lib/projects';

export function entries() {
	const projects = getProjects();
	return projects.map((project) => ({ slug: project.slug }));
}

export const load = async ({ params }: { params: { slug: string } }) => {
	const { slug } = params;
	const projects = getProjects();
	const project = projects.find((p) => p.slug === slug);

	if (!project) {
		throw error(404, 'Project not found');
	}

	return { project };
};
