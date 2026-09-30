import React, { useState } from 'react';
import { 
  Coffee, 
  Shield, 
  Store, 
  CreditCard, 
  Flame, 
  Boxes, 
  Award, 
  Smartphone, 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Users,
  Clock
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { UserRole } from '../../types/platform';
import { INITIAL_USERS } from '../../lib/auth/rbac';

interface Props {
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const LoginPage: React.FC<Props> = ({ showToast }) => {
  const { loginAsRole, loginWithCredentials, activeTenant } = usePlatform();
  const [activeMode, setActiveMode] = useState<'demo' | 'manual'>('demo');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Demo Accounts Directory with distinct colors & capabilities
  const demoAccounts: Array<{
    role: UserRole;
    name: string;
    email: string;
    roleLabel: string;
    badgeColor: string;
    icon: any;
    desc: string;
  }> = [
    {
      role: 'TENANT_OWNER',
      name: 'Arya Pratama',
      email: 'owner@youngspace.cafe',
      roleLabel: 'Owner Café',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: Store,
      desc: 'Akses penuh: Laba/Rugi riil, HPP, struktur menu, arus kas, & kelola staf.',
    },
    {
      role: 'TENANT_MANAGER',
      name: 'Dian Permata',
      email: 'manager@youngspace.cafe',
      roleLabel: 'Manager Café',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      icon: Shield,
      desc: 'Supervisi shift operasional, stock opname bahan, audit kasir harian.',
    },
    {
      role: 'STAFF_CASHIER',
      name: 'Budi Santoso',
      email: 'cashier@youngspace.cafe',
      roleLabel: 'Kasir POS',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: CreditCard,
      desc: 'Front-of-house: Pembayaran tunai/QRIS, cetak struk thermal, closing shift.',
    },
    {
      role: 'STAFF_BARISTA',
      name: 'Rian Wijaya',
      email: 'barista@youngspace.cafe',
      roleLabel: 'Barista (KDS)',
      badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
      icon: Flame,
      desc: 'Display antrean racik pesanan dapur & barista secara langsung.',
    },
    {
      role: 'STAFF_STOKIS',
      name: 'Hendra Setiawan',
      email: 'stokis@youngspace.cafe',
      roleLabel: 'Stokis Gudang',
      badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
      icon: Boxes,
      desc: 'Manajemen multi-gudang, restock supplier, & transfer bahan ke meja bar.',
    },
    {
      role: 'STAFF',
      name: 'Doni Pratama',
      email: 'staff@youngspace.cafe',
      roleLabel: 'Staff (Hanya Absensi)',
      badgeColor: 'bg-violet-100 text-violet-900 border-violet-300',
      icon: Clock,
      desc: 'Role operasional yang HANYA BISA ABSENSI: presensi jam masuk & pulang kerja.',
    },
    {
      role: 'MEMBER',
      name: 'Siti Rahma',
      email: 'member@gmail.com',
      roleLabel: 'Member VIP (Gold)',
      badgeColor: 'bg-amber-200 text-amber-950 border-amber-400',
      icon: Award,
      desc: 'Kartu loyalitas, saldo poin reward, katalog promo, & riwayat pesanan.',
    },
    {
      role: 'GUEST',
      name: 'Pelanggan Tamu',
      email: 'guest@youngspace.cafe',
      roleLabel: 'Tamu / QR Meja',
      badgeColor: 'bg-stone-100 text-stone-800 border-stone-300',
      icon: Smartphone,
      desc: 'Mode pemesanan mandiri tamu di meja café tanpa login akun.',
    },
  ];

  const handleSelectDemo = (role: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      loginAsRole(role);
      const user = INITIAL_USERS[role];
      showToast(`Berhasil masuk sebagai ${user?.full_name || role}!`, 'success');
      setIsLoading(false);
    }, 200);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginWithCredentials(emailInput, passwordInput);
      if (res.success) {
        showToast('Login berhasil! Selamat datang kembali.', 'success');
      } else {
        setErrorMessage(res.error || 'Email tidak terdaftar.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-stone-950 text-stone-900 flex flex-col items-center justify-start md:justify-center md:p-4 overflow-hidden select-none">
      {/* Container simulating smartphone app or tablet/desktop window */}
      <div className="w-full bg-[#FDFBF7] flex flex-col overflow-hidden relative shadow-2xl h-[100dvh] max-h-[100dvh] md:max-w-[430px] md:h-[890px] md:rounded-[44px] md:border-8 md:border-stone-800">
        {/* Native Mobile Status Bar Mockup */}
        <div className="px-5 pt-3 pb-2 bg-[#FAF8F5] border-b border-stone-200/80 flex items-center justify-between text-xs text-stone-800 shrink-0 z-10">
          <span className="font-mono font-bold text-xs tracking-tight">09:41</span>
          <div className="w-20 h-4 bg-stone-900 rounded-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
          </div>
          <div className="flex items-center gap-1.5 text-stone-600 text-[10px] font-semibold">
            <span className="text-[10px]">KOPIIN OS</span>
          </div>
        </div>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-4">
          {/* Brand Header */}
          <div className="text-center pt-2 pb-1 space-y-1.5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#3D2616] to-[#5C3922] text-amber-200 shadow-lg shadow-amber-950/20 border border-amber-600/30">
              <Coffee className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#1F1E1D]">KOPIIN POS & Café</h1>
              <p className="text-xs text-stone-500 font-medium">
                Outlet: <strong className="text-amber-900">{activeTenant?.name || 'Young Space Café'}</strong>
              </p>
            </div>
            <p className="text-[11px] text-stone-500 max-w-xs mx-auto leading-relaxed">
              Sistem operasional café multi-peran dengan isolasi sesi mandiri. Silakan masuk untuk memulai.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-stone-200/70 rounded-2xl text-xs font-bold">
            <button
              onClick={() => {
                setActiveMode('demo');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'demo'
                  ? 'bg-white text-[#4A2E1B] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pilih Akun Demo</span>
            </button>
            <button
              onClick={() => {
                setActiveMode('manual');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'manual'
                  ? 'bg-white text-[#4A2E1B] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login Email/PIN</span>
            </button>
          </div>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: DEMO ACCOUNTS SELECTOR */}
          {activeMode === 'demo' && (
            <div className="space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Daftar Akun Terisolasi (Klik untuk Masuk)
                </span>
                <span className="text-[10px] text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                  8 Peran Demo
                </span>
              </div>

              {/* Demo Account Cards List */}
              <div className="space-y-2">
                {demoAccounts.map((acc) => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSelectDemo(acc.role)}
                      className="w-full text-left p-3 bg-white hover:bg-stone-50 border border-stone-200 hover:border-amber-400 rounded-2xl shadow-2xs hover:shadow-xs transition duration-150 cursor-pointer group flex items-start justify-between gap-2.5 active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 group-hover:bg-[#4A2E1B] text-amber-900 group-hover:text-amber-200 border border-amber-200/60 flex items-center justify-center font-bold shrink-0 transition">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-xs text-[#1F1E1D] group-hover:text-amber-950 truncate">
                              {acc.name}
                            </h4>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${acc.badgeColor}`}>
                              {acc.roleLabel}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-500 font-mono mt-0.5 truncate">
                            {acc.email}
                          </p>
                          <p className="text-[10px] text-stone-600 mt-1 leading-tight line-clamp-2">
                            {acc.desc}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 pt-1 text-stone-400 group-hover:text-amber-800 transition">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL LOGIN FORM */}
          {activeMode === 'manual' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Email Akun *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. owner@youngspace.cafe"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-[#4A2E1B] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Password / PIN *</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-[#4A2E1B] focus:bg-white transition font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}</span>
                  </button>
                </form>

                {/* Quick Autofill Buttons for Testing */}
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-[10px] text-stone-400 font-bold block mb-1.5">
                    Klik untuk isi cepat akun:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput('mdqputra@gmail.com');
                        setPasswordInput('990830');
                      }}
                      className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      👑 Master (mdqputra)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput('owner@youngspace.cafe');
                        setPasswordInput('kopiin123');
                      }}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-semibold cursor-pointer"
                    >
                      Owner Café
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput('cashier@youngspace.cafe');
                        setPasswordInput('kopiin123');
                      }}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-semibold cursor-pointer"
                    >
                      Kasir POS
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput('barista@youngspace.cafe');
                        setPasswordInput('kopiin123');
                      }}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-semibold cursor-pointer"
                    >
                      Barista KDS
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput('stokis@youngspace.cafe');
                        setPasswordInput('kopiin123');
                      }}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-semibold cursor-pointer"
                    >
                      Stokis Gudang
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput('staff@youngspace.cafe');
                        setPasswordInput('kopiin123');
                      }}
                      className="px-2 py-1 bg-violet-100 hover:bg-violet-200 text-violet-950 border border-violet-300 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      ⏰ Staff (Absensi)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Isolation Security Notice */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
              <Shield className="w-4 h-4 text-amber-800 shrink-0" />
              <span>Prinsip Isolasi Akun Terkunci</span>
            </div>
            <p className="text-[10px] text-amber-900/90 leading-relaxed">
              Setelah login, sesi akun Anda terkunci penuh pada peran tersebut demi integritas operasional dan keamanan keuangan kasir. Tombol beralih akun dinonaktifkan di dalam aplikasi. Untuk berganti peran, silakan tekan tombol <strong>Logout / Keluar</strong> di menu profil.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#FAF8F5] border-t border-stone-200 text-center text-[10px] text-stone-400 shrink-0">
          KOPIIN POS Cloud • Secure Role Isolation v2.4
        </div>
      </div>
    </div>
  );
};
