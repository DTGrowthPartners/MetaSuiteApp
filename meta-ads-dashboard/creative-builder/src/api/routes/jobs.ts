// ===========================================
// META CREATIVE BUILDER - Jobs API Routes
// ===========================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../utils/logger.js';
import { AIService } from '../../services/ai/index.js';
import { config } from '../../config/index.js';
import { queueAnalyzeJob, queueGenerateJob } from '../../services/jobProcessor.js';
import type { TemplateConfig, CreativeBrief } from '../../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const router = Router();
const prisma = new PrismaClient();

// ===========================================
// Validation Schemas
// ===========================================

const CreateJobSchema = z.object({
  clientId: z.string().uuid(),
  adAccountId: z.string().uuid(),
  assetId: z.string().uuid(),
  templateSlug: z.string()
});

const SelectVariantsSchema = z.object({
  selectedCopy: z.number().min(0).max(4),
  selectedHeadline: z.number().min(0).max(4),
  selectedDescription: z.number().min(0).max(4),
  selectedCta: z.number().min(0).max(4),
  customCampaignName: z.string().optional(),
  customBudget: z.number().positive().optional()
});

// ===========================================
// Helper Functions
// ===========================================

function loadTemplate(slug: string): TemplateConfig | null {
  try {
    const templatePath = join(__dirname, '../../config/templates', `${slug}.json`);
    if (!existsSync(templatePath)) {
      return null;
    }
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
 * POST /api/jobs
 * Create a new job
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = CreateJobSchema.parse(req.body);

    // Verify asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: data.assetId }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Verify ad account exists
    const adAccount = await prisma.adAccount.findUnique({
      where: { id: data.adAccountId }
    });

    if (!adAccount) {
      return res.status(404).json({
        success: false,
        error: 'Ad account not found'
      });
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        clientId: data.clientId,
        adAccountId: data.adAccountId,
        assetId: data.assetId,
        templateSlug: data.templateSlug,
        status: 'PENDING'
      },
      include: {
        asset: true,
        adAccount: true
      }
    });

    logger.info('Job created', { jobId: job.id });

    res.status(201).json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        createdAt: job.createdAt
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

    logger.error('Error creating job', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/jobs
 * List all jobs (with pagination)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { clientId, status, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          asset: {
            select: { id: true, type: true, originalName: true, thumbnailUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      }),
      prisma.job.count({ where })
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error listing jobs', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/jobs/:id
 * Get job details with all results
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        asset: true,
        adAccount: {
          select: {
            id: true,
            metaAccountId: true,
            name: true,
            pageId: true,
            igActorId: true
          }
        },
        draft: true
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        templateSlug: job.templateSlug,
        asset: {
          id: job.asset.id,
          type: job.asset.type,
          originalName: job.asset.originalName,
          thumbnailUrl: job.asset.thumbnailUrl,
          storageUrl: job.asset.storageUrl
        },
        adAccount: job.adAccount,
        creativeBrief: job.creativeBrief,
        copies: job.copies,
        headlines: job.headlines,
        descriptions: job.descriptions,
        ctas: job.ctas,
        bestPick: job.bestPick,
        selectedCopy: job.selectedCopy,
        selectedHeadline: job.selectedHeadline,
        selectedDescription: job.selectedDescription,
        selectedCta: job.selectedCta,
        customCampaignName: job.customCampaignName,
        customBudget: job.customBudget,
        draft: job.draft,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error getting job', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/jobs/:id/analyze
 * Trigger asset analysis
 */
router.post('/:id/analyze', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: { asset: true }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== 'PENDING' && job.status !== 'ERROR') {
      return res.status(400).json({
        success: false,
        error: `Cannot analyze job in status: ${job.status}`
      });
    }

    const { async: asyncMode } = req.query;

    // Update status
    await prisma.job.update({
      where: { id },
      data: {
        status: 'ANALYZING',
        processingStartedAt: new Date()
      }
    });

    // If async mode, queue job and return immediately
    if (asyncMode === 'true') {
      const queueId = queueAnalyzeJob(id);
      return res.json({
        success: true,
        message: 'Analysis queued',
        queueId,
        jobId: id
      });
    }

    // Synchronous mode - run analysis and wait for result
    try {
      const aiService = new AIService({
        provider: config.ai.provider as 'openai' | 'anthropic' | 'mock',
        apiKey: config.ai.apiKey,
        model: config.ai.model
      });

      const brief = await aiService.analyzeAsset({
        type: job.asset.type,
        url: job.asset.storageUrl,
        transcription: job.asset.transcription || undefined,
        ocrText: job.asset.ocrText || undefined
      });

      await prisma.job.update({
        where: { id },
        data: {
          status: 'ANALYZED',
          creativeBrief: brief as any,
          analysisCompletedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Analysis completed',
        creativeBrief: brief
      });
    } catch (analysisError) {
      await prisma.job.update({
        where: { id },
        data: {
          status: 'ERROR',
          error: (analysisError as Error).message
        }
      });

      throw analysisError;
    }
  } catch (error) {
    logger.error('Error analyzing job', { error });
    res.status(500).json({
      success: false,
      error: 'Analysis failed'
    });
  }
});

