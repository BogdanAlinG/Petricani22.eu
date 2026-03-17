import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import { useNavigation, useSocialLinks, useSiteSettings } from '../hooks/useCMS';

const SOCIAL_ICON_MAP: Record<string, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
};

const Footer: React.FC = () => {
  const { language } = useLanguage();
  const { homePath } = useLocalizedPath();
  const navigate = useNavigate();
  const location = useLocation();

  const { menu: footerMenu } = useNavigation('footer');
  const { menu: legalMenu } = useNavigation('footer_legal');
  const { links: socialLinks } = useSocialLinks();
  const { getSetting } = useSiteSettings();

  const labels = {
    RO: {
      quickLinks: 'Navigare Rapida',
      contact: 'Contact',
      legal: 'Legal',
      follow: 'Urmareste-ne',
      tagline: 'Inchiriere proprietate premium in inima Bucurestiului',
      copyright: '© 2025 Petricani 22. Toate drepturile rezervate.',
    },
    EN: {
      quickLinks: 'Quick Links',
      contact: 'Contact',
      legal: 'Legal',
      follow: 'Follow us',
      tagline: 'Premium property rental in the heart of Bucharest',
      copyright: '© 2025 Petricani 22. All rights reserved.',
    },
  };

  const t = labels[language];

  const phone = getSetting('contact_phone', language) || '+40 743 333 090';
  const email = getSetting('contact_email', language) || 'contact@petricani22.eu';
  const address = getSetting('contact_address', language) || (language === 'RO' ? 'Petricani 22, Bucuresti, Romania' : 'Petricani 22, Bucharest, Romania');
  const tagline = getSetting('footer_tagline', language) || t.tagline;
  const copyright = getSetting('footer_copyright', language) || t.copyright;
  const quickLinksTitle = getSetting('footer_quick_links_title', language) || t.quickLinks;
  const followLabel = getSetting('footer_follow_label', language) || t.follow;

  const isHomePage =
    location.pathname === '/ro' ||
    location.pathname === '/en' ||
    location.pathname === '/ro/' ||
    location.pathname === '/en/';

  const handleNavLink = (href: string) => {
    if (href.startsWith('#')) {
      if (!isHomePage) {
        navigate(`${homePath}${href}`);
      } else {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(href);
    }
  };

  const defaultQuickLinks = [
    { label: language === 'RO' ? 'Proprietatea' : 'Property', href: '#property' },
    { label: language === 'RO' ? 'Galerie' : 'Gallery', href: '#gallery' },
    { label: language === 'RO' ? 'Facilitati' : 'Amenities', href: '#amenities' },
    { label: language === 'RO' ? 'Preturi' : 'Pricing', href: '#pricing' },
    { label: language === 'RO' ? 'Locatie' : 'Location', href: '#location' },
    { label: 'Contact', href: '#contact' },
  ];

  const defaultLegalLinks = [
    { label: language === 'RO' ? 'Politica de confidentialitate' : 'Privacy Policy', href: '#privacy' },
    { label: language === 'RO' ? 'Termeni si conditii' : 'Terms & Conditions', href: '#terms' },
    { label: 'GDPR', href: '#gdpr' },
    { label: 'Cookie Policy', href: '#cookies' },
  ];

  const quickLinks =
    footerMenu.length > 0
      ? footerMenu.map((item) => ({
          label: language === 'RO' ? item.label_ro : item.label_en,
          href: item.url,
        }))
      : defaultQuickLinks;

  const legalLinks =
    legalMenu.length > 0
      ? legalMenu.map((item) => ({
          label: language === 'RO' ? item.label_ro : item.label_en,
          href: item.url,
        }))
      : defaultLegalLinks;

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-primary">Petricani 22</h3>
            </div>
            <p className="text-gray-400 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
              {tagline}
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              <span>SSL Secured &amp; GDPR Compliant</span>
            </div>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">{quickLinksTitle}</h4>
            <ul className="space-y-1 sm:space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleNavLink(link.href)}
                    className="text-gray-400 hover:text-white active:text-primary transition-colors py-2 min-h-[44px] text-left text-sm sm:text-base"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">{t.contact}</h4>
            <div className="space-y-3 sm:space-y-4">
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="flex items-start space-x-3 py-2 -my-2 hover:text-primary transition-colors"
              >
                <Phone className="w-5 h-5 text-primary mt-0.5 min-w-[20px]" />
                <p className="text-gray-400 text-sm sm:text-base">{phone}</p>
              </a>
              <a
                href={`mailto:${email}`}
                className="flex items-start space-x-3 py-2 -my-2 hover:text-primary transition-colors"
              >
                <Mail className="w-5 h-5 text-primary mt-0.5 min-w-[20px]" />
                <p className="text-gray-400 break-all text-sm sm:text-base">{email}</p>
              </a>
              <div className="flex items-start space-x-3 py-2 -my-2">
                <MapPin className="w-5 h-5 text-primary mt-0.5 min-w-[20px]" />
                <p className="text-gray-400 text-sm sm:text-base">{address}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">{t.legal}</h4>
            <ul className="space-y-1 sm:space-y-3 mb-6 sm:mb-8">
              {legalLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white active:text-primary transition-colors inline-block py-2 min-h-[44px] text-sm sm:text-base"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div>
              <h5 className="text-sm font-semibold mb-4">{followLabel}</h5>
              <div className="flex space-x-3 sm:space-x-4">
                {socialLinks.length > 0
                  ? socialLinks.map((sl) => {
                      const Icon = SOCIAL_ICON_MAP[sl.platform.toLowerCase()] || Facebook;
                      return (
                        <a
                          key={sl.id}
                          href={sl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-11 h-11 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary active:bg-primary/80 transition-colors"
                          aria-label={sl.platform}
                        >
                          <Icon className="w-5 h-5" />
                        </a>
                      );
                    })
                  : (
                    <>
                      <a href="#" className="w-11 h-11 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary active:bg-primary/80 transition-colors" aria-label="Facebook">
                        <Facebook className="w-5 h-5" />
                      </a>
                      <a href="#" className="w-11 h-11 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary active:bg-primary/80 transition-colors" aria-label="Instagram">
                        <Instagram className="w-5 h-5" />
                      </a>
                      <a href="#" className="w-11 h-11 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary active:bg-primary/80 transition-colors" aria-label="Twitter">
                        <Twitter className="w-5 h-5" />
                      </a>
                    </>
                  )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 md:mt-12 pt-6 md:pt-8 text-center">
          <p className="text-gray-400 text-xs sm:text-sm">{copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
