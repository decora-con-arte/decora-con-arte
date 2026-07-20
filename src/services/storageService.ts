import { supabase } from './supabaseClient';

const BUCKET = 'products_img';

export const storageService = {
  upload: async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) throw new Error(`Error al subir imagen: ${error.message}`);

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return urlData.publicUrl;
  },

  remove: async (imageUrl: string): Promise<void> => {
    const baseUrl = supabase.storage.from(BUCKET).getPublicUrl('').data.publicUrl.replace(/\/?$/, '/');
    const path = imageUrl.replace(baseUrl, '');
    if (!path || path === imageUrl) return;

    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw new Error(`Error al eliminar imagen: ${error.message}`);
  },
};
