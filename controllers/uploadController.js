import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads/images');

/**
 * Save buffer to local disk and return URL (used when Cloudinary fails or is not configured).
 */
function saveLocalAndGetUrl(req) {
  console.log('\n📝 saveLocalAndGetUrl called');
  console.log('🔍 uploadDir:', uploadDir);
  console.log('📋 Buffer exists:', !!req.file.buffer);
  console.log('📊 Buffer size:', req.file.buffer?.length || 0, 'bytes');
  
  if (!fs.existsSync(uploadDir)) {
    console.log('📁 Creating upload directory:', uploadDir);
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const ext = path.extname(req.file.originalname) || '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
  const filepath = path.join(uploadDir, filename);
  
  console.log('💾 Attempting to write file:', filepath);
  
  try {
    fs.writeFileSync(filepath, req.file.buffer);
    const stats = fs.statSync(filepath);
    console.log('✅ File written successfully');
    console.log('📁 File size on disk:', stats.size, 'bytes');
    console.log('📍 File path:', filepath);
  } catch (writeErr) {
    console.error('❌ ERROR writing file:', writeErr.message);
    console.error('🔴 Stack:', writeErr.stack);
    throw writeErr;
  }
  
  const apiBase = process.env.API_BASE || `${req.protocol || 'http'}://${req.get('host') || 'localhost:5000'}`;
  const url = `${apiBase.replace(/\/$/, '')}/uploads/images/${filename}`;
  console.log('🔗 Generated URL:', url);
  console.log(''); // blank line for readability
  
  return { url, filename };
}

/**
 * Upload image - uses Cloudinary when configured, else (or on Cloudinary failure) saves locally. Returns URL for package coverImage.
 */
export const uploadPackageImage = async (req, res) => {
  try {
    console.log('📤 Upload request received');
    console.log('🔍 Cloudinary configured:', isCloudinaryConfigured());
    console.log('📁 req.file exists:', !!req.file);
    console.log('📋 req.file:', req.file ? { mimetype: req.file.mimetype, size: req.file.size, originalname: req.file.originalname } : 'NO FILE');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (isCloudinaryConfigured()) {
      try {
        const cloudinary = await getCloudinary();
        if (cloudinary) {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
            { folder: 'goelectriq/packages', resource_type: 'image' },
            (err, result) => (err ? reject(err) : resolve(result))
          );
          stream.end(req.file.buffer);
        });
        if (result?.secure_url) {
            return res.status(200).json({ success: true, url: result.secure_url, filename: result.public_id });
          }
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, using local save:', cloudErr?.message || cloudErr);
      }
    }

    const { url, filename } = saveLocalAndGetUrl(req);
    return res.status(200).json({ success: true, url, filename });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Upload failed. Check server logs.',
    });
  }
};
