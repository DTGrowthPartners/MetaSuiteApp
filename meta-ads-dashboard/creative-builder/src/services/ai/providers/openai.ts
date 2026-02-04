// ===========================================
// META CREATIVE BUILDER - OpenAI Provider
// ===========================================

import axios from 'axios';
import { config } from '../../../config/index.js';
import { logger } from '../../../utils/logger.js';
import type { CreativeBrief, BestPick } from '../../../types/index.js';

// ===========================================
// OpenAI Provider for Production Use
// ===========================================

export class OpenAIProvider {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = config.ai.openai.apiKey || '';
    this.model = config.ai.openai.model;

    if (!this.apiKey) {
      logger.warn('OpenAI API key not configured');
    }
  }

  // ===========================================
  // Analyze Asset with Vision
  // ===========================================

  async analyzeAsset(params: {
    frames?: string[];        // URLs to extracted frames (base64 or URLs)
    transcription?: string;   // Audio transcription
    ocrText?: string[];      // Text detected via OCR
    assetType: 'VIDEO' | 'IMAGE';
    aspectRatio?: string;
  }): Promise<CreativeBrief> {
    logger.info('OpenAIProvider: Analyzing asset with GPT-4 Vision');

    const systemPrompt = `Eres un experto en marketing digital y publicidad en Meta Ads.
Analiza el contenido visual y textual proporcionado para crear un brief creativo.

Responde SOLO con un JSON válido con esta estructura exacta:
{
  "product_or_service": "string - qué se está vendiendo/ofreciendo",
  "offer": "string o null - oferta específica si existe",
  "category": "ecommerce|service|tourism|education|real_estate|food_beverage|health_wellness|finance|technology|entertainment|other",
  "target_audience": "string - descripción del público objetivo",
  "key_benefits": ["array de 3 beneficios principales"],
  "angle": "urgency|social_proof|price|benefit|aspirational|emotional|educational|fear_of_missing_out|comparison|testimonial",
  "tone": "professional|friendly|professional_friendly|casual|luxury|playful|urgent|empathetic|authoritative",
  "objective_recommended": "traffic_ig_profile|traffic_website|messages_whatsapp|messages_messenger|conversions|engagement|video_views|lead_generation",
  "format": "9:16|1:1|16:9|4:5",
  "detected_text": ["array de textos detectados relevantes"],
  "transcript_summary": "string o null - resumen de la transcripción",
  "safety_flags": ["array de: medical_claims|income_promises|adult_content|violent_content|political_content|alcohol|gambling|tobacco|weapons|discriminatory|copyright_risk|trademark_risk"],
  "suggested_ctas": ["array de 3-5 CTAs recomendados de Meta"]
}`;

    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    // Add text context
    let textContext = '';
    if (params.ocrText && params.ocrText.length > 0) {
      textContext += `\nTexto detectado en la imagen/video:\n${params.ocrText.join('\n')}`;
    }
    if (params.transcription) {
      textContext += `\n\nTranscripción del audio:\n${params.transcription}`;
    }

    userContent.push({
      type: 'text',
      text: `Analiza este contenido de ${params.assetType.toLowerCase()} para crear anuncios en Meta Ads.
Formato detectado: ${params.aspectRatio || 'desconocido'}
${textContext}

Genera el brief creativo en JSON.`
    });

    // Add frames as images (max 4 for cost efficiency)
    if (params.frames && params.frames.length > 0) {
      const framesToAnalyze = params.frames.slice(0, 4);
      for (const frame of framesToAnalyze) {
        userContent.push({
          type: 'image_url',
          image_url: {
            url: frame.startsWith('data:') ? frame : `data:image/jpeg;base64,${frame}`
          }
        });
      }
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          max_tokens: 1500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const brief = JSON.parse(jsonMatch[0]) as CreativeBrief;
      logger.info('OpenAIProvider: Analysis complete', { brief });
      return brief;

    } catch (error) {
      logger.error('OpenAIProvider: Analysis failed', { error });
      throw error;
    }
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
    logger.info('OpenAIProvider: Generating copies with GPT-4');

    const count = params.count || 5;
    const brief = params.brief;

    const systemPrompt = `Eres un copywriter experto en anuncios de Meta Ads para el mercado LATAM (español).
Genera variantes de copy para anuncios siguiendo estas reglas estrictas:

REGLAS PARA COPIES (primary text):
- Entre 80 y 180 caracteres
- Máximo 1 emoji por copy
- Incluir llamado a la acción textual
- Tono: ${brief.tone}
- Ángulo: ${brief.angle}

REGLAS PARA HEADLINES:
- Máximo 40 caracteres
- Sin emojis
- Directo y claro

REGLAS PARA DESCRIPTIONS:
- Máximo 60 caracteres
- Complementar el headline
- Sin emojis

Responde SOLO con JSON válido:
{
  "copies": ["array de ${count} copies"],
  "headlines": ["array de ${count} headlines"],
  "descriptions": ["array de ${count} descriptions"],
  "ctas": ["array de ${count} CTAs de esta lista: LEARN_MORE, SHOP_NOW, SIGN_UP, GET_QUOTE, CONTACT_US, BOOK_TRAVEL, SUBSCRIBE, WHATSAPP_MESSAGE, SEND_MESSAGE"],
  "bestPick": {
    "copyIndex": 0,
    "headlineIndex": 0,
    "descriptionIndex": 0,
    "ctaIndex": 0,
    "score": 0.85,
    "reasoning": "explicación breve de por qué esta combinación es la mejor"
  }
}`;

    const userPrompt = `Genera ${count} variantes de copy para este producto/servicio:

PRODUCTO: ${brief.product_or_service}
OFERTA: ${brief.offer || 'Sin oferta específica'}
CATEGORÍA: ${brief.category}
PÚBLICO: ${brief.target_audience}
BENEFICIOS: ${brief.key_benefits.join(', ')}
ÁNGULO CREATIVO: ${brief.angle}
TONO: ${brief.tone}
CTAs SUGERIDOS: ${brief.suggested_ctas.join(', ')}

Template de campaña: ${params.templateSlug}`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'gpt-4-turbo-preview', // Use turbo for text generation
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 2000,
          temperature: 0.8
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const result = JSON.parse(jsonMatch[0]);

      // Validate and ensure correct counts
      return {
        copies: result.copies?.slice(0, count) || [],
        headlines: result.headlines?.slice(0, count) || [],
        descriptions: result.descriptions?.slice(0, count) || [],
        ctas: result.ctas?.slice(0, count) || [],
        bestPick: result.bestPick || {
          copyIndex: 0,
          headlineIndex: 0,
          descriptionIndex: 0,
          ctaIndex: 0,
          score: 0.8,
          reasoning: 'Selección automática basada en mejores prácticas'
        }
      };

    } catch (error) {
      logger.error('OpenAIProvider: Copy generation failed', { error });
      throw error;
    }
  }

  // ===========================================
  // Transcribe Audio (Whisper)
  // ===========================================

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    logger.info('OpenAIProvider: Transcribing audio with Whisper');

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
    formData.append('file', blob, 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');

    try {
      const response = await axios.post(
        `${this.baseUrl}/audio/transcriptions`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data.text;
    } catch (error) {
      logger.error('OpenAIProvider: Transcription failed', { error });
      throw error;
    }
  }
}

export default OpenAIProvider;
