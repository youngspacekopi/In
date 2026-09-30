/**
 * KOPIIN – Platform & Tenant Audit Logging Engine
 * Provides auditability for compliance, security tracking, and tenant data integrity.
 */

import { AuditLogEntry, UserProfile } from '../../types/platform';

const inMemoryAuditLog: AuditLogEntry[] = [
  {
    id: 'audit-init-001',
    tenant_id: null,
    user_id: 'user-platform-master',
    user_email: 'mdqputra@gmail.com',
    user_role: 'PLATFORM_MASTER',
    action: 'PLATFORM_BOOTSTRAP',
    resource: 'platform:system',
    details: {
      platform: 'KOPIIN',
      version: '1.0.0-foundation',
      demo_tenant: 'Young Space',
      target_profiles: ['desktop', 'tablet', 'android', 'pwa'],
    },
    ip_address: '127.0.0.1',
    timestamp: '2026-09-21T08:00:00Z',
  },
  {
    id: 'audit-tenant-002',
    tenant_id: 'tenant-young-space-01',
    user_id: 'user-young-owner',
    user_email: 'owner@youngspace.cafe',
    user_role: 'TENANT_OWNER',
    action: 'TENANT_PROVISIONED',
    resource: 'tenants:young-space',
    details: {
      tenant_name: 'Young Space',
      status: 'active',
      currency: 'IDR',
      tax_rate: 0.11,
      service_charge: 0.05,
    },
    ip_address: '127.0.0.1',
    timestamp: '2026-09-21T08:05:00Z',
  },
];

export function recordAuditLog(
  user: UserProfile,
  action: string,
  resource: string,
  details: Record<string, unknown>
): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    tenant_id: user.tenant_id,
    user_id: user.id,
    user_email: user.email,
    user_role: user.role,
    action,
    resource,
    details,
    ip_address: '127.0.0.1',
    timestamp: new Date().toISOString(),
  };

  inMemoryAuditLog.unshift(entry);
  return entry;
}

export function getAuditLogs(filterTenantId?: string | null): AuditLogEntry[] {
  if (filterTenantId === undefined) {
    return inMemoryAuditLog;
  }
  return inMemoryAuditLog.filter(log => log.tenant_id === filterTenantId);
}
