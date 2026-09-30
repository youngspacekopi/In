import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Tenant } from '../../types/platform';
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  Activity, 
  Plus, 
  ArrowUpRight, 
  Lock, 
  Clock, 
  Server,
  CheckCircle2,
  AlertCircle,
  Search,
  UserPlus,
  ShieldAlert,
  EyeOff,
  UserCheck,
  X,
  Phone,
  Mail,
  Shield
} from 'lucide-react';

interface Props {
  onOpenAddTenant: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export type MasterTab = 'tenants' | 'metrics' | 'audit' | 'security';

export const PlatformMasterView: React.FC<Props> = ({ onOpenAddTenant, showToast }) => {
  const { 
    tenants, 
    activeTenant, 
    currentUser, 
    auditLogs,
    hasAccess,
    users,
    getTenantOwners,
    createOwnerForTenant,
    toggleUserStatus
  } = usePlatform();

  const [activeTab, setActiveTab] = useState<MasterTab>('tenants');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State: Tambah Akun Owner untuk Tenant tertentu
  const [selectedTenantForOwner, setSelectedTenantForOwner] = useState<Tenant | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('OwnerPass2026!');
  const [ownerPhone, setOwnerPhone] = useState('+62 ');
  const [isSubmittingOwner, setIsSubmittingOwner] = useState(false);
  const [ownerModalError, setOwnerModalError] = useState<string | null>(null);

  // Permission Check
  if (!hasAccess('platform:master')) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-14 h-14 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-stone-900">Akses Ditolak (403 Forbidden)</h3>
        <p className="text-xs text-stone-600">
          Peran Anda ({currentUser.role}) tidak memiliki izin <code className="text-red-700 font-mono">platform:master</code> untuk mengakses konsol SuperAdmin.
        </p>
      </div>
    );
  }

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allOwners = users.filter(u => u.role === 'TENANT_OWNER');

  const handleCreateOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForOwner) return;
    if (!ownerName.trim() || !ownerEmail.trim() || !ownerPassword.trim()) {
      setOwnerModalError('Nama lengkap, email, dan password wajib diisi.');
      return;
    }
    try {
      setIsSubmittingOwner(true);
      setOwnerModalError(null);
      const newOwner = await createOwnerForTenant(selectedTenantForOwner.id, {
        fullName: ownerName.trim(),
        email: ownerEmail.trim().toLowerCase(),
        passwordPlainText: ownerPassword,
        phone: ownerPhone.trim() || undefined,
      });
      showToast(`Akun Owner "${newOwner.full_name}" berhasil ditambahkan ke ${selectedTenantForOwner.name}!`);
      // Reset form
      setOwnerName('');
      setOwnerEmail('');
      setOwnerPassword('OwnerPass2026!');
      setOwnerPhone('+62 ');
      setSelectedTenantForOwner(null);
    } catch (err: any) {
      setOwnerModalError(err.message || 'Gagal membuat akun owner.');
    } finally {
      setIsSubmittingOwner(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] pb-24">
      {/* Platform Master Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-stone-900 to-indigo-950 text-white p-4 rounded-2xl mb-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 font-black text-xs">
              M
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300">Konsol Master SaaS</span>
              <h2 className="text-sm font-extrabold text-white leading-tight">KOPIIN Multi-Tenant Cloud</h2>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
            Global SuperAdmin
          </span>
        </div>
        <p className="text-xs text-stone-300 leading-snug">
          Otoritas pusat pengelola entitas tenant café dan akun Owner. Master mengelola lisensi dan keamanan tanpa mengakses data penjualan tenant.
        </p>
      </div>

      {/* PRIVACY POLICY BANNER: Master strictly excluded from tenant financial reports */}
      <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl mb-4 text-xs text-stone-700 flex items-start gap-2.5">
        <EyeOff className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wide">
            Kerahasiaan Data & Isolasi Laporan Penjualan
          </p>
          <p className="text-[11px] leading-relaxed text-stone-600">
            Platform Master <strong>tidak dapat melihat laporan penjualan, kas, maupun omset tenant</strong>. Laporan keuangan adalah fitur eksklusif peran <strong>Tenant Owner</strong>. Master berperan khusus sebagai <strong>pembuat tenant dan pengelola akun Owner</strong> (1 tenant dapat memiliki lebih dari 2 akun owner).
          </p>
        </div>
      </div>

      {/* Role Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-100 rounded-xl mb-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'tenants' ? 'bg-white text-purple-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span className="text-[10px]">Tenant & Owner ({tenants.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'metrics' ? 'bg-white text-purple-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="text-[10px]">Infrastruktur SaaS</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'audit' ? 'bg-white text-purple-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px]">Audit Security</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'security' ? 'bg-white text-purple-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span className="text-[10px]">Autentikasi</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* Tab 1: Tenant Directory & Multi-Owner Management */}
      {/* ======================================================== */}
      {activeTab === 'tenants' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Cari tenant berdasarkan nama atau slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white text-xs rounded-xl border border-stone-200 outline-none"
              />
            </div>
            <button
              onClick={onOpenAddTenant}
              className="px-3.5 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Tenant Baru</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {filteredTenants.map((t) => {
              const isActive = t.id === activeTenant.id;
              const tenantOwners = getTenantOwners(t.id);
              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border transition shadow-xs ${
                    isActive 
                      ? 'bg-purple-50/40 border-purple-300 ring-1 ring-purple-300' 
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {/* Tenant Header Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-stone-900">{t.name}</h3>
                          {isActive && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-700 text-white">
                              Active Scope
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                          ID: {t.id} • Slug: /{t.slug} • PB1: {(t.settings.tax_rate * 100)}%
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                      {t.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Multi-Owner Section */}
                  <div className="mt-3.5 pt-3 border-t border-stone-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-700" />
                        <h4 className="font-bold text-xs text-stone-900">
                          Akun Owner Terdaftar ({tenantOwners.length})
                        </h4>
                        <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-semibold">
                          Boleh &gt; 2 Akun
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTenantForOwner(t);
                          setOwnerModalError(null);
                        }}
                        className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>+ Tambah Owner</span>
                      </button>
                    </div>

                    {/* Owner Cards */}
                    <div className="space-y-2">
                      {tenantOwners.length === 0 ? (
                        <p className="text-[11px] text-stone-400 italic py-2 text-center bg-stone-50 rounded-xl">
                          Belum ada akun Owner terdaftar untuk tenant ini.
                        </p>
                      ) : (
                        tenantOwners.map((owner, idx) => (
                          <div 
                            key={owner.id}
                            className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-amber-700 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                                O{idx + 1}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-stone-900 truncate">{owner.full_name}</p>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    owner.status === 'ACTIVE' 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {owner.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono">
                                  <span className="flex items-center gap-0.5">
                                    <Mail className="w-2.5 h-2.5" /> {owner.email}
                                  </span>
                                  {owner.phone && (
                                    <span className="flex items-center gap-0.5">
                                      <Phone className="w-2.5 h-2.5" /> {owner.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                toggleUserStatus(owner.id);
                                showToast(`Status akun "${owner.full_name}" diubah.`);
                              }}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer shrink-0 ml-2 ${
                                owner.status === 'ACTIVE'
                                  ? 'text-stone-600 bg-white border-stone-200 hover:bg-stone-100'
                                  : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {owner.status === 'ACTIVE' ? 'Suspend' : 'Aktifkan'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Tenant Isolation Footer */}
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-stone-500 font-medium">Isolasi Tenant</span>
                    <span className="text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                      ID: {t.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 2: SaaS Infrastructure Metrics (No Sales Data) */}
      {/* ======================================================== */}
      {activeTab === 'metrics' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-semibold">Total Café / Tenant</span>
                <Building2 className="w-4 h-4 text-purple-700" />
              </div>
              <p className="text-xl font-extrabold text-[#1F1E1D]">{tenants.length}</p>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-3 h-3" /> 100% Aktif Terdaftar
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-semibold">Total Akun Owner</span>
                <Shield className="w-4 h-4 text-amber-700" />
              </div>
              <p className="text-xl font-extrabold text-[#1F1E1D]">{allOwners.length} Akun</p>
              <span className="text-[10px] text-purple-700 font-medium">Boleh &gt; 2 per Tenant</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-semibold">Pengguna Terdaftar</span>
                <Users className="w-4 h-4 text-blue-700" />
              </div>
              <p className="text-xl font-extrabold text-[#1F1E1D]">{users.length} Akun</p>
              <span className="text-[10px] text-stone-500 font-medium">Owner, Staf, & Member</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-semibold">Kesehatan Server</span>
                <Server className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-base font-extrabold text-emerald-700">99.98%</p>
              <span className="text-[10px] text-stone-500 font-medium">PostgreSQL Online</span>
            </div>
          </div>

          {/* Quick Action: Onboard New Tenant */}
          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-xs text-purple-900">Pendaftaran Tenant Café Baru</h4>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Master membuat entitas tenant baru beserta akun Owner awal (langsung ACTIVE).
              </p>
            </div>
            <button
              onClick={onOpenAddTenant}
              className="px-3.5 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Daftarkan</span>
            </button>
          </div>

          {/* Architecture Rules Card */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2.5 text-xs">
            <h4 className="font-bold text-xs text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              Prinsip Batasan Kewenangan Master KOPIIN
            </h4>
            <div className="space-y-2 text-[11px] text-stone-600 leading-relaxed">
              <p className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Pembuat Tenant:</strong> Master berwenang mendaftarkan kafe baru, konfigurasi slug, dan tarif pajak PB1.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Pembuat Akun Owner:</strong> Master dapat menambahkan lebih dari 2 akun Owner untuk setiap tenant (misal: Co-Founders, Partner Bisnis, Investor).</span>
              </p>
              <p className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Privasi Omset Terjamin:</strong> Master tidak memiliki akses ke laporan penjualan, buku kas, maupun transaksi kafe demi independensi finansial tenant.</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 3: Security & Audit Logs */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-[#1F1E1D]">Audit Trail Aktivitas Realtime</h4>
            <span className="text-[10px] font-mono text-stone-500">{auditLogs.length} Entri Log</span>
          </div>
          <div className="space-y-2">
            {auditLogs.slice(0, 15).map((log) => (
              <div key={log.id} className="p-3 bg-white rounded-xl border border-stone-200 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-purple-900 font-mono text-[11px]">{log.action}</span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-stone-600">
                  <span>User: <strong className="text-stone-800">{log.user_email}</strong> ({log.user_role})</span>
                  <span className="font-mono text-stone-400">IP: {log.ip_address}</span>
                </div>
                <div className="text-[10px] text-stone-500 font-mono bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                  resource: {log.resource}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 4: Authentication & Security Architecture */}
      {/* ======================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-3.5 animate-in fade-in duration-200 text-xs">
          {/* Registered Master Accounts Card */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <h4 className="font-extrabold text-xs text-stone-900">Daftar Akun Master Terdaftar (Root SuperAdmin)</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                Tingkat Akses Tertinggi
              </span>
            </div>

            <div className="space-y-2.5">
              {users
                .filter((u) => u.role === 'PLATFORM_MASTER')
                .map((mUser) => (
                  <div
                    key={mUser.id}
                    className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-purple-950">{mUser.full_name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                          {mUser.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-purple-800 flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />
                        <span>{mUser.email}</span>
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        User ID: {mUser.id} &bull; Terdaftar: {new Date(mUser.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-purple-900 bg-white px-2 py-0.5 rounded-md border border-purple-200 block">
                        Password Login: {mUser.email === 'mdqputra@gmail.com' ? '990830' : 'kopiin123'}
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        Cakupan: Satu-satunya Master Root Controller
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <Lock className="w-4 h-4 text-purple-700" />
              <h4 className="font-bold text-xs text-stone-900">Arsitektur Keamanan KOPIIN Native Auth</h4>
            </div>
            <div className="space-y-2 text-stone-600 text-[11px] leading-relaxed">
              <p className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Zero-Friction Status ACTIVE:</strong> Setiap akun langsung aktif tanpa hambatan verifikasi email atau OTP palsu.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Kriptografi PBKDF2 SHA-256:</strong> Password disimpan dalam bentuk hash + salt acak terproteksi.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Multi-Owner Per Tenant:</strong> 1 tenant dapat memiliki lebih dari 2 akun owner untuk mengakomodasi co-founders & mitra bisnis.</span>
              </p>
            </div>
          </div>
          <div className="p-4 bg-stone-900 text-white rounded-2xl space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Sesi Login Master Aktif</span>
            <p className="text-xs font-semibold text-stone-200">{currentUser.full_name} ({currentUser.email})</p>
            <p className="text-[10px] text-stone-400 font-mono">Role ID: PLATFORM_MASTER &bull; Scope: GLOBAL_TENANT_PROVISIONER</p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Tambah Akun Owner untuk Tenant Tertentu */}
      {/* ======================================================== */}
      {selectedTenantForOwner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-purple-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-300" />
                <div>
                  <h3 className="font-bold text-xs">Tambah Akun Owner Baru</h3>
                  <p className="text-[10px] text-purple-200">Tenant: {selectedTenantForOwner.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTenantForOwner(null)}
                className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateOwnerSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 text-[11px] text-purple-900">
                <p className="font-bold">Dukungan Multi-Owner</p>
                <p className="text-stone-600 mt-0.5">
                  1 tenant dapat memiliki lebih dari 2 akun Owner (Co-Founders, Partner, Investor). Akun langsung berstatus <strong>ACTIVE</strong>.
                </p>
              </div>

              {ownerModalError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{ownerModalError}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-stone-700 block mb-1">Nama Lengkap Owner *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dimas Raditya"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Email Owner (Login) *</label>
                <input
                  type="email"
                  required
                  placeholder="dimas@youngspace.cafe"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Password Sementara *</label>
                  <input
                    type="text"
                    required
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">No. Handphone</label>
                  <input
                    type="text"
                    placeholder="+62 812-..."
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSelectedTenantForOwner(null)}
                  className="px-3.5 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOwner}
                  className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isSubmittingOwner ? 'Membuat...' : 'Buat Akun Owner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
