import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import { usePlatform } from '../../context/PlatformContext';
import { 
  Boxes, 
  Plus, 
  Minus,
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Search, 
  FileText, 
  Truck, 
  Filter,
  X,
  Warehouse,
  Layers,
  ArrowRightLeft,
  RotateCcw
} from 'lucide-react';

interface Props {
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export type StokisTab = 'warehouse' | 'inventory' | 'opname' | 'po' | 'suppliers';

export const StaffStokisView: React.FC<Props> = ({ showToast }) => {
  const {
    inventory,
    stockMovements,
    purchaseOrders,
    suppliers,
    warehouses,
    warehouseMaterials,
    addWarehouseLocation,
    addWarehouseMaterial,
    adjustWarehouseStock,
    recordStockOpname,
    createPurchaseOrder,
  } = useCafe();
  const { currentUser } = usePlatform();

  const [activeTab, setActiveTab] = useState<StokisTab>('warehouse');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('ALL');

  // Stock Opname Modal
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState('');
  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [opnameNotes, setOpnameNotes] = useState('');

  // Warehouse Modals State
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [newWarehouseType, setNewWarehouseType] = useState<'CENTRAL' | 'CHILLER' | 'DRY_STORAGE' | 'BAR_COUNTER'>('DRY_STORAGE');
  const [newWarehouseDesc, setNewWarehouseDesc] = useState('');

  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatCategory, setNewMatCategory] = useState('Biji Kopi');
  const [newMatWarehouseId, setNewMatWarehouseId] = useState('');
  const [newMatStock, setNewMatStock] = useState<number>(10);
  const [newMatMinStock, setNewMatMinStock] = useState<number>(3);
  const [newMatUnit, setNewMatUnit] = useState('kg');
  const [newMatCost, setNewMatCost] = useState<number>(150000);

