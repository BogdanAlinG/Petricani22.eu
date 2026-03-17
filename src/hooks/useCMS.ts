import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSetting {
  key: string;
  value_en: string | null;
  value_ro: string | null;
}

interface PageSection {
  id: string;
  page: string;
  section: string;
  title_en: string | null;
  title_ro: string | null;
  subtitle_en: string | null;
  subtitle_ro: string | null;
  content_en: string | null;
  content_ro: string | null;
  image_id: string | null;
  settings: Record<string, unknown>;
  is_visible: boolean;
  display_order: number;
}

interface ContentBlock {
  id: string;
  section_id: string;
  type: string;
  icon: string | null;
  title_en: string | null;
  title_ro: string | null;
  description_en: string | null;
  description_ro: string | null;
  link_url: string | null;
  image_id: string | null;
  settings: Record<string, unknown>;
  display_order: number;
  is_visible: boolean;
}

interface FAQ {
  id: string;
  category: string;
  question_en: string;
  question_ro: string;
  answer_en: string;
  answer_ro: string;
  display_order: number;
  is_visible: boolean;
}

interface Testimonial {
  id: string;
  author_name: string;
  author_title: string | null;
  author_image_url: string | null;
  content_en: string;
  content_ro: string;
  rating: number;
  source: string | null;
  date: string;
  is_featured: boolean;
  is_visible: boolean;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
  display_order: number;
  is_visible: boolean;
}

interface NavigationMenu {
  id: string;
  location: string;
  parent_id: string | null;
  label_en: string;
  label_ro: string;
  url: string;
  icon: string | null;
  target: string;
  display_order: number;
  is_visible: boolean;
  children?: NavigationMenu[];
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('key, value_en, value_ro');

        if (error) throw error;

        const settingsMap: Record<string, SiteSetting> = {};
        data?.forEach((s) => {
          settingsMap[s.key] = s;
        });
        setSettings(settingsMap);
      } catch (error) {
        console.error('Error fetching site settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const getSetting = useCallback(
    (key: string, language: 'EN' | 'RO' = 'EN'): string => {
      const setting = settings[key];
      if (!setting) return '';
      return (language === 'RO' ? setting.value_ro : setting.value_en) || '';
    },
    [settings]
  );

  return { settings, loading, getSetting };
}

export function usePageSection(page: string, section: string) {
  const [data, setData] = useState<PageSection | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSection = async () => {
      try {
        const { data: sectionData, error: sectionError } = await supabase
          .from('page_sections')
          .select('*')
          .eq('page', page)
          .eq('section', section)
          .eq('is_visible', true)
          .maybeSingle();

        if (sectionError) throw sectionError;
        setData(sectionData);

        if (sectionData) {
          const { data: blocksData, error: blocksError } = await supabase
            .from('content_blocks')
            .select('*')
            .eq('section_id', sectionData.id)
            .eq('is_visible', true)
            .order('display_order');

          if (blocksError) throw blocksError;
          setBlocks(blocksData || []);
        }
      } catch (error) {
        console.error('Error fetching page section:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSection();
  }, [page, section]);

  return { section: data, blocks, loading };
}

export function useFAQs(category?: string) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        let query = supabase
          .from('faqs')
          .select('*')
          .eq('is_visible', true)
          .order('category')
          .order('display_order');

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        setFaqs(data || []);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, [category]);

  return { faqs, loading };
}

export function useTestimonials(featuredOnly = false) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        let query = supabase
          .from('testimonials')
          .select(`
            id,
            author_name,
            author_title,
            author_image_id,
            content_en,
            content_ro,
            rating,
            source,
            date,
            is_featured,
            is_visible,
            media_library!testimonials_author_image_id_fkey(url)
          `)
          .eq('is_visible', true)
          .order('display_order');

        if (featuredOnly) {
          query = query.eq('is_featured', true);
        }

        const { data, error } = await query;
        if (error) throw error;

        const processedData = data?.map((t: Record<string, unknown>) => ({
          ...t,
          author_image_url: (t.media_library as { url?: string } | null)?.url || null,
        })) || [];

        setTestimonials(processedData as Testimonial[]);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, [featuredOnly]);

  return { testimonials, loading };
}

export function useSocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('social_links')
          .select('*')
          .eq('is_visible', true)
          .order('display_order');

        if (error) throw error;
        setLinks(data || []);
      } catch (error) {
        console.error('Error fetching social links:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  return { links, loading };
}

export function useNavigation(location: string) {
  const [menu, setMenu] = useState<NavigationMenu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data, error } = await supabase
          .from('navigation_menus')
          .select('*')
          .eq('location', location)
          .eq('is_visible', true)
          .order('display_order');

        if (error) throw error;

        const rootItems = data?.filter((item) => !item.parent_id) || [];
        const processedMenu = rootItems.map((item) => ({
          ...item,
          children: data?.filter((child) => child.parent_id === item.id) || [],
        }));

        setMenu(processedMenu);
      } catch (error) {
        console.error('Error fetching navigation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [location]);

  return { menu, loading };
}
