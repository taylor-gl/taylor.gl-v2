import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { createMarkdownRenderer } from './markdown';

const marked = createMarkdownRenderer();

export interface BlogPost {
  slug: string;
  title: string;
  preview: string;
  content: string;
  tags: string[];
  starred: boolean;
}

function generatePreview(content: string): string {
  // Strip footnotes before parsing to avoid plugin conflicts
  const cleanContent = content.replace(/\[\^(\d+)\]/g, '');

  const cleanMarked = new Marked();
  const tokens = cleanMarked.lexer(cleanContent);

  function extractTextFromTokens(tokens: any[]): string {
    let text = '';
    for (const token of tokens) {
      if (token.type === 'text') {
        text += token.text + ' ';
      } else if (token.type === 'paragraph' || token.type === 'heading') {
        text += extractTextFromTokens(token.tokens || []);
      } else if (token.type === 'list') {
        text += extractTextFromTokens(token.items || []);
      } else if (token.type === 'list_item') {
        text += extractTextFromTokens(token.tokens || []);
      } else if (token.type === 'strong' || token.type === 'em' || token.type === 'del') {
        text += extractTextFromTokens(token.tokens || []);
      } else if (token.type === 'link') {
        text += extractTextFromTokens(token.tokens || []);
      } else if (token.type === 'codespan') {
        text += token.text + ' ';
      }
    }
    return text;
  }

  const plainText = extractTextFromTokens(tokens).replace(/\s+/g, ' ').trim();

  const sentences = plainText.match(/[^.!?]+[.!?]+/g) || [];
  const firstTwoSentences = sentences.slice(0, 2).join(' ');
  const charLimit = Math.max(400, firstTwoSentences.length);

  let preview = plainText.slice(0, charLimit);
  if (plainText.length > charLimit) {
    preview += '...';
  }

  return preview;
}

export function getBlogPosts(): BlogPost[] {
  const postsDirectory = join(process.cwd(), 'src/content/blog');
  const filenames = readdirSync(postsDirectory);

  const posts = filenames
    .filter((filename) => filename.endsWith('.md') && !isNaN(parseInt(filename, 10)))
    .map((filename) => {
      const filePath = join(postsDirectory, filename);
      const fileContents = readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      if (data.draft === true || data.draft === undefined) {
        return null;
      }

      return {
        slug: filename.replace(/\.md$/, ''),
        title: data.title as string,
        preview: generatePreview(content),
        content: marked.parse(content) as string,
        tags: ((data.tags as string[]) || []).sort(),
        starred: data.starred === true,
      };
    })
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => parseInt(b.slug, 10) - parseInt(a.slug, 10));

  return posts;
}