  // Quick Stock Adjustment Modal
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [adjustingMaterial, setAdjustingMaterial] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(5);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustReason, setAdjustReason] = useState('Restock dari supplier roastery');

  const lowStockItems = inventory.filter((i) => i.status === 'LOW_STOCK');

  const handleOpnameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvId) return;
    recordStockOpname(selectedInvId, Number(physicalCount), opnameNotes);
    showToast('Hasil stock opname fisik berhasil disinkronkan!');
    setShowOpnameModal(false);
    setSelectedInvId('');
    setPhysicalCount(0);
    setOpnameNotes('');
  };

  const handleAddWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouseName.trim()) return;
    addWarehouseLocation(newWarehouseName.trim(), newWarehouseType, newWarehouseDesc);
    showToast(`Lokasi gudang "${newWarehouseName.trim()}" berhasil ditambahkan!`);
    setShowAddWarehouseModal(false);
    setNewWarehouseName('');
    setNewWarehouseDesc('');
  };

  const handleAddMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;
    const targetLocId = newMatWarehouseId || (warehouses[0]?.id ?? 'loc-1');
    addWarehouseMaterial({
      location_id: targetLocId,
      name: newMatName.trim(),
      category: newMatCategory,
      current_stock: Number(newMatStock),
      minimum_stock: Number(newMatMinStock),
      unit: newMatUnit,
      cost_per_unit: Number(newMatCost),
    });
    showToast(`Bahan baku "${newMatName.trim()}" berhasil disimpan di gudang!`);
    setShowAddMaterialModal(false);
    setNewMatName('');
    setNewMatStock(10);
    setNewMatMinStock(3);
    setNewMatCost(150000);
  };

  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingMaterial || adjustAmount <= 0) return;
    const delta = adjustType === 'IN' ? adjustAmount : -adjustAmount;
    adjustWarehouseStock(adjustingMaterial.id, delta, adjustReason);
    showToast(
      `Stok ${adjustingMaterial.name} berhasil ${adjustType === 'IN' ? 'ditambah' : 'dikurangi'} ${adjustAmount} ${adjustingMaterial.unit}!`,
      'success'
    );
    setShowAdjustStockModal(false);
    setAdjustingMaterial(null);
  };

  const filteredWarehouseMaterials = warehouseMaterials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse =
      selectedWarehouseId === 'ALL' || (m.warehouse_location_id || (m as any).location_id) === selectedWarehouseId;
    return matchesSearch && matchesWarehouse;
  });

  const totalRawMaterialValue = warehouseMaterials.reduce(
    (sum: number, m: any) => sum + m.current_stock * m.cost_per_unit,
    0
  );


  const filteredInventory = inventory.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] pb-24">
      {/* Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-4 rounded-2xl mb-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-xs">
              S
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">Gudang & Logistik</span>
              <h2 className="text-sm font-extrabold text-white leading-tight">Pengawasan Stok Bahan Baku</h2>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
            Staf Stokis
          </span>
        </div>
        <p className="text-xs text-stone-300 leading-snug">
          Petugas: <strong className="text-white">{currentUser.full_name}</strong>. Kelola persediaan biji kopi, susu segar, sirup, kemasan cup, dan rekonsiliasi stock opname berkala.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-stone-100 rounded-xl mb-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('warehouse')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'warehouse' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span className="text-[10px]">Gudang Bahan</span>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'inventory' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span className="text-[10px]">Semua Stok</span>
        </button>
        <button
          onClick={() => setActiveTab('opname')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'opname' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-[10px]">Stock Opname</span>
        </button>
        <button
          onClick={() => setActiveTab('po')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'po' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-[10px]">PO Supplier</span>
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`py-2 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'suppliers' ? 'bg-white text-[#4A2E1B] shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span className="text-[10px]">Supplier</span>
        </button>
      </div>

      {/* Tab 0: Gudang Bahan Baku */}
      {activeTab === 'warehouse' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-[10px] text-stone-500 block mb-0.5">Lokasi Gudang</span>
              <span className="text-lg font-black text-[#4A2E1B]">{warehouses.length} Area</span>
              <span className="block text-[9px] text-stone-400">Dry, Chiller, Bar</span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-[10px] text-stone-500 block mb-0.5">Bahan Terdata</span>
              <span className="text-lg font-black text-[#4A2E1B]">{warehouseMaterials.length} SKU</span>
              <span className="block text-[9px] text-stone-400">Biji, Susu, Sirup, Cup</span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <span className="text-[10px] text-stone-500 block mb-0.5">Nilai Valuasi</span>
              <span className="text-sm font-black text-emerald-700 font-mono truncate block">
                Rp{(totalRawMaterialValue / 1000).toFixed(0)}k
              </span>
              <span className="block text-[9px] text-stone-400">Total Aset Fisik</span>
            </div>
          </div>

          {/* Warehouse Location Filter & Add Button */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => setSelectedWarehouseId('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedWarehouseId === 'ALL'
                    ? 'bg-[#4A2E1B] text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                Semua Gudang
              </button>
              {warehouses.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWarehouseId(w.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedWarehouseId === w.id
                      ? 'bg-[#4A2E1B] text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span>{w.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddWarehouseModal(true)}
              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lokasi Baru</span>
            </button>
          </div>

          {/* Action Row: Search & Add Material */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Cari bahan baku (e.g. Arabika, Susu, Sirup)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-stone-200 text-xs outline-none focus:border-[#4A2E1B]"
              />
            </div>
            <button
              onClick={() => setShowAddMaterialModal(true)}
              className="px-3 py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Bahan Baku</span>
            </button>
          </div>

          {/* Material Cards List */}
          <div className="space-y-2.5">
            {filteredWarehouseMaterials.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
                <Warehouse className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-500 font-bold">Tidak ada bahan baku yang cocok.</p>
                <p className="text-[11px] text-stone-400">Tambahkan bahan baru dengan tombol "+ Bahan Baku".</p>
              </div>
            ) : (
              filteredWarehouseMaterials.map((mat) => {
                const isLow = mat.current_stock <= mat.minimum_stock;
                const loc = warehouses.find((w) => w.id === (mat.warehouse_location_id || (mat as any).location_id));
                const totalValue = mat.current_stock * mat.cost_per_unit;

                return (
                  <div
                    key={mat.id}
                    className={`p-3.5 rounded-2xl border transition bg-white shadow-xs ${
                      isLow ? 'border-red-300 ring-1 ring-red-100' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-[#1F1E1D]">{mat.name}</h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                            {mat.category}
                          </span>
                          {isLow && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                              Stok Menipis
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1">
                          <Warehouse className="w-3 h-3 text-stone-400" />
                          <span>{loc?.name || 'Gudang Utama'}</span> • HPP: Rp{mat.cost_per_unit.toLocaleString('id-ID')}/{mat.unit}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono font-black text-sm ${
                            isLow ? 'text-red-600' : 'text-[#1F1E1D]'
                          }`}
                        >
                          {mat.current_stock} {mat.unit}
                        </span>
                        <span className="block text-[9px] text-stone-400 font-medium">
                          Batas Min: {mat.minimum_stock} {mat.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-stone-100 text-xs">
                      <span className="text-[11px] font-mono text-stone-500">
                        Total Nilai: <strong className="text-stone-800">Rp{totalValue.toLocaleString('id-ID')}</strong>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setAdjustingMaterial(mat);
                            setAdjustType('IN');
                            setAdjustAmount(5);
                            setAdjustReason('Restock kiriman supplier');
                            setShowAdjustStockModal(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Masuk</span>
                        </button>
                        <button
                          onClick={() => {
                            setAdjustingMaterial(mat);
                            setAdjustType('OUT');
                            setAdjustAmount(1);
                            setAdjustReason('Pemakaian ekstra / kalibrasi');
                            setShowAdjustStockModal(true);
                          }}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Minus className="w-3 h-3" />
                          <span>- Keluar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}


      {/* Tab 1: Inventory List */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Cari SKU atau nama bahan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-stone-200 text-xs outline-none"
              />
            </div>
            <button
              onClick={() => setShowOpnameModal(true)}
              className="px-3.5 py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Input Opname</span>
            </button>
          </div>

          {lowStockItems.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                <strong>{lowStockItems.length} Bahan Baku Kritis:</strong> Segera laporkan ke Manager untuk dibuatkan PO.
              </span>
            </div>
          )}

          <div className="space-y-2.5">
            {filteredInventory.map((item) => {
              const isLow = item.current_stock <= item.minimum_stock;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                    isLow ? 'bg-red-50/50 border-red-200' : 'bg-white border-stone-200 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-[#1F1E1D]">{item.name}</h4>
                      <span className="text-[10px] text-stone-400 font-mono">({item.sku})</span>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Kategori: {item.category} • Biaya Pokok: Rp{((item as any).cost_per_unit || item.average_cost || 0).toLocaleString('id-ID')}/{item.unit}
                    </p>

                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-mono font-extrabold ${
                        isLow ? 'text-red-600' : 'text-[#1F1E1D]'
                      }`}
                    >
                      {item.current_stock} {item.unit}
                    </span>
                    <span className="block text-[10px] text-stone-400 font-medium">
                      Batas Min: {item.minimum_stock} {item.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Stock Opname History */}
      {activeTab === 'opname' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-[#1F1E1D]">Riwayat Mutasi & Opname Stok</h3>
            <button
              onClick={() => setShowOpnameModal(true)}
              className="px-3 py-1.5 bg-[#4A2E1B] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              + Rekonsiliasi Baru
            </button>
          </div>

          <div className="space-y-2">
            {stockMovements.map((sm) => (
              <div
                key={sm.id}
                className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-[#1F1E1D]">{sm.type}</span>
                  <p className="text-[10px] text-stone-500 mt-0.5 font-mono">{(sm as any).notes || sm.reference_note || 'Opname fisik'}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono font-bold ${
                      sm.quantity >= 0 ? 'text-[#15803D]' : 'text-red-600'
                    }`}
                  >
                    {sm.quantity >= 0 ? '+' : ''}{sm.quantity}
                  </span>
                  <span className="block text-[10px] text-stone-400 font-mono">
                    {new Date((sm as any).created_at || sm.timestamp || Date.now()).toLocaleTimeString('id-ID')}
                  </span>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Purchase Orders */}
      {activeTab === 'po' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-[#1F1E1D]">Purchase Order Bahan Masuk</h3>
            <span className="text-[10px] font-mono text-stone-500">{purchaseOrders.length} Dokumen PO</span>
          </div>

          <div className="space-y-2.5">
            {purchaseOrders.map((po) => (
              <div
                key={po.id}
                className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-[#4A2E1B]">{po.po_number}</span>
                  <p className="font-bold text-[#1F1E1D] mt-0.5">{po.supplier_name}</p>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Total: Rp{po.total_cost.toLocaleString('id-ID')}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  {po.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Suppliers */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h3 className="font-extrabold text-xs text-[#1F1E1D]">Daftar Pemasok Resmi Café</h3>
          <div className="space-y-2.5">
            {suppliers.map((sup) => (
              <div
                key={sup.id}
                className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-xs text-[#1F1E1D]">{sup.name}</h4>
                  <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                    Kontak: {sup.contact_person} ({sup.phone})
                  </p>
                </div>
                <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded font-mono">
                  {(sup as any).lead_time_days || 2} Hari Pengiriman
                </span>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Opname Modal */}
      {showOpnameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="font-bold text-sm text-[#1F1E1D]">Input Stock Opname Fisik</h3>
              <button onClick={() => setShowOpnameModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpnameSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Pilih Item Bahan Baku *</label>
                <select
                  required
                  value={selectedInvId}
                  onChange={(e) => setSelectedInvId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white outline-none"
                >
                  <option value="">-- Pilih SKU Bahan --</option>
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} (Sistem: {inv.current_stock} {inv.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Jumlah Fisik Riil Terhitung *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono font-bold text-sm outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Catatan Selisih (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Tumpah saat kalibrasi mesin grinder..."
                  value={opnameNotes}
                  onChange={(e) => setOpnameNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowOpnameModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Opname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1: Tambah Lokasi Gudang */}
      {showAddWarehouseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1F1E1D]">Tambah Lokasi Gudang</h3>
                  <p className="text-[10px] text-stone-500">Area penyimpanan stok café</p>
                </div>
              </div>
              <button onClick={() => setShowAddWarehouseModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWarehouseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Nama Area Gudang *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chiller Susu & Dairy, Gudang Kering Roastery"
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Tipe / Karakteristik Ruangan *</label>
                <select
                  value={newWarehouseType}
                  onChange={(e) => setNewWarehouseType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white outline-none"
                >
                  <option value="DRY_STORAGE">Gudang Kering (Biji Kopi, Bubuk, Sirup)</option>
                  <option value="CHILLER">Chiller / Kulkas Pendingin (Susu, Fresh Juice)</option>
                  <option value="CENTRAL">Gudang Utama Sentral</option>
                  <option value="BAR_COUNTER">Counter Barista (Stok Aktif Shift)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Keterangan / Deskripsi Lokasi</label>
                <input
                  type="text"
                  placeholder="e.g. Rak A2 suhu 4-8°C, lemari kunci stok mahal"
                  value={newWarehouseDesc}
                  onChange={(e) => setNewWarehouseDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddWarehouseModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Lokasi Gudang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Tambah Bahan Baku Baru */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1F1E1D]">Tambah Bahan Baku Baru</h3>
                  <p className="text-[10px] text-stone-500">Daftarkan bahan baku ke inventaris gudang</p>
                </div>
              </div>
              <button onClick={() => setShowAddMaterialModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMaterialSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Nama Bahan Baku *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biji Kopi Full Wash Aceh Gayo, Sirup Hazelnut 750ml"
                  value={newMatName}
                  onChange={(e) => setNewMatName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Kategori Bahan *</label>
                  <select
                    value={newMatCategory}
                    onChange={(e) => setNewMatCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white outline-none cursor-pointer"
                  >
                    <option value="Biji Kopi">Biji Kopi (Coffee Beans)</option>
                    <option value="Susu & Dairy">Susu & Dairy (Fresh Milk/Oat)</option>
                    <option value="Sirup & Flavor">Sirup & Flavouring</option>
                    <option value="Kemasan & Cup">Kemasan Cup & Paper Bag</option>
                    <option value="Topping & Powder">Topping & Powder</option>
                    <option value="Bahan Dapur">Bahan Dapur & Pastry</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Lokasi Gudang Simpan *</label>
                  <select
                    value={newMatWarehouseId}
                    onChange={(e) => setNewMatWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white outline-none cursor-pointer"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Stok Awal *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min="0"
                    value={newMatStock}
                    onChange={(e) => setNewMatStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Ambang Min *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min="1"
                    value={newMatMinStock}
                    onChange={(e) => setNewMatMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Satuan Ukur *</label>
                  <select
                    value={newMatUnit}
                    onChange={(e) => setNewMatUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white outline-none cursor-pointer"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="gr">gr (Gram)</option>
                    <option value="liter">liter</option>
                    <option value="ml">ml (Mililiter)</option>
                    <option value="botol">botol</option>
                    <option value="pcs">pcs</option>
                    <option value="box">box</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Harga Beli / HPP per Satuan (Rp) *</label>
                <input
                  type="number"
                  step="500"
                  required
                  min="0"
                  value={newMatCost}
                  onChange={(e) => setNewMatCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono font-bold outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Bahan Baku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Penyesuaian Stok Cepat (+ Masuk / - Keluar) */}
      {showAdjustStockModal && adjustingMaterial && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    adjustType === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {adjustType === 'IN' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1F1E1D]">
                    {adjustType === 'IN' ? 'Stok Masuk (Restock)' : 'Stok Keluar (Pemakaian/Spill)'}
                  </h3>
                  <p className="text-[10px] text-stone-500 font-bold">{adjustingMaterial.name}</p>
                </div>
              </div>
              <button onClick={() => setShowAdjustStockModal(false)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStockSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center">
                <span className="text-stone-600">Stok Saat Ini:</span>
                <span className="font-mono font-bold text-sm text-[#1F1E1D]">
                  {adjustingMaterial.current_stock} {adjustingMaterial.unit}
                </span>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Jumlah {adjustType === 'IN' ? 'Masuk' : 'Keluar'} ({adjustingMaterial.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min="0.1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono font-bold text-sm outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Alasan / Catatan Penyesuaian</label>
                <input
                  type="text"
                  placeholder="e.g. Kiriman dari roastery / Rusak saat kemasan pecah"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustStockModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer ${
                    adjustType === 'IN' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Simpan Perubahan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
