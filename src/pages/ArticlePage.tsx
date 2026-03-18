import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useNavigation } from '../contexts/NavigationContext';
import { ArrowLeft, Clock, Tag, Calendar, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { getArticleById, getFeaturedArticles, Article } from '../data/articles';

const ArticlePage: React.FC = () => {
  const { language, t } = useLanguage();
  const { inspirationPath, homePath, getArticlePath } = useLocalizedPath();
  const { id } = useParams<{ id: string }>();
  const { goBack } = useNavigation();
  const navigate = useNavigate();

  const handleBack = () => {
    goBack();
    navigate(inspirationPath);
  };
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const element = document.documentElement;
      const totalHeight = element.scrollHeight - element.clientHeight;
      const windowScrollTop = window.scrollY || element.scrollTop;
      
      if (totalHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      
      const progress = (windowScrollTop / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadArticle = async () => {
      if (!id) { setLoading(false); return; }
      setLoading(true);
      const [fetchedArticle, allArticles] = await Promise.all([
        getArticleById(id),
        getFeaturedArticles(language),
      ]);
      setArticle(fetchedArticle);
      setRelated(allArticles.filter((a) => a.id !== id).slice(0, 3));
      setLoading(false);
    };
    loadArticle();
  }, [id, language]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return language === 'RO'
      ? date.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('Articol negasit', 'Article not found')}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('Articolul pe care il cautati nu exista.', 'The article you are looking for does not exist.')}
            </p>
            <button
              onClick={handleBack}
              className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('Inapoi la Inspiratie', 'Back to Inspiration')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-primary z-[60] transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />
      <section className="relative h-[70vh] min-h-[480px] overflow-hidden">
        <img
          src={article.image}
          alt={article.title[language]}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

        <div className="relative z-10 h-full flex flex-col justify-between px-4 py-8 max-w-5xl mx-auto w-full">
          <button
            onClick={handleBack}
            className="inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors text-sm font-medium self-start mt-16"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('Inapoi la Inspiratie', 'Back to Inspiration')}</span>
          </button>

          <div className="pb-4">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold tracking-wide">
                {article.category}
              </span>
              <div className="flex items-center space-x-1.5 text-white/75 text-sm">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-white/75 text-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>{article.readTime[language]}</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 max-w-3xl">
              {article.title[language]}
            </h1>
            <p className="text-lg text-white/85 leading-relaxed max-w-2xl">
              {article.excerpt[language]}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-14 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-14">

          <article className="flex-1 min-w-0">
            <div className="article-body">
              <div dangerouslySetInnerHTML={{ __html: article.content[language] }} />
            </div>

            {article.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex items-center flex-wrap gap-2">
                  <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                  {article.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-14 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="bg-primary px-8 py-6">
                <h3 className="text-xl font-bold text-white">
                  {t('Te-ai inspirat? Hai sa discutam!', "Feeling inspired? Let's talk!")}
                </h3>
                <p className="text-white/80 mt-1 text-sm leading-relaxed">
                  {t(
                    'Contacteaza-ne pentru a afla cum poti folosi spatiul de la Petricani 22.',
                    'Contact us to learn how you can use the Petricani 22 space.'
                  )}
                </p>
              </div>
              <div className="bg-gray-50 px-8 py-5 flex flex-col sm:flex-row gap-3">
                <Link
                  to={`${homePath}#contact`}
                  className="inline-flex items-center justify-center bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-dark transition-colors text-sm"
                >
                  {t('Contacteaza-ne', 'Contact Us')}
                </Link>
                <button
                  onClick={handleBack}
                  className="inline-flex items-center justify-center bg-white text-gray-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors border border-gray-200 text-sm"
                >
                  {t('Mai multe idei', 'More ideas')}
                </button>
              </div>
            </div>
          </article>

          <aside className="lg:w-72 shrink-0 space-y-8">
            <div className="sticky top-24">
              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
                  {t('Mai citeste si', 'More to read')}
                </h4>
                <div className="space-y-5">
                  {related.length > 0 ? related.map((rel) => (
                    <Link
                      key={rel.id}
                      to={getArticlePath({ slug: rel.slug_en, slug_ro: rel.slug_ro })}
                      className="group flex gap-3 items-start"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                        <img
                          src={rel.image}
                          alt={rel.title[language]}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-primary uppercase tracking-wide">
                          {rel.category}
                        </span>
                        <p className="text-sm font-semibold text-gray-800 leading-snug mt-0.5 group-hover:text-primary transition-colors line-clamp-2">
                          {rel.title[language]}
                        </p>
                      </div>
                    </Link>
                  )) : (
                    <p className="text-sm text-gray-500">
                      {t('Nu exista alte articole.', 'No other articles yet.')}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleBack}
                  className="mt-6 flex items-center justify-between w-full text-sm font-semibold text-primary hover:text-primary-dark transition-colors border-t border-gray-200 pt-5"
                >
                  <span>{t('Toate articolele', 'All articles')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;
