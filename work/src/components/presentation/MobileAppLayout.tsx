import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { useCafe } from '../../context/CafeContext';
import { PlatformMasterView } from '../roles/PlatformMasterView';
import { TenantOwnerView } from '../roles/TenantOwnerView';
import { TenantManagerView } from '../roles/TenantManagerView';
import { StaffCashierView } from '../roles/StaffCashierView';
import { StaffBaristaView } from '../roles/StaffBaristaView';
import { StaffStokisView } from '../roles/StaffStokisView';
import { StaffAbsensiView } from '../roles/StaffAbsensiView';
import { MemberView } from '../roles/MemberView';
import { GuestView } from '../roles/GuestView';
import { ProductManagementModal } from '../desktop/ProductManagementModal';
import { AttendanceModule } from '../desktop/AttendanceModule';
import { OfflineIndicator } from '../common/OfflineIndicator';

import { PWAInstallButton } from '../common/PWAInstallButton';
import { PrinterSettingsModal } from '../common/PrinterSettingsModal';
import {
  Coffee,
  ShoppingBag,
  LayoutDashboard,
  Boxes,
  Users,
  Clock,
  Award,
  Menu,
  X,
  Store,
  Layers,
  Flame,
  CheckCircle2,
  FileText,
  UserCheck,
  Smartphone,
  Maximize2,
  Minimize2,
  Shield,
  HelpCircle,
  Truck,
  Printer,
  LogOut
} from 'lucide-react';

