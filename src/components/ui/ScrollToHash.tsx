import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToHash: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      
      if (element) {
        // Use a small timeout to ensure everything is rendered and transitions are done
        const timeoutId = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 800);
        return () => clearTimeout(timeoutId);
      } else {
        // Element not found yet, try again slightly later (e.g., for slow-loading dynamic content)
        const observer = new MutationObserver((_, obs) => {
          const el = document.getElementById(id);
          if (el) {
            setTimeout(() => {
              el.scrollIntoView({ behavior: 'smooth' });
            }, 800);
            obs.disconnect();
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        // Safety timeout to disconnect observer if element never appears
        const safetyTimeoutId = setTimeout(() => {
          observer.disconnect();
        }, 2000);

        return () => {
          observer.disconnect();
          clearTimeout(safetyTimeoutId);
        };
      }
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToHash;
