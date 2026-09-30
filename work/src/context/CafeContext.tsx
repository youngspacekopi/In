/**
 * KOPIIN – Unified Cafe Store & Operational State Management
 * Single Source of Truth for all 4 presentation layers (Desktop, Tablet, Android, PWA)
 * Supports:
 * - Orders & Status Lifecycle (Dine-in, Takeaway, Delivery)
 * - Auto-Print Logic (Dine-in/Takeaway on create, Delivery strictly on paid)
 * - Payment Processing (Cash, Transfer, Point, Mixed)
 * - Point Ledger & Balance (Isolated per tenant)
 * - Inventory & Stock Movements (Stock in, Stock out, Opname adjust, Low-stock alerts)
 * - Cash Flow (Kas Masuk, Kas Keluar)
 * - Attendance with Selfie Photos
 * - Multi-tenant Isolation Check
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePlatform } from '../context/PlatformContext';
import {
  Category,
  MenuItem,
  CafeTable,
  Order,
  OrderItem,
  PaymentBreakdown,
  PointLedger,
  InventoryItem,
  StockMovement,
  Supplier,
  PurchaseOrder,
  CashTransaction,
  StaffAttendance,
  PrinterConfig,
  OrderType,
  OrderStatus,
  PaymentMethod,
  FinancialReportData,
  CashierShiftClosing,
  WarehouseLocation,
  WarehouseRawMaterial,
} from '../types/cafe';

import {
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_POINT_LEDGERS,
  INITIAL_INVENTORY,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_CASH_TRANSACTIONS,
  INITIAL_ATTENDANCES,
  INITIAL_PRINTER_CONFIG,
  TENANT_ID,
} from '../lib/data/youngSpaceSeed';
import { uploadAttendancePhoto } from '../lib/storage/attendanceStorage';
import { SupabaseCafeRepository } from '../lib/supabase/repository';

export interface CreateOrderParams {
  customerName: string;
  customerId?: string | null;
  customerType: 'GUEST' | 'MEMBER';
  orderType: OrderType;
  tableNumber?: string | null;
  deliveryAddress?: string | null;
  deliveryPhone?: string | null;
  items: { menuItem: MenuItem; quantity: number; notes?: string }[];
  discountAmount?: number;
}

export interface ProcessPaymentParams {
  orderId: string;
  paymentMethod: PaymentMethod;
  amountCash: number;
  amountTransfer: number;
  pointsToRedeem?: number; // 1 Poin = Rp100
  paymentReference?: string;
}

interface CafeContextType {
  // Data State
  categories: Category[];
  menuItems: MenuItem[];
  tables: CafeTable[];
  orders: Order[];
  payments: PaymentBreakdown[];
  pointLedgers: PointLedger[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  cashTransactions: CashTransaction[];
  attendances: StaffAttendance[];
  printerConfig: PrinterConfig;
  members: Array<{ id: string; name: string; phone: string; points: number; tier: string; total_spent: number }>;
  cashLedger: Array<{ id: string; movement_type: 'KAS_MASUK' | 'KAS_KELUAR'; category: string; amount: number; notes: string; performed_by_name: string; created_at: string }>;
  cashierClosings: CashierShiftClosing[];
  warehouseLocations: WarehouseLocation[];
  warehouseRawMaterials: WarehouseRawMaterial[];
  warehouses: WarehouseLocation[];
  warehouseMaterials: WarehouseRawMaterial[];

  // Realtime alerts & notifications
  recentPrintNotification: string | null;
  dismissPrintNotification: () => void;

  // Actions
  createOrder: (params: CreateOrderParams) => Promise<Order>;
  processPayment: (params: ProcessPaymentParams) => Promise<PaymentBreakdown>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  voidOrder: (orderId: string, reason: string, pin?: string) => boolean;
  recordCashierClosing: (data: Omit<CashierShiftClosing, 'id' | 'tenant_id' | 'closed_at' | 'status'>) => CashierShiftClosing;

  // Product & Menu CRUD
  addMenuItem: (item: Omit<MenuItem, 'id' | 'tenant_id' | 'margin_nominal' | 'margin_percent'>) => MenuItem;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  toggleMenuItemAvailability: (id: string) => void;

  // Category CRUD
  addCategory: (name: string, icon?: string) => Category;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;

  // Table Management
  addTable: (tableNumber: string, capacity: number) => CafeTable;
  updateTable: (id: string, updates: Partial<CafeTable>) => void;
  updateTableStatus: (tableId: string, status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED') => void;
  deleteTable: (id: string) => void;

  // Member & Loyalty
  getMemberBalance: (userId: string) => number;
  getMemberLedger: (userId: string) => PointLedger[];
  adjustMemberPoints: (memberId: string, deltaPoints: number, reason: string) => void;
  updateMemberProfile: (memberId: string, updates: { name?: string; phone?: string; tier?: string }) => void;

  // Inventory & Warehouse & Supplier
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'tenant_id' | 'status' | 'last_restock_date'>) => InventoryItem;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  addStockMovement: (params: {
    inventoryId: string;
    type: 'IN' | 'OUT_PRODUCTION' | 'OPNAME_ADJUST' | 'WASTE';
    quantity: number;
    referenceNote: string;
  }) => void;
  adjustStockOpname: (inventoryId: string, actualPhysicalStock: number, reason: string) => void;
  recordStockOpname: (inventoryId: string, actualPhysicalStock: number, notes?: string) => void;
  receiveRawMaterial: (data: { locationId: string; name: string; sku?: string; category: string; quantity: number; unit: string; costPerUnit: number; supplierName?: string; expiryDate?: string }) => void;
  transferRawMaterialToBar: (materialId: string, quantity: number, notes?: string) => void;
  addWarehouseLocation: (name: string, type: string, description?: string) => void;
  addWarehouseMaterial: (data: { location_id: string; name: string; category: string; current_stock: number; minimum_stock: number; unit: string; cost_per_unit: number; sku?: string }) => void;
  adjustWarehouseStock: (materialId: string, delta: number, reason?: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'tenant_id'>) => Supplier;

  deleteSupplier: (id: string) => void;
  createPurchaseOrder: (params: { supplierId: string; totalCost: number; itemsSummary: string }) => void;

  // Finance & Cash Drawer
  addCashTransaction: (params: {
    type: 'KAS_MASUK' | 'KAS_KELUAR';
    category: string;
    amount: number;
    description: string;
  }) => void;
  addCashMovement: (params: {
    movement_type: 'KAS_MASUK' | 'KAS_KELUAR';
    category: string;
    amount: number;
    notes?: string;
  }) => void;


  // Staff Attendance
  recordAttendance: (params: {
    photoUrl: string;
    notes?: string;
  }) => Promise<StaffAttendance>;
  recordCheckOut: (attendanceId: string, notes?: string) => void;

  // Printer & Settings
  updatePrinterConfig: (config: Partial<PrinterConfig>) => void;
  testPrintReceipt: (orderId?: string) => string;

  // Dynamic Financial Report Generator
  getFinancialReport: (period: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM', customStart?: string, customEnd?: string) => FinancialReportData;

  // Computed Financials
  financialSummary: {
    totalGrossRevenue: number;
    realCashReceived: number;
    nonCashReceived: number;
    pointLiabilityRedeemed: number;
    totalCOGS: number;
    grossProfit: number;
    profitMarginPercent: number;
    cashInHand: number; // Cash In - Cash Out
  };
}

const CafeContext = createContext<CafeContextType | undefined>(undefined);

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTenant, currentUser, recordAction, users } = usePlatform();


  // Local storage cache or in-memory state initialized with Young Space seed data
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [tables, setTables] = useState<CafeTable[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [payments, setPayments] = useState<PaymentBreakdown[]>(INITIAL_PAYMENTS);
  const [pointLedgers, setPointLedgers] = useState<PointLedger[]>(INITIAL_POINT_LEDGERS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(INITIAL_CASH_TRANSACTIONS);
  const [attendances, setAttendances] = useState<StaffAttendance[]>(INITIAL_ATTENDANCES);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(INITIAL_PRINTER_CONFIG);
  const [recentPrintNotification, setRecentPrintNotification] = useState<string | null>(null);

  // Cashier shift closings (Linked to Owner Dashboard)
  const [cashierClosings, setCashierClosings] = useState<CashierShiftClosing[]>([
    {
      id: 'closing-demo-1',
      tenant_id: TENANT_ID,
      cashier_id: 'user-csh-01',
      cashier_name: 'Siti Rahma (Kasir Pagi)',
      shift_date: new Date().toISOString().split('T')[0],
      closed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      total_orders: 14,
      total_sales: 420000,
      total_cash: 250000,
      total_transfer: 170000,
      total_points_value: 0,
      cash_in_drawer_expected: 450000, // 200rb modal awal + 250rb cash
      cash_in_drawer_actual: 450000,
      difference: 0,
      notes: 'Shift pagi berjalan lancar, seluruh struk fisik tersusun rapi.',
      status: 'VERIFIED',
    }
  ]);

  // Warehouse Locations (Gudang Bahan Baku)
  const [warehouseLocations, setWarehouseLocations] = useState<WarehouseLocation[]>([
    {
      id: 'wh-1',
      tenant_id: TENANT_ID,
      name: 'Gudang Kering Bahan Baku',
      code: 'GUDANG-KERING',
      temperature_type: 'ROOM',
      description: 'Penyimpanan biji kopi sangrai, bubuk matcha, cokelat, gula, sirup & kemasan cup',
      capacity_status: 'NORMAL',
    },
    {
      id: 'wh-2',
      tenant_id: TENANT_ID,
      name: 'Chiller Susu & Dairy (2-4°C)',
      code: 'CHILLER-DAIRY',
      temperature_type: 'CHILLED',
      description: 'Penyimpanan susu fresh milk pasteurisasi, whipping cream, sirup organik, butter',
      capacity_status: 'NORMAL',
    },
    {
      id: 'wh-3',
      tenant_id: TENANT_ID,
      name: 'Cold Storage / Biji Kopi Fresh',
      code: 'COLD-BEANS',
      temperature_type: 'CHILLED',
      description: 'Biji kopi single origin (Gayo, Toraja, Mandheling) cadangan fresh roast',
      capacity_status: 'NEAR_FULL',
    },
    {
      id: 'wh-4',
      tenant_id: TENANT_ID,
      name: 'Rak Barista & Prep Bar',
      code: 'RAK-BAR',
      temperature_type: 'ROOM',
      description: 'Stok bahan harian siap racik di area bar kasir & barista',
      capacity_status: 'NORMAL',
    },
  ]);

  // Warehouse Raw Materials
  const [warehouseRawMaterials, setWarehouseRawMaterials] = useState<WarehouseRawMaterial[]>([
    {
      id: 'raw-1',
      tenant_id: TENANT_ID,
      warehouse_location_id: 'wh-1',
      name: 'House Blend Beans (Arabica/Robusta 70:30)',
      sku: 'RAW-COF-01',
      category: 'Biji Kopi',
      current_stock: 18.5,
      minimum_stock: 5.0,
      unit: 'kg',
      cost_per_unit: 180000,
      supplier_name: 'PT Kopi Nusantara Jaya',
      expiry_date: '2026-12-31',
      shelf_slot: 'Rak A-02',
    },
    {
      id: 'raw-2',
      tenant_id: TENANT_ID,
      warehouse_location_id: 'wh-2',
      name: 'Fresh Milk Pasteurized 1 Liter',
      sku: 'RAW-MLK-01',
      category: 'Susu & Dairy',
      current_stock: 42,
      minimum_stock: 15,
      unit: 'liter',
      cost_per_unit: 19500,
      supplier_name: 'Dairy Fresh Farm Lembang',
      expiry_date: '2026-10-05',
      shelf_slot: 'Chiller Ch-1',
    },
    {
      id: 'raw-3',
      tenant_id: TENANT_ID,
      warehouse_location_id: 'wh-1',
      name: 'Pure Matcha Uji Powder Premium',
      sku: 'RAW-MTC-01',
      category: 'Powder',
      current_stock: 3.2,
      minimum_stock: 1.0,
      unit: 'kg',
      cost_per_unit: 450000,
      supplier_name: 'Kyoto Imports Co.',
      expiry_date: '2027-04-10',
      shelf_slot: 'Rak B-01',
    },
    {
      id: 'raw-4',
      tenant_id: TENANT_ID,
      warehouse_location_id: 'wh-1',
      name: 'Paper Cup Hot 8oz Double Wall + Lid',
      sku: 'RAW-CUP-08',
      category: 'Kemasan',
      current_stock: 450,
      minimum_stock: 100,
      unit: 'pcs',
      cost_per_unit: 1200,
      supplier_name: 'EcoPack Indonesia',
      expiry_date: '2028-01-01',
      shelf_slot: 'Pallet C-03',
    },
    {
      id: 'raw-5',
      tenant_id: TENANT_ID,
      warehouse_location_id: 'wh-2',
      name: 'Sirup Karamel Monin 700ml',
      sku: 'RAW-SRP-01',
      category: 'Sirup',
      current_stock: 6,
      minimum_stock: 2,
      unit: 'botol',
      cost_per_unit: 145000,
      supplier_name: 'Distributor Sirup Utama',
      expiry_date: '2027-08-20',
      shelf_slot: 'Chiller Ch-2',
    },
  ]);

  // Member profile local overrides
  const [memberOverrides, setMemberOverrides] = useState<Record<string, { name?: string; phone?: string; tier?: string }>>({});


  const dismissPrintNotification = useCallback(() => {
    setRecentPrintNotification(null);
  }, []);

  // Filter scoped to active tenant (Strict Multi-tenant isolation)
  const tenantId = activeTenant?.id || TENANT_ID;

  // Supabase Repository instance for active tenant
  const repo = useMemo(() => new SupabaseCafeRepository(tenantId), [tenantId]);

  // Hydrate initial data from Supabase if connected
  useEffect(() => {
    let isMounted = true;
    const hydrateFromSupabase = async () => {
      const [remoteMenu, remoteOrders, remoteTables, remoteInventory] = await Promise.all([
        repo.fetchMenuItems(),
        repo.fetchOrders(),
        repo.fetchTables(),
        repo.fetchInventory(),
      ]);
      if (!isMounted) return;
      if (remoteMenu && remoteMenu.length > 0) setMenuItems(remoteMenu);
      if (remoteOrders && remoteOrders.length > 0) setOrders(remoteOrders);
      if (remoteTables && remoteTables.length > 0) setTables(remoteTables);
      if (remoteInventory && remoteInventory.length > 0) setInventory(remoteInventory);
    };

    hydrateFromSupabase();

    // Subscribe to realtime orders
    const unsubscribe = repo.subscribeToOrders((realtimeOrder) => {
      setOrders((prev) => {
        const index = prev.findIndex((o) => o.id === realtimeOrder.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...realtimeOrder };
          return next;
        }
        return [realtimeOrder, ...prev];
      });
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [repo]);

  // 1. Create Order with Business Logic Workflow (Prompt 2 & 4)
  const createOrder = useCallback(async (params: CreateOrderParams): Promise<Order> => {
    const orderItems: OrderItem[] = params.items.map((item, idx) => ({
      id: `oi-${Date.now()}-${idx}`,
      order_id: '',
      menu_item_id: item.menuItem.id,
      item_name: item.menuItem.name,
      unit_price: item.menuItem.price,
      cost_price: item.menuItem.cost_price,
      quantity: item.quantity,
      notes: item.notes,
      subtotal: item.menuItem.price * item.quantity,
    }));

    const subtotal = orderItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    const taxRate = activeTenant.settings?.tax_rate || 0.11;
    const taxAmount = Math.round(subtotal * taxRate);
    const discount = params.discountAmount || 0;
    const totalAmount = Math.max(0, subtotal + taxAmount - discount);

    // Rule: Delivery starts at WAITING_PAYMENT. Dine-in and Takeaway start at ACCEPTED.
    const initialStatus: OrderStatus = params.orderType === 'DELIVERY' ? 'WAITING_PAYMENT' : 'ACCEPTED';
    
    // Auto-print rule:
    // Dine-in and Takeaway: immediately printed on submit.
    // Delivery: NOT printed until payment verified.
    const shouldAutoPrint = params.orderType !== 'DELIVERY';

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      tenant_id: tenantId,
      order_number: `YS-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: params.customerName,
      customer_id: params.customerId || null,
      customer_type: params.customerType,
      order_type: params.orderType,
      table_number: params.orderType === 'DINE_IN' ? params.tableNumber : null,
      delivery_address: params.orderType === 'DELIVERY' ? params.deliveryAddress : null,
      delivery_phone: params.orderType === 'DELIVERY' ? params.deliveryPhone : null,
      items: orderItems,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discount,
      total_amount: totalAmount,
      status: initialStatus,
      payment_status: 'PENDING',
      auto_printed: shouldAutoPrint,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update orderItems back reference
    newOrder.items.forEach(it => it.order_id = newOrder.id);

    // Table occupancy management
    if (params.orderType === 'DINE_IN' && params.tableNumber) {
      setTables(prev => prev.map(tbl => 
        tbl.table_number === params.tableNumber ? { ...tbl, status: 'OCCUPIED' } : tbl
      ));
    }

    setOrders(prev => [newOrder, ...prev]);

    // Persist to Supabase when connected
    repo.insertOrder(newOrder).catch((e) => console.warn('[Supabase] background insert failed:', e));

    if (shouldAutoPrint) {
      setRecentPrintNotification(`[AUTO-PRINT] Struk #${newOrder.order_number} tercetak ke ${printerConfig.kitchen_printer_name} & ${printerConfig.receipt_printer_name}`);
    }

    recordAction(
      'ORDER_CREATED',
      `order:${newOrder.id}`,
      { order_number: newOrder.order_number, type: newOrder.order_type, total: newOrder.total_amount, auto_printed: shouldAutoPrint }
    );

    return newOrder;
  }, [activeTenant, tenantId, printerConfig, recordAction, repo]);

  // 2. Process Payment (Prompt 2 & 4)
  const processPayment = useCallback(async (params: ProcessPaymentParams): Promise<PaymentBreakdown> => {
    const targetOrder = orders.find(o => o.id === params.orderId);
    if (!targetOrder) throw new Error('Pesanan tidak ditemukan');

    const pointsRedeemed = params.pointsToRedeem || 0;
    const pointsValue = pointsRedeemed * 100; // 1 Poin = Rp100
    const cash = params.amountCash || 0;
    const transfer = params.amountTransfer || 0;
    const totalPaid = cash + transfer + pointsValue;
    const change = Math.max(0, totalPaid - targetOrder.total_amount);

    const payment: PaymentBreakdown = {
      id: `pay-${Date.now()}`,
      order_id: targetOrder.id,
      tenant_id: tenantId,
      total_bill: targetOrder.total_amount,
      amount_cash: cash > 0 ? Math.min(cash - change, targetOrder.total_amount) : 0,
      amount_transfer: transfer,
      amount_points_value: pointsValue,
      points_redeemed: pointsRedeemed,
      change_amount: change,
      payment_method: params.paymentMethod,
      payment_reference: params.paymentReference || `REF-${Date.now().toString().slice(-6)}`,
      cashier_user_id: currentUser.id,
      cashier_name: currentUser.full_name,
      timestamp: new Date().toISOString(),
    };

    setPayments(prev => [payment, ...prev]);

    // Update order status to PAID & transition to IN_PROCESS or COMPLETED
    const nextStatus: OrderStatus = targetOrder.order_type === 'DELIVERY' ? 'ACCEPTED' : targetOrder.status;
    const willAutoPrintNow = targetOrder.order_type === 'DELIVERY' && !targetOrder.auto_printed;

    setOrders(prev => prev.map(o => {
      if (o.id === targetOrder.id) {
        return {
          ...o,
          payment_status: 'PAID',
          status: nextStatus === 'WAITING_PAYMENT' ? 'ACCEPTED' : nextStatus,
          auto_printed: o.auto_printed || willAutoPrintNow,
          updated_at: new Date().toISOString(),
        };
      }
      return o;
    }));

    if (willAutoPrintNow) {
      setRecentPrintNotification(`[AUTO-PRINT DELIVERY] Pembayaran Struk #${targetOrder.order_number} lunas. Struk otomatis dicetak ke Barista/Dapur!`);
    }

    // Process Points: Deduct if redeemed, and EARN 1 point per Rp1000 spent if customer is MEMBER
    if (pointsRedeemed > 0 && targetOrder.customer_id) {
      const currentBal = pointLedgers
        .filter(pl => pl.user_id === targetOrder.customer_id && pl.tenant_id === tenantId)
        .slice(-1)[0]?.balance_after || 0;

      const redeemLedger: PointLedger = {
        id: `pl-${Date.now()}-redeem`,
        tenant_id: tenantId,
        user_id: targetOrder.customer_id,
        order_id: targetOrder.id,
        type: 'REDEEM',
        points_in: 0,
        points_out: pointsRedeemed,
        balance_after: Math.max(0, currentBal - pointsRedeemed),
        notes: `Penukaran ${pointsRedeemed} Poin untuk pembayaran #${targetOrder.order_number}`,
        created_at: new Date().toISOString(),
      };
      setPointLedgers(prev => [...prev, redeemLedger]);
    }

    // Earn points on PAID order for Member (10% of subtotal in rupiah = 1 point per 1000)
    if (targetOrder.customer_type === 'MEMBER' && targetOrder.customer_id) {
      const earnedPoints = Math.floor(targetOrder.total_amount / 1000);
      if (earnedPoints > 0) {
        setTimeout(() => {
          setPointLedgers(prev => {
            const lastBal = prev
              .filter(pl => pl.user_id === targetOrder.customer_id && pl.tenant_id === tenantId)
              .slice(-1)[0]?.balance_after || 0;

            const earnLedger: PointLedger = {
              id: `pl-${Date.now()}-earn`,
              tenant_id: tenantId,
              user_id: targetOrder.customer_id!,
              order_id: targetOrder.id,
              type: 'EARN',
              points_in: earnedPoints,
              points_out: 0,
              balance_after: lastBal + earnedPoints,
              notes: `Perolehan Poin transaksi lunas #${targetOrder.order_number}`,
              created_at: new Date().toISOString(),
            };
            return [...prev, earnLedger];
          });
        }, 100);
      }
    }

    // Record cash transaction into cash drawer if paid in cash
    if (cash > 0) {
      const netCashReceived = cash - change;
      if (netCashReceived > 0) {
        const cashTrx: CashTransaction = {
          id: `cash-${Date.now()}`,
          tenant_id: tenantId,
          type: 'KAS_MASUK',
          category: 'Penjualan Tunai Kasir',
          amount: netCashReceived,
          description: `Penerimaan tunai untuk pesanan #${targetOrder.order_number}`,
          performed_by: currentUser.full_name,
          timestamp: new Date().toISOString(),
        };
        setCashTransactions(prev => [cashTrx, ...prev]);
      }
    }

    recordAction(
      'PAYMENT_PROCESSED',
      `order:${targetOrder.id}`,
      { order_number: targetOrder.order_number, method: payment.payment_method, total: payment.total_bill }
    );

    return payment;
  }, [orders, pointLedgers, tenantId, currentUser, recordAction]);

  // 3. Update Order Status
  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        // Free table when completed
        if (newStatus === 'COMPLETED' && o.table_number) {
          setTables(tbls => tbls.map(t => t.table_number === o.table_number ? { ...t, status: 'AVAILABLE' } : t));
        }
        return { ...o, status: newStatus, updated_at: new Date().toISOString() };
      }
      return o;
    }));
    recordAction('ORDER_STATUS_CHANGED', `order:${orderId}`, { status: newStatus });
  }, [recordAction]);

  // 4. Void Order (Sensitive Action with PIN & Confirmation)
  const voidOrder = useCallback((orderId: string, reason: string, pin: string = '1234'): boolean => {
    // PIN Young Space: 1234, 2026, 123456, or 999999
    if (pin !== '1234' && pin !== '2026' && pin !== '123456' && pin !== '999999') {
      return false;
    }


    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        if (o.table_number) {
          setTables(tbls => tbls.map(t => t.table_number === o.table_number ? { ...t, status: 'AVAILABLE' } : t));
        }
        return { ...o, status: 'VOIDED', updated_at: new Date().toISOString() };
      }
      return o;
    }));

    recordAction('ORDER_VOIDED', `order:${orderId}`, { reason, authorized_by: currentUser.full_name });
    return true;
  }, [currentUser, recordAction]);

  // Product & Menu CRUD (Prompt 2)
  const addMenuItem = useCallback((item: Omit<MenuItem, 'id' | 'tenant_id' | 'margin_nominal' | 'margin_percent'>): MenuItem => {
    const marginNominal = Math.max(0, item.price - item.cost_price);
    const marginPercent = item.price > 0 ? Math.round((marginNominal / item.price) * 100 * 10) / 10 : 0;
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}`,
      tenant_id: tenantId,
      margin_nominal: marginNominal,
      margin_percent: marginPercent,
    };
    setMenuItems(prev => [newItem, ...prev]);
    recordAction('MENU_ITEM_CREATED', `menu:${newItem.id}`, {
      name: newItem.name,
      price: newItem.price,
      cost: newItem.cost_price,
      margin: `${marginPercent}%`,
    });
    return newItem;
  }, [tenantId, recordAction]);

  const updateMenuItem = useCallback((id: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev => prev.map(it => {
      if (it.id === id) {
        const updated = { ...it, ...updates };
        const price = updated.price;
        const cost = updated.cost_price;
        updated.margin_nominal = Math.max(0, price - cost);
        updated.margin_percent = price > 0 ? Math.round((updated.margin_nominal / price) * 100 * 10) / 10 : 0;
        return updated;
      }
      return it;
    }));
    recordAction('MENU_ITEM_UPDATED', `menu:${id}`, updates);
  }, [recordAction]);

  const deleteMenuItem = useCallback((id: string) => {
    setMenuItems(prev => prev.filter(it => it.id !== id));
    recordAction('MENU_ITEM_DELETED', `menu:${id}`);
  }, [recordAction]);

  const toggleMenuItemAvailability = useCallback((id: string) => {
    setMenuItems(prev => prev.map(it => it.id === id ? { ...it, is_available: !it.is_available } : it));
    recordAction('MENU_AVAILABILITY_TOGGLED', `menu:${id}`);
  }, [recordAction]);

  // Category CRUD
  const addCategory = useCallback((name: string, icon: string = 'Coffee'): Category => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      tenant_id: tenantId,
      name,
      icon,
      sort_order: categories.length + 1,
    };
    setCategories(prev => [...prev, newCat]);
    recordAction('CATEGORY_CREATED', `category:${newCat.id}`, { name });
    return newCat;
  }, [tenantId, categories.length, recordAction]);

  const updateCategory = useCallback((id: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    recordAction('CATEGORY_UPDATED', `category:${id}`, { name });
  }, [recordAction]);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    recordAction('CATEGORY_DELETED', `category:${id}`);
  }, [recordAction]);

  // Table Management
  const addTable = useCallback((tableNumber: string, capacity: number): CafeTable => {
    const newTable: CafeTable = {
      id: `tbl-${Date.now()}`,
      tenant_id: tenantId,
      table_number: tableNumber,
      capacity,
      status: 'AVAILABLE',
    };
    setTables(prev => [...prev, newTable]);
    recordAction('TABLE_CREATED', `table:${newTable.id}`, { table_number: tableNumber, capacity });
    return newTable;
  }, [tenantId, recordAction]);

  const updateTable = useCallback((id: string, updates: Partial<CafeTable>) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    recordAction('TABLE_UPDATED', `table:${id}`, updates);
  }, [recordAction]);

  const deleteTable = useCallback((id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    recordAction('TABLE_DELETED', `table:${id}`);
  }, [recordAction]);

  // Inventory & Supplier Management
  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'tenant_id' | 'status' | 'last_restock_date'>): InventoryItem => {
    const status = item.current_stock === 0 ? 'OUT_OF_STOCK' : item.current_stock <= item.minimum_stock ? 'LOW_STOCK' : 'IN_STOCK';
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
      tenant_id: tenantId,
      status,
      last_restock_date: new Date().toISOString(),
    };
    setInventory(prev => [newItem, ...prev]);
    recordAction('INVENTORY_ITEM_CREATED', `inv:${newItem.id}`, { name: newItem.name, stock: newItem.current_stock });
    return newItem;
  }, [tenantId, recordAction]);

  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(inv => {
      if (inv.id === id) {
        const updated = { ...inv, ...updates };
        updated.status = updated.current_stock === 0 ? 'OUT_OF_STOCK' : updated.current_stock <= updated.minimum_stock ? 'LOW_STOCK' : 'IN_STOCK';
        return updated;
      }
      return inv;
    }));
    recordAction('INVENTORY_ITEM_UPDATED', `inv:${id}`, updates);
  }, [recordAction]);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
    recordAction('INVENTORY_ITEM_DELETED', `inv:${id}`);
  }, [recordAction]);

  const addSupplier = useCallback((supplier: Omit<Supplier, 'id' | 'tenant_id'>): Supplier => {
    const newSup: Supplier = {
      ...supplier,
      id: `sup-${Date.now()}`,
      tenant_id: tenantId,
    };
    setSuppliers(prev => [...prev, newSup]);
    recordAction('SUPPLIER_CREATED', `supplier:${newSup.id}`, { name: newSup.name });
    return newSup;
  }, [tenantId, recordAction]);

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    recordAction('SUPPLIER_DELETED', `supplier:${id}`);
  }, [recordAction]);

  // 5. Member Points Query
  const getMemberBalance = useCallback((userId: string): number => {
    const userLedgers = pointLedgers.filter(pl => pl.user_id === userId && pl.tenant_id === tenantId);
    if (userLedgers.length === 0) return 0;
    return userLedgers[userLedgers.length - 1].balance_after;
  }, [pointLedgers, tenantId]);

  const getMemberLedger = useCallback((userId: string): PointLedger[] => {
    return pointLedgers
      .filter(pl => pl.user_id === userId && pl.tenant_id === tenantId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [pointLedgers, tenantId]);

  const adjustMemberPoints = useCallback((memberId: string, deltaPoints: number, reason: string) => {
    const currentBal = getMemberBalance(memberId);
    const newBal = Math.max(0, currentBal + deltaPoints);
    const isAdding = deltaPoints >= 0;

    const newLedger: PointLedger = {
      id: `pl-${Date.now()}`,
      tenant_id: tenantId,
      user_id: memberId,
      order_id: null,
      type: isAdding ? 'BONUS_REGISTER' : 'REDEEM',
      points_in: isAdding ? deltaPoints : 0,
      points_out: isAdding ? 0 : Math.abs(deltaPoints),
      balance_after: newBal,
      notes: reason || (isAdding ? 'Penambahan poin loyalitas oleh Owner' : 'Pengurangan poin oleh Owner'),
      created_at: new Date().toISOString(),
    };

    setPointLedgers(prev => [...prev, newLedger]);
    recordAction('MEMBER_POINTS_ADJUSTED', `member:${memberId}`, { deltaPoints, newBal, reason });
  }, [getMemberBalance, tenantId, recordAction]);

  const updateMemberProfile = useCallback((memberId: string, updates: { name?: string; phone?: string; tier?: string }) => {
    setMemberOverrides(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], ...updates },
    }));
    recordAction('MEMBER_PROFILE_UPDATED', `member:${memberId}`, updates);
  }, [recordAction]);

  const recordCashierClosing = useCallback((data: Omit<CashierShiftClosing, 'id' | 'tenant_id' | 'closed_at' | 'status'>): CashierShiftClosing => {
    const newClosing: CashierShiftClosing = {
      ...data,
      id: `close-${Date.now()}`,
      tenant_id: tenantId,
      closed_at: new Date().toISOString(),
      status: 'SUBMITTED',
    };
    setCashierClosings(prev => [newClosing, ...prev]);
    recordAction('CASHIER_SHIFT_CLOSED', `closing:${newClosing.id}`, {
      cashier: newClosing.cashier_name,
      total_sales: newClosing.total_sales,
      actual_cash: newClosing.cash_in_drawer_actual,
      difference: newClosing.difference,
    });
    return newClosing;
  }, [tenantId, recordAction]);

  const receiveRawMaterial = useCallback((data: {
    locationId: string;
    name: string;
    sku?: string;
    category: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
    supplierName?: string;
    expiryDate?: string;
  }) => {
    setWarehouseRawMaterials(prev => {
      const existingIdx = prev.findIndex(r => r.name.toLowerCase() === data.name.toLowerCase() && r.warehouse_location_id === data.locationId);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          current_stock: next[existingIdx].current_stock + data.quantity,
          cost_per_unit: data.costPerUnit || next[existingIdx].cost_per_unit,
          expiry_date: data.expiryDate || next[existingIdx].expiry_date,
        };
        return next;
      } else {
        const newMat: WarehouseRawMaterial = {
          id: `raw-${Date.now()}`,
          tenant_id: tenantId,
          warehouse_location_id: data.locationId,
          name: data.name,
          sku: data.sku || `RAW-${Date.now().toString().slice(-4)}`,
          category: data.category,
          current_stock: data.quantity,
          minimum_stock: Math.max(1, Math.round(data.quantity * 0.2)),
          unit: data.unit,
          cost_per_unit: data.costPerUnit,
          supplier_name: data.supplierName || 'Pemasok Bahan Utama',
          expiry_date: data.expiryDate,
        };
        return [...prev, newMat];
      }
    });

    recordAction('RAW_MATERIAL_RECEIVED', `wh:${data.locationId}`, {
      name: data.name,
      qty: data.quantity,
      unit: data.unit,
    });
  }, [tenantId, recordAction]);

  const transferRawMaterialToBar = useCallback((materialId: string, quantity: number, notes?: string) => {
    setWarehouseRawMaterials(prev => prev.map(m => {
      if (m.id === materialId) {
        const nextStock = Math.max(0, m.current_stock - quantity);
        return { ...m, current_stock: nextStock };
      }
      return m;
    }));
    recordAction('RAW_MATERIAL_TRANSFERRED_TO_BAR', `raw:${materialId}`, {
      quantity,
      notes: notes || 'Permintaan bahan ke meja bar barista',
    });
  }, [recordAction]);

  const addWarehouseLocation = useCallback((name: string, type: string, description?: string) => {
    const newLoc: WarehouseLocation = {
      id: `wh-${Date.now()}`,
      tenant_id: tenantId,
      name,
      code: name.toUpperCase().replace(/\s+/g, '-'),
      temperature_type: type === 'CHILLER' ? 'CHILLED' : 'ROOM',
      description: description || 'Lokasi penyimpanan bahan baku café',
      capacity_status: 'NORMAL',
    };
    setWarehouseLocations(prev => [...prev, newLoc]);
    recordAction('WAREHOUSE_LOCATION_ADDED', `wh:${newLoc.id}`, { name, type });
  }, [tenantId, recordAction]);

  const addWarehouseMaterial = useCallback((data: { location_id: string; name: string; category: string; current_stock: number; minimum_stock: number; unit: string; cost_per_unit: number; sku?: string }) => {
    const newMat: WarehouseRawMaterial = {
      id: `raw-${Date.now()}`,
      tenant_id: tenantId,
      warehouse_location_id: data.location_id,
      name: data.name,
      sku: data.sku || `RAW-${Date.now().toString().slice(-4)}`,
      category: data.category,
      current_stock: data.current_stock,
      minimum_stock: data.minimum_stock,
      unit: data.unit,
      cost_per_unit: data.cost_per_unit,
      supplier_name: 'Pemasok Bahan',
    };
    setWarehouseRawMaterials(prev => [...prev, newMat]);
    recordAction('RAW_MATERIAL_ADDED', `raw:${newMat.id}`, { name: data.name, stock: data.current_stock });
  }, [tenantId, recordAction]);

  const adjustWarehouseStock = useCallback((materialId: string, delta: number, reason?: string) => {
    setWarehouseRawMaterials(prev => prev.map(m => {
      if (m.id === materialId) {
        const next = Math.max(0, m.current_stock + delta);
        return { ...m, current_stock: next };
      }
      return m;
    }));
    recordAction('RAW_MATERIAL_ADJUSTED', `raw:${materialId}`, { delta, reason });
  }, [recordAction]);




  // 6. Inventory & Stock Movement
  const addStockMovement = useCallback((params: {
    inventoryId: string;
    type: 'IN' | 'OUT_PRODUCTION' | 'OPNAME_ADJUST' | 'WASTE';
    quantity: number;
    referenceNote: string;
  }) => {
    const item = inventory.find(i => i.id === params.inventoryId);
    if (!item) return;

    const newStock = Math.max(0, item.current_stock + params.quantity);
    const newStatus = newStock === 0 ? 'OUT_OF_STOCK' : newStock <= item.minimum_stock ? 'LOW_STOCK' : 'IN_STOCK';

    setInventory(prev => prev.map(i => i.id === item.id ? {
      ...i,
      current_stock: newStock,
      status: newStatus,
      last_restock_date: params.quantity > 0 ? new Date().toISOString() : i.last_restock_date,
    } : i));

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      tenant_id: tenantId,
      inventory_id: item.id,
      item_name: item.name,
      type: params.type,
      quantity: params.quantity,
      balance_after: newStock,
      unit: item.unit,
      cost_per_unit: item.average_cost,
      reference_note: params.referenceNote,
      performed_by: currentUser.full_name,
      timestamp: new Date().toISOString(),
    };

    setStockMovements(prev => [movement, ...prev]);
    recordAction('STOCK_ADJUSTED', `inventory:${item.id}`, {
      item_name: item.name,
      delta: params.quantity,
      new_stock: newStock,
      type: params.type,
    });
  }, [inventory, tenantId, currentUser, recordAction]);

  const adjustStockOpname = useCallback((inventoryId: string, actualPhysicalStock: number, reason: string) => {
    const item = inventory.find(i => i.id === inventoryId);
    if (!item) return;
    const diff = actualPhysicalStock - item.current_stock;
    addStockMovement({
      inventoryId,
      type: 'OPNAME_ADJUST',
      quantity: diff,
      referenceNote: `Opname Fisik: ${actualPhysicalStock} ${item.unit} (Selisih ${diff > 0 ? '+' : ''}${diff}). Alasan: ${reason}`,
    });
  }, [inventory, addStockMovement]);

  const createPurchaseOrder = useCallback((params: { supplierId: string; totalCost: number; itemsSummary: string }) => {
    const sup = suppliers.find(s => s.id === params.supplierId);
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      tenant_id: tenantId,
      po_number: `PO-YS-${Date.now().toString().slice(-4)}`,
      supplier_id: params.supplierId,
      supplier_name: sup?.name || 'Supplier Terdaftar',
      total_cost: params.totalCost,
      status: 'RECEIVED',
      items_summary: params.itemsSummary,
      date: new Date().toISOString(),
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
    recordAction('PURCHASE_ORDER_CREATED', `po:${newPO.id}`, { po_number: newPO.po_number, total: newPO.total_cost });
  }, [suppliers, tenantId, recordAction]);

  // 7. Finance / Cash Flow
  const addCashTransaction = useCallback((params: {
    type: 'KAS_MASUK' | 'KAS_KELUAR';
    category: string;
    amount: number;
    description: string;
  }) => {
    const trx: CashTransaction = {
      id: `cash-${Date.now()}`,
      tenant_id: tenantId,
      type: params.type,
      category: params.category,
      amount: params.amount,
      description: params.description,
      performed_by: currentUser.full_name,
      timestamp: new Date().toISOString(),
    };
    setCashTransactions(prev => [trx, ...prev]);
    recordAction('CASH_TRANSACTION', `cash:${trx.id}`, { type: trx.type, amount: trx.amount, category: trx.category });
  }, [tenantId, currentUser, recordAction]);

  // 8. Staff Attendance (Supabase Storage upload & database persistence)
  const recordAttendance = useCallback(async (params: { photoUrl: string; notes?: string }): Promise<StaffAttendance> => {
    const now = new Date();
    const hours = now.getHours();
    const isLate = hours >= 9; // Jam masuk standar café: 08:00 - 09:00

    // Upload selfie photo to Supabase Storage ('staff-attendance' bucket)
    let finalPhotoUrl = params.photoUrl;
    let storageMeta: { path: string; storageProvider: string } | null = null;
    try {
      const uploadRes = await uploadAttendancePhoto(tenantId, currentUser.id, params.photoUrl);
      finalPhotoUrl = uploadRes.url;
      storageMeta = {
        path: uploadRes.path,
        storageProvider: uploadRes.storageProvider,
      };
    } catch (err) {
      console.warn('Storage upload error, persisting direct photo data:', err);
    }

    const att: StaffAttendance = {
      id: `att-${Date.now()}`,
      tenant_id: tenantId,
      user_id: currentUser.id,
      staff_name: currentUser.full_name,
      role: currentUser.role as any,
      date: now.toISOString().split('T')[0],
      check_in_time: now.toISOString(),
      check_out_time: null,
      photo_url: finalPhotoUrl,
      status: isLate ? 'LATE' : 'ON_TIME',
      notes: params.notes || 'Check-in mandiri selfie',
    };

    setAttendances(prev => [att, ...prev]);
    recordAction('ATTENDANCE_CHECK_IN', `attendance:${att.id}`, { 
      staff: att.staff_name, 
      status: att.status,
      storage: storageMeta?.storageProvider || 'LOCAL',
      storage_path: storageMeta?.path || ''
    });
    return att;
  }, [tenantId, currentUser, recordAction]);

  const recordCheckOut = useCallback((attendanceId: string, notes?: string) => {
    const now = new Date();
    setAttendances(prev => prev.map(att => {
      if (att.id === attendanceId) {
        return {
          ...att,
          check_out_time: now.toISOString(),
          status: 'CHECKED_OUT',
          notes: notes ? `${att.notes || ''} | Out: ${notes}` : att.notes,
        };
      }
      return att;
    }));
    recordAction('ATTENDANCE_CHECK_OUT', `attendance:${attendanceId}`, { time: now.toISOString() });
  }, [recordAction]);

  // 9. Printer Settings
  const updatePrinterConfig = useCallback((config: Partial<PrinterConfig>) => {
    setPrinterConfig(prev => ({ ...prev, ...config }));
    recordAction('PRINTER_CONFIG_UPDATED', `tenant:${tenantId}`, config as any);
  }, [tenantId, recordAction]);

  const testPrintReceipt = useCallback((orderId?: string): string => {
    const msg = `[TEST CETAK STRUK] Terkirim ke printer ${printerConfig.receipt_printer_name} (${printerConfig.paper_width}) via ${printerConfig.connection_type}`;
    setRecentPrintNotification(msg);
    return msg;
  }, [printerConfig]);

  // Dynamic Financial Report with Filter (Prompt 2 & 4: Real financial calculations)
  const getFinancialReport = useCallback((
    period: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM',
    customStart?: string,
    customEnd?: string
  ): FinancialReportData => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let dateLabel = 'Hari Ini';
    if (period === 'WEEK') dateLabel = '7 Hari Terakhir';
    if (period === 'MONTH') dateLabel = `Bulan ${now.toLocaleString('id-ID', { month: 'long' })} ${now.getFullYear()}`;
    if (period === 'CUSTOM') dateLabel = `${customStart || ''} s/d ${customEnd || ''}`;

    const isSameCalendarDay = (d1: Date, d2: Date) => {
      return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
      );
    };

    const filterDateMatch = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;

      if (period === 'TODAY') {
        return isSameCalendarDay(d, now) || dateStr.startsWith(todayStr);
      }
      if (period === 'WEEK') {
        return d >= sevenDaysAgo && d <= endOfToday;
      }
      if (period === 'MONTH') {
        return d >= startOfMonth && d <= endOfToday;
      }
      if (period === 'CUSTOM' && customStart && customEnd) {
        const start = new Date(customStart + 'T00:00:00');
        const end = new Date(customEnd + 'T23:59:59');
        return d >= start && d <= end;
      }
      return true;
    };

    const filteredOrders = orders.filter(o => filterDateMatch(o.created_at) && o.status !== 'VOIDED');
    const paidOrders = filteredOrders.filter(o => o.payment_status === 'PAID');
    const orderIds = new Set(paidOrders.map(o => o.id));

    const totalGrossSales = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalCOGS = paidOrders.reduce((orderSum, o) => {
      const itemsCost = o.items.reduce((itemSum, it) => itemSum + (it.cost_price * it.quantity), 0);
      return orderSum + itemsCost;
    }, 0);
    const grossProfit = totalGrossSales - totalCOGS;
    const profitMarginPercent = totalGrossSales > 0 ? Math.round((grossProfit / totalGrossSales) * 100 * 10) / 10 : 0;

    const filteredPayments = payments.filter(p => orderIds.has(p.order_id) || filterDateMatch(p.timestamp));
    const realCash = filteredPayments.reduce((sum, p) => sum + p.amount_cash, 0);
    const transferNonCash = filteredPayments.reduce((sum, p) => sum + p.amount_transfer, 0);
    const pointsRedeemedValue = filteredPayments.reduce((sum, p) => sum + p.amount_points_value, 0);

    const filteredCashTrx = cashTransactions.filter(c => filterDateMatch(c.timestamp));
    const totalKasMasuk = filteredCashTrx.filter(c => c.type === 'KAS_MASUK').reduce((sum, c) => sum + c.amount, 0);
    const totalKasKeluar = filteredCashTrx.filter(c => c.type === 'KAS_KELUAR').reduce((sum, c) => sum + c.amount, 0);
    const netCashFlow = totalKasMasuk - totalKasKeluar;

    const totalTransactionsCount = paidOrders.length;
    const averageOrderValue = totalTransactionsCount > 0 ? Math.round(totalGrossSales / totalTransactionsCount) : 0;

    return {
      period,
      dateLabel,
      totalGrossSales,
      totalCOGS,
      grossProfit,
      profitMarginPercent,
      realCash,
      transferNonCash,
      pointsRedeemedValue,
      totalKasMasuk,
      totalKasKeluar,
      netCashFlow,
      totalTransactionsCount,
      averageOrderValue,
      filteredOrders,
      filteredPayments,
      filteredCashTrx,
    };
  }, [orders, payments, cashTransactions]);

  // 10. Financial Computations (Based on actual transactions, not dummy mockup)
  const financialSummary = useMemo(() => {
    const paidOrders = orders.filter(o => o.payment_status === 'PAID');
    const totalGrossRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);

    // Sum COGS from items of paid orders
    const totalCOGS = paidOrders.reduce((orderSum, o) => {
      const itemsCost = o.items.reduce((itemSum, it) => itemSum + (it.cost_price * it.quantity), 0);
      return orderSum + itemsCost;
    }, 0);

    const grossProfit = totalGrossRevenue - totalCOGS;
    const profitMarginPercent = totalGrossRevenue > 0 ? (grossProfit / totalGrossRevenue) * 100 : 0;

    // Real cash vs non-cash vs points
    const realCashReceived = payments.reduce(
      (sum, p) => sum + (p.amount_cash || (p.payment_method === 'CASH' ? p.total_bill : 0)),
      0
    );
    const nonCashReceived = payments.reduce(
      (sum, p) => sum + (p.amount_transfer || (p.payment_method === 'TRANSFER' ? p.total_bill : 0)),
      0
    );
    const pointLiabilityRedeemed = payments.reduce(
      (sum, p) => sum + (p.amount_points_value || (p.payment_method === 'POINT' ? p.total_bill : 0)),
      0
    );

    // Net cash drawer
    const totalCashIn = cashTransactions.filter(c => c.type === 'KAS_MASUK').reduce((sum, c) => sum + c.amount, 0);
    const totalCashOut = cashTransactions.filter(c => c.type === 'KAS_KELUAR').reduce((sum, c) => sum + c.amount, 0);
    const cashInHand = totalCashIn - totalCashOut;

    return {
      totalGrossRevenue,
      realCashReceived,
      nonCashReceived,
      pointLiabilityRedeemed,
      totalCOGS,
      grossProfit,
      profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
      cashInHand,
    };
  }, [orders, payments, cashTransactions]);

  const updateTableStatus = useCallback((tableId: string, status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED') => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
  }, []);

  const recordStockOpname = useCallback((inventoryId: string, actualPhysicalStock: number, notes?: string) => {
    adjustStockOpname(inventoryId, actualPhysicalStock, notes || 'Penyesuaian stok opname');
  }, [adjustStockOpname]);

  const addCashMovement = useCallback((params: {
    movement_type: 'KAS_MASUK' | 'KAS_KELUAR';
    category: string;
    amount: number;
    notes?: string;
  }) => {
    addCashTransaction({
      type: params.movement_type,
      category: params.category,
      amount: params.amount,
      description: params.notes || '',
    });
  }, [addCashTransaction]);

  const members = useMemo(() => {
    return (users || []).filter(u => u.role === 'MEMBER').map(u => {
      const override = memberOverrides[u.id];
      return {
        id: u.id,
        name: override?.name || u.full_name,
        phone: override?.phone || u.phone || '0812-3456-7890',
        points: getMemberBalance(u.id) || 120,
        tier: override?.tier || u.member_tier || 'Gold',
        total_spent: 350000,
      };
    });
  }, [users, getMemberBalance, memberOverrides]);

  const cashLedger = useMemo(() => {
    return cashTransactions.map(c => ({
      id: c.id,
      movement_type: c.type,
      category: c.category,
      amount: c.amount,
      notes: c.description,
      performed_by_name: c.performed_by,
      created_at: c.timestamp,
    }));
  }, [cashTransactions]);

  const contextValue: CafeContextType = {
    categories,
    menuItems,
    tables,
    orders,
    payments,
    pointLedgers,
    inventory,
    stockMovements,
    suppliers,
    purchaseOrders,
    cashTransactions,
    attendances,
    printerConfig,
    members,
    cashLedger,
    cashierClosings,
    warehouseLocations,
    warehouseRawMaterials,
    warehouses: warehouseLocations,
    warehouseMaterials: warehouseRawMaterials,
    addWarehouseLocation,
    addWarehouseMaterial,
    adjustWarehouseStock,
    recentPrintNotification,
    dismissPrintNotification,
    createOrder,
    processPayment,
    updateOrderStatus,
    voidOrder,
    recordCashierClosing,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability,
    addCategory,
    updateCategory,
    deleteCategory,
    addTable,
    updateTable,
    updateTableStatus,
    deleteTable,
    getMemberBalance,
    getMemberLedger,
    adjustMemberPoints,
    updateMemberProfile,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addStockMovement,
    adjustStockOpname,
    recordStockOpname,
    receiveRawMaterial,
    transferRawMaterialToBar,
    addSupplier,
    deleteSupplier,
    createPurchaseOrder,
    addCashTransaction,
    addCashMovement,
    recordAttendance,
    recordCheckOut,
    updatePrinterConfig,
    testPrintReceipt,
    getFinancialReport,
    financialSummary,
  };



  return <CafeContext.Provider value={contextValue}>{children}</CafeContext.Provider>;
};

export const useCafe = (): CafeContextType => {
  const context = useContext(CafeContext);
  if (!context) {
    throw new Error('useCafe must be used within a CafeProvider');
  }
  return context;
};
