/**
 * KOPIIN – Production Thermal Printer Hardware Service
 * Supports:
 * 1. Web Bluetooth API (Bluetooth Thermal Printer - 58mm / 80mm e.g. RPP-02N, Panda, Iware, Epson)
 * 2. Web Serial API & WebUSB (Direct Cable / USB POS Printer)
 * 3. Browser Native Thermal Print Dialog (High-Fidelity 58mm & 80mm layout via window.print)
 * 4. ESC/POS Command Generator for raw receipt printing
 */

import { Order, PrinterConfig } from '../../types/cafe';

export interface PrinterDeviceStatus {
  isConnected: boolean;
  deviceName: string | null;
  connectionType: 'BLUETOOTH' | 'USB' | 'NETWORK_LAN' | 'SYSTEM';
  paperWidth: '58mm' | '80mm';
  lastError: string | null;
}

// Common Bluetooth Printer GATT Services & Characteristics (Panda, Iware, RPP-02N, Epson, MTP, ZJiang)
const BT_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS Service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Common 58mm/80mm Bluetooth Printers (Iware, Panda, RPP-02N)
  '0000fff0-0000-1000-8000-00805f9b34fb', // PT-210, MTP-II
  '0000ae00-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Epson BLE
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC
];

const BT_PRINTER_CHARACTERISTICS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb', // Most common thermal printer write characteristic
  '0000fff1-0000-1000-8000-00805f9b34fb',
  '0000ae01-0000-1000-8000-00805f9b34fb',
  'bef8d6c1-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
];

class ThermalPrinterService {
  private bluetoothDevice: any = null;
  private bluetoothCharacteristic: any = null;
  private serialPort: any = null;
  private statusListeners: Array<(status: PrinterDeviceStatus) => void> = [];

  private currentStatus: PrinterDeviceStatus = {
    isConnected: false,
    deviceName: null,
    connectionType: 'SYSTEM',
    paperWidth: '58mm',
    lastError: null,
  };

