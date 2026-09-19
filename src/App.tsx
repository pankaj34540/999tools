import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { PublicPage } from './pages/PublicPage';
import { OwnerPage } from './pages/OwnerPage';
import { AdminPage } from './pages/AdminPage';
import { NotificationToast } from './components/common/NotificationToast';
import { InstallPrompt } from './components/common/InstallPrompt';

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
