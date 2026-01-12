import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';
import { BlogPostPreview } from '@/lib/blog';
import { Button } from '@/components/ui/button';

interface BlogCardProps {
  post: BlogPostPreview;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="bg-white rounded-lg border-l-4 border-l-emerald-500 border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card Content */}
      <div className="p-6">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h2 className="font-display text-xl text-stone-900 mb-3 line-clamp-2 hover:text-emerald-600 transition-colors">
          <Link href={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="text-stone-600 mb-4 line-clamp-3 text-sm">
          {post.excerpt}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-stone-400" />
            <span>{post.readTime} min read</span>
          </div>
        </div>

        {/* Author */}
        <div className="text-sm text-stone-600 mb-4">
          By <span className="font-medium text-stone-900">{post.author}</span>
        </div>

        {/* Read More Button */}
        <Link href={`/blog/${post.slug}`}>
          <Button variant="outline" className="w-full border-stone-300 text-stone-700 hover:bg-stone-100">
            Read Article
          </Button>
        </Link>
      </div>
    </article>
  );
}
