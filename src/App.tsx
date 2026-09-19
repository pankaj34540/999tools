import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import InstallPrompt from './components/common/InstallPrompt';
import NotificationToast from './components/common/NotificationToast';

// Lazy load pages for better performance
const PublicPage = lazy(() => import('./pages/PublicPage'));
const OwnerPage = lazy(() => import('./pages/OwnerPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// Legal Pages
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/legal/TermsPage'));
const RefundPage = lazy(() => import('./pages/legal/RefundPage'));
const ContactPage = lazy(() => import('./pages/legal/ContactPage'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 text-sm">Loading...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Tools + VLE */}
            <Route path="/" element={<PublicPage />} />

            {/* Hidden Owner Panel */}
            <Route path="/owner" element={<OwnerPage />} />

            {/* Admin Panel */}
            <Route path="/admin" element={<AdminPage />} />

            {/* Legal Pages */}
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/refund" element={<RefundPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        {/* Global Components */}
        <InstallPrompt />
        <NotificationToast />
      </Router>
    </AppProvider>
  );
};

export default App;
