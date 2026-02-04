// ===========================================
// META CREATIVE BUILDER - Ad Accounts API Routes
// ===========================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { encrypt, decrypt } from '../../utils/encryption.js';
import { MetaApiClient } from '../../services/meta/index.js';

const router = Router();
const prisma = new PrismaClient();

// ===========================================
// Validation Schemas
// ===========================================

const CreateAdAccountSchema = z.object({
  clientId: z.string().optional(),
  name: z.string().min(1),
  metaAccountId: z.string().min(1),
  accessToken: z.string().min(1),
  pageId: z.string().optional(),
  igActorId: z.string().optional()
});

const UpdateAdAccountSchema = z.object({
  name: z.string().min(1).optional(),
  accessToken: z.string().min(1).optional(),
  pageId: z.string().optional(),
  igActorId: z.string().optional(),
  isActive: z.boolean().optional()
});

// ===========================================
// Routes
// ===========================================

/**
 * GET /api/ad-accounts
 * List all ad accounts
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { clientId, isActive } = req.query;

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const accounts = await prisma.adAccount.findMany({
      where,
      select: {
        id: true,
        name: true,
        metaAccountId: true,
        pageId: true,
        igActorId: true,
        isActive: true,
        createdAt: true,
        client: {
          select: { id: true, name: true }
        },
        _count: {
          select: { jobs: true, drafts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: accounts.map(a => ({
        ...a,
        jobCount: a._count.jobs,
        draftCount: a._count.drafts
      })),
      total: accounts.length
    });
  } catch (error) {
    logger.error('Error listing ad accounts', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/ad-accounts/:id
 * Get ad account details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const account = await prisma.adAccount.findUnique({
      where: { id },
      include: {
        client: true,
        jobs: {
          select: {
            id: true,
            status: true,
            templateSlug: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        drafts: {
          select: {
            id: true,
            campaignName: true,
            campaignStatus: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Ad account not found'
      });
    }

    // Don't expose the access token
    const { accessToken: _, ...safeAccount } = account;

    res.json({
      success: true,
      account: {
        ...safeAccount,
        hasToken: !!account.accessToken
      }
    });
  } catch (error) {
    logger.error('Error getting ad account', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/ad-accounts
 * Add a new ad account
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = CreateAdAccountSchema.parse(req.body);

    // Normalize account ID
    const metaAccountId = data.metaAccountId.startsWith('act_')
      ? data.metaAccountId
      : `act_${data.metaAccountId}`;

    // Verify the token works by making a test call
    const metaClient = new MetaApiClient(data.accessToken, metaAccountId);
    const accountInfo = await metaClient.getAccountInfo();

    if (!accountInfo.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid access token or account ID',
        details: accountInfo.error?.message
      });
    }

    // Encrypt the access token
    const encryptedToken = encrypt(data.accessToken);

    // Create the ad account
    const account = await prisma.adAccount.create({
      data: {
        clientId: data.clientId || null,
        name: data.name || accountInfo.data?.name || 'Unnamed Account',
        metaAccountId: metaAccountId,
        accessToken: encryptedToken,
        pageId: data.pageId || null,
        igActorId: data.igActorId || null,
        isActive: true
      }
    });

    logger.info('Ad account created', {
      accountId: account.id,
      metaAccountId: metaAccountId
    });

    res.status(201).json({
      success: true,
      message: 'Ad account added successfully',
      account: {
        id: account.id,
        name: account.name,
        metaAccountId: account.metaAccountId,
        pageId: account.pageId,
        igActorId: account.igActorId,
        isActive: account.isActive,
        metaInfo: accountInfo.data
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

    logger.error('Error creating ad account', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/ad-accounts/:id
 * Update an ad account
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = UpdateAdAccountSchema.parse(req.body);

    const existing = await prisma.adAccount.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Ad account not found'
      });
    }

    const updateData: Record<string, unknown> = {};

    if (data.name) updateData.name = data.name;
    if (data.pageId !== undefined) updateData.pageId = data.pageId;
    if (data.igActorId !== undefined) updateData.igActorId = data.igActorId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // If updating token, verify it first
    if (data.accessToken) {
      const metaClient = new MetaApiClient(data.accessToken, existing.metaAccountId);
      const accountInfo = await metaClient.getAccountInfo();

      if (!accountInfo.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid access token',
          details: accountInfo.error?.message
        });
      }

      updateData.accessToken = encrypt(data.accessToken);
    }

    const account = await prisma.adAccount.update({
      where: { id },
      data: updateData
    });

    logger.info('Ad account updated', { accountId: id });

    res.json({
      success: true,
      message: 'Ad account updated successfully',
      account: {
        id: account.id,
        name: account.name,
        metaAccountId: account.metaAccountId,
        pageId: account.pageId,
        igActorId: account.igActorId,
        isActive: account.isActive
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

    logger.error('Error updating ad account', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/ad-accounts/:id/verify
 * Verify ad account token is still valid
 */
