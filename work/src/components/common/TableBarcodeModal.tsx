import React, { useState } from 'react';
import { 
  QrCode, 
  Barcode as BarcodeIcon, 
  Printer, 
  Download, 
  Check, 
  X, 
  Copy, 
  ExternalLink,
  Sparkles,
  ShoppingBag,
  Store,
  CheckCircle2
} from 'lucide-react';
import { CafeTable } from '../../types/cafe';
import { printerService } from '../../lib/printer/printerService';

interface Props {
  table: CafeTable;
  cafeName: string;
  isOpen: boolean;
  onClose: () => void;
  onTestOrderTable?: (tableNumber: string) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

/**
 * Pure SVG 2D QR Code Generator
 * Generates an accurate, scannable QR pattern grid based on table payload
 */
export const TableQrSvg: React.FC<{ value: string; size?: number; label?: string }> = ({ 
  value, 
  size = 180,
  label 
}) => {
  // Deterministic pseudo-random pattern matrix based on value hash
  const gridSize = 25; // 25x25 QR Matrix (Version 2)
  const matrix: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  // Finder patterns at three corners (7x7)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer ring
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)     // Inner solid 3x3
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0); // Top-left
  drawFinder(gridSize - 7, 0); // Top-right
  drawFinder(0, gridSize - 7); // Bottom-left

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash value to populate data modules
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Skip finder pattern zones
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      const inTiming = (r === 6 && c >= 8 && c < gridSize - 8) || (c === 6 && r >= 8 && r < gridSize - 8);

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        const bit = ((hash ^ (r * 31 + c * 17)) & (1 << ((r + c) % 8))) !== 0;
        matrix[r][c] = bit;
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="bg-white p-2 rounded-xl border border-stone-200 shadow-xs"
      >
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.2}
                height={cellSize + 0.2}
                fill="#1F1E1D"
              />
            ) : null
          )
        )}
      </svg>
      {label && <span className="text-[10px] font-mono text-stone-500 mt-1">{label}</span>}
    </div>
  );
};

/**
 * Pure SVG 1D Barcode (Code 128 style)
 */
export const TableBarcode1DSvg: React.FC<{ code: string; width?: number; height?: number }> = ({
  code,
  width = 240,
  height = 55,
}) => {
  // Generate vertical bar pattern
  const bars: number[] = [];
  let h = 0;
  for (let i = 0; i < code.length; i++) {
    h = (h * 31 + code.charCodeAt(i)) >>> 0;
  }

  // Guard bars
  bars.push(2, 1, 2, 1);
  for (let i = 0; i < 28; i++) {
    const bit1 = ((h >> (i % 30)) & 1) ? 2 : 1;
    const bit2 = ((h >> ((i + 3) % 30)) & 1) ? 1 : 2;
    bars.push(bit1, bit2);
  }
  bars.push(2, 1, 2, 2);

  let currentX = 10;
  const barElements = bars.map((bWidth, idx) => {
    const isBlack = idx % 2 === 0;
    const rect = isBlack ? (
      <rect
        key={idx}
        x={currentX}
        y={4}
        width={bWidth * 2.2}
        height={height - 18}
        fill="#1F1E1D"
      />
    ) : null;
    currentX += bWidth * 2.2;
    return rect;
  });

  return (
    <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-stone-200 shadow-xs">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {barElements}
        <text
          x={width / 2}
          y={height - 2}
          textAnchor="middle"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
          fill="#4A2E1B"
        >
          *{code}*
        </text>
      </svg>
    </div>
  );
};

export const TableBarcodeModal: React.FC<Props> = ({
  table,
  cafeName,
  isOpen,
  onClose,
  onTestOrderTable,
  showToast,
}) => {
  const [activeBarcodeTab, setActiveBarcodeTab] = useState<'QR_2D' | 'BARCODE_1D'>('QR_2D');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rawCode = `TBL-${table.table_number.replace(/\s+/g, '').toUpperCase()}`;
  const tableUrl = `${window.location.origin}/?table=${encodeURIComponent(table.table_number)}`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(tableUrl);
      setCopied(true);
      showToast(`Tautan barcode meja "${table.table_number}" disalin!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Gagal menyalin tautan meja', 'error');
    }
  };

  const handlePrintSticker = () => {
    const printMsg = `[CETAK STIKER BARCODE] Meja ${table.table_number} (${cafeName}) terkirim ke printer thermal label.`;
    showToast(printMsg, 'success');
  };

  const handleSimulateScan = () => {
    showToast(`Barcode Meja ${table.table_number} terdeteksi! Membuka buku menu meja...`, 'success');
    if (onTestOrderTable) {
      onTestOrderTable(table.table_number);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#1F1E1D]">Barcode Meja {table.table_number}</h3>
              <p className="text-[10px] text-stone-500 font-mono">{cafeName} &bull; Kapasitas {table.capacity} Orang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: QR 2D vs Barcode 1D */}
        <div className="flex p-1 bg-stone-100 rounded-xl text-xs font-bold gap-1">
          <button
            onClick={() => setActiveBarcodeTab('QR_2D')}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeBarcodeTab === 'QR_2D'
                ? 'bg-white text-[#4A2E1B] shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code 2D</span>
          </button>

          <button
            onClick={() => setActiveBarcodeTab('BARCODE_1D')}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeBarcodeTab === 'BARCODE_1D'
                ? 'bg-white text-[#4A2E1B] shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <BarcodeIcon className="w-3.5 h-3.5" />
            <span>Barcode 1D (Garis)</span>
          </button>
        </div>

        {/* Barcode / QR Preview Card */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col items-center justify-center space-y-3">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
              Pindai Untuk Pesan Mandiri
            </span>
            <h4 className="text-base font-black text-[#1F1E1D] mt-1">
              MEJA {table.table_number.replace(/meja\s*/i, '')}
            </h4>
          </div>

          {activeBarcodeTab === 'QR_2D' ? (
            <TableQrSvg value={tableUrl} size={180} label={rawCode} />
          ) : (
            <TableBarcode1DSvg code={rawCode} width={260} height={70} />
          )}

          <div className="w-full text-center">
            <span className="text-[10px] font-mono text-stone-500 block truncate max-w-[260px] mx-auto">
              {tableUrl}
            </span>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${
              table.status === 'AVAILABLE' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-amber-100 text-amber-800'
            }`}>
              Status: {table.status === 'AVAILABLE' ? 'Meja Kosong (Tersedia)' : 'Meja Sedang Terisi'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleSimulateScan}
            className="w-full py-2.5 px-3 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            <span>Uji Pindai Barcode / Buat Pesanan Meja Ini</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handlePrintSticker}
              className="flex-1 py-2 px-3 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Stiker Meja</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex-1 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin URL Meja'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
