import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { useCafe } from '../../context/CafeContext';
import { AttendanceModule } from '../desktop/AttendanceModule';
import { 
  Clock, 
  UserCheck, 
  Calendar, 
  Building2, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Camera,
  Coffee
} from 'lucide-react';

interface Props {
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const StaffAbsensiView: React.FC<Props> = ({ showToast }) => {
  const { currentUser, activeTenant } = usePlatform();
  const { attendances } = useCafe();

  // Realtime clock
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Today's attendance status
  const todayDate = new Date().toISOString().split('T')[0];
  const userTodayAttendance = attendances.find(
    (a) => a.user_id === currentUser.id && a.date === todayDate
  );

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Staff Greeting & Profile Hero */}
      <div className="bg-gradient-to-br from-[#2D1B10] via-[#4A2E1B] to-[#3D2616] text-white p-5 rounded-3xl shadow-lg border border-amber-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-200 border border-violet-400/30 flex items-center gap-1 font-mono">
                <UserCheck className="w-3 h-3 text-violet-300" />
                STAFF ABSENSI
              </span>
              <span className="text-[10px] text-amber-200/80 font-medium">
                {activeTenant?.name || 'Cabang Terisolasi'}
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white mt-1">
              Halo, {currentUser.full_name}!
            </h2>
            <p className="text-xs text-amber-100/70 leading-relaxed max-w-sm">
              Selamat datang di portal presensi mandiri. Catat kehadiran jam masuk dan jam pulang kerja shift harian Anda.
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-200 shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Realtime Live Clock Pill */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-medium">{dateStr}</span>
          </div>
          <div className="px-3 py-1 bg-black/30 rounded-xl border border-white/10 font-mono font-black text-sm text-emerald-300 tracking-wider">
            {timeStr}
          </div>
        </div>
      </div>

      {/* Today's Shift Status Card */}
      <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Status Presensi Hari Ini
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            !userTodayAttendance 
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : userTodayAttendance.check_out_time
              ? 'bg-stone-100 text-stone-700 border-stone-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {!userTodayAttendance 
              ? 'Belum Clock-In'
              : userTodayAttendance.check_out_time
              ? 'Selesai Shift (Clock-Out)'
              : 'Sedang Bertugas'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <span className="text-[10px] text-stone-500 block">Jam Masuk (Clock In)</span>
            <div className="text-base font-bold font-mono text-[#1F1E1D] mt-0.5">
              {userTodayAttendance ? userTodayAttendance.check_in_time : '--:--'}
            </div>
            <span className="text-[9px] text-stone-400 block mt-0.5">
              {userTodayAttendance ? `Status: ${userTodayAttendance.status}` : 'Belum tercatat'}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <span className="text-[10px] text-stone-500 block">Jam Pulang (Clock Out)</span>
            <div className="text-base font-bold font-mono text-[#1F1E1D] mt-0.5">
              {userTodayAttendance?.check_out_time ? userTodayAttendance.check_out_time : '--:--'}
            </div>
            <span className="text-[9px] text-stone-400 block mt-0.5">
              {userTodayAttendance?.total_hours ? `${userTodayAttendance.total_hours} Jam Kerja` : 'Belum clock out'}
            </span>
          </div>
        </div>

        {/* Info Banner on Role Limits */}
        <div className="p-2.5 bg-violet-50/70 border border-violet-200/60 rounded-xl flex items-start gap-2 text-xs text-violet-900">
          <Shield className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Hak Akses Khusus:</strong> Akun role <strong>Staff</strong> difokuskan secara khusus untuk presensi mandiri. Menu kasir POS, dapur KDS, dan inventori gudang dikelola oleh kasir, barista, dan stokis.
          </p>
        </div>
      </div>

      {/* Main Attendance Module (Selfie, Camera, Clock-in, History) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Camera className="w-4 h-4 text-amber-800" />
          <h3 className="font-extrabold text-sm text-[#1F1E1D]">Formulir & Riwayat Presensi</h3>
        </div>
        <AttendanceModule />
      </div>
    </div>
  );
};
