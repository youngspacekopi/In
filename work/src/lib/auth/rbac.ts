/**
 * KOPIIN – Role-Based Access Control (RBAC) & Permissions Engine
 * Strict Tenant Isolation:
 * - KOPIIN Platform Level (Platform Master)
 * - Tenant Level (Young Space Demo Café)
 * - Staff & Operational Level
 * - Member & Guest Level
 */

import { GranularPermission, UserRole, UserProfile, Tenant } from '../../types/platform';

export const DEMO_TENANT: Tenant = {
  id: 'tenant-young-space-01',
  name: 'Young Space',
  slug: 'young-space',
  status: 'active',
  created_at: '2026-01-15T08:00:00Z',
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  settings: {
    tax_rate: 0.11, // PPN 11%
    service_charge: 0.05, // 5%
    ordering_enabled: true,
    brand_color: '#d97706',
  },
};

export const ROLE_PERMISSIONS_MATRIX: Record<UserRole, GranularPermission[]> = {
  PLATFORM_MASTER: [
    'platform:master',
    'platform:tenants:read',
    'platform:tenants:manage',
    'platform:metrics:view',
    'platform:audit:read_all',
    'dashboard:view',
    'accounts:manage',
  ],
  TENANT_OWNER: [
    'dashboard:view',
    'products:view',
    'products:manage',
    'pos:access',
    'orders:view',
    'orders:manage',
    'orders:void',
    'members:view',
    'members:manage',
    'tables:view',
    'tables:manage',
    'inventory:view',
    'inventory:manage',
    'inventory:opname',
    'payments:view',
    'payments:manage',
    'cash:view',
    'cash:manage',
    'reports:view',
    'staff:view',
    'staff:manage',
    'attendance:submit',
    'attendance:view_all',
    'printer:view',
    'printer:manage',
    'settings:view',
    'settings:manage',
    'accounts:manage',
    'customer:menu:view',
  ],
  TENANT_MANAGER: [
    'dashboard:view',
    'products:view',
    'products:manage',
    'pos:access',
    'orders:view',
    'orders:manage',
    'orders:void',
    'members:view',
    'tables:view',
    'tables:manage',
    'inventory:view',
    'inventory:manage',
    'inventory:opname',
    'payments:view',
    'payments:manage',
    'cash:view',
    'cash:manage',
    'reports:view',
    'staff:view',
    'attendance:submit',
    'attendance:view_all',
    'printer:view',
    'printer:manage',
    'settings:view',
    'customer:menu:view',
  ],
  STAFF_CASHIER: [
    'dashboard:view',
    'pos:access',
    'orders:view',
    'orders:manage',
    'payments:view',
    'payments:manage',
    'cash:view',
    'tables:view',
    'members:view',
    'reports:view',
    'attendance:submit',
    'customer:menu:view',
  ],
  STAFF_BARISTA: [
    'dashboard:view',
    'pos:access',
    'orders:view',
    'orders:manage',
    'inventory:view',
    'attendance:submit',
    'customer:menu:view',
  ],
  STAFF_STOKIS: [
    'dashboard:view',
    'inventory:view',
    'inventory:manage',
    'inventory:opname',
    'attendance:submit',
  ],
  STAFF: [
    'attendance:submit',
  ],
  MEMBER: [
    'customer:menu:view',
    'customer:order:create',
    'member:loyalty:view',
    'member:points:redeem',
    'member:history:view',
  ],
  GUEST: [
    'customer:menu:view',
    'customer:order:create',
  ],
};

export function hasPermission(role: UserRole, permission: GranularPermission): boolean {
  const allowed = ROLE_PERMISSIONS_MATRIX[role] || [];
  return allowed.includes(permission);
}

export function validateTenantAccess(user: UserProfile, targetTenantId: string): boolean {
  // Platform Master can inspect any tenant with read authorization
  if (user.role === 'PLATFORM_MASTER') {
    return true;
  }
  // Tenant-scoped users can strictly access only their assigned tenant
  return user.tenant_id === targetTenantId;
}

