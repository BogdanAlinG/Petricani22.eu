import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, Briefcase, TreePine, Settings, Star, ArrowRight, LucideIcon } from 'lucide-react';
import ContactForm from '../components/ContactForm';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { getFeaturedArticles, getAllCategories, Article } from '../data/articles';
import { usePageSection } from '../hooks/useCMS';

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Users,
  Briefcase,
  TreePine,
  Settings,
  Star,
};

const InspirationPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { getArticlePath } = useLocalizedPath();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [articlesLoading, setArticlesLoading] = useState(true);

  const { section: heroSection, loading: heroLoading } = usePageSection('inspiration', 'hero');
  const { section: categoriesSection, blocks: categoryBlocks, loading: categoriesLoading } = usePageSection('inspiration', 'categories');

  useEffect(() => {
    const loadData = async () => {
      setArticlesLoading(true);
      const [fetchedArticles, fetchedCategories] = await Promise.all([
        getFeaturedArticles(language),
        getAllCategories(),
      ]);
      setArticles(fetchedArticles);
      setCategories(fetchedCategories);
      setArticlesLoading(false);
    };
    loadData();
  }, [language]);

  const defaults = {
    RO: {
      heroTitle: 'Descopera cum poti folosi spatiul de la Petricani 22',
      heroSubtitle: 'Inspiratie pentru locuire, birouri, evenimente si mai mult',
      introTitle: 'Idei reale, sfaturi utile si exemple creative',
      introDesc: 'Pentru a-ti imagina ce se poate face cu aceasta proprietate versatila - de la locuire moderna la evenimente in aer liber sau spatii de lucru.',
      categoryCards: [
        { icon: Home, title: 'Locuire', description: 'Transforma spatiul intr-o casa moderna si confortabila', image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { icon: Users, title: 'Evenimente', description: 'Organizeaza un eveniment special in aer liber', image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { icon: Briefcase, title: 'Birouri & Comercial', description: 'Creeaza un spatiu de lucru inspirational', image: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { icon: TreePine, title: 'Curte & Exterior', description: 'Valorifica gradina si spatiile exterioare', image: 'https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { icon: Settings, title: 'Amenajari', description: 'Idei pentru personalizarea spatiului', image: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { icon: Star, title: 'Studii de Caz', description: 'Exemple reale de utilizare a proprietatii', image: 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=600' },
      ],
    },
    EN: {
      heroTitle: 'Discover the many ways you can use the Petricani 22 property',
      heroSubtitle: 'Inspiration for living, offices, events and more',
      introTitle: 'Real ideas, useful tips, and creative examples',
      introDesc: 'To help you imagine how this versatile space can be used - from modern living to outdoor events or flexible workspaces.',
      categoryCards: [
        { icon: Home, title: 'Living', description: 'Transform the space into a modern and comfortable home', image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { icon: Users, title: 'Events', description: 'Organize a special outdoor event', image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { icon: Briefcase, title: 'Office & Commercial', description: 'Create an inspirational workspace', image: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { icon: TreePine, title: 'Yard & Outdoor', description: 'Make the most of the garden and outdoor areas', image: 'https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { icon: Settings, title: 'Furnishing', description: 'Ideas for customizing the space', image: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { icon: Star, title: 'Case Studies', description: 'Real examples of property usage', image: 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=600' },
      ],
    },
  };

  const d = defaults[language];

  const heroTitle = heroSection
    ? (language === 'RO' ? heroSection.title_ro : heroSection.title_en) || d.heroTitle
    : d.heroTitle;
  const heroSubtitle = heroSection
    ? (language === 'RO' ? heroSection.subtitle_ro : heroSection.subtitle_en) || d.heroSubtitle
    : d.heroSubtitle;

  const introTitle = categoriesSection
    ? (language === 'RO' ? categoriesSection.title_ro : categoriesSection.title_en) || d.introTitle
    : d.introTitle;
  const introDesc = categoriesSection
    ? (language === 'RO' ? categoriesSection.subtitle_ro : categoriesSection.subtitle_en) || d.introDesc
    : d.introDesc;

  const categoryCards =
    categoryBlocks.length > 0
      ? categoryBlocks.map((block) => {
          const Icon = (block.icon && ICON_MAP[block.icon]) || Star;
          const imageUrl = (block.settings as Record<string, string>)?.image_url || '';
          return {
            Icon,
            title: (language === 'RO' ? block.title_ro : block.title_en) || '',
            description: (language === 'RO' ? block.description_ro : block.description_en) || '',
            image: imageUrl,
          };
        })
      : d.categoryCards.map((cat) => ({ Icon: cat.icon, title: cat.title, description: cat.description, image: cat.image }));

  const pageLoading = heroLoading || categoriesLoading;

  const filteredArticles =
    activeCategory === 'all'
      ? articles
      : articles.filter((a) => a.category === activeCategory);

  const featuredArticle = filteredArticles[0] ?? null;
  const secondaryArticles = filteredArticles.slice(1, 3);
  const remainingArticles = filteredArticles.slice(3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return language === 'RO'
      ? date.toLocaleDateString('ro-RO', { year: 'numeric', month: 'short', day: 'numeric' })
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="relative h-[80vh] min-h-[560px] overflow-hidden">
        <img
          src="/IMAG0090.jpg"
          alt="Petricani 22 Property"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/65 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="relative z-10 h-full flex flex-col justify-center px-4">
          <div className="max-w-6xl mx-auto w-full">
            <div className="max-w-2xl">
              {pageLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-3 w-24 bg-white/30 rounded-full" />
                  <div className="h-12 bg-white/20 rounded-lg" />
                  <div className="h-12 bg-white/20 rounded-lg w-4/5" />
                  <div className="h-6 bg-white/15 rounded-lg w-3/4 mt-2" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-px bg-primary" />
                    <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">
                      {t('Inspiratie', 'Inspiration')}
                    </span>
                  </div>
                  <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-5">
                    {heroTitle}
                  </h1>
                  <p className="text-lg lg:text-xl text-white/80 leading-relaxed">
                    {heroSubtitle}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/50">
          <div className="w-px h-8 bg-white/30 animate-pulse" />
        </div>
      </section>

      {/* Intro strip */}
      <section className="bg-gray-950 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-20">
            <div className="lg:w-1/2">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">{introTitle}</h2>
            </div>
            <div className="lg:w-1/2">
              <p className="text-gray-400 text-lg leading-relaxed">{introDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category cards */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">{t('Categorii', 'Categories')}</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">
              {t('Exploreaza posibilitatile', 'Explore the possibilities')}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoryCards.map((category, index) => (
              <div
                key={index}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer"
              >
                <img
                  src={category.image}
                  alt={category.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  <div className="w-9 h-9 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <category.Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">{category.title}</h3>
                    <p className="text-white/70 text-xs mt-1 leading-snug opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Articles section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">{t('Articole', 'Articles')}</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-1">
                {t('Citeste & inspira-te', 'Read & get inspired')}
              </h2>
            </div>

            {/* Category filter */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t('Toate', 'All')}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      activeCategory === cat
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {articlesLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-2xl aspect-[16/9] mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">{t('Nu exista articole in aceasta categorie.', 'No articles in this category yet.')}</p>
            </div>
          ) : (
            <div className="space-y-10">

              {/* Featured article — large card */}
              {featuredArticle && (
                <Link
                  to={getArticlePath(featuredArticle.id)}
                  className="group grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500 bg-gray-950"
                >
                  <div className="relative overflow-hidden aspect-[16/10] lg:aspect-auto">
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title[language]}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <span className="absolute top-5 left-5 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      {featuredArticle.category}
                    </span>
                  </div>
                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <p className="text-gray-500 text-sm mb-4">
                      {formatDate(featuredArticle.publishedAt)} · {featuredArticle.readTime[language]}
                    </p>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-4 group-hover:text-primary transition-colors duration-300">
                      {featuredArticle.title[language]}
                    </h3>
                    <p className="text-gray-400 leading-relaxed mb-8 line-clamp-3">
                      {featuredArticle.excerpt[language]}
                    </p>
                    <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                      <span>{t('Citeste articolul', 'Read article')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              )}

              {/* Secondary pair */}
              {secondaryArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {secondaryArticles.map((article) => (
                    <Link
                      key={article.id}
                      to={getArticlePath(article.id)}
                      className="group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white border border-gray-100"
                    >
                      <div className="relative overflow-hidden aspect-[16/9]">
                        <img
                          src={article.image}
                          alt={article.title[language]}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                        <span className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                          {article.category}
                        </span>
                      </div>
                      <div className="p-6">
                        <p className="text-gray-400 text-xs mb-2">
                          {formatDate(article.publishedAt)} · {article.readTime[language]}
                        </p>
                        <h3 className="text-xl font-bold text-gray-900 leading-snug mb-2 group-hover:text-primary transition-colors">
                          {article.title[language]}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                          {article.excerpt[language]}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-1.5 text-primary font-semibold text-sm group-hover:gap-2.5 transition-all duration-300">
                          <span>{t('Citeste', 'Read')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Remaining articles — list style */}
              {remainingArticles.length > 0 && (
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {remainingArticles.map((article) => (
                    <Link
                      key={article.id}
                      to={getArticlePath(article.id)}
                      className="group flex gap-5 py-6 items-start hover:bg-gray-50 -mx-4 px-4 rounded-xl transition-colors"
                    >
                      <div className="w-24 h-24 sm:w-32 sm:h-24 rounded-xl overflow-hidden shrink-0">
                        <img
                          src={article.image}
                          alt={article.title[language]}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1.5">
                          <span className="text-xs font-bold text-primary uppercase tracking-wide">
                            {article.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(article.publishedAt)} · {article.readTime[language]}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 leading-snug group-hover:text-primary transition-colors mb-1.5">
                          {article.title[language]}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 hidden sm:block">
                          {article.excerpt[language]}
                        </p>
                      </div>
                      <div className="shrink-0 self-center text-gray-300 group-hover:text-primary transition-colors">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      </section>

      <ContactForm />
    </div>
  );
};

export default InspirationPage;
