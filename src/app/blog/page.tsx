import { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { BlogCard } from '@/components/blog/BlogCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard as CreditCardIcon, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Credit Score Blog - Tips & Guides | CardTempo',
  description: 'Learn how to improve your credit score with expert tips on credit utilization, payment timing, and credit card optimization strategies.',
  keywords: ['credit score tips', 'credit utilization', 'improve credit score', 'credit card optimization', 'FICO score'],
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body">
      {/* Header */}
      <header className="border-b border-stone-200 bg-[#FAFAF8]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <CreditCardIcon className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl text-stone-900">CardTempo</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-stone-600 hover:text-stone-900">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Page Hero */}
      <div className="border-b border-stone-200 bg-white">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-stone-900">
              Credit Score Blog
            </h1>
          </div>
          <p className="text-lg text-stone-600 max-w-3xl">
            Expert tips and strategies to boost your credit score and master credit card optimization.
          </p>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone-500 text-lg">No blog posts yet. Check back soon!</p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-emerald-600 text-white py-16 mt-12">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-display text-3xl mb-4">Ready to Optimize Your Credit Score?</h2>
          <p className="text-lg mb-8 text-emerald-100">
            Use our free calculator to create a personalized payment plan.
          </p>
          <Link href="/calculator">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50">
              Try the Calculator
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
