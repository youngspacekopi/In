import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { PlatformMasterView } from '../roles/PlatformMasterView';
import { TenantOwnerView } from '../roles/TenantOwnerView';
import { TenantManagerView } from '../roles/TenantManagerView';
import { StaffCashierView } from '../roles/StaffCashierView';
import { StaffBaristaView } from '../roles/StaffBaristaView';
import { StaffStokisView } from '../roles/StaffStokisView';
import { MemberView } from '../roles/MemberView';
import { GuestView } from '../roles/GuestView';
import { ProductManagementModal } from '../desktop/ProductManagementModal';
import { useCafe } from '../../context/CafeContext';
import { 
  Wifi, 
  Battery, 
  Signal, 
  Home, 
  ShoppingBag, 
  Coffee, 
  Boxes, 
  Users, 
  Award,
  ChevronLeft,
  Calendar,
  X
} from 'lucide-react';

interface Props {
  onOpenRoleSwitcher: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const AndroidPresentation: React.FC<Props> = ({
  onOpenRoleSwitcher,
  showToast,
}) => {
  const { currentUser, activeTenant } = usePlatform();
  const { categories, addMenuItem, updateMenuItem, addCategory } = useCafe();

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Tenant creation modal for platform master inside android
  const [showAddTenant, setShowAddTenant] = useState(false);

  const role = currentUser.role;

  return (
    <div className="min-h-screen bg-stone-900 py-6 px-4 flex items-center justify-center">
      {/* Android Device Frame Simulation (390px width) */}
      <div className="w-full max-w-[390px] h-[820px] bg-[#FDFBF7] rounded-[48px] shadow-2xl border-8 border-stone-800 flex flex-col overflow-hidden relative">
        {/* Android 15 Status Bar */}
        <div className="px-6 pt-3 pb-2 bg-[#FAF8F5] border-b border-stone-200 flex items-center justify-between text-xs text-stone-700 select-none shrink-0">
          <span className="font-mono font-bold text-[11px]">
            {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="w-20 h-4 bg-stone-800 rounded-full mx-auto" />
          <div className="flex items-center gap-1.5 text-stone-600">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Dynamic Role View Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {role === 'PLATFORM_MASTER' && (
            <PlatformMasterView
              onOpenAddTenant={() => setShowAddTenant(true)}
              showToast={showToast}
            />
          )}

          {role === 'TENANT_OWNER' && (
            <TenantOwnerView
              onOpenNewProduct={() => setShowProductModal(true)}
              onOpenCashModal={() => {}}
              showToast={showToast}
            />
          )}

          {role === 'TENANT_MANAGER' && (
            <TenantManagerView showToast={showToast} />
          )}

          {role === 'STAFF_CASHIER' && (
            <StaffCashierView showToast={showToast} />
          )}

          {role === 'STAFF_BARISTA' && (
            <StaffBaristaView showToast={showToast} />
          )}

          {role === 'STAFF_STOKIS' && (
            <StaffStokisView showToast={showToast} />
          )}

          {role === 'MEMBER' && (
            <MemberView showToast={showToast} />
          )}

          {role === 'GUEST' && (
            <GuestView
              onRegisterMember={onOpenRoleSwitcher}
              showToast={showToast}
            />
          )}
        </div>

        {/* Android Native Bottom Gesture Pill */}
        <div className="py-2 bg-[#FAF8F5] border-t border-stone-200 flex justify-center items-center shrink-0">
          <div className="w-28 h-1 bg-stone-400 rounded-full" />
        </div>
      </div>

      {/* Product Modal */}
      <ProductManagementModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        initialProduct={editingProduct}
        categories={categories}
        onSave={(data) => {
          addMenuItem(data);
          showToast(`Menu "${data.name}" berhasil dibuat!`);
        }}
        onUpdate={(id, data) => {
          updateMenuItem(id, data);
          showToast('Menu berhasil diperbarui!');
        }}
        onAddCategory={(cat) => addCategory(cat)}
      />
    </div>
  );
};
