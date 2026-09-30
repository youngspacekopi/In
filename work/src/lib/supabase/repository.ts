/**
 * KOPIIN – Supabase Data Sync & Repository Layer
 * Rules:
 * - When Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are configured,
 *   data queries and mutations synchronize with Supabase PostgreSQL tables.
 * - Always enforce multi-tenant isolation via `tenant_id`.
 * - BUKAN Supabase Auth: KOPIIN menggunakan sistem akun mandiri (kopiin_users).
 * - Realtime channel subscriptions for live operational updates across terminals.
 * - Seamless fallback to robust local caching when offline or pre-configured.
 */

import { getSupabaseClient } from './client';
import { 
  MenuItem, 
  Order, 
  CafeTable, 
  Category, 
  PaymentBreakdown, 
  PointLedger, 
  InventoryItem, 
  StockMovement, 
  CashTransaction, 
  StaffAttendance, 
  PrinterConfig 
} from '../../types/cafe';

export class SupabaseCafeRepository {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  private get client() {
    return getSupabaseClient();
  }

  // --- MENU ITEMS ---
  async fetchMenuItems(): Promise<MenuItem[] | null> {
    const sb = this.client;
    if (!sb) return null;
    try {
      const { data, error } = await sb
        .from('menu_items')
        .select('*')
        .eq('tenant_id', this.tenantId);
      if (error) throw error;
      return data as MenuItem[];
    } catch (e) {
      console.warn('[Supabase] Failed to fetch menu_items:', e);
      return null;
    }
  }

  async upsertMenuItem(item: MenuItem): Promise<boolean> {
    const sb = this.client;
    if (!sb) return false;
    try {
      const { error } = await sb
        .from('menu_items')
        .upsert({ ...item, tenant_id: this.tenantId });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[Supabase] Failed to upsert menu_item:', e);
      return false;
    }
  }

  // --- ORDERS ---
  async fetchOrders(): Promise<Order[] | null> {
    const sb = this.client;
    if (!sb) return null;
    try {
      const { data, error } = await sb
        .from('orders')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    } catch (e) {
      console.warn('[Supabase] Failed to fetch orders:', e);
      return null;
    }
  }

  async insertOrder(order: Order): Promise<boolean> {
    const sb = this.client;
    if (!sb) return false;
    try {
      const { error } = await sb
        .from('orders')
        .insert({ ...order, tenant_id: this.tenantId });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[Supabase] Failed to insert order:', e);
      return false;
    }
  }

  async updateOrderStatus(orderId: string, status: string, paymentStatus?: string): Promise<boolean> {
    const sb = this.client;
    if (!sb) return false;
    try {
      const payload: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (paymentStatus) payload.payment_status = paymentStatus;
      const { error } = await sb
        .from('orders')
        .update(payload)
        .eq('id', orderId)
        .eq('tenant_id', this.tenantId);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[Supabase] Failed to update order status:', e);
      return false;
    }
  }

  // --- TABLES ---
  async fetchTables(): Promise<CafeTable[] | null> {
    const sb = this.client;
    if (!sb) return null;
    try {
      const { data, error } = await sb
        .from('cafe_tables')
        .select('*')
        .eq('tenant_id', this.tenantId);
      if (error) throw error;
      return data as CafeTable[];
    } catch (e) {
      console.warn('[Supabase] Failed to fetch cafe_tables:', e);
      return null;
    }
  }

  // --- INVENTORY ---
  async fetchInventory(): Promise<InventoryItem[] | null> {
    const sb = this.client;
    if (!sb) return null;
    try {
      const { data, error } = await sb
        .from('inventory_items')
        .select('*')
        .eq('tenant_id', this.tenantId);
      if (error) throw error;
      return data as InventoryItem[];
    } catch (e) {
      console.warn('[Supabase] Failed to fetch inventory_items:', e);
      return null;
    }
  }

  async upsertInventoryItem(item: InventoryItem): Promise<boolean> {
    const sb = this.client;
    if (!sb) return false;
    try {
      const { error } = await sb
        .from('inventory_items')
        .upsert({ ...item, tenant_id: this.tenantId });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[Supabase] Failed to upsert inventory item:', e);
      return false;
    }
  }

  // --- CASH TRANSACTIONS ---
  async insertCashTransaction(tx: CashTransaction): Promise<boolean> {
    const sb = this.client;
    if (!sb) return false;
    try {
      const { error } = await sb
        .from('cash_transactions')
        .insert({ ...tx, tenant_id: this.tenantId });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[Supabase] Failed to insert cash_transaction:', e);
      return false;
    }
  }

  // --- STAFF ATTENDANCE ---
  async insertAttendance(att: StaffAttendance): Promise<boolean> {
    const sb = this.client;
    if (!sb) return false;
    try {
      const { error } = await sb
        .from('staff_attendances')
        .insert({ ...att, tenant_id: this.tenantId });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[Supabase] Failed to insert staff_attendance:', e);
      return false;
    }
  }

  // --- REALTIME SUBSCRIPTION ---
  subscribeToOrders(onNewOrUpdatedOrder: (order: Order) => void): (() => void) | null {
    const sb = this.client;
    if (!sb) return null;
    try {
      const channel = sb
        .channel(`orders-${this.tenantId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `tenant_id=eq.${this.tenantId}`,
          },
          (payload) => {
            if (payload.new) {
              onNewOrUpdatedOrder(payload.new as Order);
            }
          }
        )
        .subscribe();
      return () => {
        sb.removeChannel(channel);
      };
    } catch (e) {
      console.warn('[Supabase] Subscription error:', e);
      return null;
    }
  }
}
