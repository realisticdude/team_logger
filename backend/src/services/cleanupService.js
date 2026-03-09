import { supabase } from '../config/supabase.js';

const BUCKET_NAME = 'screenshots';

export const cleanupOldScreenshots = async () => {
  console.log('Running screenshot cleanup job...');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 1. Find old screenshots
  const { data: oldScreenshots, error: selectError } = await supabase
    .from('screenshots')
    .select('id, image_url')
    .lt('created_at', sevenDaysAgo.toISOString());

  if (selectError) {
    console.error('Error fetching old screenshots:', selectError.message);
    return;
  }

  if (!oldScreenshots || oldScreenshots.length === 0) {
    console.log('No old screenshots to delete.');
    return;
  }

  // 2. Extract file paths and delete from storage
  const filePaths = oldScreenshots.map(s => {
    try {
      const url = new URL(s.image_url);
      // The path is the part after the bucket name
      return url.pathname.split(`/${BUCKET_NAME}/`)[1];
    } catch (e) {
      console.error(`Invalid image_url format: ${s.image_url}`);
      return null;
    }
  }).filter(Boolean);

  if (filePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (storageError) {
      console.error('Error deleting from Supabase storage:', storageError.message);
      // We will still proceed to delete DB records, as some files might have been deleted
    }
  }

  // 3. Delete records from the database
  const idsToDelete = oldScreenshots.map(s => s.id);
  const { error: deleteError } = await supabase
    .from('screenshots')
    .delete()
    .in('id', idsToDelete);

  if (deleteError) {
    console.error('Error deleting from database:', deleteError.message);
    return;
  }

  console.log(`Successfully deleted ${oldScreenshots.length} old screenshots.`);
};