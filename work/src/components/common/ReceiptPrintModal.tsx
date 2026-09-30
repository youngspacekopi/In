import React, { useState } from 'react';
import { Printer, X, CheckCircle2, Settings, Download, Coffee, UtensilsCrossed, FileText } from 'lucide-react';
import { Order } from '../../types/cafe';
import { printerService } from '../../lib/printer/printerService';
import { PrinterSettingsModal } from './PrinterSettingsModal';

interface Props {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  cashierName?: string;
  cafeName?: string;
}

export const ReceiptPrintModal: React.FC<Props> = ({
  order,
  isOpen,
  onClose,
  showToast,
  cashierName = 'Budi Santoso (Kasir POS)',
  cafeName = 'Young Space Café',
}) => {
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [previewTab, setPreviewTab] = useState<'RECEIPT' | 'KITCHEN_TICKET'>('RECEIPT');
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !order) return null;

  const handlePrintCustomerReceipt = async () => {
    setIsPrinting(true);
    try {
      const res = await printerService.printReceipt(order, cafeName, cashierName);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast('Gagal memproses cetak struk kasir.', 'error');
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintKitchenTicket = async () => {
    setIsPrinting(true);
    try {
      const res = await printerService.printKitchenTicket(order, cafeName, cashierName);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast('Gagal memproses cetak tiket dapur.', 'error');
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintBoth = async () => {
    setIsPrinting(true);
    try {
      const res = await printerService.printCustomerAndKitchenReceipts(order, cafeName, cashierName);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast('Gagal memproses cetak kedua dokumen.', 'error');
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const formattedDate = new Date(order.created_at || Date.now()).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalItemsCount = order.items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-3.5 max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#4A2E1B] flex items-center justify-center font-bold">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#1F1E1D]">Pratinjau Cetak Thermal</h4>
                <p className="text-[10px] text-stone-500">Order #{order.order_number}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Preview: Struk Kasir vs Tiket Dapur */}
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => setPreviewTab('RECEIPT')}
              className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                previewTab === 'RECEIPT'
                  ? 'bg-white text-[#4A2E1B] shadow-2xs font-extrabold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="text-[11px]">Struk Kasir (Full)</span>
            </button>
            <button
              onClick={() => setPreviewTab('KITCHEN_TICKET')}
              className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                previewTab === 'KITCHEN_TICKET'
                  ? 'bg-white text-[#4A2E1B] shadow-2xs font-extrabold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span className="text-[11px]">Tiket Dapur (KDS)</span>
            </button>
          </div>

          {/* Thermal Paper Viewport */}
          <div className="flex-1 overflow-y-auto bg-stone-50 p-4 rounded-2xl border border-dashed border-stone-300 font-mono text-[11px] leading-tight text-stone-800 shadow-inner">
            {previewTab === 'RECEIPT' ? (
              /* FORMAT STRUK KASIR LENGKAP */
              <div>
                <div className="text-center space-y-0.5 mb-3">
                  <h3 className="font-black text-sm tracking-wider uppercase text-stone-900">{cafeName}</h3>
                  <p className="text-[9px] text-stone-500">Jl. Palagan Tentara Pelajar No. 88, Sleman</p>
                  <p className="text-[9px] text-stone-500">Telp: +62 812-3456-7890</p>
                </div>

                <div className="border-t border-dashed border-stone-400 my-2" />

                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-stone-500">No. Order</span>
                    <span className="font-bold">#{order.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Waktu</span>
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Kasir</span>
                    <span>{cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Pelanggan</span>
                    <span className="font-bold">{order.customer_name || 'Pelanggan Walk-In'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Tipe Order</span>
                    <span>{order.order_type} {order.table_number ? `(${order.table_number})` : ''}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-400 my-2" />

                {/* Items */}
                <div className="space-y-1.5 my-2">
                  {order.items.map((it, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between">
                        <span className="font-bold text-stone-900">
                          {it.quantity}x {(it as any).item_name || (it as any).menuItem?.name || 'Item'}
                        </span>
                        <span className="font-bold">
                          Rp{(it.subtotal || it.quantity * it.unit_price).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {it.notes && (
                        <div className="text-[9px] text-stone-500 italic pl-2">* {it.notes}</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-stone-400 my-2" />

                {/* Calculations */}
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp{(order.subtotal || order.total_amount).toLocaleString('id-ID')}</span>
                  </div>
                  {order.discount_amount ? (
                    <div className="flex justify-between text-amber-900 font-bold">
                      <span>Diskon Poin</span>
                      <span>-Rp{order.discount_amount.toLocaleString('id-ID')}</span>
                    </div>
                  ) : null}
                  {order.tax_amount ? (
                    <div className="flex justify-between">
                      <span>PPN (11%)</span>
                      <span>Rp{order.tax_amount.toLocaleString('id-ID')}</span>
                    </div>
                  ) : null}
                </div>

                <div className="border-t-2 border-stone-900 my-2" />

                <div className="flex justify-between text-xs font-black text-stone-900 py-0.5">
                  <span>TOTAL AKHIR</span>
                  <span>Rp{order.total_amount.toLocaleString('id-ID')}</span>
                </div>

                <div className="border-t border-dashed border-stone-400 my-2" />

                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>Metode Bayar</span>
                    <span className="font-bold">{(order as any).payment_method || 'CASH'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Status Bayar</span>
                    <span>LUNAS</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-400 my-2" />

                <div className="text-center text-[9px] text-stone-500 space-y-0.5 pt-1">
                  <p className="font-bold">*** STRUK PEMBAYARAN RESMI ***</p>
                  <p>Terima kasih atas kunjungan Anda!</p>
                </div>
              </div>
            ) : (
              /* FORMAT TIKET RINGKASAN DAPUR / KDS */
              <div>
                <div className="text-center space-y-1 mb-2">
                  <div className="inline-block px-2 py-0.5 bg-black text-white text-[10px] font-black tracking-wider uppercase rounded">
                    TIKET DAPUR & BAR (KDS)
                  </div>
                  <h3 className="font-extrabold text-xs tracking-tight uppercase text-stone-800">{cafeName}</h3>
                </div>

                <div className="border-t-2 border-stone-900 my-2" />

                <div className="text-center my-2">
                  <div className="text-base font-black tracking-tight text-stone-900">
                    #{order.order_number}
                  </div>
                  <div className="text-xs font-black mt-0.5 uppercase bg-stone-200 py-0.5 px-2 rounded inline-block">
                    {order.table_number ? `MEJA: ${order.table_number}` : `[ ${order.order_type} ]`}
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-400 my-2" />

                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Waktu Order</span>
                    <span className="font-bold">{formattedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Kasir Petugas</span>
                    <span>{cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Pelanggan</span>
                    <span className="font-bold">{order.customer_name || 'Pelanggan Walk-In'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Tipe Layanan</span>
                    <span className="font-bold">{order.order_type}</span>
                  </div>
                </div>

                <div className="border-t-2 border-stone-900 my-2" />

                <div className="text-[10px] font-black text-stone-900 mb-2 uppercase">
                  Menu Yang Harus Diracik ({totalItemsCount} Item):
                </div>

                {/* Items in Kitchen Ticket: NO PRICES, LARGE QTY & DISTINCT NOTES */}
                <div className="space-y-2">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="pb-1.5 border-b border-dashed border-stone-300">
                      <div className="flex items-start gap-1.5">
                        <span className="px-1.5 py-0.2 bg-black text-white font-black text-xs rounded">
                          {it.quantity}x
                        </span>
                        <span className="font-black text-xs uppercase leading-tight text-stone-900">
                          {(it as any).item_name || (it as any).menuItem?.name || 'Item'}
                        </span>
                      </div>
                      {it.notes && (
                        <div className="mt-1 pl-2 text-[10px] font-bold text-amber-900 bg-amber-100/70 p-1 rounded border-l-2 border-amber-800">
                          NOTE: {it.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-stone-900 my-2" />

                <div className="text-center space-y-0.5 pt-1">
                  <p className="font-black text-[10px] text-stone-900">*** SEGERA DISIAPKAN & RACIK ***</p>
                  <p className="text-[8px] text-stone-400">Ringkasan Dapur Otomatis • Tanpa Rincian Harga</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 shrink-0 pt-1">
            <button
              onClick={handlePrintBoth}
              disabled={isPrinting}
              className="w-full py-2.5 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Mencetak...' : 'Cetak Keduanya (Kasir + Dapur KDS)'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePrintCustomerReceipt}
                disabled={isPrinting}
                className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Struk Kasir</span>
              </button>
              <button
                onClick={handlePrintKitchenTicket}
                disabled={isPrinting}
                className="py-1.5 px-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-900" />
                <span>Tiket Dapur</span>
              </button>
            </div>

            <div className="flex gap-2 pt-1 border-t border-stone-100">
              <button
                onClick={() => setShowPrinterSettings(true)}
                className="flex-1 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
              >
                <Settings className="w-3 h-3 text-stone-500" />
                <span>Atur Printer</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded-xl text-[11px] font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      <PrinterSettingsModal
        isOpen={showPrinterSettings}
        onClose={() => setShowPrinterSettings(false)}
        showToast={showToast}
      />
    </>
  );
};

