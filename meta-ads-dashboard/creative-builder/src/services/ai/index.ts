// ===========================================
// META CREATIVE BUILDER - AI Service
// ===========================================

import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { MockAIProvider } from './providers/mock.js';
import { OpenAIProvider } from './providers/openai.js';
import type { CreativeBrief, BestPick } from '../../types/index.js';

// ===========================================
// AI Provider Interface
// ===========================================

export interface AIProvider {
  analyzeAsset(params: {
    frames?: string[];
    transcription?: string;
    ocrText?: string[];
    assetType: 'VIDEO' | 'IMAGE';
    aspectRatio?: string;
  }): Promise<CreativeBrief>;

  generateCopies(params: {
    brief: CreativeBrief;
    templateSlug: string;
    count?: number;
  }): Promise<{
    copies: string[];
    headlines: string[];
    descriptions: string[];
    ctas: string[];
    bestPick: BestPick;
  }>;
}

// ===========================================
// AI Service Factory
// ===========================================

export class AIService {
  private provider: AIProvider;

  constructor() {
    // Select provider based on configuration
    switch (config.ai.provider) {
      case 'openai':
        if (!config.ai.openai.apiKey) {
          logger.warn('OpenAI API key not configured, falling back to mock provider');
          this.provider = new MockAIProvider();
        } else {
          this.provider = new OpenAIProvider();
        }
        break;

      case 'anthropic':
        // TODO: Implement AnthropicProvider
        logger.warn('Anthropic provider not implemented, falling back to mock');
        this.provider = new MockAIProvider();
        break;

      case 'mock':
      default:
        this.provider = new MockAIProvider();
        break;
    }

    logger.info(`AI Service initialized with provider: ${config.ai.provider}`);
  }

  // ===========================================
  // Analyze Asset
  // ===========================================

  async analyzeAsset(params: {
    frames?: string[];
    transcription?: string;
    ocrText?: string[];
    assetType: 'VIDEO' | 'IMAGE';
    aspectRatio?: string;
  }): Promise<CreativeBrief> {
    logger.info('AIService: Starting asset analysis', {
      assetType: params.assetType,
      framesCount: params.frames?.length
    });

    try {
      const brief = await this.provider.analyzeAsset(params);

      // Validate and sanitize the brief
      return this.validateBrief(brief);
    } catch (error) {
      logger.error('AIService: Asset analysis failed', { error });
      throw error;
    }
  }

  // ===========================================
  // Generate Copies
  // ===========================================

  async generateCopies(params: {
    brief: CreativeBrief;
    templateSlug: string;
    count?: number;
  }): Promise<{
    copies: string[];
    headlines: string[];
    descriptions: string[];
    ctas: string[];
    bestPick: BestPick;
  }> {
    logger.info('AIService: Starting copy generation', {
      product: params.brief.product_or_service,
      templateSlug: params.templateSlug
    });

    try {
      const result = await this.provider.generateCopies(params);

      // Validate and ensure rules compliance
      return this.validateCopies(result);
    } catch (error) {
      logger.error('AIService: Copy generation failed', { error });
      throw error;
    }
  }

  // ===========================================
  // Validation Helpers
  // ===========================================

  private validateBrief(brief: CreativeBrief): CreativeBrief {
    // Ensure required fields have values
    return {
      product_or_service: brief.product_or_service || 'Producto/Servicio',
      offer: brief.offer,
      category: brief.category || 'other',
      target_audience: brief.target_audience || 'Público general',
      key_benefits: brief.key_benefits?.length ? brief.key_benefits : ['Calidad', 'Servicio', 'Precio'],
      angle: brief.angle || 'benefit',
      tone: brief.tone || 'professional_friendly',
      objective_recommended: brief.objective_recommended || 'traffic_ig_profile',
      format: brief.format || '9:16',
      detected_text: brief.detected_text || [],
      transcript_summary: brief.transcript_summary,
      safety_flags: brief.safety_flags || [],
      suggested_ctas: brief.suggested_ctas?.length ? brief.suggested_ctas : ['LEARN_MORE', 'SHOP_NOW']
    };
  }

  private validateCopies(result: {
    copies: string[];
    headlines: string[];
    descriptions: string[];
    ctas: string[];
    bestPick: BestPick;
  }): typeof result {
    const { copyRules } = config;

    // Validate and truncate copies
    const validatedCopies = result.copies.map(copy => {
      let text = copy.trim();

      // Ensure within length limits
      if (text.length > copyRules.primary.maxLength) {
        text = text.substring(0, copyRules.primary.maxLength - 3) + '...';
      }

      // Count emojis (simple regex for common emojis)
      const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
      if (emojiCount > copyRules.primary.maxEmojis) {
        // Remove excess emojis
        const emojis = text.match(/[\u{1F300}-\u{1F9FF}]/gu) || [];
        for (let i = copyRules.primary.maxEmojis; i < emojis.length; i++) {
          text = text.replace(emojis[i], '');
        }
      }

      return text;
    });

    // Validate headlines
    const validatedHeadlines = result.headlines.map(headline => {
      const text = headline.trim();
      return text.length > copyRules.headline.maxLength
        ? text.substring(0, copyRules.headline.maxLength)
        : text;
    });

    // Validate descriptions
    const validatedDescriptions = result.descriptions.map(desc => {
      const text = desc.trim();
      return text.length > copyRules.description.maxLength
        ? text.substring(0, copyRules.description.maxLength)
        : text;
    });

    // Validate CTAs against Meta's allowed list
    const allowedCtas = [
      'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'GET_QUOTE', 'CONTACT_US',
      'BOOK_TRAVEL', 'SUBSCRIBE', 'WHATSAPP_MESSAGE', 'SEND_MESSAGE',
      'DOWNLOAD', 'GET_OFFER', 'ORDER_NOW', 'WATCH_MORE'
    ];

    const validatedCtas = result.ctas
      .filter(cta => allowedCtas.includes(cta))
      .slice(0, 5);

    // Ensure we have at least some CTAs
    if (validatedCtas.length === 0) {
      validatedCtas.push('LEARN_MORE', 'SHOP_NOW');
    }

    // Validate best pick indices
    const validatedBestPick: BestPick = {
      copyIndex: Math.min(result.bestPick.copyIndex, validatedCopies.length - 1),
      headlineIndex: Math.min(result.bestPick.headlineIndex, validatedHeadlines.length - 1),
      descriptionIndex: Math.min(result.bestPick.descriptionIndex, validatedDescriptions.length - 1),
      ctaIndex: Math.min(result.bestPick.ctaIndex, validatedCtas.length - 1),
      score: Math.max(0, Math.min(1, result.bestPick.score)),
      reasoning: result.bestPick.reasoning || 'Selección optimizada automáticamente'
    };

    return {
      copies: validatedCopies,
      headlines: validatedHeadlines,
      descriptions: validatedDescriptions,
      ctas: validatedCtas,
      bestPick: validatedBestPick
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
