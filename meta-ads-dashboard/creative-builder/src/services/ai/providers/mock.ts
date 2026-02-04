// ===========================================
// META CREATIVE BUILDER - Mock AI Provider
// ===========================================

import type { CreativeBrief, BestPick } from '../../../types/index.js';
import { logger } from '../../../utils/logger.js';

// ===========================================
// Mock Provider for Development/Testing
// ===========================================

export class MockAIProvider {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===========================================
  // Analyze Asset
  // ===========================================

  async analyzeAsset(params: {
    frames?: string[];        // URLs to extracted frames
    transcription?: string;   // Audio transcription
    ocrText?: string[];      // Text detected via OCR
    assetType: 'VIDEO' | 'IMAGE';
    aspectRatio?: string;
  }): Promise<CreativeBrief> {
    logger.info('MockAIProvider: Analyzing asset', {
      assetType: params.assetType,
      framesCount: params.frames?.length,
      hasTranscription: !!params.transcription,
      ocrTextCount: params.ocrText?.length
    });

    // Simulate processing time
    await this.delay(1500);

    // Extract context from OCR text
    const detectedText = params.ocrText || [];
    const transcription = params.transcription || '';

    // Generate mock analysis based on detected text
    const hasDiscount = detectedText.some(t =>
      t.toLowerCase().includes('descuento') ||
      t.toLowerCase().includes('off') ||
      t.toLowerCase().includes('%')
    );

    const hasUrgency = detectedText.some(t =>
      t.toLowerCase().includes('hoy') ||
      t.toLowerCase().includes('ahora') ||
      t.toLowerCase().includes('último')
    );

    // Mock creative brief
    const brief: CreativeBrief = {
      product_or_service: this.detectProduct(detectedText, transcription),
      offer: hasDiscount ? 'Descuento especial por tiempo limitado' : undefined,
      category: this.detectCategory(detectedText, transcription),
      target_audience: 'Adultos 25-45 años interesados en el producto/servicio',
      key_benefits: [
        'Calidad garantizada',
        'Envío rápido',
        'Atención personalizada'
      ],
      angle: hasUrgency ? 'urgency' : hasDiscount ? 'price' : 'benefit',
      tone: 'professional_friendly',
      objective_recommended: 'traffic_ig_profile',
      format: params.aspectRatio as CreativeBrief['format'] || '9:16',
      detected_text: detectedText.slice(0, 10),
      transcript_summary: transcription
        ? transcription.substring(0, 200) + '...'
        : undefined,
      safety_flags: this.detectSafetyFlags(detectedText, transcription),
      suggested_ctas: ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP']
    };

    logger.info('MockAIProvider: Analysis complete', { brief });
    return brief;
  }

  // ===========================================
  // Generate Copy Variations
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
    logger.info('MockAIProvider: Generating copies', {
      product: params.brief.product_or_service,
      angle: params.brief.angle,
      templateSlug: params.templateSlug
    });

    await this.delay(2000);

    const count = params.count || 5;
    const product = params.brief.product_or_service;
    const angle = params.brief.angle;

    // Generate mock copies based on angle
    const copies = this.generateMockCopies(product, angle, count);
    const headlines = this.generateMockHeadlines(product, count);
    const descriptions = this.generateMockDescriptions(product, count);
    const ctas = this.selectCtas(params.brief.suggested_ctas, count);

    // Calculate best pick with simple scoring
    const bestPick: BestPick = {
      copyIndex: 0,
      headlineIndex: 0,
      descriptionIndex: 0,
      ctaIndex: 0,
      score: 0.85,
      reasoning: `Combinación óptima: Copy con ${angle}, headline directo, y CTA ${ctas[0]}`
    };

