import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { marked, Renderer } from 'marked';
import markedFootnote from 'marked-footnote';

const renderer = new Renderer();
const originalImage = renderer.image.bind(renderer);

renderer.image = (token) => {
	const { href, title, text } = token;
	if (text.startsWith('Figure:')) {
		const figcaption = text.substring(7).trim();
		const isVideo = href.toLowerCase().endsWith('.webm') || href.toLowerCase().endsWith('.mp4');

		if (isVideo) {
			return `
        <figure>
          <video controls muted loop style="width: 100%; height: auto;">
            <source src="${href}" type="video/${href.toLowerCase().endsWith('.webm') ? 'webm' : 'mp4'}">
            Your browser does not support the video tag.
          </video>
          <figcaption>${figcaption}</figcaption>
        </figure>
      `;
		} else {
			return `
        <figure>
          <img src="${href}" alt="${figcaption}" ${title ? `title="${title}"` : ''}>
          <figcaption>${figcaption}</figcaption>
        </figure>
      `;
		}
	}
	return originalImage(token);
};

marked.use(
	markedFootnote({
		prefixId: 'footnote-',
	})
);
marked.use({ renderer });

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
