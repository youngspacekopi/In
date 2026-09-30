import React, { useState, useMemo } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { useCafe } from '../../context/CafeContext';
import { ProductManagementModal } from '../desktop/ProductManagementModal';
import { FinancialReportsModule } from '../desktop/FinancialReportsModule';
import { AttendanceModule } from '../desktop/AttendanceModule';
import { PrinterSettingsModal } from '../common/PrinterSettingsModal';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  ShoppingBag, 
  Plus, 
  Users, 
  ChefHat, 
  Boxes, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Printer, 
  Sparkles,
  Sliders,
  Smartphone,
  Clock,
  Calendar,
  ShieldCheck,
  Download,
  Filter,
  Wallet,
  ArrowRightLeft,
  FileSpreadsheet,
  Percent,
  Coffee,
  Eye,
  X,
  Edit,
  UserPlus,
  KeyRound,
  Coins,
  FileCheck,
  Check,
  QrCode
} from 'lucide-react';
import { TableBarcodeModal, TableQrSvg } from '../common/TableBarcodeModal';


interface Props {
  onOpenNewProduct: () => void;
  onOpenCashModal: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export type OwnerTab = 'overview' | 'reports' | 'products' | 'inventory' | 'cashflow' | 'staff' | 'loyalty';

export const TenantOwnerView: React.FC<Props> = ({
  onOpenNewProduct,
  onOpenCashModal,
  showToast,
}) => {
  const { activeTenant, currentUser, users, hasAccess, createStaff, toggleUserStatus } = usePlatform();
  const {
    menuItems,
    categories,
    inventory,
    tables,
    orders,
    payments,
    cashLedger,
    cashierClosings,
    attendances,
    financialSummary,
    getFinancialReport,
    addCashMovement,
    addMenuItem,
    updateMenuItem,
    addCategory,
    members,
    adjustMemberPoints,
    updateMemberProfile,
    getMemberLedger,
    testPrintReceipt,
  } = useCafe();

  const [activeTab, setActiveTab] = useState<OwnerTab>('overview');
  const [overviewPeriod, setOverviewPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('TODAY');

  // Synchronized Financial Calculations for Overview Dashboard
  const overviewReport = useMemo(() => {
    if (overviewPeriod === 'ALL') {
      const paidOrders = orders.filter((o) => o.payment_status === 'PAID');
      const totalGrossSales = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const totalCOGS = paidOrders.reduce((orderSum, o) => {
        const itemsCost = o.items.reduce((itemSum, it) => itemSum + ((it.cost_price || 0) * it.quantity), 0);
        return orderSum + itemsCost;
      }, 0);
      const grossProfit = totalGrossSales - totalCOGS;
      const profitMarginPercent = totalGrossSales > 0 ? Math.round((grossProfit / totalGrossSales) * 100 * 10) / 10 : 0;
      const realCash = payments.reduce((sum, p) => sum + (p.amount_cash || (p.payment_method === 'CASH' ? p.total_bill : 0)), 0);
      const transferNonCash = payments.reduce((sum, p) => sum + (p.amount_transfer || (p.payment_method === 'TRANSFER' ? p.total_bill : 0)), 0);
      const totalKasMasuk = cashLedger.filter((c: any) => c.movement_type === 'KAS_MASUK').reduce((sum: number, c: any) => sum + c.amount, 0);
      const totalKasKeluar = cashLedger.filter((c: any) => c.movement_type === 'KAS_KELUAR').reduce((sum: number, c: any) => sum + c.amount, 0);
      const netCashFlow = totalKasMasuk - totalKasKeluar;
      return {
        dateLabel: 'Semua Waktu',
        totalGrossSales,
        totalCOGS,
        grossProfit,
        profitMarginPercent,
        realCash,
        transferNonCash,
        totalKasMasuk,
        totalKasKeluar,
        netCashFlow,
        paidOrdersCount: paidOrders.length,
      };
    }
    const rep = getFinancialReport(overviewPeriod);
    return {
      dateLabel: rep.dateLabel,
      totalGrossSales: rep.totalGrossSales,
      totalCOGS: rep.totalCOGS,
      grossProfit: rep.grossProfit,
      profitMarginPercent: rep.profitMarginPercent,
      realCash: rep.realCash,
      transferNonCash: rep.transferNonCash,
      totalKasMasuk: rep.totalKasMasuk,
      totalKasKeluar: rep.totalKasKeluar,
      netCashFlow: rep.netCashFlow,
      paidOrdersCount: rep.totalTransactionsCount,
    };
  }, [overviewPeriod, orders, payments, cashLedger, getFinancialReport]);

  // Internal Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showTablesModal, setShowTablesModal] = useState(false);
  const [selectedBarcodeTable, setSelectedBarcodeTable] = useState<any | null>(null);

  // Cash In/Out Modal
  const [showCashMutationModal, setShowCashMutationModal] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [mutationType, setMutationType] = useState<'KAS_MASUK' | 'KAS_KELUAR'>('KAS_KELUAR');
  const [mutationAmount, setMutationAmount] = useState<number>(50000);
  const [mutationCategory, setMutationCategory] = useState('Beli Es Batu / Galon');
  const [mutationNotes, setMutationNotes] = useState('');

  // Staff Management State
  const [staffSubTab, setStaffSubTab] = useState<'accounts' | 'attendance'>('accounts');
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('kopiin123');
  const [newStaffRole, setNewStaffRole] = useState<'TENANT_MANAGER' | 'STAFF_CASHIER' | 'STAFF_BARISTA' | 'STAFF_STOKIS' | 'STAFF'>('STAFF_CASHIER');

  // Member & Loyalty Management State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberPhone, setEditMemberPhone] = useState('');
  const [editMemberTier, setEditMemberTier] = useState('Gold');
  const [pointsDelta, setPointsDelta] = useState<number>(50);
  const [pointsReason, setPointsReason] = useState('Bonus loyalitas pelanggan');
  const [pointAction, setPointAction] = useState<'ADD' | 'SUBTRACT'>('ADD');

  const handleOpenMemberManage = (m: any) => {
    setSelectedMember(m);
    setEditMemberName(m.name);
    setEditMemberPhone(m.phone);
    setEditMemberTier(m.tier);
    setPointsDelta(50);
    setPointsReason('Bonus apresiasi pelanggan setia');
    setShowMemberModal(true);
  };

  const handleSaveMemberProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    updateMemberProfile(selectedMember.id, {
      name: editMemberName,
      phone: editMemberPhone,
      tier: editMemberTier,
    });
    showToast(`Data member ${editMemberName} berhasil diperbarui!`);
  };

  const handleApplyPointChange = () => {
    if (!selectedMember || !pointsDelta || pointsDelta <= 0) return;
    const delta = pointAction === 'ADD' ? pointsDelta : -pointsDelta;
    adjustMemberPoints(selectedMember.id, delta, pointsReason);
    showToast(
      `Poin member ${selectedMember.name} ${pointAction === 'ADD' ? 'ditambah' : 'dikurang'} ${pointsDelta} poin!`,
      'success'
    );
  };

  const handleCreateStaffAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      showToast('Nama dan email staf wajib diisi', 'error');
      return;
    }
    try {
      await createStaff({
        fullName: newStaffName.trim(),
        email: newStaffEmail.trim(),
        temporaryPasswordPlainText: newStaffPassword,
        role: newStaffRole,
      });
      showToast(`Akun staf ${newStaffName} (${newStaffRole}) berhasil dibuat!`, 'success');
      setShowCreateStaffModal(false);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('kopiin123');
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat akun staf', 'error');
    }
  };


  // Handle Cash Movement
  const handleCashMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutationAmount || mutationAmount <= 0) return;
    addCashMovement({
      movement_type: mutationType,
      category: mutationCategory,
      amount: Number(mutationAmount),
      notes: mutationNotes,
    });
    showToast(`Mutasi kas ${mutationType === 'KAS_MASUK' ? 'Masuk' : 'Keluar'} Rp${mutationAmount.toLocaleString('id-ID')} dicatat!`);
    setShowCashMutationModal(false);
    setMutationNotes('');
  };

  const staffCount = users.filter((u) => u.tenant_id === activeTenant?.id).length;
  const lowStockCount = inventory.filter((i) => i.status === 'LOW_STOCK').length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] pb-24">
      {/* Café Owner Hero Header */}
      <div className="bg-gradient-to-r from-[#4A2E1B] via-[#361F12] to-[#24130B] text-white p-4 rounded-2xl mb-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-xs">
              O
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">Tenant Owner Café</span>
              <h2 className="text-sm font-extrabold text-white leading-tight">{activeTenant?.name || 'KOPIIN Café'}</h2>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
            Akses Pemilik (Full Access)
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-stone-300 leading-snug">
            Selamat datang, <strong className="text-white">{currentUser.full_name}</strong>. Anda memiliki wewenang penuh atas operasional, laporan keuangan, struktur menu & HPP, persediaan stok, dan manajemen staf.
          </p>
          <button
            onClick={() => setShowPrinterModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Pengaturan Printer Kasir & Bar"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printer POS</span>
          </button>
        </div>
      </div>

      {/* Owner Navigation Tabs */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-1 bg-stone-100 rounded-xl mb-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'overview' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-[10px]">Ringkasan</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'reports' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="text-[10px]">Laporan Kas</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'products' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span className="text-[10px]">Menu & HPP</span>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'inventory' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span className="text-[10px]">Stok ({lowStockCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'cashflow' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span className="text-[10px]">Arus Kas</span>
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'staff' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px]">Absensi Staf</span>
        </button>
        <button
          onClick={() => setActiveTab('loyalty')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'loyalty' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span className="text-[10px]">Loyalty Poin</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* Tab 1: Overview Dashboard */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Overview Period Filter Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1 mr-1">
                <Calendar className="w-3.5 h-3.5 text-amber-800" />
                Periode:
              </span>
              {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setOverviewPeriod(p)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    overviewPeriod === p
                      ? 'bg-[#4A2E1B] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {p === 'TODAY'
                    ? 'Hari Ini'
                    : p === 'WEEK'
                    ? '7 Hari Terakhir'
                    : p === 'MONTH'
                    ? 'Bulan Ini'
                    : 'Semua Waktu'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-[11px] font-mono font-bold text-stone-500 hidden sm:block">
                Sinkron: <span className="text-[#15803D]">{overviewReport.paidOrdersCount} Pesanan Lunas</span>
              </div>
              <button
                onClick={() => setActiveTab('reports')}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                title="Buka Laporan Kas Lengkap & Ekspor ke XLS Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Laporan & XLS</span>
              </button>
            </div>
          </div>

          {/* Core Financial KPI Cards (Fully synchronized with Laporan Kas) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Omset Penjualan */}
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span className="font-bold text-stone-600">Omset Penjualan</span>
                <DollarSign className="w-4 h-4 text-amber-700" />
              </div>
              <p className="text-xl font-mono font-extrabold text-[#1F1E1D]">
                Rp{overviewReport.totalGrossSales.toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> Margin +{overviewReport.profitMarginPercent}%
              </span>
            </div>

            {/* Laba Kotor */}
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span className="font-bold text-stone-600">Laba Kotor</span>
                <TrendingUp className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-xl font-mono font-extrabold text-[#15803D]">
                Rp{overviewReport.grossProfit.toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-stone-500">
                HPP Modal: Rp{overviewReport.totalCOGS.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Kas Fisik Laci Kasir */}
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span className="font-bold text-stone-600">Kas Fisik Laci</span>
                <Wallet className="w-4 h-4 text-[#4A2E1B]" />
              </div>
              <p className="text-xl font-mono font-extrabold text-[#4A2E1B]">
                Rp{financialSummary.cashInHand.toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-stone-500">
                Saldo tunai di drawer kasir
              </span>
            </div>

            {/* Non-Tunai / QRIS */}
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span className="font-bold text-stone-600">Non-Tunai / QRIS</span>
                <CreditCard className="w-4 h-4 text-blue-700" />
              </div>
              <p className="text-xl font-mono font-extrabold text-blue-900">
                Rp{overviewReport.transferNonCash.toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-stone-500">Masuk rekening bank café</span>
            </div>
          </div>

          {/* Arus Kas Masuk & Kas Keluar Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/90 text-xs">
            <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-stone-600 font-bold">Total Kas Masuk:</span>
              </div>
              <span className="font-mono font-extrabold text-emerald-800">
                +Rp{overviewReport.totalKasMasuk.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-stone-600 font-bold">Total Kas Keluar:</span>
              </div>
              <span className="font-mono font-extrabold text-red-700">
                -Rp{overviewReport.totalKasKeluar.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-stone-600 font-bold">Net Arus Kas:</span>
              </div>
              <span className={`font-mono font-extrabold ${overviewReport.netCashFlow >= 0 ? 'text-[#15803D]' : 'text-red-700'}`}>
                {overviewReport.netCashFlow >= 0 ? '+' : ''}Rp{overviewReport.netCashFlow.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
              className="p-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-2xl flex items-center gap-3 text-left transition cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#4A2E1B] text-white flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-[#1F1E1D]">Tambah Menu Baru</h4>
                <p className="text-[10px] text-stone-500">Hitung HPP & Margin</p>
              </div>
            </button>

            <button
              onClick={() => setShowCashMutationModal(true)}
              className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-2xl flex items-center gap-3 text-left transition cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-stone-800 text-white flex items-center justify-center shrink-0">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-[#1F1E1D]">Mutasi Kas Laci</h4>
                <p className="text-[10px] text-stone-500">Es batu, galon, petty cash</p>
              </div>
            </button>

            <button
              onClick={() => setShowTablesModal(true)}
              className="p-3 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-2xl flex items-center gap-3 text-left transition cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-[#1F1E1D]">Barcode Meja QR</h4>
                <p className="text-[10px] text-stone-500">{tables.length} Meja Terdaftar</p>
              </div>
            </button>
          </div>

          {/* Low Stock Notification */}
          {lowStockCount > 0 && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-xs text-red-900">
                    {lowStockCount} Bahan Baku Mencapai Ambang Batas Minimum!
                  </h4>
                  <p className="text-[11px] text-red-700">Segera lakukan Purchase Order ke roastery / supplier.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('inventory')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                Cek Stok
              </button>
            </div>
          )}

          {/* Laporan Closing Kasir Shift Masuk */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-[#1F1E1D]">Laporan Closing Kasir Shift (Tutup Kas)</h3>
                  <p className="text-[10px] text-stone-500">Rekonsiliasi fisik uang kas laci vs sistem</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {cashierClosings.length} Laporan
              </span>
            </div>

            {cashierClosings.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 text-center italic">
                Belum ada laporan closing kasir shift hari ini.
              </p>
            ) : (
              <div className="space-y-2.5">
                {cashierClosings.map((closing) => {
                  const isBalanced = closing.difference === 0;
                  const isSurplus = closing.difference > 0;
                  return (
                    <div
                      key={closing.id}
                      className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <h4 className="font-bold text-xs text-stone-800">{closing.cashier_name}</h4>
                        </div>
                        <span className="text-[10px] font-mono text-stone-500">
                          {new Date(closing.closed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {closing.shift_date}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-white rounded-lg border border-stone-100">
                          <span className="block text-[9px] text-stone-400">Total Transaksi</span>
                          <span className="font-bold text-[#1F1E1D]">{closing.total_orders} Pesanan</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-stone-100">
                          <span className="block text-[9px] text-stone-400">Total Omset</span>
                          <span className="font-bold text-amber-900 font-mono">Rp{closing.total_sales.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-stone-100">
                          <span className="block text-[9px] text-stone-400">Fisik Uang Kas</span>
                          <span className="font-bold text-[#15803D] font-mono">Rp{closing.cash_in_drawer_actual.toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-stone-200/80 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-stone-500">Selisih Kas:</span>
                          <span
                            className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                              isBalanced
                                ? 'bg-emerald-100 text-emerald-800'
                                : isSurplus
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isBalanced
                              ? 'Klop / Sesuai (Rp0)'
                              : isSurplus
                              ? `+Rp${closing.difference.toLocaleString('id-ID')} (Lebih)`
                              : `-Rp${Math.abs(closing.difference).toLocaleString('id-ID')} (Kurang)`}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 italic max-w-[180px] truncate">
                          "{closing.notes || 'Shift ditutup'}"
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>


          {/* Recent Orders List */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-[#1F1E1D]">Aktivitas Penjualan Terbaru Hari Ini</h3>
              <button
                onClick={() => setActiveTab('reports')}
                className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
              >
                Lihat Laporan Lengkap &gt;
              </button>
            </div>

            <div className="space-y-2">
              {orders.slice(0, 5).map((ord) => (
                <div
                  key={ord.id}
                  className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                      POS
                    </div>
                    <div>
                      <p className="font-bold text-[#1F1E1D]">{ord.customer_name}</p>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {ord.order_number} • {new Date(ord.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-xs text-[#1F1E1D]">
                      Rp{ord.total_amount.toLocaleString('id-ID')}
                    </p>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        ord.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 2: Full Financial Reports Module */}
      {/* ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <FinancialReportsModule />
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 3: Products & COGS Recipe Management */}
      {/* ======================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#1F1E1D]">Katalog Menu & Kalkulasi Resep HPP</h3>
              <p className="text-xs text-stone-500">Margin laba otomatis dihitung dari HPP modal bahan baku</p>
            </div>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
              className="px-3.5 py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {menuItems.map((item) => {
              const marginRp = item.price - item.cost_price;
              const marginPct = item.price > 0 ? Math.round((marginRp / item.price) * 100 * 10) / 10 : 0;
              return (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-[#1F1E1D] truncate">{item.name}</h4>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          item.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.is_available ? 'Ready' : 'Habis'}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                      Harga Jual: <strong className="text-stone-900">Rp{item.price.toLocaleString('id-ID')}</strong>
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="text-stone-500">HPP: Rp{item.cost_price.toLocaleString('id-ID')}</span>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        +{marginPct}% Margin
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProduct(item);
                      setShowProductModal(true);
                    }}
                    className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 4: Inventory & Warehouse */}
      {/* ======================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#1F1E1D]">Inventori & Persediaan Bahan Baku</h3>
              <p className="text-xs text-stone-500">Pengurangan otomatis setiap kali pesanan kopi dibuat di kasir</p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-xl">
              {inventory.length} SKU Bahan
            </span>
          </div>

          <div className="space-y-2.5">
            {inventory.map((inv) => {
              const isLow = inv.current_stock <= inv.minimum_stock;
              return (
                <div
                  key={inv.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                    isLow ? 'bg-red-50/50 border-red-200' : 'bg-white border-stone-200 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-[#1F1E1D]">{inv.name}</h4>
                      <span className="text-[10px] text-stone-400 font-mono">({inv.sku})</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Kategori: {inv.category} • Biaya/Unit: Rp{((inv as any).cost_per_unit || inv.average_cost || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-mono font-extrabold ${
                        isLow ? 'text-red-600' : 'text-[#1F1E1D]'
                      }`}
                    >
                      {inv.current_stock} {inv.unit}
                    </span>
                    <span className="block text-[10px] text-stone-400">
                      Batas Min: {inv.minimum_stock} {inv.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 5: Cashflow & Petty Cash Mutations */}
      {/* ======================================================== */}
      {activeTab === 'cashflow' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#1F1E1D]">Buku Kas Laci & Mutasi Operasional</h3>
              <p className="text-xs text-stone-500">Mencatat pengeluaran darurat (es batu, galon, petty cash)</p>
            </div>
            <button
              onClick={() => setShowCashMutationModal(true)}
              className="px-3.5 py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Mutasi Kas</span>
            </button>
          </div>

          <div className="space-y-2">
            {cashLedger.map((c: any) => (
              <div
                key={c.id}
                className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        c.movement_type === 'KAS_MASUK'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {c.movement_type === 'KAS_MASUK' ? '+ Kas Masuk' : '- Kas Keluar'}
                    </span>
                    <span className="font-bold text-[#1F1E1D]">{c.category}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {c.notes || '-'} • Oleh: <strong>{c.performed_by_name}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono font-extrabold text-sm ${
                      c.movement_type === 'KAS_MASUK' ? 'text-[#15803D]' : 'text-red-600'
                    }`}
                  >
                    {c.movement_type === 'KAS_MASUK' ? '+' : '-'}Rp{c.amount.toLocaleString('id-ID')}
                  </span>
                  <span className="block text-[10px] text-stone-400 font-mono">
                    {new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 6: Staff Management & Attendance Module */}
      {/* ======================================================== */}
      {activeTab === 'staff' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Sub-tabs */}
          <div className="flex bg-stone-200/80 p-1 rounded-2xl gap-1">
            <button
              onClick={() => setStaffSubTab('accounts')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                staffSubTab === 'accounts'
                  ? 'bg-white text-[#4A2E1B] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Daftar & Buat Akun Staf</span>
            </button>
            <button
              onClick={() => setStaffSubTab('attendance')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                staffSubTab === 'attendance'
                  ? 'bg-white text-[#4A2E1B] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Presensi / Absensi</span>
            </button>
          </div>

          {staffSubTab === 'accounts' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-[#1F1E1D]">Akun Staf Cabang Café</h3>
                  <p className="text-[11px] text-stone-500">Kelola akses akun Manager, Kasir, Barista & Stokis</p>
                </div>
                <button
                  onClick={() => setShowCreateStaffModal(true)}
                  className="px-3.5 py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Buat Akun Staf</span>
                </button>
              </div>

              {/* Staff List */}
              <div className="space-y-2.5">
                {users
                  .filter((u) => u.tenant_id === activeTenant?.id && u.role !== 'PLATFORM_MASTER' && u.role !== 'MEMBER')
                  .map((staff) => {
                    const roleLabel =
                      staff.role === 'TENANT_OWNER'
                        ? 'Owner / Pemilik'
                        : staff.role === 'TENANT_MANAGER'
                        ? 'Manager Café'
                        : staff.role === 'STAFF_CASHIER'
                        ? 'Kasir POS'
                        : staff.role === 'STAFF_BARISTA'
                        ? 'Barista (KDS)'
                        : staff.role === 'STAFF_STOKIS'
                        ? 'Stokis Gudang'
                        : staff.role === 'STAFF'
                        ? 'Staff (Hanya Absensi)'
                        : staff.role;

                    const roleBadgeColor =
                      staff.role === 'TENANT_OWNER'
                        ? 'bg-purple-100 text-purple-800'
                        : staff.role === 'TENANT_MANAGER'
                        ? 'bg-blue-100 text-blue-800'
                        : staff.role === 'STAFF_CASHIER'
                        ? 'bg-emerald-100 text-emerald-800'
                        : staff.role === 'STAFF_BARISTA'
                        ? 'bg-amber-100 text-amber-800'
                        : staff.role === 'STAFF_STOKIS'
                        ? 'bg-cyan-100 text-cyan-800'
                        : staff.role === 'STAFF'
                        ? 'bg-violet-100 text-violet-800 border border-violet-200'
                        : 'bg-stone-100 text-stone-800';

                    return (
                      <div
                        key={staff.id}
                        className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-sm shrink-0">
                            {staff.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-xs text-[#1F1E1D]">{staff.full_name}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadgeColor}`}>
                                {roleLabel}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 font-mono mt-0.5">{staff.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              staff.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {staff.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                          </span>
                          {staff.role !== 'TENANT_OWNER' && (
                            <button
                              onClick={() => {
                                toggleUserStatus(staff.id);
                                showToast(`Status akun ${staff.full_name} diubah!`);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                            >
                              {staff.status === 'ACTIVE' ? 'Tangguhkan' : 'Aktifkan'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <AttendanceModule />
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 7: Loyalty Points & Customer Club */}
      {/* ======================================================== */}
      {activeTab === 'loyalty' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-amber-900 to-amber-950 text-white p-5 rounded-2xl shadow-sm">
            <h3 className="font-extrabold text-base mb-1">Program Loyalitas Member KOPIIN</h3>
            <p className="text-xs text-amber-200/80">
              1 Poin = Potongan Rp100. Pelanggan mendapatkan 5 poin per transaksi Rp10.000. Owner memiliki wewenang mengedit data, menambah dan mengurangi poin member.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#1F1E1D]">Daftar Member Terdaftar ({members.length})</h3>
            <span className="text-[11px] text-stone-500">Klik "Kelola & Poin" untuk edit poin</span>
          </div>

          <div className="space-y-2.5">
            {members.map((m: any) => (
              <div
                key={m.id}
                className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs text-[#1F1E1D]">{m.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900">
                      Tier: {m.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                    {m.phone} • Belanja Akumulasi: Rp{m.total_spent.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-base text-amber-800">
                      {m.points.toLocaleString('id-ID')}
                    </span>
                    <span className="block text-[10px] text-stone-400">Poin Aktif</span>
                  </div>

                  <button
                    onClick={() => handleOpenMemberManage(m)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-700" />
                    <span>Kelola & Poin</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Buat Akun Staf Baru */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#4A2E1B] text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1F1E1D]">Buat Akun Staf Cabang Baru</h3>
                  <p className="text-[10px] text-stone-500">Akses operasional café sesuai peran</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateStaffModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaffAccount} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Nama Lengkap Staf *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Budi Santoso"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Email Login Staf *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. budi@kopiin.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Role / Peran Operasional *</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs outline-none bg-white cursor-pointer"
                >
                  <option value="STAFF_CASHIER">Kasir POS (Front-of-House & Pembayaran)</option>
                  <option value="STAFF_BARISTA">Barista (KDS Layar Antrean Dapur & Bar)</option>
                  <option value="STAFF_STOKIS">Stokis Gudang (Gudang Bahan Baku & Opname)</option>
                  <option value="STAFF">Staff (Hanya Absensi & Presensi Mandiri)</option>
                  <option value="TENANT_MANAGER">Manager Café (Supervisi Operasional & Meja)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Password Sementara *</label>
                <input
                  type="text"
                  required
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono outline-none focus:border-[#4A2E1B]"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">Staf dapat login dengan email dan password ini.</span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Simpan Akun Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola Member & Poin */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1F1E1D]">Kelola Member & Poin</h3>
                  <p className="text-[10px] text-stone-500">Edit profil pelanggan & tambah/kurang poin loyalitas</p>
                </div>
              </div>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Balance Card */}
            <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Saldo Poin Saat Ini</span>
                <span className="text-2xl font-black font-mono text-amber-900">
                  {selectedMember.points.toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-amber-700 font-medium ml-1">Poin</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-200 text-amber-900 inline-block mb-1">
                  Tier: {selectedMember.tier}
                </span>
                <span className="text-[11px] text-stone-600 block">
                  Nilai: Rp{(selectedMember.points * 100).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Section 1: Edit Profile */}
            <form onSubmit={handleSaveMemberProfile} className="space-y-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
                <Edit className="w-3.5 h-3.5 text-stone-600" />
                <span>Edit Informasi Member</span>
              </h4>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Nama Member</label>
                <input
                  type="text"
                  required
                  value={editMemberName}
                  onChange={(e) => setEditMemberName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-600 block mb-1">No. WhatsApp / HP</label>
                  <input
                    type="tel"
                    required
                    value={editMemberPhone}
                    onChange={(e) => setEditMemberPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-600 block mb-1">Membership Tier</label>
                  <select
                    value={editMemberTier}
                    onChange={(e) => setEditMemberTier(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs outline-none cursor-pointer"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Silver">Silver (Diskon 5%)</option>
                    <option value="Gold">Gold (Diskon 10%)</option>
                    <option value="Platinum">Platinum (VIP 15%)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-bold text-xs cursor-pointer transition"
              >
                Simpan Perubahan Profil
              </button>
            </form>

            {/* Section 2: Add or Reduce Points */}
            <div className="space-y-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-700" />
                <span>Tambah atau Kurang Poin</span>
              </h4>

              {/* Action Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPointAction('ADD')}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    pointAction === 'ADD'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <span>+ Tambah Poin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPointAction('SUBTRACT')}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    pointAction === 'SUBTRACT'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <span>- Kurang Poin</span>
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-1.5">
                {[10, 25, 50, 100, 200].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPointsDelta(preset)}
                    className={`flex-1 py-1 text-[11px] rounded-lg border font-mono font-bold transition cursor-pointer ${
                      pointsDelta === preset
                        ? 'bg-amber-800 text-white border-amber-800'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Jumlah Poin Custom</label>
                <input
                  type="number"
                  min="1"
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Alasan Penyesuaian Poin</label>
                <input
                  type="text"
                  placeholder="e.g. Bonus kompensasi antrean / Hadiah ultah / Penukaran manual"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyPointChange}
                className={`w-full py-2 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer ${
                  pointAction === 'ADD' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {pointAction === 'ADD' ? `+ Tambahkan ${pointsDelta} Poin` : `- Kurangkan ${pointsDelta} Poin`}
              </button>
            </div>

            {/* Section 3: Point Ledger History */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-stone-800">Riwayat Mutasi Poin Member</h4>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {getMemberLedger(selectedMember.id).length === 0 ? (
                  <p className="text-stone-400 italic text-[11px] py-1 text-center">Belum ada riwayat mutasi poin.</p>
                ) : (
                  getMemberLedger(selectedMember.id).map((ledger) => (
                    <div
                      key={ledger.id}
                      className="p-2 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-bold text-stone-700 block">{ledger.notes}</span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(ledger.created_at).toLocaleDateString('id-ID')} {new Date(ledger.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className={`font-bold ${ledger.points_in > 0 ? 'text-[#15803D]' : 'text-red-600'}`}>
                          {ledger.points_in > 0 ? `+${ledger.points_in}` : `-${ledger.points_out}`}
                        </span>
                        <span className="block text-[9px] text-stone-400">Sisa: {ledger.balance_after}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}


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
        onAddCategory={(catName) => {
          addCategory(catName);
          showToast(`Kategori "${catName}" ditambahkan.`);
        }}
      />

      {/* Petty Cash Mutation Modal */}
      {showCashMutationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="font-bold text-sm text-[#1F1E1D]">Catat Mutasi Kas Laci Kasir</h3>
              <button
                onClick={() => setShowCashMutationModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCashMovementSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMutationType('KAS_KELUAR')}
                  className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                    mutationType === 'KAS_KELUAR'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  - Kas Keluar (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => setMutationType('KAS_MASUK')}
                  className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                    mutationType === 'KAS_MASUK'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  + Kas Masuk (Deposit)
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
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Kategori Keperluan *</label>
                <select
                  value={mutationCategory}
                  onChange={(e) => setMutationCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs outline-none bg-white cursor-pointer"
                >
                  <option value="Beli Es Batu / Galon">Beli Es Batu / Galon Darurat</option>
                  <option value="Bahan Tambahan Supermarket">Bahan Tambahan Supermarket</option>
                  <option value="Kas Bon Karyawan">Kas Bon Karyawan</option>
                  <option value="Modal Awal Kasir">Modal Awal Kasir (Float)</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Keterangan bon / nota fisik..."
                  value={mutationNotes}
                  onChange={(e) => setMutationNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCashMutationModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Simpan Transaksi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Printer Thermal */}
      <PrinterSettingsModal
        isOpen={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        showToast={showToast}
      />

      {/* Modal Daftar Meja & Barcode QR Owner */}
      {showTablesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-stone-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#1F1E1D]">Barcode & QR Code Meja Café</h3>
                  <p className="text-[10px] text-stone-500 font-mono">{activeTenant?.name} &bull; {tables.length} Meja Terdaftar</p>
                </div>
              </div>
              <button
                onClick={() => setShowTablesModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {tables.map((t) => {
                const tableUrl = `${window.location.origin}/?table=${encodeURIComponent(t.table_number)}`;
                return (
                  <div
                    key={t.id}
                    className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setSelectedBarcodeTable(t)}
                        className="cursor-pointer shrink-0 hover:scale-105 transition"
                        title="Klik untuk perbesar & cetak stiker"
                      >
                        <TableQrSvg value={tableUrl} size={46} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-[#1F1E1D]">Meja {t.table_number.replace(/meja\s*/i, '')}</h4>
                        <p className="text-[10px] text-stone-500 font-mono">Kapasitas {t.capacity} Orang</p>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 ${
                          t.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status === 'AVAILABLE' ? 'Kosong' : 'Terisi'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedBarcodeTable(t)}
                      className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-800" />
                      <span>Cetak & Perbesar</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Selected Table Barcode Modal */}
      {selectedBarcodeTable && (
        <TableBarcodeModal
          table={selectedBarcodeTable}
          cafeName={activeTenant?.name || 'KOPIIN Café'}
          isOpen={true}
          onClose={() => setSelectedBarcodeTable(null)}
          onTestOrderTable={(tblNum) => {
            showToast(`Uji barcode meja "${tblNum}" berhasil!`, 'success');
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};
