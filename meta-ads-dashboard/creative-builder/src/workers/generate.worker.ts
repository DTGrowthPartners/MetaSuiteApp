// ===========================================
// META CREATIVE BUILDER - Generate Worker
// ===========================================
// Worker process for generating copy variants with AI

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { AIService } from '../services/ai/index.js';
import { config } from '../config/index.js';
import type { CreativeBrief, TemplateConfig } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

// ===========================================
// Types
// ===========================================

interface GenerateJobPayload {
  jobId: string;
}

// ===========================================
// Helper Functions
// ===========================================

function loadTemplate(slug: string): TemplateConfig | null {
  try {
    const templatePath = join(__dirname, '../config/templates', `${slug}.json`);
    const content = readFileSync(templatePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// ===========================================
// Worker Functions
// ===========================================

export async function processGenerateJob(payload: GenerateJobPayload): Promise<void> {
  const { jobId } = payload;

  logger.info('Starting copy generation', { jobId });

  try {
    // Get job with creative brief
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { asset: true }
    });

    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status !== 'ANALYZED' && job.status !== 'GENERATING') {
      logger.warn('Job not in generatable state', { jobId, status: job.status });
      return;
    }

    if (!job.creativeBrief) {
      throw new Error('Job has no creative brief. Run analysis first.');
    }

    // Load template
    const template = loadTemplate(job.templateSlug);
    if (!template) {
      throw new Error(`Template not found: ${job.templateSlug}`);
    }

    // Update status
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'GENERATING' }
    });

    // Initialize AI service
    const aiService = new AIService({
      provider: config.ai.provider as 'openai' | 'anthropic' | 'mock',
      apiKey: config.ai.apiKey,
      model: config.ai.model
    });

    // Generate copy variants
    const copyVariants = await aiService.generateCopies(
      job.creativeBrief as unknown as CreativeBrief,
      {
        template: template.slug,
        objective: template.objective,
        destinationType: template.destinationType,
        callToActionOptions: template.callToActionOptions,
        copyGuidelines: template.copyGuidelines
      }
    );

    // Validate we got enough variants
    if (copyVariants.copies.length < 5) {
      logger.warn('Generated fewer than 5 copies', { count: copyVariants.copies.length });
    }

    // Update job with generated copies
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'GENERATED',
        copies: copyVariants.copies,
        headlines: copyVariants.headlines,
        descriptions: copyVariants.descriptions,
        ctas: copyVariants.ctas,
        error: null
      }
    });

    logger.info('Copy generation completed', {
      jobId,
      copies: copyVariants.copies.length,
      headlines: copyVariants.headlines.length,
      descriptions: copyVariants.descriptions.length,
      ctas: copyVariants.ctas.length
    });

  } catch (error) {
    logger.error('Error generating copies', { jobId, error });

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

if (process.argv[2] === '--job') {
  const jobId = process.argv[3];

  if (!jobId) {
    console.error('Usage: ts-node generate.worker.ts --job <jobId>');
    process.exit(1);
  }

  processGenerateJob({ jobId })
    .then(() => {
      console.log('Generation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Generation failed:', error.message);
      process.exit(1);
    });
}

export default processGenerateJob;
