/*
  # Add CMS settings for the Contact section

  Adds site_settings entries for:
  - Contact form UI labels (form field labels, headings, button text)
  - Rental period options (both languages)
  - Configuration options (both languages)

  Also updates the contact page_section settings with contact info labels.
  All values are editable via Admin > Site Settings.
*/

INSERT INTO site_settings (key, value_en, value_ro, type, "group", description)
VALUES
  ('contact_form_title', 'Contact Us', 'Contactați-ne', 'text', 'contact', 'Heading of the contact section'),
  ('contact_form_subtitle', 'We are here to help you find the perfect configuration', 'Suntem aici pentru a vă ajuta să găsiți configurația perfectă', 'text', 'contact', 'Subtitle of the contact section'),
  ('contact_info_title', 'Contact Information', 'Informații Contact', 'text', 'contact', 'Heading for the contact details block'),
  ('contact_quick_actions_title', 'Quick Actions', 'Acțiuni Rapide', 'text', 'contact', 'Heading for the quick actions block'),
  ('contact_btn_brochure', 'Download Brochure', 'Descarcă Broșură', 'text', 'contact', 'Label for the download brochure button'),
  ('contact_btn_virtual_tour', 'Schedule Virtual Tour', 'Programează Vizită Virtuală', 'text', 'contact', 'Label for the virtual tour button'),
  ('contact_form_label_name', 'Full name', 'Nume complet', 'text', 'contact', 'Label for the name field'),
  ('contact_form_label_email', 'Email address', 'Adresa de email', 'text', 'contact', 'Label for the email field'),
  ('contact_form_label_phone', 'Phone', 'Telefon', 'text', 'contact', 'Label for the phone field'),
  ('contact_form_label_period', 'Rental period', 'Perioada închirierii', 'text', 'contact', 'Label for the rental period dropdown'),
  ('contact_form_label_config', 'Preferred configuration', 'Configurația preferată', 'text', 'contact', 'Label for the configuration dropdown'),
  ('contact_form_label_message', 'Message', 'Mesaj', 'text', 'contact', 'Label for the message textarea'),
  ('contact_form_gdpr', 'I accept the terms and conditions regarding personal data protection (GDPR)', 'Accept termenii și condițiile privind protecția datelor personale (GDPR)', 'text', 'contact', 'Text for the GDPR consent checkbox'),
  ('contact_form_submit', 'Send Message', 'Trimite Mesaj', 'text', 'contact', 'Label for the submit button'),
  ('contact_configurations', 'Complete property|Floor-by-floor|Individual rooms|Outdoor space|Custom configuration', 'Proprietate completă|Etaj cu etaj|Camere individuale|Spațiu exterior|Configurație personalizată', 'text', 'contact', 'Pipe-separated list of configuration options'),
  ('contact_periods', 'A few days|One week|1-3 months|3-6 months|6-12 months|Over 1 year', 'Câteva zile|O săptămână|1-3 luni|3-6 luni|6-12 luni|Peste 1 an', 'text', 'contact', 'Pipe-separated list of rental period options')
ON CONFLICT (key) DO NOTHING;

UPDATE page_sections
SET settings = jsonb_build_object(
  'phone_label_en', 'Phone',
  'phone_label_ro', 'Telefon',
  'address_label_en', 'Address',
  'address_label_ro', 'Adresă',
  'hours_label_en', 'Hours',
  'hours_label_ro', 'Program'
)
WHERE page = 'home' AND section = 'contact';
