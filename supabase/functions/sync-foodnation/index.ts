import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

async function getExchangeRate(supabase: ReturnType<typeof createClient>): Promise<number> {
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
    return parseFloat(cachedRate.rate);
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
          model: "gpt-4.1",
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
          model: "gpt-4.1",
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
  supabase: ReturnType<typeof createClient>,
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
  supabase: ReturnType<typeof createClient>,
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

  await supabase.from("product_allergens").insert(rows);
}

async function checkCancellation(
  supabase: ReturnType<typeof createClient>,
  logId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("sync_logs")
    .select("cancellation_requested")
    .eq("id", logId)
    .maybeSingle();

  return data?.cancellation_requested === true;
}

async function updateProgress(
  supabase: ReturnType<typeof createClient>,
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
    })
    .eq("id", logId);
}

async function logProductDetail(
  supabase: ReturnType<typeof createClient>,
  logId: string,
  sourceProductId: string,
  productTitle: string,
  action: "created" | "updated" | "skipped" | "failed",
  skipReason?: string,
  errorMessage?: string
): Promise<void> {
  await supabase.from("sync_log_details").insert({
    sync_log_id: logId,
    source_product_id: sourceProductId,
    product_title: productTitle,
    action,
    skip_reason: skipReason || null,
    error_message: errorMessage || null,
  });
}

