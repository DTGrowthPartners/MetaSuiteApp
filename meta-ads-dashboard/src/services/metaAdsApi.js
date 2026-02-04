import axios from 'axios';

const META_API_BASE_URL = 'https://graph.facebook.com/v18.0';

// Backend URL para endpoints que requieren proxy (uploads, etc.)
const BACKEND_API_URL = import.meta.env.VITE_API_URL || 'https://metasuite.dtgrowthpartners.com/api';

class MetaAdsService {
  constructor(accessToken, adAccountId = null) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
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
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Campaign creation error:', JSON.stringify(error.response?.data, null, 2) || error.message);
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
    status = 'PAUSED'
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
      return { success: true, data: response.data };
    } catch (error) {
      console.error('AdSet creation error:', JSON.stringify(error.response?.data, null, 2) || error.message);
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
    imageHash, // thumbnail
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
      const objectStorySpec = {
        page_id: pageId,
        video_data: {
          video_id: videoId,
          message: primaryText,
          call_to_action: {
            type: callToAction,
            value: {
              link: linkUrl,
              link_caption: headline // Muestra debajo del video
            }
          }
        }
      };

      if (imageHash) {
        objectStorySpec.video_data.image_hash = imageHash;
      }

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
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Ad creation error:', JSON.stringify(error.response?.data, null, 2) || error.message);
      const errorMsg = error.response?.data?.error?.message || error.message;
      return { success: false, error: errorMsg };
    }
  }

  // Crear Ad Creative con Asset Feed Spec (múltiples títulos, descripciones y CTAs)
  // Usa URL de imagen directamente (sin necesidad de subir)
  async createAdCreativeWithAssetFeedSpec(adAccountId, {
    name,
    pageId,
    imageHash = null, // Opcional - si se subió la imagen
    imageUrl = null,  // URL directa de la imagen (sin subir)
    titles, // Array de títulos (max 5)
    bodies, // Array de descripciones/textos primarios (max 5)
    descriptions, // Array de descripciones link (max 5)
    callToActionTypes, // Array de CTAs (max 5)
    linkUrl,
    igActorId = null
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      // Asset Feed Spec para Dynamic Creative Optimization
      // Usar URL directa si no hay hash, o hash si está disponible
      const assetFeedSpec = {
        images: imageHash ? [{ hash: imageHash }] : [{ url: imageUrl }],
        bodies: bodies.slice(0, 5).map(text => ({ text })),
        titles: titles.slice(0, 5).map(text => ({ text })),
        descriptions: descriptions.slice(0, 5).map(text => ({ text })),
        call_to_action_types: [...new Set(callToActionTypes.slice(0, 5))], // Unique CTAs
        link_urls: [{ website_url: linkUrl }],
        ad_formats: ['SINGLE_IMAGE']
      };

      const objectStorySpec = {
        page_id: pageId
      };

      if (igActorId) {
        objectStorySpec.instagram_actor_id = igActorId;
      }

      console.log('Creating Asset Feed Spec creative:', {
        name,
        pageId,
        imageHash: imageHash || 'N/A (using URL)',
        imageUrl: imageUrl || 'N/A (using hash)',
        titles: titles.length,
        bodies: bodies.length,
        descriptions: descriptions.length,
        callToActionTypes
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
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Asset Feed Creative creation error:', JSON.stringify(error.response?.data, null, 2) || error.message);
      const errorMsg = error.response?.data?.error?.message || error.message;
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
    billingEvent = 'IMPRESSIONS'
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
        status: 'PAUSED'
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

  // Crear Campaign + AdSet + Creative + Ad completo con Asset Feed Spec (5-5-5)
  // NOTA: Usa URL de imagen directamente sin subir (evita errores de permisos)
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
    // Creative & Ad
    adName,
    pageId,
    imageUrl, // URL de imagen (se usa directamente, sin subir)
    titles, // Array de 5 títulos
    bodies, // Array de 5 textos primarios (descripciones largas)
    descriptions, // Array de 5 descripciones cortas
    callToActionTypes, // Array de 5 CTAs
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

      // 2. Crear AdSet
      console.log('Step 2/4: Creating ad set...');
      const adSetResult = await this.createAdSet(adAccountId, {
        name: adSetName || `${campaignName} - Ad Set`,
        campaignId: results.campaign.id,
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

      // 3. Crear Creative con Asset Feed Spec (usando URL directa, sin subir imagen)
      console.log('Step 3/4: Creating creative with Asset Feed Spec (using image URL directly)...');
      const creativeResult = await this.createAdCreativeWithAssetFeedSpec(adAccountId, {
        name: `${adName} - Creative`,
        pageId,
        imageUrl, // Usar URL directa en lugar de imageHash
        titles,
        bodies,
        descriptions,
        callToActionTypes,
        linkUrl,
        igActorId
      });

      if (!creativeResult.success) {
        results.errors.push(`Creative: ${creativeResult.error}`);
        return { success: false, ...results };
      }
      results.creative = creativeResult.data;

      // 4. Crear Ad
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

      console.log('Campaign with Ad created successfully!');
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
}

export default MetaAdsService;
