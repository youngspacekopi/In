import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { useCafe } from '../../context/CafeContext';
import { StaffCashierView } from '../roles/StaffCashierView';
import { StaffBaristaView } from '../roles/StaffBaristaView';
import { AttendanceModule } from '../desktop/AttendanceModule';
import { 
  Tablet, 
  ShoppingBag, 
  Coffee, 
  Calendar, 
  TrendingUp, 
  Boxes 
} from 'lucide-react';

interface Props {
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const TabletPresentation: React.FC<Props> = ({ showToast }) => {
  const { currentUser, activeTenant } = usePlatform();
  const [tab, setTab] = useState<'pos' | 'kds' | 'attendance'>('pos');

  return (
    <div className="bg-stone-900 min-h-screen p-4 flex items-center justify-center">
      {/* Tablet Landscape Frame Simulation (1024px) */}
      <div className="w-full max-w-[1024px] bg-[#FDFBF7] rounded-3xl shadow-2xl border-4 border-stone-800 overflow-hidden flex flex-col min-h-[640px]">
        {/* Tablet Top Navigation Bar */}
        <div className="px-5 py-3 bg-[#4A2E1B] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <Tablet className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-extrabold text-sm text-white leading-tight">
                {activeTenant?.name || 'KOPIIN Café'} – Tablet POS
              </h2>
              <span className="text-[10px] text-amber-200 font-mono">
                Operator: {currentUser.full_name} ({currentUser.role})
              </span>
            </div>
          </div>

          {/* Quick Tablet Tabs */}
          <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl">
            <button
              onClick={() => setTab('pos')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tab === 'pos' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-300 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Kasir POS</span>
            </button>
            <button
              onClick={() => setTab('kds')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tab === 'kds' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-300 hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Barista KDS</span>
            </button>
            <button
              onClick={() => setTab('attendance')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tab === 'attendance' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-300 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Absensi Selfie</span>
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 p-5 overflow-y-auto">
          {tab === 'pos' && <StaffCashierView showToast={showToast} />}
          {tab === 'kds' && <StaffBaristaView showToast={showToast} />}
          {tab === 'attendance' && <AttendanceModule />}
        </div>
      </div>
    </div>
  );
};
