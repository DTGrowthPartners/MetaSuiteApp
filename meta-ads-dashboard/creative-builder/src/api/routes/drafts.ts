// ===========================================
// META CREATIVE BUILDER - Drafts API Routes
// ===========================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../utils/logger.js';
import { decrypt } from '../../utils/encryption.js';
import { MetaApiClient } from '../../services/meta/index.js';
import type { TemplateConfig } from '../../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const router = Router();
const prisma = new PrismaClient();

// ===========================================
// Validation Schemas
// ===========================================

const CreateDraftSchema = z.object({
  campaignName: z.string().optional(),
  dailyBudget: z.number().positive().optional()
});

// ===========================================
// Helper Functions
// ===========================================

function loadTemplate(slug: string): TemplateConfig | null {
  try {
    const templatePath = join(__dirname, '../../config/templates', `${slug}.json`);
    const content = readFileSync(templatePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// ===========================================
// Routes
// ===========================================

/**
 * POST /api/jobs/:jobId/draft
 * Create a draft campaign in Meta
 */
router.post('/jobs/:jobId/draft', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const data = CreateDraftSchema.parse(req.body);

    // Get job with all related data
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        asset: true,
        adAccount: true,
        client: true
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== 'READY_FOR_DRAFT') {
      return res.status(400).json({
        success: false,
        error: `Cannot create draft for job in status: ${job.status}. Must be READY_FOR_DRAFT.`
      });
    }

    // Validate selections
    if (
      job.selectedCopy === null ||
      job.selectedHeadline === null ||
      job.selectedDescription === null ||
      job.selectedCta === null
    ) {
      return res.status(400).json({
        success: false,
        error: 'Please select copy variants before creating draft'
      });
    }

    // Load template
    const template = loadTemplate(job.templateSlug);
    if (!template) {
      return res.status(400).json({
        success: false,
        error: `Template not found: ${job.templateSlug}`
      });
    }

    // Get selected content
    const copies = job.copies as string[];
    const headlines = job.headlines as string[];
    const descriptions = job.descriptions as string[];
    const ctas = job.ctas as string[];

    const selectedCopy = copies[job.selectedCopy];
    const selectedHeadline = headlines[job.selectedHeadline];
    const selectedDescription = descriptions[job.selectedDescription];
    const selectedCta = ctas[job.selectedCta];

    // Decrypt access token
    let accessToken: string;
    try {
      accessToken = decrypt(job.adAccount.accessToken);
    } catch {
      // If decryption fails, assume it's stored in plain text (dev mode)
      accessToken = job.adAccount.accessToken;
    }

    // Initialize Meta API client
    const metaClient = new MetaApiClient(accessToken, job.adAccount.metaAccountId);

    // Update job status
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'CREATING_DRAFT' }
    });

    const campaignName = data.campaignName || job.customCampaignName ||
      `${template.name} - ${new Date().toLocaleDateString('es-CO')}`;

    const dailyBudget = (data.dailyBudget || job.customBudget || template.budgetDefault) * 100; // Convert to cents

    try {
      // ============================================
      // Step 1: Upload Asset to Meta (if needed)
      // ============================================
      let metaVideoId: string | undefined;
      let metaImageHash: string | undefined;

      if (job.asset.type === 'VIDEO') {
        logger.info('Uploading video to Meta', { assetId: job.asset.id });

        // For production, would upload actual file
        // Here we'll use URL upload
        const uploadResult = await metaClient.uploadVideoFromUrl(job.asset.storageUrl);

        if (!uploadResult.success || !uploadResult.data) {
          throw new Error(`Video upload failed: ${uploadResult.error?.message}`);
        }

        metaVideoId = uploadResult.data.id;
        logger.info('Video uploaded', { videoId: metaVideoId });
      } else {
        logger.info('Uploading image to Meta', { assetId: job.asset.id });

        const uploadResult = await metaClient.uploadImageFromUrl(job.asset.storageUrl);

        if (!uploadResult.success || !uploadResult.data) {
          throw new Error(`Image upload failed: ${uploadResult.error?.message}`);
        }

        // Get image hash from response
        const images = uploadResult.data.images;
        metaImageHash = Object.values(images)[0]?.hash;

        if (!metaImageHash) {
          throw new Error('No image hash returned');
        }

        logger.info('Image uploaded', { imageHash: metaImageHash });
      }

      // ============================================
      // Step 2: Create Campaign (PAUSED)
      // ============================================
      logger.info('Creating campaign', { name: campaignName });

      const campaignResult = await metaClient.createCampaign({
        name: campaignName,
        objective: template.objective as any,
        status: 'PAUSED',
        special_ad_categories: template.specialAdCategories
      });

      if (!campaignResult.success || !campaignResult.data) {
        throw new Error(`Campaign creation failed: ${campaignResult.error?.message}`);
      }

      const campaignId = campaignResult.data.id;
      logger.info('Campaign created', { campaignId });

      // ============================================
      // Step 3: Create Ad Set (PAUSED)
      // ============================================
      const adSetName = `${campaignName} - Ad Set`;

      logger.info('Creating ad set', { name: adSetName });

      const adSetResult = await metaClient.createAdSet({
        name: adSetName,
        campaign_id: campaignId,
        optimization_goal: template.optimizationGoal as any,
        billing_event: template.billingEvent as any,
        bid_strategy: template.bidStrategy,
        daily_budget: dailyBudget,
        targeting: template.targetingBase || {
          geo_locations: { countries: ['CO'] },
          age_min: 18,
          age_max: 65
        },
        status: 'PAUSED',
        promoted_object: job.adAccount.pageId ? {
          page_id: job.adAccount.pageId
        } : undefined
      });

      if (!adSetResult.success || !adSetResult.data) {
        throw new Error(`Ad Set creation failed: ${adSetResult.error?.message}`);
      }

      const adSetId = adSetResult.data.id;
      logger.info('Ad Set created', { adSetId });

      // ============================================
      // Step 4: Create Creative
      // ============================================
      const creativeName = `${campaignName} - Creative`;

      logger.info('Creating creative', { name: creativeName });

      let creativeResult;

      if (job.asset.type === 'VIDEO' && metaVideoId) {
        creativeResult = await metaClient.createCreativeWithVideo({
          name: creativeName,
          pageId: job.adAccount.pageId!,
          igActorId: job.adAccount.igActorId || undefined,
          videoId: metaVideoId,
          primaryText: selectedCopy,
          headline: selectedHeadline,
          description: selectedDescription,
          callToAction: selectedCta as any,
          linkUrl: template.destinationType === 'website' ?
            (template.destinationConfig as any).url : undefined
        });
      } else if (metaImageHash) {
        creativeResult = await metaClient.createCreativeWithImage({
          name: creativeName,
          pageId: job.adAccount.pageId!,
          igActorId: job.adAccount.igActorId || undefined,
          imageHash: metaImageHash,
          primaryText: selectedCopy,
          headline: selectedHeadline,
          description: selectedDescription,
          callToAction: selectedCta as any,
          linkUrl: template.destinationType === 'website' ?
            (template.destinationConfig as any).url : undefined
        });
      } else {
        throw new Error('No video ID or image hash available');
      }

      if (!creativeResult.success || !creativeResult.data) {
        throw new Error(`Creative creation failed: ${creativeResult.error?.message}`);
      }

      const creativeId = creativeResult.data.id;
      logger.info('Creative created', { creativeId });

      // ============================================
      // Step 5: Create Ad (PAUSED)
      // ============================================
      const adName = `${campaignName} - Ad`;

      logger.info('Creating ad', { name: adName });

      const adResult = await metaClient.createAd({
        name: adName,
        adset_id: adSetId,
        creative_id: creativeId,
        status: 'PAUSED'
      });

      if (!adResult.success || !adResult.data) {
        throw new Error(`Ad creation failed: ${adResult.error?.message}`);
      }

      const adId = adResult.data.id;
      logger.info('Ad created', { adId });

      // ============================================
      // Step 6: Create Draft Record
      // ============================================
      const draft = await prisma.draft.create({
        data: {
          jobId: jobId,
          adAccountId: job.adAccountId,

          metaVideoId: metaVideoId,
          metaImageHash: metaImageHash,

          campaignId: campaignId,
          campaignName: campaignName,
          adSetId: adSetId,
          adSetName: adSetName,
          creativeId: creativeId,
          adId: adId,
          adName: adName,

          campaignStatus: 'PAUSED',
          adSetStatus: 'PAUSED',
          creativeStatus: 'ACTIVE',
          adStatus: 'PAUSED',

          templateConfig: template as any,
          finalCopy: selectedCopy,
          finalHeadline: selectedHeadline,
          finalDescription: selectedDescription,
          finalCta: selectedCta,
          dailyBudget: dailyBudget / 100,

          campaignUrl: metaClient.getAdsManagerUrl('campaign', campaignId),
          adSetUrl: metaClient.getAdsManagerUrl('adset', adSetId),
          adUrl: metaClient.getAdsManagerUrl('ad', adId)
        }
      });

      // Update job status
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'DRAFT_CREATED' }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          draftId: draft.id,
          action: 'CREATE_DRAFT',
          success: true,
          requestBody: {
            campaignName,
            dailyBudget: dailyBudget / 100,
            template: template.slug
          },
          responseBody: {
            campaignId,
            adSetId,
            creativeId,
            adId
          }
        }
      });

      logger.info('Draft created successfully', { draftId: draft.id });

      res.status(201).json({
        success: true,
        message: 'Draft created successfully in Meta Ads',
        draft: {
          id: draft.id,
          campaignId: draft.campaignId,
          adSetId: draft.adSetId,
          creativeId: draft.creativeId,
          adId: draft.adId,
          status: {
            campaign: 'PAUSED',
            adSet: 'PAUSED',
            ad: 'PAUSED'
          },
          urls: {
            campaign: draft.campaignUrl,
            adSet: draft.adSetUrl,
            ad: draft.adUrl
          }
        }
      });

    } catch (metaError) {
      logger.error('Meta API error during draft creation', { error: metaError });

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'ERROR',
          error: (metaError as Error).message
        }
      });

      // Create audit log for failure
      await prisma.auditLog.create({
        data: {
          action: 'CREATE_DRAFT',
          success: false,
          error: (metaError as Error).message
        }
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create draft in Meta',
        details: (metaError as Error).message
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error creating draft', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/drafts
 * List all drafts
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { adAccountId, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};
    if (adAccountId) where.adAccountId = adAccountId;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [drafts, total] = await Promise.all([
      prisma.draft.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              templateSlug: true,
              asset: {
                select: { type: true, thumbnailUrl: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      }),
      prisma.draft.count({ where })
    ]);

    res.json({
      success: true,
      data: drafts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error listing drafts', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/drafts/:id
 * Get draft details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const draft = await prisma.draft.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            asset: true,
            adAccount: {
              select: {
                id: true,
                name: true,
                metaAccountId: true
              }
            }
          }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }

    res.json({
      success: true,
      draft
    });
  } catch (error) {
    logger.error('Error getting draft', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
