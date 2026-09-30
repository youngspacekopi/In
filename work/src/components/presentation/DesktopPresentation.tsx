import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { useCafe } from '../../context/CafeContext';
import { RoleDashboards } from '../desktop/RoleDashboards';
import { AttendanceModule } from '../desktop/AttendanceModule';
import { FinancialReportsModule } from '../desktop/FinancialReportsModule';
import { StaffCashierView } from '../roles/StaffCashierView';
import { StaffBaristaView } from '../roles/StaffBaristaView';
import { StaffStokisView } from '../roles/StaffStokisView';
import { MemberView } from '../roles/MemberView';
import { GuestView } from '../roles/GuestView';
import { ProductManagementModal } from '../desktop/ProductManagementModal';
import { 
  TrendingUp, 
  ShoppingBag, 
  Coffee, 
  Boxes, 
  Users, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Plus, 
  DollarSign, 
  ArrowRightLeft,
  ChevronRight,
  FileSpreadsheet,
  X
} from 'lucide-react';

interface Props {
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const DesktopPresentation: React.FC<Props> = ({ showToast }) => {
  const { currentUser, activeTenant, users } = usePlatform();
  const { 
    menuItems, 
    categories, 
    addMenuItem, 
    updateMenuItem, 
    addCategory, 
    addCashMovement 
  } = useCafe();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'inventory' | 'attendance' | 'reports' | 'staff'>('dashboard');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Cash Modal
  const [showCashModal, setShowCashModal] = useState(false);
  const [mutationType, setMutationType] = useState<'KAS_MASUK' | 'KAS_KELUAR'>('KAS_KELUAR');
  const [mutationAmount, setMutationAmount] = useState<number>(50000);
  const [mutationCategory, setMutationCategory] = useState('Beli Es Batu / Galon');
  const [mutationNotes, setMutationNotes] = useState('');

  const handleCashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutationAmount || mutationAmount <= 0) return;
    addCashMovement({
      movement_type: mutationType,
      category: mutationCategory,
      amount: Number(mutationAmount),
      notes: mutationNotes,
    });
    showToast(`Mutasi kas ${mutationType === 'KAS_MASUK' ? 'Masuk' : 'Keluar'} Rp${mutationAmount.toLocaleString('id-ID')} berhasil dicatat!`);
    setShowCashModal(false);
    setMutationNotes('');
  };

  const role = currentUser.role;

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {/* Desktop Sidebar (Wide Navigation) */}
      <aside className="w-64 bg-white border-r border-[#E5DFD7] flex flex-col justify-between shrink-0 p-4">
        <div className="space-y-6">
          {/* Outlet Info */}
          <div className="p-3 bg-[#FAF8F5] border border-[#E5DFD7] rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A2E1B] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {activeTenant?.name ? activeTenant.name.slice(0, 2).toUpperCase() : 'KP'}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-xs text-[#1F1E1D] truncate">
                {activeTenant?.name || 'KOPIIN Café'}
              </h3>
              <p className="text-[10px] text-stone-500 font-mono truncate">
                PB1: {((activeTenant?.settings?.tax_rate || 0.11) * 100)}%
              </p>
            </div>
          </div>

          {/* Navigation Links based on role */}
          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#4A2E1B] text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Dashboard ({currentUser.role})</span>
            </button>

            {(role === 'STAFF_CASHIER' || role === 'TENANT_OWNER' || role === 'TENANT_MANAGER') && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#4A2E1B] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Kasir POS & Transaksi</span>
              </button>
            )}

            {(role === 'TENANT_OWNER' || role === 'TENANT_MANAGER') && (
              <button
                onClick={() => setActiveTab('menu')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'menu'
                    ? 'bg-[#4A2E1B] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>Menu & Resep HPP</span>
              </button>
            )}

            {(role === 'TENANT_OWNER' || role === 'TENANT_MANAGER' || role === 'STAFF_STOKIS') && (
              <button
                onClick={() => setActiveTab('inventory')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'bg-[#4A2E1B] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>Inventory Bahan Baku</span>
              </button>
            )}

            {role !== 'PLATFORM_MASTER' && role !== 'MEMBER' && role !== 'GUEST' && (
              <button
                onClick={() => setActiveTab('attendance')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'attendance'
                    ? 'bg-[#4A2E1B] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Absensi Selfie Staf</span>
              </button>
            )}

            {role === 'TENANT_OWNER' && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-[#4A2E1B] text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Laporan Keuangan</span>
              </button>
            )}
          </nav>
        </div>

        {/* User Badge */}
        <div className="p-3 bg-[#FAF8F5] border border-[#E5DFD7] rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-bold text-xs flex items-center justify-center">
            {currentUser.full_name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-xs text-[#1F1E1D] truncate">{currentUser.full_name}</p>
            <span className="text-[10px] text-stone-500 font-mono block truncate">
              {currentUser.role}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto space-y-6">
        {activeTab === 'dashboard' && (
          <RoleDashboards
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenNewProductModal={() => setShowProductModal(true)}
            onOpenCashModal={() => setShowCashModal(true)}
          />
        )}

        {activeTab === 'orders' && (
          <StaffCashierView showToast={showToast} />
        )}

        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-[#E5DFD7]">
              <div>
                <h3 className="font-extrabold text-base text-[#1F1E1D]">Daftar Menu & Resep HPP</h3>
                <p className="text-xs text-stone-500">Margin laba otomatis dihitung dari harga modal bahan baku</p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductModal(true);
                }}
                className="px-4 py-2 bg-[#4A2E1B] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <div key={item.id} className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs flex gap-3 items-center">
                  <img src={item.image_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-[#1F1E1D] truncate">{item.name}</h4>
                    <p className="text-[11px] font-mono font-bold text-[#4A2E1B]">
                      Rp{item.price.toLocaleString('id-ID')}
                    </p>
                    <span className="text-[10px] text-stone-500">
                      HPP: Rp{item.cost_price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProduct(item);
                      setShowProductModal(true);
                    }}
                    className="text-xs font-bold text-stone-500 hover:text-stone-900 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <StaffStokisView showToast={showToast} />
        )}

        {activeTab === 'attendance' && (
          <AttendanceModule />
        )}

        {activeTab === 'reports' && (
          <FinancialReportsModule />
        )}
      </main>

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
          showToast(`Menu "${data.name}" berhasil ditambahkan!`);
        }}
        onUpdate={(id, data) => {
          updateMenuItem(id, data);
          showToast('Menu berhasil diperbarui!');
        }}
        onAddCategory={(cat) => addCategory(cat)}
      />

      {/* Cash Movement Modal */}
      {showCashModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="font-bold text-sm text-[#1F1E1D]">Mutasi Kas Laci Kasir</h3>
              <button onClick={() => setShowCashModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCashSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMutationType('KAS_KELUAR')}
                  className={`py-2 rounded-xl font-bold cursor-pointer ${
                    mutationType === 'KAS_KELUAR' ? 'bg-red-600 text-white' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  - Kas Keluar
                </button>
                <button
                  type="button"
                  onClick={() => setMutationType('KAS_MASUK')}
                  className={`py-2 rounded-xl font-bold cursor-pointer ${
                    mutationType === 'KAS_MASUK' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  + Kas Masuk
                </button>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={mutationAmount}
                  onChange={(e) => setMutationAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Kategori Keperluan *</label>
                <select
                  value={mutationCategory}
                  onChange={(e) => setMutationCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none bg-white cursor-pointer"
                >
                  <option value="Beli Es Batu / Galon">Beli Es Batu / Galon</option>
                  <option value="Bahan Supermarket Darurat">Bahan Supermarket Darurat</option>
                  <option value="Kas Bon Karyawan">Kas Bon Karyawan</option>
                  <option value="Modal Awal Kasir">Modal Awal Kasir</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Keterangan nota..."
                  value={mutationNotes}
                  onChange={(e) => setMutationNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCashModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Simpan Transaksi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
