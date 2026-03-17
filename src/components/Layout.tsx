import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import SEOHead from './SEOHead';
import ScrollToTop from './ScrollToTop';
import PageTransition from './PageTransition';

export default function Layout() {
  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-white overflow-x-hidden">
        <Header />
        <PageTransition>
          <Outlet />
        </PageTransition>
        <Footer />
        <ScrollToTop />
      </div>
    </>
  );
}
