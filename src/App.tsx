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

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <NotificationToast />
        <InstallPrompt />
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/owner" element={<OwnerPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/refund" element={<RefundPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
