import React, { useState, useEffect, useRef } from 'react';
import { X, Coffee, Image, DollarSign, Percent, AlertTriangle, Check, Layers, Sparkles, Upload, Trash2 } from 'lucide-react';
import { MenuItem, Category } from '../../types/cafe';


interface ProductManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<MenuItem, 'id' | 'tenant_id' | 'margin_nominal' | 'margin_percent'>) => void;
  onUpdate?: (id: string, productData: Partial<MenuItem>) => void;
  initialProduct?: MenuItem | null;
  categories: Category[];
  onAddCategory?: (name: string) => void;
}

const PRESET_IMAGES = [
  { label: 'Espresso', url: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=500&auto=format&fit=crop&q=80' },
  { label: 'Latte Art', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80' },
  { label: 'Cappuccino', url: 'https://images.unsplash.com/photo-1572442388796-11668ba67e53?w=500&auto=format&fit=crop&q=80' },
  { label: 'Cold Brew', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80' },
  { label: 'Matcha Latte', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80' },
  { label: 'Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80' },
  { label: 'Cheesecake', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=80' },
];

export const ProductManagementModal: React.FC<ProductManagementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  initialProduct,
  categories,
  onAddCategory,
}) => {
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(25000);
  const [costPrice, setCostPrice] = useState<number>(10000);
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const [newCatName, setNewCatName] = useState('');
  const [showNewCatInput, setShowNewCatInput] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setCategoryId(initialProduct.category_id);
      setDescription(initialProduct.description);
      setPrice(initialProduct.price);
      setCostPrice(initialProduct.cost_price);
      setImageUrl(initialProduct.image_url);
      setIsAvailable(initialProduct.is_available);
    } else {
      setName('');
      setCategoryId(categories[0]?.id || '');
      setDescription('');
      setPrice(25000);
      setCostPrice(9000);
      setImageUrl(PRESET_IMAGES[1].url);
      setIsAvailable(true);
    }
  }, [initialProduct, categories, isOpen]);

  if (!isOpen) return null;

  // Real-time automatic margin calculation
  const marginNominal = Math.max(0, price - costPrice);
  const marginPercent = price > 0 ? Math.round((marginNominal / price) * 100 * 10) / 10 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && initialProduct && onUpdate) {
      onUpdate(initialProduct.id, {
        name: name.trim(),
        category_id: categoryId,
        description: description.trim(),
        price: Number(price),
        cost_price: Number(costPrice),
        image_url: imageUrl || PRESET_IMAGES[0].url,
        is_available: isAvailable,
      });
    } else {
      onSave({
        name: name.trim(),
        category_id: categoryId,
        description: description.trim(),
        price: Number(price),
        cost_price: Number(costPrice),
        image_url: imageUrl || PRESET_IMAGES[0].url,
        is_available: isAvailable,
        recipe: [],
      });
    }
    onClose();
  };

  const handleAddNewCategory = () => {
    if (!newCatName.trim() || !onAddCategory) return;
    onAddCategory(newCatName.trim());
    setNewCatName('');
    setShowNewCatInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E5DFD7] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DFD7] bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4A2E1B] text-white flex items-center justify-center shadow-xs">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1F1E1D]">
                {isEditing ? 'Edit Menu & Resep HPP' : 'Tambah Produk / Menu Baru'}
              </h3>
              <p className="text-xs text-stone-500">
                Sistem SaaS KOPIIN – Form kalkulasi otomatis harga modal dan margin keuntungan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Row 1: Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Nama Menu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kopi Susu Aren Gula Merah"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] outline-none text-[#1F1E1D] bg-[#FAF8F5]/50 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  Kategori <span className="text-red-500">*</span>
                </label>
                {onAddCategory && (
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(!showNewCatInput)}
                    className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 cursor-pointer"
                  >
                    {showNewCatInput ? 'Batal' : '+ Kategori Baru'}
                  </button>
                )}
              </div>

              {showNewCatInput ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Nama kategori..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#4A2E1B] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="px-3 py-2 bg-[#4A2E1B] text-white text-xs font-bold rounded-xl hover:bg-[#3D2616] cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] outline-none text-[#1F1E1D] bg-[#FAF8F5]/50 font-medium cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">Deskripsi Singkat</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi cita rasa, bahan baku utama, atau sajian panas/dingin..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] outline-none text-[#1F1E1D] bg-[#FAF8F5]/50 resize-none font-medium"
            />
          </div>

          {/* Pricing & Automatic Margin Card */}
          <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DFD7] pb-2">
              <span className="text-xs font-bold text-[#4A2E1B] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-700" />
                Struktur Harga & Kalkulator Margin Otomatis
              </span>
              <span className="text-[11px] font-mono font-bold text-stone-500">
                11% PPN & 5% Service Charge terhitung di Kasir
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Harga Modal / HPP (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-stone-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-stone-300 focus:border-[#4A2E1B] outline-none text-[#1F1E1D] bg-white"
                  />
                </div>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Biaya bahan baku per cup / porsi
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Harga Jual Menu (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-stone-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-stone-300 focus:border-[#4A2E1B] outline-none text-[#1F1E1D] bg-white"
                  />
                </div>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Harga tercantum pada menu & struk
                </span>
              </div>
            </div>

            {/* Live Margin Display */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  Margin Nominal (Keuntungan Bersih)
                </span>
                <span className="font-mono text-base font-extrabold text-[#15803D]">
                  Rp{marginNominal.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  Persentase Margin Laba
                </span>
                <span
                  className={`font-mono text-base font-extrabold ${
                    marginPercent >= 60
                      ? 'text-[#15803D]'
                      : marginPercent >= 35
                      ? 'text-amber-700'
                      : 'text-red-600'
                  }`}
                >
                  {marginPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Image Upload Selection - 100% Native Upload & Presets, No URL Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Upload Foto Menu Produk <span className="text-red-500">*</span>
            </label>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload Area / Active Preview */}
            <div className="flex flex-col sm:flex-row gap-3 items-center p-3 border-2 border-dashed border-stone-300 hover:border-[#4A2E1B] rounded-2xl bg-[#FAF8F5]/80 transition">
              {imageUrl ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-stone-300 shrink-0 group">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 bg-white text-stone-900 rounded-lg text-[10px] font-bold shadow-md cursor-pointer hover:bg-stone-100"
                    >
                      Ganti
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center text-stone-400 shrink-0">
                  <Image className="w-8 h-8 stroke-1 text-stone-400" />
                  <span className="text-[10px] mt-1 font-medium">Belum ada</span>
                </div>
              )}

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Foto dari Galeri / Kamera</span>
                  </button>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Mendukung format JPG, PNG, WEBP. Maks 5MB.
                  </p>
                </div>

                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-red-600 hover:text-red-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto Terpilih</span>
                  </button>
                )}
              </div>
            </div>

            {/* Presets Gallery as Quick Alternative */}
            <div className="mt-3">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                Atau Pilih Contoh Foto Siap Pakai:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition flex items-center gap-1.5 cursor-pointer ${
                      imageUrl === preset.url
                        ? 'bg-[#4A2E1B] text-white border-[#4A2E1B]'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <img src={preset.url} alt="" className="w-3.5 h-3.5 rounded object-cover" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* Availability & Minimum Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="flex items-center gap-3 p-3 bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl">
              <input
                type="checkbox"
                id="isAvailableToggle"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-[#4A2E1B] focus:ring-[#4A2E1B] cursor-pointer"
              />
              <label htmlFor="isAvailableToggle" className="cursor-pointer">
                <span className="block text-xs font-bold text-[#1F1E1D]">Status Tersedia</span>
                <span className="text-[10px] text-stone-500">
                  {isAvailable ? 'Menu dapat dipesan pelanggan' : 'Ditandai HABIS di POS & PWA'}
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5DFD7] bg-[#FAF8F5] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-800 hover:bg-stone-200/50 rounded-xl transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-white bg-[#4A2E1B] hover:bg-[#3D2616] rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? 'Simpan Perubahan' : 'Tambahkan Menu Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
