import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FALLBACK_RATE = 4.95; // Emergency fallback EUR to RON rate

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for cached rate first
    const { data: cachedRate } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', 'EUR')
      .eq('target_currency', 'RON')
      .eq('is_active', true)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If we have a recent cached rate (less than 1 hour old), return it
    if (cachedRate) {
      const fetchedAt = new Date(cachedRate.fetched_at).getTime();
      const now = Date.now();
      const age = now - fetchedAt;

      if (age < CACHE_TTL_MS) {
        return new Response(
          JSON.stringify({
            rate: parseFloat(cachedRate.rate),
            source: cachedRate.source,
            fetched_at: cachedRate.fetched_at,
            cached: true,
            age_minutes: Math.floor(age / 60000),
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Try to fetch from Stripe API
    const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (stripeApiKey) {
      try {
        const stripeResponse = await fetch('https://api.stripe.com/v1/exchange_rates/eur', {
          headers: {
            'Authorization': `Bearer ${stripeApiKey}`,
          },
        });

        if (stripeResponse.ok) {
          const stripeData = await stripeResponse.json();
          const ronRate = stripeData.rates?.ron;

          if (ronRate) {
            // Deactivate old rates
            await supabase
              .from('exchange_rates')
              .update({ is_active: false })
              .eq('base_currency', 'EUR')
              .eq('target_currency', 'RON')
              .eq('is_active', true);

            // Insert new rate
            const { data: newRate } = await supabase
              .from('exchange_rates')
              .insert({
                base_currency: 'EUR',
                target_currency: 'RON',
                rate: ronRate,
                source: 'stripe',
                fetched_at: new Date().toISOString(),
                is_active: true,
              })
              .select()
              .single();

            return new Response(
              JSON.stringify({
                rate: parseFloat(ronRate),
                source: 'stripe',
                fetched_at: new Date().toISOString(),
                cached: false,
              }),
              {
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                },
              }
            );
          }
        }
      } catch (stripeError) {
        console.error('Stripe API error:', stripeError);
      }
    }

    // If Stripe fails, try to use last known rate (even if older than TTL)
    if (cachedRate) {
      return new Response(
        JSON.stringify({
          rate: parseFloat(cachedRate.rate),
          source: cachedRate.source,
          fetched_at: cachedRate.fetched_at,
          cached: true,
          warning: 'Using older cached rate due to Stripe API unavailability',
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Last resort: use fallback rate and store it
    await supabase
      .from('exchange_rates')
      .update({ is_active: false })
      .eq('base_currency', 'EUR')
      .eq('target_currency', 'RON')
      .eq('is_active', true);

    await supabase
      .from('exchange_rates')
      .insert({
        base_currency: 'EUR',
        target_currency: 'RON',
        rate: FALLBACK_RATE,
        source: 'fallback',
        fetched_at: new Date().toISOString(),
        is_active: true,
      });

    return new Response(
      JSON.stringify({
        rate: FALLBACK_RATE,
        source: 'fallback',
        fetched_at: new Date().toISOString(),
        cached: false,
        warning: 'Using fallback rate - please configure Stripe API',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch exchange rate',
        rate: FALLBACK_RATE,
        source: 'fallback',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
