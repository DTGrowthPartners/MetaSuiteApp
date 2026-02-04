// ===========================================
// META CREATIVE BUILDER - Templates API Routes
// ===========================================

import { Router, Request, Response } from 'express';
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import type { TemplateConfig } from '../../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const router = Router();

// ===========================================
// Constants
// ===========================================

const TEMPLATES_DIR = join(__dirname, '../../config/templates');

// ===========================================
// Validation Schemas
// ===========================================

const CreateTemplateSchema = z.object({
  slug: z.string().regex(/^[a-z0-9_]+$/, 'Slug must be lowercase alphanumeric with underscores'),
  name: z.string().min(1),
  description: z.string().optional(),
  objective: z.enum([
    'OUTCOME_AWARENESS', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS',
    'OUTCOME_SALES', 'OUTCOME_TRAFFIC', 'OUTCOME_APP_PROMOTION'
  ]),
  optimizationGoal: z.string(),
  billingEvent: z.string(),
  bidStrategy: z.string().optional(),
  budgetDefault: z.number().positive(),
  budgetMin: z.number().positive(),
  budgetMax: z.number().positive(),
  destinationType: z.enum(['website', 'app', 'messenger', 'whatsapp', 'instagram', 'phone']),
  destinationConfig: z.record(z.unknown()).optional(),
  specialAdCategories: z.array(z.string()).optional(),
  targetingBase: z.record(z.unknown()).optional(),
  placementConfig: z.record(z.unknown()).optional(),
  copyGuidelines: z.object({
    maxPrimaryLength: z.number().optional(),
    maxHeadlineLength: z.number().optional(),
    maxDescriptionLength: z.number().optional(),
    toneGuidance: z.string().optional(),
    avoidWords: z.array(z.string()).optional(),
    requiredElements: z.array(z.string()).optional()
  }).optional(),
  callToActionOptions: z.array(z.string())
});

// ===========================================
// Helper Functions
// ===========================================

function loadAllTemplates(): TemplateConfig[] {
  try {
    if (!existsSync(TEMPLATES_DIR)) {
      logger.warn('Templates directory not found', { path: TEMPLATES_DIR });
      return [];
    }

    const files = readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));
    const templates: TemplateConfig[] = [];

    for (const file of files) {
      try {
        const content = readFileSync(join(TEMPLATES_DIR, file), 'utf-8');
        const template = JSON.parse(content);
        templates.push(template);
      } catch (error) {
        logger.error('Error loading template', { file, error });
      }
    }

    return templates.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    logger.error('Error reading templates directory', { error });
    return [];
  }
}

