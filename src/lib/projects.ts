import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { createMarkdownRenderer } from './markdown';

const marked = createMarkdownRenderer();

export interface Project {
	slug: string;
	title: string;
	description: string;
	image: string;
	content: string;
	technologies: string[];
	projectUrl: string;
	sourceUrl: string | null;
}

export function getProjects(): Project[] {
	const projectsDirectory = join(process.cwd(), 'src/content/projects');
	const filenames = readdirSync(projectsDirectory);

	const projects = filenames
		.filter((filename) => filename.endsWith('.md') && !isNaN(parseInt(filename, 10)))
		.map((filename) => {
			const filePath = join(projectsDirectory, filename);
			const fileContents = readFileSync(filePath, 'utf8');
			const { data, content } = matter(fileContents);

			return {
				slug: filename.replace(/\.md$/, ''),
				title: data.title as string,
				description: data.description as string,
				image: data.image as string,
				content: marked.parse(content) as string,
				technologies: (data.technologies as string[]) || [],
				projectUrl: data.projectUrl as string,
				sourceUrl: data.sourceUrl as string | null,
			};
		})
		.sort((a, b) => parseInt(b.slug, 10) - parseInt(a.slug, 10));

	return projects;
}
