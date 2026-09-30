import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { useCafe } from '../../context/CafeContext';
import { AttendanceModule } from '../desktop/AttendanceModule';
import { StaffStokisView } from './StaffStokisView';
import { TableBarcodeModal, TableQrSvg } from '../common/TableBarcodeModal';
import { 
  Clock, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Camera, 
  X, 
  Layers, 
  Plus,
  Warehouse,
  QrCode,
  Printer,
  Search,
  Check,
  Shield,
  Flame,
  Boxes
} from 'lucide-react';
import { CafeTable } from '../../types/cafe';

interface Props {
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export type ManagerTab = 'shift' | 'tables' | 'warehouse' | 'voids' | 'attendance';

export const TenantManagerView: React.FC<Props> = ({ showToast }) => {
  const { currentUser, activeTenant } = usePlatform();
  const {
    orders,
    tables,
    attendances,
    updateTableStatus,
    voidOrder,
    financialSummary,
    addTable,
  } = useCafe();

  const [activeTab, setActiveTab] = useState<ManagerTab>('shift');
  const [selectedVoidOrder, setSelectedVoidOrder] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Table Barcode State
  const [selectedBarcodeTable, setSelectedBarcodeTable] = useState<CafeTable | null>(null);
  const [tableSearch, setTableSearch] = useState('');

  // Add Table state
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);

  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;
    addTable(newTableNumber.trim(), Number(newTableCapacity) || 2);
    showToast(`Meja "${newTableNumber.trim()}" (Kapasitas ${newTableCapacity} orang) berhasil didaftarkan lengkap dengan Barcode!`, 'success');
    setShowAddTableModal(false);
    setNewTableNumber('');
    setNewTableCapacity(4);
  };

  const handleApproveVoid = () => {
    if (!selectedVoidOrder) return;
    voidOrder(selectedVoidOrder.id, voidReason || 'Disetujui Manager', '1234');
    showToast(`Order #${selectedVoidOrder.order_number} berhasil di-VOID.`);
    setSelectedVoidOrder(null);
    setVoidReason('');
  };

  const activeOrders = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'VOIDED');
  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED');
  const todayStr = new Date().toISOString().split('T')[0];
  const staffPresent = attendances.filter((a) => a.date === todayStr);

  const filteredTables = tables.filter((t) =>
    t.table_number.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] pb-24">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-stone-900 to-indigo-950 text-white p-4 rounded-2xl mb-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-xs">
              M
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300">Manager Operasional Café</span>
              <h2 className="text-sm font-extrabold text-white leading-tight">Pengawasan Operasional & Stok Gudang</h2>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
            Akses Supervisor Penuh
          </span>
        </div>
        <p className="text-xs text-stone-300 leading-snug">
          Manager memiliki wewenang mengawasi operasional shift, persediaan bahan baku gudang/stokis, barcode meja pelanggan, otorisasi void kasir, dan pantauan absensi pegawai. Pendaftaran akun dikelola khusus oleh Master dan Owner.
        </p>
      </div>

      {/* Tabs (5 Manager Modules) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-stone-100 rounded-xl mb-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('shift')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'shift' ? 'bg-white text-blue-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="text-[10px]">Ringkasan Shift</span>
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'tables' ? 'bg-white text-blue-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <QrCode className="w-4 h-4 text-amber-700" />
          <span className="text-[10px]">Meja & Barcode ({occupiedTables.length}/{tables.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouse')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'warehouse' ? 'bg-white text-blue-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Warehouse className="w-4 h-4 text-emerald-700" />
          <span className="text-[10px]">Gudang & Stok</span>
        </button>

        <button
          onClick={() => setActiveTab('voids')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'voids' ? 'bg-white text-blue-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-[10px]">Void Approval</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'attendance' ? 'bg-white text-blue-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Camera className="w-4 h-4 text-blue-700" />
          <span className="text-[10px]">Absensi ({staffPresent.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* Tab 1: Shift Overview */}
      {/* ======================================================== */}
      {activeTab === 'shift' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-[10px] text-stone-500 font-bold block">Pesanan Aktif Shift</span>
              <span className="text-xl font-bold font-mono text-[#1F1E1D]">{activeOrders.length}</span>
              <span className="text-[10px] text-amber-700 font-medium block mt-0.5">Sedang diproses</span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-[10px] text-stone-500 font-bold block">Keterisian Meja</span>
              <span className="text-xl font-bold font-mono text-emerald-700">
                {occupiedTables.length}/{tables.length}
              </span>
              <span className="text-[10px] text-emerald-800 font-medium block mt-0.5">Meja terisi</span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-[10px] text-stone-500 font-bold block">Staf Hadir Hari Ini</span>
              <span className="text-xl font-bold font-mono text-blue-700">{staffPresent.length}</span>
              <span className="text-[10px] text-blue-800 font-medium block mt-0.5">Check-in terverifikasi</span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-[10px] text-stone-500 font-bold block">Kas Laci Kasir</span>
              <span className="text-xl font-bold font-mono text-[#4A2E1B]">
                Rp{financialSummary.cashInHand.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-stone-500 font-medium block mt-0.5">Saldo tunai fisik</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab('tables')}
              className="p-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-800 text-white flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#1F1E1D]">Barcode Meja Pelanggan</h4>
                  <p className="text-[10px] text-stone-500">Cetak & uji barcode meja QR untuk pesanan mandiri</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-2 py-1 rounded-lg">
                Lihat Barcode &gt;
              </span>
            </button>

            <button
              onClick={() => setActiveTab('warehouse')}
              className="p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#1F1E1D]">Akses Gudang & Stokis Bahan</h4>
                  <p className="text-[10px] text-stone-500">Cek stok biji kopi, susu, opname, dan PO supplier</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-900 bg-emerald-200/80 px-2 py-1 rounded-lg">
                Buka Gudang &gt;
              </span>
            </button>
          </div>

          {/* Active Orders List */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
            <h3 className="font-extrabold text-xs text-[#1F1E1D]">Pesanan Yang Sedang Berjalan di Barista & Kasir</h3>
            {activeOrders.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center italic">Tidak ada antrean pesanan aktif saat ini.</p>
            ) : (
              <div className="space-y-2">
                {activeOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#4A2E1B] mr-2">{ord.order_number}</span>
                      <span className="font-bold text-[#1F1E1D]">{ord.customer_name}</span>
                      <p className="text-[10px] text-stone-500">
                        {ord.order_type} • Meja {ord.table_number || '-'} • {ord.items.length} Menu
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {ord.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 2: Tables & Real Functional Barcodes */}
      {/* ======================================================== */}
      {activeTab === 'tables' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm text-[#1F1E1D] flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-amber-800" />
                <span>Barcode & Meja Dine-In ({tables.length} Meja Terdaftar)</span>
              </h3>
              <p className="text-xs text-stone-500">
                Setiap meja dilengkapi Barcode & QR Code terenkripsi yang langsung terhubung ke sistem pemesanan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari meja..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-amber-800 w-32 sm:w-40"
                />
              </div>

              <button
                onClick={() => setShowAddTableModal(true)}
                className="px-3.5 py-1.5 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Meja</span>
              </button>
            </div>
          </div>

          {/* Table Cards Grid with Barcode Thumbnails */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredTables.map((t) => {
              const tablePayload = `${window.location.origin}/?table=${encodeURIComponent(t.table_number)}`;
              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-2xl border transition shadow-xs flex flex-col justify-between space-y-3 ${
                    t.status === 'AVAILABLE'
                      ? 'bg-white border-emerald-200/90'
                      : t.status === 'OCCUPIED'
                      ? 'bg-amber-50/50 border-amber-300'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-[#1F1E1D]">
                          Meja {t.table_number.replace(/meja\s*/i, '')}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            t.status === 'AVAILABLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {t.status === 'AVAILABLE' ? 'Kosong' : 'Terisi'}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono block mt-0.5">
                        Kapasitas: {t.capacity} Orang &bull; ID: {t.id}
                      </span>
                    </div>

                    {/* QR Thumbnail */}
                    <div
                      onClick={() => setSelectedBarcodeTable(t)}
                      className="cursor-pointer shrink-0 hover:scale-105 transition"
                      title="Klik untuk perbesar Barcode & cetak stiker"
                    >
                      <TableQrSvg value={tablePayload} size={50} />
                    </div>
                  </div>

                  {/* Table Actions: Show Barcode, Toggle Status */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedBarcodeTable(t)}
                      className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-800" />
                      <span>Barcode Meja</span>
                    </button>

                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          updateTableStatus(t.id, 'AVAILABLE');
                          showToast(`Status Meja ${t.table_number} diubah menjadi Kosong!`);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                          t.status === 'AVAILABLE'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                        }`}
                        title="Tandai meja kosong"
                      >
                        Kosong
                      </button>
                      <button
                        onClick={() => {
                          updateTableStatus(t.id, 'OCCUPIED');
                          showToast(`Status Meja ${t.table_number} diubah menjadi Terisi!`);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                          t.status === 'OCCUPIED'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                        }`}
                        title="Tandai meja terisi tamu"
                      >
                        Terisi
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 3: Full Warehouse & Stokis Management (Manager Access) */}
      {/* ======================================================== */}
      {activeTab === 'warehouse' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>
                <strong>Modul Gudang & Bahan Baku Terbuka:</strong> Anda login sebagai Manager dengan akses penuh fitur Stokis (Stok bahan, mutasi, opname fisik, restock PO supplier).
              </span>
            </div>
          </div>
          <StaffStokisView showToast={showToast} />
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 4: Void Orders */}
      {/* ======================================================== */}
      {activeTab === 'voids' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
            <h4 className="font-bold flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-800" />
              Otoritas Khusus Supervisor
            </h4>
            <p className="text-[11px] text-amber-800">
              Kasir tidak dapat membatalkan pesanan tanpa persetujuan Manager. Setiap aksi void dicatat dalam Audit Trail.
            </p>
          </div>

          <div className="space-y-2">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#4A2E1B]">{ord.order_number}</span>
                    <span className="font-bold text-[#1F1E1D]">{ord.customer_name}</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Rp{ord.total_amount.toLocaleString('id-ID')} • {ord.status}
                  </span>
                </div>
                {ord.status !== 'VOIDED' && (
                  <button
                    onClick={() => setSelectedVoidOrder(ord)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Void Order
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 6: Attendance Module */}
      {/* ======================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <AttendanceModule />
        </div>
      )}

      {/* ======================================================== */}
      {/* Modal: Table Barcode Full View */}
      {/* ======================================================== */}
      {selectedBarcodeTable && (
        <TableBarcodeModal
          table={selectedBarcodeTable}
          cafeName={activeTenant?.name || 'KOPIIN Café'}
          isOpen={true}
          onClose={() => setSelectedBarcodeTable(null)}
          onTestOrderTable={(tblNum) => {
            showToast(`Membuka simulasi pesanan untuk Meja "${tblNum}"!`, 'info');
          }}
          showToast={showToast}
        />
      )}

      {/* ======================================================== */}
      {/* Modal: Tambah Meja Baru */}
      {/* ======================================================== */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1F1E1D]">Tambah Meja & Barcode</h3>
                  <p className="text-[10px] text-stone-500">Daftarkan nomor meja untuk pesanan dine-in</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTableModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTableSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Nomor / Nama Meja *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Meja 11, VIP-01, Outdoor-3"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs outline-none focus:border-amber-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Kapasitas Kursi (Orang) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="50"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono font-bold outline-none focus:border-amber-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Meja & Buat Barcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Modal: Void Confirmation */}
      {/* ======================================================== */}
      {selectedVoidOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="font-bold text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Konfirmasi Otorisasi VOID
            </h3>
            <p className="text-xs text-stone-600">
              Apakah Anda yakin ingin membatalkan Order <strong>#{selectedVoidOrder.order_number}</strong> (Rp{selectedVoidOrder.total_amount.toLocaleString('id-ID')})?
            </p>
            <div>
              <label className="font-bold text-xs text-stone-700 block mb-1">Alasan Pembatalan *</label>
              <input
                type="text"
                required
                placeholder="Pelanggan ganti pesanan / salah input..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-600"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setSelectedVoidOrder(null)}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleApproveVoid}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Ya, Setujui VOID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
