import React from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Database, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Code, 
  CheckCircle2, 
  Lock, 
  Cpu, 
  Cloud, 
  Key, 
  Server,
  X 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureOverviewModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#4A2E1B] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Spesifikasi Arsitektur KOPIIN Enterprise</h3>
              <p className="text-[11px] text-amber-200/80">SaaS Multi-Tenant Café Management Platform (Full Spec)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-stone-700">
          {/* Key Rule Callout */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
            <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-800" />
              Prinsip Isolasi & Autentikasi Mandiri (Native Auth)
            </h4>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              KOPIIN <strong>TIDAK MENGGUNAKAN Supabase Auth</strong>. Autentikasi berjalan native di tabel <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">public.kopiin_users</code> dengan salt acak dan hashing PBKDF2 SHA-256. Setiap akun langsung berstatus <strong>ACTIVE</strong> (tanpa hambatan email verification), serta isolasi multi-tenant terjamin via <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">tenant_id</code> di semua entitas data.
            </p>
          </div>

          {/* 4 Presentation Modes */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-stone-900 uppercase tracking-wider">
              1. Empat Profil Presentasi Terintegrasi
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-[#1F1E1D] flex items-center gap-1.5 mb-1">
                  <Monitor className="w-4 h-4 text-[#4A2E1B]" />
                  Desktop Console (1440px+)
                </span>
                <p className="text-[11px] text-stone-500">
                  Antarmuka komprehensif bagi Platform Master & Tenant Owner. Dilengkapi sidebar navigasi, grafik omset, tabel laporan laba-rugi, dan ekspor CSV.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-[#1F1E1D] flex items-center gap-1.5 mb-1">
                  <Tablet className="w-4 h-4 text-blue-700" />
                  Tablet POS Landscape (1024px)
                </span>
                <p className="text-[11px] text-stone-500">
                  Optimal untuk layar kasir meja & Barista KDS. Grid menu 2-kolom dengan tombol cepat sentuh besar dan kalkulasi uang kembalian instan.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-[#1F1E1D] flex items-center gap-1.5 mb-1">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  Android Native Shell (390px)
                </span>
                <p className="text-[11px] text-stone-500">
                  Simulasi aplikasi mobile staf dengan status bar Android 15, bottom navigation bar ergonomis, dan akses kamera selfie absensi.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-[#1F1E1D] flex items-center gap-1.5 mb-1">
                  <Smartphone className="w-4 h-4 text-purple-700" />
                  Customer PWA
                </span>
                <p className="text-[11px] text-stone-500">
                  Pengalaman instan web-app pelanggan tanpa instalasi. Kartu loyalitas digital, saldo poin, katalog menu, dan self-order mandiri.
                </p>
              </div>
            </div>
          </div>

          {/* Database & Supabase Usage */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-stone-900 uppercase tracking-wider">
              2. Pemanfaatan Supabase & Keamanan
            </h4>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-[11px]">
              <p>• <strong>PostgreSQL Database:</strong> Schema 17 tabel dengan foreign key terindeks dan kolom <code className="font-mono">tenant_id</code> wajib.</p>
              <p>• <strong>Supabase Storage:</strong> Bucket <code className="font-mono">attendance-photos</code> untuk penyimpanan foto selfie absensi staf.</p>
              <p>• <strong>Realtime Channels:</strong> Sinkronisasi instan order antara kasir, kitchen display barista, dan customer.</p>
              <p>• <strong>Zero Service Key in Client:</strong> Hanya menggunakan <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> publik tanpa membocorkan kunci rahasia server.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