  constructor() {
    // Restore saved printer settings from localStorage if available
    try {
      const saved = localStorage.getItem('kopiin_printer_status');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.currentStatus.connectionType = parsed.connectionType || 'SYSTEM';
        this.currentStatus.paperWidth = parsed.paperWidth || '58mm';
        this.currentStatus.deviceName = parsed.deviceName || null;
      }
    } catch {
      // Ignore storage errors
    }
  }

  public getStatus(): PrinterDeviceStatus {
    return { ...this.currentStatus };
  }

  public onStatusChange(callback: (status: PrinterDeviceStatus) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.getStatus());
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  private notifyStatus() {
    const s = this.getStatus();
    try {
      localStorage.setItem('kopiin_printer_status', JSON.stringify({
        connectionType: s.connectionType,
        paperWidth: s.paperWidth,
        deviceName: s.deviceName,
      }));
    } catch {}
    this.statusListeners.forEach(cb => cb(s));
  }

  public setPaperWidth(width: '58mm' | '80mm') {
    this.currentStatus.paperWidth = width;
    this.notifyStatus();
  }

  public setConnectionType(type: 'BLUETOOTH' | 'USB' | 'NETWORK_LAN' | 'SYSTEM') {
    this.currentStatus.connectionType = type;
    this.notifyStatus();
  }

  /**
   * Check Web Bluetooth availability
   */
  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Check Web Serial API (Cable USB POS) availability
   */
  public isSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /**
   * Check WebUSB availability
   */
  public isUsbSupported(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
  }

  /**
   * Connect to Bluetooth Thermal Printer
   */
  public async connectBluetooth(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isBluetoothSupported()) {
      const errMsg = 'Browser ini belum mendukung Web Bluetooth API. Gunakan Google Chrome atau Android Chrome.';
      this.currentStatus.lastError = errMsg;
      this.notifyStatus();
      return { success: false, error: errMsg };
    }

    try {
      // Request device with optional services
      const navBT = (navigator as any).bluetooth;
      const device = await navBT.requestDevice({
        acceptAllDevices: true,
        optionalServices: BT_PRINTER_SERVICES,
      });

      if (!device) {
        throw new Error('Tidak ada perangkat printer yang dipilih.');
      }

      this.bluetoothDevice = device;
      const server = await device.gatt.connect();

      // Find primary service and writable characteristic
      let writableChar: any = null;

      for (const serviceUuid of BT_PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          if (service) {
            for (const charUuid of BT_PRINTER_CHARACTERISTICS) {
              try {
                const char = await service.getCharacteristic(charUuid);
                if (char && (char.properties.write || char.properties.writeWithoutResponse)) {
                  writableChar = char;
                  break;
                }
              } catch {}
            }
            if (writableChar) break;
          }
        } catch {}
      }

      // If specific service not found, query all services
      if (!writableChar) {
        try {
          const services = await server.getPrimaryServices();
          for (const s of services) {
            const chars = await s.getCharacteristics();
            for (const c of chars) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                writableChar = c;
                break;
              }
            }
            if (writableChar) break;
          }
        } catch {}
      }

      this.bluetoothCharacteristic = writableChar;
      const devName = device.name || 'Printer Bluetooth Thermal';

      this.currentStatus = {
        isConnected: true,
        deviceName: devName,
        connectionType: 'BLUETOOTH',
        paperWidth: this.currentStatus.paperWidth,
        lastError: null,
      };

      device.addEventListener('gattserverdisconnected', () => {
        this.currentStatus.isConnected = false;
        this.currentStatus.deviceName = null;
        this.bluetoothCharacteristic = null;
        this.notifyStatus();
      });

      this.notifyStatus();
      return { success: true, deviceName: devName };
    } catch (err: any) {
      let errMsg = err.message || 'Gagal menyambungkan printer Bluetooth.';
      if (err.name === 'SecurityError') {
        errMsg = 'Akses Bluetooth diblokir di dalam iframe. Buka di tab browser baru atau gunakan tombol "Koneksi Simulasi Bluetooth" di bawah.';
      } else if (err.name === 'NotFoundError') {
        errMsg = 'Pencarian printer Bluetooth dibatalkan atau tidak ada perangkat yang dipilih.';
      }
      this.currentStatus.lastError = errMsg;
      this.notifyStatus();
      return { success: false, error: errMsg };
    }
  }

  /**
   * Connect to simulated/virtual Bluetooth printer (RPP-02N, Panda, Iware)
   * Guaranteed reliable testing on environments without physical BT hardware
   */
  public connectVirtualBluetooth(name = 'RPP-02N Bluetooth POS (58mm)'): { success: boolean; deviceName: string } {
    this.currentStatus = {
      isConnected: true,
      deviceName: name,
      connectionType: 'BLUETOOTH',
      paperWidth: this.currentStatus.paperWidth || '58mm',
      lastError: null,
    };
    this.notifyStatus();
    return { success: true, deviceName: name };
  }

  /**
   * Connect to USB / Serial Cable Printer
   */
  public async connectCable(): Promise<{ success: boolean; portName?: string; error?: string }> {
    if (!this.isSerialSupported()) {
      const errMsg = 'Browser belum mendukung Web Serial API untuk koneksi kabel langsung. Gunakan Chrome di PC/Laptop/Tablet.';
      this.currentStatus.lastError = errMsg;
      this.notifyStatus();
      return { success: false, error: errMsg };
    }

    try {
      const serial = (navigator as any).serial;
      const port = await serial.requestPort();
      await port.open({ baudRate: 9600 });
      this.serialPort = port;

      const portInfo = port.getInfo ? port.getInfo() : {};
      const devName = portInfo.usbVendorId
        ? `USB POS Printer (VID: 0x${portInfo.usbVendorId.toString(16)})`
        : 'USB/Serial Cable Thermal Printer';

      this.currentStatus = {
        isConnected: true,
        deviceName: devName,
        connectionType: 'USB',
        paperWidth: this.currentStatus.paperWidth,
        lastError: null,
      };

      this.notifyStatus();
      return { success: true, portName: devName };
    } catch (err: any) {
      const errMsg = err.message || 'Gagal menyambungkan kabel printer USB/Serial.';
      this.currentStatus.lastError = errMsg;
      this.notifyStatus();
      return { success: false, error: errMsg };
    }
  }

  /**
   * Disconnect current active printer
   */
  public async disconnect() {
    try {
      if (this.bluetoothDevice && this.bluetoothDevice.gatt.connected) {
        this.bluetoothDevice.gatt.disconnect();
      }
      if (this.serialPort) {
        await this.serialPort.close();
      }
    } catch {}

    this.bluetoothDevice = null;
    this.bluetoothCharacteristic = null;
    this.serialPort = null;
    this.currentStatus.isConnected = false;
    this.currentStatus.deviceName = null;
    this.currentStatus.lastError = null;
    this.notifyStatus();
  }

  /**
   * Generate raw ESC/POS byte array for standard thermal printers
   */
  public generateEscPosReceipt(data: {
    cafeName: string;
    address: string;
    orderNumber: string;
    date: string;
    cashierName: string;
    customerName: string;
    orderType: string;
    tableNumber?: string;
    items: Array<{ name: string; qty: number; price: number; subtotal: number; notes?: string }>;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    cashTendered?: number;
    change?: number;
  }): Uint8Array {
    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [];

    const addText = (text: string) => parts.push(encoder.encode(text));
    const addBytes = (bytes: number[]) => parts.push(new Uint8Array(bytes));

    const is58mm = this.currentStatus.paperWidth === '58mm';
    const charWidth = is58mm ? 32 : 48;
    const divider = '-'.repeat(charWidth) + '\n';

    // 1. Initialize printer
    addBytes([0x1b, 0x40]); // ESC @

    // 2. Center Align Header
    addBytes([0x1b, 0x61, 0x01]); // Align Center
    addBytes([0x1d, 0x21, 0x11]); // Double height & width
    addText(`${data.cafeName.toUpperCase()}\n`);
    addBytes([0x1d, 0x21, 0x00]); // Normal size
    addText(`${data.address}\n`);
    addText(`Telp: +62 812-3456-7890\n`);
    addText(divider);

    // 3. Receipt Info (Left Align)
    addBytes([0x1b, 0x61, 0x00]); // Align Left
    addText(`No. Struk : #${data.orderNumber}\n`);
    addText(`Waktu     : ${data.date}\n`);
    addText(`Kasir     : ${data.cashierName}\n`);
    addText(`Pelanggan : ${data.customerName}\n`);
    addText(`Tipe      : ${data.orderType}${data.tableNumber ? ' (' + data.tableNumber + ')' : ''}\n`);
    addText(divider);

    // 4. Items Table
    for (const item of data.items) {
      const itemTitle = `${item.qty}x ${item.name}`;
      const priceStr = `Rp${item.subtotal.toLocaleString('id-ID')}`;
      const spaces = Math.max(1, charWidth - itemTitle.length - priceStr.length);
      addText(`${itemTitle}${' '.repeat(spaces)}${priceStr}\n`);
      if (item.notes) {
        addText(`  * Note: ${item.notes}\n`);
      }
    }
    addText(divider);

    // 5. Totals
    const addRow = (label: string, value: string) => {
      const spaces = Math.max(1, charWidth - label.length - value.length);
      addText(`${label}${' '.repeat(spaces)}${value}\n`);
    };

    addRow('Subtotal', `Rp${data.subtotal.toLocaleString('id-ID')}`);
    if (data.discount > 0) {
      addRow('Diskon Poin', `-Rp${data.discount.toLocaleString('id-ID')}`);
    }
    if (data.tax > 0) {
      addRow('PPN (11%)', `Rp${data.tax.toLocaleString('id-ID')}`);
    }
    addText(divider);

    // TOTAL (Bold + Double Size)
    addBytes([0x1b, 0x45, 0x01]); // Bold on
    addRow('TOTAL AKHIR', `Rp${data.total.toLocaleString('id-ID')}`);
    addBytes([0x1b, 0x45, 0x00]); // Bold off
    addText(divider);

    // 6. Payment info
    addRow('Metode Bayar', data.paymentMethod);
    if (data.cashTendered !== undefined && data.cashTendered > 0) {
      addRow('Tunai Diterima', `Rp${data.cashTendered.toLocaleString('id-ID')}`);
      addRow('Kembalian', `Rp${(data.change || 0).toLocaleString('id-ID')}`);
    }
    addText(divider);

    // 7. Footer (Center Align)
    addBytes([0x1b, 0x61, 0x01]); // Align Center
    addText('Terima Kasih Atas Kunjungan Anda!\n');
    addText('WiFi Café: YoungSpace-Guest (Pass: kopienak123)\n');
    addText('Follow IG: @youngspace.cafe\n');
    addText('KOPIIN POS Cloud System\n\n');

    // 8. Feed paper & Cut
    addBytes([0x1b, 0x64, 0x03]); // Feed 3 lines
    addBytes([0x1d, 0x56, 0x41, 0x03]); // Full cut GS V 65 3

    // Combine all chunks into one single Uint8Array
    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const p of parts) {
      result.set(p, offset);
      offset += p.length;
    }
    return result;
  }

  /**
   * Send raw bytes to connected Bluetooth or Cable printer
   */
  public async sendRawToHardware(data: Uint8Array): Promise<boolean> {
    // Bluetooth printing
    if (this.currentStatus.connectionType === 'BLUETOOTH') {
      if (this.bluetoothCharacteristic) {
        try {
          // Send in chunks of 100 bytes to avoid Bluetooth buffer overflow
          const CHUNK_SIZE = 100;
          for (let i = 0; i < data.length; i += CHUNK_SIZE) {
            const chunk = data.slice(i, i + CHUNK_SIZE);
            if (typeof this.bluetoothCharacteristic.writeValueWithoutResponse === 'function') {
              await this.bluetoothCharacteristic.writeValueWithoutResponse(chunk);
            } else {
              await this.bluetoothCharacteristic.writeValue(chunk);
            }
            // Tiny delay between chunks
            await new Promise(r => setTimeout(r, 20));
          }
          return true;
        } catch (err: any) {
          console.error('Bluetooth write error:', err);
          return false;
        }
      }
      if (this.currentStatus.isConnected) {
        return true;
      }
    }

    // USB / Serial printing
    if (this.currentStatus.connectionType === 'USB' && this.serialPort && this.serialPort.writable) {
      try {
        const writer = this.serialPort.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
        return true;
      } catch (err: any) {
        console.error('Serial cable write error:', err);
        return false;
      }
    }

    return false;
  }

  /**
   * High-Fidelity Thermal Receipt Print Window
   * Works on ALL browsers and devices by triggering clean 58mm/80mm print view
   */
  public printThermalHtml(order: Order, cafeName = 'Young Space', cashierName = 'Kasir POS'): boolean {
    const is58 = this.currentStatus.paperWidth === '58mm';
    const paperWidthPx = is58 ? '300px' : '380px';

    const itemsHtml = order.items.map(it => `
      <tr style="border-bottom: 1px dashed #d1d5db;">
        <td style="padding: 4px 0; font-weight: bold; font-size: 11px;">
          ${it.quantity}x ${(it as any).item_name || (it as any).menuItem?.name || 'Item'}
          ${it.notes ? `<div style="font-size: 9px; font-weight: normal; color: #6b7280; font-style: italic;">* ${it.notes}</div>` : ''}
        </td>
        <td style="padding: 4px 0; text-align: right; font-weight: bold; font-size: 11px; white-space: nowrap;">
          Rp${(it.subtotal || it.quantity * it.unit_price).toLocaleString('id-ID')}
        </td>
      </tr>
    `).join('');

    const formattedDate = new Date(order.created_at || Date.now()).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const paymentMethod = (order as any).payment_method || 'CASH';

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Struk_${order.order_number}</title>
          <style>
            @page {
              margin: 0;
              size: ${is58 ? '58mm auto' : '80mm auto'};
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 10px;
              width: ${paperWidthPx};
              font-size: 11px;
              line-height: 1.3;
              -webkit-print-color-adjust: exact;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .double-divider { border-top: 2px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            .logo { font-size: 16px; font-weight: 900; letter-spacing: 1px; margin-bottom: 2px; }
            @media print {
              body { padding: 4px; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="logo">${cafeName.toUpperCase()}</div>
            <div style="font-size: 10px;">Jl. Palagan Tentara Pelajar No. 88, Sleman</div>
            <div style="font-size: 10px;">Telp: 0812-3456-7890 • IG: @youngspace.cafe</div>
          </div>

          <div class="divider"></div>

          <table style="font-size: 10px;">
            <tr><td>No. Struk</td><td class="text-right font-bold">#${order.order_number}</td></tr>
            <tr><td>Waktu</td><td class="text-right">${formattedDate}</td></tr>
            <tr><td>Kasir</td><td class="text-right">${cashierName}</td></tr>
            <tr><td>Pelanggan</td><td class="text-right">${order.customer_name || 'Pelanggan Walk-In'}</td></tr>
            <tr><td>Tipe Order</td><td class="text-right">${order.order_type} ${order.table_number ? '(' + order.table_number + ')' : ''}</td></tr>
          </table>

          <div class="divider"></div>

          <table>
            <thead>
              <tr style="border-bottom: 1px dashed #000; font-size: 10px;">
                <th style="text-align: left; padding-bottom: 2px;">Menu</th>
                <th style="text-align: right; padding-bottom: 2px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="divider"></div>

          <table style="font-size: 10px;">
            <tr><td>Subtotal</td><td class="text-right">Rp${(order.subtotal || 0).toLocaleString('id-ID')}</td></tr>
            ${order.discount_amount ? `<tr><td>Diskon Poin</td><td class="text-right">-Rp${order.discount_amount.toLocaleString('id-ID')}</td></tr>` : ''}
            ${order.tax_amount ? `<tr><td>PPN (11%)</td><td class="text-right">Rp${order.tax_amount.toLocaleString('id-ID')}</td></tr>` : ''}
          </table>

          <div class="double-divider"></div>

          <table style="font-size: 13px; font-weight: bold;">
            <tr>
              <td>TOTAL</td>
              <td class="text-right">Rp${order.total_amount.toLocaleString('id-ID')}</td>
            </tr>
          </table>

          <div class="divider"></div>

          <table style="font-size: 10px;">
            <tr><td>Pembayaran</td><td class="text-right font-bold">${paymentMethod}</td></tr>
            <tr><td>Status Bayar</td><td class="text-right font-bold" style="color: #047857;">LUNAS</td></tr>
          </table>

          <div class="divider"></div>

          <div class="text-center" style="font-size: 9px; margin-top: 8px;">
            <div>*** TERIMA KASIH ***</div>
            <div>Simpan struk ini sebagai bukti transaksi resmi.</div>
            <div style="margin-top: 4px; font-size: 8px; color: #6b7280;">Diberdayakan oleh KOPIIN POS Cloud</div>
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    // Open clean print window
    const printWindow = window.open('', '_blank', `width=420,height=600,top=100,left=100,toolbar=0,scrollbars=1,status=0`);
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printHtml);
      printWindow.document.close();
      return true;
    } else {
      // If popup blocked, create invisible iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printHtml);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 2000);
        }, 300);
        return true;
      }
      return false;
    }
  }

  /**
   * Print Order: automatically routes to Bluetooth / Cable if connected,
   * otherwise opens high-fidelity thermal system print dialog.
   */
  public async printReceipt(order: Order, cafeName = 'Young Space', cashierName = 'Kasir POS'): Promise<{ success: boolean; method: string; message: string }> {
    const rawBytes = this.generateEscPosReceipt({
      cafeName,
      address: 'Jl. Palagan No. 88, Sleman, Yogyakarta',
      orderNumber: order.order_number,
      date: new Date(order.created_at || Date.now()).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      cashierName,
      customerName: order.customer_name || 'Pelanggan Walk-In',
      orderType: order.order_type,
      tableNumber: order.table_number || undefined,
      items: order.items.map(it => ({
        name: (it as any).item_name || (it as any).menuItem?.name || 'Item',
        qty: it.quantity,
        price: it.unit_price,
        subtotal: it.subtotal || it.quantity * it.unit_price,
        notes: it.notes,
      })),
      subtotal: order.subtotal || order.total_amount,
      tax: order.tax_amount || 0,
      discount: order.discount_amount || 0,
      total: order.total_amount,
      paymentMethod: (order as any).payment_method || 'CASH',
      cashTendered: order.total_amount,
      change: 0,
    });

    // Try hardware Bluetooth/Cable first if connected
    if (this.currentStatus.isConnected) {
      const sent = await this.sendRawToHardware(rawBytes);
      if (sent) {
        return {
          success: true,
          method: this.currentStatus.connectionType,
          message: `Struk terkirim langsung ke printer ${this.currentStatus.deviceName} (${this.currentStatus.paperWidth}) via ${this.currentStatus.connectionType}!`,
        };
      }
    }

    // Fallback or default: Trigger high-fidelity thermal print dialog
    const printed = this.printThermalHtml(order, cafeName, cashierName);
    return {
      success: printed,
      method: 'SYSTEM_PRINT',
      message: `Dialog cetak struk thermal (${this.currentStatus.paperWidth}) siap dicetak ke printer apa pun yang terhubung!`,
    };
  }

  /**
   * Run Test Print (Hardware check)
   */
  public async testPrint(cafeName = 'Young Space Café'): Promise<{ success: boolean; message: string }> {
    const mockOrder: Order = {
      id: `test-ord-${Date.now()}`,
      tenant_id: 'tenant-demo',
      order_number: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: 'Uji Coba Printer POS',
      customer_type: 'GUEST',
      order_type: 'DINE_IN',
      table_number: 'Meja 01',
      items: [
        {
          id: 'test-1',
          order_id: 'test',
          menu_item_id: 'menu-1',
          item_name: 'Es Kopi Susu Gula Aren',
          unit_price: 24000,
          cost_price: 8500,
          quantity: 2,
          notes: 'Less Sugar',
          subtotal: 48000,
        },
        {
          id: 'test-2',
          order_id: 'test',
          menu_item_id: 'menu-2',
          item_name: 'French Butter Croissant',
          unit_price: 28000,
          cost_price: 10500,
          quantity: 1,
          subtotal: 28000,
        },
      ],
      subtotal: 76000,
      tax_amount: 8360,
      discount_amount: 5000,
      total_amount: 79360,
      status: 'COMPLETED',
      payment_status: 'PAID',
      auto_printed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return this.printReceipt(mockOrder, cafeName, 'Kasir Tester');
  }

  /**
   * Generate raw ESC/POS byte array specifically for KDS / Kitchen Order Slip
   * Format: Large items, distinct order number, table, notes, NO PRICES OR FINANCIAL DATA!
   */
  public generateEscPosKitchenTicket(data: {
    cafeName: string;
    orderNumber: string;
    date: string;
    cashierName: string;
    customerName: string;
    orderType: string;
    tableNumber?: string;
    items: Array<{ name: string; qty: number; notes?: string }>;
  }): Uint8Array {
    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [];

    const addText = (text: string) => parts.push(encoder.encode(text));
    const addBytes = (bytes: number[]) => parts.push(new Uint8Array(bytes));

    const is58mm = this.currentStatus.paperWidth === '58mm';
    const charWidth = is58mm ? 32 : 48;
    const divider = '='.repeat(charWidth) + '\n';
    const dashDivider = '-'.repeat(charWidth) + '\n';

    // 1. Initialize printer
    addBytes([0x1b, 0x40]); // ESC @

    // 2. Center Align Header: KITCHEN / BAR TICKET
    addBytes([0x1b, 0x61, 0x01]); // Align Center
    addBytes([0x1d, 0x21, 0x11]); // Double height & width
    addText(`[ TIKET DAPUR & BAR ]\n`);
    addBytes([0x1d, 0x21, 0x00]); // Normal size
    addText(`${data.cafeName.toUpperCase()}\n`);
    addText(divider);

    // 3. Order Number & Table in Extra Large Size
    addBytes([0x1d, 0x21, 0x11]); // Double height & width
    addText(`#${data.orderNumber}\n`);
    if (data.tableNumber) {
      addText(`MEJA: ${data.tableNumber.toUpperCase()}\n`);
    } else {
      addText(`[ ${data.orderType.toUpperCase()} ]\n`);
    }
    addBytes([0x1d, 0x21, 0x00]); // Normal size
    addText(dashDivider);

    // 4. Ticket Metadata (Left Align)
    addBytes([0x1b, 0x61, 0x00]); // Align Left
    addText(`Tipe Order: ${data.orderType}${data.tableNumber ? ' (' + data.tableNumber + ')' : ''}\n`);
    addText(`Waktu     : ${data.date}\n`);
    addText(`Kasir     : ${data.cashierName}\n`);
    addText(`Pelanggan : ${data.customerName}\n`);
    addText(divider);

    // 5. Items List (NO PRICE - Only Qty, Name, and Notes)
    addBytes([0x1b, 0x45, 0x01]); // Bold on
    addText(`DAFTAR PESANAN UNTUK DIRACIK:\n`);
    addBytes([0x1b, 0x45, 0x00]); // Bold off

    for (const item of data.items) {
      // Large font for item quantity and name
      addBytes([0x1d, 0x21, 0x01]); // Double height
      addBytes([0x1b, 0x45, 0x01]); // Bold on
      addText(`[${item.qty}x] ${item.name}\n`);
      addBytes([0x1b, 0x45, 0x00]); // Bold off
      addBytes([0x1d, 0x21, 0x00]); // Normal

      if (item.notes) {
        addBytes([0x1b, 0x45, 0x01]); // Bold on
        addText(`  >>> NOTE: ${item.notes.toUpperCase()}\n`);
        addBytes([0x1b, 0x45, 0x00]); // Bold off
      }
      addText(dashDivider);
    }

    // 6. Summary Count
    const totalItems = data.items.reduce((s, it) => s + it.qty, 0);
    addBytes([0x1b, 0x61, 0x01]); // Align Center
    addBytes([0x1b, 0x45, 0x01]); // Bold on
    addText(`TOTAL: ${totalItems} ITEM MENU\n`);
    addBytes([0x1b, 0x45, 0x00]); // Bold off
    addText(divider);

    // 7. Footer Notice
    addText(`*** HARAP SEGERA DISIAPKAN ***\n`);
    addText(`Sistem KDS Terkoneksi Otomatis\n\n`);

    // 8. Feed paper & Cut
    addBytes([0x1b, 0x64, 0x03]); // Feed 3 lines
    addBytes([0x1d, 0x56, 0x41, 0x03]); // Full cut GS V 65 3

    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const p of parts) {
      result.set(p, offset);
      offset += p.length;
    }
    return result;
  }

  /**
   * HTML Render for Kitchen Ticket (Order Slip)
   * Specifically for KDS Barista & Kitchen Chef: NO PRICES, high contrast bold items & notes
   */
  public printKitchenTicketHtml(order: Order, cafeName = 'Young Space Café', cashierName = 'Kasir POS'): boolean {
    const is58 = this.currentStatus.paperWidth === '58mm';
    const paperWidthPx = is58 ? '300px' : '380px';

    const itemsHtml = order.items.map(it => `
      <div style="border-bottom: 2px dashed #000; padding: 6px 0; margin-bottom: 4px;">
        <div style="display: flex; align-items: baseline; gap: 6px;">
          <span style="font-size: 15px; font-weight: 900; background: #000; color: #fff; padding: 2px 6px; border-radius: 4px;">
            ${it.quantity}x
          </span>
          <span style="font-size: 13px; font-weight: 900; text-transform: uppercase;">
            ${(it as any).item_name || (it as any).menuItem?.name || 'Item'}
          </span>
        </div>
        ${it.notes ? `
          <div style="margin-top: 4px; padding: 3px 6px; background: #f3f4f6; border-left: 3px solid #000; font-size: 11px; font-weight: bold; color: #111;">
            NOTE: ${it.notes}
          </div>
        ` : ''}
      </div>
    `).join('');

    const formattedDate = new Date(order.created_at || Date.now()).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const totalItemsCount = order.items.reduce((sum, it) => sum + it.quantity, 0);

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Tiket_Dapur_${order.order_number}</title>
          <style>
            @page {
              margin: 0;
              size: ${is58 ? '58mm auto' : '80mm auto'};
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 10px;
              width: ${paperWidthPx};
              font-size: 11px;
              line-height: 1.25;
              -webkit-print-color-adjust: exact;
            }
            .text-center { text-align: center; }
            .divider { border-top: 2px solid #000; margin: 6px 0; }
            .dash-divider { border-top: 1px dashed #000; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; }
            @media print {
              body { padding: 4px; }
            }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div style="font-size: 14px; font-weight: 900; letter-spacing: 1px; border: 2px solid #000; padding: 3px; margin-bottom: 4px;">
              [ TIKET DAPUR & BAR (KDS) ]
            </div>
            <div style="font-size: 10px; font-weight: bold;">${cafeName.toUpperCase()}</div>
          </div>

          <div class="divider"></div>

          <div class="text-center" style="margin: 6px 0;">
            <div style="font-size: 18px; font-weight: 900; letter-spacing: 1px;">#${order.order_number}</div>
            <div style="font-size: 14px; font-weight: 900; margin-top: 2px;">
              ${order.table_number ? 'MEJA: ' + order.table_number.toUpperCase() : '[' + order.order_type.toUpperCase() + ']'}
            </div>
          </div>

          <div class="dash-divider"></div>

          <table style="font-size: 10px;">
            <tr><td>Waktu Order</td><td style="text-align: right; font-weight: bold;">${formattedDate}</td></tr>
            <tr><td>Kasir</td><td style="text-align: right;">${cashierName}</td></tr>
            <tr><td>Pelanggan</td><td style="text-align: right; font-weight: bold;">${order.customer_name || 'Pelanggan Walk-In'}</td></tr>
            <tr><td>Tipe Order</td><td style="text-align: right;">${order.order_type}</td></tr>
          </table>

          <div class="divider"></div>

          <div style="font-size: 10px; font-weight: 900; margin-bottom: 6px;">
            PESANAN UNTUK DIRACIK (${totalItemsCount} ITEM):
          </div>

          <div>
            ${itemsHtml}
          </div>

          <div class="divider"></div>

          <div class="text-center" style="margin-top: 6px;">
            <div style="font-size: 11px; font-weight: 900;">*** SEGERA DISIAPKAN & RACIK ***</div>
            <div style="font-size: 9px; color: #4b5563; margin-top: 2px;">Tiket Ringkasan Dapur Otomatis KDS</div>
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', `width=420,height=550,top=100,left=100,toolbar=0,scrollbars=1,status=0`);
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printHtml);
      printWindow.document.close();
      return true;
    } else {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printHtml);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 2000);
        }, 300);
        return true;
      }
      return false;
    }
  }

  /**
   * Print Kitchen Ticket specifically (ESC/POS to hardware or HTML print dialog)
   */
  public async printKitchenTicket(order: Order, cafeName = 'Young Space Café', cashierName = 'Kasir POS'): Promise<{ success: boolean; method: string; message: string }> {
    const rawBytes = this.generateEscPosKitchenTicket({
      cafeName,
      orderNumber: order.order_number,
      date: new Date(order.created_at || Date.now()).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      cashierName,
      customerName: order.customer_name || 'Pelanggan Walk-In',
      orderType: order.order_type,
      tableNumber: order.table_number || undefined,
      items: order.items.map(it => ({
        name: (it as any).item_name || (it as any).menuItem?.name || 'Item',
        qty: it.quantity,
        notes: it.notes,
      })),
    });

    if (this.currentStatus.isConnected) {
      const sent = await this.sendRawToHardware(rawBytes);
      if (sent) {
        return {
          success: true,
          method: this.currentStatus.connectionType,
          message: `Tiket ringkasan pesanan dapur #${order.order_number} terkirim ke printer ${this.currentStatus.deviceName}!`,
        };
      }
    }

    const printed = this.printKitchenTicketHtml(order, cafeName, cashierName);
    return {
      success: printed,
      method: 'SYSTEM_PRINT',
      message: `Tiket ringkasan dapur #${order.order_number} siap dicetak!`,
    };
  }

  /**
   * Dual Print: When cashier completes payment, automatically print BOTH:
   * 1. Customer Payment Receipt (Full breakdown: prices, tax, change, points)
   * 2. Kitchen / Bar Order Slip (Order summary ONLY: items, qty, notes, table - NO PRICES)
   */
  public async printCustomerAndKitchenReceipts(
    order: Order,
    cafeName = 'Young Space Café',
    cashierName = 'Kasir POS'
  ): Promise<{ success: boolean; message: string }> {
    // 1. Send kitchen ticket first or consecutively
    const kitchenRes = await this.printKitchenTicket(order, cafeName, cashierName);
    // Slight pause between prints if on same hardware printer
    await new Promise(r => setTimeout(r, 400));
    // 2. Print customer receipt
    const customerRes = await this.printReceipt(order, cafeName, cashierName);

    return {
      success: customerRes.success || kitchenRes.success,
      message: `Struk pembayaran kasir & Tiket ringkasan dapur KDS #${order.order_number} berhasil dicetak!`,
    };
  }

  /**
   * Run Test Print for Kitchen Ticket
   */
  public async testPrintKitchenTicket(cafeName = 'Young Space Café'): Promise<{ success: boolean; message: string }> {
    const mockOrder: Order = {
      id: `test-kds-${Date.now()}`,
      tenant_id: 'tenant-demo',
      order_number: `KDS-${Math.floor(100 + Math.random() * 900)}`,
      customer_name: 'Pak Hendra (Meja 04)',
      customer_type: 'MEMBER',
      order_type: 'DINE_IN',
      table_number: 'Meja 04',
      items: [
        {
          id: 'test-1',
          order_id: 'test',
          menu_item_id: 'menu-1',
          item_name: 'Es Kopi Susu Gula Aren',
          unit_price: 24000,
          cost_price: 8500,
          quantity: 2,
          notes: '1 Less Sugar, 1 Normal',
          subtotal: 48000,
        },
        {
          id: 'test-2',
          order_id: 'test',
          menu_item_id: 'menu-2',
          item_name: 'French Butter Croissant',
          unit_price: 28000,
          cost_price: 10500,
          quantity: 1,
          notes: 'Hangatkan / Toasted',
          subtotal: 28000,
        },
      ],
      subtotal: 76000,
      tax_amount: 8360,
      discount_amount: 0,
      total_amount: 84360,
      status: 'ACCEPTED',
      payment_status: 'PAID',
      auto_printed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return this.printKitchenTicket(mockOrder, cafeName, 'Kasir POS');
  }

  /**
   * Broadcast kitchen print job to all active KDS / Kitchen screens
   * Allows a separate tablet/screen in the kitchen to auto-print to its own local printer!
   */
  public broadcastKitchenOrder(order: Order, cafeName = 'Young Space Café', cashierName = 'Kasir POS') {
    const payload = {
      order,
      cafeName,
      cashierName,
      timestamp: Date.now(),
    };

    // 1. Web BroadcastChannel (Modern cross-tab/window event bus)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('kopiin_kds_print_channel');
        channel.postMessage(payload);
        channel.close();
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // 2. LocalStorage trigger fallback (triggers storage event on other tabs/windows)
    try {
      localStorage.setItem('kopiin_last_kds_broadcast', JSON.stringify(payload));
    } catch {}

    // 3. In-memory window dispatch
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kopiin:kds_order_print', { detail: payload }));
    }
  }

  /**
   * Listen for incoming kitchen print requests from Cashier
   */
  public onKitchenOrderBroadcast(
    callback: (data: { order: Order; cafeName: string; cashierName: string; timestamp: number }) => void
  ): () => void {
    let channel: BroadcastChannel | null = null;

    const handleMessage = (data: any) => {
      if (data && data.order) {
        callback(data);
      }
    };

    // 1. BroadcastChannel listener
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('kopiin_kds_print_channel');
        channel.onmessage = (event) => {
          handleMessage(event.data);
        };
      } catch {}
    }

    // 2. Storage event listener (fallback for other windows)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'kopiin_last_kds_broadcast' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleMessage(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Custom event listener (in-app same window)
    const handleCustom = (e: any) => {
      handleMessage(e.detail);
    };
    window.addEventListener('kopiin:kds_order_print', handleCustom);

    return () => {
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('kopiin:kds_order_print', handleCustom);
    };
  }
}

// Global Singleton Instance
export const printerService = new ThermalPrinterService();
