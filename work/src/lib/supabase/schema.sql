-- ==============================================================================
-- KOPIIN MULTI-TENANT POSTGRESQL SCHEMA (SUPABASE PRODUCTION READY)
-- 17 Modul Lengkap Sesuai Master Spec:
-- - Platform Hierarchy: KOPIIN Platform -> Tenants -> Users/Staff/Member -> Operasional
-- - BUKAN Supabase Auth (Sistem Akun & Autentikasi Mandiri KOPIIN di tabel public.kopiin_users)
-- - Multi-Tenant Isolation ketat dengan tenant_id
-- - Auto-print rules, Mixed Payment, HPP/Margin, Kartu Stok, Kas Laci, Absensi Selfie
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TENANTS TABLE (Platform Level)
CREATE TABLE IF NOT EXISTS public.tenants (
    id TEXT PRIMARY KEY DEFAULT 'tenant-' || substr(md5(random()::text), 1, 10),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    currency TEXT NOT NULL DEFAULT 'IDR',
    timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    tax_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.11,
    service_charge NUMERIC(5, 4) NOT NULL DEFAULT 0.05,
    ordering_enabled BOOLEAN NOT NULL DEFAULT true,
    brand_color TEXT NOT NULL DEFAULT '#4A2E1B',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Tenant Demo
INSERT INTO public.tenants (id, name, slug, status, currency, timezone, tax_rate, service_charge, ordering_enabled, brand_color)
VALUES (
    'tenant-young-space-01',
    'Young Space',
    'young-space',
    'active',
    'IDR',
    'Asia/Jakarta',
    0.11,
    0.05,
    true,
    '#4A2E1B'
)
ON CONFLICT (id) DO NOTHING;

-- 2. KOPIIN NATIVE USERS TABLE (Database Akun Mandiri KOPIIN - BUKAN Supabase Auth)
CREATE TABLE IF NOT EXISTS public.kopiin_users (
    id TEXT PRIMARY KEY DEFAULT 'user-' || substr(md5(random()::text), 1, 12),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Salted PBKDF2/Scrypt hash
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN (
        'PLATFORM_MASTER',
        'TENANT_OWNER',
        'TENANT_MANAGER',
        'STAFF_CASHIER',
        'STAFF_BARISTA',
        'STAFF_STOKIS',
        'MEMBER',
        'GUEST'
    )),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    phone TEXT,
    member_tier TEXT DEFAULT 'Bronze' CHECK (member_tier IN ('Bronze', 'Silver', 'Gold')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. KOPIIN SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.kopiin_sessions (
    id TEXT PRIMARY KEY DEFAULT 'sess-' || substr(md5(random()::text), 1, 12),
    session_token TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES public.kopiin_users(id) ON DELETE CASCADE,
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_role TEXT NOT NULL,
    ip_address TEXT NOT NULL DEFAULT '127.0.0.1',
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT 'cat-' || substr(md5(random()::text), 1, 8),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. MENU ITEMS & COGS (Katalog & Margin Modal)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY DEFAULT 'menu-' || substr(md5(random()::text), 1, 8),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CAFE TABLES
CREATE TABLE IF NOT EXISTS public.cafe_tables (
    id TEXT PRIMARY KEY DEFAULT 'tbl-' || substr(md5(random()::text), 1, 8),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    capacity INT NOT NULL DEFAULT 2,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT 'ord-' || substr(md5(random()::text), 1, 10),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_id TEXT REFERENCES public.kopiin_users(id) ON DELETE SET NULL,
    customer_type TEXT NOT NULL CHECK (customer_type IN ('GUEST', 'MEMBER')),
    order_type TEXT NOT NULL CHECK (order_type IN ('DINE_IN', 'TAKEAWAY', 'DELIVERY')),
    table_number TEXT,
    delivery_address TEXT,
    delivery_phone TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'WAITING_PAYMENT',
        'ACCEPTED',
        'IN_PROCESS',
        'READY',
        'COMPLETED',
        'VOIDED'
    )),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED')),
    auto_printed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY DEFAULT 'oi-' || substr(md5(random()::text), 1, 10),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id TEXT NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
    item_name TEXT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    cost_price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    notes TEXT,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- 9. PAYMENTS & MIXED PAYMENT BREAKDOWN
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT 'pay-' || substr(md5(random()::text), 1, 10),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    total_bill NUMERIC(12, 2) NOT NULL,
    amount_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amount_transfer NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amount_points_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    points_redeemed INT NOT NULL DEFAULT 0,
    change_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'TRANSFER', 'POINT', 'MIXED')),
    payment_reference TEXT,
    cashier_user_id TEXT REFERENCES public.kopiin_users(id),
    cashier_name TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. POINT LEDGERS (Tenant-Isolated Loyalty Points)
