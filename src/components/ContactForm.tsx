import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Mail, MapPin, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuote } from '../contexts/QuoteContext';
import { useSiteSettings, usePageSection } from '../hooks/useCMS';

const ContactForm: React.FC = () => {
  const { language } = useLanguage();
  const { currency, exchangeRate } = useCurrency();
  const { quoteRequest, setQuoteRequest } = useQuote();
  const { getSetting } = useSiteSettings();
  const { section } = usePageSection('home', 'contact');
  const formRef = useRef<HTMLFormElement>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rentalPeriod: '',
    configuration: '',
    message: '',
    gdprConsent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (quoteRequest) {
      setFormData(prev => ({
        ...prev,
        configuration: quoteRequest.configuration,
        rentalPeriod: quoteRequest.rentalPeriod
      }));
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 1500);
      setQuoteRequest(null);
    }
  }, [quoteRequest, setQuoteRequest]);

  const lang = language === 'RO' ? 'RO' : 'EN';
  const sectionSettings = section?.settings as Record<string, string> | undefined;

  const title = getSetting('contact_form_title', lang) || (lang === 'RO' ? 'Contactați-ne' : 'Contact Us');
  const subtitle = getSetting('contact_form_subtitle', lang) || (lang === 'RO' ? 'Suntem aici pentru a vă ajuta să găsiți configurația perfectă' : 'We are here to help you find the perfect configuration');
  const infoTitle = getSetting('contact_info_title', lang) || (lang === 'RO' ? 'Informații Contact' : 'Contact Information');
  const quickActionsTitle = getSetting('contact_quick_actions_title', lang) || (lang === 'RO' ? 'Acțiuni Rapide' : 'Quick Actions');
  const btnBrochure = getSetting('contact_btn_brochure', lang) || (lang === 'RO' ? 'Descarcă Broșură' : 'Download Brochure');
  const btnVirtualTour = getSetting('contact_btn_virtual_tour', lang) || (lang === 'RO' ? 'Programează Vizită Virtuală' : 'Schedule Virtual Tour');

  const labelName = getSetting('contact_form_label_name', lang) || (lang === 'RO' ? 'Nume complet' : 'Full name');
  const labelEmail = getSetting('contact_form_label_email', lang) || (lang === 'RO' ? 'Adresa de email' : 'Email address');
  const labelPhone = getSetting('contact_form_label_phone', lang) || (lang === 'RO' ? 'Telefon' : 'Phone');
  const labelPeriod = getSetting('contact_form_label_period', lang) || (lang === 'RO' ? 'Perioada închirierii' : 'Rental period');
  const labelConfig = getSetting('contact_form_label_config', lang) || (lang === 'RO' ? 'Configurația preferată' : 'Preferred configuration');
  const labelMessage = getSetting('contact_form_label_message', lang) || (lang === 'RO' ? 'Mesaj' : 'Message');
  const gdprText = getSetting('contact_form_gdpr', lang) || (lang === 'RO' ? 'Accept termenii și condițiile privind protecția datelor personale (GDPR)' : 'I accept the terms and conditions regarding personal data protection (GDPR)');
  const submitLabel = getSetting('contact_form_submit', lang) || (lang === 'RO' ? 'Trimite Mesaj' : 'Send Message');

  const phone = getSetting('contact_phone', lang) || '+40 743 333 090';
  const email = getSetting('contact_email', lang) || 'contact@petricani22.eu';
  const address = getSetting('contact_address', lang) || (lang === 'RO' ? 'Petricani 22, București, România' : 'Petricani 22, Bucharest, Romania');
  const hours = getSetting('contact_hours', lang) || (lang === 'RO' ? 'Luni - Vineri: 9:00 - 18:00' : 'Monday - Friday: 9:00 - 18:00');

  const phoneLabel = sectionSettings?.[lang === 'RO' ? 'phone_label_ro' : 'phone_label_en'] || (lang === 'RO' ? 'Telefon' : 'Phone');
  const addressLabel = sectionSettings?.[lang === 'RO' ? 'address_label_ro' : 'address_label_en'] || (lang === 'RO' ? 'Adresă' : 'Address');
  const hoursLabel = sectionSettings?.[lang === 'RO' ? 'hours_label_ro' : 'hours_label_en'] || (lang === 'RO' ? 'Program' : 'Hours');

  const configurationsRaw = getSetting('contact_configurations', lang);
  const configurations = configurationsRaw
    ? configurationsRaw.split('|').map(s => s.trim()).filter(Boolean)
    : (lang === 'RO'
      ? ['Proprietate completă', 'Etaj cu etaj', 'Camere individuale', 'Spațiu exterior', 'Configurație personalizată']
      : ['Complete property', 'Floor-by-floor', 'Individual rooms', 'Outdoor space', 'Custom configuration']);

  const periodsRaw = getSetting('contact_periods', lang);
  const periods = periodsRaw
    ? periodsRaw.split('|').map(s => s.trim()).filter(Boolean)
    : (lang === 'RO'
      ? ['Câteva zile', 'O săptămână', '1-3 luni', '3-6 luni', '6-12 luni', 'Peste 1 an']
      : ['A few days', 'One week', '1-3 months', '3-6 months', '6-12 months', 'Over 1 year']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.gdprConsent) {
      setSubmitStatus('error');
      setStatusMessage(lang === 'RO' ? 'Trebuie să acceptați termenii și condițiile.' : 'You must accept the terms and conditions.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setStatusMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          language,
          currency,
          exchangeRate: exchangeRate || 4.95
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus('success');
        setStatusMessage(result.message);
        setFormData({ name: '', email: '', phone: '', rentalPeriod: '', configuration: '', message: '', gdprConsent: false });
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setStatusMessage(lang === 'RO' ? 'A apărut o eroare la trimiterea mesajului. Vă rugăm să încercați din nou.' : 'An error occurred while sending the message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvalid = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    if (lang === 'RO') {
      if (target.validity.valueMissing) {
        target.setCustomValidity('Acest câmp este obligatoriu.');
      } else if (target.type === 'email' && target.validity.typeMismatch) {
        target.setCustomValidity('Vă rugăm să introduceți o adresă de email validă.');
      } else if (target.type === 'email' && target.validity.valueMissing === false) {
          // If it's not missing but mismatch (missing @)
          target.setCustomValidity('Vă rugăm să includeți un "@" în adresa de email.');
      } else {
        target.setCustomValidity('');
      }
    } else {
      target.setCustomValidity('');
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    (e.target as HTMLInputElement).setCustomValidity('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <section id="contact" className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className={`bg-gray-50 rounded-2xl p-4 sm:p-6 md:p-8 transition-all duration-500 ${isHighlighted ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{labelName}</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} onInvalid={handleInvalid} onInput={handleInput} required className="w-full px-4 py-3 min-h-[48px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{labelPhone}</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} onInvalid={handleInvalid} onInput={handleInput} required className="w-full px-4 py-3 min-h-[48px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-base" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{labelEmail}</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} onInvalid={handleInvalid} onInput={handleInput} required className="w-full px-4 py-3 min-h-[48px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-base" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{labelPeriod}</label>
                  <select name="rentalPeriod" value={formData.rentalPeriod} onChange={handleChange} onInvalid={handleInvalid} onInput={handleInput} required className="w-full px-4 py-3 min-h-[48px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-base bg-white">
                    <option value="">...</option>
                    {periods.map((p, i) => <option key={i} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{labelConfig}</label>
                  <select name="configuration" value={formData.configuration} onChange={handleChange} onInvalid={handleInvalid} onInput={handleInput} required className="w-full px-4 py-3 min-h-[48px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-base bg-white">
                    <option value="">...</option>
                    {configurations.map((c, i) => <option key={i} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{labelMessage}</label>
                <textarea name="message" value={formData.message} onChange={handleChange} rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none text-base" />
              </div>

              <div className="flex items-start gap-3">
                <input type="checkbox" name="gdprConsent" checked={formData.gdprConsent} onChange={handleChange} onInvalid={handleInvalid} onInput={handleInput} required className="mt-0.5 w-6 h-6 min-w-[24px] text-primary border-gray-300 rounded focus:ring-primary cursor-pointer" />
                <label className="text-sm text-gray-700 leading-relaxed">{gdprText}</label>
              </div>

              {submitStatus !== 'idle' && (
                <div className={`flex items-center space-x-3 p-4 rounded-lg ${submitStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {submitStatus === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                  <span className="text-sm font-medium">{statusMessage}</span>
                </div>
              )}

              <button type="submit" disabled={isSubmitting || !formData.gdprConsent} className="w-full bg-primary text-white py-4 min-h-[52px] rounded-lg font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? (
                  <><Loader className="w-5 h-5 animate-spin" /><span>{lang === 'RO' ? 'Se trimite...' : 'Sending...'}</span></>
                ) : (
                  <><Send size={20} /><span>{submitLabel}</span></>
                )}
              </button>
            </form>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{infoTitle}</h3>
              <div className="space-y-4 sm:space-y-6">
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-start space-x-4 p-3 -mx-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 min-w-[48px] bg-primary/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{phoneLabel}</h4>
                    <p className="text-gray-600">{phone}</p>
                  </div>
                </a>

                <a href={`mailto:${email}`} className="flex items-start space-x-4 p-3 -mx-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 min-w-[48px] bg-primary/10 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email</h4>
                    <p className="text-gray-600 break-all">{email}</p>
                  </div>
                </a>

                <div className="flex items-start space-x-4 p-3 -mx-3">
                  <div className="w-12 h-12 min-w-[48px] bg-primary/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{addressLabel}</h4>
                    <p className="text-gray-600">{address}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-3 -mx-3">
                  <div className="w-12 h-12 min-w-[48px] bg-primary/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{hoursLabel}</h4>
                    <p className="text-gray-600">{hours}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{quickActionsTitle}</h4>
              <div className="space-y-3">
                <button className="w-full bg-white text-primary py-3 min-h-[48px] rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors border border-primary/20">
                  {btnBrochure}
                </button>
                <button className="w-full bg-white text-primary py-3 min-h-[48px] rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors border border-primary/20">
                  {btnVirtualTour}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
