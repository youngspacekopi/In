import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { useCafe } from '../../context/CafeContext';
import { 
  Coffee, 
  Search, 
  Sparkles, 
  Gift, 
  CheckCircle2, 
  UserPlus, 
  ShoppingBag, 
  Plus, 
  Minus, 
  QrCode, 
  Check, 
  X,
  Clock,
  ArrowRight
} from 'lucide-react';
import { MenuItem } from '../../types/cafe';

interface Props {
  onRegisterMember?: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const GuestView: React.FC<Props> = ({ onRegisterMember, showToast }) => {
  const { activeTenant } = usePlatform();
  const { menuItems, categories, tables, createOrder, updateTableStatus } = useCafe();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  
  // Table detection from URL Barcode (?table=Meja%2001 or ?table=01)
  const [activeTable, setActiveTable] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tbl = params.get('table');
      if (tbl) return tbl.startsWith('Meja') ? tbl : `Meja ${tbl}`;
    }
    return 'Meja 01'; // Default connected table
  });

  const [cart, setCart] = useState<Record<string, { item: MenuItem; quantity: number; notes: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('Tamu Meja');

  const filtered = menuItems.filter((m) => {
    if (selectedCat !== 'ALL' && m.category_id !== selectedCat) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
  const cartTotalQty = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      const newQty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: newQty,
          notes: existing?.notes || '',
        },
      };
    });
    showToast(`${item.name} ditambahkan ke pesanan ${activeTable}!`);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  };

  const handleSubmitTableOrder = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const newOrd = await createOrder({
        customerName: guestName ? `${guestName} (${activeTable})` : `Pelanggan ${activeTable}`,
        customerType: 'GUEST',
        orderType: 'DINE_IN',
        tableNumber: activeTable,
        items: cartItems.map((c) => ({
          menuItem: c.item,
          quantity: c.quantity,
          notes: c.notes,
        })),
      });

      // Find matching table in tables state and update status to OCCUPIED
      const matchedTable = tables.find((t) => t.table_number.toLowerCase() === activeTable.toLowerCase());
      if (matchedTable) {
        updateTableStatus(matchedTable.id, 'OCCUPIED');
      }

      setPlacedOrderNumber(newOrd.order_number);
      setCart({});
      showToast(`Pesanan #${newOrd.order_number} untuk ${activeTable} terkirim ke Kasir & Barista!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim pesanan meja', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] pb-28 space-y-4">
      {/* Table Barcode Connection Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-[#4A2E1B] to-stone-900 text-white p-4 rounded-3xl shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                Pemesanan Mandiri Meja
              </span>
              <h2 className="text-sm font-black text-white">{activeTable} &bull; {activeTenant?.name}</h2>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Barcode Terhubung
          </span>
        </div>

        {/* Change table option */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
          <span className="text-[11px] text-amber-100/80">Pindah meja makan:</span>
          <select
            value={activeTable}
            onChange={(e) => setActiveTable(e.target.value)}
            className="bg-stone-800/80 text-white text-[11px] font-bold px-2 py-1 rounded-lg border border-amber-400/30 outline-none cursor-pointer"
          >
            {tables.map((t) => (
              <option key={t.id} value={t.table_number} className="bg-stone-900">
                {t.table_number} ({t.capacity} Kursi)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Member Promotion Banner */}
      <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            <p className="font-extrabold text-amber-950">Daftar Member KOPIIN</p>
            <p className="text-[10px] text-stone-600">Dapatkan cashback poin reward setiap transaksi</p>
          </div>
        </div>
        {onRegisterMember && (
          <button
            onClick={onRegisterMember}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
          >
            Daftar Gratis
          </button>
        )}
      </div>

      {/* Search & Categories */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Cari kopi susu, teh, croissant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-stone-200 text-xs outline-none shadow-2xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCat('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCat === 'ALL'
                ? 'bg-[#4A2E1B] text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCat === c.id
                  ? 'bg-[#4A2E1B] text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((item) => {
          const inCartQty = cart[item.id]?.quantity || 0;
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 p-2.5 shadow-xs flex flex-col justify-between"
            >
              <div className="aspect-4/3 rounded-xl overflow-hidden bg-stone-100 mb-2">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#1F1E1D] line-clamp-1">{item.name}</h4>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      item.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.is_available ? 'Ready' : 'Habis'}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 line-clamp-2">{item.description}</p>
                <div className="pt-1 border-t border-stone-100 flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#4A2E1B]">
                    Rp{item.price.toLocaleString('id-ID')}
                  </span>

                  {item.is_available && (
                    <div className="flex items-center gap-1">
                      {inCartQty > 0 && (
                        <>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold w-4 text-center">{inCartQty}</span>
                        </>
                      )}
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-6 h-6 rounded-lg bg-[#4A2E1B] hover:bg-[#3D2616] text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs"
                        title="Tambah ke pesanan meja"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Cart Bar (if items in cart) */}
      {cartTotalQty > 0 && (
        <div className="fixed bottom-3 left-3 right-3 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom-3 duration-200">
          <div className="bg-stone-900 text-white rounded-2xl p-3 shadow-2xl border border-stone-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xs">
                {cartTotalQty}
              </div>
              <div>
                <span className="text-[10px] text-amber-300 font-bold block">{activeTable} &bull; Dine In</span>
                <span className="text-sm font-mono font-bold text-white">
                  Rp{cartTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmitTableOrder}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim Pesanan Meja'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Order Success Dialog */}
      {placedOrderNumber && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-stone-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Pesanan Terkirim ke Kasir & Barista
              </span>
              <h4 className="text-base font-extrabold text-[#1F1E1D] mt-2">
                Order #{placedOrderNumber}
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                Pesanan untuk <strong>{activeTable}</strong> sedang disiapkan. Silakan menuju kasir untuk melakukan pembayaran ketika selesai.
              </p>
            </div>
            <button
              onClick={() => setPlacedOrderNumber(null)}
              className="w-full py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Tutup & Lihat Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