CREATE TABLE IF NOT EXISTS public.point_ledgers (
    id TEXT PRIMARY KEY DEFAULT 'pl-' || substr(md5(random()::text), 1, 10),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.kopiin_users(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('EARN', 'REDEEM', 'BONUS_REGISTER', 'REVERSAL', 'EXPIRED')),
    points_in INT NOT NULL DEFAULT 0,
    points_out INT NOT NULL DEFAULT 0,
    balance_after INT NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. INVENTORY ITEMS (Bahan Baku)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id TEXT PRIMARY KEY DEFAULT 'inv-' || substr(md5(random()::text), 1, 10),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    category TEXT NOT NULL,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    minimum_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    average_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    last_restock_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'IN_STOCK' CHECK (status IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'))
);

-- 12. STOCK MOVEMENTS (Kartu Stok Bahan Baku)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id TEXT PRIMARY KEY DEFAULT 'sm-' || substr(md5(random()::text), 1, 10),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    inventory_id TEXT NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT_PRODUCTION', 'OPNAME_ADJUST', 'WASTE')),
    quantity NUMERIC(10, 2) NOT NULL,
    balance_after NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    cost_per_unit NUMERIC(12, 2) NOT NULL,
    reference_note TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. SUPPLIERS & PURCHASES
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY DEFAULT 'sup-' || substr(md5(random()::text), 1, 8),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    supply_category TEXT
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id TEXT PRIMARY KEY DEFAULT 'po-' || substr(md5(random()::text), 1, 10),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    supplier_name TEXT NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PENDING')),
    items_summary TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. CASH TRANSACTIONS (Kas Laci: Kas Masuk & Kas Keluar)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id TEXT PRIMARY KEY DEFAULT 'cash-' || substr(md5(random()::text), 1, 10),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('KAS_MASUK', 'KAS_KELUAR')),
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. STAFF ATTENDANCES (Presensi Mandiri & Bukti Foto Selfie)
CREATE TABLE IF NOT EXISTS public.staff_attendances (
    id TEXT PRIMARY KEY DEFAULT 'att-' || substr(md5(random()::text), 1, 10),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.kopiin_users(id) ON DELETE CASCADE,
    staff_name TEXT NOT NULL,
    role TEXT NOT NULL,
    date DATE NOT NULL,
    check_in_time TIMESTAMPTZ NOT NULL,
    check_out_time TIMESTAMPTZ,
    photo_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ON_TIME', 'LATE', 'OVERTIME')),
    notes TEXT
);

-- 16. PRINTER CONFIGURATIONS
CREATE TABLE IF NOT EXISTS public.printer_configs (
    tenant_id TEXT PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    receipt_printer_name TEXT NOT NULL DEFAULT 'Thermal-POS-80mm',
    kitchen_printer_name TEXT NOT NULL DEFAULT 'Kitchen-Impact-80mm',
    paper_width TEXT NOT NULL DEFAULT '80mm' CHECK (paper_width IN ('58mm', '80mm')),
    auto_print_dine_in BOOLEAN NOT NULL DEFAULT true,
    auto_print_takeaway BOOLEAN NOT NULL DEFAULT true,
    auto_print_delivery_paid BOOLEAN NOT NULL DEFAULT true,
    connection_type TEXT NOT NULL DEFAULT 'NETWORK_LAN'
);

-- 17. AUDIT LOGS (Traceability & Keamanan)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT 'audit-' || substr(md5(random()::text), 1, 12),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT NOT NULL DEFAULT '127.0.0.1',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR TENANT ISOLATION
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.kopiin_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON public.orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant ON public.inventory_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_tenant ON public.cash_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_points_user_tenant ON public.point_ledgers(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendances_tenant ON public.staff_attendances(tenant_id);
