/**
 * KOPIIN – Unified Platform Context
 * Manages:
 * 1. Target Presentation Profile (Desktop, Tablet, Android, Customer PWA)
 * 2. Active Tenant Isolation Context (Young Space Demo Café)
 * 3. User Session & RBAC Permissions (KOPIIN Native Auth – BUKAN Supabase Auth)
 * 4. Auditability & Realtime State
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PresentationTarget,
  PresentationProfile,
  Tenant,
  UserProfile,
  UserRole,
  GranularPermission,
  SupabaseConfigStatus,
  AuditLogEntry,
  KopiinSession,
} from '../types/platform';

import {
  DEMO_TENANT,
  INITIAL_USERS,
  INITIAL_ALL_USERS,
  ROLE_PERMISSIONS_MATRIX,
  hasPermission,
} from '../lib/auth/rbac';
import { getSupabaseStatus } from '../lib/supabase/client';
import { recordAuditLog, getAuditLogs } from '../lib/audit/auditLogger';
import { 
  createKopiinSession, 
  registerMemberSelf, 
  createStaffAccount, 
  createTenantAndOwner,
  createOwnerAccount
} from '../lib/auth/kopiinAuth';

interface PlatformContextType {
  presentation: PresentationTarget;
  setPresentation: (target: PresentationTarget) => void;
  presentationProfile: 'DESKTOP' | 'TABLET' | 'ANDROID' | 'CUSTOMER_PWA';
  setPresentationProfile: (profile: 'DESKTOP' | 'TABLET' | 'ANDROID' | 'CUSTOMER_PWA') => void;
  tenants: Tenant[];
  activeTenant: Tenant;
  switchTenant: (tenantId: string) => void;
  registerTenant: (data: {
    tenantName: string;
    tenantSlug: string;
    ownerFullName: string;
    ownerEmail: string;
    ownerPasswordPlainText: string;
    taxRate?: number;
    serviceCharge?: number;
  }) => Promise<{ tenant: Tenant; owner: UserProfile }>;
  users: UserProfile[];
  getTenantOwners: (tenantId: string) => UserProfile[];
  createOwnerForTenant: (tenantId: string, data: {
    fullName: string;
    email: string;
    passwordPlainText: string;
    phone?: string;
  }) => Promise<UserProfile>;
  toggleUserStatus: (userId: string) => void;
  currentUser: UserProfile;
  currentSession: KopiinSession;
  isAuthenticated: boolean;
  login: (user: UserProfile) => void;
  loginAsRole: (role: UserRole) => void;
  loginWithCredentials: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
  switchUserRole: (role: UserRole) => void;
  permissions: GranularPermission[];
  hasAccess: (permission: GranularPermission) => boolean;
  isRealtimeConnected: boolean;
  supabaseStatus: SupabaseConfigStatus;
  auditLogs: AuditLogEntry[];
  recordAction: (action: string, resource: string, details?: Record<string, unknown>) => void;
  registerMember: (data: { email: string; fullName: string; passwordPlainText: string; phone?: string }) => Promise<UserProfile>;
  createStaff: (data: { email: string; fullName: string; role: 'TENANT_MANAGER' | 'STAFF_CASHIER' | 'STAFF_BARISTA' | 'STAFF_STOKIS' | 'STAFF'; temporaryPasswordPlainText: string }) => Promise<UserProfile>;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Presentation Profile: default to Desktop, adaptable to tablet, android, pwa
  const [presentation, setPresentationState] = useState<PresentationTarget>('desktop');

  // 2. Tenants Directory & Active Tenant Isolation
  const [tenants, setTenants] = useState<Tenant[]>([
    DEMO_TENANT,
    {
      id: 'tenant-demo-02',
      name: 'Senja Kopi Roastery',
      slug: 'senja-kopi',
      status: 'active',
      created_at: '2026-02-01T08:00:00Z',
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      settings: {
        tax_rate: 0.11,
        service_charge: 0.05,
        ordering_enabled: true,
        brand_color: '#4A2E1B',
      },
    },
  ]);
  const [activeTenant, setActiveTenant] = useState<Tenant>(DEMO_TENANT);

  // 3. User Accounts Directory & Multi-Owner Architecture (Strictly single master mdqputra@gmail.com)
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem('kopiin_all_users');
      if (stored) {
        const parsed: UserProfile[] = JSON.parse(stored);
        const filtered = parsed.filter(u => u.role !== 'PLATFORM_MASTER' && u.email.toLowerCase() !== 'master@kopiin.com');
        return [INITIAL_USERS.PLATFORM_MASTER, ...filtered];
      }
    } catch {}
    return INITIAL_ALL_USERS;
  });

  // 4. Current User & Authentication State (Session Isolation)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('table')) {
          return true; // Auto-login as Guest on scanned table barcode
        }
      }
      const stored = localStorage.getItem('kopiin_is_authenticated');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('table')) {
          return INITIAL_USERS.GUEST;
        }
      }
      const storedUser = localStorage.getItem('kopiin_current_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.role === 'PLATFORM_MASTER' || parsed.email === 'master@kopiin.com') {
          return INITIAL_USERS.PLATFORM_MASTER;
        }
        return parsed;
      }
    } catch {}
    return INITIAL_USERS.TENANT_OWNER;
  });

  // 5. Active KOPIIN Session (Native Auth)
  const [currentSession, setCurrentSession] = useState<KopiinSession>(() => createKopiinSession(currentUser));

  // 6. Supabase Status (PostgreSQL, Storage, Realtime – NOT Auth)
  const [supabaseStatus] = useState<SupabaseConfigStatus>(getSupabaseStatus());

  // 7. Realtime connection simulation / readiness state
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);

  // 8. Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getAuditLogs());

  // Strictly sync activeTenant with currentUser's tenant_id for full isolation
  useEffect(() => {
    if (currentUser?.tenant_id) {
      const userTenant = tenants.find(t => t.id === currentUser.tenant_id);
      if (userTenant && userTenant.id !== activeTenant.id) {
        setActiveTenant(userTenant);
      }
    }
  }, [currentUser, tenants, activeTenant.id]);

  // Listen to presentation changes and auto-align default persona if appropriate
  const setPresentation = (target: PresentationTarget) => {
    setPresentationState(target);
    recordAuditLog(currentUser, 'PRESENTATION_PROFILE_SWITCHED', `presentation:${target}`, {
      target_presentation: target,
      active_tenant: activeTenant.name,
    });
    setAuditLogs(getAuditLogs());
  };

  const login = (user: UserProfile) => {
    setCurrentUser(user);
    const session = createKopiinSession(user);
    setCurrentSession(session);
    setIsAuthenticated(true);

    // Strictly isolate user into their assigned tenant
    if (user.tenant_id) {
      const userTenant = tenants.find(t => t.id === user.tenant_id);
      if (userTenant) {
        setActiveTenant(userTenant);
      }
    }

    try {
      localStorage.setItem('kopiin_is_authenticated', 'true');
      localStorage.setItem('kopiin_current_user', JSON.stringify(user));
    } catch {}

    // Auto-align presentation if appropriate
    if (user.role === 'PLATFORM_MASTER' && presentation !== 'desktop') {
      setPresentationState('desktop');
    } else if ((user.role === 'STAFF_CASHIER' || user.role === 'STAFF_BARISTA') && presentation === 'desktop') {
      setPresentationState('tablet');
    } else if (user.role === 'MEMBER' && presentation === 'desktop') {
      setPresentationState('android');
    } else if (user.role === 'GUEST' && presentation === 'desktop') {
      setPresentationState('pwa');
    }

    recordAuditLog(user, 'USER_LOGGED_IN', `user:${user.id}`, {
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    });
    setAuditLogs(getAuditLogs());
  };

  const loginAsRole = (role: UserRole) => {
    const user = INITIAL_USERS[role];
    if (user) {
      login(user);
    }
  };

  const loginWithCredentials = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    // Check single master account mdqputra@gmail.com
    if (trimmedEmail === 'mdqputra@gmail.com') {
      if (password && password.trim() !== '990830') {
        return { success: false, error: 'Password master salah. Gunakan password master yang benar (990830).' };
      }
      login(INITIAL_USERS.PLATFORM_MASTER);
      return { success: true };
    }

    // Explicitly reject old master account
    if (trimmedEmail === 'master@kopiin.com') {
      return { success: false, error: 'Akun ini telah dinonaktifkan. Gunakan akun master resmi mdqputra@gmail.com.' };
    }

    const foundUser = users.find(u => u.email.toLowerCase() === trimmedEmail) ||
      Object.values(INITIAL_USERS).find(u => u.email.toLowerCase() === trimmedEmail);

    if (!foundUser) {
      return { success: false, error: 'Email akun tidak terdaftar dalam sistem café.' };
    }

    if (foundUser.status === 'SUSPENDED') {
      return { success: false, error: 'Akun Anda sedang ditangguhkan. Silakan hubungi Owner café.' };
    }

    login(foundUser);
    return { success: true };
  };

  const logout = () => {
    recordAuditLog(currentUser, 'USER_LOGGED_OUT', `user:${currentUser.id}`, {
      email: currentUser.email,
      role: currentUser.role,
    });
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('kopiin_is_authenticated');
    } catch {}
    setAuditLogs(getAuditLogs());
  };

  const setUserRole = (role: UserRole) => {
    loginAsRole(role);
  };

  const permissions = ROLE_PERMISSIONS_MATRIX[currentUser.role] || [];

  const hasAccess = (permission: GranularPermission): boolean => {
    return hasPermission(currentUser.role, permission);
  };

  const recordAction = (action: string, resource: string, details: Record<string, unknown> = {}) => {
    recordAuditLog(currentUser, action, resource, details);
    setAuditLogs(getAuditLogs());
  };

  // Get all owner accounts for a specific tenant (supports > 2 owners)
  const getTenantOwners = (tenantId: string): UserProfile[] => {
    return users.filter(u => u.role === 'TENANT_OWNER' && u.tenant_id === tenantId);
  };

  // Master creates additional Owner account for a tenant (1 tenant can have > 2 owners)
  const createOwnerForTenant = async (tenantId: string, data: {
    fullName: string;
    email: string;
    passwordPlainText: string;
    phone?: string;
  }): Promise<UserProfile> => {
    const newOwner = await createOwnerAccount(currentUser, {
      tenantId,
      ...data,
    });
    setUsers(prev => [...prev, newOwner]);
    setAuditLogs(getAuditLogs());
    return newOwner;
  };

  // Toggle account status (ACTIVE <-> SUSPENDED)
  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        recordAuditLog(currentUser, 'USER_STATUS_TOGGLED', `user:${u.id}`, {
          user_email: u.email,
          old_status: u.status,
          new_status: newStatus,
        });
        return { ...u, status: newStatus };
      }
      return u;
    }));
    setAuditLogs(getAuditLogs());
  };

  // Member Self-Registration
  const registerMember = async (data: { email: string; fullName: string; passwordPlainText: string; phone?: string }) => {
    const newMember = await registerMemberSelf({
      ...data,
      tenantId: activeTenant.id,
    });
    setUsers(prev => [...prev, newMember]);
    setCurrentUser(newMember);
    setCurrentSession(createKopiinSession(newMember));
    setAuditLogs(getAuditLogs());
    return newMember;
  };

  // Staff Creation by Master or Owner
  const createStaff = async (data: { email: string; fullName: string; role: 'TENANT_MANAGER' | 'STAFF_CASHIER' | 'STAFF_BARISTA' | 'STAFF_STOKIS' | 'STAFF'; temporaryPasswordPlainText: string }) => {
    const newStaff = await createStaffAccount(currentUser, {
      ...data,
      tenantId: activeTenant.id,
    });
    setUsers(prev => {
      const updated = [...prev, newStaff];
      try {
        localStorage.setItem('kopiin_all_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setAuditLogs(getAuditLogs());
    return newStaff;
  };

  // Switch Active Tenant (Platform Master or Multi-tenant context)
  const switchTenant = (tenantId: string) => {
    const target = tenants.find(t => t.id === tenantId);
    if (target) {
      setActiveTenant(target);
      recordAuditLog(currentUser, 'TENANT_CONTEXT_SWITCHED', `tenant:${target.id}`, {
        tenant_id: target.id,
        tenant_name: target.name,
      });
      setAuditLogs(getAuditLogs());
    }
  };

  // Tenant & Owner Creation by Master
  const registerTenant = async (data: {
    tenantName: string;
    tenantSlug: string;
    ownerFullName: string;
    ownerEmail: string;
    ownerPasswordPlainText: string;
    taxRate?: number;
    serviceCharge?: number;
  }) => {
    const result = await createTenantAndOwner(currentUser, data);
    setTenants(prev => [...prev, result.tenant]);
    setUsers(prev => [...prev, result.owner]);
    setAuditLogs(getAuditLogs());
    return result;
  };

  // Realtime heartbeat simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRealtimeConnected(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Mapping between PresentationTarget ('desktop', 'tablet', 'android', 'pwa') and uppercase PresentationProfile
  const profileMap: Record<PresentationTarget, 'DESKTOP' | 'TABLET' | 'ANDROID' | 'CUSTOMER_PWA'> = {
    desktop: 'DESKTOP',
    tablet: 'TABLET',
    android: 'ANDROID',
    pwa: 'CUSTOMER_PWA',
  };

  const reverseProfileMap: Record<'DESKTOP' | 'TABLET' | 'ANDROID' | 'CUSTOMER_PWA', PresentationTarget> = {
    DESKTOP: 'desktop',
    TABLET: 'tablet',
    ANDROID: 'android',
    CUSTOMER_PWA: 'pwa',
  };

  const presentationProfile = profileMap[presentation] || 'DESKTOP';
  const setPresentationProfile = (profile: 'DESKTOP' | 'TABLET' | 'ANDROID' | 'CUSTOMER_PWA') => {
    setPresentation(reverseProfileMap[profile] || 'desktop');
  };

  return (
    <PlatformContext.Provider
      value={{
        presentation,
        setPresentation,
        presentationProfile,
        setPresentationProfile,
        tenants,
        activeTenant,
        switchTenant,
        registerTenant,
        users,
        getTenantOwners,
        createOwnerForTenant,
        toggleUserStatus,
        currentUser,
        currentSession,
        isAuthenticated,
        login,
        loginAsRole,
        loginWithCredentials,
        logout,
        setUserRole,
        switchUserRole: setUserRole,
        permissions,
        hasAccess,
        isRealtimeConnected,
        supabaseStatus,
        auditLogs,
        recordAction,
        registerMember,
        createStaff,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export function usePlatform(): PlatformContextType {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}
