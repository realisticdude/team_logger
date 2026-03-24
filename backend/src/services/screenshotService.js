import { supabase } from '../config/supabase.js';

export const uploadToStorage = async (userId, buffer, mimetype) => {
  const bucket = process.env.SUPABASE_BUCKET || 'screenshots';
  const ext = mimetype === 'image/png' ? 'png' : mimetype === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, { contentType: mimetype, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
};

export const saveMetadata = async (userId, imageUrl, timestamp) => {
  const { data, error } = await supabase.from('screenshots').insert({ user_id: userId, image_url: imageUrl, created_at: timestamp }).select('id,user_id,image_url,timestamp:created_at').single();
  if (error) throw error;
  return data;
};

export const listScreenshotsByUser = async (userId, days = 7) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('screenshots').select('id,user_id,image_url,timestamp:created_at').eq('user_id', userId).gte('created_at', since).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const deleteOldScreenshots = async (days = 7) => {
  const bucket = process.env.SUPABASE_BUCKET || 'screenshots';
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('screenshots').select('id,user_id,image_url,timestamp:created_at,storage_path').lt('created_at', cutoff);
  if (error) throw error;
  for (const s of data) {
    if (s.storage_path) {
      await supabase.storage.from(bucket).remove([s.storage_path]);
    }
    await supabase.from('screenshots').delete().eq('id', s.id);
  }
  return data.length;
};
