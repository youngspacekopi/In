import React, { useState } from 'react';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { CafeProvider } from './context/CafeContext';
import { MobileAppLayout } from './components/presentation/MobileAppLayout';
import { LoginPage } from './components/presentation/LoginPage';
import { ArchitectureOverviewModal } from './components/presentation/ArchitectureOverviewModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';

const AppContent: React.FC = () => {
  const { isAuthenticated } = usePlatform();

  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, type: 'success' | 'error' | 'info' = 'success', description?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, title, type, description }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-stone-950 text-[#1F1E1D] flex flex-col font-sans overflow-hidden">
      {!isAuthenticated ? (
        <LoginPage showToast={(msg, type) => addToast(msg, type || 'success')} />
      ) : (
        <MobileAppLayout
          onOpenArchitectureModal={() => setIsArchModalOpen(true)}
          showToast={(msg, type) => addToast(msg, type || 'success')}
        />
      )}

      {/* Architecture & Specs Modal */}
      <ArchitectureOverviewModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default function App() {

  return (
    <PlatformProvider>
      <CafeProvider>
        <AppContent />
      </CafeProvider>
    </PlatformProvider>
  );
}
