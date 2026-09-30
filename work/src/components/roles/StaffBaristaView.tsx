import React, { useState, useEffect } from 'react';
import { useCafe } from '../../context/CafeContext';
import { usePlatform } from '../../context/PlatformContext';
import { printerService } from '../../lib/printer/printerService';
import { PrinterSettingsModal } from '../common/PrinterSettingsModal';
import { 
  Coffee, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChefHat, 
  Sparkles, 
  Flame, 
  Check,
  Printer
} from 'lucide-react';

interface Props {
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const StaffBaristaView: React.FC<Props> = ({ showToast }) => {
  const { orders, updateOrderStatus, printerConfig } = useCafe();
  const { currentUser, activeTenant } = usePlatform();

  const [kdsFilter, setKdsFilter] = useState<'ALL' | 'IN_PROCESS' | 'READY'>('ALL');
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);

  // Auto-listen for incoming kitchen orders broadcast from Cashier
  useEffect(() => {
    const unsubscribe = printerService.onKitchenOrderBroadcast((data) => {
      if (printerConfig.auto_print_kitchen_ticket) {
        showToast(
          `🔔 Pesanan Masuk #${data.order.order_number}! Tiket ringkasan dapur otomatis dicetak untuk Barista/Dapur.`,
          'info'
        );
        printerService.printKitchenTicket(
          data.order,
          data.cafeName || activeTenant?.name || 'Young Space Bar',
          data.cashierName || 'Kasir POS'
        );
      }
    });

    return unsubscribe;
  }, [printerConfig.auto_print_kitchen_ticket, activeTenant?.name, showToast]);

  // Filter orders needing preparation
  const baristaOrders = orders.filter((o) => {
    if (o.status === 'COMPLETED' || o.status === 'VOIDED') return false;
    if (kdsFilter === 'IN_PROCESS' && o.status !== 'IN_PROCESS' && o.status !== 'ACCEPTED') return false;
    if (kdsFilter === 'READY' && o.status !== 'READY') return false;
    return true;
  });

  const handleUpdateStatus = (orderId: string, nextStatus: any) => {
    updateOrderStatus(orderId, nextStatus);
    showToast(`Status pesanan diperbarui menjadi ${nextStatus}!`);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] pb-24">
      {/* Banner */}
      <div className="bg-gradient-to-r from-orange-950 via-amber-950 to-stone-900 text-white p-4 rounded-2xl mb-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-300 font-bold text-xs">
              B
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-300">Kitchen Display System (KDS)</span>
              <h2 className="text-sm font-extrabold text-white leading-tight">Barista Bar Display: {currentUser.full_name}</h2>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
            Realtime Antrean Masak
          </span>
        </div>
        <p className="text-xs text-stone-300 leading-snug">
          Pantau tiket racikan espresso, manual brew, dan pesanan makanan. Ubah status menjadi Sedang Diracik atau Siap Diantar ke Meja.
        </p>
      </div>

      {/* Filter Tabs and Printer Button */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex gap-1.5 overflow-x-auto">
          {(['ALL', 'IN_PROCESS', 'READY'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setKdsFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                kdsFilter === st
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {st === 'ALL' ? 'Semua Tiket' : st === 'IN_PROCESS' ? 'Perlu Diracik' : 'Siap Diantar'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowPrinterSettings(true)}
          className="px-2.5 py-1.5 bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
          title="Pengaturan Printer Dapur & Bar"
        >
          <Printer className="w-3.5 h-3.5 text-stone-600" />
          <span>Printer</span>
        </button>
      </div>

      {/* KDS Order Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {baristaOrders.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-stone-200">
            <Coffee className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-xs text-stone-500 font-medium">Tidak ada antrean pesanan racikan saat ini.</p>
          </div>
        ) : (
          baristaOrders.map((ord) => {
            const isReady = ord.status === 'READY';
            const isPreparing = ord.status === 'IN_PROCESS';
            return (
              <div
                key={ord.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition shadow-xs ${
                  isReady
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : isPreparing
                    ? 'bg-amber-50/60 border-amber-300'
                    : 'bg-white border-stone-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between border-b border-stone-200/70 pb-2 mb-3">
                    <div>
                      <span className="font-mono font-black text-sm text-[#4A2E1B]">
                        {ord.order_number}
                      </span>
                      <h4 className="font-extrabold text-xs text-[#1F1E1D] mt-0.5">
                        {ord.customer_name}
                      </h4>
                      <p className="text-[10px] text-stone-500">
                        {ord.order_type} {ord.table_number ? `• Meja ${ord.table_number}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={async () => {
                          const res = await printerService.printKitchenTicket(
                            ord,
                            activeTenant?.name || 'Young Space Bar',
                            currentUser.full_name
                          );
                          showToast(res.message, 'success');
                        }}
                        className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition cursor-pointer flex items-center gap-1"
                        title="Cetak Tiket Ringkasan Dapur KDS (Hanya Pesanan & Racikan)"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold">Tiket Dapur</span>
                      </button>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isReady
                            ? 'bg-emerald-200 text-emerald-900'
                            : isPreparing
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-stone-200 text-stone-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2 mb-4">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-md bg-stone-800 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            {item.quantity}x
                          </span>
                          <div>
                            <p className="font-bold text-[#1F1E1D] leading-tight">{item.item_name || (item as any).name}</p>
                            {item.notes && (
                              <p className="text-[10px] text-amber-800 italic mt-0.5 font-medium">
                                * Catatan: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-stone-200/70 flex gap-2">
                  {!isPreparing && !isReady && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'IN_PROCESS')}
                      className="flex-1 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Mulai Diracik</span>
                    </button>
                  )}
                  {isPreparing && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'READY')}
                      className="flex-1 py-2 bg-[#15803D] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Siap Disajikan</span>
                    </button>
                  )}
                  {isReady && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'COMPLETED')}
                      className="flex-1 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Selesai Diantar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Printer Settings Modal for Barista */}
      <PrinterSettingsModal
        isOpen={showPrinterSettings}
        onClose={() => setShowPrinterSettings(false)}
        showToast={showToast}
      />
    </div>
  );

};
