import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      exchange_rates: {
        Row: { rate: string; [key: string]: any }
        Insert: { rate?: string; [key: string]: any }
        Update: { rate?: string; [key: string]: any }
        Relationships: []
      }
      product_allergens: {
        Row: { product_id: string; allergen_id: string; [key: string]: any }
        Insert: { product_id: string; allergen_id: string; [key: string]: any }
        Update: { product_id?: string; allergen_id?: string; [key: string]: any }
        Relationships: []
      }
      sync_logs: {
        Row: {
          id: string
          cancellation_requested: boolean | null
          progress_total: number | null
          products_created: number | null
          products_updated: number | null
          products_skipped: number | null
          products_failed: number | null
          progress_current: number | null
          status: string
          current_phase: string | null
          [key: string]: any
        }
        Insert: {
          configuration_id: string
          status?: string
          current_phase?: string | null
          progress_current?: number
          progress_total?: number
          [key: string]: any
        }
        Update: {
          status?: string
          current_phase?: string | null
          products_synced?: number | null
          products_skipped?: number | null
          products_failed?: number | null
          products_created?: number | null
          products_updated?: number | null
          completed_at?: string | null
          progress_current?: number | null
          progress_total?: number | null
          error_message?: string | null
          [key: string]: any
        }
        Relationships: []
      }
      sync_log_details: {
        Row: { [key: string]: any }
        Insert: {
          sync_log_id: string
          source_product_id: string
          product_title: string
          action: string
          skip_reason?: string | null
          error_message?: string | null
          [key: string]: any
        }
        Update: { [key: string]: any }
        Relationships: []
      }
      sync_configurations: {
        Row: {
          id: string
          source_name: string
          source_url: string
          category_mappings: any
          items_per_category_limit: number | null
          is_active: boolean
          last_sync_at: string | null
          skip_if_synced_within_hours: number | null
          [key: string]: any
        }
        Insert: { [key: string]: any }
        Update: { last_sync_at?: string | null; [key: string]: any }
        Relationships: []
      }
      products: {
        Row: { id: string; [key: string]: any }
        Insert: { slug: string; slug_ro: string; category_id: string; [key: string]: any }
        Update: { slug?: string; slug_ro?: string; category_id?: string; [key: string]: any }
        Relationships: []
      }
      synced_products: {
        Row: { id: string; product_id: string; last_synced_at: string; [key: string]: any }
        Insert: { product_id: string; source_id: string; source_name: string; source_data: any; [key: string]: any }
        Update: { last_synced_at?: string; [key: string]: any }
        Relationships: []
      }
      categories: {
        Row: { id: string; name_ro: string; name_en: string; slug: string; [key: string]: any }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: []
      }
      allergens: {
        Row: { id: string; name_en: string; name_ro: string; [key: string]: any }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type SyncClient = SupabaseClient<Database>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  tags: string | string[];
  variants: Array<{
    id: number;
    title: string;
    price: string;
    available: boolean;
  }>;
  images: Array<{
    src: string;
  }>;
}

interface ShopifyResponse {
  products: ShopifyProduct[];
}

interface CategoryMapping {
  [key: string]: string;
}

