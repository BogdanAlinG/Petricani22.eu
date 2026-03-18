import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateRequest {
  type: 
    | "faq"
    | "faq_answer"
    | "article_title"
    | "article_excerpt"
    | "article_content"
    | "article_slug"
    | "article_tags"
    | "translate_slug"
    | "article_refine"
    | "section_title"
    | "section_subtitle"
    | "block_title"
    | "block_description"
    | "translate"
    | "product_short_description"
    | "product_full_description";
  language: "en" | "ro";
  context?: string;
  existingContent?: string;
  category?: string;
  keywords?: string;
  direction?: string;
}

const BASE_SYSTEM_PROMPT = `You are a content writer for "Petricani 22", a premium property rental in Bucharest, Romania.
The property is a versatile space that can be used for modern living, events, offices, and commercial purposes.
It features a large indoor area, outdoor courtyard/garden, and premium amenities.
Write concise, professional, engaging content. Be specific to this property.`;

const PROMPTS: Record<string, (req: GenerateRequest) => string> = {
  faq: (req) => `Generate a frequently asked question about ${req.category || "the property"} for Petricani 22 in ${req.language === "ro" ? "Romanian" : "English"}.
Return ONLY the question text, no punctuation marks at the end besides "?".${req.context ? ` Context: ${req.context}` : ""}`,

  faq_answer: (req) => `Write a helpful, detailed answer for this FAQ question about Petricani 22 in ${req.language === "ro" ? "Romanian" : "English"}:
"${req.context}"
Return the answer as plain text, 2-4 sentences. Be specific and informative.`,

  article_title: (req) => `Write a compelling blog article title for Petricani 22 property in ${req.language === "ro" ? "Romanian" : "English"}.
Category: ${req.category || "general"}${req.keywords ? `\nFocus Keywords: ${req.keywords}` : ""}${req.direction ? `\nDirection/Tone: ${req.direction}` : ""}${req.context ? `\nContext/topic: ${req.context}` : ""}
Return ONLY the title text, no quotes.`,

  article_excerpt: (req) => `Write a 1-2 sentence excerpt/summary for a blog article about Petricani 22 in ${req.language === "ro" ? "Romanian" : "English"}.
${req.direction ? `Direction/Intent: ${req.direction}` : ""}${req.context ? `\nArticle title or topic: ${req.context}` : ""}
Return ONLY the excerpt text.`,

  article_content: (req) => `Write a complete blog article for Petricani 22 property in ${req.language === "ro" ? "Romanian" : "English"}.
${req.context ? `Title/topic: ${req.context}` : ""}
Category: ${req.category || "general"}${req.keywords ? `\nTarget SEO/Adwords Keywords: ${req.keywords}` : ""}${req.direction ? `\nSpecific Direction/Context: ${req.direction}` : ""}
Format the response as HTML with <h2>, <p>, <ul>/<li> tags. Include 3-4 sections. Around 400-600 words.
IMPORTANT: Return ONLY raw HTML tags and text. Do NOT wrap in markdown code fences or backticks.`,

  article_slug: (req) => `Generate a URL-friendly slug (URL ID) for a blog article about Petricani 22 in ${req.language === "ro" ? "Romanian" : "English"}.
${req.context ? `Title: ${req.context}` : ""}${req.keywords ? `\nSEO/Adwords Keywords: ${req.keywords}` : ""}${req.direction ? `\nDirection/Context: ${req.direction}` : ""}
The slug should be lowercase, using only letters, numbers, and hyphens. Max 50 characters.
Return ONLY the slug text, nothing else.`,

  article_tags: (req) => `Generate 3-5 relevant SEO tags/keywords for a blog article about Petricani 22.
${req.context ? `Title/Topic: ${req.context}` : ""}${req.keywords ? `\nPromotion Keywords: ${req.keywords}` : ""}${req.direction ? `\nDirection/Intent: ${req.direction}` : ""}
Return ONLY the tags separated by commas. Max 3 words per tag.`,

  article_refine: (req) => `Refine and rewrite parts of the following blog article for Petricani 22 based on these instructions:
"${req.context}"

Existing Content (HTML):
${req.existingContent}

Instructions:
1. Apply the user's requested changes while preserving the rest of the original meaning and context.
2. Maintain the HTML structure (<h2>, <p>, <ul>, etc.).
3. If the user asks for a specific tone or addition, ensure it blends naturally with the existing text.
4. IMPORTANT: Return ONLY the updated raw HTML. Do NOT wrap in markdown code fences or backticks.`,

  translate_slug: (req) => `Translate the following URL slug to ${req.language === "ro" ? "Romanian" : "English"}.
The slug is for a blog article about Petricani 22 (a rental property/event space).
Make the translation SEO-friendly, use only lowercase letters, numbers, and hyphens. No special characters or spaces.

Original Slug: ${req.context}

Return ONLY the translated slug string.`,

  section_title: (req) => `Write a short, impactful section title for the "${req.context || "section"}" of the Petricani 22 website in ${req.language === "ro" ? "Romanian" : "English"}.
Return ONLY the title text, max 8 words.`,

  section_subtitle: (req) => `Write a descriptive subtitle for the "${req.context || "section"}" of the Petricani 22 website in ${req.language === "ro" ? "Romanian" : "English"}.
${req.existingContent ? `Section title: ${req.existingContent}` : ""}
Return ONLY the subtitle text, 1-2 sentences.`,

  block_title: (req) => `Write a short title for a content block about "${req.context || "feature"}" on the Petricani 22 website in ${req.language === "ro" ? "Romanian" : "English"}.
Return ONLY the title, 2-5 words.`,

  block_description: (req) => `Write a brief description for a content block about "${req.context || "feature"}" on the Petricani 22 website in ${req.language === "ro" ? "Romanian" : "English"}.
${req.existingContent ? `Block title: ${req.existingContent}` : ""}
Return ONLY the description, 1-2 sentences.`,

  translate: (req) => {
    const targetLang = req.language === "ro" ? "Romanian" : "English";
    const sourceLang = req.language === "ro" ? "English" : "Romanian";
    const isHtml = req.existingContent && /<[a-z][\s\S]*>/i.test(req.existingContent);
    return `Translate the following ${sourceLang} text to ${targetLang}. Preserve the meaning and tone.${isHtml ? " The text contains HTML tags — preserve all HTML tags exactly, only translate the text content inside them. Do NOT wrap the output in markdown code fences." : " Return ONLY the translated text."}

Text to translate:
${req.existingContent || req.context || ""}`;
  },

  product_short_description: (req) => `Write a short 1-sentence menu description for a product called "${req.context || "menu item"}" at Petricani 22 in ${req.language === "ro" ? "Romanian" : "English"}.
${req.category ? `Category: ${req.category}` : ""}
Return ONLY the description text. Keep it appetising and concise.`,

  product_full_description: (req) => `Write a full 2-3 sentence menu description for a product called "${req.context || "menu item"}" at Petricani 22 in ${req.language === "ro" ? "Romanian" : "English"}.
${req.category ? `Category: ${req.category}` : ""}
Return ONLY the description text. Be descriptive, highlight flavours or key qualities.`,
};

async function fetchAiPointers(language: "en" | "ro"): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) return "";

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase
      .from("site_settings")
      .select("value_en, value_ro")
      .eq("key", "ai_pointers")
      .maybeSingle();

    if (!data) return "";
    const pointers = language === "ro" ? data.value_ro : data.value_en;
    return pointers?.trim() || "";
  } catch {
    return "";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: GenerateRequest = await req.json();
    const { type, language, context, existingContent, category } = body;

    const promptFn = PROMPTS[type];
    if (!promptFn) {
      return new Response(
        JSON.stringify({ error: `Unknown generation type: ${type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiPointers = await fetchAiPointers(language);
    const systemPrompt = aiPointers
      ? `${BASE_SYSTEM_PROMPT}\n\nIMPORTANT FACTS — always follow these:\n${aiPointers}`
      : BASE_SYSTEM_PROMPT;

    const userPrompt = promptFn({ ...body });
    
    console.log(`Generating AI content for type: ${type}, language: ${language}`);
    console.log(`Prompt length: ${userPrompt.length} chars`);

    const startTime = Date.now();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        max_tokens: 2048,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const endTime = Date.now();
    console.log(`OpenAI API responded in ${endTime - startTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generated = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ result: generated.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-generate error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
