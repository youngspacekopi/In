import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { useCafe } from '../../context/CafeContext';
import { printerService } from '../../lib/printer/printerService';
import { PrinterSettingsModal } from '../common/PrinterSettingsModal';
import { ReceiptPrintModal } from '../common/ReceiptPrintModal';
import { 
  ShoppingBag, 
  CreditCard, 
  DollarSign, 
  Sparkles, 
  Printer, 
  CheckCircle2, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  Tag,
  X,
  FileText,
  Lock,
  Coffee,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  RotateCcw,
  Check,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { TableBarcodeModal } from '../common/TableBarcodeModal';

interface Props {
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export type CashierTab = 'pos' | 'daily_sales' | 'cash_flow' | 'closing' | 'kds_queue';

export const StaffCashierView: React.FC<Props> = ({ showToast }) => {
  const { currentUser, activeTenant } = usePlatform();
  const {
    menuItems,
    categories,
    createOrder,
    processPayment,
    members,
    orders,
    payments,
    cashLedger,
    addCashMovement,
    cashierClosings,
    recordCashierClosing,
    updateOrderStatus,
    testPrintReceipt,
    printerConfig,
    tables,
    updateTableStatus,
  } = useCafe();

  const [activeTab, setActiveTab] = useState<CashierTab>('pos');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchMenu, setSearchMenu] = useState('');
  const [showPrinterSettingsModal, setShowPrinterSettingsModal] = useState(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<any | null>(null);
  const [selectedBarcodeTable, setSelectedBarcodeTable] = useState<any | null>(null);

  // Cart State
  const [cart, setCart] = useState<Array<{ item: any; quantity: number; notes?: string }>>([]);
  const [customerName, setCustomerName] = useState('Pelanggan Walk-In');
  const [tableNumber, setTableNumber] = useState('1');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');

  // Member Selection & Points Redemption
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [redeemPoints, setRedeemPoints] = useState<number>(0);

  // Payment Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'SPLIT' | 'POINT'>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(50000);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cash Mutation Modal (Kas Masuk / Kas Keluar)
  const [showCashMutationModal, setShowCashMutationModal] = useState(false);
  const [mutationType, setMutationType] = useState<'KAS_MASUK' | 'KAS_KELUAR'>('KAS_KELUAR');
  const [mutationAmount, setMutationAmount] = useState<number>(25000);
  const [mutationCategory, setMutationCategory] = useState('Beli Es Batu / Galon');
  const [mutationNotes, setMutationNotes] = useState('');

  // Closing Cashier State
  const [actualCashCounted, setActualCashCounted] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState('');
  const [isSubmittingClosing, setIsSubmittingClosing] = useState(false);

  // Calculations for POS Cart
  const subtotal = cart.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const taxRate = activeTenant?.settings?.tax_rate ?? 0.11;
  const serviceRate = activeTenant?.settings?.service_charge ?? 0.05;

  const pointsDiscount = redeemPoints * 100; // 1 Poin = Rp100
  const afterDiscount = Math.max(0, subtotal - pointsDiscount);

  const taxAmount = Math.round(afterDiscount * taxRate);
  const serviceAmount = Math.round(afterDiscount * serviceRate);
  const totalBill = afterDiscount + taxAmount + serviceAmount;

  const changeDue = Math.max(0, cashTendered - totalBill);

  const handleAddToCart = (item: any) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.item.id === item.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((p) => p.item.id !== itemId));
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((p) => {
          if (p.item.id === itemId) {
            const nextQty = p.quantity + delta;
            return nextQty > 0 ? { ...p, quantity: nextQty } : null;
          }
          return p;
        })
        .filter(Boolean) as any;
    });
  };

  const handleCompletePayment = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      // 1. Create order
      const newOrder = await createOrder({
        customerName: customerName || 'Pelanggan Walk-In',
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
        customerType: selectedMemberId ? 'MEMBER' : 'GUEST',
        customerId: selectedMemberId || undefined,
        orderType: orderType,
        items: cart.map((c) => ({
          menuItem: c.item,
          quantity: c.quantity,
          notes: c.notes,
        })),
        discountAmount: redeemPoints > 0 ? redeemPoints * 100 : 0,
      });

      // 2. Process payment
      const isCash = paymentMethod === 'CASH';
      const isSplit = paymentMethod === 'SPLIT';
      await processPayment({
        orderId: newOrder.id,
        paymentMethod: isSplit ? 'MIXED' : isCash ? 'CASH' : 'TRANSFER',
        amountCash: isCash ? (cashTendered || totalBill) : isSplit ? cashTendered : 0,
        amountTransfer: paymentMethod === 'TRANSFER' ? totalBill : isSplit ? Math.max(0, totalBill - cashTendered) : 0,
        pointsToRedeem: redeemPoints,
      });

      showToast(`Order #${newOrder.order_number} BERHASIL dibayar!`);

      // 3. Automated Dual-Print Routing:
      // - Customer Receipt (Full payment details)
      // - Kitchen Ticket / KDS (Order summary ONLY, no prices, large qty & notes)
      const shouldPrintReceipt = printerConfig.auto_print_dine_in;
      const shouldPrintKitchen = printerConfig.auto_print_kitchen_ticket ?? true;

      if (shouldPrintReceipt && shouldPrintKitchen) {
        printerService.printCustomerAndKitchenReceipts(newOrder, activeTenant.name, currentUser.full_name);
      } else if (shouldPrintReceipt) {
        printerService.printReceipt(newOrder, activeTenant.name, currentUser.full_name);
      } else if (shouldPrintKitchen) {
        printerService.printKitchenTicket(newOrder, activeTenant.name, currentUser.full_name);
      }

      // Broadcast to any KDS / Kitchen station tablet running in the kitchen
      printerService.broadcastKitchenOrder(newOrder, activeTenant.name, currentUser.full_name);

      setSelectedOrderForReceipt(newOrder);

      // Reset
      setCart([]);
      setRedeemPoints(0);
      setSelectedMemberId('');
      setShowPayModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashMutationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mutationAmount <= 0) return;
    addCashMovement({
      movement_type: mutationType,
      category: mutationCategory,
      amount: Number(mutationAmount),
      notes: mutationNotes.trim() || undefined,
    });
    showToast(`Berhasil mencatat ${mutationType === 'KAS_MASUK' ? 'Kas Masuk' : 'Kas Keluar'} Rp${Number(mutationAmount).toLocaleString('id-ID')}`);
    setShowCashMutationModal(false);
    setMutationNotes('');
  };

  // Calculations for Today's Sales & Cash
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => (o.created_at || '').startsWith(todayStr));
  const todayPaidOrders = todayOrders.filter((o) => o.payment_status === 'PAID');

  const todayGrossSales = todayPaidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const todayPointsDiscount = todayPaidOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);

  // Cash flow calculations
  const initialCashFloat = 200000; // Modal awal kasir
  const todayPayments = payments.filter((p) => (p.timestamp || (p as any).created_at || '').startsWith(todayStr));
  const todayCashSales = todayPayments.reduce((sum, p) => sum + (p.amount_cash || 0), 0);
  const todayTransferSales = todayPayments.reduce((sum, p) => sum + (p.amount_transfer || 0), 0);

  const todayCashLedger = cashLedger.filter((c) => (c.created_at || '').startsWith(todayStr));
  const todayKasMasuk = todayCashLedger
    .filter((c) => c.movement_type === 'KAS_MASUK')
    .reduce((sum, c) => sum + c.amount, 0);
  const todayKasKeluar = todayCashLedger
    .filter((c) => c.movement_type === 'KAS_KELUAR')
    .reduce((sum, c) => sum + c.amount, 0);

  // Expected cash in drawer
  const expectedCashInDrawer = initialCashFloat + todayCashSales + todayKasMasuk - todayKasKeluar;
  const cashDifference = actualCashCounted - expectedCashInDrawer;

  const handleClosingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingClosing(true);
    try {
      recordCashierClosing({
        cashier_id: currentUser.id,
        cashier_name: currentUser.full_name,
        shift_date: todayStr,
        total_orders: todayPaidOrders.length,
        total_sales: todayGrossSales,
        total_cash: todayCashSales,
        total_transfer: todayTransferSales,
        total_points_value: todayPointsDiscount,
        cash_in_drawer_expected: expectedCashInDrawer,
        cash_in_drawer_actual: actualCashCounted,
        difference: cashDifference,
        notes: closingNotes || `Closing shift kasir ${currentUser.full_name}. Laci fisik dihitung Rp${actualCashCounted.toLocaleString('id-ID')}`,
      });
      showToast('Laporan Closing Kasir BERHASIL dikirim langsung ke Dashboard Owner!');
      setClosingNotes('');
    } finally {
      setIsSubmittingClosing(false);
    }
  };

  const filteredMenuItems = menuItems.filter((m) => {
    if (selectedCategory !== 'ALL' && m.category_id !== selectedCategory) return false;
    if (searchMenu && !m.name.toLowerCase().includes(searchMenu.toLowerCase())) return false;
    return true;
  });

  const selectedMember = members.find((m: any) => m.id === selectedMemberId);
  const maxMemberPoints = selectedMember ? selectedMember.points : 0;

  // Active KDS Orders
  const activeKdsOrders = orders.filter((o) => o.status === 'ACCEPTED' || o.status === 'IN_PROCESS' || o.status === 'READY');

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] pb-24">
      {/* Top Banner */}
      <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4 mb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <h2 className="text-sm font-extrabold text-[#1F1E1D]">Terminal Kasir Operasional</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Petugas: <strong>{currentUser.full_name}</strong> • Modal Awal Kas: Rp{initialCashFloat.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowPrinterSettingsModal(true)}
            className="px-2.5 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Pengaturan Printer Bluetooth & Kabel USB"
          >
            <Printer className="w-3.5 h-3.5 text-[#4A2E1B]" />
            <span>Printer (BT/Kabel)</span>
          </button>
          <button
            onClick={async () => {
              const res = await printerService.testPrint(activeTenant.name);
              showToast(res.message, res.success ? 'success' : 'info');
            }}
            className="px-2.5 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-100 transition flex items-center gap-1 cursor-pointer"
          >
            <span>Uji Struk</span>
          </button>
        </div>
      </div>

      {/* Role Navigation Tabs for Cashier */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-stone-100 rounded-2xl mb-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('pos')}
          className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'pos' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[10px]">Kasir POS</span>
        </button>
        <button
          onClick={() => setActiveTab('daily_sales')}
          className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'daily_sales' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-[10px]">Penjualan</span>
        </button>
        <button
          onClick={() => setActiveTab('cash_flow')}
          className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'cash_flow' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span className="text-[10px]">Kas Masuk/Keluar</span>
        </button>
        <button
          onClick={() => setActiveTab('closing')}
          className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'closing' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span className="text-[10px]">Closing Kasir</span>
        </button>
        <button
          onClick={() => setActiveTab('kds_queue')}
          className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center gap-1 cursor-pointer relative ${
            activeTab === 'kds_queue' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span className="text-[10px]">Antrean KDS</span>
          {activeKdsOrders.length > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center font-bold">
              {activeKdsOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: POS TERMINAL */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in duration-150">
          {/* Left 2 Cols: Menu Browser */}
          <div className="lg:col-span-2 space-y-3.5">
            {/* Search & Categories */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari kopi, pastry, makanan..."
                  value={searchMenu}
                  onChange={(e) => setSearchMenu(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-stone-200 text-xs outline-none"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'bg-[#4A2E1B] text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  Semua
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === c.id
                        ? 'bg-[#4A2E1B] text-white shadow-xs'
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid - With count indicator when selected */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredMenuItems.map((item) => {
                const cartItem = cart.find((c) => c.item.id === item.id);
                const qtyInCart = cartItem ? cartItem.quantity : 0;
                const isSelected = qtyInCart > 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleAddToCart(item)}
                    className={`relative bg-white rounded-2xl border p-2.5 shadow-xs transition cursor-pointer flex flex-col justify-between group select-none ${
                      isSelected
                        ? 'border-[#4A2E1B] ring-2 ring-[#4A2E1B]/20 bg-amber-50/20'
                        : 'border-stone-200 hover:border-[#4A2E1B] hover:shadow-md'
                    }`}
                  >
                    {/* Visual Badge Indicator with Item Count */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-[#4A2E1B] text-amber-200 font-black text-xs flex items-center justify-center shadow-md animate-in zoom-in-75">
                        {qtyInCart}
                      </div>
                    )}

                    <div className="aspect-4/3 rounded-xl overflow-hidden bg-stone-100 mb-2 relative">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-150"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#4A2E1B]/10 pointer-events-none" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#1F1E1D] line-clamp-1">{item.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono font-bold text-xs text-[#4A2E1B]">
                          Rp{item.price.toLocaleString('id-ID')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg font-bold text-xs transition flex items-center gap-0.5 ${
                            isSelected
                              ? 'bg-[#4A2E1B] text-white shadow-xs'
                              : 'bg-[#4A2E1B]/10 text-[#4A2E1B] group-hover:bg-[#4A2E1B] group-hover:text-white'
                          }`}
                        >
                          {isSelected ? `${qtyInCart}x` : '+'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 1 Col: Order Summary & Cart */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between h-fit sticky top-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h3 className="font-extrabold text-xs text-[#1F1E1D] flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#4A2E1B]" />
                  Pesanan Saat Ini
                </h3>
                <span className="text-[10px] font-mono text-stone-500">
                  {cart.reduce((s, c) => s + c.quantity, 0)} Item Terpilih
                </span>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Nama Tamu</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">Tipe & Meja</label>
                  <div className="flex gap-1">
                    <select
                      value={orderType}
                      onChange={(e: any) => setOrderType(e.target.value)}
                      className="px-1.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white"
                    >
                      <option value="DINE_IN">Dine In</option>
                      <option value="TAKEAWAY">Takeaway</option>
                    </select>
                    {orderType === 'DINE_IN' && (
                      <div className="flex items-center gap-1">
                        <select
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          className="px-1.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white font-bold font-mono outline-none"
                        >
                          {tables.map((t) => (
                            <option key={t.id} value={t.table_number}>
                              {t.table_number} ({t.status === 'AVAILABLE' ? 'Kosong' : 'Terisi'})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const found = tables.find((t) => t.table_number === tableNumber) || tables[0];
                            if (found) setSelectedBarcodeTable(found);
                          }}
                          className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
                          title="Lihat / Cetak Barcode Meja Ini"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Member Selector */}
              <div className="p-2.5 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Member Loyalty
                  </span>
                  {selectedMember && (
                    <span className="text-[10px] font-bold text-amber-800">
                      Saldo: {selectedMember.points} Poin
                    </span>
                  )}
                </div>
                <select
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    setRedeemPoints(0);
                  }}
                  className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs outline-none"
                >
                  <option value="">-- Tamu Walk-in (Bukan Member) --</option>
                  {members.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.phone}) - {m.points} Pts [{m.tier}]
                    </option>
                  ))}
                </select>

                {selectedMember && maxMemberPoints > 0 && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-stone-600">Tukar Poin (-Rp100/poin):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={Math.min(maxMemberPoints, Math.floor(subtotal / 100))}
                        value={redeemPoints}
                        onChange={(e) => setRedeemPoints(Number(e.target.value))}
                        className="w-16 px-1.5 py-0.5 border border-amber-300 rounded text-xs text-right font-mono"
                      />
                      <span className="text-[10px] text-stone-500">Pts</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-stone-400">
                    <ShoppingBag className="w-8 h-8 mx-auto stroke-1 opacity-50 mb-1" />
                    <p className="text-xs">Keranjang masih kosong</p>
                    <span className="text-[10px] text-stone-400">Sentuh menu untuk menambahkan</span>
                  </div>
                ) : (
                  cart.map((line) => (
                    <div
                      key={line.item.id}
                      className="flex items-center justify-between p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <h5 className="font-bold text-[#1F1E1D] truncate">{line.item.name}</h5>
                        <span className="text-[10px] text-stone-500 font-mono">
                          Rp{line.item.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleUpdateQty(line.item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-stone-200 text-stone-700 flex items-center justify-center font-bold hover:bg-stone-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold font-mono text-xs">{line.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(line.item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-stone-200 text-stone-700 flex items-center justify-center font-bold hover:bg-stone-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveFromCart(line.item.id)}
                          className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal</span>
                <span className="font-mono">Rp{subtotal.toLocaleString('id-ID')}</span>
              </div>
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Diskon Poin ({redeemPoints} Pts)</span>
                  <span className="font-mono">-Rp{pointsDiscount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-500">
                <span>PB1 ({Math.round(taxRate * 100)}%)</span>
                <span className="font-mono">Rp{taxAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Service ({Math.round(serviceRate * 100)}%)</span>
                <span className="font-mono">Rp{serviceAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                <span className="font-extrabold text-sm text-[#1F1E1D]">Total Tagihan</span>
                <span className="font-mono font-black text-base text-[#4A2E1B]">
                  Rp{totalBill.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={() => {
                  setCashTendered(totalBill);
                  setShowPayModal(true);
                }}
                className={`w-full py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition mt-2 cursor-pointer ${
                  cart.length > 0
                    ? 'bg-[#4A2E1B] hover:bg-[#3D2616] text-white'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar Sekarang (Rp{totalBill.toLocaleString('id-ID')})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY SALES REPORT */}
      {activeTab === 'daily_sales' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#1F1E1D]">Laporan Penjualan Harian Kasir</h3>
              <p className="text-xs text-stone-500">Tanggal: {todayStr} • Transaksi lunas kasir</p>
            </div>
            <button
              onClick={() => testPrintReceipt()}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Ringkasan</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold text-stone-500 block mb-0.5">Total Omzet Bruto</span>
              <p className="text-lg font-extrabold text-[#4A2E1B]">
                Rp{todayGrossSales.toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-stone-400 font-medium">Hari ini ({todayPaidOrders.length} struk)</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold text-stone-500 block mb-0.5">Pembayaran Tunai (Cash)</span>
              <p className="text-lg font-extrabold text-emerald-700">
                Rp{todayCashSales.toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">Masuk laci kas</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold text-stone-500 block mb-0.5">Non-Tunai / QRIS / Transfer</span>
              <p className="text-lg font-extrabold text-blue-900">
                Rp{todayTransferSales.toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-blue-700 font-medium">Masuk rekening</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-[10px] font-bold text-stone-500 block mb-0.5">Diskon Poin Member</span>
              <p className="text-lg font-extrabold text-amber-700">
                Rp{todayPointsDiscount.toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-stone-400 font-medium">Potongan loyalitas</span>
            </div>
          </div>

          {/* Order Struk List */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
            <h4 className="font-extrabold text-xs text-[#1F1E1D]">Daftar Struk Penjualan Hari Ini</h4>
            {todayPaidOrders.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-6">Belum ada transaksi struk lunas hari ini.</p>
            ) : (
              <div className="space-y-2">
                {todayPaidOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-900">{ord.order_number}</span>
                        <span className="font-bold text-[#1F1E1D]">{ord.customer_name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          {ord.payment_status}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        {ord.order_type} {ord.table_number ? `• Meja ${ord.table_number}` : ''} • {ord.items.length} Menu • Jam {(ord.created_at || '').slice(11, 16)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="font-mono font-extrabold text-xs text-[#4A2E1B] block">
                          Rp{ord.total_amount.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {(ord as any).payment_method || 'CASH'}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedOrderForReceipt(ord)}
                        className="p-1.5 bg-white border border-stone-200 hover:border-amber-400 rounded-lg text-stone-600 hover:text-[#4A2E1B] transition cursor-pointer shadow-2xs"
                        title="Lihat & Cetak Struk Thermal"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DAILY CASH FLOW (KAS MASUK & KAS KELUAR) */}
      {activeTab === 'cash_flow' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#1F1E1D]">Mutasi Kas Masuk & Kas Keluar Harian</h3>
              <p className="text-xs text-stone-500">Pencatatan kas kecil laci (Petty Cash Operasional)</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMutationType('KAS_MASUK');
                  setMutationCategory('Modal Tambahan / Kas Masuk');
                  setShowCashMutationModal(true);
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>+ Kas Masuk</span>
              </button>
              <button
                onClick={() => {
                  setMutationType('KAS_KELUAR');
                  setMutationCategory('Beli Es Batu / Galon');
                  setShowCashMutationModal(true);
                }}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>- Kas Keluar</span>
              </button>
            </div>
          </div>

          {/* Current Drawer Cash Balance */}
          <div className="p-4 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-2xl shadow-md">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block mb-1">
              Posisi Kas Fisik Laci Kasir Saat Ini
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black font-mono text-amber-200">
                Rp{expectedCashInDrawer.toLocaleString('id-ID')}
              </h3>
              <span className="text-xs text-stone-300 font-medium">(Saldo Kas Seharusnya)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-stone-700 text-xs">
              <div>
                <span className="text-[10px] text-stone-400 block">Modal Awal Kas</span>
                <span className="font-mono font-bold">Rp{initialCashFloat.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">Penjualan Tunai</span>
                <span className="font-mono font-bold text-emerald-400">+Rp{todayCashSales.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">Kas Masuk - Keluar</span>
                <span className="font-mono font-bold text-amber-300">
                  {todayKasMasuk - todayKasKeluar >= 0 ? '+' : ''}Rp{(todayKasMasuk - todayKasKeluar).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Mutation History */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
            <h4 className="font-extrabold text-xs text-[#1F1E1D]">Catatan Mutasi Kas Harian</h4>
            {todayCashLedger.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-6">Belum ada mutasi kas keluar/masuk hari ini.</p>
            ) : (
              <div className="space-y-2">
                {todayCashLedger.map((c) => {
                  const isMasuk = c.movement_type === 'KAS_MASUK';
                  return (
                    <div
                      key={c.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                            isMasuk ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isMasuk ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <h5 className="font-bold text-[#1F1E1D]">{c.category}</h5>
                          <p className="text-[10px] text-stone-500">
                            {c.notes || 'Tanpa keterangan'} • Oleh: {c.performed_by_name} • {(c.created_at || '').slice(11, 16)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`font-mono font-extrabold text-xs ${
                          isMasuk ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {isMasuk ? '+' : '-'}Rp{c.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CLOSING CASHIER */}
      {activeTab === 'closing' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#1F1E1D]">Closing Shift & Rekap Keuangan Kasir</h3>
              <p className="text-xs text-stone-500">
                Laporan ini akan langsung dikirim dan tersinkronisasi ke Dashboard Owner.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
              Shift Hari Ini: {todayStr}
            </span>
          </div>

          {/* System Calculation Breakdown */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
            <h4 className="font-extrabold text-xs text-[#1F1E1D] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#4A2E1B]" />
              Kalkulasi Kas Berdasarkan Sistem
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Modal Kas Awal</span>
                <span className="font-mono font-bold text-sm text-[#1F1E1D]">
                  Rp{initialCashFloat.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Penjualan Tunai POS</span>
                <span className="font-mono font-bold text-sm text-emerald-700">
                  Rp{todayCashSales.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Kas Masuk Operasional</span>
                <span className="font-mono font-bold text-sm text-emerald-700">
                  +Rp{todayKasMasuk.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Kas Keluar Operasional</span>
                <span className="font-mono font-bold text-sm text-red-700">
                  -Rp{todayKasKeluar.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 block">Non-Tunai / QRIS (Bank)</span>
                <span className="font-mono font-bold text-sm text-blue-900">
                  Rp{todayTransferSales.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl">
                <span className="text-[10px] text-amber-900 font-bold block">Uang Kas Fisik yang Diharapkan</span>
                <span className="font-mono font-black text-sm text-[#4A2E1B]">
                  Rp{expectedCashInDrawer.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Form Hitung Fisik Kasir & Submit to Owner */}
          <div className="bg-white rounded-2xl border border-[#4A2E1B]/30 p-4 shadow-sm space-y-4">
            <h4 className="font-extrabold text-xs text-[#1F1E1D] flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#4A2E1B]" />
              Formulir Tutup Kasir & Validasi Fisik
            </h4>

            <form onSubmit={handleClosingSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Hitung Uang Fisik Nyata di Laci Kasir (Rp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-xs text-stone-400">Rp</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={actualCashCounted || ''}
                    onChange={(e) => setActualCashCounted(Number(e.target.value))}
                    placeholder="Masukkan jumlah uang kertas dan koin di laci..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-sm text-[#1F1E1D] focus:border-[#4A2E1B] outline-none"
                  />
                </div>
                <div className="flex gap-1.5 mt-2">
                  {[expectedCashInDrawer, 500000, 750000, 1000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setActualCashCounted(preset)}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded text-[10px] font-mono font-bold text-stone-700 transition"
                    >
                      Rp{preset.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Selisih Real-time */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  cashDifference === 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : cashDifference < 0
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {cashDifference === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {cashDifference === 0
                        ? 'Status: Laci Kas Balance 100% (Sesuai Sistem)'
                        : cashDifference < 0
                        ? `Status: Tekor / Minus Kas Fisik (-Rp${Math.abs(cashDifference).toLocaleString('id-ID')})`
                        : `Status: Kelebihan Kas Fisik (+Rp${cashDifference.toLocaleString('id-ID')})`}
                    </span>
                    <span className="text-[10px] opacity-80">
                      Sistem: Rp{expectedCashInDrawer.toLocaleString('id-ID')} vs Fisik: Rp{actualCashCounted.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Catatan / Keterangan Shift Kasir
                </label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan catatan kondisi operasional, serah terima laci kasir, atau alasan selisih..."
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#4A2E1B] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingClosing}
                className="w-full py-3 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Kirim Laporan Closing Kasir ke Dashboard Owner</span>
              </button>
            </form>
          </div>

          {/* Historical Submitted Closings */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
            <h4 className="font-extrabold text-xs text-[#1F1E1D]">Riwayat Laporan Closing Shift Kasir</h4>
            {cashierClosings.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-6">Belum ada riwayat closing kasir.</p>
            ) : (
              <div className="space-y-2">
                {cashierClosings.map((cl) => (
                  <div
                    key={cl.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1F1E1D]">{cl.cashier_name}</span>
                        <span className="text-[10px] text-stone-400 font-mono">Tgl {cl.shift_date}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                          {cl.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        Omzet: Rp{cl.total_sales.toLocaleString('id-ID')} • Fisik Kas: Rp{cl.cash_in_drawer_actual.toLocaleString('id-ID')} • Selisih: {cl.difference === 0 ? 'Rp0 (Balance)' : `Rp${cl.difference.toLocaleString('id-ID')}`}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-stone-400">
                      {(cl.closed_at || '').slice(11, 16)} WIB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ANTREAN KDS */}
      {activeTab === 'kds_queue' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#1F1E1D]">Pantauan Antrean KDS Bar & Dapur</h3>
              <p className="text-xs text-stone-500">
                Memungkinkan kasir memantau status pesanan tamu secara langsung
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900">
              {activeKdsOrders.length} Pesanan Aktif
            </span>
          </div>

          {activeKdsOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-400">
              <Coffee className="w-10 h-10 mx-auto stroke-1 opacity-50 mb-2" />
              <p className="text-xs font-bold text-stone-600">Tidak ada antrean pesanan aktif saat ini</p>
              <span className="text-[10px] text-stone-400">Semua pesanan selesai disajikan</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeKdsOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-extrabold text-amber-900 text-xs">{ord.order_number}</span>
                        <span className="text-xs font-bold text-[#1F1E1D]">• {ord.customer_name}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          ord.status === 'READY'
                            ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                            : ord.status === 'IN_PROCESS'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-500 my-1 font-medium">
                      {ord.order_type} {ord.table_number ? `• Meja ${ord.table_number}` : ''}
                    </div>

                    <div className="space-y-1 my-2">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs py-0.5 border-b border-stone-50">
                          <span className="font-medium text-stone-800">
                            {it.quantity}x {it.name || it.item_name}
                          </span>
                          {it.notes && (
                            <span className="text-[10px] text-amber-700 italic">{it.notes}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-1.5 pt-2 border-t border-stone-100">
                    {ord.status === 'ACCEPTED' && (
                      <button
                        onClick={() => {
                          updateOrderStatus(ord.id, 'IN_PROCESS');
                          showToast(`Order #${ord.order_number} sedang diracik.`);
                        }}
                        className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition"
                      >
                        Mulai Racik
                      </button>
                    )}
                    {ord.status === 'IN_PROCESS' && (
                      <button
                        onClick={() => {
                          updateOrderStatus(ord.id, 'READY');
                          showToast(`Order #${ord.order_number} SIAP DISAJIKAN!`);
                        }}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition"
                      >
                        Siap Saji
                      </button>
                    )}
                    {ord.status === 'READY' && (
                      <button
                        onClick={() => {
                          updateOrderStatus(ord.id, 'COMPLETED');
                          showToast(`Order #${ord.order_number} SELESAI diserahkan.`);
                        }}
                        className="flex-1 py-1.5 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-lg text-[10px] font-bold transition"
                      >
                        Diserahkan (Selesai)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: PEMBAYARAN KASIR */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#4A2E1B] flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#1F1E1D]">Konfirmasi Pembayaran</h4>
                  <p className="text-[10px] text-stone-500">Pilih metode bayar & terima uang tamu</p>
                </div>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-center">
              <span className="text-[10px] text-stone-500 uppercase font-bold block mb-0.5">
                Total yang Harus Dibayar
              </span>
              <span className="text-xl font-mono font-black text-[#4A2E1B]">
                Rp{totalBill.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'bg-[#4A2E1B] text-white border-[#4A2E1B]'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                Tunai (Cash)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition cursor-pointer ${
                  paymentMethod === 'TRANSFER'
                    ? 'bg-[#4A2E1B] text-white border-[#4A2E1B]'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                QRIS / Transfer
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('SPLIT')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition cursor-pointer ${
                  paymentMethod === 'SPLIT'
                    ? 'bg-[#4A2E1B] text-white border-[#4A2E1B]'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                Split Bayar
              </button>
            </div>

            {paymentMethod === 'CASH' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-500 block">Uang Diterima dari Tamu</label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-stone-200 rounded-xl outline-none"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {[totalBill, 50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(amt)}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded text-[10px] font-mono font-bold text-stone-700"
                    >
                      Rp{amt.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800">Kembalian:</span>
                  <span className="font-mono font-black text-sm text-emerald-900">
                    Rp{changeDue.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing || (paymentMethod === 'CASH' && cashTendered < totalBill)}
                onClick={handleCompletePayment}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-[#4A2E1B] hover:bg-[#3D2616] transition shadow-xs disabled:opacity-50"
              >
                {isProcessing ? 'Memproses...' : 'Selesaikan Transaksi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CATAT KAS MASUK / KELUAR */}
      {showCashMutationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                    mutationType === 'KAS_MASUK' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {mutationType === 'KAS_MASUK' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#1F1E1D]">
                    {mutationType === 'KAS_MASUK' ? 'Catat Kas Masuk' : 'Catat Kas Keluar'}
                  </h4>
                  <p className="text-[10px] text-stone-500">Pengeluaran & penerimaan uang tunai laci</p>
                </div>
              </div>
              <button
                onClick={() => setShowCashMutationModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCashMutationSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nominal (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={mutationAmount}
                  onChange={(e) => setMutationAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Kategori</label>
                <select
                  value={mutationCategory}
                  onChange={(e) => setMutationCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white outline-none"
                >
                  {mutationType === 'KAS_KELUAR' ? (
                    <>
                      <option value="Beli Es Batu / Galon">Beli Es Batu / Galon</option>
                      <option value="Beli Susu Segar Darurat">Beli Susu Segar Darurat</option>
                      <option value="Operasional Kasir & Plastik">Operasional Kasir & Plastik</option>
                      <option value="Gas LPG / Listrik">Gas LPG / Token Listrik</option>
                      <option value="Kebersihan & Perlengkapan">Kebersihan & Perlengkapan</option>
                      <option value="Lainnya">Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="Modal Tambahan / Kas Masuk">Modal Tambahan / Kas Masuk</option>
                      <option value="Setoran Tunai Tambahan">Setoran Tunai Tambahan</option>
                      <option value="Pengembalian Kasbon">Pengembalian Kasbon</option>
                      <option value="Lainnya">Lainnya</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Keterangan / Keperluan</label>
                <input
                  type="text"
                  placeholder="Contoh: Beli 2 balok es kristal di warung sebelah"
                  value={mutationNotes}
                  onChange={(e) => setMutationNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCashMutationModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 rounded-xl text-xs font-bold text-white transition shadow-xs ${
                    mutationType === 'KAS_MASUK' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-700 hover:bg-red-800'
                  }`}
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PENGATURAN PRINTER BLUETOOTH & KABEL */}
      <PrinterSettingsModal
        isOpen={showPrinterSettingsModal}
        onClose={() => setShowPrinterSettingsModal(false)}
        showToast={showToast}
      />

      {/* MODAL 4: CETAK STRUK PEMBAYARAN THERMAL */}
      <ReceiptPrintModal
        order={selectedOrderForReceipt}
        isOpen={!!selectedOrderForReceipt}
        onClose={() => setSelectedOrderForReceipt(null)}
        showToast={showToast}
        cashierName={currentUser.full_name}
        cafeName={activeTenant.name}
      />

      {/* MODAL 5: BARCODE & QR MEJA */}
      {selectedBarcodeTable && (
        <TableBarcodeModal
          table={selectedBarcodeTable}
          cafeName={activeTenant.name}
          isOpen={true}
          onClose={() => setSelectedBarcodeTable(null)}
          onTestOrderTable={(tblNum) => {
            setOrderType('DINE_IN');
            setTableNumber(tblNum);
            showToast(`Meja terpilih: "${tblNum}"!`, 'info');
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};
