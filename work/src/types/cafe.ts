/**
 * KOPIIN – Comprehensive Multi-Tenant Café Domain Models & Schema
 * Sesuai Master Prompt 1, 2, 3, dan 4:
 * - RBAC 7 Roles (Master, Owner, Manager, Cashier, Stokis, Member, Guest)
 * - Order Types (Dine-in, Takeaway, Delivery)
 * - Order Status Transitions (WAITING_PAYMENT, ACCEPTED, IN_PROCESS, READY, COMPLETED, VOIDED)
 * - Payments: Cash, Transfer/Non-Tunai, Point Redemption, Mixed Payment
 * - Inventory, Stock Movement, Stock Opname, Low-Stock Alert
 * - Finance: Kas Masuk, Kas Keluar, Gross Margin, Net Cash
 * - Point Ledger & Tenant Loyalty Isolation
 * - Staff Attendance (Selfie/Photo URL, Time, Status)
 * - Printer Settings & Auto-print
 */

import { UserRole, AccountStatus } from './platform';

export type ExtendedRole = 
  | 'PLATFORM_MASTER'
  | 'TENANT_OWNER'
  | 'TENANT_MANAGER'
  | 'STAFF_CASHIER'
  | 'STAFF_BARISTA'
  | 'STAFF_STOKIS'
  | 'MEMBER'
  | 'GUEST';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type OrderStatus = 
  | 'WAITING_PAYMENT'  // Khusus Delivery sebelum bayar lunas
  | 'ACCEPTED'         // Dine-in/Takeaway submit atau Delivery paid -> trigger auto-print
  | 'IN_PROCESS'       // Dapur / Barista sedang meracik
  | 'READY'            // Siap diantar ke meja / diambil
  | 'COMPLETED'        // Selesai & Lunas
  | 'VOIDED';          // Dibatalkan dengan otorisasi

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';

export type PaymentMethod = 
  | 'CASH'
  | 'TRANSFER'
  | 'POINT'
  | 'MIXED';

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  icon?: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;       // Harga Jual
  cost_price: number;  // Harga Modal (COGS/HPP)
  margin_nominal: number; // price - cost_price
  margin_percent: number; // ((price - cost_price) / price) * 100
  image_url: string;
  is_available: boolean;
  recipe?: { ingredient_id: string; amount: number; unit: string }[];
}

export interface CafeTable {
  id: string;
  tenant_id: string;
  table_number: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  name?: string; // convenient alias
  unit_price: number;
  cost_price: number;
  quantity: number;
  notes?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_name: string;
  customer_id?: string | null; // Member user_id jika login
  member_id?: string | null;   // alias for customer_id
  customer_type: 'GUEST' | 'MEMBER';
  order_type: OrderType;
  table_number?: string | null; // Wajib jika DINE_IN
  delivery_address?: string | null; // Wajib jika DELIVERY
  delivery_phone?: string | null;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  auto_printed: boolean;
  created_at: string;
  updated_at: string;
}


export interface PaymentBreakdown {
  id: string;
  order_id: string;
  tenant_id: string;
  total_bill: number;
  amount_cash: number;
  amount_transfer: number;
  amount_points_value: number; // Nilai rupiah poin yang ditukar
  points_redeemed: number;     // Jumlah poin yang dipotong
  change_amount: number;       // Kembalian tunai jika cash > sisa
  payment_method: PaymentMethod;
  payment_reference?: string;  // No ref QRIS / transfer
  cashier_user_id: string;
  cashier_name: string;
  timestamp: string;
}

export interface PointLedger {
  id: string;
  tenant_id: string;
  user_id: string;
  order_id?: string | null;
  type: 'EARN' | 'REDEEM' | 'BONUS_REGISTER' | 'REVERSAL' | 'EXPIRED';
  points_in: number;
  points_out: number;
  balance_after: number;
  notes: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  tenant_id: string;
  name: string;
  sku: string;
  category: string;
  current_stock: number;
  minimum_stock: number; // Low stock alert threshold
  unit: string;          // kg, liter, gr, pcs, pack
  average_cost: number;  // Biaya per unit
  cost_per_unit?: number; // alias
  last_restock_date: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface StockMovement {
  id: string;
  tenant_id: string;
  inventory_id: string;
  item_name: string;
  type: 'IN' | 'OUT_PRODUCTION' | 'OPNAME_ADJUST' | 'WASTE';
  quantity: number;
  balance_after: number;
  unit: string;
  cost_per_unit: number;
  reference_note: string;
  notes?: string; // alias
  performed_by: string;
  timestamp: string;
  created_at?: string; // alias
}

export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  contact_person: string;
  phone: string;
  address: string;
  supply_category: string;
  lead_time_days?: number;
}


