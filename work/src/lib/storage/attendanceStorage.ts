/**
 * KOPIIN – Supabase Storage & Media Service
 * Handles uploading staff selfie photos to Supabase Storage bucket ('staff-attendance').
 * - When Supabase Storage is configured, uploads directly to the 'staff-attendance' bucket.
 * - When in Sandbox/Preview without live bucket permissions, converts base64/Blob to persistent ObjectURL/data URL with Supabase metadata schema.
 * - Simulates realistic storage paths: `attendance/{tenant_id}/{staff_id}/{timestamp}_{filename}.jpg`
 */

import { getSupabaseClient } from '../supabase/client';

export interface UploadResult {
  url: string;
  path: string;
  storageProvider: 'SUPABASE_STORAGE' | 'LOCAL_PERSISTENT_BLOB';
  uploadedAt: string;
}

export async function uploadAttendancePhoto(
  tenantId: string,
  staffId: string,
  photoDataUrl: string
): Promise<UploadResult> {
  const timestamp = Date.now();
  const fileName = `${timestamp}_selfie.jpg`;
  const storagePath = `attendance/${tenantId}/${staffId}/${fileName}`;
  const nowIso = new Date().toISOString();

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Convert base64 data URL to Blob
      const base64Data = photoDataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Upload to 'staff-attendance' bucket
      const { data, error } = await supabase.storage
        .from('staff-attendance')
        .upload(storagePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (!error && data) {
        // Retrieve public URL
        const { data: publicUrlData } = supabase.storage
          .from('staff-attendance')
          .getPublicUrl(storagePath);

        return {
          url: publicUrlData.publicUrl,
          path: storagePath,
          storageProvider: 'SUPABASE_STORAGE',
          uploadedAt: nowIso,
        };
      }
      console.warn('Supabase storage upload fallback to local Blob:', error?.message);
    } catch (err) {
      console.warn('Supabase storage upload error, fallback to persistent data storage:', err);
    }
  }

  // Fallback to local persistent base64/data URL with Supabase metadata path
  return {
    url: photoDataUrl,
    path: storagePath,
    storageProvider: 'LOCAL_PERSISTENT_BLOB',
    uploadedAt: nowIso,
  };
}
