import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { MemberView } from '../roles/MemberView';
import { GuestView } from '../roles/GuestView';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { 
  Coffee, 
  Award, 
  Smartphone, 
  ShieldCheck, 
  ShoppingBag,
  Sparkles,
  QrCode
} from 'lucide-react';

interface Props {
  onOpenRoleSwitcher: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const CustomerPWAPresentation: React.FC<Props> = ({
  onOpenRoleSwitcher,
  showToast,
}) => {
  const { currentUser, activeTenant } = usePlatform();
  const isMember = currentUser.role === 'MEMBER';

  return (
    <div className="min-h-screen bg-stone-900 py-6 px-4 flex items-center justify-center">
      {/* Customer Mobile PWA View Container (400px) */}
      <div className="w-full max-w-[400px] h-[820px] bg-[#FDFBF7] rounded-[44px] shadow-2xl border-4 border-amber-900/40 flex flex-col overflow-hidden relative">
        {/* PWA App Header */}
        <header className="px-5 py-3.5 bg-[#4A2E1B] text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-black text-xs">
              K
            </div>
            <div>
              <h1 className="font-extrabold text-xs text-white leading-tight">
                {activeTenant?.name || 'KOPIIN Café'}
              </h1>
              <span className="text-[10px] text-amber-200">Customer PWA App</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton compact />
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-4">
          {isMember ? (
            <MemberView showToast={showToast} />
          ) : (
            <GuestView
              onRegisterMember={onOpenRoleSwitcher}
              showToast={showToast}
            />
          )}
        </div>
      </div>
    </div>
  );
};