router.post('/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const account = await prisma.adAccount.findUnique({ where: { id } });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Ad account not found'
      });
    }

    // Decrypt token
    let accessToken: string;
    try {
      accessToken = decrypt(account.accessToken);
    } catch {
      accessToken = account.accessToken;
    }

    // Verify with Meta
    const metaClient = new MetaApiClient(accessToken, account.metaAccountId);
    const accountInfo = await metaClient.getAccountInfo();

    if (!accountInfo.success) {
      // Mark account as inactive
      await prisma.adAccount.update({
        where: { id },
        data: { isActive: false }
      });

      return res.json({
        success: true,
        valid: false,
        error: accountInfo.error?.message,
        account: {
          id: account.id,
          name: account.name,
          isActive: false
        }
      });
    }

    res.json({
      success: true,
      valid: true,
      account: {
        id: account.id,
        name: account.name,
        isActive: account.isActive,
        metaInfo: accountInfo.data
      }
    });
  } catch (error) {
    logger.error('Error verifying ad account', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/ad-accounts/:id/pages
 * Get pages associated with the ad account token
 */
router.get('/:id/pages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const account = await prisma.adAccount.findUnique({ where: { id } });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Ad account not found'
      });
    }

    // Decrypt token
    let accessToken: string;
    try {
      accessToken = decrypt(account.accessToken);
    } catch {
      accessToken = account.accessToken;
    }

    const metaClient = new MetaApiClient(accessToken, account.metaAccountId);
    const pagesResult = await metaClient.getPages();

    if (!pagesResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to fetch pages',
        details: pagesResult.error?.message
      });
    }

    res.json({
      success: true,
      pages: pagesResult.data?.data || []
    });
  } catch (error) {
    logger.error('Error getting pages', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/ad-accounts/:id/instagram
 * Get Instagram accounts linked to a page
 */
router.get('/:id/instagram', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pageId } = req.query;

    if (!pageId) {
      return res.status(400).json({
        success: false,
        error: 'pageId query parameter is required'
      });
    }

    const account = await prisma.adAccount.findUnique({ where: { id } });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Ad account not found'
      });
    }

    // Decrypt token
    let accessToken: string;
    try {
      accessToken = decrypt(account.accessToken);
    } catch {
      accessToken = account.accessToken;
    }

    const metaClient = new MetaApiClient(accessToken, account.metaAccountId);
    const igResult = await metaClient.getInstagramAccounts(pageId as string);

    if (!igResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to fetch Instagram accounts',
        details: igResult.error?.message
      });
    }

    res.json({
      success: true,
      instagramAccounts: igResult.data?.data || []
    });
  } catch (error) {
    logger.error('Error getting Instagram accounts', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/ad-accounts/:id
 * Delete an ad account (soft delete by deactivating)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const account = await prisma.adAccount.findUnique({
      where: { id },
      include: {
        _count: { select: { jobs: true, drafts: true } }
      }
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Ad account not found'
      });
    }

    // Check for associated data
    if (account._count.jobs > 0 || account._count.drafts > 0) {
      if (force !== 'true') {
        return res.status(400).json({
          success: false,
          error: `Cannot delete ad account with ${account._count.jobs} jobs and ${account._count.drafts} drafts. Use ?force=true to deactivate instead.`
        });
      }

      // Soft delete (deactivate)
      await prisma.adAccount.update({
        where: { id },
        data: { isActive: false }
      });

      logger.info('Ad account deactivated', { accountId: id });

      return res.json({
        success: true,
        message: 'Ad account deactivated (soft delete due to associated data)'
      });
    }

    // Hard delete
    await prisma.adAccount.delete({ where: { id } });

    logger.info('Ad account deleted', { accountId: id });

    res.json({
      success: true,
      message: 'Ad account deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting ad account', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
