import { Marked, Renderer } from 'marked';
import markedFootnote from 'marked-footnote';
import { gfmHeadingId } from 'marked-gfm-heading-id';

export function createMarkdownRenderer() {
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

  const marked = new Marked();

  marked.use(
    markedFootnote({
      prefixId: 'footnote-',
    })
  );
  marked.use(gfmHeadingId());
  marked.use({ renderer });

  return marked;
}
