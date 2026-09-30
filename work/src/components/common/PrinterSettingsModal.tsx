import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Bluetooth, 
  Cable, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Smartphone, 
  Settings2,
  Sliders,
  FileText,
  Sparkles
} from 'lucide-react';
import { printerService, PrinterDeviceStatus } from '../../lib/printer/printerService';
import { useCafe } from '../../context/CafeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const PrinterSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const { printerConfig, updatePrinterConfig } = useCafe();
  const [printerStatus, setPrinterStatus] = useState<PrinterDeviceStatus>(printerService.getStatus());
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const unsubscribe = printerService.onStatusChange((status) => {
      setPrinterStatus(status);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const isBluetoothSupported = printerService.isBluetoothSupported();
  const isSerialSupported = printerService.isSerialSupported();

  const handleConnectBluetooth = async () => {
    setIsConnecting(true);
    try {
      const res = await printerService.connectBluetooth();
      if (res.success) {
        showToast(`Printer Bluetooth "${res.deviceName}" berhasil terhubung!`, 'success');
        updatePrinterConfig({
          receipt_printer_name: res.deviceName || 'Printer Bluetooth',
          connection_type: 'BLUETOOTH',
        });
      } else {
        showToast(res.error || 'Gagal konek ke Bluetooth', 'error');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectSimulatedBluetooth = () => {
    const res = printerService.connectVirtualBluetooth('RPP-02N Bluetooth POS (58mm)');
    if (res.success) {
      showToast(`Printer Bluetooth "${res.deviceName}" berhasil tersambung!`, 'success');
      updatePrinterConfig({
        receipt_printer_name: res.deviceName,
        connection_type: 'BLUETOOTH',
        paper_width: '58mm',
      });
    }
  };

  const handleConnectCable = async () => {
    setIsConnecting(true);
    try {
      const res = await printerService.connectCable();
      if (res.success) {
        showToast(`Printer Kabel "${res.portName}" berhasil tersambung!`, 'success');
        updatePrinterConfig({
          receipt_printer_name: res.portName || 'Printer Kabel USB',
          connection_type: 'USB',
        });
      } else {
        showToast(res.error || 'Gagal konek ke kabel USB', 'error');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await printerService.disconnect();
    showToast('Koneksi printer telah diputus.', 'info');
  };

  const handleSelectPaper = (width: '58mm' | '80mm') => {
    printerService.setPaperWidth(width);
    updatePrinterConfig({ paper_width: width });
    showToast(`Format kertas diubah ke ${width}`, 'info');
  };

  const handleTestPrint = async () => {
    setIsConnecting(true);
    try {
      const res = await printerService.testPrint('Young Space Café');
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast('Gagal memproses cetak struk uji coba.', 'error');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestKitchenPrint = async () => {
    setIsConnecting(true);
    try {
      const res = await printerService.testPrintKitchenTicket('Young Space Café');
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast('Gagal memproses cetak tiket dapur uji coba.', 'error');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#4A2E1B] text-amber-200 flex items-center justify-center font-bold shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#1F1E1D]">Pengaturan Printer Kasir & Bar</h3>
              <p className="text-[10px] text-stone-500">Koneksi Bluetooth, Kabel USB, dan Dialog Sistem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Connection Status Banner */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
          printerStatus.isConnected
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-stone-50 border-stone-200 text-stone-700'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full shrink-0 ${printerStatus.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>{printerStatus.isConnected ? 'Printer Terhubung' : 'Belum Ada Printer Terkoneksi'}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/80 border border-stone-200">
                  {printerStatus.paperWidth}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5 truncate max-w-[220px]">
                {printerStatus.deviceName || 'Mencetak otomatis via Dialog Sistem Browser / Virtual'}
              </p>
            </div>
          </div>

          {printerStatus.isConnected && (
            <button
              onClick={handleDisconnect}
              className="text-[10px] font-bold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg border border-red-200 hover:bg-red-50 cursor-pointer transition"
            >
              Putus
            </button>
          )}
        </div>

        {/* CONNECTION METHODS */}
        <div className="space-y-2.5">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">
            Pilih Mode Koneksi Perangkat
          </div>

          {/* Option 1: Bluetooth */}
          <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Bluetooth className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1F1E1D]">Printer Bluetooth Thermal</h4>
                  <p className="text-[10px] text-stone-500">Cocok untuk printer portabel 58mm (Panda, Iware, RPP-02N)</p>
                </div>
              </div>

              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                isBluetoothSupported ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-500'
              }`}>
                {isBluetoothSupported ? 'Tersedia' : 'Tak Didukung'}
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                disabled={isConnecting}
                onClick={handleConnectBluetooth}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Bluetooth className="w-4 h-4" />
                <span>{isConnecting ? 'Mencari Perangkat...' : 'Pindai & Pasangkan Bluetooth Hardware'}</span>
              </button>

              <button
                type="button"
                onClick={handleConnectSimulatedBluetooth}
                className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Sambungkan Bluetooth Langsung (RPP-02N 58mm)</span>
              </button>
            </div>
          </div>

          {/* Option 2: Cable USB / Serial */}
          <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                  <Cable className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1F1E1D]">Printer Kabel USB / POS</h4>
                  <p className="text-[10px] text-stone-500">Kabel USB langsung ke printer kasir 80mm / Epson / Star</p>
                </div>
              </div>

              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                isSerialSupported ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-500'
              }`}>
                {isSerialSupported ? 'Web Serial Aktif' : 'Gunakan Chrome'}
              </span>
            </div>

            <button
              disabled={isConnecting}
              onClick={handleConnectCable}
              className="w-full py-2 bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Cable className="w-3.5 h-3.5" />
              <span>{isConnecting ? 'Membuka Port...' : 'Koneksikan Printer Kabel USB'}</span>
            </button>
          </div>

          {/* Option 3: Browser Virtual / System Print */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-[#1F1E1D] block">Cetak Dialog Sistem (Universal)</span>
                <span className="text-[10px] text-stone-500">Mendukung semua printer driver OS tanpa pairing</span>
              </div>
            </div>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Selalu Siap
            </span>
          </div>
        </div>

        {/* Paper Size Settings */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">
            Ukuran Kertas Thermal Struk
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSelectPaper('58mm')}
              className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                printerStatus.paperWidth === '58mm'
                  ? 'border-amber-800 bg-amber-50/70 text-amber-950 font-bold ring-1 ring-amber-800'
                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span className="text-xs block font-extrabold">58mm (Kecil)</span>
              <span className="text-[10px] text-stone-500 mt-0.5 block">Format Standar Bluetooth</span>
            </button>

            <button
              onClick={() => handleSelectPaper('80mm')}
              className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                printerStatus.paperWidth === '80mm'
                  ? 'border-amber-800 bg-amber-50/70 text-amber-950 font-bold ring-1 ring-amber-800'
                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span className="text-xs block font-extrabold">80mm (Lebar)</span>
              <span className="text-[10px] text-stone-500 mt-0.5 block">Format Kasir Standar Meja</span>
            </button>
          </div>
        </div>

        {/* Auto Print Toggles */}
        <div className="space-y-2 pt-1 border-t border-stone-100 text-xs">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">
            Preferensi Otomatis Kasir & Dapur
          </div>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 cursor-pointer">
            <div>
              <span className="font-bold text-[#1F1E1D] block text-xs">Auto-Print Struk Pembayaran Kasir</span>
              <span className="text-[10px] text-stone-500">Cetak struk pelanggan segera setelah transaksi lunas</span>
            </div>
            <input
              type="checkbox"
              checked={printerConfig.auto_print_dine_in}
              onChange={(e) => updatePrinterConfig({ auto_print_dine_in: e.target.checked })}
              className="w-4 h-4 rounded text-amber-800 focus:ring-amber-800"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-xl hover:bg-amber-50/70 border border-amber-200/80 bg-amber-50/40 cursor-pointer">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#1F1E1D] text-xs">Auto-Print Tiket Dapur & Bar (KDS)</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-amber-200 text-amber-900 font-bold rounded">
                  Format Ringkasan
                </span>
              </div>
              <span className="text-[10px] text-stone-600 block mt-0.5">
                Otomatis cetak tiket pesanan (tanpa harga/pembayaran) ke printer dapur saat kasir mencetak struk
              </span>
            </div>
            <input
              type="checkbox"
              checked={printerConfig.auto_print_kitchen_ticket ?? true}
              onChange={(e) => updatePrinterConfig({ auto_print_kitchen_ticket: e.target.checked })}
              className="w-4 h-4 rounded text-amber-800 focus:ring-amber-800"
            />
          </label>
        </div>

        {/* Actions: Dual Test Print & Close */}
        <div className="pt-2 space-y-2 border-t border-stone-100">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isConnecting}
              onClick={handleTestPrint}
              className="py-2.5 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Uji Struk Kasir</span>
            </button>

            <button
              type="button"
              disabled={isConnecting}
              onClick={handleTestKitchenPrint}
              className="py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Uji Tiket Dapur (KDS)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
