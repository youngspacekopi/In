import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Printer, 
  CreditCard, 
  Coins, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  Wallet,
  ArrowRightLeft,
  Receipt,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { usePlatform } from '../../context/PlatformContext';
import { printerService } from '../../lib/printer/printerService';

export const FinancialReportsModule: React.FC = () => {
  const { getFinancialReport, payments, cashTransactions, orders, testPrintReceipt } = useCafe();
  const { activeTenant, currentUser, hasAccess } = usePlatform();

  const [period, setPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('TODAY');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'ALL' | 'CASH' | 'QRIS_TRANSFER' | 'POINTS'>('ALL');
  const [reportTab, setReportTab] = useState<'CHART_OVERVIEW' | 'ORDERS_TABLE' | 'CASH_MOVEMENTS'>('CHART_OVERVIEW');

  const [customStart, setCustomStart] = useState<string>(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  );
  const [customEnd, setCustomEnd] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const canViewReports = hasAccess ? hasAccess('reports:view') : true;

  // Dynamically compute report based on chosen period
  const rawReport = useMemo(() => {
    return getFinancialReport(period, customStart, customEnd);
  }, [getFinancialReport, period, customStart, customEnd]);

  // Apply Granular Filters (Status & Payment Method)
  const filteredOrders = useMemo(() => {
    return rawReport.filteredOrders.filter((ord) => {
      if (statusFilter !== 'ALL' && ord.payment_status !== statusFilter) {
        return false;
      }
      if (paymentMethodFilter !== 'ALL') {
        const orderPayments = payments.filter((p) => p.order_id === ord.id);
        if (paymentMethodFilter === 'CASH') {
          const hasCash = orderPayments.some((p) => p.payment_method === 'CASH' || p.amount_cash > 0);
          if (!hasCash) return false;
        } else if (paymentMethodFilter === 'QRIS_TRANSFER') {
          const hasTransfer = orderPayments.some(
            (p) => p.payment_method === 'TRANSFER' || p.amount_transfer > 0
          );
          if (!hasTransfer) return false;
        } else if (paymentMethodFilter === 'POINTS') {
          const hasPoints = orderPayments.some(
            (p) => p.payment_method === 'POINT' || p.amount_points_value > 0
          );
          if (!hasPoints) return false;
        }
      }
      return true;
    });
  }, [rawReport.filteredOrders, statusFilter, paymentMethodFilter, payments]);

  // Calculate totals from filtered orders
  const metrics = useMemo(() => {
    const totalTransactions = filteredOrders.length;
    const paidOrders = filteredOrders.filter(o => o.payment_status === 'PAID');
    const totalGross = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalCOGS = paidOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, it) => s + (it.cost_price || 0) * it.quantity, 0),
      0
    );
    const grossProfit = totalGross - totalCOGS;
    const marginPercent = totalGross > 0 ? Math.round((grossProfit / totalGross) * 100 * 10) / 10 : 0;

    // Filtered Cash, Transfer, Points from related payments
    const filteredOrderIds = new Set(paidOrders.map((o) => o.id));
    const relevantPayments = payments.filter((p) => filteredOrderIds.has(p.order_id));
    const totalCash = relevantPayments.reduce(
      (sum, p) => sum + (p.amount_cash || (p.payment_method === 'CASH' ? p.total_bill : 0)),
      0
    );
    const totalTransfer = relevantPayments.reduce(
      (sum, p) => sum + (p.amount_transfer || (p.payment_method === 'TRANSFER' ? p.total_bill : 0)),
      0
    );
    const totalPoints = relevantPayments.reduce(
      (sum, p) => sum + (p.amount_points_value || (p.payment_method === 'POINT' ? p.total_bill : 0)),
      0
    );

    // Filtered cash movements
    const relevantCashTrx = rawReport.filteredCashTrx || [];
    const totalKasMasuk = relevantCashTrx.filter(c => c.type === 'KAS_MASUK').reduce((s, c) => s + c.amount, 0);
    const totalKasKeluar = relevantCashTrx.filter(c => c.type === 'KAS_KELUAR').reduce((s, c) => s + c.amount, 0);
    const netCashFlow = totalKasMasuk - totalKasKeluar;

    return {
      totalTransactions,
      paidTransactionsCount: paidOrders.length,
      totalGross,
      totalCOGS,
      grossProfit,
      marginPercent,
      totalCash,
      totalTransfer,
      totalPoints,
      totalKasMasuk,
      totalKasKeluar,
      netCashFlow,
      relevantCashTrx,
    };
  }, [filteredOrders, payments, rawReport.filteredCashTrx]);

  // Payment Breakdown Percentages
  const paymentBreakdown = useMemo(() => {
    const total = metrics.totalCash + metrics.totalTransfer + metrics.totalPoints;
    if (total === 0) {
      return { cashPct: 0, transferPct: 0, pointsPct: 0 };
    }
    return {
      cashPct: Math.round((metrics.totalCash / total) * 100),
      transferPct: Math.round((metrics.totalTransfer / total) * 100),
      pointsPct: Math.round((metrics.totalPoints / total) * 100),
    };
  }, [metrics.totalCash, metrics.totalTransfer, metrics.totalPoints]);

  // Export to Excel (.XLS) with rich styling
  const handleExportXLS = () => {
    if (!canViewReports) {
      showNotification('Akses Ditolak: Anda tidak memiliki wewenang mengekspor laporan.', 'info');
      return;
    }

    const tenantName = activeTenant?.name || 'Young Space Café';
    const exportDateStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const ordersTableRows = filteredOrders.map((o) => {
      const cogs = o.items.reduce((s, it) => s + (it.cost_price || 0) * it.quantity, 0);
      const profit = o.total_amount - cogs;
      const margin = o.total_amount > 0 ? Math.round((profit / o.total_amount) * 100) : 0;
      const itemsList = o.items.map(it => `${it.quantity}x ${it.item_name}`).join(', ');

      return `
        <tr>
          <td style="border:1px solid #d1d5db; padding:6px; font-weight:bold;">${o.order_number}</td>
          <td style="border:1px solid #d1d5db; padding:6px;">${new Date(o.created_at).toLocaleString('id-ID')}</td>
          <td style="border:1px solid #d1d5db; padding:6px;">${o.customer_name || 'Pelanggan'}</td>
          <td style="border:1px solid #d1d5db; padding:6px;">${o.order_type} ${o.table_number ? '(' + o.table_number + ')' : ''}</td>
          <td style="border:1px solid #d1d5db; padding:6px;">${itemsList}</td>
          <td style="border:1px solid #d1d5db; padding:6px; text-align:right; font-weight:bold;">Rp${o.total_amount.toLocaleString('id-ID')}</td>
          <td style="border:1px solid #d1d5db; padding:6px; text-align:right; color:#4b5563;">Rp${cogs.toLocaleString('id-ID')}</td>
          <td style="border:1px solid #d1d5db; padding:6px; text-align:right; color:#15803d; font-weight:bold;">Rp${profit.toLocaleString('id-ID')}</td>
          <td style="border:1px solid #d1d5db; padding:6px; text-align:center;">${margin}%</td>
          <td style="border:1px solid #d1d5db; padding:6px; text-align:center; font-weight:bold; color:${o.payment_status === 'PAID' ? '#15803d' : '#b45309'};">
            ${o.payment_status}
          </td>
        </tr>
      `;
    }).join('');

    const cashRows = metrics.relevantCashTrx.map((c) => `
      <tr>
        <td style="border:1px solid #d1d5db; padding:6px;">${new Date(c.timestamp).toLocaleString('id-ID')}</td>
        <td style="border:1px solid #d1d5db; padding:6px; font-weight:bold; color:${c.type === 'KAS_MASUK' ? '#15803d' : '#dc2626'};">${c.type}</td>
        <td style="border:1px solid #d1d5db; padding:6px;">${c.category}</td>
        <td style="border:1px solid #d1d5db; padding:6px; text-align:right; font-weight:bold; color:${c.type === 'KAS_MASUK' ? '#15803d' : '#dc2626'};">
          ${c.type === 'KAS_MASUK' ? '+' : '-'}Rp${c.amount.toLocaleString('id-ID')}
        </td>
        <td style="border:1px solid #d1d5db; padding:6px;">${c.description || '-'}</td>
        <td style="border:1px solid #d1d5db; padding:6px;">${c.performed_by}</td>
      </tr>
    `).join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Laporan Keuangan</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #111; }
            h1 { font-size: 16pt; color: #4A2E1B; margin-bottom: 4px; }
            h2 { font-size: 13pt; color: #1F1E1D; margin-top: 18px; margin-bottom: 6px; }
            .kpi-table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            .kpi-header { background-color: #4A2E1B; color: #ffffff; font-weight: bold; text-align: left; padding: 8px; }
            .kpi-cell { border: 1px solid #d1d5db; padding: 8px; font-size: 11pt; }
            .kpi-val { font-weight: bold; font-family: Consolas, monospace; text-align: right; }
          </style>
        </head>
        <body>
          <h1>LAPORAN ARUS KAS & KEUANGAN RESMI - ${tenantName.toUpperCase()}</h1>
          <p style="margin: 0; color: #6b7280; font-size: 10pt;">
            Periode: <strong>${rawReport.dateLabel}</strong> &bull; Dicetak Oleh: <strong>${currentUser.full_name} (${currentUser.role})</strong> &bull; Waktu Unduh: ${exportDateStr}
          </p>

          <h2>1. RINGKASAN EKSEKUTIF KEUANGAN & LABA</h2>
          <table class="kpi-table">
            <tr>
              <th class="kpi-header" style="background:#4A2E1B;">Indikator Finansial</th>
              <th class="kpi-header" style="background:#4A2E1B; text-align:right;">Nilai Akumulasi (Rp)</th>
              <th class="kpi-header" style="background:#4A2E1B;">Keterangan & Rasio</th>
            </tr>
            <tr>
              <td class="kpi-cell">Total Penjualan Kotor (Gross Sales)</td>
              <td class="kpi-cell kpi-val" style="color:#111;">Rp${metrics.totalGross.toLocaleString('id-ID')}</td>
              <td class="kpi-cell">Dari ${metrics.paidTransactionsCount} pesanan lunas</td>
            </tr>
            <tr>
              <td class="kpi-cell">Total HPP Modal Bahan Baku (COGS)</td>
              <td class="kpi-cell kpi-val" style="color:#b91c1c;">Rp${metrics.totalCOGS.toLocaleString('id-ID')}</td>
              <td class="kpi-cell">Modal bahan resep racikan menu</td>
            </tr>
            <tr style="background:#f0fdf4;">
              <td class="kpi-cell" style="font-weight:bold; color:#15803d;">Laba Kotor (Gross Profit)</td>
              <td class="kpi-cell kpi-val" style="color:#15803d; font-size:12pt;">Rp${metrics.grossProfit.toLocaleString('id-ID')}</td>
              <td class="kpi-cell" style="font-weight:bold; color:#15803d;">Margin Laba: ${metrics.marginPercent}%</td>
            </tr>
            <tr>
              <td class="kpi-cell">Penerimaan Tunai Kasir (Cash Drawer)</td>
              <td class="kpi-cell kpi-val" style="color:#4A2E1B;">Rp${metrics.totalCash.toLocaleString('id-ID')}</td>
              <td class="kpi-cell">Uang cash fisik transaksi (${paymentBreakdown.cashPct}%)</td>
            </tr>
            <tr>
              <td class="kpi-cell">Penerimaan Non-Tunai (QRIS & Transfer Bank)</td>
              <td class="kpi-cell kpi-val" style="color:#1d4ed8;">Rp${metrics.totalTransfer.toLocaleString('id-ID')}</td>
              <td class="kpi-cell">Masuk rekening café (${paymentBreakdown.transferPct}%)</td>
            </tr>
            <tr>
              <td class="kpi-cell">Nilai Penukaran Poin Diskon</td>
              <td class="kpi-cell kpi-val" style="color:#b45309;">Rp${metrics.totalPoints.toLocaleString('id-ID')}</td>
              <td class="kpi-cell">Potongan loyalty member (${paymentBreakdown.pointsPct}%)</td>
            </tr>
            <tr>
              <td class="kpi-cell">Total Kas Masuk Non-Order (Modal/Setoran)</td>
              <td class="kpi-cell kpi-val" style="color:#15803d;">+Rp${metrics.totalKasMasuk.toLocaleString('id-ID')}</td>
              <td class="kpi-cell">Modal awal kasir & setoran laci</td>
            </tr>
            <tr>
              <td class="kpi-cell">Total Kas Keluar (Petty Cash Operasional)</td>
              <td class="kpi-cell kpi-val" style="color:#dc2626;">-Rp${metrics.totalKasKeluar.toLocaleString('id-ID')}</td>
              <td class="kpi-cell">Beli es batu, galon, bahan darurat</td>
            </tr>
            <tr style="background:#faf5ff;">
              <td class="kpi-cell" style="font-weight:bold;">Net Arus Kas (Net Cash Flow)</td>
              <td class="kpi-cell kpi-val" style="font-weight:bold; color:#6b21a8;">
                ${metrics.netCashFlow >= 0 ? '+' : ''}Rp${metrics.netCashFlow.toLocaleString('id-ID')}
              </td>
              <td class="kpi-cell">Kas Masuk - Kas Keluar</td>
            </tr>
          </table>

          <h2>2. BUKU TRANSAKSI PENJUALAN DETAIL (${filteredOrders.length} Order)</h2>
          <table style="border-collapse:collapse; width:100%; font-size:10pt;">
            <thead>
              <tr style="background:#f3f4f6; font-weight:bold;">
                <th style="border:1px solid #d1d5db; padding:6px;">No. Order</th>
                <th style="border:1px solid #d1d5db; padding:6px;">Waktu</th>
                <th style="border:1px solid #d1d5db; padding:6px;">Pelanggan</th>
                <th style="border:1px solid #d1d5db; padding:6px;">Tipe</th>
                <th style="border:1px solid #d1d5db; padding:6px;">Daftar Item Menu</th>
                <th style="border:1px solid #d1d5db; padding:6px; text-align:right;">Penjualan (Rp)</th>
                <th style="border:1px solid #d1d5db; padding:6px; text-align:right;">HPP Modal (Rp)</th>
                <th style="border:1px solid #d1d5db; padding:6px; text-align:right;">Laba Kotor (Rp)</th>
                <th style="border:1px solid #d1d5db; padding:6px; text-align:center;">Margin</th>
                <th style="border:1px solid #d1d5db; padding:6px; text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${ordersTableRows}
            </tbody>
          </table>

          <h2>3. BUKU ARUS KAS LACI & MUTASI OPERASIONAL (${metrics.relevantCashTrx.length} Catatan)</h2>
          <table style="border-collapse:collapse; width:100%; font-size:10pt;">
            <thead>
              <tr style="background:#f3f4f6; font-weight:bold;">
                <th style="border:1px solid #d1d5db; padding:6px;">Waktu Mutasi</th>
                <th style="border:1px solid #d1d5db; padding:6px;">Jenis</th>
                <th style="border:1px solid #d1d5db; padding:6px;">Kategori</th>
                <th style="border:1px solid #d1d5db; padding:6px; text-align:right;">Nominal (Rp)</th>
                <th style="border:1px solid #d1d5db; padding:6px;">Keperluan / Catatan</th>
                <th style="border:1px solid #d1d5db; padding:6px;">Petugas</th>
              </tr>
            </thead>
            <tbody>
              ${cashRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Keuangan_${tenantName.replace(/\s+/g, '_')}_${period}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification(`Laporan XLS Excel berhasil diekspor (${filteredOrders.length} transaksi).`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!canViewReports) {
      showNotification('Akses Ditolak: Anda tidak memiliki wewenang mengekspor laporan.', 'info');
      return;
    }
    const headers = ['No Order', 'Waktu', 'Pelanggan', 'Tipe', 'Total Penjualan', 'HPP Modal', 'Laba Bersih', 'Status Bayar'];
    const rows = filteredOrders.map((o) => {
      const cogs = o.items.reduce((s, it) => s + (it.cost_price || 0) * it.quantity, 0);
      const profit = o.total_amount - cogs;
      return [
        o.order_number,
        o.created_at,
        `"${o.customer_name}"`,
        o.order_type,
        o.total_amount,
        cogs,
        profit,
        o.payment_status,
      ].join(',');
    });

    const summaryRows = [
      '',
      '--- RINGKASAN FILTER AKTIF ---',
      `Filter Periode,${period}`,
      `Filter Status,${statusFilter}`,
      `Filter Metode Pembayaran,${paymentMethodFilter}`,
      `Total Transaksi,${metrics.totalTransactions}`,
      `Total Penjualan Kotor,${metrics.totalGross}`,
      `Total HPP Modal,${metrics.totalCOGS}`,
      `Laba Kotor,${metrics.grossProfit}`,
      `Margin Laba %,${metrics.marginPercent}%`,
      `Total Cash,${metrics.totalCash}`,
      `Total Transfer/Non-Cash,${metrics.totalTransfer}`,
      `Total Point Redemption,${metrics.totalPoints}`,
      `Diekspor Oleh,"${currentUser.full_name} (${currentUser.role})"`,
      `Waktu Ekspor,${new Date().toISOString()}`,
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows, ...summaryRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan_Kasir_${activeTenant?.name || 'KOPIIN'}_${period}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`File CSV berhasil diunduh (${filteredOrders.length} transaksi).`);
  };

  // Print Summary Slip
  const handlePrintSummary = () => {
    testPrintReceipt();
    showNotification('Ringkasan laporan kas terkirim ke printer kasir.');
  };

  if (!canViewReports) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 shadow-xs">
        <h3 className="font-bold text-red-600 text-base mb-2">Akses Dibatasi</h3>
        <p className="text-xs text-stone-500">
          Akun Anda ({currentUser.role}) tidak memiliki izin untuk melihat atau mengekspor laporan transaksi.
        </p>
      </div>
    );
  }

  // Visual Bar Calculation helpers for Chart
  const maxBarValue = Math.max(metrics.totalGross, metrics.totalKasMasuk, metrics.totalKasKeluar, metrics.totalCOGS, 1);
  const salesBarHeight = Math.max(8, Math.round((metrics.totalGross / maxBarValue) * 140));
  const cogsBarHeight = Math.max(8, Math.round((metrics.totalCOGS / maxBarValue) * 140));
  const profitBarHeight = Math.max(8, Math.round((Math.max(0, metrics.grossProfit) / maxBarValue) * 140));
  const cashInBarHeight = Math.max(8, Math.round((metrics.totalKasMasuk / maxBarValue) * 140));
  const cashOutBarHeight = Math.max(8, Math.round((metrics.totalKasKeluar / maxBarValue) * 140));

  return (
    <div className="space-y-4">
      {/* Header & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-[#4A2E1B] text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">Laporan Keuangan & Arus Kas Realtime</h2>
              <span className="text-[10px] text-amber-200/80">Outlet: {activeTenant?.name || 'Young Space Café'}</span>
            </div>
          </div>
          <p className="text-xs text-stone-300 max-w-xl">
            Tersinkronisasi langsung dengan transaksi POS kasir, perhitungan HPP resep menu, kas laci, dan pembayaran QRIS/Transfer.
          </p>
        </div>

        {/* Action Buttons: Export XLS, CSV, Print */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleExportXLS}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Ekspor ke Format Microsoft Excel (.xls) dengan tabel dan format rapi"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export ke XLS</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-stone-700/80 hover:bg-stone-700 text-stone-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-600"
            title="Ekspor CSV Mentah"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrintSummary}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-amber-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Cetak Ringkasan Thermal Kasir"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice.message}</span>
        </div>
      )}

      {/* Filter Period & Granular Filter Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-[#4A2E1B]" />
              Periode:
            </span>
            {(['TODAY', 'WEEK', 'MONTH', 'CUSTOM'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  period === p
                    ? 'bg-[#4A2E1B] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {p === 'TODAY'
                  ? 'Hari Ini'
                  : p === 'WEEK'
                  ? '7 Hari Terakhir'
                  : p === 'MONTH'
                  ? 'Bulan Ini'
                  : 'Rentang Kustom'}
              </button>
            ))}
          </div>

          {period === 'CUSTOM' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs font-mono outline-none"
              />
              <span className="text-stone-400">s/d</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs font-mono outline-none"
              />
            </div>
          )}

          <div className="text-[11px] font-mono font-bold text-stone-600">
            Terfilter: <span className="text-[#15803D]">{filteredOrders.length} Pesanan ({rawReport.dateLabel})</span>
          </div>
        </div>

        {/* Secondary Filter Badges: Status & Payment Method */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-stone-500 text-[11px]">Status Order:</span>
            {(['ALL', 'PAID', 'PENDING'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-0.8 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st === 'ALL' ? 'Semua' : st === 'PAID' ? 'Lunas' : 'Menunggu'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-stone-500 text-[11px]">Metode Bayar:</span>
            {(['ALL', 'CASH', 'QRIS_TRANSFER', 'POINTS'] as const).map((pm) => (
              <button
                key={pm}
                onClick={() => setPaymentMethodFilter(pm)}
                className={`px-2.5 py-0.8 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  paymentMethodFilter === pm
                    ? 'bg-amber-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {pm === 'ALL'
                  ? 'Semua'
                  : pm === 'CASH'
                  ? 'Tunai'
                  : pm === 'QRIS_TRANSFER'
                  ? 'QRIS / Transfer'
                  : 'Poin'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Core Financial KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Gross Sales */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-bold text-stone-600">Total Omset</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-mono font-black text-[#1F1E1D]">
            Rp{metrics.totalGross.toLocaleString('id-ID')}
          </div>
          <p className="text-[10px] text-stone-500">
            {metrics.paidTransactionsCount} transaksi lunas terfilter
          </p>
        </div>

        {/* Card 2: HPP Modal */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-bold text-stone-600">Total HPP Modal</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-mono font-black text-stone-700">
            Rp{metrics.totalCOGS.toLocaleString('id-ID')}
          </div>
          <p className="text-[10px] text-stone-500">
            Modal bahan baku & kemasan
          </p>
        </div>

        {/* Card 3: Gross Profit & Margin */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-bold text-stone-600">Laba Kotor</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-mono font-black text-[#15803D]">
            Rp{metrics.grossProfit.toLocaleString('id-ID')}
          </div>
          <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Margin Bersih +{metrics.marginPercent}%
          </p>
        </div>

        {/* Card 4: Net Cash Flow Drawer */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span className="font-bold text-stone-600">Kas Masuk vs Keluar</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center font-bold">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-xl font-mono font-black ${metrics.netCashFlow >= 0 ? 'text-[#15803D]' : 'text-red-600'}`}>
            {metrics.netCashFlow >= 0 ? '+' : ''}Rp{metrics.netCashFlow.toLocaleString('id-ID')}
          </div>
          <p className="text-[10px] text-stone-500">
            Masuk: Rp{metrics.totalKasMasuk.toLocaleString('id-ID')} | Keluar: Rp{metrics.totalKasKeluar.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Tabs View Switcher: Grafik & Visualisasi vs Tabel Transaksi vs Buku Kas */}
      <div className="flex p-1 bg-stone-100 rounded-2xl text-xs font-bold gap-1">
        <button
          onClick={() => setReportTab('CHART_OVERVIEW')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            reportTab === 'CHART_OVERVIEW'
              ? 'bg-white text-[#4A2E1B] shadow-2xs font-extrabold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Grafik & Visualisasi Keuangan</span>
        </button>

        <button
          onClick={() => setReportTab('ORDERS_TABLE')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            reportTab === 'ORDERS_TABLE'
              ? 'bg-white text-[#4A2E1B] shadow-2xs font-extrabold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Buku Transaksi ({filteredOrders.length})</span>
        </button>

        <button
          onClick={() => setReportTab('CASH_MOVEMENTS')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            reportTab === 'CASH_MOVEMENTS'
              ? 'bg-white text-[#4A2E1B] shadow-2xs font-extrabold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Mutasi Kas Laci ({metrics.relevantCashTrx.length})</span>
        </button>
      </div>

      {/* VIEW TAB 1: GRAFIK & VISUALISASI KEAMANAN MODERN */}
      {reportTab === 'CHART_OVERVIEW' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Main Visual Chart: Perbandingan Multi-Bar Chart */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#1F1E1D]">Grafik Perbandingan Finansial & Arus Kas</h3>
                  <p className="text-[10px] text-stone-500">Perbandingan riil skala nominal ({rawReport.dateLabel})</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Data Realtime
              </span>
            </div>

            {/* High-Fidelity Bar Chart Visualization */}
            <div className="pt-6 pb-2 px-2 sm:px-6 bg-stone-50 rounded-2xl border border-stone-100 flex items-end justify-around gap-2 sm:gap-6 min-h-[220px]">
              {/* Bar 1: Omset Penjualan */}
              <div className="flex-1 flex flex-col items-center gap-2 max-w-[80px]">
                <span className="text-[10px] font-mono font-bold text-amber-950 text-center leading-tight">
                  Rp{(metrics.totalGross / 1000).toFixed(0)}k
                </span>
                <div
                  style={{ height: `${salesBarHeight}px` }}
                  className="w-full bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-xl shadow-xs transition-all duration-500 hover:brightness-110"
                />
                <span className="text-[10px] font-extrabold text-stone-700 text-center">Omset</span>
              </div>

              {/* Bar 2: HPP Modal */}
              <div className="flex-1 flex flex-col items-center gap-2 max-w-[80px]">
                <span className="text-[10px] font-mono font-bold text-stone-700 text-center leading-tight">
                  Rp{(metrics.totalCOGS / 1000).toFixed(0)}k
                </span>
                <div
                  style={{ height: `${cogsBarHeight}px` }}
                  className="w-full bg-gradient-to-t from-stone-600 to-stone-400 rounded-t-xl shadow-xs transition-all duration-500 hover:brightness-110"
                />
                <span className="text-[10px] font-extrabold text-stone-700 text-center">HPP Modal</span>
              </div>

              {/* Bar 3: Laba Kotor */}
              <div className="flex-1 flex flex-col items-center gap-2 max-w-[80px]">
                <span className="text-[10px] font-mono font-bold text-emerald-800 text-center leading-tight">
                  Rp{(Math.max(0, metrics.grossProfit) / 1000).toFixed(0)}k
                </span>
                <div
                  style={{ height: `${profitBarHeight}px` }}
                  className="w-full bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-xl shadow-xs transition-all duration-500 hover:brightness-110"
                />
                <span className="text-[10px] font-extrabold text-emerald-800 text-center">Laba Kotor</span>
              </div>

              {/* Bar 4: Kas Masuk */}
              <div className="flex-1 flex flex-col items-center gap-2 max-w-[80px]">
                <span className="text-[10px] font-mono font-bold text-blue-900 text-center leading-tight">
                  Rp{(metrics.totalKasMasuk / 1000).toFixed(0)}k
                </span>
                <div
                  style={{ height: `${cashInBarHeight}px` }}
                  className="w-full bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-xl shadow-xs transition-all duration-500 hover:brightness-110"
                />
                <span className="text-[10px] font-extrabold text-blue-800 text-center">Kas Masuk</span>
              </div>

              {/* Bar 5: Kas Keluar */}
              <div className="flex-1 flex flex-col items-center gap-2 max-w-[80px]">
                <span className="text-[10px] font-mono font-bold text-red-700 text-center leading-tight">
                  Rp{(metrics.totalKasKeluar / 1000).toFixed(0)}k
                </span>
                <div
                  style={{ height: `${cashOutBarHeight}px` }}
                  className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t-xl shadow-xs transition-all duration-500 hover:brightness-110"
                />
                <span className="text-[10px] font-extrabold text-red-700 text-center">Kas Keluar</span>
              </div>
            </div>

            {/* Legend Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-[11px] text-stone-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-700" />
                <span>Omset: Rp{metrics.totalGross.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-600" />
                <span>Laba: Rp{metrics.grossProfit.toLocaleString('id-ID')} ({metrics.marginPercent}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-blue-600" />
                <span>Kas Masuk: Rp{metrics.totalKasMasuk.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-red-600" />
                <span>Kas Keluar: Rp{metrics.totalKasKeluar.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Secondary Visual: 2 Side-by-side Distribution Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Panel 1: Komposisi Metode Pembayaran */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-[#1F1E1D] flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-blue-700" />
                  <span>Komposisi Jalur Pembayaran ({rawReport.dateLabel})</span>
                </h4>
                <span className="text-[10px] font-mono font-bold text-stone-500">
                  Rp{(metrics.totalCash + metrics.totalTransfer + metrics.totalPoints).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Multi-Segment Stacked Progress Bar */}
              <div className="h-4 w-full bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${paymentBreakdown.cashPct}%` }}
                  className="bg-emerald-600 h-full transition-all duration-500"
                  title={`Tunai: ${paymentBreakdown.cashPct}%`}
                />
                <div
                  style={{ width: `${paymentBreakdown.transferPct}%` }}
                  className="bg-blue-600 h-full transition-all duration-500"
                  title={`QRIS/Transfer: ${paymentBreakdown.transferPct}%`}
                />
                <div
                  style={{ width: `${paymentBreakdown.pointsPct}%` }}
                  className="bg-amber-500 h-full transition-all duration-500"
                  title={`Poin: ${paymentBreakdown.pointsPct}%`}
                />
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="font-bold text-stone-800">Tunai Kasir (Fisik Laci)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-stone-900 block">Rp{metrics.totalCash.toLocaleString('id-ID')}</span>
                    <span className="text-[10px] text-stone-500">{paymentBreakdown.cashPct}% porsi</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="font-bold text-stone-800">QRIS & Transfer Bank</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-stone-900 block">Rp{metrics.totalTransfer.toLocaleString('id-ID')}</span>
                    <span className="text-[10px] text-stone-500">{paymentBreakdown.transferPct}% porsi</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-bold text-stone-800">Diskon Poin Loyalty</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-stone-900 block">Rp{metrics.totalPoints.toLocaleString('id-ID')}</span>
                    <span className="text-[10px] text-stone-500">{paymentBreakdown.pointsPct}% porsi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: Proporsi Struktur HPP vs Laba Bersih */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-[#1F1E1D] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>Struktur Efisiensi HPP vs Laba Kotor</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +{metrics.marginPercent}% Margin
                </span>
              </div>

              {/* Progress Bar of Gross Profit vs COGS */}
              <div className="h-4 w-full bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${metrics.marginPercent}%` }}
                  className="bg-emerald-600 h-full transition-all duration-500"
                  title={`Laba Bersih: ${metrics.marginPercent}%`}
                />
                <div
                  style={{ width: `${Math.max(0, 100 - metrics.marginPercent)}%` }}
                  className="bg-stone-500 h-full transition-all duration-500"
                  title={`HPP Modal: ${Math.max(0, 100 - metrics.marginPercent)}%`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Laba Kotor</span>
                  <span className="text-base font-mono font-black text-emerald-800">
                    Rp{metrics.grossProfit.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">{metrics.marginPercent}% dari omset</span>
                </div>

                <div className="p-3 bg-stone-100 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-600 font-bold uppercase block">HPP Modal Bahan</span>
                  <span className="text-base font-mono font-black text-stone-700">
                    Rp{metrics.totalCOGS.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-stone-500 block mt-0.5">{Math.max(0, 100 - metrics.marginPercent)}% dari omset</span>
                </div>
              </div>

              <p className="text-[10px] text-stone-500 leading-tight">
                * HPP otomatis dihitung dari resep masing-masing menu (biji kopi, susu pasteurisasi, cup, sirup) yang terjual di kasir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: TABEL TRANSAKSI PENJUALAN */}
      {reportTab === 'ORDERS_TABLE' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs animate-in fade-in duration-150">
          <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 flex flex-wrap justify-between items-center gap-2">
            <div>
              <span className="font-extrabold text-xs text-[#1F1E1D] block">
                Daftar Transaksi Kasir Terfilter ({filteredOrders.length} Pesanan)
              </span>
              <span className="text-[10px] text-stone-500 font-mono">
                Periode: {rawReport.dateLabel} &bull; Status: {statusFilter} &bull; Metode: {paymentMethodFilter}
              </span>
            </div>
            <button
              onClick={handleExportXLS}
              className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh XLS</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/70 text-stone-600 uppercase font-bold text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">No. Order</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Pelanggan</th>
                  <th className="py-2.5 px-3">Tipe</th>
                  <th className="py-2.5 px-3 text-right">Penjualan</th>
                  <th className="py-2.5 px-3 text-right">HPP Modal</th>
                  <th className="py-2.5 px-3 text-right">Laba Bersih</th>
                  <th className="py-2.5 px-3 text-center">Margin</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-stone-400">
                      Tidak ada transaksi dengan kriteria filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const cogs = ord.items.reduce((s, it) => s + (it.cost_price || 0) * it.quantity, 0);
                    const profit = ord.total_amount - cogs;
                    const margin = ord.total_amount > 0 ? Math.round((profit / ord.total_amount) * 100) : 0;
                    return (
                      <tr key={ord.id} className="hover:bg-stone-50 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#4A2E1B]">
                          #{ord.order_number}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-500 text-[11px]">
                          {new Date(ord.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#1F1E1D]">
                          {ord.customer_name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                            {ord.order_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1F1E1D]">
                          Rp{ord.total_amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-500">
                          Rp{cogs.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#15803D]">
                          Rp{profit.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                            {margin}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.payment_status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.payment_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW TAB 3: MUTASI KAS MASUK & KELUAR */}
      {reportTab === 'CASH_MOVEMENTS' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs animate-in fade-in duration-150">
          <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 flex justify-between items-center">
            <div>
              <span className="font-extrabold text-xs text-[#1F1E1D] block">
                Buku Kas Laci & Mutasi Operasional ({metrics.relevantCashTrx.length} Catatan)
              </span>
              <span className="text-[10px] text-stone-500">
                Penerimaan tunai kasir, modal drawer shift, dan petty cash darurat
              </span>
            </div>
            <div className="text-right">
              <span className={`text-xs font-mono font-black ${metrics.netCashFlow >= 0 ? 'text-[#15803D]' : 'text-red-600'}`}>
                {metrics.netCashFlow >= 0 ? '+' : ''}Rp{metrics.netCashFlow.toLocaleString('id-ID')}
              </span>
              <span className="block text-[9px] text-stone-400">Net Arus Kas</span>
            </div>
          </div>

          <div className="divide-y divide-stone-200">
            {metrics.relevantCashTrx.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">
                Tidak ada mutasi kas untuk rentang waktu ini.
              </div>
            ) : (
              metrics.relevantCashTrx.map((c) => (
                <div key={c.id} className="p-3 hover:bg-stone-50 transition flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          c.type === 'KAS_MASUK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {c.type === 'KAS_MASUK' ? '+ Kas Masuk' : '- Kas Keluar'}
                      </span>
                      <span className="font-bold text-[#1F1E1D]">{c.category}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      {c.description || '-'} &bull; Oleh: <strong>{c.performed_by}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono font-extrabold text-sm ${
                        c.type === 'KAS_MASUK' ? 'text-[#15803D]' : 'text-red-600'
                      }`}
                    >
                      {c.type === 'KAS_MASUK' ? '+' : '-'}Rp{c.amount.toLocaleString('id-ID')}
                    </span>
                    <span className="block text-[10px] text-stone-400 font-mono">
                      {new Date(c.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
