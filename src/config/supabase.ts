import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing. Check .env file.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// ─────────────────────────────────────────
// File upload helper
// ─────────────────────────────────────────
export const uploadVleDocument = async (
  file: File,
  vleId: string,
  fieldId: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const timestamp = Date.now();
    const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${vleId}/${timestamp}_${fieldId}_${sanitized}`;

    const { data, error } = await supabase.storage
      .from('vle-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get signed URL (valid for 1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('vle-documents')
      .createSignedUrl(data.path, 60 * 60 * 24 * 365);

    if (urlError || !urlData) {
      return { success: false, error: 'Failed to get URL' };
    }

    return { success: true, url: urlData.signedUrl };
  } catch (err: any) {
    console.error('Upload exception:', err);
    return { success: false, error: err.message || 'Upload failed' };
  }
};
