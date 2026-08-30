/* ---------------------------------------------------------------------------
   storageApi.js — image uploads to Firebase Storage.

   Every upload is downscaled client-side first (long edge 1400px, JPEG 0.82).
   That keeps Firestore docs small, the gallery fast on 4G in Raipur, and the
   Storage bill sane. Demo mode returns a data URL so the admin preview works
   without a bucket.
--------------------------------------------------------------------------- */
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isDemo } from './firebase.js';

export const MAX_UPLOAD_MB = 12;

export async function compressImage(file, { maxEdge = 1400, quality = 0.82, type = 'image/jpeg' } = {}) {
  if (!file?.type?.startsWith('image/')) throw new Error('Only image files can be uploaded.');
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    throw new Error(`That image is ${(file.size / 1048576).toFixed(1)} MB — the limit is ${MAX_UPLOAD_MB} MB.`);
  }

  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read that image file.'));
      el.src = bitmapUrl;
    });

    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob) throw new Error('Image processing failed.');
    return { blob, width: w, height: h, type };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

const safeName = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });

/**
 * @param {File}   file     image picked by the admin
 * @param {string} folder   'menu' | 'gallery' | 'ambience'
 * @param {string} baseName file stem, usually the item id
 * @returns {Promise<{url:string, path:string|null, width:number, height:number}>}
 */
export async function uploadImage(file, folder = 'gallery', baseName = `img-${Date.now()}`) {
  const { blob, width, height } = await compressImage(file);
  const ext = 'jpg';
  const fileName = `${safeName(baseName)}-${Date.now().toString(36)}.${ext}`;
  const path = `${folder}/${fileName}`;

  if (isDemo) {
    // No bucket configured — keep the compressed bytes inline so the UI works.
    return { url: await blobToDataUrl(blob), path: null, width, height, demo: true };
  }

  const target = storageRef(storage, path);
  await uploadBytes(target, blob, { contentType: 'image/jpeg' });
  return { url: await getDownloadURL(target), path, width, height };
}

export async function deleteStoredImage(path) {
  if (isDemo || !path || path.startsWith('data:')) return true;
  try {
    await deleteObject(storageRef(storage, path));
    return true;
  } catch (err) {
    console.warn('[storage] delete failed', err?.code || err?.message);
    return false;
  }
}
