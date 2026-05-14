'use strict';
/**
 * supabaseStorage.js
 * ==================
 * Singleton Supabase client used ONLY for Storage operations.
 * Uses the service_role key so it can bypass Row Level Security
 * when writing files to buckets from the server.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL              = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lazily created — only instantiated when first used (avoids crash on boot if
// env vars are missing during local dev without Supabase Storage).
let _client = null;

function getStorageClient() {
  if (!_client) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'Supabase Storage is not configured. ' +
        'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
      );
    }
    _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

/**
 * Upload a file buffer to Supabase Storage.
 *
 * @param {string} bucket      - Storage bucket name (e.g. 'avatars')
 * @param {string} storagePath - Path inside bucket (e.g. 'user-42/avatar.jpg')
 * @param {Buffer} buffer      - File contents
 * @param {string} mimeType    - Content-Type (e.g. 'image/jpeg')
 * @returns {Promise<string>}  - Public URL of the uploaded file
 */
async function uploadFile(bucket, storagePath, buffer, mimeType) {
  const supabase = getStorageClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType:  mimeType,
      upsert:       true,   // overwrite if the same path is re-uploaded
    });

  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);

  // Build the public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage.
 *
 * @param {string} bucket      - Storage bucket name
 * @param {string} storagePath - Path inside bucket
 */
async function deleteFile(bucket, storagePath) {
  const supabase = getStorageClient();
  const { error } = await supabase.storage.from(bucket).remove([storagePath]);
  if (error) throw new Error(`Supabase Storage delete failed: ${error.message}`);
}

module.exports = { uploadFile, deleteFile };