async function handleCancellation(
  supabase: ReturnType<typeof createClient>,
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
    })
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
    console.log("Request received:", {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });

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
    if (!authHeader) {
      console.error("No Authorization header provided");
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    console.log("Initializing Supabase service client...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // More robust way to get user in Edge Functions
    const token = authHeader.replace("Bearer ", "");
    console.log("Token verification details:", {
      headerLength: authHeader.length,
      tokenLength: token.length,
      tokenStart: token.substring(0, 15) + "...",
    });
    
    console.log("Verifying user token...");
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Authentication check failed:", {
        error: authError?.message || "User not found",
        errorDetails: authError,
        hasUser: !!user,
      });
      return new Response(JSON.stringify({ 
        error: "Unauthorized", 
        details: authError?.message || "User not found or session invalid" 
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User authenticated:", user.id);

    const { data: config, error: configError } = await supabase
      .from("sync_configurations")
      .select("*")
      .eq("source_name", "foodnation")
      .maybeSingle();

    if (configError || !config) {
      return new Response(
        JSON.stringify({
          error: "Sync configuration not found",
          details: configError?.message,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!config.is_active) {
      return new Response(
        JSON.stringify({ error: "Sync is currently disabled" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: existingRunning } = await supabase
      .from("sync_logs")
      .select("id")
      .eq("configuration_id", config.id)
      .eq("status", "running")
      .limit(1)
      .maybeSingle();

    if (existingRunning) {
      return new Response(
        JSON.stringify({ error: "A sync is already in progress" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const skipIfSyncedWithinHours = config.skip_if_synced_within_hours ?? 24;
    const skipThreshold = new Date();
    skipThreshold.setHours(skipThreshold.getHours() - skipIfSyncedWithinHours);

    const { data: logEntry, error: logError } = await supabase
      .from("sync_logs")
      .insert({
        configuration_id: config.id,
        status: "running",
        current_phase: "Initializing sync...",
      })
      .select()
      .single();

    if (logError) {
      return new Response(
        JSON.stringify({
          error: "Failed to create sync log",
          details: logError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const logId = logEntry.id;

    const progress: SyncProgress = {
      current: 0,
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    };

    const aiStats: AIStats = {
      cleaningAttempts: 0,
      cleaningSuccesses: 0,
      cleaningFailures: 0,
      translationAttempts: 0,
      translationSuccesses: 0,
      translationFailures: 0,
      errors: [],
    };

    try {
      const { data: orphanedEntries } = await supabase
        .from("synced_products")
        .select("id, product_id")
        .eq("source_name", "foodnation");

      if (orphanedEntries && orphanedEntries.length > 0) {
        const allProductIds = orphanedEntries.map((e) => e.product_id);
        const { data: existingProducts } = await supabase
          .from("products")
          .select("id")
          .in("id", allProductIds);

        const existingProductIds = new Set((existingProducts || []).map((p) => p.id));
        const orphanedIds = orphanedEntries
          .filter((e) => !existingProductIds.has(e.product_id))
          .map((e) => e.id);

        if (orphanedIds.length > 0) {
          await supabase
            .from("synced_products")
            .delete()
            .in("id", orphanedIds);

          console.log(`Cleaned up ${orphanedIds.length} orphaned synced_products entries`);
        }
      }

      let cancelResponse = await handleCancellation(supabase, logId, progress, "Cancelled before fetching products");
      if (cancelResponse) return cancelResponse;

      await updateProgress(supabase, logId, progress, "Fetching products from FoodNation...");

      let allProducts: ShopifyProduct[] = [];
      let page = 1;
      const limit = 250;

      while (true) {
        cancelResponse = await handleCancellation(supabase, logId, progress, "Cancelled while fetching products");
        if (cancelResponse) return cancelResponse;

        const response = await fetchWithTimeout(
          `${config.source_url}?limit=${limit}&page=${page}`,
          { method: "GET" },
          60000
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }

        const data: ShopifyResponse = await response.json();
        if (!data.products || data.products.length === 0) {
          break;
        }

        allProducts = allProducts.concat(data.products);
        if (data.products.length < limit) {
          break;
        }
        page++;

        if (page > 10) break;
      }

      const [categoriesResult, allergensResult] = await Promise.all([
        supabase.from("categories").select("id, name_ro, name_en, slug"),
        supabase.from("allergens").select("id, name_en, name_ro"),
      ]);

      if (categoriesResult.error) {
        throw new Error(`Failed to fetch categories: ${categoriesResult.error.message}`);
      }
      const categories = categoriesResult.data;
      const allergenRecords: AllergenRecord[] = allergensResult.data || [];

      let categoryMappings: CategoryMapping = config.category_mappings || {};

      if (Object.keys(categoryMappings).length === 0 && categories) {
        const defaultMappings: CategoryMapping = {};
        for (const cat of categories) {
          const keywords = [
            cat.slug,
            cat.name_ro?.toLowerCase(),
            cat.name_en?.toLowerCase(),
          ].filter(Boolean);
          for (const keyword of keywords) {
            if (keyword) {
              defaultMappings[keyword] = cat.id;
            }
          }
        }
        categoryMappings = defaultMappings;
      }

      const productsByCategory: { [categoryId: string]: ShopifyProduct[] } = {};
      const uncategorized: ShopifyProduct[] = [];

      for (const product of allProducts) {
        const categoryId = categorizeProduct(product, categoryMappings);
        if (categoryId) {
          if (!productsByCategory[categoryId]) {
            productsByCategory[categoryId] = [];
          }
          productsByCategory[categoryId].push(product);
        } else {
          uncategorized.push(product);
        }
      }

      let defaultCategoryId: string | null = null;
      if (categories && categories.length > 0) {
        defaultCategoryId = categories[0].id;
      }

      if (defaultCategoryId && uncategorized.length > 0) {
        if (!productsByCategory[defaultCategoryId]) {
          productsByCategory[defaultCategoryId] = [];
        }
        productsByCategory[defaultCategoryId].push(...uncategorized);
      }

      const exchangeRate = await getExchangeRate(supabase);

      const itemsPerCategory = config.items_per_category_limit || null;

      let totalProductsToProcess = 0;
      for (const [, products] of Object.entries(productsByCategory)) {
        const count = itemsPerCategory
          ? Math.min(products.length, itemsPerCategory)
          : products.length;
        totalProductsToProcess += count;
      }

      progress.total = totalProductsToProcess;
      await updateProgress(supabase, logId, progress, "Starting product sync...");

      const categoryNames: Record<string, string> = {};
      if (categories) {
        for (const cat of categories) {
          categoryNames[cat.id] = cat.name_en || cat.name_ro || cat.slug;
        }
      }

      for (const [categoryId, products] of Object.entries(productsByCategory)) {
        cancelResponse = await handleCancellation(supabase, logId, progress, "Cancelled during product processing");
        if (cancelResponse) return cancelResponse;

        const categoryName = categoryNames[categoryId] || "Unknown";
        const productsToSync = itemsPerCategory
          ? products.slice(0, itemsPerCategory)
          : products;

        const skippedDueToLimit = products.length - productsToSync.length;
        for (let i = productsToSync.length; i < products.length; i++) {
          const skippedProduct = products[i];
          await logProductDetail(
            supabase,
            logId,
            skippedProduct.id.toString(),
            skippedProduct.title,
            "skipped",
            "Category limit reached"
          );
        }
        progress.skipped += skippedDueToLimit;

        for (const product of productsToSync) {
          cancelResponse = await handleCancellation(supabase, logId, progress, "Cancelled during product processing");
          if (cancelResponse) return cancelResponse;

          progress.current++;
          await updateProgress(
            supabase,
            logId,
            progress,
            `Processing: ${product.title.substring(0, 50)}... (${categoryName})`
          );

          const { data: existing } = await supabase
            .from("synced_products")
            .select("id, product_id, last_synced_at")
            .eq("source_name", "foodnation")
            .eq("source_id", product.id.toString())
            .maybeSingle();

          if (existing && existing.last_synced_at) {
            const lastSyncedAt = new Date(existing.last_synced_at);
            if (lastSyncedAt > skipThreshold) {
              const hoursAgo = Math.round(
                (Date.now() - lastSyncedAt.getTime()) / (1000 * 60 * 60)
              );
              await logProductDetail(
                supabase,
                logId,
                product.id.toString(),
                product.title,
                "skipped",
                `Recently synced (${hoursAgo}h ago, threshold: ${skipIfSyncedWithinHours}h)`
              );
              progress.skipped++;
              continue;
            }
          }

          const ingredientsRaw = extractIngredients(product.body_html || "");
          const descriptionRaw = cleanDescription(product.body_html || "");
          const shortDescriptionRaw = extractFirstTwoSentences(descriptionRaw);
          const allergens = extractAllergens(product.body_html || "");
          const dietaryTags = extractDietaryTags(product.tags || "");
          const priceInRon = product.variants?.[0]?.price
            ? parseFloat(product.variants[0].price)
            : 0;
          const basePrice = Math.round((priceInRon / exchangeRate) * 100) / 100;
          const imageUrl = product.images?.[0]?.src || "";

          const aiResult = await cleanAndTranslateWithAI(
            product.title,
            shortDescriptionRaw,
            descriptionRaw,
            ingredientsRaw,
            openaiApiKey,
            aiStats
          );

          cancelResponse = await handleCancellation(supabase, logId, progress, "Cancelled after AI processing");
          if (cancelResponse) return cancelResponse;

          const slugEn = generateSlug(aiResult.title.cleanedEn);
          const slugRo = generateSlug(aiResult.title.cleanedRo);

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
            image_url: imageUrl,
            allergen_info: allergens,
            dietary_tags: dietaryTags,
            is_available: product.variants?.some((v) => v.available) ?? true,
            updated_at: new Date().toISOString(),
          };

          if (existing) {
            const uniqueSlug = await getUniqueSlug(supabase, slugEn, "slug", existing.product_id);
            const uniqueSlugRo = await getUniqueSlug(supabase, slugRo, "slug_ro", existing.product_id);

            const { error: updateError } = await supabase
              .from("products")
              .update({ ...productData, slug: uniqueSlug, slug_ro: uniqueSlugRo })
              .eq("id", existing.product_id);

            if (updateError) {
              await logProductDetail(
                supabase,
                logId,
                product.id.toString(),
                product.title,
                "failed",
                undefined,
                `Update failed: ${updateError.message}`
              );
              progress.failed++;
              continue;
            }

            if (product.variants && product.variants.length > 1) {
              await supabase
                .from("product_sizes")
                .delete()
                .eq("product_id", existing.product_id);

              const sizes = await Promise.all(
                product.variants.map(async (variant, index) => {
                  const variantPriceRon = parseFloat(variant.price);
                  const variantPriceEur = Math.round((variantPriceRon / exchangeRate) * 100) / 100;
                  const sizeNameEn = await translateToEnglish(variant.title, openaiApiKey, aiStats);
                  return {
                    product_id: existing.product_id,
                    size_name_en: sizeNameEn,
                    size_name_ro: variant.title,
                    price_modifier: variantPriceEur - basePrice,
                    is_available: variant.available,
                    display_order: index,
                  };
                })
              );

              await supabase.from("product_sizes").insert(sizes);
            }

            await matchAllergens(supabase, existing.product_id, allergens, allergenRecords);

            await supabase
              .from("synced_products")
              .update({
                source_data: product,
                last_synced_at: new Date().toISOString(),
              })
              .eq("id", existing.id);

            await logProductDetail(
              supabase,
              logId,
              product.id.toString(),
              product.title,
              "updated"
            );
            progress.updated++;
          } else {
            const uniqueSlug = await getUniqueSlug(supabase, slugEn, "slug");
            const uniqueSlugRo = await getUniqueSlug(supabase, slugRo, "slug_ro");

            const { data: newProduct, error: insertError } = await supabase
              .from("products")
              .insert({ ...productData, slug: uniqueSlug, slug_ro: uniqueSlugRo })
              .select("id")
              .single();

            if (insertError) {
              console.error(
                `Failed to insert product ${product.title}:`,
                insertError
              );
              await logProductDetail(
                supabase,
                logId,
                product.id.toString(),
                product.title,
                "failed",
                undefined,
                `Insert failed: ${insertError.message}`
              );
              progress.failed++;
              continue;
            }

            await supabase.from("synced_products").insert({
              product_id: newProduct.id,
              source_id: product.id.toString(),
              source_name: "foodnation",
              source_data: product,
            });

            if (product.variants && product.variants.length > 1) {
              const sizes = await Promise.all(
                product.variants.map(async (variant, index) => {
                  const variantPriceRon = parseFloat(variant.price);
                  const variantPriceEur = Math.round((variantPriceRon / exchangeRate) * 100) / 100;
                  const sizeNameEn = await translateToEnglish(variant.title, openaiApiKey, aiStats);
                  return {
                    product_id: newProduct.id,
                    size_name_en: sizeNameEn,
                    size_name_ro: variant.title,
                    price_modifier: variantPriceEur - basePrice,
                    is_available: variant.available,
                    display_order: index,
                  };
                })
              );

              await supabase.from("product_sizes").insert(sizes);
            }

            await matchAllergens(supabase, newProduct.id, allergens, allergenRecords);

            await logProductDetail(
              supabase,
              logId,
              product.id.toString(),
              product.title,
              "created"
            );
            progress.created++;
          }
        }
      }

      await supabase
        .from("sync_logs")
        .update({
          status: "completed",
          products_synced: progress.created + progress.updated,
          products_skipped: progress.skipped,
          products_failed: progress.failed,
          products_created: progress.created,
          products_updated: progress.updated,
          current_phase: "Sync completed successfully",
          completed_at: new Date().toISOString(),
        })
        .eq("id", logId);

      await supabase
        .from("sync_configurations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", config.id);

      const aiTotalCalls = aiStats.cleaningAttempts + aiStats.translationAttempts;
      const aiTotalSuccesses = aiStats.cleaningSuccesses + aiStats.translationSuccesses;

      return new Response(
        JSON.stringify({
          success: true,
          products_created: progress.created,
          products_updated: progress.updated,
          products_skipped: progress.skipped,
          products_failed: progress.failed,
          categories_processed: Object.keys(productsByCategory).length,
          ai_stats: {
            total_calls: aiTotalCalls,
            total_successes: aiTotalSuccesses,
            total_failures: aiStats.cleaningFailures + aiStats.translationFailures,
            success_rate: aiTotalCalls > 0 ? Math.round((aiTotalSuccesses / aiTotalCalls) * 100) : 100,
            cleaning: {
              attempts: aiStats.cleaningAttempts,
              successes: aiStats.cleaningSuccesses,
              failures: aiStats.cleaningFailures,
            },
            translation: {
              attempts: aiStats.translationAttempts,
              successes: aiStats.translationSuccesses,
              failures: aiStats.translationFailures,
            },
            errors: aiStats.errors,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (innerError) {
      console.error("Sync processing error:", innerError);

      await supabase
        .from("sync_logs")
        .update({
          status: "failed",
          error_message: innerError instanceof Error ? innerError.message : "Unknown error",
          current_phase: "Sync failed",
          products_synced: progress.created + progress.updated,
          products_skipped: progress.skipped,
          products_failed: progress.failed,
          products_created: progress.created,
          products_updated: progress.updated,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logId);

      return new Response(
        JSON.stringify({
          error: "Sync failed",
          details: innerError instanceof Error ? innerError.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Sync error:", error);

    return new Response(
      JSON.stringify({
        error: "Sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