export const INITIAL_USERS: Record<UserRole, UserProfile> = {
  PLATFORM_MASTER: {
    id: 'user-platform-master',
    email: 'mdqputra@gmail.com',
    full_name: 'Master KOPIIN (MDQ Putra)',
    role: 'PLATFORM_MASTER',
    tenant_id: null,
    status: 'ACTIVE',
    created_at: '2026-01-01T00:00:00Z',
  },
  TENANT_OWNER: {
    id: 'user-young-owner',
    email: 'owner@youngspace.cafe',
    full_name: 'Arya Pratama (Owner Young Space)',
    role: 'TENANT_OWNER',
    tenant_id: 'tenant-young-space-01',
    status: 'ACTIVE',
    created_at: '2026-01-15T09:00:00Z',
  },
  TENANT_MANAGER: {
    id: 'user-young-manager',
    email: 'manager@youngspace.cafe',
    full_name: 'Dian Permata (Manager Young Space)',
    role: 'TENANT_MANAGER',
    tenant_id: 'tenant-young-space-01',
    status: 'ACTIVE',
    created_at: '2026-01-20T10:00:00Z',
  },
  STAFF_CASHIER: {
    id: 'user-young-cashier',
    email: 'cashier@youngspace.cafe',
    full_name: 'Budi Santoso (Kasir POS)',
    role: 'STAFF_CASHIER',
    tenant_id: 'tenant-young-space-01',
    status: 'ACTIVE',
    created_at: '2026-02-01T08:00:00Z',
  },
  STAFF_BARISTA: {
    id: 'user-young-barista',
    email: 'barista@youngspace.cafe',
    full_name: 'Rian Wijaya (Barista KDS)',
    role: 'STAFF_BARISTA',
    tenant_id: 'tenant-young-space-01',
    status: 'ACTIVE',
    created_at: '2026-02-01T08:30:00Z',
  },
  STAFF_STOKIS: {
    id: 'user-young-stokis',
    email: 'stokis@youngspace.cafe',
    full_name: 'Hendra Setiawan (Stokis/Gudang)',
    role: 'STAFF_STOKIS',
    tenant_id: 'tenant-young-space-01',
    status: 'ACTIVE',
    created_at: '2026-02-05T09:00:00Z',
  },
  STAFF: {
    id: 'user-young-staff-absensi',
    email: 'staff@youngspace.cafe',
    full_name: 'Doni Pratama (Staff Absensi)',
    role: 'STAFF',
    tenant_id: 'tenant-young-space-01',
    status: 'ACTIVE',
    created_at: '2026-02-15T08:00:00Z',
  },
  MEMBER: {
    id: 'user-young-member',
    email: 'member@gmail.com',
    full_name: 'Siti Rahma (Member Young Space)',
    role: 'MEMBER',
    tenant_id: 'tenant-young-space-01',
    status: 'ACTIVE',
    member_tier: 'Gold',
    phone: '+62 812-3456-7890',
    created_at: '2026-02-10T14:20:00Z',
  },
  GUEST: {
    id: 'user-guest',
    email: 'guest@session.local',
    full_name: 'Pelanggan Walk-In / Guest',
    role: 'GUEST',
    tenant_id: 'tenant-young-space-01',
    status: 'ACTIVE',
    created_at: '2026-03-01T12:00:00Z',
  },
};

export const INITIAL_ALL_USERS: UserProfile[] = [
  INITIAL_USERS.PLATFORM_MASTER,
  // Young Space Owners (3 Co-Owners - 1 tenant can have > 2 owner accounts)
  INITIAL_USERS.TENANT_OWNER,
  {
    id: 'user-young-owner-02',
    email: 'dimas.owner@youngspace.cafe',
    full_name: 'Dimas Raditya (Co-Founder & Co-Owner)',
    role: 'TENANT_OWNER',
    tenant_id: 'tenant-young-space-01',
    status: 'ACTIVE',
    phone: '+62 811-2233-4455',
    created_at: '2026-01-16T10:00:00Z',
  },
  {
    id: 'user-young-owner-03',
    email: 'clara.partner@youngspace.cafe',
    full_name: 'Clara Wijaya (Managing Partner & Co-Owner)',
    role: 'TENANT_OWNER',
    tenant_id: 'tenant-young-space-01',
    status: 'ACTIVE',
    phone: '+62 812-9988-7766',
    created_at: '2026-01-18T14:30:00Z',
  },
  // Young Space Staff & Members
  INITIAL_USERS.TENANT_MANAGER,
  INITIAL_USERS.STAFF_CASHIER,
  INITIAL_USERS.STAFF_BARISTA,
  INITIAL_USERS.STAFF_STOKIS,
  INITIAL_USERS.STAFF,
  INITIAL_USERS.MEMBER,
  INITIAL_USERS.GUEST,
  // Senja Kopi Roastery Owners
  {
    id: 'user-senja-owner-01',
    email: 'fajar@senjakopi.id',
    full_name: 'Fajar Nugraha (Founder Senja Kopi)',
    role: 'TENANT_OWNER',
    tenant_id: 'tenant-demo-02',
    status: 'ACTIVE',
    phone: '+62 813-1122-3344',
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'user-senja-owner-02',
    email: 'anita@senjakopi.id',
    full_name: 'Anita Salim (Co-Owner Senja Kopi)',
    role: 'TENANT_OWNER',
    tenant_id: 'tenant-demo-02',
    status: 'ACTIVE',
    phone: '+62 813-5566-7788',
    created_at: '2026-02-02T09:30:00Z',
  },
];
