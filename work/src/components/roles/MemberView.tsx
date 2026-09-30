import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { useCafe } from '../../context/CafeContext';
import { 
  Sparkles, 
  Award, 
  QrCode, 
  CreditCard, 
  ShoppingBag, 
  Gift, 
  Clock, 
  CheckCircle2, 
  Coffee, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';

interface Props {
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const MemberView: React.FC<Props> = ({ showToast }) => {
  const { currentUser, activeTenant } = usePlatform();
  const { getMemberBalance, orders, menuItems, createOrder } = useCafe();

  const [activeTab, setActiveTab] = useState<'card' | 'rewards' | 'order' | 'history'>('card');
  const [selectedItems, setSelectedItems] = useState<Array<{ item: any; quantity: number }>>([]);
  const [selfOrderSuccess, setSelfOrderSuccess] = useState<string | null>(null);

  const memberPoints = getMemberBalance(currentUser.id);
  const myOrders = orders.filter((o) => o.customer_id === currentUser.id || o.member_id === currentUser.id);

  const handleAddItem = (item: any) => {
    setSelectedItems((prev) => {
      const idx = prev.findIndex((p) => p.item.id === item.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleSelfOrderSubmit = async () => {
    if (selectedItems.length === 0) return;
    const order = await createOrder({
      customerName: currentUser.full_name,
      customerId: currentUser.id,
      customerType: 'MEMBER',
      orderType: 'TAKEAWAY',
      items: selectedItems.map((s) => ({
        menuItem: s.item,
        quantity: s.quantity,
        notes: 'Pesan Mandiri Member PWA',
      })),
    });
    setSelfOrderSuccess(`Pesanan #${order.order_number} berhasil dikirim ke Barista! Tunjukkan kartu member saat bayar di kasir.`);

    setSelectedItems([]);
    showToast('Pesanan berhasil dibuat!');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] pb-24">
      {/* Digital Member Loyalty Card */}
      <div className="bg-gradient-to-br from-stone-900 via-[#361F12] to-stone-950 text-white p-6 rounded-3xl mb-4 shadow-xl border border-amber-900/40 relative overflow-hidden">
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                GOLD VIP MEMBER
              </span>
              <span className="text-[10px] text-amber-200/70 font-mono">KOPIIN CLUB</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">{currentUser.full_name}</h2>
            <p className="text-xs text-stone-300 font-mono mt-0.5">{currentUser.email}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Award className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/10 flex items-end justify-between relative z-10">
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-bold block mb-0.5">
              Saldo Poin Reward Aktif
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-mono font-black text-amber-400">
                {memberPoints.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-semibold text-stone-300">Poin</span>
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Setara potongan tunai <strong>Rp{(memberPoints * 100).toLocaleString('id-ID')}</strong> di kasir
            </p>
          </div>
          <div className="bg-white p-1.5 rounded-xl">
            <QrCode className="w-14 h-14 text-stone-950" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-100 rounded-xl mb-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('card')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'card' ? 'bg-white text-amber-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[10px]">Kartu Digital</span>
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'rewards' ? 'bg-white text-amber-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span className="text-[10px]">Tukar Hadiah</span>
        </button>
        <button
          onClick={() => setActiveTab('order')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'order' ? 'bg-white text-amber-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span className="text-[10px]">Pesan Sendiri</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'history' ? 'bg-white text-amber-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="text-[10px]">Riwayat Order</span>
        </button>
      </div>

      {/* Tab 1: Member Perks */}
      {activeTab === 'card' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
            <h3 className="font-extrabold text-xs text-[#1F1E1D]">Hak Istimewa Gold Member</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#1F1E1D]">Cashback 5% Poin Loyalitas</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Tiap belanja Rp10.000 otomatis mendapat 5 Poin (Rp500).</p>
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-2.5">
                <Gift className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#1F1E1D]">Voucher Ulang Tahun Gratis</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Klaim 1 cup Signature Drink di bulan ulang tahun Anda.</p>
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#1F1E1D]">Antrean Khusus Prioritas Barista</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Pesanan takeaway Anda didahulukan saat jam padat.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Redeem Rewards */}
      {activeTab === 'rewards' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="font-extrabold text-xs text-[#1F1E1D]">Katalog Penukaran Poin</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Potongan Tunai Kasir Rp10.000', cost: 100, desc: 'Tukarkan langsung saat membayar pesanan di kasir' },
              { name: 'Gratis 1 Croissant Butter', cost: 250, desc: 'Dapat ditukarkan dengan pastry segar hari ini' },
              { name: 'Gratis 1 Iced Caramel Macchiato', cost: 350, desc: 'Minuman signature ukuran reguler' },
              { name: 'Tumbler Eksklusif KOPIIN', cost: 1200, desc: 'Tumbler tahan dingin 12 jam edisi Young Space' },
            ].map((rew, i) => (
              <div key={i} className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-xs text-[#1F1E1D]">{rew.name}</h4>
                    <span className="font-mono font-extrabold text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                      {rew.cost} Poin
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">{rew.desc}</p>
                </div>
                <button
                  disabled={memberPoints < rew.cost}
                  onClick={() => showToast(`Voucher "${rew.name}" berhasil diklaim!`)}
                  className="mt-3 w-full py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                >
                  {memberPoints >= rew.cost ? 'Tukar Sekarang' : 'Poin Kurang'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Self Order */}
      {activeTab === 'order' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {selfOrderSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{selfOrderSuccess}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-xs text-[#1F1E1D]">Pesan Mandiri dari HP Anda</h3>
            <span className="text-[10px] text-stone-500 font-mono">{selectedItems.length} Dipilih</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {menuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleAddItem(item)}
                className="p-2.5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-[#4A2E1B] transition cursor-pointer flex flex-col justify-between"
              >
                <div className="aspect-4/3 rounded-xl overflow-hidden bg-stone-100 mb-2">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1F1E1D] line-clamp-1">{item.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono font-bold text-xs text-[#4A2E1B]">
                      Rp{item.price.toLocaleString('id-ID')}
                    </span>
                    <span className="w-5 h-5 rounded-md bg-[#4A2E1B] text-white flex items-center justify-center font-bold text-xs">
                      +
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedItems.length > 0 && (
            <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto">
              <button
                onClick={handleSelfOrderSubmit}
                className="w-full py-3.5 bg-[#4A2E1B] text-white rounded-2xl shadow-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Kirim Pesanan ({selectedItems.reduce((s, i) => s + i.quantity, 0)} Item) ke Barista</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Order History */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="font-extrabold text-xs text-[#1F1E1D]">Riwayat Pesanan Anda</h3>
          <div className="space-y-2">
            {myOrders.length === 0 ? (
              <p className="text-center text-xs text-stone-400 py-8">Belum ada riwayat pesanan.</p>
            ) : (
              myOrders.map((ord) => (
                <div key={ord.id} className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#4A2E1B]">{ord.order_number}</span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {new Date(ord.created_at).toLocaleDateString('id-ID')} • {ord.items.length} Menu
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#1F1E1D] block">
                      Rp{ord.total_amount.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
