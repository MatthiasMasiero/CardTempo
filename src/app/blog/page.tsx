import { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { BlogCard } from '@/components/blog/BlogCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Credit Score Blog - Tips & Guides | Credit Optimizer',
  description: 'Learn how to improve your credit score with expert tips on credit utilization, payment timing, and credit card optimization strategies.',
  keywords: ['credit score tips', 'credit utilization', 'improve credit score', 'credit card optimization', 'FICO score'],
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Credit Score Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Expert tips and strategies to boost your credit score and master credit card optimization.
          </p>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No blog posts yet. Check back soon!</p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16 mt-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Optimize Your Credit Score?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Use our free calculator to create a personalized payment plan.
          </p>
          <Link href="/calculator">
            <Button size="lg" variant="secondary">
              Try the Calculator
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
