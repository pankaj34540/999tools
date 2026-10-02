import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { PublicPage } from './pages/PublicPage';
import { OwnerPage } from './pages/OwnerPage';
import { AdminPage } from './pages/AdminPage';
import { NotificationToast } from './components/common/NotificationToast';
import { InstallPrompt } from './components/common/InstallPrompt';
import PrivacyPage from './pages/legal/PrivacyPage';
import TermsPage from './pages/legal/TermsPage';
import RefundPage from './pages/legal/RefundPage';
import ContactPage from './pages/legal/ContactPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import BlogPage from './pages/blog/BlogPage';
import BlogPostPage from './pages/blog/BlogPostPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <NotificationToast />
        <InstallPrompt />
        <Routes>
          {/* 🏠 Homepage */}
          <Route path="/" element={<PublicPage />} />

          {/* 🛠️ Individual Tool Pages — SEO-friendly URLs */}
          <Route path="/tools/:toolId" element={<PublicPage />} />

          {/* 📄 Static Pages */}
          <Route path="/pricing" element={<PublicPage />} />
          <Route path="/services" element={<PublicPage />} />

          {/* 👑 Owner & Admin */}
          <Route path="/owner" element={<OwnerPage />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* 💳 Payment */}
          <Route path="/payment-success" element={<PaymentSuccessPage />} />

          {/* 📝 Blog */}
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />

          {/* ⚖️ Legal Pages */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/refund" element={<RefundPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* 🔄 Fallback — Unknown URLs → Homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
