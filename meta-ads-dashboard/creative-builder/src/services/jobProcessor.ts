// ===========================================
// META CREATIVE BUILDER - Job Processor Service
// ===========================================
// Simple job processor without external queue dependencies
// For production, this can be replaced with BullMQ/Redis

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import processAnalyzeJob from '../workers/analyze.worker.js';
import processGenerateJob from '../workers/generate.worker.js';

const prisma = new PrismaClient();

// ===========================================
// Types
// ===========================================

type JobType = 'analyze' | 'generate';

interface QueuedJob {
  id: string;
  type: JobType;
  payload: { jobId: string };
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
}

// ===========================================
// In-Memory Queue (for simple deployments)
// ===========================================

class SimpleJobQueue {
  private queue: QueuedJob[] = [];
  private processing = false;
  private maxConcurrent = 2;
  private currentProcessing = 0;

  add(type: JobType, jobId: string, maxAttempts = 3): string {
    const queuedJob: QueuedJob = {
      id: `${type}-${jobId}-${Date.now()}`,
      type,
      payload: { jobId },
      attempts: 0,
      maxAttempts,
      createdAt: new Date()
    };

    this.queue.push(queuedJob);
    logger.info('Job added to queue', { queueId: queuedJob.id, type, jobId });

    // Start processing if not already running
    this.processNext();

    return queuedJob.id;
  }

  private async processNext(): Promise<void> {
    if (this.currentProcessing >= this.maxConcurrent) {
      return;
    }

    const job = this.queue.shift();
    if (!job) {
      return;
    }

    this.currentProcessing++;

    try {
      job.attempts++;
      logger.info('Processing job', {
        queueId: job.id,
        type: job.type,
        attempt: job.attempts
      });

      switch (job.type) {
        case 'analyze':
          await processAnalyzeJob(job.payload);
          break;
        case 'generate':
          await processGenerateJob(job.payload);
          break;
      }

      logger.info('Job completed successfully', { queueId: job.id });

    } catch (error) {
      logger.error('Job failed', {
        queueId: job.id,
        attempt: job.attempts,
        error: (error as Error).message
      });

      // Retry if attempts remaining
      if (job.attempts < job.maxAttempts) {
        logger.info('Retrying job', {
          queueId: job.id,
          nextAttempt: job.attempts + 1
        });
        this.queue.push(job);
      } else {
        logger.error('Job failed permanently', { queueId: job.id });
      }
    } finally {
      this.currentProcessing--;
      // Process next job
      this.processNext();
    }
  }

  getStatus(): { queueLength: number; processing: number } {
    return {
      queueLength: this.queue.length,
      processing: this.currentProcessing
    };
  }
}

// ===========================================
// Singleton Instance
// ===========================================

export const jobQueue = new SimpleJobQueue();

// ===========================================
// Queue API Functions
// ===========================================

export function queueAnalyzeJob(jobId: string): string {
  return jobQueue.add('analyze', jobId);
}

export function queueGenerateJob(jobId: string): string {
  return jobQueue.add('generate', jobId);
}

export function getQueueStatus(): { queueLength: number; processing: number } {
  return jobQueue.getStatus();
}

// ===========================================
// Batch Processing Functions
// ===========================================

export async function processPendingJobs(): Promise<void> {
  logger.info('Checking for pending jobs...');

  // Find jobs that need analysis
  const pendingAnalysis = await prisma.job.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: 10
  });

  for (const job of pendingAnalysis) {
    queueAnalyzeJob(job.id);
  }

  // Find jobs that are analyzed and need generation
  const pendingGeneration = await prisma.job.findMany({
    where: { status: 'ANALYZED' },
    orderBy: { createdAt: 'asc' },
    take: 10
  });

  for (const job of pendingGeneration) {
    queueGenerateJob(job.id);
  }

  logger.info('Pending jobs queued', {
    analysis: pendingAnalysis.length,
    generation: pendingGeneration.length
  });
}

// ===========================================
// Cleanup Functions
// ===========================================

export async function cleanupStuckJobs(): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Find jobs stuck in processing states
  const stuckJobs = await prisma.job.updateMany({
    where: {
      status: { in: ['ANALYZING', 'GENERATING', 'CREATING_DRAFT'] },
      updatedAt: { lt: oneHourAgo }
    },
    data: {
      status: 'ERROR',
      error: 'Job timed out after 1 hour'
    }
  });

  if (stuckJobs.count > 0) {
    logger.warn('Cleaned up stuck jobs', { count: stuckJobs.count });
  }

  return stuckJobs.count;
}

export default {
  queueAnalyzeJob,
  queueGenerateJob,
  getQueueStatus,
  processPendingJobs,
  cleanupStuckJobs
};
