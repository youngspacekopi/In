/**
 * KOPIIN – Multi-Tenant SaaS Platform Core Types & RBAC Architecture
 * Hierarchy: KOPIIN Platform -> Tenant/Café -> User/Staff/Member -> Data Operasional
 * SISTEM AKUN KOPIIN:
 * - Menggunakan sistem akun & autentikasi mandiri KOPIIN (Bukan Supabase Auth).
 * - Member dapat mendaftar mandiri (self-register).
 * - Master/Owner dapat membuat akun staff sesuai kewenangan.
 * - Setiap akun langsung berstatus 'ACTIVE' (tanpa verifikasi email, tanpa approval, tanpa aktivasi link, tanpa trial/expiry).
 * - Password disimpan sebagai secure hash (bukan plaintext).
 * - Server-side authorization & audit logging.
 */

export type PlatformRole = 
  | 'PLATFORM_MASTER';

export type TenantRole = 
  | 'TENANT_OWNER'
  | 'TENANT_MANAGER'
  | 'STAFF_CASHIER'
  | 'STAFF_BARISTA'
  | 'STAFF_STOKIS'
  | 'STAFF' // Akun staf operasional yang HANYA BISA ABSENSI (presensi mandiri)
  | 'MEMBER'
  | 'GUEST';

export type UserRole = PlatformRole | TenantRole;

export type AccountStatus = 'ACTIVE' | 'SUSPENDED';

export type GranularPermission =
  // Platform Permissions (Master Level)
  | 'platform:master'
  | 'platform:tenants:read'
  | 'platform:tenants:manage'
  | 'platform:metrics:view'
  | 'platform:audit:read_all'
  // 15 Granular Module Domains
  | 'dashboard:view'
  | 'products:view'
  | 'products:manage'
  | 'pos:access'
  | 'orders:view'
  | 'orders:manage'
  | 'orders:void'
  | 'members:view'
  | 'members:manage'
  | 'tables:view'
  | 'tables:manage'
  | 'inventory:view'
  | 'inventory:manage'
  | 'inventory:opname'
  | 'payments:view'
  | 'payments:manage'
  | 'cash:view'
  | 'cash:manage'
  | 'reports:view'
  | 'staff:view'
  | 'staff:manage'
  | 'attendance:submit'
  | 'attendance:view_all'
  | 'printer:view'
  | 'printer:manage'
  | 'settings:view'
  | 'settings:manage'
  | 'accounts:manage'
  // Customer & Member
  | 'customer:menu:view'
  | 'customer:order:create'
  | 'member:loyalty:view'
  | 'member:points:redeem'
  | 'member:history:view';

/**
 * 4 Target Presentation Profiles under unified codebase & single backend
 */
export type PresentationTarget = 
  | 'desktop'   // 1. Web Desktop (Master & Owner, administrasi, pengelolaan, laporan)
  | 'tablet'    // 2. Web Tablet App-like (operasional café, POS, monitoring, staff)
  | 'android'   // 3. Android App-like (operasional café dan pengalaman Member)
  | 'pwa';      // 4. Customer PWA (Guest/Member order via QR/link café tanpa install)

export type PresentationProfile = 'DESKTOP' | 'TABLET' | 'ANDROID' | 'CUSTOMER_PWA';



export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  created_at: string;
  currency: string;
  timezone: string;
  settings: {
    tax_rate: number;
    service_charge: number;
    ordering_enabled: boolean;
    brand_color: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  tenant_id: string | null; // null for PLATFORM_MASTER, UUID for tenant-scoped users
  status: AccountStatus; // Selalu 'ACTIVE' saat dibuat
  avatar_url?: string;
  phone?: string;
  member_tier?: 'Bronze' | 'Silver' | 'Gold';
  created_at: string;
  updated_at?: string;
}

export interface KopiinSession {
  token: string;
  user: UserProfile;
  tenant_id: string | null;
  role: UserRole;
  permissions: GranularPermission[];
  created_at: string;
  auth_system: 'KOPIIN_NATIVE_AUTH';
}

export interface AuditLogEntry {
  id: string;
  tenant_id: string | null;
  user_id: string;
  user_email: string;
  user_role: UserRole;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ip_address: string;
  timestamp: string;
}

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string | null;
  hasAnonKey: boolean;
  mode: 'live_supabase' | 'cloud_ready_sandbox';
  authEngine: 'KOPIIN_NATIVE_AUTH'; // Explicitly not Supabase Auth
  database: 'Supabase PostgreSQL';
  storage: 'Supabase Storage';
  realtime: 'Supabase Realtime';
}

export interface PlatformState {
  currentPresentation: PresentationTarget;
  activeTenant: Tenant;
  currentUser: UserProfile;
  currentSession: KopiinSession;
  permissions: GranularPermission[];
  isRealtimeConnected: boolean;
  supabaseStatus: SupabaseConfigStatus;
}