    return {
      copies,
      headlines,
      descriptions,
      ctas,
      bestPick
    };
  }

  // ===========================================
  // Helper Methods
  // ===========================================

  private detectProduct(ocrText: string[], transcription: string): string {
    // Simple heuristic - in production would use AI
    const allText = [...ocrText, transcription].join(' ').toLowerCase();

    if (allText.includes('curso') || allText.includes('aprende')) {
      return 'Curso Online';
    }
    if (allText.includes('ropa') || allText.includes('moda')) {
      return 'Colección de Moda';
    }
    if (allText.includes('comida') || allText.includes('restaurante')) {
      return 'Servicio de Comida';
    }
    if (allText.includes('viaje') || allText.includes('hotel')) {
      return 'Paquete Turístico';
    }

    return 'Producto/Servicio';
  }

  private detectCategory(ocrText: string[], transcription: string): CreativeBrief['category'] {
    const allText = [...ocrText, transcription].join(' ').toLowerCase();

    if (allText.includes('curso') || allText.includes('aprende') || allText.includes('educación')) {
      return 'education';
    }
    if (allText.includes('viaje') || allText.includes('hotel') || allText.includes('turismo')) {
      return 'tourism';
    }
    if (allText.includes('tienda') || allText.includes('compra') || allText.includes('envío')) {
      return 'ecommerce';
    }
    if (allText.includes('salud') || allText.includes('fitness') || allText.includes('gym')) {
      return 'health_wellness';
    }

    return 'service';
  }

  private detectSafetyFlags(ocrText: string[], transcription: string): CreativeBrief['safety_flags'] {
    const flags: CreativeBrief['safety_flags'] = [];
    const allText = [...ocrText, transcription].join(' ').toLowerCase();

    if (allText.includes('cura') || allText.includes('medicina') || allText.includes('tratamiento')) {
      flags.push('medical_claims');
    }
    if (allText.includes('ganar dinero') || allText.includes('ingresos') || allText.includes('hazte rico')) {
      flags.push('income_promises');
    }
    if (allText.includes('alcohol') || allText.includes('cerveza') || allText.includes('vino')) {
      flags.push('alcohol');
    }

    return flags;
  }

  private generateMockCopies(product: string, angle: string, count: number): string[] {
    const templates: Record<string, string[]> = {
      urgency: [
        `⏰ ¡Solo por hoy! ${product} con descuento especial. No dejes pasar esta oportunidad única.`,
        `¡Últimas unidades de ${product}! Aprovecha antes de que se agoten. Compra ahora.`,
        `🔥 Oferta flash: ${product} al mejor precio. Solo quedan pocas horas para aprovechar.`,
        `¡Hoy es el día! ${product} con precio especial que no volverás a ver. Actúa ya.`,
        `⚡ Promo relámpago de ${product}. Miles ya lo aprovecharon, ¿y tú qué esperas?`
      ],
      price: [
        `💰 ${product} al precio más bajo del mercado. Calidad garantizada sin pagar de más.`,
        `Descubre ${product} con el mejor precio-calidad. Tu bolsillo te lo agradecerá.`,
        `${product} premium a precio accesible. No sacrifiques calidad por economía.`,
        `🏷️ Precio especial en ${product}. La misma calidad que amas, por menos dinero.`,
        `Ahorra en grande con ${product}. Precios increíbles que no encontrarás en otro lado.`
      ],
      benefit: [
        `✨ Transforma tu vida con ${product}. Miles de clientes satisfechos ya lo comprueban.`,
        `${product}: la solución que estabas buscando. Resultados garantizados desde el día uno.`,
        `Descubre por qué ${product} es la elección #1. Beneficios que marcan la diferencia.`,
        `🌟 ${product} cambiará tu forma de ver las cosas. Pruébalo y compruébalo tú mismo.`,
        `Eleva tu experiencia con ${product}. Calidad superior que se nota en cada detalle.`
      ],
      social_proof: [
        `📊 +10,000 clientes felices con ${product}. Únete a la comunidad de satisfechos.`,
        `${product} es tendencia. Descubre por qué todos están hablando de nosotros.`,
        `⭐⭐⭐⭐⭐ Calificación perfecta para ${product}. Lee las reseñas de clientes reales.`,
        `La elección favorita: ${product}. Miles confían en nosotros, ¿y tú?`,
        `Recomendado por expertos: ${product}. La calidad que los profesionales eligen.`
      ],
      aspirational: [
        `🚀 Alcanza tus metas con ${product}. El primer paso hacia tu mejor versión.`,
        `${product}: para quienes buscan lo mejor. Porque tú mereces calidad premium.`,
        `Imagina lograr más con ${product}. Haz realidad tus sueños hoy mismo.`,
        `✨ Vive la experiencia ${product}. Exclusividad y calidad en cada detalle.`,
        `Eleva tu estilo de vida con ${product}. Para quienes no se conforman con menos.`
      ]
    };

    const copies = templates[angle] || templates.benefit;
    return copies.slice(0, count);
  }

  private generateMockHeadlines(product: string, count: number): string[] {
    const headlines = [
      `${product} Premium`,
      `Descubre ${product}`,
      `${product} - Oferta`,
      `Lo mejor en ${product}`,
      `${product} para ti`
    ];
    return headlines.slice(0, count).map(h => h.substring(0, 40));
  }

  private generateMockDescriptions(product: string, count: number): string[] {
    const descriptions = [
      `Calidad garantizada en ${product}`,
      `Envío gratis en tu primera compra`,
      `Atención 24/7 para tu ${product}`,
      `Devolución sin preguntas`,
      `Únete a miles de clientes felices`
    ];
    return descriptions.slice(0, count).map(d => d.substring(0, 60));
  }

  private selectCtas(suggested: string[], count: number): string[] {
    const defaultCtas = ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'GET_QUOTE', 'CONTACT_US'];
    const ctas = [...new Set([...suggested, ...defaultCtas])];
    return ctas.slice(0, count);
  }
}

export default MockAIProvider;
