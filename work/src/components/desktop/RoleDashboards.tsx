import React, { useState } from 'react';
import { 
  Building2, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Boxes, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  Printer, 
  ShieldCheck, 
  Layers, 
  ChefHat, 
  Coffee, 
  CreditCard,
  QrCode,
  Award,
  Sparkles,
  ExternalLink,
  Plus,
  Check,
  X,
  Store,
  UserPlus,
  EyeOff,
  Mail,
  Phone,
  Shield
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { useCafe } from '../../context/CafeContext';
import { Tenant } from '../../types/platform';
import { AttendanceModule } from './AttendanceModule';

interface RoleDashboardsProps {
  onNavigateTab: (tab: any) => void;
  onOpenNewProductModal?: () => void;
  onOpenCashModal?: () => void;
}

export const RoleDashboards: React.FC<RoleDashboardsProps> = ({
  onNavigateTab,
  onOpenNewProductModal,
  onOpenCashModal,
}) => {
  const { 
    currentUser, 
    activeTenant, 
    auditLogs, 
    tenants, 
    registerTenant,
    users,
    getTenantOwners,
    createOwnerForTenant,
    toggleUserStatus
  } = usePlatform();

  // Modal State for Platform Master: Tambah Tenant Baru & Owner Pertama
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [tenantNameInput, setTenantNameInput] = useState('');
  const [tenantSlugInput, setTenantSlugInput] = useState('');
  const [ownerNameInput, setOwnerNameInput] = useState('');
  const [ownerEmailInput, setOwnerEmailInput] = useState('');
  const [ownerPasswordInput, setOwnerPasswordInput] = useState('KopiinOwner2026!');
  const [taxRateInput, setTaxRateInput] = useState('11');
  const [serviceChargeInput, setServiceChargeInput] = useState('5');
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false);
  const [tenantSuccessMsg, setTenantSuccessMsg] = useState<string | null>(null);
  const [tenantErrorMsg, setTenantErrorMsg] = useState<string | null>(null);

  // Modal State for Platform Master: Tambah Akun Owner Tambahan untuk Tenant Tertentu (> 2 Owners)
  const [tenantForNewOwner, setTenantForNewOwner] = useState<Tenant | null>(null);
  const [addOwnerName, setAddOwnerName] = useState('');
  const [addOwnerEmail, setAddOwnerEmail] = useState('');
  const [addOwnerPassword, setAddOwnerPassword] = useState('OwnerPass2026!');
  const [addOwnerPhone, setAddOwnerPhone] = useState('+62 ');
  const [isSubmittingAddOwner, setIsSubmittingAddOwner] = useState(false);
  const [addOwnerError, setAddOwnerError] = useState<string | null>(null);
  const [addOwnerSuccess, setAddOwnerSuccess] = useState<string | null>(null);

  const handleAddOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantForNewOwner) return;
    if (!addOwnerName.trim() || !addOwnerEmail.trim() || !addOwnerPassword.trim()) {
      setAddOwnerError('Nama, email, dan password wajib diisi.');
      return;
    }
    try {
      setIsSubmittingAddOwner(true);
      setAddOwnerError(null);
      await createOwnerForTenant(tenantForNewOwner.id, {
        fullName: addOwnerName.trim(),
        email: addOwnerEmail.trim().toLowerCase(),
        passwordPlainText: addOwnerPassword,
        phone: addOwnerPhone.trim() || undefined,
      });
      setAddOwnerSuccess(`Akun Owner "${addOwnerName}" berhasil ditambahkan ke ${tenantForNewOwner.name}!`);
      setTimeout(() => {
        setAddOwnerSuccess(null);
        setTenantForNewOwner(null);
        setAddOwnerName('');
        setAddOwnerEmail('');
        setAddOwnerPassword('OwnerPass2026!');
        setAddOwnerPhone('+62 ');
      }, 1500);
    } catch (err: any) {
      setAddOwnerError(err.message || 'Gagal menambahkan akun owner.');
    } finally {
      setIsSubmittingAddOwner(false);
    }
  };

  const handleCreateTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantNameInput.trim() || !ownerEmailInput.trim() || !ownerNameInput.trim()) {
      setTenantErrorMsg('Harap lengkapi nama café, nama owner, dan email owner.');
      return;
    }
    setTenantErrorMsg(null);
    setIsSubmittingTenant(true);
    try {
      const slug = tenantSlugInput.trim() || tenantNameInput.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const result = await registerTenant({
        tenantName: tenantNameInput.trim(),
        tenantSlug: slug,
        ownerFullName: ownerNameInput.trim(),
        ownerEmail: ownerEmailInput.trim(),
        ownerPasswordPlainText: ownerPasswordInput || 'KopiinOwner2026!',
        taxRate: parseFloat(taxRateInput) / 100 || 0.11,
        serviceCharge: parseFloat(serviceChargeInput) / 100 || 0.05,
      });
      setTenantSuccessMsg(`Tenant "${result.tenant.name}" & Akun Owner (${result.owner.email}) berhasil dibuat dan LANGSUNG AKTIF!`);
      setTenantNameInput('');
      setTenantSlugInput('');
      setOwnerNameInput('');
      setOwnerEmailInput('');
      setOwnerPasswordInput('KopiinOwner2026!');
      setTimeout(() => {
        setShowAddTenantModal(false);
        setTenantSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      setTenantErrorMsg(err?.message || 'Gagal mendaftarkan tenant.');
    } finally {
      setIsSubmittingTenant(false);
    }
  };

  const {
    orders,
    tables,
    menuItems,
    inventory,
    stockMovements,
    purchaseOrders,
    suppliers,
    attendances,
    financialSummary,
    getMemberBalance,
  } = useCafe();

  const role = currentUser.role;

  // ==========================================
  // 1. MASTER DASHBOARD (Platform Level)
  // ==========================================
  if (role === 'PLATFORM_MASTER') {
    const totalOwners = users.filter(u => u.role === 'TENANT_OWNER');
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl p-6 shadow-md border border-stone-700">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                PLATFORM MASTER CONSOLE
              </span>
              <h2 className="text-xl font-bold tracking-tight">Otoritas Pusat Multi-Tenant KOPIIN</h2>
              <p className="text-xs text-stone-300">
                Penyedia entitas tenant café, registrasi akun Owner multi-user, dan audit tata kelola platform
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-stone-400 block font-mono">SLA SISTEM</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">99.98% ONLINE</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* DATA PRIVACY BANNER: Zero Access to Tenant Financials & Sales Reports */}
        <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl text-xs text-stone-800 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
            <EyeOff className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-amber-950 text-xs uppercase tracking-wide">
              Kebijakan Isolasi Finansial & Kerahasiaan Laporan Penjualan
            </h4>
            <p className="text-[11px] leading-relaxed text-stone-700">
              Platform Master <strong>tidak dapat melihat laporan penjualan, buku kas, maupun rekap omset transaksi tenant</strong>. Hak akses laporan finansial adalah kewenangan eksklusif <strong>Tenant Owner</strong>. Master berperan murni sebagai <strong>pembuat tenant dan pengelola akun Owner</strong> (satu tenant diperbolehkan memiliki lebih dari 2 akun owner).
            </p>
          </div>
        </div>

        {/* Global KPIs (Pure Platform & Accounts, No Sales Metrics) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase">Total Tenant Café</span>
              <Building2 className="w-4 h-4 text-[#4A2E1B]" />
            </div>
            <div className="text-2xl font-mono font-extrabold text-[#1F1E1D]">{tenants.length} Café</div>
            <span className="text-[11px] text-emerald-700 font-semibold">100% Aktif & Terverifikasi</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase">Total Akun Owner</span>
              <Shield className="w-4 h-4 text-purple-700" />
            </div>
            <div className="text-2xl font-mono font-extrabold text-[#1F1E1D]">
              {totalOwners.length} Akun
            </div>
            <span className="text-[11px] text-purple-700 font-semibold">Mendukung &gt; 2 Owner / Tenant</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase">Total Akun Pengguna</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-mono font-extrabold text-[#1F1E1D]">{users.length} Akun</div>
            <span className="text-[11px] text-stone-500">Owner, Staf, & Member Aktif</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase">Audit Trail Realtime</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-mono font-extrabold text-[#1F1E1D]">{auditLogs.length} Aksi</div>
            <span className="text-[11px] text-stone-500 font-mono">Integritas SHA-256</span>
          </div>
        </div>

        {/* Master Tenant Directory & Multi-Owner Management */}
        <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#1F1E1D]">Direktori Tenant Café & Manajemen Akun Owner</h3>
              <p className="text-xs text-stone-500">
                Pusat pembuatan tenant café dan pendaftaran akun Owner (1 tenant boleh memiliki lebih dari 2 akun owner)
              </p>
            </div>
            <button
              onClick={() => setShowAddTenantModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4A2E1B] hover:bg-[#341F12] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Tenant Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((t) => {
              const isSelected = activeTenant?.id === t.id;
              const tenantOwners = getTenantOwners(t.id);
              return (
                <div
                  key={t.id}
                  className={`p-4 border rounded-2xl flex flex-col justify-between transition ${
                    isSelected 
                      ? 'bg-[#F5EFE6]/60 border-[#4A2E1B]/40 ring-1 ring-[#4A2E1B]/20' 
                      : 'bg-[#FAF8F5] border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div>
                    {/* Tenant Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#4A2E1B] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-[#1F1E1D]">{t.name}</h4>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 bg-[#4A2E1B] text-white text-[9px] font-mono rounded">
                                AKTIF
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-500 font-mono">
                            Slug: /{t.slug} • PB1: {((t.settings?.tax_rate || 0) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full font-mono">
                        ACTIVE
                      </span>
                    </div>

                    {/* Owner Accounts List */}
                    <div className="mt-3.5 pt-3 border-t border-stone-200/80">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#4A2E1B]" />
                          <span className="text-[11px] font-bold text-stone-800">
                            Akun Owner ({tenantOwners.length})
                          </span>
                          <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-semibold">
                            Boleh &gt; 2
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setTenantForNewOwner(t);
                            setAddOwnerError(null);
                            setAddOwnerSuccess(null);
                          }}
                          className="text-[11px] font-bold text-[#4A2E1B] hover:text-[#341F12] bg-white border border-stone-200 hover:border-stone-300 px-2 py-1 rounded-lg transition inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>+ Tambah Owner</span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {tenantOwners.map((owner, idx) => (
                          <div
                            key={owner.id}
                            className="p-2 bg-white rounded-xl border border-stone-200/70 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-stone-900 truncate leading-tight text-[11px]">
                                  {owner.full_name}
                                </p>
                                <p className="text-[10px] text-stone-500 font-mono truncate leading-none">
                                  {owner.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                owner.status === 'ACTIVE' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {owner.status}
                              </span>
                              <button
                                onClick={() => toggleUserStatus(owner.id)}
                                className="text-[9px] font-semibold text-stone-500 hover:text-stone-800 px-1.5 py-0.5 rounded border border-stone-200 hover:bg-stone-50 cursor-pointer"
                              >
                                {owner.status === 'ACTIVE' ? 'Suspend' : 'Aktifkan'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tenant Isolation Status */}
                  <div className="mt-3.5 pt-2.5 border-t border-stone-200/70 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500">Status Isolasi</span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Terisolasi Penuh
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Tambah Akun Owner Tambahan untuk Tenant Tertentu */}
        {tenantForNewOwner && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 bg-[#4A2E1B] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-300" />
                  <div>
                    <h3 className="font-bold text-sm">Tambah Akun Owner Baru</h3>
                    <p className="text-[11px] text-amber-200/80">Tenant: {tenantForNewOwner.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setTenantForNewOwner(null)}
                  className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddOwnerSubmit} className="p-6 space-y-3.5 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-stone-700 space-y-1">
                  <p className="font-bold text-amber-900 text-xs">Dukungan Multi-Owner per Tenant</p>
                  <p className="text-[11px] text-stone-600">
                    Satu tenant dapat memiliki lebih dari 2 akun owner (Co-Founders, Partner Bisnis, Investor). Akun langsung berstatus <strong>ACTIVE</strong> dengan enkripsi PBKDF2 SHA-256.
                  </p>
                </div>

                {addOwnerSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{addOwnerSuccess}</span>
                  </div>
                )}
                {addOwnerError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{addOwnerError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nama Lengkap Owner *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dimas Raditya (Co-Founder)"
                    value={addOwnerName}
                    onChange={(e) => setAddOwnerName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#4A2E1B] focus:border-transparent outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email Owner (Login) *</label>
                  <input
                    type="email"
                    required
                    placeholder="dimas@youngspace.cafe"
                    value={addOwnerEmail}
                    onChange={(e) => setAddOwnerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#4A2E1B] focus:border-transparent outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Password Sementara *</label>
                    <input
                      type="text"
                      required
                      value={addOwnerPassword}
                      onChange={(e) => setAddOwnerPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#4A2E1B] focus:border-transparent outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">No. Handphone</label>
                    <input
                      type="text"
                      placeholder="+62 812-..."
                      value={addOwnerPhone}
                      onChange={(e) => setAddOwnerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#4A2E1B] focus:border-transparent outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setTenantForNewOwner(null)}
                    className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl font-semibold text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAddOwner}
                    className="px-5 py-2 bg-[#4A2E1B] hover:bg-[#341F12] text-white rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isSubmittingAddOwner ? 'Menyimpan...' : 'Tambahkan Akun Owner'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Tambah Tenant & Owner Baru (Platform Master) */}
        {showAddTenantModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 bg-[#4A2E1B] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-300" />
                  <div>
                    <h3 className="font-bold text-sm">Pendaftaran Tenant Café & Owner</h3>
                    <p className="text-[11px] text-amber-200/80">Sistem Akun KOPIIN – Langsung Aktif tanpa Approval</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddTenantModal(false)}
                  className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTenantSubmit} className="p-6 space-y-4 text-xs">
                {tenantSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{tenantSuccessMsg}</span>
                  </div>
                )}
                {tenantErrorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{tenantErrorMsg}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-stone-400">1. Data Entitas Café (Tenant)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Nama Café / Brand *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Kopi Titik Temu"
                        value={tenantNameInput}
                        onChange={(e) => {
                          setTenantNameInput(e.target.value);
                          if (!tenantSlugInput) {
                            setTenantSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                          }
                        }}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#4A2E1B] focus:border-transparent outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Slug URL Tenant *</label>
                      <input
                        type="text"
                        required
                        placeholder="kopi-titik-temu"
                        value={tenantSlugInput}
                        onChange={(e) => setTenantSlugInput(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#4A2E1B] focus:border-transparent outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Tarif Pajak (PPN %)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={taxRateInput}
                        onChange={(e) => setTaxRateInput(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#4A2E1B] focus:border-transparent outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Service Charge (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={serviceChargeInput}
                        onChange={(e) => setServiceChargeInput(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#4A2E1B] focus:border-transparent outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 space-y-3">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-stone-400">2. Akun Pemilik Utama (Tenant Owner)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Nama Lengkap Owner *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama pemilik café"
                        value={ownerNameInput}
                        onChange={(e) => setOwnerNameInput(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#4A2E1B] focus:border-transparent outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Email Owner (Login) *</label>
                      <input
                        type="email"
                        required
                        placeholder="owner@cafe.id"
                        value={ownerEmailInput}
                        onChange={(e) => setOwnerEmailInput(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-[#4A2E1B] focus:border-transparent outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Password Sementara Owner</label>
                    <input
                      type="text"
                      value={ownerPasswordInput}
                      onChange={(e) => setOwnerPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#4A2E1B] focus:border-transparent outline-hidden"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">
                      Password di-hash dengan PBKDF2 SHA-256 dan akun langsung berstatus ACTIVE.
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setShowAddTenantModal(false)}
                    className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl font-semibold text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTenant}
                    className="px-5 py-2 bg-[#4A2E1B] hover:bg-[#341F12] text-white rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingTenant ? (
                      <span>Memproses...</span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Daftarkan Tenant & Owner</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 2. OWNER DASHBOARD (Business & Revenue)
  // ==========================================
  if (role === 'TENANT_OWNER') {
    return (
      <div className="space-y-6">
        {/* Top Metric Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase">Omzet Penjualan Hari Ini</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold text-[#1F1E1D]">
              Rp{financialSummary.totalGrossRevenue.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-500">
              <span>HPP Modal: Rp{financialSummary.totalCOGS.toLocaleString('id-ID')}</span>
              <span className="font-bold text-[#15803D]">+{financialSummary.profitMarginPercent}% Margin</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase">Laba Bersih Kotor</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold text-[#15803D]">
              Rp{financialSummary.grossProfit.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-stone-500">
              Penjualan setelah dipotong biaya bahan baku riil
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase">Kas Fisik Laci Kasir</span>
              <div className="w-8 h-8 rounded-xl bg-[#4A2E1B]/10 text-[#4A2E1B] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold text-[#4A2E1B]">
              Rp{(financialSummary.realCashReceived + financialSummary.cashInHand).toLocaleString('id-ID')}
            </div>
            <div className="flex justify-between text-[11px] text-stone-500">
              <span>Tunai: Rp{financialSummary.realCashReceived.toLocaleString('id-ID')}</span>
              <button
                onClick={onOpenCashModal}
                className="text-amber-800 font-bold hover:underline cursor-pointer"
              >
                Mutasi Kas &gt;
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase">Penerimaan Non-Tunai</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono font-extrabold text-blue-900">
              Rp{financialSummary.nonCashReceived.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-stone-500">
              QRIS & Kartu EDC (Diskon Poin: Rp{financialSummary.pointLiabilityRedeemed.toLocaleString('id-ID')})
            </p>
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onOpenNewProductModal}
            className="p-4 bg-white border border-[#E5DFD7] hover:border-[#4A2E1B] rounded-2xl shadow-xs text-left transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Plus className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-[#1F1E1D] group-hover:text-[#4A2E1B]">Tambah Menu Baru</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">Input HPP modal, harga jual, dan hitung persentase margin otomatis</p>
          </button>

          <button
            onClick={() => onNavigateTab('reports')}
            className="p-4 bg-white border border-[#E5DFD7] hover:border-[#4A2E1B] rounded-2xl shadow-xs text-left transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-[#1F1E1D] group-hover:text-[#4A2E1B]">Laporan Finansial</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">Analisis pendapatan per periode (Harian, Mingguan, Bulanan) dan ekspor CSV</p>
          </button>

          <button
            onClick={() => onNavigateTab('staff')}
            className="p-4 bg-white border border-[#E5DFD7] hover:border-[#4A2E1B] rounded-2xl shadow-xs text-left transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-[#1F1E1D] group-hover:text-[#4A2E1B]">Kelola Karyawan</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">Tambah staf kasir/barista/stokis dan pantau absensi selfie hari ini</p>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. MANAGER DASHBOARD (Operations & Staff)
  // ==========================================
  if (role === 'TENANT_MANAGER') {
    const activeOrders = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'VOIDED');
    const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED');
    const presentStaffToday = attendances.filter(
      (a) => a.date === new Date().toISOString().split('T')[0]
    );

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Pesanan Sedang Diproses</span>
            <div className="text-2xl font-mono font-extrabold text-[#4A2E1B]">{activeOrders.length} Order</div>
            <span className="text-[11px] text-amber-700 font-semibold">Menunggu Barista / Antrean Kasir</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Okupansi Meja Café</span>
            <div className="text-2xl font-mono font-extrabold text-[#1F1E1D]">
              {occupiedTables.length} / {tables.length}
            </div>
            <span className="text-[11px] text-stone-500">
              {tables.length - occupiedTables.length} Meja siap digunakan pelanggan
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Kehadiran Staf Hari Ini</span>
            <div className="text-2xl font-mono font-extrabold text-[#15803D]">
              {presentStaffToday.length} Hadir
            </div>
            <span className="text-[11px] text-stone-500">
              {presentStaffToday.filter((p) => p.status === 'ON_TIME').length} Tepat Waktu
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Peringatan Stok Rendah</span>
            <div className="text-2xl font-mono font-extrabold text-red-600">
              {inventory.filter((i) => i.status === 'LOW_STOCK').length} Item
            </div>
            <span className="text-[11px] text-stone-500">Perlu restock dari supplier</span>
          </div>
        </div>

        {/* Operational Queues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Active Orders Quick List */}
          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1F1E1D]">Antrean Pesanan Aktif</h3>
              <button
                onClick={() => onNavigateTab('orders')}
                className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
              >
                Lihat Semua &gt;
              </button>
            </div>
            <div className="space-y-2">
              {activeOrders.slice(0, 4).map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 bg-[#FAF8F5] border border-stone-200 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-xs text-[#4A2E1B]">
                      {ord.order_number}
                    </span>
                    <p className="text-[11px] text-stone-600 font-medium">
                      {ord.customer_name} ({ord.order_type} {ord.table_number || ''})
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                    {ord.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Staff Check-in */}
          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1F1E1D]">Absensi Selfie Staf Hari Ini</h3>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
              >
                Modul Absensi &gt;
              </button>
            </div>
            <div className="space-y-2">
              {presentStaffToday.slice(0, 4).map((att) => (
                <div
                  key={att.id}
                  className="p-2.5 bg-[#FAF8F5] border border-stone-200 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={att.photo_url}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover border border-stone-300"
                    />
                    <div>
                      <span className="font-bold text-xs text-[#1F1E1D] block">{att.staff_name}</span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        In: {new Date(att.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      att.status === 'ON_TIME'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {att.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. CASHIER DASHBOARD (POS & Payments)
  // ==========================================
  if (role === 'STAFF_CASHIER') {
    return (
      <div className="space-y-6">
        <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4A2E1B] text-white">
              TERMINAL KASIR AKTIF
            </span>
            <h2 className="text-lg font-bold text-[#1F1E1D]">Shift Kasir: {currentUser.full_name}</h2>
            <p className="text-xs text-stone-500">Buka pesanan meja, terima uang tunai & QRIS, dan catat mutasi laci</p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="px-4 py-2.5 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buka Order POS</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Kas Tunai Masuk Shift Ini</span>
            <div className="text-2xl font-mono font-extrabold text-[#15803D]">
              Rp{financialSummary.realCashReceived.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-stone-500">Tersimpan dalam laci fisik kasir</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Transaksi Non-Tunai</span>
            <div className="text-2xl font-mono font-extrabold text-blue-800">
              Rp{financialSummary.nonCashReceived.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-stone-500">QRIS & Kartu EDC</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Meja Tersedia</span>
            <div className="text-2xl font-mono font-extrabold text-[#1F1E1D]">
              {tables.filter((t) => t.status === 'AVAILABLE').length} Meja
            </div>
            <span className="text-[11px] text-stone-500">Dapat dialokasikan ke pelanggan walk-in</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 5. STOKIS DASHBOARD (Inventory & Gudang)
  // ==========================================
  if (role === 'STAFF_STOKIS') {
    const lowStockItems = inventory.filter((i) => i.status === 'LOW_STOCK');
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-800 text-white">
              GUDANG & INVENTORY
            </span>
            <h2 className="text-lg font-bold text-[#1F1E1D] mt-1">Dashboard Pengawasan Stok Bahan Baku</h2>
            <p className="text-xs text-stone-500">Monitoring stok real-time, penerimaan barang masuk, dan audit fisik opname</p>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Boxes className="w-4 h-4" />
            <span>Kelola Inventory Lengkap</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Total Item Bahan Baku</span>
            <div className="text-2xl font-mono font-extrabold text-[#1F1E1D]">{inventory.length} SKU</div>
            <span className="text-[11px] text-stone-500">Biji Kopi, Susu, Sirup, Cup</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Stok Menipis</span>
            <div className="text-2xl font-mono font-extrabold text-red-600">{lowStockItems.length} Item</div>
            <span className="text-[11px] text-stone-500">Di bawah ambang batas minimum</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Purchase Order Aktif</span>
            <div className="text-2xl font-mono font-extrabold text-amber-700">{purchaseOrders.length} PO</div>
            <span className="text-[11px] text-stone-500">Pesanan barang ke supplier</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
            <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Mitra Supplier</span>
            <div className="text-2xl font-mono font-extrabold text-[#1F1E1D]">{suppliers.length} Vendor</div>
            <span className="text-[11px] text-stone-500">Roastery & Distributor Resmi</span>
          </div>
        </div>

        {/* Low stock alerts table */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Peringatan Bahan Baku Kritis (Harus Segera Dipesan)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lowStockItems.map((it) => (
                <div key={it.id} className="p-3 bg-white border border-red-200 rounded-xl flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-xs text-[#1F1E1D]">{it.name}</h5>
                    <p className="text-[10px] text-stone-500">Kategori: {it.category} • SKU: {it.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-sm text-red-600">
                      {it.current_stock} {it.unit}
                    </span>
                    <span className="block text-[10px] text-stone-400">Min: {it.minimum_stock} {it.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // STAFF (Khusus Hanya Absensi)
  // ==========================================
  if (role === 'STAFF') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-800 text-white">
              PORTAL STAFF ABSENSI
            </span>
            <h2 className="text-lg font-bold text-[#1F1E1D] mt-1">Presensi Mandiri Pegawai Café</h2>
            <p className="text-xs text-stone-500">Pencatatan jam hadir (Clock In), jam pulang (Clock Out), selfie verifikasi & riwayat kehadiran</p>
          </div>
        </div>
        <AttendanceModule />
      </div>
    );
  }

  // ==========================================
  // 6. MEMBER DASHBOARD (Loyalty & Points)
  // ==========================================
  const memberPoints = getMemberBalance(currentUser.id);
  return (
    <div className="space-y-6">
      {/* Member Card */}
      <div className="bg-gradient-to-br from-stone-900 via-[#361F12] to-stone-950 text-white rounded-3xl p-7 shadow-xl border border-amber-900/40 relative overflow-hidden">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                GOLD MEMBER
              </span>
              <span className="text-xs text-amber-200/70 font-mono">KOPIIN LOYALTY CLUB</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">{currentUser.full_name}</h2>
            <p className="text-xs text-stone-300 font-mono mt-0.5">{currentUser.email}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Award className="w-7 h-7 text-amber-400" />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 relative z-10">
          <div>
            <span className="text-[11px] text-stone-400 uppercase font-bold block mb-1">
              Saldo Poin Reward Aktif
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-extrabold text-amber-400">
                {memberPoints.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-semibold text-stone-300">Poin KOPIIN</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Setara diskon <strong>Rp{(memberPoints * 100).toLocaleString('id-ID')}</strong> saat memesan di kasir
            </p>
          </div>
          <div className="bg-white p-2 rounded-xl">
            <QrCode className="w-16 h-16 text-stone-900" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs">
        <h3 className="font-bold text-sm text-[#1F1E1D] mb-3">Keuntungan Member Anda</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200">
            <span className="font-bold text-amber-900 block mb-1">Cashback 5% Tiap Pembelian</span>
            <p className="text-[11px] text-stone-500">Tiap belanja Rp10.000 mendapatkan 5 poin rewards.</p>
          </div>
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200">
            <span className="font-bold text-amber-900 block mb-1">Tukar Poin Langsung di Kasir</span>
            <p className="text-[11px] text-stone-500">1 Poin = Potongan Rp100 tanpa minimum pembelanjaan.</p>
          </div>
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200">
            <span className="font-bold text-amber-900 block mb-1">Voucher Ulang Tahun</span>
            <p className="text-[11px] text-stone-500">Gratis 1 cup Signature Drink di bulan ulang tahun Anda.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
