import React, { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Clock, User, Calendar, ArrowLeft, Home, ArrowRight } from 'lucide-react';
import {
  getPostBySlug,
  getRelatedPosts,
  formatBlogDate,
  ContentBlock,
} from '../../data/blogPosts';
import { AdsterraBanner } from '../../components/common/AdsterraBanner';
import { Footer } from '../../components/common/Footer';
import BlogToolEmbed from '../../components/blog/BlogToolEmbed';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = slug ? getPostBySlug(slug) : undefined;

  // ── SEO: Set title + description dynamically ──
  useEffect(() => {
    if (post) {
      document.title = `${post.title} | 999tools Blog`;

      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', post.excerpt);

      // OG tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', post.title);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', post.excerpt);
    }
    window.scrollTo(0, 0);
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-black mb-2">Post Not Found</h1>
          <p className="text-sm text-slate-400 mb-6">
            Ye article exist nahi karta ya URL galat hai.
          </p>
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const relatedPosts = getRelatedPosts(post.slug, 3);

  // ── Render content block ──
  const renderBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case 'h2':
        return (
          <h2
            key={index}
            className="text-xl sm:text-2xl font-black text-white mt-10 mb-4 leading-tight"
          >
            {block.text}
          </h2>
        );

      case 'h3':
        return (
          <h3
            key={index}
            className="text-lg font-bold text-white mt-6 mb-3 leading-tight"
          >
            {block.text}
          </h3>
        );

      case 'p':
        return (
          <p
            key={index}
            className="text-[15px] text-slate-300 leading-relaxed mb-4"
          >
            {block.text}
          </p>
        );

      case 'ul':
        return (
          <ul key={index} className="space-y-2 mb-5 pl-1">
            {block.items.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[14px] text-slate-300 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );

      case 'ol':
        return (
          <ol key={index} className="space-y-2 mb-5 pl-1">
            {block.items.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[14px] text-slate-300 leading-relaxed"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        );

      case 'callout':
        return (
          <div
            key={index}
            className="my-6 p-4 rounded-2xl bg-amber-500/10 border-l-4 border-amber-500"
          >
            {block.title && (
              <div className="text-sm font-bold text-amber-400 mb-1.5">
                {block.title}
              </div>
            )}
            <p className="text-[14px] text-slate-300 leading-relaxed">
              {block.text}
            </p>
          </div>
        );

      case 'cta':
        return (
          <div
            key={index}
            className="my-8 p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg"
          >
            <p className="text-sm leading-relaxed mb-3">{block.text}</p>
            <Link
              to={block.link}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition"
            >
              {block.linkText}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        );

      case 'tool':
        return (
          <BlogToolEmbed
            key={index}
            toolId={block.toolId}
            heading={block.heading}
            description={block.description}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Breadcrumb */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Blog
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            <Home className="w-3.5 h-3.5" />
            999tools Home
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className={`bg-gradient-to-br ${post.bannerGradient} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider mb-4">
            {post.category}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-5">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-white/90">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatBlogDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime} min read
            </span>
          </div>
        </div>
      </div>

      {/* Ad */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AdsterraBanner slot="header" />
      </div>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="prose-custom">
          {post.content.map((block, i) => renderBlock(block, i))}
        </div>

        {/* Tags Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tags:
            </span>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </article>

      {/* Ad */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <AdsterraBanner slot="native_banner" />
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-lg font-black text-white mb-5 flex items-center gap-2">
            <span>📚</span> Ye bhi Padhein
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedPosts.map((rp) => (
              <Link
                key={rp.slug}
                to={`/blog/${rp.slug}`}
                className="group bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-indigo-500 transition"
              >
                <div className={`h-20 bg-gradient-to-br ${rp.bannerGradient}`} />
                <div className="p-4">
                  <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5">
                    {rp.category}
                  </div>
                  <h3 className="text-xs font-bold text-white leading-snug line-clamp-2 group-hover:text-indigo-400 transition">
                    {rp.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default BlogPostPage;
