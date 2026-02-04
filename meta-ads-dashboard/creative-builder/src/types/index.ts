// ===========================================
// META CREATIVE BUILDER - Type Definitions
// ===========================================

import { z } from 'zod';

// ===========================================
// Creative Brief Schema
// ===========================================

export const CreativeBriefSchema = z.object({
  product_or_service: z.string(),
  offer: z.string().optional(),
  category: z.enum([
    'ecommerce',
    'service',
    'tourism',
    'education',
    'real_estate',
    'food_beverage',
    'health_wellness',
    'finance',
    'technology',
    'entertainment',
    'other'
  ]),
  target_audience: z.string(),
  key_benefits: z.array(z.string()),
  angle: z.enum([
    'urgency',
    'social_proof',
    'price',
    'benefit',
    'aspirational',
    'emotional',
    'educational',
    'fear_of_missing_out',
    'comparison',
    'testimonial'
  ]),
  tone: z.enum([
    'professional',
    'friendly',
    'professional_friendly',
    'casual',
    'luxury',
    'playful',
    'urgent',
    'empathetic',
    'authoritative'
  ]),
  objective_recommended: z.enum([
    'traffic_ig_profile',
    'traffic_website',
    'messages_whatsapp',
    'messages_messenger',
    'conversions',
    'engagement',
    'video_views',
    'lead_generation'
  ]),
  format: z.enum(['9:16', '1:1', '16:9', '4:5']),
  detected_text: z.array(z.string()),
  transcript_summary: z.string().optional(),
  safety_flags: z.array(z.enum([
    'medical_claims',
    'income_promises',
    'adult_content',
    'violent_content',
    'political_content',
    'alcohol',
    'gambling',
    'tobacco',
    'weapons',
    'discriminatory',
    'copyright_risk',
    'trademark_risk'
  ])),
  suggested_ctas: z.array(z.string())
});

export type CreativeBrief = z.infer<typeof CreativeBriefSchema>;

// ===========================================
// Generated Content Schemas
// ===========================================

export const CopyVariantSchema = z.object({
  text: z.string().min(50).max(200),
  charCount: z.number(),
  hasEmoji: z.boolean(),
  hasCta: z.boolean(),
  angle: z.string().optional()
});

export const HeadlineVariantSchema = z.object({
  text: z.string().max(40),
  charCount: z.number()
});

export const DescriptionVariantSchema = z.object({
  text: z.string().max(60),
  charCount: z.number()
});

export const BestPickSchema = z.object({
  copyIndex: z.number().min(0).max(4),
  headlineIndex: z.number().min(0).max(4),
  descriptionIndex: z.number().min(0).max(4),
  ctaIndex: z.number().min(0).max(4),
  score: z.number().min(0).max(1),
  reasoning: z.string()
});

export type CopyVariant = z.infer<typeof CopyVariantSchema>;
export type HeadlineVariant = z.infer<typeof HeadlineVariantSchema>;
export type DescriptionVariant = z.infer<typeof DescriptionVariantSchema>;
export type BestPick = z.infer<typeof BestPickSchema>;

// ===========================================
// Meta API Types
// ===========================================

export const MetaObjectiveEnum = z.enum([
  'OUTCOME_AWARENESS',
  'OUTCOME_ENGAGEMENT',
  'OUTCOME_LEADS',
  'OUTCOME_SALES',
  'OUTCOME_TRAFFIC',
  'OUTCOME_APP_PROMOTION'
]);

export const MetaOptimizationGoalEnum = z.enum([
  'NONE',
  'APP_INSTALLS',
  'AD_RECALL_LIFT',
  'ENGAGED_USERS',
  'EVENT_RESPONSES',
  'IMPRESSIONS',
  'LEAD_GENERATION',
  'QUALITY_LEAD',
  'LINK_CLICKS',
  'OFFSITE_CONVERSIONS',
  'PAGE_LIKES',
  'POST_ENGAGEMENT',
  'QUALITY_CALL',
  'REACH',
  'LANDING_PAGE_VIEWS',
  'VISIT_INSTAGRAM_PROFILE',
  'VALUE',
  'THRUPLAY',
  'DERIVED_EVENTS',
  'APP_INSTALLS_AND_OFFSITE_CONVERSIONS',
  'CONVERSATIONS',
  'IN_APP_VALUE'
]);

export const MetaBillingEventEnum = z.enum([
  'APP_INSTALLS',
  'CLICKS',
  'IMPRESSIONS',
  'LINK_CLICKS',
  'NONE',
  'OFFER_CLAIMS',
  'PAGE_LIKES',
  'POST_ENGAGEMENT',
  'THRUPLAY',
  'PURCHASE',
  'LISTING_INTERACTION'
]);

