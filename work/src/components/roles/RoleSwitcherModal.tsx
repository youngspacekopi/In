import React from 'react';
import { UserRole } from '../../types/platform';
import { 
  ShieldAlert, 
  Building2, 
  Briefcase, 
  CreditCard, 
  Coffee, 
  Package, 
  Sparkles, 
  User, 
  Check, 
  X,
  Lock
} from 'lucide-react';

interface Props {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onClose: () => void;
}

interface RoleOption {
  role: UserRole;
  title: string;
  name: string;
  desc: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  iconBg: string;
}

export const RoleSwitcherModal: React.FC<Props> = ({ currentRole, onSelectRole, onClose }) => {
  // Master is completely hidden from regular café accounts (Owner, Manager, Cashier, Barista, Stokis, Member, Guest)
  const roles: RoleOption[] = [
    ...(currentRole === 'PLATFORM_MASTER' ? [{
      role: 'PLATFORM_MASTER' as UserRole,
      title: 'Platform Master',
      name: 'Master KOPIIN Platform',
      desc: 'SuperAdmin SaaS: Pembuat tenant café dan akun Owner.',
      badge: 'SuperAdmin',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: ShieldAlert,
      iconBg: 'bg-purple-600 text-white',
    }] : []),
    {
      role: 'TENANT_OWNER',
      title: 'Owner Café',
      name: 'Arya Pratama',
      desc: 'Pemilik Bisnis: Laporan penjualan, laba rugi, kas/transfer, stok, resep & seluruh akses fitur kafe',
      badge: 'Owner (Akses Penuh)',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: Building2,
      iconBg: 'bg-amber-700 text-white',
    },
    {
      role: 'TENANT_MANAGER',
      title: 'Manager Café',
      name: 'Dian Permata',
      desc: 'Shift Supervisor: Denah meja, shift kas, absensi staf, opname bahan, void approval',
      badge: 'Operasional & Shift',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Briefcase,
      iconBg: 'bg-blue-600 text-white',
    },
    {
      role: 'STAFF_CASHIER',
      title: 'Kasir POS',
      name: 'Budi Santoso',
      desc: 'Floor Kasir: Input pesanan meja, keranjang belanja, proses bayar QRIS/Tunai, cetak struk',
      badge: 'Kasir & Billing',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: CreditCard,
      iconBg: 'bg-emerald-600 text-white',
    },
    {
      role: 'STAFF_BARISTA',
      title: 'Barista (KDS)',
      name: 'Rian Wijaya',
      desc: 'Kitchen Display: Tiket pesanan racikan kopi, status masak/siap saji, cek stok susu/kopi',
      badge: 'Bar & KDS Display',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: Coffee,
      iconBg: 'bg-orange-600 text-white',
    },
    {
      role: 'STAFF_STOKIS',
      title: 'Stokis / Gudang',
      name: 'Hendra Setiawan',
      desc: 'Manajemen Logistik: Stok bahan baku real-time, restok faktur masuk, stock opname fisik',
      badge: 'Gudang & Inventory',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      icon: Package,
      iconBg: 'bg-indigo-600 text-white',
    },
    {
      role: 'MEMBER',
      title: 'Member Loyalty',
      name: 'Siti Rahma (Gold)',
      desc: 'Pelanggan Setia: Kartu loyalitas digital, saldo poin, QR member, tukar reward, self-order',
      badge: 'Member VIP Poin',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: Sparkles,
      iconBg: 'bg-rose-600 text-white',
    },
    {
      role: 'GUEST',
      title: 'Guest (Walk-in)',
      name: 'Tamu Café Walk-in',
      desc: 'Katalog Menu Digital: Jelajahi menu & harga, pesan di meja, daftar member instan',
      badge: 'Pengunjung Publik',
      badgeColor: 'bg-stone-100 text-stone-700 border-stone-300',
      icon: User,
      iconBg: 'bg-stone-600 text-white',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex flex-col justify-end items-center p-0 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-5">
        
        {/* Handle bar on mobile */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700" />
              <h3 className="font-extrabold text-base text-[#1F1E1D]">Pemisahan Peran & Permission (RBAC)</h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Pilih peran akun untuk menguji antarmuka & hak akses yang terisolasi
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {roles.map((r) => {
            const isSelected = currentRole === r.role;
            const Icon = r.icon;
            return (
              <div
                key={r.role}
                onClick={() => {
                  onSelectRole(r.role);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                  isSelected 
                    ? 'border-amber-700 bg-amber-50/60 shadow-xs ring-1 ring-amber-600' 
                    : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${r.iconBg} shadow-xs`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs text-[#1F1E1D]">{r.title}</span>
                      <span className="text-[11px] font-semibold text-stone-500 font-mono">({r.name})</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${r.badgeColor}`}>
                      {r.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                    {r.desc}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center shrink-0 self-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <span>Setiap role memiliki navigasi, permission & fitur tersendiri.</span>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white rounded-xl font-bold text-xs hover:bg-stone-800 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
