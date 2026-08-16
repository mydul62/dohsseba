import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { sendResponse } from '../../utils/response.util';
import { AppError } from '../../middlewares/error.middleware';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary if credentials are standard
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('⚠️ Uploads dir creation notice:', e);
}

// ─── Helper function to resolve absolute HTTPS image URL ───────────────────────
const getPublicFileUrl = (req: Request, filename: string): string => {
  const envUrl = process.env.APP_URL || process.env.BACKEND_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    const cleanBase = envUrl.replace(/\/$/, '').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
    return `${cleanBase}/uploads/${filename}`;
  }

  const forwardedProto = req.headers['x-forwarded-proto'] as string;
  const isHttps = forwardedProto === 'https' || req.secure || process.env.NODE_ENV === 'production';
  const protocol = isHttps ? 'https' : (req.protocol || 'http');

  const forwardedHost = req.headers['x-forwarded-host'] as string;
  let host = forwardedHost || req.get('host') || 'localhost:5000';

  if ((host.includes('localhost') || host.includes('127.0.0.1')) && process.env.NODE_ENV === 'production') {
    const origin = req.headers.origin || req.headers.referer || process.env.CLIENT_URL;
    if (origin) {
      try {
        const parsedUrl = new URL(origin);
        return `${parsedUrl.protocol}//${parsedUrl.host}/uploads/${filename}`;
      } catch (_) {}
    }
  }

  return `${protocol}://${host}/uploads/${filename}`;
};

/**
 * Automatically compresses and converts image buffer to optimized WebP format.
 * Includes safe try-catch fallback to return original buffer if conversion fails.
 */
const optimizeImageBuffer = async (
  buffer: Buffer,
  originalMimetype: string
): Promise<{ buffer: Buffer; mimetype: string; extension: string }> => {
  try {
    // If image is GIF or SVG, retain original format
    if (originalMimetype.includes('gif') || originalMimetype.includes('svg')) {
      const ext = originalMimetype.split('/')[1] || 'jpg';
      return { buffer, mimetype: originalMimetype, extension: ext };
    }

    const compressedBuffer = await sharp(buffer)
      .resize({
        width: 1400,
        height: 1400,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    return {
      buffer: compressedBuffer,
      mimetype: 'image/webp',
      extension: 'webp',
    };
  } catch (err) {
    console.warn('⚠️ Sharp image compression skipped, using original buffer:', err);
    const ext = originalMimetype.split('/')[1] || 'jpg';
    return { buffer, mimetype: originalMimetype, extension: ext };
  }
};

export const uploadSingleImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file provided.', 400));
    }

    // Process & compress image to WebP format
    const { buffer: processedBuffer, mimetype, extension } = await optimizeImageBuffer(
      req.file.buffer,
      req.file.mimetype
    );

    // 1. Always save to Local Disk Storage (so Media Gallery reads it)
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, processedBuffer);
    let finalUrl = getPublicFileUrl(req, filename);

    // 2. If Cloudinary is configured, also upload to Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name') {
      try {
        const b64 = processedBuffer.toString('base64');
        const dataURI = `data:${mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'dohssheba',
        });
        if (result.secure_url) {
          finalUrl = result.secure_url;
        }
      } catch (cloudErr) {
        console.warn('⚠️ Cloudinary upload failed, using local disk URL:', cloudErr);
      }
    }

    return sendResponse(res, 200, 'Image processed successfully', {
      url: finalUrl,
      filename,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMultipleImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return next(new AppError('No image files provided.', 400));
    }

    const urls: string[] = [];

    for (const file of files) {
      const { buffer: processedBuffer, mimetype, extension } = await optimizeImageBuffer(
        file.buffer,
        file.mimetype
      );

      // Always save to disk so it appears in Media Gallery
      const filename = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, processedBuffer);
      let fileUrl = getPublicFileUrl(req, filename);

      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name') {
        try {
          const b64 = processedBuffer.toString('base64');
          const dataURI = `data:${mimetype};base64,${b64}`;
          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'dohssheba',
          });
          if (result.secure_url) {
            fileUrl = result.secure_url;
          }
        } catch (_) {}
      }

      urls.push(fileUrl);
    }

    return sendResponse(res, 200, 'Images uploaded successfully', { urls });
  } catch (error) {
    next(error);
  }
};

export const getMediaGallery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      return sendResponse(res, 200, 'Media gallery fetched', { total: 0, media: [] });
    }

    const files = fs.readdirSync(uploadsDir);
    const mediaList = files
      .filter((file) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
      .map((filename) => {
        const filepath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filepath);
        return {
          filename,
          url: getPublicFileUrl(req, filename),
          size: stats.size,
          mtime: stats.mtime,
        };
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return sendResponse(res, 200, 'Media gallery fetched successfully', {
      total: mediaList.length,
      media: mediaList,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMediaFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawFilename = String(req.params.filename || req.query.filename || '');
    if (!rawFilename) {
      return next(new AppError('Filename is required.', 400));
    }

    const safeFilename = path.basename(rawFilename);
    const filepath = path.join(uploadsDir, safeFilename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return sendResponse(res, 200, 'Image deleted successfully from server storage', { filename: safeFilename });
    } else {
      return next(new AppError('File not found on server.', 404));
    }
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteMediaFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filenames } = req.body;
    if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
      return next(new AppError('Array of filenames is required for bulk deletion.', 400));
    }

    let deletedCount = 0;
    for (const rawFilename of filenames) {
      const safeFilename = path.basename(rawFilename);
      const filepath = path.join(uploadsDir, safeFilename);
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
          deletedCount++;
        } catch (_) {}
      }
    }

    return sendResponse(res, 200, `Successfully deleted ${deletedCount} image(s) from server storage`, {
      deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

export const renameMediaFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { oldFilename, newFilename } = req.body;
    if (!oldFilename || !newFilename) {
      return next(new AppError('Both oldFilename and newFilename are required.', 400));
    }

    const safeOldName = path.basename(oldFilename);
    let safeNewName = path.basename(newFilename.trim());

    // Preserve original extension if missing
    const oldExt = path.extname(safeOldName);
    if (!path.extname(safeNewName) && oldExt) {
      safeNewName = `${safeNewName}${oldExt}`;
    }

    const oldPath = path.join(uploadsDir, safeOldName);
    const newPath = path.join(uploadsDir, safeNewName);

    if (!fs.existsSync(oldPath)) {
      return next(new AppError('Original file not found on server.', 404));
    }

    if (fs.existsSync(newPath) && safeOldName !== safeNewName) {
      return next(new AppError(`File with name "${safeNewName}" already exists. Please choose a different name.`, 400));
    }

    fs.renameSync(oldPath, newPath);

    const newUrl = getPublicFileUrl(req, safeNewName);
    return sendResponse(res, 200, 'Image renamed successfully', {
      oldFilename: safeOldName,
      newFilename: safeNewName,
      url: newUrl,
    });
  } catch (error) {
    next(error);
  }
};