interface Props {
  onOpenRoleSwitcher?: () => void;
  onOpenArchitectureModal: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const MobileAppLayout: React.FC<Props> = ({
  onOpenRoleSwitcher,
  onOpenArchitectureModal,
  showToast,
}) => {
  const {
    currentUser,
    activeTenant,
    switchUserRole,
    logout,
  } = usePlatform();

  const {
    categories,
    addMenuItem,
    updateMenuItem,
    addCategory,
    orders,
    inventory,
  } = useCafe();

  // Mobile navigation drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Printer settings modal state
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  // Logout confirm modal state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // View mode on desktop/laptop: 'frame' (smartphone mockup) or 'full' (stretched full-width mobile layout)
  const [deviceFrameMode, setDeviceFrameMode] = useState<'frame' | 'full'>('frame');

  // Sub-tab navigation for roles
  const [activeTab, setActiveTab] = useState<string>('primary');

  // Product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Current role
  const role = currentUser.role;

  // Reset tab when role changes
  useEffect(() => {
    setActiveTab('primary');
  }, [role]);

  // Realtime clock for status bar
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  // Badge calculations
  const pendingOrdersCount = orders.filter((o) => o.status === 'ACCEPTED' || o.status === 'IN_PROCESS').length;
  const lowStockCount = inventory.filter((i) => i.current_stock <= i.minimum_stock).length;

  // Role display label
  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'PLATFORM_MASTER': return { label: 'Platform Master', color: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'TENANT_OWNER': return { label: 'Owner Café', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'TENANT_MANAGER': return { label: 'Manager Café', color: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'STAFF_CASHIER': return { label: 'Kasir POS', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'STAFF_BARISTA': return { label: 'Barista (KDS)', color: 'bg-orange-100 text-orange-900 border-orange-300' };
      case 'STAFF_STOKIS': return { label: 'Stokis Gudang', color: 'bg-cyan-100 text-cyan-900 border-cyan-300' };
      case 'STAFF': return { label: 'Staff (Absensi)', color: 'bg-violet-100 text-violet-900 border-violet-300' };
      case 'MEMBER': return { label: 'Member VIP', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'GUEST': return { label: 'Pelanggan Tamu', color: 'bg-stone-100 text-stone-800 border-stone-300' };
      default: return { label: r, color: 'bg-stone-100 text-stone-800 border-stone-300' };
    }
  };

  const roleBadge = getRoleBadge(role);

  // Dynamic bottom navigation items based on current role
  const getBottomNavItems = () => {
    switch (role) {
      case 'STAFF_CASHIER':
        return [
          { id: 'primary', label: 'Kasir POS', icon: ShoppingBag },
          { id: 'kds', label: 'Antrean KDS', icon: Coffee, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
          { id: 'attendance', label: 'Absensi', icon: Clock },
        ];
      case 'STAFF_BARISTA':
        return [
          { id: 'primary', label: 'Antrean KDS', icon: Flame, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
          { id: 'attendance', label: 'Absensi', icon: Clock },
        ];
      case 'STAFF_STOKIS':
        return [
          { id: 'primary', label: 'Gudang Stok', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined },
          { id: 'attendance', label: 'Absensi', icon: Clock },
        ];
      case 'STAFF':
        return [
          { id: 'primary', label: 'Absensi Staf', icon: Clock },
        ];
      case 'TENANT_OWNER':
        return [
          { id: 'primary', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'pos', label: 'Kasir POS', icon: ShoppingBag },
          { id: 'kds', label: 'KDS Dapur', icon: Coffee, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
          { id: 'attendance', label: 'Absensi', icon: Clock },
        ];
      case 'TENANT_MANAGER':
        return [
          { id: 'primary', label: 'Manajemen', icon: LayoutDashboard },
          { id: 'attendance', label: 'Absensi', icon: Clock },
        ];

      case 'PLATFORM_MASTER':
        return [
          { id: 'primary', label: 'Master SaaS', icon: Store },
          { id: 'attendance', label: 'Absensi Tim', icon: Clock },
        ];
      case 'MEMBER':
        return [
          { id: 'primary', label: 'Menu & Kartu', icon: Award },
        ];
      case 'GUEST':
      default:
        return [
          { id: 'primary', label: 'Menu Café', icon: Coffee },
        ];
    }
  };

  const navItems = getBottomNavItems();

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-stone-950 text-stone-900 flex flex-col items-center justify-start md:justify-center md:p-4 selection:bg-amber-800 selection:text-white overflow-hidden">
      {/* Top Floating Controls on Desktop */}
      <div className="hidden md:flex items-center justify-between w-full max-w-[430px] mb-2 px-2 text-stone-400 text-xs shrink-0">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-semibold text-stone-300">KOPIIN Full Mobile Experience</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDeviceFrameMode(prev => prev === 'frame' ? 'full' : 'frame')}
            className="flex items-center gap-1 hover:text-white px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 transition cursor-pointer"
            title="Toggle smartphone mockup frame"
          >
            {deviceFrameMode === 'frame' ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            <span>{deviceFrameMode === 'frame' ? 'Layar Penuh' : 'Frame HP'}</span>
          </button>
        </div>
      </div>

      {/* Main Mobile App Container */}
      <div
        className={`w-full bg-[#FDFBF7] flex flex-col overflow-hidden relative shadow-2xl transition-all duration-300 ${
          deviceFrameMode === 'frame'
            ? 'h-[100dvh] max-h-[100dvh] md:max-w-[430px] md:h-[890px] md:rounded-[44px] md:border-8 md:border-stone-800'
            : 'w-full max-w-2xl h-[100dvh] max-h-[100dvh] md:h-[94vh] md:rounded-2xl md:border border-stone-800'
        }`}
      >
        {/* Native Mobile Status Bar (Android / iOS Style) */}
        <div className="px-5 pt-3 pb-2 bg-[#FAF8F5] border-b border-stone-200/80 flex items-center justify-between text-xs text-stone-800 select-none shrink-0 z-30">
          <span className="font-mono font-bold text-xs tracking-tight">{currentTime || '09:41'}</span>
          {/* Dynamic Island / Speaker Pill */}
          <div className="w-20 h-4 bg-stone-900 rounded-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5 text-stone-600 text-[10px] font-semibold">
            <OfflineIndicator />
          </div>
        </div>

        {/* Mobile Sticky Header */}
        <header className="px-4 py-2.5 bg-gradient-to-r from-[#3D2616] to-[#4A2E1B] text-white flex items-center justify-between shadow-md shrink-0 z-20">
          {/* Brand & Active Tenant */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 -ml-1 text-amber-200 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-200 shrink-0">
                <Store className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="font-black text-xs text-white tracking-tight truncate block max-w-[130px] sm:max-w-[200px]">
                  {role === 'PLATFORM_MASTER' ? 'KOPIIN Platform' : activeTenant?.name || 'KOPIIN Café'}
                </span>
                <span className="text-[9px] text-amber-200/80 block leading-tight font-medium">
                  {role === 'PLATFORM_MASTER' ? 'Master Admin' : 'Cabang Terisolasi'}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons: Printer POS & User Badge & Logout */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPrinterModal(true)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 hover:text-white transition cursor-pointer"
              title="Pengaturan Printer Kasir (Bluetooth & Kabel)"
            >
              <Printer className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/10 border border-white/20 text-white text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="max-w-[70px] sm:max-w-[100px] truncate">{roleBadge.label}</span>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-[11px] font-bold transition cursor-pointer shadow-xs shrink-0"
              title="Keluar dari Akun (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Dynamic Mobile Viewport Content - Only this section scrolls! */}
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 pt-3 pb-6 space-y-4">
          {/* Main Role Content based on active navigation tab */}
          {activeTab === 'primary' && (
            <>
              {role === 'PLATFORM_MASTER' && (
                <PlatformMasterView
                  onOpenAddTenant={() => {}}
                  showToast={showToast}
                />
              )}

              {role === 'TENANT_OWNER' && (
                <TenantOwnerView
                  onOpenNewProduct={() => setShowProductModal(true)}
                  onOpenCashModal={() => {}}
                  showToast={showToast}
                />
              )}

              {role === 'TENANT_MANAGER' && (
                <TenantManagerView showToast={showToast} />
              )}

              {role === 'STAFF_CASHIER' && (
                <StaffCashierView showToast={showToast} />
              )}

              {role === 'STAFF_BARISTA' && (
                <StaffBaristaView showToast={showToast} />
              )}

              {role === 'STAFF_STOKIS' && (
                <StaffStokisView showToast={showToast} />
              )}

              {role === 'STAFF' && (
                <StaffAbsensiView showToast={showToast} />
              )}

              {role === 'MEMBER' && (
                <MemberView showToast={showToast} />
              )}

              {role === 'GUEST' && (
                <GuestView
                  onRegisterMember={onOpenRoleSwitcher}
                  showToast={showToast}
                />
              )}
            </>
          )}

          {/* Secondary Sub-views for Manager & Owner on Mobile */}
          {activeTab === 'pos' && (
            <StaffCashierView showToast={showToast} />
          )}

          {activeTab === 'kds' && (
            <StaffBaristaView showToast={showToast} />
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4">
                <h3 className="font-extrabold text-sm text-[#1F1E1D]">Presensi & Absensi Pegawai Mobile</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Foto selfie verifikasi jam masuk & pulang terintegrasi Supabase Storage.
                </p>
              </div>
              <AttendanceModule />
            </div>
          )}
        </main>

        {/* Permanently Pinned Bottom Navigation Bar */}
        <footer className="shrink-0 bg-white/95 backdrop-blur-md border-t border-stone-200 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] select-none">
          {navItems.length > 1 && (
            <nav className="py-2 px-3 flex items-center justify-around">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer relative active:scale-95 ${
                      isActive
                        ? 'text-amber-900 font-bold'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <div className="relative">
                      <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                      {item.badge !== undefined && (
                        <span className="absolute -top-1 -right-2.5 bg-red-600 text-white text-[9px] font-black rounded-full px-1 min-w-[14px] h-[14px] flex items-center justify-center shadow-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-800 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Android Gesture Bar */}
          <div className="pb-2 pt-0.5 flex justify-center items-center">
            <div className="w-28 h-1 bg-stone-300 rounded-full" />
          </div>
        </footer>


        {/* Slide-over Mobile Navigation Drawer */}
        {isDrawerOpen && (
          <div className="absolute inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
            />

            {/* Drawer Panel */}
            <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-5 z-10 animate-in slide-in-from-left duration-200 overflow-y-auto">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#4A2E1B] text-amber-200 flex items-center justify-center font-black text-sm">
                      K
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#1F1E1D]">KOPIIN App</h3>
                      <span className="text-[10px] text-stone-500">Mobile Edition v2.4</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Current User Card */}
                <div className="my-4 p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-amber-800 text-white font-black text-sm flex items-center justify-center">
                      {currentUser.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-[#1F1E1D] truncate">{currentUser.full_name}</h4>
                      <p className="text-[10px] text-stone-500 truncate">{currentUser.email}</p>
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full border mt-1 ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation Menu */}
                <div className="space-y-1 text-xs">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 py-1">
                    Aksi & Navigasi
                  </div>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setShowPrinterModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-100 font-semibold cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-amber-800" />
                    <span>Pengaturan Printer (BT & Kabel)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenArchitectureModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-100 font-semibold cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-amber-800" />
                    <span>Arsitektur & Spesifikasi</span>
                  </button>

                  <div className="pt-3 pb-1">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 py-1">
                      PWA & Integrasi
                    </div>
                    <div className="px-2 py-1">
                      <PWAInstallButton />
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer with Logout Action */}
              <div className="pt-3 border-t border-stone-200 space-y-2">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 transition cursor-pointer text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Akun (Logout)</span>
                </button>
                <p className="text-[10px] text-stone-400 text-center">
                  KOPIIN Café Platform • Akun Terisolasi
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-stone-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 mx-auto flex items-center justify-center font-bold">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#1F1E1D]">Konfirmasi Keluar</h4>
              <p className="text-xs text-stone-500 mt-1">
                Anda akan keluar dari sesi akun <strong>{currentUser.full_name}</strong>. Anda dapat masuk kembali atau memilih akun lain di halaman login.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  showToast('Anda telah keluar dari akun.', 'info');
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer shadow-xs"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printer Settings Modal */}
      <PrinterSettingsModal
        isOpen={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        showToast={showToast}
      />

      {/* Product Management Modal */}
      <ProductManagementModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        initialProduct={editingProduct}
        categories={categories}
        onSave={(data) => {
          addMenuItem(data);
          showToast(`Menu "${data.name}" berhasil dibuat!`);
        }}
        onUpdate={(id, data) => {
          updateMenuItem(id, data);
          showToast('Menu berhasil diperbarui!');
        }}
        onAddCategory={(cat) => addCategory(cat)}
      />
    </div>
  );
};
