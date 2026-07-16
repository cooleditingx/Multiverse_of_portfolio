import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
// Vite + react-router app → the /react entry ("/next" needs Next.js and
// breaks the build). Tracks SPA route changes via the History API.
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Hub from './pages/Hub';
import SideMenu from './nav/SideMenu';
import ErrorBoundary from './lib/ErrorBoundary';
import { WarpProvider } from './nav/WarpDrive';
import { useStore } from './store';

const TechPage = lazy(() => import('./pages/TechPage'));
// const VideoPage = lazy(() => import('./pages/VideoPage'));
const HobbiesPage = lazy(() => import('./pages/HobbiesPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-[var(--space-bg)]">
      <p className="font-mono text-sm text-[var(--ink-dim)]">
        opening portal<span className="block-cursor ml-1" />
      </p>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const explored = useStore((s) => s.explored);
  // Side nav is visible everywhere except the hub's pre-explore overlay phase
  const showNav = pathname !== '/' || explored;

  return (
    <WarpProvider>
      {/* keyboard users can jump past the fixed nav straight to the page */}
      <a href="#main" className="skip-link">Skip to content</a>
      <ScrollToTop />
      {showNav && <SideMenu />}
      <ErrorBoundary>
        <main id="main" tabIndex={-1}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Hub />} />
              <Route path="/tech" element={<TechPage />} />
              <Route path="/hobbies" element={<HobbiesPage />} />
              <Route path="/curiosity-planet" element={<BlogPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
      </ErrorBoundary>
      <Analytics />
      <SpeedInsights />
    </WarpProvider>
  );
}
  // { label: 'VIDEO EDITING', route: '/video' },
  //{ <Route path="/video" element={<VideoPage />} /> }
