import { getAllPosts, getPostBySlug } from "@/lib/blog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = { params: { slug: string } };

export function generateStaticParams(): { slug: string }[] {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) {
    return { title: "Post" };
  }
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.excerpt,
    openGraph: { title: post.frontmatter.title, description: post.frontmatter.excerpt },
  };
}

export default function BlogPostPage({ params }: Props): React.ReactElement {
  const post = getPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  return (
    <div className="py-24 md:py-32">
      <article className="prose prose-stone mx-auto max-w-3xl px-4 dark:prose-invert sm:px-6 lg:px-8">
        <Link href="/blog" className="text-sm text-primary hover:underline">
          ← Blog
        </Link>
        <p className="mt-4 text-sm text-stone-500">
          {post.frontmatter.category} · {post.frontmatter.date} · {post.frontmatter.readTime}
        </p>
        <h1>{post.frontmatter.title}</h1>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </article>
    </div>
  );
}
