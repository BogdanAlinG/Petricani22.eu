import { useState } from 'react';
import { supabase } from '../lib/supabase';

export type AIGenerateType =
  | 'faq'
  | 'faq_answer'
  | 'article_title'
  | 'article_excerpt'
  | 'article_content'
  | 'section_title'
  | 'section_subtitle'
  | 'block_title'
  | 'block_description'
  | 'translate'
  | 'article_slug'
  | 'article_tags'
  | 'product_short_description'
  | 'product_full_description';

interface GenerateOptions {
  type: AIGenerateType;
  language: 'en' | 'ro';
  context?: string;
  existingContent?: string;
  category?: string;
  keywords?: string;
}

export function useAIGenerate() {
  const [generating, setGenerating] = useState<string | null>(null);

  const generate = async (id: string, options: GenerateOptions): Promise<string | null> => {
    setGenerating(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(options),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'AI generation failed');
      }

      const data = await res.json();
      let result = data.result as string;
      result = result.replace(/^```(?:html|markdown|md)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      return result;
    } catch (err) {
      console.error('AI generate error:', err);
      return null;
    } finally {
      setGenerating(null);
    }
  };

  return { generate, generating };
}
