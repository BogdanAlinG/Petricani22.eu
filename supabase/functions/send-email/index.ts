import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface EmailRequest {
  name: string;
  email: string;
  phone: string;
  rentalPeriod: string;
  configuration: string;
  message: string;
  language: 'RO' | 'EN';
  currency?: 'EUR' | 'RON';
  exchangeRate?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { name, email, phone, rentalPeriod, configuration, message, language, currency, exchangeRate }: EmailRequest = await req.json()

    // Validate required fields
    if (!name || !email || !phone || !rentalPeriod || !configuration) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Store the submission in the database
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        phone,
        rental_period: rentalPeriod,
        configuration,
        message: message || '',
        language,
        currency: currency || 'EUR',
        exchange_rate_used: exchangeRate
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to store submission' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Email content based on language
    const emailContent = {
      RO: {
        subject: `Cerere închiriere Petricani 22 - ${name}`,
        body: `
          <h2>Cerere nouă de închiriere</h2>
          <p><strong>Nume:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefon:</strong> ${phone}</p>
          <p><strong>Perioada închirierii:</strong> ${rentalPeriod}</p>
          <p><strong>Configurația preferată:</strong> ${configuration}</p>
          <p><strong>Mesaj:</strong></p>
          <p>${message || 'Nu a fost furnizat mesaj.'}</p>
          
          <hr>
          <p><em>Acest email a fost trimis prin formularul de contact de pe site-ul Petricani 22.</em></p>
        `
      },
      EN: {
        subject: `Rental Inquiry Petricani 22 - ${name}`,
        body: `
          <h2>New Rental Inquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Rental Period:</strong> ${rentalPeriod}</p>
          <p><strong>Preferred Configuration:</strong> ${configuration}</p>
          <p><strong>Message:</strong></p>
          <p>${message || 'No message provided.'}</p>
          
          <hr>
          <p><em>This email was sent through the contact form on the Petricani 22 website.</em></p>
        `
      }
    }

    // Get email service configuration from environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const TO_EMAIL = Deno.env.get('TO_EMAIL') || 'contact@petricani22.eu'
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@petricani22.eu'

    // If email service is configured, send emails
    if (RESEND_API_KEY) {
      try {
        // Send email using Resend API
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [TO_EMAIL],
            reply_to: email,
            subject: emailContent[language].subject,
            html: emailContent[language].body,
          }),
        })

        if (emailResponse.ok) {
          // Send confirmation email to the user
          const confirmationContent = {
            RO: {
              subject: 'Confirmarea cererii dumneavoastră - Petricani 22',
              body: `
                <h2>Mulțumim pentru interesul dumneavoastră!</h2>
                <p>Dragă ${name},</p>
                <p>Am primit cererea dumneavoastră de închiriere pentru Petricani 22. Vă vom contacta în cel mai scurt timp pentru a discuta detaliile.</p>
                
                <h3>Detaliile cererii:</h3>
                <p><strong>Perioada închirierii:</strong> ${rentalPeriod}</p>
                <p><strong>Configurația preferată:</strong> ${configuration}</p>
                
                <p>Pentru întrebări urgente, ne puteți contacta la:</p>
                <p><strong>Telefon:</strong> +40 743 333 090</p>
                <p><strong>Email:</strong> contact@petricani22.eu</p>
                
                <p>Cu stimă,<br>Echipa Petricani 22</p>
              `
            },
            EN: {
              subject: 'Your inquiry confirmation - Petricani 22',
              body: `
                <h2>Thank you for your interest!</h2>
                <p>Dear ${name},</p>
                <p>We have received your rental inquiry for Petricani 22. We will contact you shortly to discuss the details.</p>
                
                <h3>Inquiry Details:</h3>
                <p><strong>Rental Period:</strong> ${rentalPeriod}</p>
                <p><strong>Preferred Configuration:</strong> ${configuration}</p>
                
                <p>For urgent questions, you can contact us at:</p>
                <p><strong>Phone:</strong> +40 743 333 090</p>
                <p><strong>Email:</strong> contact@petricani22.eu</p>
                
                <p>Best regards,<br>Petricani 22 Team</p>
              `
            }
          }

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: [email],
              subject: confirmationContent[language].subject,
              html: confirmationContent[language].body,
            }),
          })
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        // Don't fail the request if email fails, submission is still stored
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: language === 'RO' ? 'Mesajul a fost trimis cu succes!' : 'Message sent successfully!' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})