/**
 * POST /api/jobs/:id/generate
 * Generate copy variations
 */
router.post('/:id/generate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== 'ANALYZED') {
      return res.status(400).json({
        success: false,
        error: `Cannot generate for job in status: ${job.status}. Must be ANALYZED.`
      });
    }

    if (!job.creativeBrief) {
      return res.status(400).json({
        success: false,
        error: 'Job has no creative brief. Run analysis first.'
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

    const { async: asyncMode } = req.query;

    // Update status
    await prisma.job.update({
      where: { id },
      data: { status: 'GENERATING' }
    });

    // If async mode, queue job and return immediately
    if (asyncMode === 'true') {
      const queueId = queueGenerateJob(id);
      return res.json({
        success: true,
        message: 'Generation queued',
        queueId,
        jobId: id
      });
    }

    try {
      const aiService = new AIService({
        provider: config.ai.provider as 'openai' | 'anthropic' | 'mock',
        apiKey: config.ai.apiKey,
        model: config.ai.model
      });

      const result = await aiService.generateCopies(
        job.creativeBrief as unknown as CreativeBrief,
        {
          template: template.slug,
          objective: template.objective,
          destinationType: template.destinationType,
          callToActionOptions: template.callToActionOptions,
          copyGuidelines: template.copyGuidelines
        }
      );

      await prisma.job.update({
        where: { id },
        data: {
          status: 'GENERATED',
          copies: result.copies,
          headlines: result.headlines,
          descriptions: result.descriptions,
          ctas: result.ctas,
          bestPick: result.bestPick as any,
          generationCompletedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Generation completed',
        ...result
      });
    } catch (genError) {
      await prisma.job.update({
        where: { id },
        data: {
          status: 'ERROR',
          error: (genError as Error).message
        }
      });

      throw genError;
    }
  } catch (error) {
    logger.error('Error generating copies', { error });
    res.status(500).json({
      success: false,
      error: 'Generation failed'
    });
  }
});

/**
 * PUT /api/jobs/:id/select
 * Save user's variant selection
 */
router.put('/:id/select', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = SelectVariantsSchema.parse(req.body);

    const job = await prisma.job.findUnique({
      where: { id }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== 'GENERATED') {
      return res.status(400).json({
        success: false,
        error: `Cannot select for job in status: ${job.status}. Must be GENERATED.`
      });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: {
        selectedCopy: data.selectedCopy,
        selectedHeadline: data.selectedHeadline,
        selectedDescription: data.selectedDescription,
        selectedCta: data.selectedCta,
        customCampaignName: data.customCampaignName,
        customBudget: data.customBudget,
        status: 'READY_FOR_DRAFT'
      }
    });

    res.json({
      success: true,
      message: 'Selection saved',
      job: {
        id: updated.id,
        status: updated.status,
        selectedCopy: updated.selectedCopy,
        selectedHeadline: updated.selectedHeadline,
        selectedDescription: updated.selectedDescription,
        selectedCta: updated.selectedCta
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

    logger.error('Error saving selection', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
