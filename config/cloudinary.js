// Cloudinary config – optional: server starts even if package is not installed
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = () => !!(cloudName && apiKey && apiSecret);

let cloudinaryInstance = null;

async function getCloudinary() {
  if (cloudinaryInstance) return cloudinaryInstance;
  try {
    const { v2 } = await import('cloudinary');
    v2.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    cloudinaryInstance = v2;
    return v2;
  } catch (e) {
    console.warn('Cloudinary not available (run: npm install cloudinary):', e?.message);
    return null;
  }
}

export { getCloudinary };
