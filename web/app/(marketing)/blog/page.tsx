import { getAllPosts } from "@/lib/blog";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Pet health, vaccination, deworming, and behaviour articles from Pawsoul.",
};

export default function BlogIndexPage(): React.ReactElement {
  const posts = getAllPosts();

  return (
    <div className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50">Blog</h1>
        <p className="mt-4 text-stone-600 dark:text-stone-400">Practical guides for Indian pet households.</p>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`}>
              <Card className="h-full transition hover:border-primary/40">
                <Badge>{p.frontmatter.category}</Badge>
                <h2 className="mt-4 text-lg font-semibold text-stone-900 dark:text-stone-50">
                  {p.frontmatter.title}
                </h2>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{p.frontmatter.excerpt}</p>
                <p className="mt-4 text-xs text-stone-500">
                  {p.frontmatter.date} · {p.frontmatter.readTime}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