interface SyncProgress {
  current: number;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

interface AIStats {
  cleaningAttempts: number;
  cleaningSuccesses: number;
  cleaningFailures: number;
  translationAttempts: number;
  translationSuccesses: number;
  translationFailures: number;
  errors: string[];
}

interface AllergenRecord {
  id: string;
  name_en: string;
  name_ro: string;
}

function addAIError(aiStats: AIStats, error: string, maxErrors: number = 10): void {
  if (aiStats.errors.length < maxErrors) {
    aiStats.errors.push(error);
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function retryFetch(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000,
  maxRetries: number = 3
): Promise<Response> {
  const retryableStatuses = [429, 503];
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);
      if (response.ok || !retryableStatuses.includes(response.status) || attempt === maxRetries) {
        return response;
      }
      console.warn(`Retryable status ${response.status}, attempt ${attempt}/${maxRetries}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === maxRetries) throw lastError;
      console.warn(`Fetch error on attempt ${attempt}/${maxRetries}: ${lastError.message}`);
    }

    const delayMs = Math.pow(3, attempt - 1) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw lastError || new Error("retryFetch exhausted");
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractIngredients(bodyHtml: string): string {
  const text = stripHtml(bodyHtml);

  const ingredientPatterns = [
    /🍴\s*Ingrediente[:\s]*([^⚠️🔸💡]+?)(?=⚠️|Alergeni|$)/i,
    /Ingrediente[:\s]*([^⚠️🔸💡]+?)(?=⚠️|Alergeni|$)/i,
    /[🥘🥣🍲🍜🍝🍛🥗🥙🌮🌯🥪🍕🍔🍟🍖🍗🥩🥓🌭🥚🍳🧀🥐🥨🥯🥞🧇🥖🫓🥫🍱🍘🍙🍚🍥🥟🥠🥡🍤🍣🦐🦞🦀🦑🦪🍦🍧🍨🍩🍪🎂🍰🧁🥧🍫🍬🍭🍮🍯☕🫖🍵🍶🍾🍷🍸🍹🍺🥤🧋🧃🧉]+\s*([\d\w\s\-,.:;()]+(?:kg|g|ml|l)[^⚠️]*?)(?=⚠️|\*|Alergeni|La fiecare|Toate fotografiile|$)/i,
  ];

  for (const pattern of ingredientPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let ingredients = match[1]
        .replace(/Mai multe detalii.*/i, '')
        .replace(/La fiecare comanda acumulezi.*/i, '')
        .replace(/Toate fotografiile produselor.*/i, '')
        .trim();

      ingredients = ingredients
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ')
        .trim();

      if (ingredients.endsWith(',')) {
        ingredients = ingredients.slice(0, -1);
      }

      return ingredients;
    }
  }

  return '';
}

function cleanDescription(bodyHtml: string): string {
  let text = stripHtml(bodyHtml);

  text = text
    .replace(/🍴\s*Ingrediente[:\s]*[^⚠️]*/gi, ' ')
    .replace(/⚠️\s*Alergeni[:\s]*.*/gi, ' ')
    .replace(/Ingrediente[:\s]*[^.]*\./gi, ' ')
    .replace(/Alergeni[:\s]*[^.]*\./gi, ' ');

  text = text.replace(/[🥘🥣🍲🍜🍝🍛🥗🥙🌮🌯🥪🍕🍔🍟🍖🍗🥩🥓🌭🥚🍳🧀🥐🥨🥯🥞🧇🥖🫓🥫🍱🍘🍙🍚🍥🥟🥠🥡🍤🍣🦐🦞🦀🦑🦪🍦🍧🍨🍩🍪🎂🍰🧁🥧🍫🍬🍭🍮🍯☕🫖🍵🍶🍾🍷🍸🍹🍺🥤🧋🧃🧉]+\s*[\d\w\s\-,.:;()]+(?:kg|g|ml|l)[^⚠️]*?(?=⚠️|\*derived|La fiecare|Toate fotografiile|$)/gi, ' ');

  text = text.replace(/(?:XL|XXL|L|M|S|XS)\s*-?\s*[\d.]+\s*(?:kg|g|ml|l)\s*:[^.]*?(?=(?:XL|XXL|L|M|S|XS)\s*-?\s*[\d.]+\s*(?:kg|g|ml|l)|⚠️|\*|La fiecare|Toate fotografiile|$)/gi, ' ');

  text = text.replace(/\d+\s*(?:kg|g|ml|l)\s*:[^.]*?(?=\d+\s*(?:kg|g|ml|l)\s*:|⚠️|\*|La fiecare|Toate fotografiile|$)/gi, ' ');

  text = text.replace(/\*\s*derived from frozen raw materials\.?/gi, '');
  text = text.replace(/\*\s*provine din materii prime congelate\.?/gi, '');

  text = text
    .replace(/La fiecare comanda acumulezi puncte de fidelitate[^.]*\./gi, '')
    .replace(/Toate fotografiile produselor prezentate au caracter informativ[^.]*\./gi, '')
    .replace(/Mai multe detalii[^.]*\.?/gi, '')
    .replace(/Punctele acumulate[^.]*\./gi, '')
    .replace(/Poti folosi punctele[^.]*\./gi, '')
    .replace(/With every order,?\s*you accumulate loyalty points[^!]*!/gi, '')
    .replace(/Eat well and save with every order!?/gi, '')
    .replace(/FOOD Points worth[^.!]*[.!]/gi, '');

  text = text
    .replace(/[🍴⚠️🔸💡📦🎁✨🌟⭐🥘🥣🍲🍜🍝🍛🥗🥙🌮🌯🥪🍕🍔🍟🍖🍗🥩🥓🌭🥚🍳🧀🥐🥨🥯🥞🧇🥖🫓🥫🍱🍘🍙🍚🍥🥟🥠🥡🍤🍣🦐🦞🦀🦑🦪🍦🍧🍨🍩🍪🎂🍰🧁🥧🍫🍬🍭🍮🍯☕🫖🍵🍶🍾🍷🍸🍹🍺🥤🧋🧃🧉]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

function extractFirstTwoSentences(text: string): string {
  const sentenceEndings = /([.!?])\s+/g;
  const sentences: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = sentenceEndings.exec(text)) !== null && sentences.length < 2) {
    sentences.push(text.substring(lastIndex, match.index + 1));
    lastIndex = match.index + match[0].length;
  }

  if (sentences.length < 2 && lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    if (remaining.trim()) {
      sentences.push(remaining.trim());
    }
  }

  if (sentences.length === 0) {
    return text.substring(0, 200);
  }

  return sentences.join(" ").trim();
}

async function getExchangeRate(supabase: SyncClient): Promise<number> {
  const FALLBACK_RATE = 4.95;

  const { data: cachedRate } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("base_currency", "EUR")
    .eq("target_currency", "RON")
    .eq("is_active", true)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cachedRate) {
    return parseFloat((cachedRate as any).rate);
  }

  return FALLBACK_RATE;
}

function extractAllergens(bodyHtml: string): string[] {
  const text = stripHtml(bodyHtml);

  const allergenPatterns = [
    /alergeni?:?\s*([^.]+)/i,
    /conține:?\s*([^.]+)/i,
    /contains:?\s*([^.]+)/i,
  ];

  for (const pattern of allergenPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]
        .split(/[,;]/)
        .map((a) => a.trim().toLowerCase())
        .filter((a) => a.length > 0 && a.length < 50);
    }
  }
  return [];
}

function extractDietaryTags(tags: string | string[]): string[] {
  const tagList = Array.isArray(tags)
    ? tags.map((t) => t.trim().toLowerCase())
    : tags.split(",").map((t) => t.trim().toLowerCase());
  const dietaryKeywords = [
    "vegan",
    "vegetarian",
    "gluten-free",
    "fara gluten",
    "lactose-free",
    "fara lactoza",
    "keto",
    "low-carb",
    "organic",
    "bio",
  ];

  return tagList.filter((tag) =>
    dietaryKeywords.some((keyword) => tag.includes(keyword))
  );
}

interface CleanedContent {
  cleanedRo: string;
  cleanedEn: string;
}

interface CleanAndTranslateResult {
  title: CleanedContent;
  shortDescription: CleanedContent;
  fullDescription: CleanedContent;
  ingredients: CleanedContent;
}

const AI_CLEANING_SYSTEM_PROMPT = `You are a content cleaner and translator for a food delivery service. Your task is to:

1. CLEAN: Remove ALL promotional/marketing content from Romanian food product descriptions, including:
   - Loyalty points messages (e.g., "La fiecare comanda acumulezi puncte de fidelitate", "FOOD Points worth")
   - Photo disclaimers (e.g., "Toate fotografiile produselor prezentate au caracter informativ")
   - Order-related promotions (e.g., "Eat well and save with every order")
   - Any calls-to-action or marketing language
   - Emoji characters used for marketing purposes
   - Any text about accumulating points, rewards, or discounts

2. PRESERVE: Keep ONLY food-relevant information:
   - Product descriptions (what the food is, taste, preparation)
   - Ingredients lists (keep complete)
   - Allergen warnings (keep complete)
   - Portion sizes and weights
   - Preparation details

3. TRANSLATE: Convert the cleaned Romanian text to English

For each input field, return both the cleaned Romanian text and its English translation.

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "title": {"cleanedRo": "...", "cleanedEn": "..."},
  "shortDescription": {"cleanedRo": "...", "cleanedEn": "..."},
  "fullDescription": {"cleanedRo": "...", "cleanedEn": "..."},
  "ingredients": {"cleanedRo": "...", "cleanedEn": "..."}
}

If a field is empty, return empty strings for both cleanedRo and cleanedEn.`;

async function cleanAndTranslateWithAI(
  title: string,
  shortDescription: string,
  fullDescription: string,
  ingredients: string,
  openaiApiKey: string,
  aiStats: AIStats
): Promise<CleanAndTranslateResult> {
  const fallbackResult: CleanAndTranslateResult = {
    title: { cleanedRo: title, cleanedEn: title },
    shortDescription: { cleanedRo: shortDescription, cleanedEn: shortDescription },
    fullDescription: { cleanedRo: fullDescription, cleanedEn: fullDescription },
    ingredients: { cleanedRo: ingredients, cleanedEn: ingredients },
  };

  const allEmpty = [title, shortDescription, fullDescription, ingredients].every(
    (t) => !t || t.trim().length === 0
  );
  if (allEmpty) {
    return fallbackResult;
  }

  aiStats.cleaningAttempts++;

  try {
    const userContent = JSON.stringify({
      title: title || "",
      shortDescription: shortDescription || "",
      fullDescription: fullDescription || "",
      ingredients: ingredients || "",
    });

    const response = await retryFetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: AI_CLEANING_SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          temperature: 0.2,
          max_tokens: 3000,
        }),
      },
      30000,
      3
    );

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `Cleaning API error ${response.status}: ${errorText.substring(0, 200)}`;
      console.error("OpenAI API error:", response.status, errorText);
      aiStats.cleaningFailures++;
      addAIError(aiStats, errorMsg);
      return fallbackResult;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      const errorMsg = "Cleaning API returned empty content";
      console.error("No content in OpenAI response");
      aiStats.cleaningFailures++;
      addAIError(aiStats, errorMsg);
      return fallbackResult;
    }

    const parsed = JSON.parse(content);
    aiStats.cleaningSuccesses++;

    return {
      title: {
        cleanedRo: parsed.title?.cleanedRo || title,
        cleanedEn: parsed.title?.cleanedEn || title,
      },
      shortDescription: {
        cleanedRo: parsed.shortDescription?.cleanedRo || shortDescription,
        cleanedEn: parsed.shortDescription?.cleanedEn || shortDescription,
      },
      fullDescription: {
        cleanedRo: parsed.fullDescription?.cleanedRo || fullDescription,
        cleanedEn: parsed.fullDescription?.cleanedEn || fullDescription,
      },
      ingredients: {
        cleanedRo: parsed.ingredients?.cleanedRo || ingredients,
        cleanedEn: parsed.ingredients?.cleanedEn || ingredients,
      },
    };
  } catch (error) {
    const errorMsg = `Cleaning error: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error("AI cleaning and translation error:", error);
    aiStats.cleaningFailures++;
    addAIError(aiStats, errorMsg);
    return fallbackResult;
  }
}

async function translateToEnglish(text: string, openaiApiKey: string, aiStats: AIStats): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  aiStats.translationAttempts++;

