import axios from 'axios';

const META_API_BASE_URL = 'https://graph.facebook.com/v18.0';

// Backend URL para endpoints que requieren proxy (uploads, etc.)
const BACKEND_API_URL = import.meta.env.VITE_API_URL || 'https://metasuite.dtgrowthpartners.com/api';

class MetaAdsService {
  constructor(accessToken, adAccountId = null) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
  }

  // Generar contenido 5+5+5 con IA
  async generateContentWithAI(prompt, category = null) {
    try {
      console.log('Generating content with AI:', prompt.substring(0, 50) + '...');

      const response = await axios.post(`${BACKEND_API_URL}/generate-content`, {
        prompt,
        category
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('AI generation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Analyze video file - transcribe audio and generate 5+5+5
  async analyzeVideoFile(file, adIndex = 0, category = null) {
    try {
      console.log(`Analyzing video for ad ${adIndex}: ${file.name}`);
      const formData = new globalThis.FormData();
      formData.append('video', file);
      formData.append('adIndex', adIndex.toString());
      if (category) formData.append('category', category);

      const response = await axios.post(`${BACKEND_API_URL}/analyze-video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000 // 2 minutes for transcription
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Video analysis error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Analyze image file - vision analysis and generate 5+5+5
  async analyzeImageFile(file, adIndex = 0, category = null) {
    try {
      console.log(`Analyzing image for ad ${adIndex}: ${file.name}`);
      const formData = new globalThis.FormData();
      formData.append('image', file);
      formData.append('adIndex', adIndex.toString());
      if (category) formData.append('category', category);

      const response = await axios.post(`${BACKEND_API_URL}/analyze-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 1 minute
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Image analysis error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Normaliza el ID de cuenta para asegurar que tenga el prefijo 'act_'
  normalizeAccountId(accountId) {
    if (!accountId) return null;
    return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  }

  async getAdAccounts() {
    try {
      console.log('Calling /me/adaccounts...');
      const response = await axios.get(`${META_API_BASE_URL}/me/adaccounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,account_status,business{id,name}',
          limit: 100
        }
      });
      const accounts = response.data.data || [];
      console.log('/me/adaccounts response:', accounts.length, 'accounts');
      return accounts;
    } catch (error) {
      console.error('/me/adaccounts error:', error.response?.data?.error || error.message);
      // Si es un Page Token, no tendrá acceso a adaccounts
      if (error.response?.data?.error?.message?.includes('Page')) {
        console.warn('Page token detected - cannot access /me/adaccounts');
        return [];
      }
      // Retornar array vacío en vez de lanzar error para no bloquear
      return [];
    }
  }

  // Verificar el tipo de token (User vs Page)
  async getTokenInfo() {
    try {
      const response = await axios.get(`${META_API_BASE_URL}/me`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name'
        }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Obtener todos los portafolios comerciales (businesses) del usuario
  async getBusinesses() {
    try {
      console.log('Calling /me/businesses...');
      const response = await axios.get(`${META_API_BASE_URL}/me/businesses`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,profile_picture_uri'
        }
      });
      const businesses = response.data.data || [];
      console.log('/me/businesses response:', businesses.length, 'businesses', businesses);
      return businesses;
    } catch (error) {
      console.error('/me/businesses ERROR:', error.response?.status, error.response?.data?.error || error.message);
      // Si es un Page Token, no tendrá acceso a businesses
      if (error.response?.data?.error?.message?.includes('Page')) {
        console.warn('Page token detected - cannot access /me/businesses');
      }
      return [];
    }
  }

  // Obtener cuentas publicitarias propias de un business
  async getBusinessOwnedAdAccounts(businessId) {
    try {
      const response = await axios.get(`${META_API_BASE_URL}/${businessId}/owned_ad_accounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,account_status',
          limit: 100
        }
      });
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  // Obtener cuentas publicitarias de clientes (para agencias)
  async getBusinessClientAdAccounts(businessId) {
    try {
      const response = await axios.get(`${META_API_BASE_URL}/${businessId}/client_ad_accounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,account_status',
          limit: 100
        }
      });
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  // Obtener páginas del business para identificar el negocio
  async getBusinessOwnedPages(businessId) {
    try {
      const response = await axios.get(`${META_API_BASE_URL}/${businessId}/owned_pages`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name',
          limit: 100
        }
      });
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  // Obtener todas las cuentas publicitarias de todos los businesses
  async getAllAdAccountsFromBusinesses() {
    try {
      const allAccounts = [];
      const seenIds = new Set();
      const seenBusinessIds = new Set();
      let businesses = [];

      // 1. PRIMERO: Intentar obtener cuentas directamente de /me/adaccounts
      // Este es el método más confiable y funciona con la mayoría de tokens
      console.log('Fetching ad accounts from /me/adaccounts...');
      try {
        const directAccounts = await this.getAdAccounts();
        console.log('Direct ad accounts found:', directAccounts.length);

        for (const account of directAccounts) {
          if (!seenIds.has(account.id)) {
            seenIds.add(account.id);
            allAccounts.push({
              ...account,
              business_name: account.business?.name || 'Cuenta Directa',
              business_id: account.business?.id || null,
              account_type: 'direct'
            });

            // Extraer business IDs de las cuentas directas
            if (account.business?.id && !seenBusinessIds.has(account.business.id)) {
              seenBusinessIds.add(account.business.id);
              businesses.push({
                id: account.business.id,
                name: account.business.name
              });
            }
          }
        }
        console.log('Businesses extracted from direct accounts:', businesses.length, businesses.map(b => b.name));
      } catch (err) {
        console.warn('Error fetching direct ad accounts:', err.message);
      }

      // 2. SEGUNDO: Intentar obtener más businesses de /me/businesses
      console.log('Fetching businesses from /me/businesses...');
      try {
        const apiBusinesses = await this.getBusinesses();
        console.log('API Businesses found:', apiBusinesses.length);

        // Agregar businesses que no teníamos
        for (const business of apiBusinesses) {
          if (!seenBusinessIds.has(business.id)) {
            seenBusinessIds.add(business.id);
            businesses.push(business);
          }
        }
      } catch (err) {
        console.warn('Error fetching businesses from API:', err.message);
      }

      // 3. TERCERO: Para cada business, obtener cuentas owned y client
      console.log('Total businesses to fetch accounts from:', businesses.length);
      for (const business of businesses) {
        try {
          // Obtener cuentas propias del business
          const ownedAccounts = await this.getBusinessOwnedAdAccounts(business.id);
          console.log(`Business ${business.name}: ${ownedAccounts.length} owned accounts`);

          for (const account of ownedAccounts) {
            if (!seenIds.has(account.id)) {
              seenIds.add(account.id);
              allAccounts.push({
                ...account,
                business_name: business.name,
                business_id: business.id,
                account_type: 'owned'
              });
            }
          }

          // Obtener cuentas de clientes (para agencias)
          const clientAccounts = await this.getBusinessClientAdAccounts(business.id);
          console.log(`Business ${business.name}: ${clientAccounts.length} client accounts`);

          for (const account of clientAccounts) {
            if (!seenIds.has(account.id)) {
              seenIds.add(account.id);
              allAccounts.push({
                ...account,
                business_name: `${business.name} (Cliente)`,
                business_id: business.id,
                account_type: 'client'
              });
            }
          }
        } catch (err) {
          console.warn(`Error fetching accounts for business ${business.name}:`, err.message);
        }
      }

      console.log('Total ad accounts loaded:', allAccounts.length);
      return { businesses, adAccounts: allAccounts };
    } catch (error) {
      console.error('getAllAdAccountsFromBusinesses error:', error);
      throw error;
    }
  }

  // Obtener información de un business específico
  async getBusinessInfo(businessId) {
    try {
      const response = await axios.get(`${META_API_BASE_URL}/${businessId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,profile_picture_uri'
        }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Obtener todas las cuentas publicitarias de un Business ID específico
  async getAdAccountsFromSpecificBusiness(businessId) {
    try {
      const allAccounts = [];
      const seenIds = new Set();

      // Obtener info del business
      const businessInfo = await this.getBusinessInfo(businessId);
      const businessName = businessInfo?.name || `Business ${businessId}`;

      // Obtener cuentas propias del business
      const ownedAccounts = await this.getBusinessOwnedAdAccounts(businessId);
      for (const account of ownedAccounts) {
        if (!seenIds.has(account.id)) {
          seenIds.add(account.id);
          allAccounts.push({
            ...account,
            business_name: businessName,
            business_id: businessId,
            account_type: 'owned'
          });
        }
      }

      // Obtener cuentas de clientes (para agencias)
      const clientAccounts = await this.getBusinessClientAdAccounts(businessId);
      for (const account of clientAccounts) {
        if (!seenIds.has(account.id)) {
          seenIds.add(account.id);
          allAccounts.push({
            ...account,
            business_name: `${businessName} (Cliente)`,
            business_id: businessId,
            account_type: 'client'
          });
        }
      }

      return {
        businesses: businessInfo ? [businessInfo] : [],
        adAccounts: allAccounts
      };
    } catch (error) {
      throw error;
    }
  }

  async getActiveCampaigns(adAccountId) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);
      const params = {
        access_token: this.accessToken,
        fields: 'id,name,status,objective,daily_budget,lifetime_budget,budget_remaining,special_ad_categories,buying_type,configured_status',
        limit: 100
      };

      const response = await axios.get(`${META_API_BASE_URL}/${normalizedId}/campaigns`, { params });

      // Filtrar en el frontend para mostrar solo activas y pausadas
      const allCampaigns = response.data.data || [];
      return allCampaigns.filter(c => c.status === 'ACTIVE' || c.status === 'PAUSED');
    } catch (error) {
      throw error;
    }
  }

  async getCampaignInsights(campaignId, datePreset = 'maximum') {
    try {
      const params = {
        access_token: this.accessToken,
        fields: 'campaign_name,spend,impressions,reach,cpm,cpc,ctr,actions,cost_per_action_type,cost_per_result,website_ctr,inline_link_clicks,unique_actions,outbound_clicks'
      };

      // 'maximum' significa todo el tiempo de vida de la campaña (no se pasa date_preset)
      if (datePreset !== 'maximum') {
        params.date_preset = datePreset;
      }

      const response = await axios.get(`${META_API_BASE_URL}/${campaignId}/insights`, { params });
      const insights = response.data.data[0] || {};
      return insights;
    } catch (error) {
      return {};
    }
  }

  async getCampaignsWithInsights(adAccountId, datePreset = 'maximum') {
    try {
      const campaigns = await this.getActiveCampaigns(adAccountId);

      const campaignsWithInsights = await Promise.all(
        campaigns.map(async (campaign) => {
          const insights = await this.getCampaignInsights(campaign.id, datePreset);
          return {
            ...campaign,
            insights
          };
        })
      );

      return campaignsWithInsights;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar el estado de una campaña (ACTIVE o PAUSED)
  async updateCampaignStatus(campaignId, newStatus) {
    try {
      const response = await axios.post(
        `${META_API_BASE_URL}/${campaignId}`,
        null,
        {
          params: {
            access_token: this.accessToken,
            status: newStatus // 'ACTIVE' o 'PAUSED'
          }
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      return { success: false, error: errorMsg };
    }
  }

  // =============================================
  // CREATIVE BUILDER - Campaign Creation Methods
  // =============================================

  // Obtener públicos guardados (Saved Audiences) de una cuenta publicitaria
  async getSavedAudiences(adAccountId) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);
      console.log('Fetching saved audiences for:', normalizedId);

      const response = await axios.get(`${META_API_BASE_URL}/${normalizedId}/saved_audiences`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,targeting',
          limit: 100
        }
      });

      console.log('Saved audiences response:', response.data);
      return { success: true, data: response.data.data || [], type: 'saved' };
    } catch (error) {
      console.error('Get saved audiences error:', error.response?.data?.error || error.message);
      const errorMsg = error.response?.data?.error?.message || error.message;
      return { success: false, error: errorMsg, data: [], type: 'saved' };
    }
  }

  // Obtener Custom Audiences de una cuenta publicitaria
  async getCustomAudiences(adAccountId) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);
      console.log('Fetching custom audiences for:', normalizedId);

      const response = await axios.get(`${META_API_BASE_URL}/${normalizedId}/customaudiences`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,subtype,description',
          limit: 100
        }
      });

      console.log('Custom audiences response:', response.data);
      return { success: true, data: response.data.data || [], type: 'custom' };
    } catch (error) {
      console.error('Get custom audiences error:', error.response?.data?.error || error.message);
      const errorMsg = error.response?.data?.error?.message || error.message;
      return { success: false, error: errorMsg, data: [], type: 'custom' };
    }
  }

  // Obtener todos los públicos (Saved + Custom)
  async getAllAudiences(adAccountId) {
    const results = {
      savedAudiences: [],
      customAudiences: [],
      errors: []
    };

    // Intentar obtener Saved Audiences
    const savedResult = await this.getSavedAudiences(adAccountId);
    if (savedResult.success) {
      results.savedAudiences = savedResult.data;
    } else {
      results.errors.push(`Saved: ${savedResult.error}`);
    }

    // Intentar obtener Custom Audiences
    const customResult = await this.getCustomAudiences(adAccountId);
    if (customResult.success) {
      results.customAudiences = customResult.data;
    } else {
      results.errors.push(`Custom: ${customResult.error}`);
    }

    return results;
  }

  // Obtener cuentas de Instagram vinculadas a la cuenta publicitaria
  async getInstagramAccounts(adAccountId) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);
      console.log('Fetching Instagram accounts for ad account:', normalizedId);

      const response = await axios.get(`${META_API_BASE_URL}/${normalizedId}/instagram_accounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,username,profile_pic'
        }
      });

      console.log('Instagram accounts response:', response.data);
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error('Error fetching Instagram accounts:', error.response?.data?.error || error.message);
      return { success: false, error: error.response?.data?.error?.message || error.message, data: [] };
    }
  }

  // Obtener imágenes de la biblioteca de medios de la cuenta publicitaria
  async getAdImages(adAccountId) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);
      console.log('Fetching ad images for:', normalizedId);

      const response = await axios.get(`${META_API_BASE_URL}/${normalizedId}/adimages`, {
        params: {
          access_token: this.accessToken,
          fields: 'hash,url,name,width,height,created_time',
          limit: 50
        }
      });

      const images = response.data.data || [];
      console.log('Ad images found:', images.length);
      return { success: true, data: images };
    } catch (error) {
      console.error('Error fetching ad images:', error.response?.data?.error || error.message);
      return { success: false, error: error.response?.data?.error?.message || error.message, data: [] };
    }
  }

  // Obtener videos de la biblioteca de medios de la cuenta publicitaria
  async getAdVideos(adAccountId) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);
      console.log('Fetching ad videos for:', normalizedId);

      const response = await axios.get(`${META_API_BASE_URL}/${normalizedId}/advideos`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,title,thumbnails,source,created_time,length',
          limit: 50
        }
      });

      const videos = response.data.data || [];
      console.log('Ad videos found:', videos.length);
      return { success: true, data: videos };
    } catch (error) {
      console.error('Error fetching ad videos:', error.response?.data?.error || error.message);
      return { success: false, error: error.response?.data?.error?.message || error.message, data: [] };
    }
  }

  // Subir imagen desde archivo del dispositivo
  async uploadImageFile(adAccountId, file) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);
      console.log('Uploading image file:', file.name, file.size, 'bytes');

      const formData = new FormData();
      formData.append('adAccountId', normalizedId);
      formData.append('accessToken', this.accessToken);
      formData.append('image', file);

      const response = await axios.post(`${BACKEND_API_URL}/upload/image-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('Image file upload error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  // Subir video desde archivo del dispositivo
  async uploadVideoFile(adAccountId, file) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);
      console.log('Uploading video file:', file.name, file.size, 'bytes');

      const formData = new FormData();
      formData.append('adAccountId', normalizedId);
      formData.append('accessToken', this.accessToken);
      formData.append('video', file);
      formData.append('title', file.name);

      const response = await axios.post(`${BACKEND_API_URL}/upload/video-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('Video file upload error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  // Obtener páginas de Facebook asociadas al usuario
  async getPages() {
    try {
      const response = await axios.get(`${META_API_BASE_URL}/me/accounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,access_token,instagram_business_account{id,username}'
        }
      });
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      return { success: false, error: errorMsg };
    }
  }

  // Crear una campaña (con CBO - Campaign Budget Optimization)
  async createCampaign(adAccountId, { name, objective, status = 'PAUSED', specialAdCategories = [], dailyBudget = null, bidStrategy = 'LOWEST_COST_WITHOUT_CAP' }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      // Preparar FormData para enviar como body
      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('objective', objective);
      formData.append('status', status);
      formData.append('special_ad_categories', JSON.stringify(specialAdCategories || []));

      // Para CBO: el presupuesto y bid_strategy van en la campaña
      if (dailyBudget) {
        formData.append('daily_budget', dailyBudget.toString());
        formData.append('bid_strategy', bidStrategy);
      }

      console.log('Creating campaign with:', {
        adAccountId: normalizedId,
        name,
        objective,
        status,
        daily_budget: dailyBudget,
        bid_strategy: bidStrategy,
        special_ad_categories: JSON.stringify(specialAdCategories || [])
      });

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/campaigns`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      if (response.data?.error) {
        const err = response.data.error;
        const errorMsg = err.error_user_msg || err.message || 'Error desconocido';
        console.error('Campaign creation FAILED (200 with error):', errorMsg);
        return { success: false, error: errorMsg };
      }
      console.log('Campaign creation SUCCESS:', JSON.stringify(response.data));
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Campaign creation FAILED:', JSON.stringify(error.response?.data, null, 2) || error.message);
      const errorData = error.response?.data?.error;
      let errorMsg = errorData?.message || error.message;

      // Agregar más detalles si están disponibles
      if (errorData?.error_user_title) {
        errorMsg = `${errorData.error_user_title}: ${errorData.error_user_msg || errorMsg}`;
      }
      if (errorData?.error_subcode) {
        errorMsg += ` (code: ${errorData.code}, subcode: ${errorData.error_subcode})`;
      }

      return { success: false, error: errorMsg };
    }
  }

  // Crear un Ad Set (sin presupuesto cuando se usa CBO)
  async createAdSet(adAccountId, {
    name,
    campaignId,
    dailyBudget = null, // en centavos - opcional para CBO
    billingEvent = 'IMPRESSIONS',
    optimizationGoal = 'LINK_CLICKS',
    targeting,
    status = 'PAUSED',
    endTime = null, // Fecha de fin en formato ISO o timestamp UNIX
    isDynamicCreative = false // Para Asset Feed Spec (5+5+5 en 1 anuncio)
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      // Preparar FormData
      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('campaign_id', campaignId);

      // Solo agregar daily_budget y bid_strategy si NO estamos usando CBO
      // Para CBO, el presupuesto y bid_strategy están en la campaña
      if (dailyBudget) {
        formData.append('daily_budget', dailyBudget.toString());
        // Solo necesitamos bid_strategy cuando el presupuesto está en el ad set
        formData.append('bid_strategy', 'LOWEST_COST_WITHOUT_CAP');
      }

      formData.append('billing_event', billingEvent);
      formData.append('optimization_goal', optimizationGoal);
      // NO enviamos bid_strategy cuando usamos CBO - se hereda de la campaña
      formData.append('targeting', JSON.stringify(targeting));
      formData.append('status', status);

      // Dynamic Creative permite 5+5+5 (múltiples títulos, descripciones, CTAs) en 1 anuncio
      if (isDynamicCreative) {
        formData.append('is_dynamic_creative', 'true');
      }

      // Agregar fecha de fin si está especificada
      if (endTime) {
        // Convertir a timestamp UNIX si es una fecha en formato YYYY-MM-DD
        const endTimestamp = typeof endTime === 'string' && endTime.includes('-')
          ? Math.floor(new Date(endTime + 'T23:59:59').getTime() / 1000)
          : endTime;
        formData.append('end_time', endTimestamp.toString());
      }

      console.log('Creating adset with:', {
        adAccountId: normalizedId,
        name,
        campaign_id: campaignId,
        daily_budget: dailyBudget || '(CBO - budget at campaign level)',
        billing_event: billingEvent,
        optimization_goal: optimizationGoal,
        bid_strategy: dailyBudget ? 'LOWEST_COST_WITHOUT_CAP' : '(inherited from campaign - CBO)',
        targeting: JSON.stringify(targeting),
        status
      });

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adsets`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      if (response.data?.error) {
        const err = response.data.error;
        const errorMsg = err.error_user_msg || err.message || 'Error desconocido';
        console.error('AdSet creation FAILED (200 with error):', errorMsg);
        return { success: false, error: errorMsg };
      }
      console.log('AdSet creation SUCCESS:', JSON.stringify(response.data));
      return { success: true, data: response.data };
    } catch (error) {
      console.error('AdSet creation FAILED:', JSON.stringify(error.response?.data, null, 2) || error.message);
      const errorData = error.response?.data?.error;
      let errorMsg = errorData?.message || error.message;

      if (errorData?.error_user_title) {
        errorMsg = `${errorData.error_user_title}: ${errorData.error_user_msg || errorMsg}`;
      }

      return { success: false, error: errorMsg };
    }
  }

  // Subir un video a la cuenta publicitaria (usa backend para evitar CORS)
  async uploadVideo(adAccountId, videoSource, title = 'Video Creative') {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      // Determinar si es un File o una URL
      const isFile = videoSource instanceof File;

      if (isFile) {
        // Para archivos, primero necesitaríamos subirlo a un servidor temporal
        // Por ahora, solo soportamos URLs
        return {
          success: false,
          error: 'La subida de archivos de video no está soportada. Por favor usa una URL pública del video.'
        };
      } else {
        // Upload desde URL usando el backend
        console.log('Uploading video from URL via backend:', { adAccountId: normalizedId, videoUrl: videoSource, title });

        const response = await axios.post(`${BACKEND_API_URL}/upload/video`, {
          adAccountId: normalizedId,
          accessToken: this.accessToken,
          videoUrl: videoSource,
          title
        });

        if (response.data.success) {
          return { success: true, data: response.data.data };
        } else {
          return { success: false, error: response.data.error };
        }
      }
    } catch (error) {
      console.error('Video upload error:', error.response?.data || error.message);
      let errorMsg = error.response?.data?.error || error.message;

      // Detectar error de permisos (#3) y mostrar mensaje más claro
      if (errorMsg.includes('(#3)') || errorMsg.includes('does not have the capability')) {
        errorMsg = '⚠️ PERMISOS INSUFICIENTES: La app no tiene permiso para subir videos. Necesitas el permiso "ads_management" con acceso de escritura aprobado por Meta.';
      }

      return { success: false, error: errorMsg };
    }
  }

  // Subir una imagen (usa backend para evitar CORS)
  async uploadImage(adAccountId, imageSource) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      // Determinar si es un File o una URL
      const isFile = imageSource instanceof File;

      if (isFile) {
        // Para archivos, primero necesitaríamos subirlo a un servidor temporal
        // Por ahora, solo soportamos URLs
        return {
          success: false,
          error: 'La subida de archivos de imagen no está soportada. Por favor usa una URL pública de la imagen.'
        };
      } else {
        // Upload desde URL usando el backend
        console.log('Uploading image from URL via backend:', { adAccountId: normalizedId, imageUrl: imageSource });

        const response = await axios.post(`${BACKEND_API_URL}/upload/image`, {
          adAccountId: normalizedId,
          accessToken: this.accessToken,
          imageUrl: imageSource
        });

        if (response.data.success) {
          return { success: true, data: response.data.data };
        } else {
          return { success: false, error: response.data.error };
        }
      }
    } catch (error) {
      console.error('Image upload error:', error.response?.data || error.message);
      let errorMsg = error.response?.data?.error || error.message;

      // Detectar error de permisos (#3) y mostrar mensaje más claro
      if (errorMsg.includes('(#3)') || errorMsg.includes('does not have the capability')) {
        errorMsg = '⚠️ PERMISOS INSUFICIENTES: La app no tiene permiso para subir imágenes. Necesitas el permiso "ads_management" con acceso de escritura aprobado por Meta. Ve a developers.facebook.com para verificar tu app.';
      }

      return { success: false, error: errorMsg };
    }
  }

  // Crear Ad Creative con video (formato para OUTCOME_TRAFFIC)
  async createAdCreativeWithVideo(adAccountId, {
    name,
    pageId,
    videoId,
    imageHash = null, // thumbnail hash (prioridad)
    imageUrl = null, // thumbnail URL (alternativa automática)
    primaryText,
    headline,
    description,
    callToAction,
    linkUrl,
    igActorId = null
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      // Estructura correcta para video ads con objetivo de tráfico
      // Meta requiere miniatura: image_hash O image_url
      const videoData = {
        video_id: videoId,
        message: primaryText,
        title: headline,
        link_description: description,
        call_to_action: {
          type: callToAction,
          value: {
            link: linkUrl
          }
        }
      };

      // Priorizar image_hash sobre image_url
      // Si no hay ninguno, obtener thumbnail automáticamente del video via servidor proxy
      if (imageHash) {
        videoData.image_hash = imageHash;
      } else if (imageUrl) {
        videoData.image_url = imageUrl;
      } else {
        // Fallback: obtener thumbnail del video o imagen de respaldo via servidor
        console.log('No thumbnail provided, fetching from server proxy for video:', videoId);
        try {
          const thumbResponse = await axios.get(`${BACKEND_API_URL}/video-thumbnail/${videoId}`, {
            params: { adAccountId: normalizedId }
          });
          const autoThumbUrl = thumbResponse.data?.data?.thumbnailUrl || '';
          const autoThumbHash = thumbResponse.data?.data?.thumbnailHash || '';
          if (autoThumbUrl) {
            console.log('Auto-fetched video thumbnail via server:', autoThumbUrl);
            videoData.image_url = autoThumbUrl;
          } else if (autoThumbHash) {
            console.log('Using fallback image hash from server:', autoThumbHash);
            videoData.image_hash = autoThumbHash;
          } else {
            console.warn('Server could not obtain any thumbnail for video:', videoId);
          }
        } catch (thumbErr) {
          console.warn('Failed to fetch video thumbnail via server:', thumbErr.message);
        }
      }

      const objectStorySpec = {
        page_id: pageId,
        video_data: videoData
      };

      if (igActorId) {
        objectStorySpec.instagram_actor_id = igActorId;
      }

      console.log('Creating video creative:', { name, pageId, videoId, linkUrl, callToAction });
      console.log('objectStorySpec:', JSON.stringify(objectStorySpec, null, 2));

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('object_story_spec', JSON.stringify(objectStorySpec));

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adcreatives`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Creative creation error:', JSON.stringify(error.response?.data, null, 2) || error.message);
      const errorMsg = error.response?.data?.error?.message || error.message;
      return { success: false, error: errorMsg };
    }
  }

  // Crear Ad Creative con imagen
  async createAdCreativeWithImage(adAccountId, {
    name,
    pageId,
    imageHash,
    primaryText,
    headline,
    description,
    callToAction,
    linkUrl,
    igActorId = null
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      const objectStorySpec = {
        page_id: pageId,
        link_data: {
          image_hash: imageHash,
          message: primaryText,
          name: headline,
          description: description,
          link: linkUrl,
          call_to_action: {
            type: callToAction,
            value: { link: linkUrl }
          }
        }
      };

      if (igActorId) {
        objectStorySpec.instagram_actor_id = igActorId;
      }

      console.log('Creating image creative:', { name, pageId, imageHash, objectStorySpec });

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('object_story_spec', JSON.stringify(objectStorySpec));

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adcreatives`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Creative creation error:', JSON.stringify(error.response?.data, null, 2) || error.message);
      const errorMsg = error.response?.data?.error?.message || error.message;
      return { success: false, error: errorMsg };
    }
  }

  // Crear un Ad
  async createAd(adAccountId, { name, adsetId, creativeId, status = 'PAUSED' }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      console.log('Creating ad:', { name, adsetId, creativeId, status });

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('adset_id', adsetId);
      formData.append('creative', JSON.stringify({ creative_id: creativeId }));
      formData.append('status', status);

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/ads`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      // Meta sometimes returns HTTP 200 with error in body
      if (response.data?.error) {
        const err = response.data.error;
        const errorMsg = err.error_user_msg || err.message || 'Error desconocido';
        console.error('Ad creation FAILED (200 with error):', errorMsg);
        return { success: false, error: errorMsg };
      }
      console.log('Ad creation SUCCESS:', JSON.stringify(response.data));
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Ad creation FAILED:', JSON.stringify(error.response?.data, null, 2) || error.message);
      const errorMsg = error.response?.data?.error?.error_user_msg || error.response?.data?.error?.message || error.message;
      return { success: false, error: errorMsg };
    }
  }

  // Crear Ad Creative estándar (sin DCO) - Soporta imagen Y video
  async createStandardAdCreative(adAccountId, {
    name,
    pageId,
    imageUrl = null,
    imageHash = null,
    videoId = null,
    thumbnailUrl = null,
    primaryText,
    headline,
    description = '',
    linkUrl,
    callToAction = 'LEARN_MORE',
    igActorId = null
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      const objectStorySpec = { page_id: pageId };

      if (videoId) {
        // Video creative usando video_data
        const videoData = {
          video_id: videoId,
          message: primaryText,
          title: headline,
          call_to_action: {
            type: callToAction,
            value: { link: linkUrl }
          }
        };
        if (thumbnailUrl) videoData.image_url = thumbnailUrl;
        if (description && description.trim()) videoData.link_description = description;
        objectStorySpec.video_data = videoData;
      } else {
        // Image creative usando link_data
        const linkData = {
          link: linkUrl,
          message: primaryText,
          name: headline,
          call_to_action: { type: callToAction }
        };
        if (imageHash) {
          linkData.image_hash = imageHash;
        } else if (imageUrl && imageUrl.trim()) {
          linkData.picture = imageUrl;
        }
        if (description && description.trim()) {
          linkData.description = description;
        }
        objectStorySpec.link_data = linkData;
      }

      if (igActorId) {
        objectStorySpec.instagram_actor_id = igActorId;
      }

      console.log('Creating standard creative:', {
        name, pageId,
        type: videoId ? 'VIDEO' : 'IMAGE',
        headline,
        primaryText: primaryText?.substring(0, 50) + '...',
        linkUrl, callToAction
      });

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('object_story_spec', JSON.stringify(objectStorySpec));

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adcreatives`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.data?.error) {
        const err = response.data.error;
        const errorMsg = err.error_user_msg || err.message || 'Error desconocido';
        console.error('Standard creative FAILED (200 with error):', errorMsg);
        return { success: false, error: errorMsg };
      }
      console.log('Standard creative SUCCESS:', JSON.stringify(response.data));
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Standard creative creation error:', JSON.stringify(error.response?.data, null, 2) || error.message);
      const errorData = error.response?.data?.error;
      let errorMsg = errorData?.message || error.message;

      // Agregar detalles adicionales del error si están disponibles
      if (errorData?.error_user_title) {
        errorMsg = `${errorData.error_user_title}: ${errorData.error_user_msg || errorMsg}`;
      }
      if (errorData?.error_subcode) {
        errorMsg += ` (code: ${errorData.code}, subcode: ${errorData.error_subcode})`;
      }

      // Log adicional para debugging
      console.error('Creative error details:', {
        code: errorData?.code,
        subcode: errorData?.error_subcode,
        title: errorData?.error_user_title,
        msg: errorData?.error_user_msg,
        fbtrace_id: errorData?.fbtrace_id
      });

      return { success: false, error: errorMsg };
    }
  }

  // Crear Ad Creative con Asset Feed Spec (1 anuncio con 5+5+5)
  // Soporta imagen O video. Meta prueba combinaciones y muestra la mejor.
  async createAdCreativeWithAssetFeedSpec(adAccountId, {
    name,
    pageId,
    // Imagen
    imageHash = null,
    imageHash9x16 = null, // Hash de imagen recortada 9:16 para Stories/Reels
    imageUrl = null,
    // Video
    videoId = null,
    thumbnailHash = null, // hash de miniatura para video
    thumbnailUrl = null,  // URL de miniatura para video
    // Contenido 5+5+5
    titles, // Array de títulos (max 5)
    bodies, // Array de textos primarios (max 5)
    descriptions, // Array de descripciones link (max 5)
    callToActionTypes, // Array de CTAs (max 5)
    linkUrl,
    igActorId = null
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      // Asset Feed Spec - Dynamic Creative (5+5+5 en 1 solo anuncio)
      const assetFeedSpec = {
        bodies: bodies.slice(0, 5).map(text => ({ text })),
        titles: titles.slice(0, 5).map(text => ({ text })),
        descriptions: descriptions.slice(0, 5).map(text => ({ text })),
        call_to_action_types: [...new Set(callToActionTypes.slice(0, 5))],
        link_urls: [{ website_url: linkUrl }]
      };

      // Video o imagen
      if (videoId) {
        const videoEntry = { video_id: videoId };
        if (thumbnailHash) {
          videoEntry.thumbnail_hash = thumbnailHash;
        } else if (thumbnailUrl) {
          videoEntry.thumbnail_url = thumbnailUrl;
        }
        assetFeedSpec.videos = [videoEntry];
        assetFeedSpec.ad_formats = ['SINGLE_VIDEO'];
      } else if (imageHash && imageHash9x16) {
        // Imagen con versión 9:16 para Stories/Reels
        assetFeedSpec.images = [
          { hash: imageHash, adlabels: [{ name: 'feed_image' }] },
          { hash: imageHash9x16, adlabels: [{ name: 'stories_image' }] }
        ];
        assetFeedSpec.ad_formats = ['SINGLE_IMAGE'];
        assetFeedSpec.asset_customization_rules = [
          {
            customization_spec: {
              publisher_platforms: ['facebook', 'instagram'],
              facebook_positions: ['feed', 'marketplace', 'video_feeds', 'search', 'right_hand_column'],
              instagram_positions: ['stream', 'explore', 'profile_feed']
            },
            image_label: { name: 'feed_image' }
          },
          {
            customization_spec: {
              publisher_platforms: ['facebook', 'instagram'],
              facebook_positions: ['story', 'facebook_reels'],
              instagram_positions: ['story', 'reels']
            },
            image_label: { name: 'stories_image' }
          }
        ];
        console.log('Using asset_customization_rules: feed_image + stories_image (9:16)');
      } else {
        assetFeedSpec.images = imageHash ? [{ hash: imageHash }] : [{ url: imageUrl }];
        assetFeedSpec.ad_formats = ['SINGLE_IMAGE'];
      }

      const objectStorySpec = {
        page_id: pageId
      };

      if (igActorId) {
        objectStorySpec.instagram_actor_id = igActorId;
      }

      console.log('Creating Asset Feed Spec creative (5+5+5):', {
        name, pageId,
        type: videoId ? 'VIDEO' : 'IMAGE',
        videoId: videoId || 'N/A',
        thumbnailHash: thumbnailHash || 'N/A',
        imageHash9x16: imageHash9x16 || 'N/A',
        titles: titles.length, bodies: bodies.length,
        descriptions: descriptions.length, callToActionTypes
      });
      console.log('assetFeedSpec:', JSON.stringify(assetFeedSpec, null, 2));

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('object_story_spec', JSON.stringify(objectStorySpec));
      formData.append('asset_feed_spec', JSON.stringify(assetFeedSpec));

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adcreatives`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      // Meta sometimes returns HTTP 200 with error in body
      if (response.data?.error) {
        const err = response.data.error;
        const errorMsg = err.error_user_msg || err.message || 'Error desconocido';
        console.error('Creative creation FAILED (200 with error):', errorMsg);
        return { success: false, error: errorMsg };
      }
      console.log('Creative creation SUCCESS:', JSON.stringify(response.data));
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Creative creation FAILED:', JSON.stringify(error.response?.data, null, 2) || error.message);
      const errorData = error.response?.data?.error;
      let errorMsg = errorData?.message || error.message;
      if (errorData?.error_user_title) {
        errorMsg = `${errorData.error_user_title}: ${errorData.error_user_msg || errorMsg}`;
      }
      return { success: false, error: errorMsg };
    }
  }

  // Crear solo Campaign + AdSet (sin Creative ni Ad) - Para agregar creative manualmente después
  async createCampaignAndAdSet(adAccountId, {
    campaignName,
    objective = 'OUTCOME_TRAFFIC',
    specialAdCategories = [],
    adSetName,
    dailyBudget, // en centavos
    targeting,
    optimizationGoal = 'LINK_CLICKS',
    billingEvent = 'IMPRESSIONS',
    endDate = null // Fecha de fin opcional (YYYY-MM-DD)
  }) {
    const results = {
      campaign: null,
      adSet: null,
      errors: []
    };

    try {
      // 1. Crear Campaña con CBO (presupuesto a nivel de campaña)
      console.log('Creating campaign with CBO...');
      const campaignResult = await this.createCampaign(adAccountId, {
        name: campaignName,
        objective,
        status: 'PAUSED',
        specialAdCategories,
        dailyBudget
      });

      if (!campaignResult.success) {
        results.errors.push(`Campaign: ${campaignResult.error}`);
        return { success: false, ...results };
      }
      results.campaign = campaignResult.data;

      // 2. Crear AdSet (sin presupuesto - usa CBO de la campaña)
      console.log('Creating ad set (using campaign budget - CBO)...');
      const adSetResult = await this.createAdSet(adAccountId, {
        name: adSetName || `${campaignName} - Ad Set`,
        campaignId: results.campaign.id,
        billingEvent,
        optimizationGoal,
        targeting,
        status: 'PAUSED',
        endTime: endDate // Pasar fecha de fin si existe
      });

      if (!adSetResult.success) {
        results.errors.push(`AdSet: ${adSetResult.error}`);
        return { success: false, ...results };
      }
      results.adSet = adSetResult.data;

      console.log('Campaign and AdSet created successfully!');
      return { success: true, ...results };

    } catch (error) {
      results.errors.push(`Unexpected: ${error.message}`);
      return { success: false, ...results };
    }
  }

  // Crear Campaign + AdSet + 1 Creative (5+5+5) + 1 Ad
  // Usa Asset Feed Spec para meter 5 títulos, 5 descripciones y 5 CTAs en 1 solo anuncio
  async createCampaignWithAd(adAccountId, {
    // Campaign
    campaignName,
    objective = 'OUTCOME_TRAFFIC',
    specialAdCategories = [],
    // AdSet
    adSetName,
    dailyBudget,
    targeting,
    optimizationGoal = 'LANDING_PAGE_VIEWS',
    billingEvent = 'IMPRESSIONS',
    endDate = null,
    // Creative & Ad
    adName,
    pageId,
    imageUrl = null,
    imageHash = null,
    videoId = null,
    videoThumbnailHash = null,
    videoThumbnailUrl = null,
    titles,
    bodies,
    descriptions,
    callToActionTypes,
    linkUrl,
    igActorId = null
  }) {
    const results = {
      campaign: null,
      adSet: null,
      creative: null,
      ad: null,
      errors: []
    };

    try {
      // 1. Crear Campaña con CBO
      console.log('Step 1/4: Creating campaign with CBO...');
      const campaignResult = await this.createCampaign(adAccountId, {
        name: campaignName,
        objective,
        status: 'PAUSED',
        specialAdCategories,
        dailyBudget
      });

      if (!campaignResult.success) {
        results.errors.push(`Campaign: ${campaignResult.error}`);
        return { success: false, ...results };
      }
      results.campaign = campaignResult.data;

      // 2. Crear AdSet con Dynamic Creative habilitado (permite 5+5+5 en 1 anuncio)
      console.log('Step 2/4: Creating ad set (Dynamic Creative)...');
      const adSetResult = await this.createAdSet(adAccountId, {
        name: adSetName || `${campaignName} - Ad Set`,
        campaignId: results.campaign.id,
        billingEvent,
        optimizationGoal,
        targeting,
        status: 'PAUSED',
        endTime: endDate,
        isDynamicCreative: true // Permite Asset Feed Spec (5+5+5)
      });

      if (!adSetResult.success) {
        results.errors.push(`AdSet: ${adSetResult.error}`);
        return { success: false, ...results };
      }
      results.adSet = adSetResult.data;

      // 3. Resolver thumbnail para video (si es necesario)
      const validTitles = titles && titles.length > 0 ? titles.filter(t => t && t.trim()) : ['Conoce más'];
      const validBodies = bodies && bodies.length > 0 ? bodies.filter(b => b && b.trim()) : ['Descubre más'];
      const validDescriptions = descriptions && descriptions.length > 0 ? descriptions.filter(d => d && d.trim()) : [''];
      const validCTAs = callToActionTypes && callToActionTypes.length > 0 ? callToActionTypes : ['LEARN_MORE'];

      let resolvedThumbHash = videoThumbnailHash || null;
      let resolvedThumbUrl = videoThumbnailUrl || null;

      // Si es video y no tenemos thumbnail, intentar obtenerlo del servidor
      if (videoId && !resolvedThumbHash && !resolvedThumbUrl && !imageHash) {
        console.log('No video thumbnail available, fetching via server proxy...');
        try {
          const thumbResponse = await axios.get(`${BACKEND_API_URL}/video-thumbnail/${videoId}`, {
            params: { adAccountId: this.normalizeAccountId(adAccountId) }
          });
          if (thumbResponse.data?.data?.thumbnailUrl) {
            resolvedThumbUrl = thumbResponse.data.data.thumbnailUrl;
            console.log('Got thumbnail URL from proxy:', resolvedThumbUrl);
          } else if (thumbResponse.data?.data?.thumbnailHash) {
            resolvedThumbHash = thumbResponse.data.data.thumbnailHash;
            console.log('Got fallback thumbnail hash from proxy:', resolvedThumbHash);
          }
        } catch (err) {
          console.warn('Proxy thumbnail fetch failed:', err.message);
        }
      }

      // 4. Crear 1 Creative con Asset Feed Spec (5+5+5)
      console.log(`Step 3/4: Creating creative with ${validTitles.length} titles, ${validBodies.length} bodies, ${validCTAs.length} CTAs...`);

      const creativeResult = await this.createAdCreativeWithAssetFeedSpec(adAccountId, {
        name: `${adName} - Creative`,
        pageId,
        imageUrl: !videoId ? imageUrl : null,
        imageHash: !videoId ? imageHash : null,
        videoId: videoId || null,
        thumbnailHash: resolvedThumbHash || imageHash || null,
        thumbnailUrl: resolvedThumbUrl || null,
        titles: validTitles,
        bodies: validBodies,
        descriptions: validDescriptions,
        callToActionTypes: validCTAs,
        linkUrl,
        igActorId
      });

      if (!creativeResult.success) {
        results.errors.push(`Creative: ${creativeResult.error}`);
        return { success: false, ...results };
      }
      results.creative = creativeResult.data;

      // 5. Crear 1 Ad
      console.log('Step 4/4: Creating ad...');
      const adResult = await this.createAd(adAccountId, {
        name: adName,
        adsetId: results.adSet.id,
        creativeId: results.creative.id,
        status: 'PAUSED'
      });

      if (!adResult.success) {
        results.errors.push(`Ad: ${adResult.error}`);
        return { success: false, ...results };
      }
      results.ad = adResult.data;

      console.log('Campaign created: 1 Campaign + 1 AdSet + 1 Creative (5+5+5) + 1 Ad');
      return { success: true, ...results };

    } catch (error) {
      results.errors.push(`Unexpected: ${error.message}`);
      return { success: false, ...results };
    }
  }

  // Crear campaña completa (Campaign + AdSet + Creative + Ad) - TODO EN PAUSED
  async createFullCampaign(adAccountId, {
    // Campaign
    campaignName,
    objective = 'OUTCOME_TRAFFIC',
    specialAdCategories = [],
    // AdSet
    adSetName,
    dailyBudget, // en centavos
    targeting,
    optimizationGoal = 'LINK_CLICKS',
    billingEvent = 'IMPRESSIONS',
    // Creative
    pageId,
    igActorId = null,
    assetType, // 'VIDEO' o 'IMAGE'
    assetSource, // Puede ser File o URL string
    primaryText,
    headline,
    description,
    callToAction,
    linkUrl
  }) {
    const results = {
      campaign: null,
      adSet: null,
      creative: null,
      ad: null,
      errors: []
    };

    try {
      // 1. Crear Campaña con CBO (presupuesto a nivel de campaña)
      console.log('Creating campaign with CBO...');
      const campaignResult = await this.createCampaign(adAccountId, {
        name: campaignName,
        objective,
        status: 'PAUSED',
        specialAdCategories,
        dailyBudget // Presupuesto va en la campaña para CBO
      });

      if (!campaignResult.success) {
        results.errors.push(`Campaign: ${campaignResult.error}`);
        return { success: false, ...results };
      }
      results.campaign = campaignResult.data;

      // 2. Crear AdSet (sin presupuesto - usa CBO de la campaña)
      console.log('Creating ad set (using campaign budget - CBO)...');
      const adSetResult = await this.createAdSet(adAccountId, {
        name: adSetName || `${campaignName} - Ad Set`,
        campaignId: results.campaign.id,
        // NO pasamos dailyBudget - se usa CBO
        billingEvent,
        optimizationGoal,
        targeting,
        status: 'PAUSED'
      });

      if (!adSetResult.success) {
        results.errors.push(`AdSet: ${adSetResult.error}`);
        return { success: false, ...results };
      }
      results.adSet = adSetResult.data;

      // 3. Subir Asset y Crear Creative
      console.log('Uploading asset and creating creative...');
      let creativeResult;

      if (assetType === 'VIDEO') {
        // Subir video (soporta File o URL)
        console.log('Uploading video...', assetSource instanceof File ? 'File upload' : 'URL upload');
        const videoResult = await this.uploadVideo(adAccountId, assetSource, campaignName);
        if (!videoResult.success) {
          results.errors.push(`Video Upload: ${videoResult.error}`);
          return { success: false, ...results };
        }

        // Crear creative con video
        creativeResult = await this.createAdCreativeWithVideo(adAccountId, {
          name: `${campaignName} - Creative`,
          pageId,
          videoId: videoResult.data.id,
          primaryText,
          headline,
          description,
          callToAction,
          linkUrl,
          igActorId
        });
      } else {
        // Subir imagen (soporta File o URL)
        console.log('Uploading image...', assetSource instanceof File ? 'File upload' : 'URL upload');
        const imageResult = await this.uploadImage(adAccountId, assetSource);
        if (!imageResult.success) {
          results.errors.push(`Image Upload: ${imageResult.error}`);
          return { success: false, ...results };
        }

        // Obtener el hash de la imagen
        const imageHash = Object.values(imageResult.data.images)[0]?.hash;

        // Crear creative con imagen
        creativeResult = await this.createAdCreativeWithImage(adAccountId, {
          name: `${campaignName} - Creative`,
          pageId,
          imageHash,
          primaryText,
          headline,
          description,
          callToAction,
          linkUrl,
          igActorId
        });
      }

      if (!creativeResult.success) {
        results.errors.push(`Creative: ${creativeResult.error}`);
        return { success: false, ...results };
      }
      results.creative = creativeResult.data;

      // 4. Crear Ad
      console.log('Creating ad...');
      const adResult = await this.createAd(adAccountId, {
        name: `${campaignName} - Ad`,
        adsetId: results.adSet.id,
        creativeId: results.creative.id,
        status: 'PAUSED'
      });

      if (!adResult.success) {
        results.errors.push(`Ad: ${adResult.error}`);
        return { success: false, ...results };
      }
      results.ad = adResult.data;

      console.log('Full campaign created successfully!');
      return { success: true, ...results };

    } catch (error) {
      results.errors.push(`Unexpected: ${error.message}`);
      return { success: false, ...results };
    }
  }

  // ============================================
  // MÉTODOS ADICIONALES PARA NUEVOS TIPOS DE CAMPAÑA
  // ============================================

  // Obtener pixels de una cuenta publicitaria
  async getPixels(adAccountId) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);
      const response = await axios.get(`${META_API_BASE_URL}/${normalizedId}/adspixels`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,code,last_fired_time'
        }
      });
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error('Error getting pixels:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error?.message || error.message, data: [] };
    }
  }

  // Crear AdSet para WhatsApp
  async createAdSetForWhatsApp(adAccountId, {
    name,
    campaignId,
    targeting,
    optimizationGoal = 'CONVERSATIONS',
    billingEvent = 'IMPRESSIONS',
    status = 'PAUSED',
    promotedObject = null
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('campaign_id', campaignId);
      formData.append('billing_event', billingEvent);
      formData.append('optimization_goal', optimizationGoal);
      formData.append('targeting', JSON.stringify(targeting));
      formData.append('status', status);
      formData.append('destination_type', 'WHATSAPP');

      if (promotedObject) {
        formData.append('promoted_object', JSON.stringify(promotedObject));
      }

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adsets`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('AdSet for WhatsApp error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error?.message || error.message };
    }
  }

  // Crear AdSet para Messenger
  async createAdSetForMessenger(adAccountId, {
    name,
    campaignId,
    targeting,
    optimizationGoal = 'CONVERSATIONS',
    billingEvent = 'IMPRESSIONS',
    status = 'PAUSED',
    promotedObject = null
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('campaign_id', campaignId);
      formData.append('billing_event', billingEvent);
      formData.append('optimization_goal', optimizationGoal);
      formData.append('targeting', JSON.stringify(targeting));
      formData.append('status', status);
      formData.append('destination_type', 'MESSENGER');

      if (promotedObject) {
        formData.append('promoted_object', JSON.stringify(promotedObject));
      }

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adsets`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('AdSet for Messenger error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error?.message || error.message };
    }
  }

  // Crear Creative para WhatsApp (usa URL de imagen directamente)
  async createCreativeForWhatsApp(adAccountId, {
    name,
    pageId,
    imageHash = null,
    imageUrl = null, // URL directa de la imagen
    whatsappNumber,
    primaryText,
    headline,
    description,
    callToAction = 'WHATSAPP_MESSAGE'
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      const linkData = {
        link: `https://wa.me/${whatsappNumber}`,
        message: primaryText,
        name: headline,
        description: description,
        call_to_action: {
          type: callToAction,
          value: {
            app_destination: 'WHATSAPP'
          }
        }
      };

      // Usar image_hash si está disponible, sino usar picture (URL directa)
      if (imageHash) {
        linkData.image_hash = imageHash;
      } else if (imageUrl) {
        linkData.picture = imageUrl;
      }

      const objectStorySpec = {
        page_id: pageId,
        link_data: linkData
      };

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('object_story_spec', JSON.stringify(objectStorySpec));

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adcreatives`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Creative for WhatsApp error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error?.message || error.message };
    }
  }

  // Crear Creative para Messenger (usa URL de imagen directamente)
  async createCreativeForMessenger(adAccountId, {
    name,
    pageId,
    imageHash = null,
    imageUrl = null, // URL directa de la imagen
    primaryText,
    headline,
    description,
    callToAction = 'SEND_MESSAGE'
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      const linkData = {
        link: `https://m.me/${pageId}`,
        message: primaryText,
        name: headline,
        description: description,
        call_to_action: {
          type: callToAction,
          value: {
            app_destination: 'MESSENGER'
          }
        }
      };

      // Usar image_hash si está disponible, sino usar picture (URL directa)
      if (imageHash) {
        linkData.image_hash = imageHash;
      } else if (imageUrl) {
        linkData.picture = imageUrl;
      }

      const objectStorySpec = {
        page_id: pageId,
        link_data: linkData
      };

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('object_story_spec', JSON.stringify(objectStorySpec));

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adcreatives`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Creative for Messenger error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error?.message || error.message };
    }
  }

  // Crear campaña completa para WhatsApp (usa URL de imagen directamente, sin subir)
  async createCampaignForWhatsApp(adAccountId, {
    campaignName,
    adSetName,
    adName,
    dailyBudget,
    targeting,
    pageId,
    whatsappNumber,
    imageUrl,
    headlines = [],
    descriptions = [],
    primaryTexts = [],
    callToAction = 'WHATSAPP_MESSAGE'
  }) {
    const results = { campaign: null, adSet: null, creative: null, ad: null, errors: [] };

    try {
      // 1. Crear Campaña
      console.log('Step 1/4: Creating campaign...');
      const campaignResult = await this.createCampaign(adAccountId, {
        name: campaignName,
        objective: 'OUTCOME_ENGAGEMENT',
        status: 'PAUSED',
        dailyBudget
      });

      if (!campaignResult.success) {
        results.errors.push(`Campaign: ${campaignResult.error}`);
        return { success: false, ...results };
      }
      results.campaign = campaignResult.data;

      // 2. Crear AdSet para WhatsApp
      console.log('Step 2/4: Creating ad set for WhatsApp...');
      const adSetResult = await this.createAdSetForWhatsApp(adAccountId, {
        name: adSetName || `${campaignName} - Ad Set`,
        campaignId: results.campaign.id,
        targeting,
        promotedObject: { page_id: pageId }
      });

      if (!adSetResult.success) {
        results.errors.push(`AdSet: ${adSetResult.error}`);
        return { success: false, ...results };
      }
      results.adSet = adSetResult.data;

      // 3. Crear Creative para WhatsApp (usando URL directa, sin subir imagen)
      console.log('Step 3/4: Creating creative (using image URL directly)...');
      const creativeResult = await this.createCreativeForWhatsApp(adAccountId, {
        name: `${campaignName} - Creative`,
        pageId,
        imageUrl, // Usar URL directa en lugar de imageHash
        whatsappNumber,
        primaryText: primaryTexts[0] || descriptions[0] || 'Escríbenos por WhatsApp',
        headline: headlines[0] || 'Contáctanos',
        description: descriptions[0] || '',
        callToAction
      });

      if (!creativeResult.success) {
        results.errors.push(`Creative: ${creativeResult.error}`);
        return { success: false, ...results };
      }
      results.creative = creativeResult.data;

      // 4. Crear Ad
      console.log('Step 4/4: Creating ad...');
      const adResult = await this.createAd(adAccountId, {
        name: adName || `${campaignName} - Ad`,
        adsetId: results.adSet.id,
        creativeId: results.creative.id,
        status: 'PAUSED'
      });

      if (!adResult.success) {
        results.errors.push(`Ad: ${adResult.error}`);
        return { success: false, ...results };
      }
      results.ad = adResult.data;

      return { success: true, ...results };

    } catch (error) {
      results.errors.push(`Unexpected: ${error.message}`);
      return { success: false, ...results };
    }
  }

  // Crear campaña completa para Messenger (usa URL de imagen directamente, sin subir)
  async createCampaignForMessenger(adAccountId, {
    campaignName,
    adSetName,
    adName,
    dailyBudget,
    targeting,
    pageId,
    imageUrl,
    headlines = [],
    descriptions = [],
    primaryTexts = [],
    callToAction = 'SEND_MESSAGE'
  }) {
    const results = { campaign: null, adSet: null, creative: null, ad: null, errors: [] };

    try {
      // 1. Crear Campaña
      console.log('Step 1/4: Creating campaign...');
      const campaignResult = await this.createCampaign(adAccountId, {
        name: campaignName,
        objective: 'OUTCOME_ENGAGEMENT',
        status: 'PAUSED',
        dailyBudget
      });

      if (!campaignResult.success) {
        results.errors.push(`Campaign: ${campaignResult.error}`);
        return { success: false, ...results };
      }
      results.campaign = campaignResult.data;

      // 2. Crear AdSet para Messenger
      console.log('Step 2/4: Creating ad set for Messenger...');
      const adSetResult = await this.createAdSetForMessenger(adAccountId, {
        name: adSetName || `${campaignName} - Ad Set`,
        campaignId: results.campaign.id,
        targeting,
        promotedObject: { page_id: pageId }
      });

      if (!adSetResult.success) {
        results.errors.push(`AdSet: ${adSetResult.error}`);
        return { success: false, ...results };
      }
      results.adSet = adSetResult.data;

      // 3. Crear Creative para Messenger (usando URL directa, sin subir imagen)
      console.log('Step 3/4: Creating creative (using image URL directly)...');
      const creativeResult = await this.createCreativeForMessenger(adAccountId, {
        name: `${campaignName} - Creative`,
        pageId,
        imageUrl, // Usar URL directa en lugar de imageHash
        primaryText: primaryTexts[0] || descriptions[0] || 'Envíanos un mensaje',
        headline: headlines[0] || 'Contáctanos',
        description: descriptions[0] || '',
        callToAction
      });

      if (!creativeResult.success) {
        results.errors.push(`Creative: ${creativeResult.error}`);
        return { success: false, ...results };
      }
      results.creative = creativeResult.data;

      // 4. Crear Ad
      console.log('Step 4/4: Creating ad...');
      const adResult = await this.createAd(adAccountId, {
        name: adName || `${campaignName} - Ad`,
        adsetId: results.adSet.id,
        creativeId: results.creative.id,
        status: 'PAUSED'
      });

      if (!adResult.success) {
        results.errors.push(`Ad: ${adResult.error}`);
        return { success: false, ...results };
      }
      results.ad = adResult.data;

      return { success: true, ...results };

    } catch (error) {
      results.errors.push(`Unexpected: ${error.message}`);
      return { success: false, ...results };
    }
  }

  // ============================================
  // MULTI-AD: Crear Campaign + N AdSets + N Creatives + N Ads
  // ============================================
  // adSetMode: 'single' = 1 AdSet compartido, 'per-ad' = 1 AdSet por anuncio
  async createCampaignWithMultipleAds(adAccountId, {
    campaignName,
    objective = 'OUTCOME_TRAFFIC',
    specialAdCategories = [],
    dailyBudget,
    // Shared targeting (used when adSetMode === 'single' or as default)
    targeting,
    optimizationGoal = 'LANDING_PAGE_VIEWS',
    billingEvent = 'IMPRESSIONS',
    endDate = null,
    // Page & Instagram
    pageId,
    igActorId = null,
    linkUrl = null,
    // Multi-ad config
    adSetMode = 'single', // 'single' | 'per-ad'
    ads = [] // Array of { adName, imageUrl, imageHash, videoId, videoThumbnailUrl, headlines, descriptions, ctas, audienceId, audienceName, audienceTargeting }
  }) {
    // CTAs compatibles con LINK_CLICKS + Dynamic Creative
    const VALID_LINK_CLICKS_CTAS = [
      'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'SUBSCRIBE',
      'DOWNLOAD', 'GET_OFFER', 'APPLY_NOW', 'CONTACT_US', 'GET_QUOTE'
    ];

    // Filtra CTAs inválidos, reemplaza con LEARN_MORE si queda vacío
    const sanitizeCTAs = (ctas) => {
      const filtered = (ctas || []).filter(c => VALID_LINK_CLICKS_CTAS.includes(c));
      return filtered.length > 0 ? filtered : ['LEARN_MORE'];
    };

    const results = {
      campaign: null,
      adSets: [],
      creatives: [],
      ads: [],
      errors: []
    };

    try {
      // 1. Crear Campaña con CBO
      console.log(`Creating campaign with CBO for ${ads.length} ads...`);
      const campaignResult = await this.createCampaign(adAccountId, {
        name: campaignName,
        objective,
        status: 'PAUSED',
        specialAdCategories,
        dailyBudget
      });

      if (!campaignResult.success) {
        results.errors.push(`Campaign: ${campaignResult.error}`);
        return { success: false, ...results };
      }
      results.campaign = campaignResult.data;

      // ========================================================
      // Dynamic Creative (5+5+5) requiere 1 Ad por AdSet (limitación de Meta).
      // Ambos modos crean N AdSets con Dynamic Creative.
      // 'single': mismo targeting para todos. 'per-ad': targeting diferente.
      // Con CBO el presupuesto se distribuye automáticamente entre AdSets.
      // ========================================================
      {
        const isSingleMode = adSetMode === 'single';
        console.log(`Mode: ${isSingleMode ? 'MISMO PÚBLICO' : 'PÚBLICO POR ANUNCIO'} - ${ads.length} AdSets con Dynamic Creative (5+5+5)`);

        for (let i = 0; i < ads.length; i++) {
          const ad = ads[i];
          console.log(`Creating adSet + creative + ad ${i + 1}/${ads.length}...`);

          const adTargeting = isSingleMode ? targeting : (ad.audienceTargeting || targeting);
          const adSetSuffix = ads.length === 1 ? '' : ` ${i + 1}`;
          const audienceLabel = !isSingleMode && ad.audienceName ? ` (${ad.audienceName})` : '';

          const adSetResult = await this.createAdSet(adAccountId, {
            name: `${campaignName} - Ad Set${adSetSuffix}${audienceLabel}`,
            campaignId: results.campaign.id,
            billingEvent,
            optimizationGoal,
            targeting: adTargeting,
            status: 'PAUSED',
            endTime: endDate,
            isDynamicCreative: true
          });

          if (!adSetResult.success) {
            results.errors.push(`AdSet ${i + 1}: ${adSetResult.error}`);
            continue;
          }
          results.adSets.push(adSetResult.data);

          const validTitles = ad.headlines?.filter(t => t?.trim()) || ['Conoce más'];
          const validBodies = ad.descriptions?.filter(b => b?.trim()) || ['Descubre más'];
          const validCTAs = sanitizeCTAs(ad.ctas);

          // Resolver thumbnail si es video
          let resolvedThumbUrl = ad.videoThumbnailUrl || null;
          let resolvedThumbHash = ad.imageHash || null;
          if (ad.videoId && !resolvedThumbHash && !resolvedThumbUrl) {
            try {
              const thumbResponse = await axios.get(`${BACKEND_API_URL}/video-thumbnail/${ad.videoId}`, {
                params: { adAccountId: this.normalizeAccountId(adAccountId) }
              });
              if (thumbResponse.data?.data?.thumbnailUrl) {
                resolvedThumbUrl = thumbResponse.data.data.thumbnailUrl;
              } else if (thumbResponse.data?.data?.thumbnailHash) {
                resolvedThumbHash = thumbResponse.data.data.thumbnailHash;
              }
            } catch (err) {
              console.warn('Thumbnail fetch failed for ad', i, err.message);
            }
          }

          const creativeResult = await this.createAdCreativeWithAssetFeedSpec(adAccountId, {
            name: `${ad.adName || campaignName + ' Ad ' + (i + 1)} - Creative`,
            pageId,
            imageUrl: !ad.videoId ? ad.imageUrl : null,
            imageHash: !ad.videoId ? ad.imageHash : null,
            imageHash9x16: !ad.videoId ? ad.imageHash9x16 : null,
            videoId: ad.videoId || null,
            thumbnailHash: resolvedThumbHash || null,
            thumbnailUrl: resolvedThumbUrl || null,
            titles: validTitles,
            bodies: validBodies,
            descriptions: validBodies,
            callToActionTypes: validCTAs,
            linkUrl,
            igActorId
          });

          if (!creativeResult.success) {
            results.errors.push(`Creative ${i + 1}: ${creativeResult.error}`);
            continue;
          }
          results.creatives.push(creativeResult.data);

          const adResult = await this.createAd(adAccountId, {
            name: ad.adName || `${campaignName} - Ad ${i + 1}`,
            adsetId: adSetResult.data.id,
            creativeId: creativeResult.data.id,
            status: 'PAUSED'
          });

          if (!adResult.success) {
            results.errors.push(`Ad ${i + 1}: ${adResult.error}`);
            continue;
          }
          results.ads.push(adResult.data);
        }
      }

      const totalCreated = results.ads.length;
      const totalFailed = ads.length - totalCreated;
      console.log(`Multi-ad campaign created: 1 Campaign + ${results.adSets.length} AdSets + ${results.creatives.length} Creatives + ${totalCreated} Ads${totalFailed > 0 ? ` (${totalFailed} failed)` : ''}`);

      return {
        success: totalCreated > 0,
        ...results,
        totalCreated,
        totalFailed
      };

    } catch (error) {
      results.errors.push(`Unexpected: ${error.message}`);
      return { success: false, ...results };
    }
  }
}

export default MetaAdsService;
