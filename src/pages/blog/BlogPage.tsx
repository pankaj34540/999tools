import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag, ArrowRight, BookOpen, Search } from 'lucide-react';
import { BLOG_POSTS, formatBlogDate, getAllCategories } from '../../data/blogPosts';
import { AdsterraBanner } from '../../components/common/AdsterraBanner';
import { Footer } from '../../components/common/Footer';

const BlogPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // ── SEO: Page title ──
  useEffect(() => {
    document.title = 'Blog — Free Guides for Indian Students & CSC VLE | 999tools';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Free guides on PAN card, Aadhaar, exam forms, passport photos, CSC VLE, and more. Practical tips for Indian students and cyber cafe owners.'
      );
    }
    window.scrollTo(0, 0);
  }, []);

  const categories = ['all', ...getAllCategories()];

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.tags.some((t) => t.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === 'all' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition mb-6"
          >
            ← Back to 999tools
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                999tools Blog
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">
                Free Guides & Tips
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Practical guides for Indian students, CSC VLE operators, and cyber cafe
            owners. PAN card, Aadhaar, exam forms, and business tips — sab kuch
            free.
          </p>
        </div>
      </div>

      {/* Ad */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AdsterraBanner slot="header" />
      </div>

      {/* Search + Filters */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles (e.g. PAN card, Aadhaar)..."
            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat === 'all' ? 'All Posts' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800">
            <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300">No articles found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try different search or category
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden hover:border-indigo-500 transition-all hover:shadow-xl"
              >
                {/* Banner */}
                <div
                  className={`h-32 bg-gradient-to-br ${post.bannerGradient} relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 rounded-lg bg-black/30 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold">
                    <span>{formatBlogDate(post.publishedAt)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.readTime} min read
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-white leading-snug group-hover:text-indigo-400 transition line-clamp-2">
                    {post.title}
                  </h2>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition">
                      Read More
                    </span>
                    <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BlogPage;
