import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';

export default function NotFoundPage() {
  const { language } = useLanguage();
  const { homePath, menuPath, accommodationsPath } = useLocalizedPath();

  const content = {
    RO: {
      title: '404',
      heading: 'Pagina nu a fost gasita',
      description: 'Ne pare rau, pagina pe care o cautati nu exista sau a fost mutata.',
      backHome: 'Inapoi Acasa',
      browseMenu: 'Vezi Meniul',
      browseAccommodations: 'Vezi Unitățile',
    },
    EN: {
      title: '404',
      heading: 'Page Not Found',
      description: "Sorry, the page you're looking for doesn't exist or has been moved.",
      backHome: 'Back to Home',
      browseMenu: 'Browse Menu',
      browseAccommodations: 'Browse Rentals',
    },
  };

  const t = content[language];

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <p className="text-8xl font-bold text-primary/20 mb-2">{t.title}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t.heading}</h1>
        <p className="text-lg text-gray-600 mb-10">{t.description}</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={homePath}
            className="btn btn-primary btn-md gap-2 w-full sm:w-auto"
          >
            <Home className="w-4 h-4" />
            {t.backHome}
          </Link>
          <Link
            to={menuPath}
            className="btn btn-outline btn-md gap-2 w-full sm:w-auto"
          >
            <Search className="w-4 h-4" />
            {t.browseMenu}
          </Link>
          <Link
            to={accommodationsPath}
            className="btn btn-ghost btn-md gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.browseAccommodations}
          </Link>
        </div>
      </div>
    </div>
  );
}
