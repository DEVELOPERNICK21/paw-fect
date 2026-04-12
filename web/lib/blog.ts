import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogFrontmatter } from "@/types";

const postsDirectory = path.join(process.cwd(), "content/blog");

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  return fs
    .readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const full = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(full)) {
    return null;
  }
  const raw = fs.readFileSync(full, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = data as BlogFrontmatter;
  return { slug, frontmatter, content };
}

export function getAllPosts(): BlogPost[] {
  return getPostSlugs()
    .map((slug) => getPostBySlug(slug))
    .filter((p): p is BlogPost => p !== null)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime(),
    );
}
