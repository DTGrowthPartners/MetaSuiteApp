// ===========================================
// META CREATIVE BUILDER - Analyze Worker
// ===========================================
// Worker process for analyzing assets with AI

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { AIService } from '../services/ai/index.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

// ===========================================
// Types
// ===========================================

interface AnalyzeJobPayload {
  jobId: string;
}

// ===========================================
// Worker Functions
// ===========================================

export async function processAnalyzeJob(payload: AnalyzeJobPayload): Promise<void> {
  const { jobId } = payload;

  logger.info('Starting asset analysis', { jobId });

  try {
    // Get job with asset
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { asset: true }
    });

    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status !== 'PENDING' && job.status !== 'ANALYZING') {
      logger.warn('Job not in analyzable state', { jobId, status: job.status });
      return;
    }

    // Update status to analyzing
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'ANALYZING' }
    });

    // Initialize AI service
    const aiService = new AIService({
      provider: config.ai.provider as 'openai' | 'anthropic' | 'mock',
      apiKey: config.ai.apiKey,
      model: config.ai.model
    });

    // Analyze the asset
    const creativeBrief = await aiService.analyzeAsset({
      type: job.asset.type,
      url: job.asset.storageUrl,
      transcription: job.asset.transcription || undefined,
      ocrText: job.asset.ocrText || undefined
    });

    // Update job with analysis results
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'ANALYZED',
        creativeBrief: creativeBrief as any,
        error: null
      }
    });

    // Update asset with any extracted data
    if (creativeBrief.product_or_service) {
      await prisma.asset.update({
        where: { id: job.assetId },
        data: {
          metadata: {
            ...((job.asset.metadata as object) || {}),
            analyzedProduct: creativeBrief.product_or_service,
            analyzedCategory: creativeBrief.category
          }
        }
      });
    }

    logger.info('Asset analysis completed', {
      jobId,
      product: creativeBrief.product_or_service,
      category: creativeBrief.category
    });

  } catch (error) {
    logger.error('Error analyzing asset', { jobId, error });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'ERROR',
        error: (error as Error).message
      }
    });

    throw error;
  }
}

// ===========================================
// Standalone Execution
// ===========================================

// If running as standalone worker
if (process.argv[2] === '--job') {
  const jobId = process.argv[3];

  if (!jobId) {
    console.error('Usage: ts-node analyze.worker.ts --job <jobId>');
    process.exit(1);
  }

  processAnalyzeJob({ jobId })
    .then(() => {
      console.log('Analysis completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Analysis failed:', error.message);
      process.exit(1);
    });
}

export default processAnalyzeJob;
