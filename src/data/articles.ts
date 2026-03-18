import { supabase } from '../lib/supabase';

export interface Article {
  id: string;
  title: {
    RO: string;
    EN: string;
  };
  excerpt: {
    RO: string;
    EN: string;
  };
  content: {
    RO: string;
    EN: string;
  };
  category: string;
  image: string;
  readTime: {
    RO: string;
    EN: string;
  };
  publishedAt: string;
  featured: boolean;
  tags: string[];
  slug_en: string;
  slug_ro: string;
  unit_calculator_slug: string | null;
}

interface DBArticle {
  id: string;
  title_ro: string;
  title_en: string;
  excerpt_ro: string;
  excerpt_en: string;
  content_ro: string;
  content_en: string;
  category: string;
  featured_image_id: string | null;
  read_time_ro: string;
  read_time_en: string;
  published_at: string;
  is_featured: boolean;
  is_visible: boolean;
  tags: string[];
  slug_ro: string;
  slug_en: string;
  unit_calculator_slug: string | null;
}

const transformDBArticle = async (dbArticle: DBArticle): Promise<Article> => {
  let imageUrl = 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800';

  if (dbArticle.featured_image_id) {
    const { data: mediaData } = await supabase
      .from('media_library')
      .select('url')
      .eq('id', dbArticle.featured_image_id)
      .maybeSingle();

    if (mediaData?.url) {
      imageUrl = mediaData.url;
    }
  }

  return {
    id: dbArticle.id,
    title: {
      RO: dbArticle.title_ro,
      EN: dbArticle.title_en,
    },
    excerpt: {
      RO: dbArticle.excerpt_ro,
      EN: dbArticle.excerpt_en,
    },
    content: {
      RO: dbArticle.content_ro,
      EN: dbArticle.content_en,
    },
    category: dbArticle.category,
    image: imageUrl,
    readTime: {
      RO: dbArticle.read_time_ro,
      EN: dbArticle.read_time_en,
    },
    publishedAt: dbArticle.published_at,
    featured: dbArticle.is_featured,
    tags: dbArticle.tags,
    slug_en: dbArticle.slug_en,
    slug_ro: dbArticle.slug_ro,
    unit_calculator_slug: dbArticle.unit_calculator_slug,
  };
};

export const getFeaturedArticles = async (_language: 'RO' | 'EN'): Promise<Article[]> => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_featured', true)
      .eq('is_visible', true)
      .order('display_order');

    if (error) throw error;

    const articles = await Promise.all(
      ((data as DBArticle[]) || []).map((dbArticle: DBArticle) => transformDBArticle(dbArticle))
    );

    return articles;
  } catch (error) {
    console.error('Error fetching featured articles:', error);
    return [];
  }
};

export const getAllVisibleArticles = async (): Promise<Article[]> => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_visible', true)
      .order('published_at', { ascending: false });

    if (error) throw error;

    const articles = await Promise.all(
      ((data as DBArticle[]) || []).map((dbArticle: DBArticle) => transformDBArticle(dbArticle))
    );

    return articles;
  } catch (error) {
    console.error('Error fetching visible articles:', error);
    return [];
  }
};

export const getArticlesByCategory = async (
  category: string,
  _language: 'RO' | 'EN'
): Promise<Article[]> => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('category', category)
      .eq('is_visible', true)
      .order('published_at', { ascending: false });

    if (error) throw error;

    const articles = await Promise.all(
      ((data as DBArticle[]) || []).map((dbArticle: DBArticle) => transformDBArticle(dbArticle))
    );

    return articles;
  } catch (error) {
    console.error('Error fetching articles by category:', error);
    return [];
  }
};

export const getArticleById = async (id: string): Promise<Article | null> => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .or(`slug_ro.eq."${id}",slug_en.eq."${id}",id.eq."${id}"`)
      .eq('is_visible', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return await transformDBArticle(data as DBArticle);
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
};

export const getAllCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('category')
      .eq('is_visible', true);

    if (error) throw error;

    const categories = [...new Set(((data || []) as {category: string}[]).map((article) => article.category))];
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};