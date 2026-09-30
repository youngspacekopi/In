import React from 'react';
import { PresentationProfile } from '../../types/platform';
import { usePlatform } from '../../context/PlatformContext';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  UserCheck, 
  Info,
  Building2,
  ChevronDown
} from 'lucide-react';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface Props {
  onOpenRoleSwitcher: () => void;
  onOpenArchitectureModal: () => void;
}

export const PresentationSwitcher: React.FC<Props> = ({
  onOpenRoleSwitcher,
  onOpenArchitectureModal,
}) => {
  const { 
    presentationProfile, 
    setPresentationProfile, 
    currentUser, 
    activeTenant 
  } = usePlatform();

  const profiles: Array<{ id: PresentationProfile; label: string; icon: any; resolution: string }> = [
    { id: 'DESKTOP', label: 'Desktop Console', icon: Monitor, resolution: '1440px+' },
    { id: 'TABLET', label: 'Tablet POS Landscape', icon: Tablet, resolution: '1024px' },
    { id: 'ANDROID', label: 'Android Native Shell', icon: Smartphone, resolution: '390px' },
    { id: 'CUSTOMER_PWA', label: 'Customer PWA', icon: Smartphone, resolution: 'Mobile PWA' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md">
      {/* Brand & Active Tenant */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
            K
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">KOPIIN</span>
        </div>

        {/* Isolated Tenant Badge (No switching allowed - strictly isolated) */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-lg text-xs border border-amber-500/30 text-amber-200">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold tracking-tight">{activeTenant?.name || 'KOPIIN Café'}</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-medium">
            Terisolasi
          </span>
        </div>

        <OfflineIndicator />
        <PWAInstallButton compact />
      </div>

      {/* Presentation Profile Selector Pills */}
      <div className="flex items-center bg-stone-800 p-0.5 rounded-xl border border-stone-700/80">
        {profiles.map((p) => {
          const Icon = p.icon;
          const isActive = presentationProfile === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPresentationProfile(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-750'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{p.label}</span>
              <span className="md:hidden text-[11px]">{p.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Role Switcher Button & Architecture Specs */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenRoleSwitcher}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-700/50 hover:bg-amber-900 text-amber-200 text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Peran:</span>
          <span className="font-extrabold text-white">{currentUser.role}</span>
          <ChevronDown className="w-3 h-3 text-amber-400" />
        </button>

        <button
          onClick={onOpenArchitectureModal}
          className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition cursor-pointer"
          title="Spesifikasi Arsitektur SaaS KOPIIN"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