function loadTemplate(slug: string): TemplateConfig | null {
  try {
    const templatePath = join(TEMPLATES_DIR, `${slug}.json`);
    if (!existsSync(templatePath)) {
      return null;
    }
    const content = readFileSync(templatePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logger.error('Error loading template', { slug, error });
    return null;
  }
}

// ===========================================
// Routes
// ===========================================

/**
 * GET /api/templates
 * List all available templates
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { objective, destinationType } = req.query;

    let templates = loadAllTemplates();

    // Filter by objective if provided
    if (objective) {
      templates = templates.filter(t => t.objective === objective);
    }

    // Filter by destination type if provided
    if (destinationType) {
      templates = templates.filter(t => t.destinationType === destinationType);
    }

    res.json({
      success: true,
      data: templates.map(t => ({
        slug: t.slug,
        name: t.name,
        description: t.description,
        objective: t.objective,
        destinationType: t.destinationType,
        budgetDefault: t.budgetDefault,
        callToActionOptions: t.callToActionOptions
      })),
      total: templates.length
    });
  } catch (error) {
    logger.error('Error listing templates', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/templates/:slug
 * Get full template configuration
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const template = loadTemplate(slug);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Template not found: ${slug}`
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    logger.error('Error getting template', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/templates
 * Create a new template (admin only in production)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = CreateTemplateSchema.parse(req.body);

    // Check if template already exists
    const existing = loadTemplate(data.slug);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Template with slug '${data.slug}' already exists`
      });
    }

    // Create template file
    const templatePath = join(TEMPLATES_DIR, `${data.slug}.json`);
    const template: TemplateConfig = {
      slug: data.slug,
      name: data.name,
      description: data.description || '',
      objective: data.objective as TemplateConfig['objective'],
      optimizationGoal: data.optimizationGoal as TemplateConfig['optimizationGoal'],
      billingEvent: data.billingEvent as TemplateConfig['billingEvent'],
      bidStrategy: data.bidStrategy || 'LOWEST_COST_WITHOUT_CAP',
      budgetDefault: data.budgetDefault,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      destinationType: data.destinationType,
      destinationConfig: data.destinationConfig || {},
      specialAdCategories: data.specialAdCategories || [],
      targetingBase: data.targetingBase || {
        geo_locations: { countries: ['CO'] },
        age_min: 18,
        age_max: 65
      },
      placementConfig: (data.placementConfig || {
        publisher_platforms: ['facebook', 'instagram'],
        device_platforms: ['mobile', 'desktop']
      }) as TemplateConfig['placementConfig'],
      copyGuidelines: data.copyGuidelines || {
        maxPrimaryLength: 125,
        maxHeadlineLength: 40,
        maxDescriptionLength: 30
      },
      callToActionOptions: data.callToActionOptions as TemplateConfig['callToActionOptions']
    };

    writeFileSync(templatePath, JSON.stringify(template, null, 2));

    logger.info('Template created', { slug: data.slug });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error creating template', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/templates/:slug
 * Update an existing template
 */
router.put('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Check if template exists
    const existing = loadTemplate(slug);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Template not found: ${slug}`
      });
    }

    // Validate and merge updates
    const updates = req.body;
    const updatedTemplate: TemplateConfig = {
      ...existing,
      ...updates,
      slug // Preserve original slug
    };

    // Save updated template
    const templatePath = join(TEMPLATES_DIR, `${slug}.json`);
    writeFileSync(templatePath, JSON.stringify(updatedTemplate, null, 2));

    logger.info('Template updated', { slug });

    res.json({
      success: true,
      message: 'Template updated successfully',
      template: updatedTemplate
    });
  } catch (error) {
    logger.error('Error updating template', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/templates/objectives/list
 * Get list of available objectives
 */
router.get('/objectives/list', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    objectives: [
      { value: 'OUTCOME_AWARENESS', label: 'Awareness', description: 'Brand awareness and reach' },
      { value: 'OUTCOME_ENGAGEMENT', label: 'Engagement', description: 'Post engagement, page likes, event responses' },
      { value: 'OUTCOME_LEADS', label: 'Leads', description: 'Lead generation' },
      { value: 'OUTCOME_SALES', label: 'Sales', description: 'Conversions and catalog sales' },
      { value: 'OUTCOME_TRAFFIC', label: 'Traffic', description: 'Website or app traffic' },
      { value: 'OUTCOME_APP_PROMOTION', label: 'App Promotion', description: 'App installs and engagement' }
    ]
  });
});

/**
 * GET /api/templates/cta/list
 * Get list of available CTAs
 */
router.get('/cta/list', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    callToActions: [
      { value: 'LEARN_MORE', label: 'Mas información' },
      { value: 'SHOP_NOW', label: 'Comprar ahora' },
      { value: 'SIGN_UP', label: 'Registrarse' },
      { value: 'CONTACT_US', label: 'Contáctanos' },
      { value: 'GET_QUOTE', label: 'Obtener cotización' },
      { value: 'BOOK_NOW', label: 'Reservar ahora' },
      { value: 'DOWNLOAD', label: 'Descargar' },
      { value: 'SUBSCRIBE', label: 'Suscribirse' },
      { value: 'APPLY_NOW', label: 'Aplicar ahora' },
      { value: 'SEND_MESSAGE', label: 'Enviar mensaje' },
      { value: 'SEND_WHATSAPP_MESSAGE', label: 'Enviar WhatsApp' },
      { value: 'CALL_NOW', label: 'Llamar ahora' },
      { value: 'GET_DIRECTIONS', label: 'Cómo llegar' },
      { value: 'WATCH_MORE', label: 'Ver más' },
      { value: 'ORDER_NOW', label: 'Ordenar ahora' }
    ]
  });
});

export default router;
