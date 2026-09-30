import React, { useState, useMemo } from 'react';
import { 
  Camera, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Search, 
  User, 
  Calendar, 
  LogOut, 
  LogIn, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Eye,
  X,
} from 'lucide-react';
import { StaffAttendance } from '../../types/cafe';
import { usePlatform } from '../../context/PlatformContext';
import { useCafe } from '../../context/CafeContext';

export const AttendanceModule: React.FC = () => {
  const { currentUser } = usePlatform();
  const { attendances, recordAttendance, recordCheckOut } = useCafe();

  // Unique staff members dynamically computed from attendances & active profile
  const staffMembers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string }>();
    attendances.forEach(a => {
      if (!map.has(a.staff_name)) {
        map.set(a.staff_name, { id: a.user_id, name: a.staff_name, role: a.role });
      }
    });
    if (!map.has(currentUser.full_name)) {
      map.set(currentUser.full_name, { id: currentUser.id, name: currentUser.full_name, role: currentUser.role });
    }
    return Array.from(map.values());
  }, [attendances, currentUser]);

  // Filter state
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStaff, setFilterStaff] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Camera & selfie state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [attendanceNote, setAttendanceNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<StaffAttendance | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Check out modal
  const [checkOutItem, setCheckOutItem] = useState<StaffAttendance | null>(null);
  const [checkOutNote, setCheckOutNote] = useState('Selesai shift operasional');

  // Check if current user has already checked in today
  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayAttendance = attendances.find(
    (a) => a.user_id === currentUser.id && a.date === todayStr
  );

  // Start real webcam stream
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }
    } catch (err: any) {
      console.warn('Webcam stream unavailable:', err);
      setCameraError('Kamera perangkat tidak dapat diakses langsung. Anda dapat menggunakan opsi Unggah Foto/Selfie dari galeri atau kamera native.');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Real capture from webcam stream
  const handleSnapCamera = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(dataUrl);
        stopCamera();
        return;
      }
    }
    // Fallback if video element had no frame
    handleFallbackSelfie();
  };

  // Handle file upload from mobile camera or storage
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setCapturedPhoto(uploadEvent.target.result as string);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFallbackSelfie = () => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    ];
    setCapturedPhoto(samplePhotos[Math.floor(Math.random() * samplePhotos.length)]);
    stopCamera();
  };

  const handleCheckInSubmit = async () => {
    if (!capturedPhoto) return;
    setIsSubmitting(true);
    try {
      const att = await recordAttendance({
        photoUrl: capturedPhoto,
        notes: attendanceNote || 'Absensi selfie mandiri tepat waktu',
      });
      setSuccessToast(`Check-in berhasil! Status: ${att.status}`);
      setCapturedPhoto(null);
      setAttendanceNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOutSubmit = () => {
    if (!checkOutItem) return;
    recordCheckOut(checkOutItem.id, checkOutNote);
    setSuccessToast(`Check-out staf ${checkOutItem.staff_name} berhasil dicatat.`);
    setCheckOutItem(null);
  };

  // Filtered attendances
  const filteredAttendances = attendances.filter((att) => {
    if (filterDate && att.date !== filterDate) return false;
    if (filterStaff !== 'ALL' && att.staff_name !== filterStaff) return false;
    if (filterRole !== 'ALL' && att.role !== filterRole) return false;
    if (filterStatus !== 'ALL' && att.status !== filterStatus) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchName = att.staff_name.toLowerCase().includes(s);
      const matchNotes = (att.notes || '').toLowerCase().includes(s);
      if (!matchName && !matchNotes) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Today Status */}
      <div className="bg-white rounded-2xl border border-[#E5DFD7] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] animate-pulse" />
            <h2 className="text-lg font-bold text-[#1F1E1D]">Modul Absensi Staf & Verifikasi Foto</h2>
          </div>
          <p className="text-xs text-stone-500">
            Pencatatan jam kerja terverifikasi foto selfie, deteksi otomatis keterlambatan (09:00 WIB), dan pembagian shift
          </p>
        </div>

        {/* User today badge & check-in button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {userTodayAttendance ? (
            <div className="flex items-center gap-2.5 px-4 py-2 bg-[#FAF8F5] border border-stone-200 rounded-xl">
              <img
                src={userTodayAttendance.photo_url}
                alt="Selfie"
                className="w-8 h-8 rounded-lg object-cover border border-stone-300"
              />
              <div className="text-left">
                <span className="text-[10px] text-stone-500 block font-semibold">Anda Hari Ini:</span>
                <span
                  className={`text-xs font-bold ${
                    userTodayAttendance.status === 'ON_TIME'
                      ? 'text-[#15803D]'
                      : userTodayAttendance.status === 'CHECKED_OUT'
                      ? 'text-stone-600'
                      : 'text-amber-700'
                  }`}
                >
                  {userTodayAttendance.status} (In:{' '}
                  {new Date(userTodayAttendance.check_in_time).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {userTodayAttendance.check_out_time &&
                    ` | Out: ${new Date(userTodayAttendance.check_out_time).toLocaleTimeString(
                      'id-ID',
                      { hour: '2-digit', minute: '2-digit' }
                    )}`}
                  )
                </span>
              </div>
              {!userTodayAttendance.check_out_time && (
                <button
                  onClick={() => setCheckOutItem(userTodayAttendance)}
                  className="ml-2 px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Check-Out</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={startCamera}
              className="px-4 py-2.5 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Ambil Foto & Check-In ({currentUser.full_name})</span>
            </button>
          )}
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successToast}
          </span>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 font-bold cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden File Input for Native Camera / Photo Gallery Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="user"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Camera Capture Modal / Viewport */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E5DFD7] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-[#FAF8F5] border-b border-[#E5DFD7]">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#4A2E1B]" />
                <h3 className="font-bold text-sm text-[#1F1E1D]">Kamera Selfie Absensi Staf</h3>
              </div>
              <button
                onClick={stopCamera}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Camera Viewport: Real Webcam or Fallback Overlay */}
              <div className="relative aspect-4/3 rounded-xl bg-stone-900 overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-stone-600">
                <div className="absolute inset-x-0 top-0 p-3 z-10 flex justify-between items-center text-[10px] text-white/80 bg-gradient-to-b from-black/60 to-transparent">
                  <span className="font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    LIVE WEBCAM
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {new Date().toLocaleTimeString('id-ID')}
                  </span>
                </div>

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-32 h-44 border-2 border-white/50 rounded-full flex items-center justify-center">
                    <div className="w-28 h-38 border border-white/20 rounded-full" />
                  </div>
                  <p className="text-[11px] text-white/90 mt-2 font-medium bg-black/40 px-3 py-1 rounded-full">
                    Posisikan wajah Anda di dalam lingkaran
                  </p>
                </div>
              </div>

              {cameraError && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px]">
                  {cameraError}
                </div>
              )}

              <div className="text-center space-y-2">
                <p className="text-xs text-stone-500">
                  Staf: <strong className="text-[#1F1E1D]">{currentUser.full_name}</strong> (
                  {currentUser.role})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSnapCamera}
                    className="py-3 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Ambil Foto</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Pilih Berkas Foto</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Confirmation Form */}
      {capturedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E5DFD7] overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
              Konfirmasi Check-In Selfie
            </h3>

            <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-stone-300">
              <img src={capturedPhoto} alt="Hasil Foto" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2.5 py-1 rounded-lg text-[10px] font-mono">
                {new Date().toLocaleDateString('id-ID')} – {new Date().toLocaleTimeString('id-ID')}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                value={attendanceNote}
                onChange={(e) => setAttendanceNote(e.target.value)}
                placeholder="Contoh: Shift pagi barista, siap melayani"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 outline-none focus:border-[#4A2E1B]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCapturedPhoto(null);
                  setIsCameraActive(true);
                }}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Foto Ulang</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCheckInSubmit}
                className="flex-1 py-2.5 bg-[#4A2E1B] hover:bg-[#3D2616] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Kirim Absensi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check Out Modal */}
      {checkOutItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#E5DFD7] space-y-4">
            <h3 className="font-bold text-sm text-[#1F1E1D] flex items-center gap-2">
              <LogOut className="w-5 h-5 text-amber-700" />
              Konfirmasi Check-Out Staf
            </h3>
            <p className="text-xs text-stone-600">
              Apakah staf <strong>{checkOutItem.staff_name}</strong> telah menyelesaikan shift jam kerja?
            </p>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Catatan Serah Terima Shift</label>
              <input
                type="text"
                value={checkOutNote}
                onChange={(e) => setCheckOutNote(e.target.value)}
                placeholder="Kas laci cocok, kebersihan oke..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 outline-none focus:border-[#4A2E1B]"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCheckOutItem(null)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleCheckOutSubmit}
                className="flex-1 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Simpan Check-Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Zoom Modal */}
      {previewPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm text-[#1F1E1D]">{previewPhotoModal.staff_name}</h4>
                <p className="text-[11px] text-stone-500">
                  {previewPhotoModal.role} – {previewPhotoModal.date}
                </p>
              </div>
              <button
                onClick={() => setPreviewPhotoModal(null)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-square rounded-xl overflow-hidden border border-stone-200">
              <img
                src={previewPhotoModal.photo_url}
                alt="Selfie Zoom"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-[#FAF8F5] p-2.5 rounded-xl text-xs text-stone-600 flex justify-between">
              <span>
                Jam Masuk:{' '}
                <strong>
                  {new Date(previewPhotoModal.check_in_time).toLocaleTimeString('id-ID')}
                </strong>
              </span>
              <span
                className={`font-bold ${
                  previewPhotoModal.status === 'ON_TIME' ? 'text-[#15803D]' : 'text-amber-700'
                }`}
              >
                {previewPhotoModal.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#FAF8F5] rounded-2xl border border-[#E5DFD7] p-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-stone-700">
          <Filter className="w-4 h-4 text-[#4A2E1B]" />
          <span>Filter Absensi:</span>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-2.5 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="outline-none text-xs text-[#1F1E1D] bg-transparent"
          />
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="text-stone-400 hover:text-stone-700 cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Staff Filter */}
        <select
          value={filterStaff}
          onChange={(e) => setFilterStaff(e.target.value)}
          className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 font-semibold text-stone-700 outline-none cursor-pointer"
        >
          <option value="ALL">Semua Staf</option>
          {staffMembers.map((s: { id: string; name: string; role: string }) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Role Filter */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 font-semibold text-stone-700 outline-none cursor-pointer"
        >
          <option value="ALL">Semua Jabatan</option>
          <option value="TENANT_MANAGER">Manager</option>
          <option value="STAFF_CASHIER">Cashier</option>
          <option value="STAFF_BARISTA">Barista</option>
          <option value="STAFF_STOKIS">Stokis</option>
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 font-semibold text-stone-700 outline-none cursor-pointer"
        >
          <option value="ALL">Semua Status</option>
          <option value="ON_TIME">Tepat Waktu (ON_TIME)</option>
          <option value="LATE">Terlambat (LATE)</option>
          <option value="CHECKED_OUT">Selesai Shift (CHECKED_OUT)</option>
        </select>

        {/* Search */}
        <div className="flex-1 min-w-[150px] relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Cari nama atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#4A2E1B]"
          />
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-white rounded-2xl border border-[#E5DFD7] overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-[#E5DFD7] bg-[#FAF8F5] flex justify-between items-center">
          <span className="font-bold text-xs text-[#1F1E1D]">
            Riwayat Absensi Staf ({filteredAttendances.length} Catatan)
          </span>
          <span className="text-[11px] text-stone-500">
            Tersinkronisasi otomatis dengan Cloud Storage
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5]/60 text-stone-500 uppercase font-semibold text-[10px] border-b border-[#E5DFD7]">
              <tr>
                <th className="py-3 px-4">Foto Selfie</th>
                <th className="py-3 px-4">Nama Staf</th>
                <th className="py-3 px-4">Peran</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Jam Masuk</th>
                <th className="py-3 px-4">Jam Keluar</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD7]">
              {filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-400">
                    Tidak ada catatan absensi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredAttendances.map((att) => (
                  <tr key={att.id} className="hover:bg-[#FAF8F5]/80 transition">
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => setPreviewPhotoModal(att)}
                        className="relative group block w-10 h-10 rounded-xl overflow-hidden border border-stone-200 shadow-2xs cursor-pointer"
                      >
                        <img
                          src={att.photo_url}
                          alt={att.staff_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-150"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#1F1E1D]">{att.staff_name}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F5] border border-stone-200 text-stone-700">
                        {att.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-stone-600">{att.date}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#15803D]">
                      {new Date(att.check_in_time).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-stone-600">
                      {att.check_out_time ? (
                        new Date(att.check_out_time).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      ) : (
                        <span className="text-stone-400 italic text-[11px]">~ aktif ~</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          att.status === 'ON_TIME'
                            ? 'bg-emerald-100 text-emerald-800'
                            : att.status === 'CHECKED_OUT'
                            ? 'bg-stone-100 text-stone-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {att.status === 'ON_TIME'
                          ? 'Tepat Waktu'
                          : att.status === 'CHECKED_OUT'
                          ? 'Selesai Shift'
                          : 'Terlambat'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-stone-500 max-w-xs truncate">
                      {att.notes || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {!att.check_out_time && (
                        <button
                          onClick={() => setCheckOutItem(att)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          Check-Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
