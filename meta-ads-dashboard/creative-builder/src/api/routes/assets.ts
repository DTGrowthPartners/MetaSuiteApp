// ===========================================
// META CREATIVE BUILDER - Assets API Routes
// ===========================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

const router = Router();
const prisma = new PrismaClient();

// ===========================================
// Multer Configuration
// ===========================================

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${allowedMimeTypes.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  }
});

// ===========================================
// Validation Schemas
// ===========================================

const CreateAssetSchema = z.object({
  clientId: z.string().optional(),
  name: z.string().optional(),
  externalUrl: z.string().url().optional()
});

// ===========================================
// Helper Functions
// ===========================================

function getAssetType(mimeType: string): 'VIDEO' | 'IMAGE' {
  return mimeType.startsWith('video/') ? 'VIDEO' : 'IMAGE';
}

function ensureUploadDir(): string {
  const uploadDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

async function saveFileToDisk(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ path: string; url: string }> {
  const uploadDir = ensureUploadDir();
  const ext = extname(originalName) || `.${mimeType.split('/')[1]}`;
  const filename = `${uuidv4()}${ext}`;
  const filePath = join(uploadDir, filename);

  writeFileSync(filePath, buffer);

  // In production, this would be an S3 URL or similar
  const url = `${config.server.baseUrl || 'http://localhost:3003'}/uploads/${filename}`;

  return { path: filePath, url };
}

// ===========================================
// Routes
// ===========================================

/**
 * POST /api/assets
 * Upload a new asset (video or image)
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const bodyData = CreateAssetSchema.parse(req.body);

    let fileUrl: string;
    let fileType: 'VIDEO' | 'IMAGE';
    let fileSizeBytes: number;
    let mimeType: string;
    let originalName: string;
    let storagePath: string | null = null;

    // Handle file upload or external URL
    if (req.file) {
      // File was uploaded
      const { path, url } = await saveFileToDisk(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      fileUrl = url;
      storagePath = path;
      fileType = getAssetType(req.file.mimetype);
      fileSizeBytes = req.file.size;
      mimeType = req.file.mimetype;
      originalName = req.file.originalname;

      logger.info('File uploaded', {
        filename: originalName,
        size: fileSizeBytes,
        type: fileType
      });
    } else if (bodyData.externalUrl) {
      // External URL provided
      fileUrl = bodyData.externalUrl;
      fileType = bodyData.externalUrl.match(/\.(mp4|mov|webm)$/i) ? 'VIDEO' : 'IMAGE';
      fileSizeBytes = 0; // Unknown for external URLs
      mimeType = fileType === 'VIDEO' ? 'video/mp4' : 'image/jpeg';
      originalName = bodyData.externalUrl.split('/').pop() || 'external_asset';

      logger.info('External URL registered', { url: fileUrl, type: fileType });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either file upload or externalUrl is required'
      });
    }

    // Create asset record
    const asset = await prisma.asset.create({
      data: {
        clientId: bodyData.clientId || null,
        type: fileType,
        originalName: bodyData.name || originalName,
        mimeType: mimeType,
        sizeBytes: fileSizeBytes,
        storageUrl: fileUrl,
        storagePath: storagePath
      }
    });

    logger.info('Asset created', { assetId: asset.id });

    res.status(201).json({
      success: true,
      message: 'Asset uploaded successfully',
      asset: {
        id: asset.id,
        type: asset.type,
        name: asset.originalName,
        url: asset.storageUrl,
        size: asset.sizeBytes,
        createdAt: asset.createdAt
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        error: error.code === 'LIMIT_FILE_SIZE'
          ? 'File too large. Maximum size is 500MB'
          : error.message
      });
    }

    logger.error('Error uploading asset', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/assets
 * List all assets
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { clientId, type, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (type) where.type = type;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        select: {
          id: true,
          type: true,
          originalName: true,
          storageUrl: true,
          thumbnailUrl: true,
          sizeBytes: true,
          createdAt: true,
          _count: {
            select: { jobs: true }
          }
        }
      }),
      prisma.asset.count({ where })
    ]);

    res.json({
      success: true,
      data: assets.map(a => ({
        ...a,
        jobCount: a._count.jobs
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error listing assets', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/assets/:id
 * Get asset details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        jobs: {
          select: {
            id: true,
            status: true,
            templateSlug: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    res.json({
      success: true,
      asset
    });
  } catch (error) {
    logger.error('Error getting asset', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/assets/:id
 * Delete an asset
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        _count: { select: { jobs: true } }
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Check if asset has associated jobs
    if (asset._count.jobs > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete asset with ${asset._count.jobs} associated jobs`
      });
    }

    // Delete file from disk if it exists
    if (asset.storagePath) {
      try {
        unlinkSync(asset.storagePath);
        logger.info('File deleted from disk', { path: asset.storagePath });
      } catch {
        logger.warn('Could not delete file from disk', { path: asset.storagePath });
      }
    }

    // Delete database record
    await prisma.asset.delete({ where: { id } });

    logger.info('Asset deleted', { assetId: id });

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting asset', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