export const MetaCallToActionEnum = z.enum([
  'BOOK_TRAVEL',
  'CONTACT_US',
  'DONATE',
  'DONATE_NOW',
  'DOWNLOAD',
  'GET_DIRECTIONS',
  'GET_OFFER',
  'GET_OFFER_VIEW',
  'GET_QUOTE',
  'GET_SHOWTIMES',
  'INSTALL_APP',
  'INSTALL_MOBILE_APP',
  'LEARN_MORE',
  'LIKE_PAGE',
  'LISTEN_MUSIC',
  'LISTEN_NOW',
  'MESSAGE_PAGE',
  'MOBILE_DOWNLOAD',
  'NO_BUTTON',
  'OPEN_LINK',
  'ORDER_NOW',
  'PAY_TO_ACCESS',
  'PLAY_GAME',
  'PLAY_GAME_ON_FACEBOOK',
  'PURCHASE_GIFT_CARDS',
  'RECORD_NOW',
  'REQUEST_TIME',
  'SAY_THANKS',
  'SEE_MORE',
  'SELL_NOW',
  'SEND_A_GIFT',
  'SEND_UPDATES',
  'SHARE',
  'SHOP_NOW',
  'SIGN_UP',
  'SOTTO_SUBSCRIBE',
  'START_ORDER',
  'SUBSCRIBE',
  'SWIPE_UP_PRODUCT',
  'SWIPE_UP_SHOP',
  'UPDATE_APP',
  'USE_APP',
  'USE_MOBILE_APP',
  'VIDEO_ANNOTATION',
  'VIDEO_CALL',
  'VISIT_PAGES_FEED',
  'WATCH_MORE',
  'WATCH_VIDEO',
  'WHATSAPP_MESSAGE',
  'WOODHENGE_SUPPORT'
]);

export type MetaObjective = z.infer<typeof MetaObjectiveEnum>;
export type MetaOptimizationGoal = z.infer<typeof MetaOptimizationGoalEnum>;
export type MetaBillingEvent = z.infer<typeof MetaBillingEventEnum>;
export type MetaCallToAction = z.infer<typeof MetaCallToActionEnum>;

// ===========================================
// API Request/Response Types
// ===========================================

export interface CreateJobRequest {
  clientId: string;
  adAccountId: string;
  assetId: string;
  templateSlug: string;
}

export interface SelectVariantsRequest {
  selectedCopy: number;
  selectedHeadline: number;
  selectedDescription: number;
  selectedCta: number;
  customCampaignName?: string;
  customBudget?: number;
}

export interface CreateDraftRequest {
  jobId: string;
  campaignName?: string;
  dailyBudget?: number;
}

export interface JobResponse {
  id: string;
  status: string;
  asset: {
    id: string;
    type: string;
    filename: string;
    thumbnailUrl?: string;
  };
  template: {
    slug: string;
    name: string;
  };
  creativeBrief?: CreativeBrief;
  copies?: string[];
  headlines?: string[];
  descriptions?: string[];
  ctas?: string[];
  bestPick?: BestPick;
  selectedCopy?: number;
  selectedHeadline?: number;
  selectedDescription?: number;
  selectedCta?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftResponse {
  id: string;
  jobId: string;
  campaignId?: string;
  adSetId?: string;
  creativeId?: string;
  adId?: string;
  status: {
    campaign: string;
    adSet: string;
    creative: string;
    ad: string;
  };
  urls: {
    campaign?: string;
    adSet?: string;
    ad?: string;
    preview?: string;
  };
  createdAt: string;
}

// ===========================================
// Template Types
// ===========================================

export interface TemplateConfig {
  slug: string;
  name: string;
  description: string;
  category: string;

  // Campaign
  objective: MetaObjective;
  specialAdCategories: string[];

  // AdSet
  optimizationGoal: MetaOptimizationGoal;
  billingEvent: MetaBillingEvent;
  bidStrategy?: string;
  placements: PlacementConfig;
  budgetType: 'daily' | 'lifetime';
  budgetDefault: number;
  budgetMin: number;
  budgetMax?: number;
  targetingBase?: TargetingConfig;

  // Creative
  creativeFormat: 'video' | 'image';
  allowedCtas: MetaCallToAction[];
  defaultCta: MetaCallToAction;

  // Destination
  destinationType: 'ig_profile' | 'whatsapp' | 'website' | 'messenger';
  destinationConfig: DestinationConfig;
}

export interface PlacementConfig {
  facebook: string[];
  instagram: string[];
  audience_network?: string[];
  messenger?: string[];
}

export interface TargetingConfig {
  geo_locations?: {
    countries?: string[];
    cities?: Array<{ key: string; name: string }>;
  };
  age_min?: number;
  age_max?: number;
  genders?: number[];
  locales?: number[];
  publisher_platforms?: string[];
  facebook_positions?: string[];
  instagram_positions?: string[];
}

export interface DestinationConfig {
  type: string;
  url?: string;
  pageId?: string;
  igActorId?: string;
  whatsappNumber?: string;
  pixelId?: string;
}

// ===========================================
// Media Processing Types
// ===========================================

export interface VideoAnalysisResult {
  frames: string[];       // URLs to extracted frames
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
  fps: number;
  hasAudio: boolean;
}

export interface TranscriptionResult {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  language: string;
}

export interface OcrResult {
  frameIndex: number;
  frameUrl: string;
  detectedText: string[];
  confidence: number;
}

// ===========================================
// Queue Job Types
// ===========================================

export interface AnalyzeJobData {
  jobId: string;
  assetId: string;
  assetType: 'VIDEO' | 'IMAGE';
  assetUrl: string;
}

export interface GenerateJobData {
  jobId: string;
  creativeBrief: CreativeBrief;
  templateSlug: string;
}

export interface PublishJobData {
  jobId: string;
  draftId: string;
  adAccountId: string;
  metaAccountId: string;
  pageId: string;
  igActorId?: string;
  accessToken: string;
}