  try {
    const response = await retryFetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "Translate the following Romanian text to English. Return ONLY the translation, no explanations.",
            },
            { role: "user", content: text },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      },
      15000,
      3
    );

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `Translation API error ${response.status}: ${errorText.substring(0, 200)}`;
      console.error("OpenAI Translation API error:", response.status, errorText);
      aiStats.translationFailures++;
      addAIError(aiStats, errorMsg);
      return text;
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim();

    if (result) {
      aiStats.translationSuccesses++;
      return result;
    } else {
      const errorMsg = "Translation API returned empty content";
      aiStats.translationFailures++;
      addAIError(aiStats, errorMsg);
      return text;
    }
  } catch (error) {
    const errorMsg = `Translation error: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error("Translation error:", error);
    aiStats.translationFailures++;
    addAIError(aiStats, errorMsg);
    return text;
  }
}

function categorizeProduct(
  product: ShopifyProduct,
  categoryMappings: CategoryMapping
): string | null {
  const productType = product.product_type?.toLowerCase() || "";
  const tagsRaw = product.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.join(",").toLowerCase()
    : (tagsRaw?.toLowerCase() || "");
  const title = product.title?.toLowerCase() || "";

  for (const [keyword, categoryId] of Object.entries(categoryMappings)) {
    if (
      productType.includes(keyword.toLowerCase()) ||
      tags.includes(keyword.toLowerCase()) ||
      title.includes(keyword.toLowerCase())
    ) {
      return categoryId;
    }
  }

  return null;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function getUniqueSlug(
  supabase: SyncClient,
  baseSlug: string,
  column: "slug" | "slug_ro",
  excludeProductId?: string
): Promise<string> {
  if (!baseSlug) return "";

  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    let query = supabase
      .from("products")
      .select("id")
      .eq(column, candidate)
      .limit(1);

    if (excludeProductId) {
      query = query.neq("id", excludeProductId);
    }

    const { data } = await query.maybeSingle();
    if (!data) return candidate;

    candidate = `${baseSlug}-${suffix}`;
    suffix++;
    if (suffix > 100) return `${baseSlug}-${Date.now()}`;
  }
}

async function matchAllergens(
  supabase: SyncClient,
  productId: string,
  rawAllergens: string[],
  allergenRecords: AllergenRecord[]
): Promise<void> {
  if (rawAllergens.length === 0 && allergenRecords.length === 0) return;

  await supabase.from("product_allergens").delete().eq("product_id", productId);

  if (rawAllergens.length === 0) return;

  const matchedIds = new Set<string>();

  for (const raw of rawAllergens) {
    const normalized = raw.toLowerCase().trim();
    for (const rec of allergenRecords) {
      const nameEn = rec.name_en.toLowerCase();
      const nameRo = rec.name_ro.toLowerCase();
      if (
        normalized.includes(nameEn) ||
        normalized.includes(nameRo) ||
        nameEn.includes(normalized) ||
        nameRo.includes(normalized)
      ) {
        matchedIds.add(rec.id);
      }
    }
  }

  if (matchedIds.size === 0) return;

  const rows = Array.from(matchedIds).map((allergenId) => ({
    product_id: productId,
    allergen_id: allergenId,
  }));

  await (supabase.from("product_allergens") as any).insert(rows);
}

async function checkCancellation(
  supabase: SyncClient,
  logId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("sync_logs")
    .select("cancellation_requested")
    .eq("id", logId)
    .maybeSingle();

  return data ? data.cancellation_requested === true : false;
}

async function updateProgress(
  supabase: SyncClient,
  logId: string,
  progress: SyncProgress,
  phase: string
): Promise<void> {
  await supabase
    .from("sync_logs")
    .update({
      progress_current: progress.current,
      progress_total: progress.total,
      products_created: progress.created,
      products_updated: progress.updated,
      products_skipped: progress.skipped,
      products_failed: progress.failed,
      current_phase: phase,
    } as any)
    .eq("id", logId);
}

async function logProductDetail(
  supabase: SyncClient,
  logId: string,
  sourceProductId: string,
  productTitle: string,
  action: "created" | "updated" | "skipped" | "failed",
  skipReason?: string,
  errorMessage?: string
): Promise<void> {
  await (supabase.from("sync_log_details") as any).insert({
    sync_log_id: logId,
    source_product_id: sourceProductId,
    product_title: productTitle,
    action,
    skip_reason: skipReason || null,
    error_message: errorMessage || null,
  });
}

async function handleCancellation(
  supabase: SyncClient,
  logId: string,
  progress: SyncProgress,
  phase: string
): Promise<Response | null> {
  if (!(await checkCancellation(supabase, logId))) return null;

  await supabase
    .from("sync_logs")
    .update({
      status: "cancelled",
      current_phase: phase,
      products_synced: progress.created + progress.updated,
      products_skipped: progress.skipped,
      products_failed: progress.failed,
      products_created: progress.created,
      products_updated: progress.updated,
      completed_at: new Date().toISOString(),
    } as any)
    .eq("id", logId);

  return new Response(
    JSON.stringify({
      success: false,
      cancelled: true,
      message: "Sync cancelled",
      products_created: progress.created,
      products_updated: progress.updated,
      products_skipped: progress.skipped,
      products_failed: progress.failed,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth check using manual JWT decode first for logging, then verify via getUser
    const token = authHeader.replace("Bearer ", "");
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log("JWT Claims:", {
          aud: payload.aud,
          role: payload.role,
          sub: payload.sub,
          email: payload.email,
        });
      }
    } catch (e: any) {
      console.warn("Manual JWT decode failed:", e.message);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      console.error("Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Initial config check
    const { data: config, error: configError } = await supabase
      .from("sync_configurations")
      .select("*")
      .eq("source_name", "foodnation")
      .maybeSingle();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: "Sync config not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!(config as any).is_active) {
      return new Response(JSON.stringify({ error: "Sync is disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already running
    const { data: existingRunning } = await supabase
      .from("sync_logs")
      .select("id")
      .eq("configuration_id", (config as any).id)
      .eq("status", "running")
      .limit(1)
      .maybeSingle();

    if (existingRunning) {
      return new Response(JSON.stringify({ error: "Sync already in progress" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create log entry immediately so the frontend has an ID to poll
    const { data: logEntry, error: logError } = await (supabase
      .from("sync_logs") as any)
      .insert({
        configuration_id: (config as any).id,
        status: "running",
        current_phase: "Starting background sync...",
      })
      .select()
      .single();

    if (logError) throw logError;

    // Parse request body for chaining
    const payload = await req.json().catch(() => ({}));
    const { 
      log_id: existingLogId,
      offset = 0,
      limit = 10 
    } = payload;

    // --- BACKGROUND TASK START ---
    const runSyncTask = async () => {
      let logId = existingLogId;
      const progress: SyncProgress = {
        current: offset,
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
      };

      const aiStats: AIStats = {
        cleaningAttempts: 0, cleaningSuccesses: 0, cleaningFailures: 0,
        translationAttempts: 0, translationSuccesses: 0, translationFailures: 0,
        errors: [],
      };

      try {
        // 1. Initial Setup or Resume
        if (!logId) {
          const { data: newLog, error: logError } = await (supabase
            .from("sync_logs") as any)
            .insert({
              status: "running",
              current_phase: "Fetching products...",
              progress_current: 0,
              progress_total: 0,
              configuration_id: (config as any).id
            })
            .select("id")
            .single();

          if (logError) throw logError;
          logId = newLog.id;
        } else {
          // Resume: Load current progress stats from DB
          const { data: log } = await supabase.from("sync_logs").select("*").eq("id", logId).single();
          if (log) {
            progress.total = (log as any).progress_total || 0;
            progress.created = (log as any).products_created || 0;
            progress.updated = (log as any).products_updated || 0;
            progress.skipped = (log as any).products_skipped || 0;
            progress.failed = (log as any).products_failed || 0;
            progress.current = (log as any).progress_current || offset;
          }
        }

        // 2. Fetch Source Data
        let allProducts: ShopifyProduct[] = [];
        let page = 1;
        const fetchLimit = 250;
        while (true) {
          const response = await fetchWithTimeout(`${(config as any).source_url}?limit=${fetchLimit}&page=${page}`, { method: "GET" }, 60000);
          if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
          const data: ShopifyResponse = await response.json();
          if (!data.products || data.products.length === 0) break;
          allProducts = allProducts.concat(data.products);
          if (data.products.length < fetchLimit) break;
          page++;
          if (page > 10) break;
        }

        const [categoriesRes, allergensRes] = await Promise.all([
          supabase.from("categories").select("id, name_ro, name_en, slug"),
          supabase.from("allergens").select("id, name_en, name_ro"),
        ]);
        const categories = categoriesRes.data || [];
        const exchangeRate = await getExchangeRate(supabase);
        const skipIfSyncedWithinHours = (config as any).skip_if_synced_within_hours ?? 24;
        const skipThreshold = new Date();
        skipThreshold.setHours(skipThreshold.getHours() - skipIfSyncedWithinHours);

        // Prep products
        const productsToProcess: any[] = [];
        const categoryMappings: CategoryMapping = (config as any).category_mappings || {};
        const itemsPerCategory = (config as any).items_per_category_limit || null;
        const processedInCategory: Record<string, number> = {};

        for (const p of allProducts) {
          const categoryId = categorizeProduct(p, categoryMappings) || (categories[0]?.id);
          if (!categoryId) continue;
          if (itemsPerCategory) {
            processedInCategory[categoryId] = (processedInCategory[categoryId] || 0) + 1;
            if (processedInCategory[categoryId] > itemsPerCategory) continue;
          }
          productsToProcess.push({ ...p, category_id_internal: categoryId });
        }

        progress.total = productsToProcess.length;
        if (offset === 0) {
          await (supabase.from("sync_logs") as any).update({ progress_total: progress.total }).eq("id", logId);
        }

        // 3. Process Chunk
        const chunk = productsToProcess.slice(offset, offset + limit);
        if (chunk.length === 0) {
          await supabase.from("sync_logs").update({
            status: "completed",
            completed_at: new Date().toISOString(),
            current_phase: "Sync completed successfully"
          }).eq("id", logId);
          await (supabase.from("sync_configurations") as any).update({ last_sync_at: new Date().toISOString() }).eq("id", (config as any).id);
          return;
        }

        console.log(`[Task ${logId}] Processing chunk ${offset}-${offset + chunk.length} of ${progress.total}`);
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

        for (const product of chunk) {
          if (await checkCancellation(supabase, logId)) return;

          try {
            const categoryId = product.category_id_internal;
            const { data: existing } = await supabase
              .from("synced_products")
              .select("id, product_id, last_synced_at")
              .eq("source_name", "foodnation")
              .eq("source_id", product.id.toString())
              .maybeSingle();

            if ((existing as any)?.last_synced_at && new Date((existing as any).last_synced_at) > skipThreshold) {
              progress.skipped++;
              progress.current++;
              await logProductDetail(supabase, logId, product.id.toString(), product.title, "skipped", "Recently synced");
              continue;
            }

            await Promise.race([
              (async () => {
                const ingredientsRaw = extractIngredients(product.body_html || "");
                const descriptionRaw = cleanDescription(product.body_html || "");
                const shortDescriptionRaw = extractFirstTwoSentences(descriptionRaw);
                const priceRon = parseFloat(product.variants?.[0]?.price || "0");
                const basePrice = Math.round((priceRon / exchangeRate) * 100) / 100;

                const aiResult = await Promise.race([
                  cleanAndTranslateWithAI(product.title, shortDescriptionRaw, descriptionRaw, ingredientsRaw, openaiApiKey, aiStats),
                  new Promise((_, reject) => setTimeout(() => reject(new Error("AI generation timeout")), 60000))
                ]) as any;

                const productData = {
                  category_id: categoryId,
                  title_en: aiResult.title.cleanedEn,
                  title_ro: aiResult.title.cleanedRo,
                  short_description_en: aiResult.shortDescription.cleanedEn,
                  short_description_ro: aiResult.shortDescription.cleanedRo,
                  full_description_en: aiResult.fullDescription.cleanedEn,
                  full_description_ro: aiResult.fullDescription.cleanedRo,
                  ingredients_en: aiResult.ingredients.cleanedEn,
                  ingredients_ro: aiResult.ingredients.cleanedRo,
                  base_price: basePrice,
                  image_url: product.images?.[0]?.src || "",
                  allergen_info: extractAllergens(product.body_html || ""),
                  dietary_tags: extractDietaryTags(product.tags || ""),
                  is_available: product.variants?.some((v: any) => v.available) ?? true,
                  updated_at: new Date().toISOString(),
                };

                const slugEn = generateSlug(aiResult.title.cleanedEn);
                const slugRo = generateSlug(aiResult.title.cleanedRo);

                if (existing) {
                  const uniqueSlug = await getUniqueSlug(supabase, slugEn, "slug", existing.product_id);
                  const uniqueSlugRo = await getUniqueSlug(supabase, slugRo, "slug_ro", existing.product_id);
                  await (supabase.from("products") as any).update({ ...productData, slug: uniqueSlug, slug_ro: uniqueSlugRo }).eq("id", (existing as any).product_id);
                  await (supabase.from("synced_products") as any).update({ last_synced_at: new Date().toISOString() }).eq("id", (existing as any).id);
                  progress.updated++;
                  await logProductDetail(supabase, logId, product.id.toString(), product.title, "updated");
                } else {
                  const uniqueSlug = await getUniqueSlug(supabase, slugEn, "slug");
                  const uniqueSlugRo = await getUniqueSlug(supabase, slugRo, "slug_ro");
                  const { data: newP } = await (supabase.from("products") as any).insert({ ...productData, slug: uniqueSlug, slug_ro: uniqueSlugRo }).select("id").single();
                  if (newP) {
                    await (supabase.from("synced_products") as any).insert({ product_id: (newP as any).id, source_id: product.id.toString(), source_name: "foodnation", source_data: product });
                    progress.created++;
                    await logProductDetail(supabase, logId, product.id.toString(), product.title, "created");
                  }
                }
                progress.current++;
              })(),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Overall product processing timeout")), 90000))
            ]);
          } catch (err) {
            console.error(`Error processing ${product.title}:`, err);
            progress.failed++;
            progress.current++;
            await logProductDetail(supabase, logId, product.id.toString(), product.title, "failed", undefined, String(err));
          } finally {
            await updateProgress(supabase, logId, progress, `Processing: ${progress.current}/${progress.total}`);
          }
        }

        // 4. Chain Next Call
        if (progress.current < progress.total) {
          console.log(`[Task ${logId}] Chaining next chunk from offset ${progress.current}`);
          const functionUrl = req.url; // Use current request URL
          await fetch(functionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": req.headers.get("Authorization") || "",
            },
            body: JSON.stringify({
              log_id: logId,
              offset: progress.current,
              limit: limit,
            }),
          }).catch(e => console.error("Chaining call failed:", e));
        } else {
          await supabase.from("sync_logs").update({
            status: "completed",
            completed_at: new Date().toISOString(),
            current_phase: "Sync completed successfully"
          }).eq("id", logId);
          await (supabase.from("sync_configurations") as any).update({ last_sync_at: new Date().toISOString() }).eq("id", (config as any).id);
        }

      } catch (err) {
        console.error("Sync task failed:", err);
        if (logId) {
          await supabase.from("sync_logs").update({
            status: "failed",
            error_message: String(err),
            completed_at: new Date().toISOString()
          }).eq("id", logId);
        }
      }
    };

    // Use EdgeRuntime.waitUntil for background execution
    // @ts-ignore
    EdgeRuntime.waitUntil(runSyncTask());

    return new Response(JSON.stringify({ 
      success: true, 
      message: existingLogId ? "Sync chunk started" : "Sync started", 
      log_id: existingLogId || "new_log" // Note: If new, the actual ID is only in DB, but frontend polls
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 202
    });

  } catch (error) {
    console.error("Sync serve error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

