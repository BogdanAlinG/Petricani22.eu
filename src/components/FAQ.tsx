import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFAQs, usePageSection } from '../hooks/useCMS';

const FAQ: React.FC = () => {
  const { language } = useLanguage();
  const { faqs, loading: faqsLoading } = useFAQs();
  const { section, loading: sectionLoading } = usePageSection('home', 'faq');
  const [openId, setOpenId] = useState<string | null>(null);

  const defaultTitle = language === 'RO' ? 'Intrebari Frecvente' : 'Frequently Asked Questions';
  const defaultSubtitle =
    language === 'RO'
      ? 'Tot ce trebuie sa stii despre Petricani 22'
      : 'Everything you need to know about Petricani 22';

  const title = section
    ? (language === 'RO' ? section.title_ro : section.title_en) || defaultTitle
    : defaultTitle;
  const subtitle = section
    ? (language === 'RO' ? section.subtitle_ro : section.subtitle_en) || defaultSubtitle
    : defaultSubtitle;

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  if (sectionLoading || faqsLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </section>
    );
  }

  if (!faqs.length) return null;

  const categories = Array.from(new Set(faqs.map((f) => f.category)));

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-10">
          {categories.map((cat) => (
            <div key={cat}>
              {categories.length > 1 && (
                <h3 className="text-lg font-semibold text-primary uppercase tracking-wide mb-4">
                  {cat}
                </h3>
              )}
              <div className="space-y-3">
                {faqs
                  .filter((f) => f.category === cat)
                  .map((faq) => {
                    const isOpen = openId === faq.id;
                    const question = language === 'RO' ? faq.question_ro : faq.question_en;
                    const answer = language === 'RO' ? faq.answer_ro : faq.answer_en;
                    return (
                      <div
                        key={faq.id}
                        className="border border-gray-200 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggle(faq.id)}
                          className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white hover:bg-gray-50 transition-colors"
                          aria-expanded={isOpen}
                        >
                          <span className="font-medium text-gray-900">{question}</span>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-5 text-gray-600 leading-relaxed bg-gray-50 border-t border-gray-100">
                            <div className="pt-4">{answer}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