export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  total_cost: number;
  status: 'RECEIVED' | 'PENDING';
  items_summary: string;
  date: string;
}

export interface CashTransaction {
  id: string;
  tenant_id: string;
  type: 'KAS_MASUK' | 'KAS_KELUAR';
  category: string; // Operasional, Modal Awal, Petty Cash, Pembelian Darurat, Penjualan
  amount: number;
  description: string;
  performed_by: string;
  timestamp: string;
}

export interface CashierShiftClosing {
  id: string;
  tenant_id: string;
  cashier_id: string;
  cashier_name: string;
  shift_date: string;
  closed_at: string;
  total_orders: number;
  total_sales: number;
  total_cash: number;
  total_transfer: number;
  total_points_value: number;
  cash_in_drawer_expected: number; // Modal awal + kas masuk tunai - kas keluar
  cash_in_drawer_actual: number;   // Fisik uang dihitung kasir
  difference: number;              // actual - expected
  notes: string;
  status: 'SUBMITTED' | 'VERIFIED';
}

export interface WarehouseLocation {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  temperature_type: 'ROOM' | 'CHILLED' | 'FROZEN';
  description: string;
  capacity_status: 'NORMAL' | 'NEAR_FULL' | 'FULL';
}

export interface WarehouseRawMaterial {
  id: string;
  tenant_id: string;
  warehouse_location_id: string;
  name: string;
  sku: string;
  category: string; // Biji Kopi, Susu & Dairy, Sirup, Powder, Kemasan
  current_stock: number;
  minimum_stock: number;
  unit: string;
  cost_per_unit: number;
  supplier_name?: string;
  expiry_date?: string;
  shelf_slot?: string;
}

export interface CashierClosingReport {
  id: string;
  tenant_id: string;
  cashier_id: string;
  cashier_name: string;
  shift_date: string;
  closed_at: string;
  initial_cash_float: number;
  system_cash_sales: number;
  system_transfer_sales: number;
  total_cash_in: number;
  total_cash_out: number;
  total_system_cash_expected: number;
  actual_cash_counted: number;
  cash_difference: number; // actual - expected
  total_transactions_count: number;
  notes?: string;
  status: 'SUBMITTED' | 'VERIFIED_OWNER';
}

export interface StaffAttendance {


  id: string;
  tenant_id: string;
  user_id: string;
  staff_name: string;
  role: ExtendedRole;
  date: string;
  check_in_time: string;
  check_out_time?: string | null;
  photo_url: string; // Supabase Storage URL
  status: 'ON_TIME' | 'LATE' | 'OVERTIME' | 'CHECKED_OUT';
  total_hours?: number;
  notes?: string;
}

export interface PrinterConfig {
  tenant_id: string;
  receipt_printer_name: string;
  kitchen_printer_name: string;
  paper_width: '58mm' | '80mm';
  kitchen_paper_width?: '58mm' | '80mm';
  auto_print_dine_in: boolean;
  auto_print_takeaway: boolean;
  auto_print_delivery_paid: boolean;
  auto_print_kitchen_ticket?: boolean;
  connection_type: 'BLUETOOTH' | 'NETWORK_LAN' | 'USB';
  kitchen_connection_type?: 'BLUETOOTH' | 'NETWORK_LAN' | 'USB' | 'SAME_AS_CASHIER';
}

export interface FinancialReportData {
  period: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
  dateLabel: string;
  totalGrossSales: number;
  totalCOGS: number; // HPP (Harga Modal)
  grossProfit: number; // Laba Kotor
  profitMarginPercent: number; // Margin %
  realCash: number; // Tunai
  transferNonCash: number; // QRIS / Transfer
  pointsRedeemedValue: number; // Nilai Penukaran Poin
  totalKasMasuk: number;
  totalKasKeluar: number;
  netCashFlow: number;
  totalTransactionsCount: number;
  averageOrderValue: number;
  filteredOrders: Order[];
  filteredPayments: PaymentBreakdown[];
  filteredCashTrx: CashTransaction[];
}
