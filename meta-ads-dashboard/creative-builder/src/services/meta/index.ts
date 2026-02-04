// ===========================================
// META CREATIVE BUILDER - Meta API Service
// ===========================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import { config } from '../../config/index.js';
import { logger, logMetaApiCall } from '../../utils/logger.js';
import { sanitizeForLogging } from '../../utils/encryption.js';
import type {
  MetaObjective,
  MetaOptimizationGoal,
  MetaBillingEvent,
  MetaCallToAction,
  TargetingConfig,
  PlacementConfig
} from '../../types/index.js';

// ===========================================
// Types
// ===========================================

export interface MetaApiError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

export interface MetaApiResponse<T> {
  success: boolean;
  data?: T;
  error?: MetaApiError;
}

export interface UploadVideoResponse {
  id: string;
  status?: string;
}

export interface UploadImageResponse {
  hash: string;
  url?: string;
}

export interface CreateCampaignResponse {
  id: string;
}

export interface CreateAdSetResponse {
  id: string;
}

export interface CreateCreativeResponse {
  id: string;
}

export interface CreateAdResponse {
  id: string;
}

// ===========================================
// Meta API Client
// ===========================================

export class MetaApiClient {
  private client: AxiosInstance;
  private accessToken: string;
  private adAccountId: string;

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    this.client = axios.create({
      baseURL: config.meta.baseUrl,
      timeout: 60000, // 60 seconds for uploads
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((request) => {
      logger.debug('Meta API Request', {
        method: request.method?.toUpperCase(),
        url: request.url,
        params: sanitizeForLogging(request.params || {})
      });
      return request;
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Meta API Response', {
          status: response.status,
          data: sanitizeForLogging(response.data || {})
        });
        return response;
      },
      (error: AxiosError<{ error: MetaApiError }>) => {
        const metaError = error.response?.data?.error;
        logger.error('Meta API Error', {
          status: error.response?.status,
          error: metaError
        });
        return Promise.reject(error);
      }
    );
  }

  // ===========================================
  // Helper Methods
  // ===========================================

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    data?: Record<string, unknown>,
    formData?: FormData
  ): Promise<MetaApiResponse<T>> {
    const startTime = Date.now();
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    try {
      let response;

      if (formData) {
        response = await this.client.request({
          method,
          url,
          data: formData,
          headers: formData.getHeaders(),
          params: { access_token: this.accessToken }
        });
      } else {
        response = await this.client.request({
          method,
          url,
          data: method === 'POST' ? data : undefined,
          params: {
            access_token: this.accessToken,
            ...(method === 'GET' ? data : {})
          }
        });
      }

      const duration = Date.now() - startTime;
      logMetaApiCall(endpoint, method, true, duration);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const axiosError = error as AxiosError<{ error: MetaApiError }>;
      const metaError = axiosError.response?.data?.error;

      logMetaApiCall(endpoint, method, false, duration, metaError?.message);

      return {
        success: false,
        error: metaError || {
          message: axiosError.message,
          type: 'UNKNOWN',
          code: axiosError.response?.status || 500
        }
      };
    }
  }

  // ===========================================
  // Video Upload
  // ===========================================

  async uploadVideo(
    fileBuffer: Buffer,
    filename: string
  ): Promise<MetaApiResponse<UploadVideoResponse>> {
    const formData = new FormData();
    formData.append('source', fileBuffer, {
      filename,
      contentType: 'video/mp4'
    });

    return this.makeRequest<UploadVideoResponse>(
      'POST',
      `${this.adAccountId}/advideos`,
      undefined,
      formData
    );
  }

  async uploadVideoFromUrl(
    fileUrl: string
  ): Promise<MetaApiResponse<UploadVideoResponse>> {
    return this.makeRequest<UploadVideoResponse>(
      'POST',
      `${this.adAccountId}/advideos`,
      { file_url: fileUrl }
    );
  }

  async getVideoStatus(videoId: string): Promise<MetaApiResponse<{ status: { video_status: string } }>> {
    return this.makeRequest('GET', `/${videoId}`, {
      fields: 'status'
    });
  }

  // ===========================================
  // Image Upload
  // ===========================================

  async uploadImage(
    fileBuffer: Buffer,
    filename: string
  ): Promise<MetaApiResponse<{ images: Record<string, UploadImageResponse> }>> {
    const formData = new FormData();
    formData.append('filename', filename);
    formData.append('bytes', fileBuffer.toString('base64'));

    return this.makeRequest(
      'POST',
      `${this.adAccountId}/adimages`,
      undefined,
      formData
    );
  }

  async uploadImageFromUrl(
    fileUrl: string
  ): Promise<MetaApiResponse<{ images: Record<string, UploadImageResponse> }>> {
    return this.makeRequest(
      'POST',
      `${this.adAccountId}/adimages`,
      { url: fileUrl }
    );
  }

  // ===========================================
  // Campaign Management
  // ===========================================

  async createCampaign(params: {
    name: string;
    objective: MetaObjective;
    status?: 'ACTIVE' | 'PAUSED';
    special_ad_categories?: string[];
    buying_type?: string;
  }): Promise<MetaApiResponse<CreateCampaignResponse>> {
    return this.makeRequest<CreateCampaignResponse>(
      'POST',
      `${this.adAccountId}/campaigns`,
      {
        name: params.name,
        objective: params.objective,
        status: params.status || 'PAUSED',
        special_ad_categories: params.special_ad_categories || [],
        buying_type: params.buying_type || 'AUCTION'
      }
    );
  }

  async updateCampaignStatus(
    campaignId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<MetaApiResponse<{ success: boolean }>> {
    return this.makeRequest(
      'POST',
      `/${campaignId}`,
      { status }
    );
  }

  // ===========================================
  // Ad Set Management
  // ===========================================

  async createAdSet(params: {
    name: string;
    campaign_id: string;
    optimization_goal: MetaOptimizationGoal;
    billing_event: MetaBillingEvent;
    bid_strategy?: string;
    daily_budget?: number;
    lifetime_budget?: number;
    targeting: TargetingConfig;
    status?: 'ACTIVE' | 'PAUSED';
    start_time?: string;
    end_time?: string;
    promoted_object?: {
      page_id?: string;
      pixel_id?: string;
      application_id?: string;
    };
    destination_type?: string;
  }): Promise<MetaApiResponse<CreateAdSetResponse>> {
    const data: Record<string, unknown> = {
      name: params.name,
      campaign_id: params.campaign_id,
      optimization_goal: params.optimization_goal,
      billing_event: params.billing_event,
      targeting: params.targeting,
      status: params.status || 'PAUSED'
    };

    if (params.bid_strategy) {
      data.bid_strategy = params.bid_strategy;
    }

    if (params.daily_budget) {
      data.daily_budget = params.daily_budget;
    }

    if (params.lifetime_budget) {
      data.lifetime_budget = params.lifetime_budget;
    }

    if (params.start_time) {
      data.start_time = params.start_time;
    }

    if (params.end_time) {
      data.end_time = params.end_time;
    }

    if (params.promoted_object) {
      data.promoted_object = params.promoted_object;
    }

    if (params.destination_type) {
      data.destination_type = params.destination_type;
    }

    return this.makeRequest<CreateAdSetResponse>(
      'POST',
      `${this.adAccountId}/adsets`,
      data
    );
  }

  // ===========================================
  // Creative Management
  // ===========================================

  async createCreativeWithVideo(params: {
    name: string;
    pageId: string;
    igActorId?: string;
    videoId: string;
    thumbnailUrl?: string;
    primaryText: string;
    headline?: string;
    description?: string;
    callToAction: MetaCallToAction;
    linkUrl?: string;
    websiteUrl?: string;
  }): Promise<MetaApiResponse<CreateCreativeResponse>> {
    const videoData: Record<string, unknown> = {
      video_id: params.videoId,
      message: params.primaryText,
      call_to_action: {
        type: params.callToAction,
        value: params.linkUrl ? { link: params.linkUrl } : undefined
      }
    };

    if (params.thumbnailUrl) {
      videoData.image_url = params.thumbnailUrl;
    }

    if (params.headline) {
      videoData.title = params.headline;
    }

    if (params.description) {
      videoData.link_description = params.description;
    }

    const objectStorySpec: Record<string, unknown> = {
      page_id: params.pageId,
      video_data: videoData
    };

    if (params.igActorId) {
      objectStorySpec.instagram_actor_id = params.igActorId;
    }

    return this.makeRequest<CreateCreativeResponse>(
      'POST',
      `${this.adAccountId}/adcreatives`,
      {
        name: params.name,
        object_story_spec: objectStorySpec
      }
    );
  }

  async createCreativeWithImage(params: {
    name: string;
    pageId: string;
    igActorId?: string;
    imageHash: string;
    primaryText: string;
    headline?: string;
    description?: string;
    callToAction: MetaCallToAction;
    linkUrl?: string;
  }): Promise<MetaApiResponse<CreateCreativeResponse>> {
    const linkData: Record<string, unknown> = {
      image_hash: params.imageHash,
      message: params.primaryText,
      call_to_action: {
        type: params.callToAction,
        value: params.linkUrl ? { link: params.linkUrl } : undefined
      }
    };

    if (params.headline) {
      linkData.name = params.headline;
    }

    if (params.description) {
      linkData.description = params.description;
    }

    if (params.linkUrl) {
      linkData.link = params.linkUrl;
    }

    const objectStorySpec: Record<string, unknown> = {
      page_id: params.pageId,
      link_data: linkData
    };

    if (params.igActorId) {
      objectStorySpec.instagram_actor_id = params.igActorId;
    }

    return this.makeRequest<CreateCreativeResponse>(
      'POST',
      `${this.adAccountId}/adcreatives`,
      {
        name: params.name,
        object_story_spec: objectStorySpec
      }
    );
  }

  // ===========================================
  // Ad Management
  // ===========================================

  async createAd(params: {
    name: string;
    adset_id: string;
    creative_id: string;
    status?: 'ACTIVE' | 'PAUSED';
  }): Promise<MetaApiResponse<CreateAdResponse>> {
    return this.makeRequest<CreateAdResponse>(
      'POST',
      `${this.adAccountId}/ads`,
      {
        name: params.name,
        adset_id: params.adset_id,
        creative: { creative_id: params.creative_id },
        status: params.status || 'PAUSED'
      }
    );
  }

  async updateAdStatus(
    adId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<MetaApiResponse<{ success: boolean }>> {
    return this.makeRequest(
      'POST',
      `/${adId}`,
      { status }
    );
  }

  // ===========================================
  // Utility Methods
  // ===========================================

  async getAccountInfo(): Promise<MetaApiResponse<{
    id: string;
    name: string;
    currency: string;
    timezone_name: string;
  }>> {
    return this.makeRequest('GET', `/${this.adAccountId}`, {
      fields: 'id,name,currency,timezone_name'
    });
  }

  async getPages(): Promise<MetaApiResponse<{
    data: Array<{ id: string; name: string; access_token: string }>
  }>> {
    return this.makeRequest('GET', '/me/accounts', {
      fields: 'id,name,access_token'
    });
  }

  async getInstagramAccounts(pageId: string): Promise<MetaApiResponse<{
    data: Array<{ id: string; username: string }>
  }>> {
    return this.makeRequest('GET', `/${pageId}/instagram_accounts`, {
      fields: 'id,username'
    });
  }

  // Generate Ads Manager URL
  getAdsManagerUrl(objectType: 'campaign' | 'adset' | 'ad', objectId: string): string {
    const accountId = this.adAccountId.replace('act_', '');
    const urlMap = {
      campaign: `https://business.facebook.com/adsmanager/manage/campaigns?act=${accountId}&selected_campaign_ids=${objectId}`,
      adset: `https://business.facebook.com/adsmanager/manage/adsets?act=${accountId}&selected_adset_ids=${objectId}`,
      ad: `https://business.facebook.com/adsmanager/manage/ads?act=${accountId}&selected_ad_ids=${objectId}`
    };
    return urlMap[objectType];
  }
}

export default MetaApiClient;
