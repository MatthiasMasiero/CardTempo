import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import sanitizeHtml from 'sanitize-html';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  tags: string[];
  readTime: number;
  content: string;
  headings: { id: string; text: string; level: number }[];
}

export interface BlogPostPreview {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  tags: string[];
  readTime: number;
}

/**
 * Extract headings from markdown content for table of contents
 */
function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2];
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    headings.push({ id, text, level });
  }

  return headings;
}

/**
 * Calculate reading time based on word count
 */
function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Get all blog posts sorted by date (newest first)
 */
export function getAllPosts(): BlogPostPreview[] {
  // Create directory if it doesn't exist
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true });
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title,
        excerpt: data.excerpt,
        date: data.date,
        author: data.author || 'CardTempo Team',
        tags: data.tags || [],
        readTime: calculateReadTime(content),
      };
    });

  // Sort by date (newest first)
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

/**
 * Get a single blog post by slug
 */
export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Extract headings for table of contents
    const headings = extractHeadings(content);

    // Convert markdown to HTML
    const processedContent = remark().use(html).processSync(content);
    const contentHtml = processedContent.toString();

    // SECURITY: Sanitize HTML to prevent XSS attacks
    const sanitizedContent = sanitizeHtml(contentHtml, {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 'del', 'ins',
        'ul', 'ol', 'li',
        'a', 'code', 'pre', 'blockquote',
        'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'div', 'span',
      ],
      allowedAttributes: {
        'a': ['href', 'title', 'target', 'rel'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        'code': ['class'],
        'pre': ['class'],
        'div': ['class'],
        'span': ['class'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
    });

    return {
      slug,
      title: data.title,
      excerpt: data.excerpt,
      date: data.date,
      author: data.author || 'CardTempo Team',
      tags: data.tags || [],
      readTime: calculateReadTime(content),
      content: sanitizedContent,
      headings,
    };
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return null;
  }
}

/**
 * Get posts by tag
 */
export function getPostsByTag(tag: string): BlogPostPreview[] {
  const allPosts = getAllPosts();
  return allPosts.filter((post) => post.tags.includes(tag));
}
