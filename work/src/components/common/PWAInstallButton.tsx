import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>PWA Terpasang</span>
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <button
        id="btn-install-pwa"
        onClick={handleInstall}
        className={`flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition shadow-sm ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm'
        }`}
      >
        <Download className="w-4 h-4" />
        <span>Install PWA</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          id="btn-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-amber-600/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 font-medium transition ${
            compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-stone-100">
              <h3 className="text-base font-semibold text-white">Install KOPIIN di iPhone / iPad</h3>
              <p className="mt-2 text-xs text-stone-300 leading-relaxed">
                1. Buka link ini di browser Safari.<br />
                2. Ketuk tombol <strong>Share</strong> (ikon bagikan di bar bawah).<br />
                3. Gulir ke bawah lalu pilih <strong>Add to Home Screen</strong> (Tambah ke Layar Utama).
              </p>
              <button
                id="btn-close-ios-guide"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-stone-800 hover:bg-stone-700 py-2 text-xs font-semibold text-white transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-stone-400 bg-stone-800/80 border border-stone-700/60 rounded">
      <Smartphone className="w-3 h-3 text-amber-500" />
      <span>PWA Ready (No-Install)</span>
    </div>
  );
};
