import axios from 'axios';

const META_API_BASE_URL = 'https://graph.facebook.com/v24.0';

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
  async analyzeVideoFile(file, adIndex = 0, category = null, objective = '', templateName = '', destType = '', textLength = 'medium', campaignContext = '') {
    try {
      console.log(`Analyzing video for ad ${adIndex}: ${file.name}`);
      const formData = new globalThis.FormData();
      formData.append('video', file);
      formData.append('adIndex', adIndex.toString());
      if (category) formData.append('category', category);
      if (objective) formData.append('objective', objective);
      if (templateName) formData.append('templateName', templateName);
      if (destType) formData.append('destType', destType);
      if (textLength) formData.append('textLength', textLength);
      if (campaignContext) formData.append('campaignContext', campaignContext);

      const response = await axios.post(`${BACKEND_API_URL}/analyze-video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 minutes for large video transcription + AI analysis
        maxContentLength: Infinity,
        maxBodyLength: Infinity
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
  async analyzeImageFile(file, adIndex = 0, category = null, objective = '', templateName = '', destType = '', textLength = 'medium', campaignContext = '') {
    try {
      console.log(`Analyzing image for ad ${adIndex}: ${file.name}`);
      const formData = new globalThis.FormData();
      formData.append('image', file);
      formData.append('adIndex', adIndex.toString());
      if (category) formData.append('category', category);
      if (objective) formData.append('objective', objective);
      if (templateName) formData.append('templateName', templateName);
      if (destType) formData.append('destType', destType);
      if (textLength) formData.append('textLength', textLength);
      if (campaignContext) formData.append('campaignContext', campaignContext);

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

  // Analyze media from URL (server-side download, for Meta library media)
  async analyzeMediaUrl(url, type = 'image', adIndex = 0, category = '', objective = '', templateName = '', destType = '', textLength = 'medium', campaignContext = '') {
    try {
      console.log(`Analyzing ${type} from URL for ad ${adIndex}: ${url.substring(0, 80)}...`);
      const response = await axios.post(`${BACKEND_API_URL}/analyze-media-url`, {
        url, type, adIndex, category, objective, templateName, destType, textLength, campaignContext
      }, {
        timeout: type === 'video' ? 600000 : 60000 // 10min for video, 1min for image
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('analyzeMediaUrl error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || error.message };
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
          fields: 'id,name,account_status,disable_reason,currency,amount_spent,business{id,name}',
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

  // Verificar permisos del token actual
  async debugTokenPermissions() {
    try {
      const response = await axios.get(`${META_API_BASE_URL}/me/permissions`, {
        params: { access_token: this.accessToken }
      });
      const permissions = response.data.data || [];
      const granted = permissions.filter(p => p.status === 'granted').map(p => p.permission);
      const declined = permissions.filter(p => p.status === 'declined').map(p => p.permission);
      console.log('TOKEN PERMISSIONS - Granted:', granted);
      if (declined.length > 0) console.warn('TOKEN PERMISSIONS - Declined:', declined);
      console.log('Has whatsapp_business_management:', granted.includes('whatsapp_business_management'));
      return { granted, declined };
    } catch (error) {
      console.error('Error checking token permissions:', error.response?.data?.error || error.message);
      return { granted: [], declined: [] };
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
          fields: 'id,name,account_status,disable_reason,currency,amount_spent',
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
          fields: 'id,name,account_status,disable_reason,currency,amount_spent',
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

  // =============================================
  // WHATSAPP BUSINESS - Obtener números de WhatsApp
  // =============================================

  // Obtener cuentas de WhatsApp Business asociadas a un Business Manager
  async getWhatsAppBusinessAccounts(businessId) {
    try {
      console.log('Fetching WhatsApp Business accounts for business:', businessId);

      // 1. Intentar cuentas propias (owned) primero
      try {
        const ownedResponse = await axios.get(`${META_API_BASE_URL}/${businessId}/owned_whatsapp_business_accounts`, {
          params: {
            access_token: this.accessToken,
            fields: 'id,name'
          }
        });
        const owned = ownedResponse.data.data || [];
        console.log(`Business ${businessId} owned WABA:`, owned.length);
        if (owned.length > 0) return owned;
      } catch (err) {
        console.warn(`Business ${businessId} owned WABA error:`, err.response?.data?.error?.message || err.message);
      }

      // 2. Solo si owned no encontró nada, intentar client
      try {
        const clientResponse = await axios.get(`${META_API_BASE_URL}/${businessId}/client_whatsapp_business_accounts`, {
          params: {
            access_token: this.accessToken,
            fields: 'id,name'
          }
        });
        const clients = clientResponse.data.data || [];
        console.log(`Business ${businessId} client WABA:`, clients.length);
        return clients;
      } catch (err) {
        console.warn(`Business ${businessId} client WABA error:`, err.response?.data?.error?.message || err.message);
      }

      return [];
    } catch (error) {
      console.error(`Get WhatsApp Business accounts error for business ${businessId}:`, error.message);
      return [];
    }
  }

  // Obtener números de teléfono de una cuenta de WhatsApp Business
  async getWhatsAppPhoneNumbers(whatsappBusinessAccountId) {
    try {
      console.log('Fetching WhatsApp phone numbers for account:', whatsappBusinessAccountId);
      const response = await axios.get(
        `${META_API_BASE_URL}/${whatsappBusinessAccountId}/phone_numbers`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,display_phone_number,verified_name,code_verification_status,quality_score,name_status,status'
          }
        }
      );
      console.log('WhatsApp phone numbers:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('Get WhatsApp phone numbers error:', error.response?.data?.error || error.message);
      return [];
    }
  }

  // Obtener todos los números de WhatsApp Business de todos los businesses del usuario
  async getAllWhatsAppPhoneNumbers() {
    try {
      const allNumbers = [];
      const businesses = await this.getBusinesses();
      
      console.log('Fetching WhatsApp numbers from', businesses.length, 'businesses');

      for (const business of businesses) {
        try {
          const waAccounts = await this.getWhatsAppBusinessAccounts(business.id);
          
          for (const waAccount of waAccounts) {
            const phoneNumbers = await this.getWhatsAppPhoneNumbers(waAccount.id);
            
            for (const phone of phoneNumbers) {
              allNumbers.push({
                ...phone,
                business_id: business.id,
                business_name: business.name,
                whatsapp_business_account_id: waAccount.id,
                whatsapp_business_account_name: waAccount.name
              });
            }
          }
        } catch (err) {
          console.warn(`Error fetching WhatsApp for business ${business.name}:`, err.message);
        }
      }

      console.log('Total WhatsApp phone numbers found:', allNumbers.length);
      return allNumbers;
    } catch (error) {
      console.error('getAllWhatsAppPhoneNumbers error:', error);
      return [];
    }
  }

  // Obtener números de WhatsApp desde una cuenta publicitaria (ad account → business → WABA → phone numbers)
  async getWhatsAppNumbersFromAdAccount(adAccountId) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);
      console.log('Getting WhatsApp numbers via ad account business:', normalizedId);

      // Paso 1: Obtener el business asociado a la cuenta publicitaria
      const adAccountResponse = await axios.get(`${META_API_BASE_URL}/${normalizedId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'business{id,name}'
        }
      });

      const business = adAccountResponse.data?.business;
      if (!business) {
        console.log('No business found for ad account:', normalizedId);
        return [];
      }

      console.log('Found business for ad account:', business.id, business.name);

      // Paso 2: Obtener cuentas de WhatsApp Business del business
      const waAccounts = await this.getWhatsAppBusinessAccounts(business.id);
      console.log('WhatsApp Business accounts from ad account business:', waAccounts.length);

      // Paso 3: Obtener números de cada cuenta de WhatsApp
      const allNumbers = [];
      for (const waAccount of waAccounts) {
        const phoneNumbers = await this.getWhatsAppPhoneNumbers(waAccount.id);
        for (const phone of phoneNumbers) {
          allNumbers.push({
            ...phone,
            business_id: business.id,
            business_name: business.name,
            whatsapp_business_account_id: waAccount.id,
            whatsapp_business_account_name: waAccount.name
          });
        }
      }

      console.log('WhatsApp numbers from ad account business:', allNumbers.length);
      return allNumbers;
    } catch (error) {
      console.error('getWhatsAppNumbersFromAdAccount error:', error.response?.data?.error || error.message);
      return [];
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

  // Obtener cuentas de Instagram desde el business de la cuenta publicitaria
  async getInstagramAccountsFromAdAccount(adAccountId) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);
      console.log('Getting Instagram accounts via ad account business:', normalizedId);

      // Paso 1: Obtener el business de la cuenta publicitaria
      const adAccountResponse = await axios.get(`${META_API_BASE_URL}/${normalizedId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'business{id,name}'
        }
      });

      const business = adAccountResponse.data?.business;
      if (!business) {
        console.log('No business found for ad account:', normalizedId);
        return [];
      }

      console.log('Found business for IG:', business.id, business.name);

      // Paso 2: Obtener IG accounts owned por el business
      const allIg = [];
      try {
        const ownedResponse = await axios.get(`${META_API_BASE_URL}/${business.id}/owned_instagram_accounts`, {
          params: {
            access_token: this.accessToken,
            fields: 'id,username'
          }
        });
        const owned = ownedResponse.data.data || [];
        console.log(`Business ${business.id} owned IG:`, owned.length);
        allIg.push(...owned);
      } catch (err) {
        console.warn(`Business ${business.id} owned_instagram_accounts error:`, err.response?.data?.error?.message || err.message);
      }

      // Paso 3: Si no hay owned, intentar client
      if (allIg.length === 0) {
        try {
          const clientResponse = await axios.get(`${META_API_BASE_URL}/${business.id}/client_instagram_accounts`, {
            params: {
              access_token: this.accessToken,
              fields: 'id,username'
            }
          });
          const clients = clientResponse.data.data || [];
          console.log(`Business ${business.id} client IG:`, clients.length);
          allIg.push(...clients);
        } catch (err) {
          console.warn(`Business ${business.id} client_instagram_accounts error:`, err.response?.data?.error?.message || err.message);
        }
      }

      // Paso 4: Último fallback - instagram_accounts del business
      if (allIg.length === 0) {
        try {
          const bizResponse = await axios.get(`${META_API_BASE_URL}/${business.id}/instagram_accounts`, {
            params: {
              access_token: this.accessToken,
              fields: 'id,username'
            }
          });
          const bizIg = bizResponse.data.data || [];
          console.log(`Business ${business.id} instagram_accounts:`, bizIg.length);
          allIg.push(...bizIg);
        } catch (err) {
          console.warn(`Business ${business.id} instagram_accounts error:`, err.response?.data?.error?.message || err.message);
        }
      }

      console.log('Total IG accounts from ad account business:', allIg.length, allIg);
      return allIg;
    } catch (error) {
      console.error('getInstagramAccountsFromAdAccount error:', error.response?.data?.error?.message || error.message);
      return [];
    }
  }

  // Obtener cuentas de Instagram vinculadas a la cuenta publicitaria (endpoint directo)
  async getInstagramAccounts(adAccountId) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);
      console.log('Fetching Instagram accounts for ad account:', normalizedId);

      const response = await axios.get(`${META_API_BASE_URL}/${normalizedId}/instagram_accounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,username'
        }
      });

      console.log('Instagram accounts response:', response.data);
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error('Error fetching Instagram accounts:', error.response?.data?.error || error.message);
      return { success: false, error: error.response?.data?.error?.message || error.message, data: [] };
    }
  }

  // Obtener cuenta de Instagram vinculada a una página de Facebook
  async getInstagramAccountFromPage(pageId) {
    try {
      console.log('Fetching Instagram account from page:', pageId);

      // Primero intentar obtener instagram_business_account
      const response = await axios.get(`${META_API_BASE_URL}/${pageId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'instagram_business_account{id,username,profile_picture_url}'
        }
      });

      const igBusiness = response.data?.instagram_business_account;
      if (igBusiness) {
        console.log('Instagram business account found from page:', igBusiness.username);
        return { success: true, data: [{
          id: igBusiness.id,
          username: igBusiness.username,
          profile_pic: igBusiness.profile_picture_url || null
        }] };
      }

      // Fallback: intentar /page_id/instagram_accounts
      const response2 = await axios.get(`${META_API_BASE_URL}/${pageId}/instagram_accounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,username'
        }
      });

      console.log('Instagram accounts from page:', response2.data);
      return { success: true, data: response2.data.data || [] };
    } catch (error) {
      console.error('Error fetching Instagram from page:', error.response?.data?.error || error.message);
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
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000 // 2 minutes
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
        maxBodyLength: Infinity,
        timeout: 600000 // 10 minutes for large video uploads
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
          fields: 'id,name,access_token,website,instagram_business_account{id,username},business{id}'
        }
      });
      console.log('Pages response:', response.data);
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      console.error('getPages error:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  // Obtener números de WhatsApp desde una página específica
  async getWhatsAppNumbersFromPage(pageId) {
    try {
      console.log('Fetching WhatsApp numbers from page:', pageId);
      // Primero obtener la cuenta de WhatsApp asociada a la página
      const response = await axios.get(`${META_API_BASE_URL}/${pageId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'whatsapp_business_account{id,name}'
        }
      });
      
      const waAccount = response.data?.whatsapp_business_account;
      if (!waAccount) {
        console.log('No WhatsApp business account found for page:', pageId);
        return [];
      }
      
      // Ahora obtener los números de teléfono
      const phoneResponse = await axios.get(
        `${META_API_BASE_URL}/${waAccount.id}/phone_numbers`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,display_phone_number,verified_name,code_verification_status,quality_score'
          }
        }
      );
      
      console.log('WhatsApp phone numbers from page:', phoneResponse.data);
      return phoneResponse.data.data || [];
    } catch (error) {
      const errDetail = error.response?.data?.error;
      console.error('getWhatsAppNumbersFromPage error:', {
        pageId,
        code: errDetail?.code,
        subcode: errDetail?.error_subcode,
        message: errDetail?.message,
        type: errDetail?.type,
        hint: errDetail?.code === 100
          ? 'El token puede no tener permiso whatsapp_business_management o la página no tiene WhatsApp Business vinculado'
          : error.message
      });
      return [];
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
      } else {
        // Sin CBO: presupuesto va en el ad set, Meta requiere estos campos
        formData.append('is_campaign_budget_optimization', 'false');
        formData.append('is_adset_budget_sharing_enabled', 'false');
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
    status = 'ACTIVE',
    endTime = null, // Fecha de fin en formato ISO o timestamp UNIX
    isDynamicCreative = false, // Para Asset Feed Spec (5+5+5 en 1 anuncio)
    destinationType = null, // 'WEBSITE', 'INSTAGRAM_PROFILE', etc. (null = Meta decide)
    promotedObject = null // { page_id: '...' } para Instagram Profile / Facebook Page
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
      // Limpiar targeting_optimization (eliminado por Meta Feb 2026)
      const cleanTargeting = { ...targeting };
      delete cleanTargeting.targeting_optimization;
      formData.append('targeting', JSON.stringify(cleanTargeting));
      formData.append('status', status);

      // destination_type para indicar a Meta a dónde va el tráfico
      if (destinationType) {
        formData.append('destination_type', destinationType);
        console.log('AdSet destination_type:', destinationType);
      }

      // promoted_object para Instagram Profile / Facebook Page
      if (promotedObject && Object.keys(promotedObject).length > 0) {
        formData.append('promoted_object', JSON.stringify(promotedObject));
        console.log('AdSet promoted_object:', promotedObject);
      }

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
    igActorId = null,
    whatsappNumber = ''
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
          value: callToAction === 'WHATSAPP_MESSAGE' 
            ? { wa_id: whatsappNumber || linkUrl } 
            : { link: linkUrl }
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
        objectStorySpec.instagram_user_id = igActorId;
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
    igActorId = null,
    whatsappNumber = ''
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
            value: callToAction === 'WHATSAPP_MESSAGE' 
              ? { wa_id: whatsappNumber || linkUrl } 
              : { link: linkUrl }
          }
        }
      };

      if (igActorId) {
        objectStorySpec.instagram_user_id = igActorId;
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
  async createAd(adAccountId, { name, adsetId, creativeId, status = 'ACTIVE' }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      // Solo referencia al creative - degrees_of_freedom_spec se configura a nivel del AdCreative, no del Ad
      const creativeSpec = {
        creative_id: creativeId
      };

      console.log('Creating ad:', { name, adsetId, creativeId, status });

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('adset_id', adsetId);
      formData.append('creative', JSON.stringify(creativeSpec));
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
        return { success: false, error: errorMsg, errorSubcode: err.error_subcode };
      }
      console.log('Ad creation SUCCESS:', JSON.stringify(response.data));
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Ad creation FAILED:', JSON.stringify(error.response?.data, null, 2) || error.message);
      const errData = error.response?.data?.error;
      const errorMsg = errData?.error_user_msg || errData?.message || error.message;
      return { success: false, error: errorMsg, errorSubcode: errData?.error_subcode };
    }
  }

  // NOTA (actualizado Mar 2026): creative_asset_groups_spec (Flexible Ads) SÍ funciona via API
  // pero SOLO para OUTCOME_SALES y OUTCOME_APP_PROMOTION.
  // Se envía como parámetro separado en /ads (no dentro del creative).
  // El creative lleva un object_story_spec básico (page_id) y el contenido va en creative_asset_groups_spec.

  // Crear Ad con Formato Flexible (creative_asset_groups_spec)
  // Solo soportado para OUTCOME_SALES y OUTCOME_APP_PROMOTION
  async createFlexibleAd(adAccountId, {
    name,
    adsetId,
    pageId,
    igActorId = null,
    images = [],        // [{ hash: 'abc123' }, ...]
    videos = [],        // [{ video_id: '123' }, ...]
    texts = [],         // [{ text: '...', text_type: 'primary_text' }, { text: '...', text_type: 'headline' }]
    callToAction,       // { type: 'SHOP_NOW', value: { link: 'https://...' } }
    linkUrl = null,
    status = 'ACTIVE'
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      // object_story_spec necesita link_data con link obligatorio
      // creative_asset_groups_spec maneja los múltiples activos, pero el creative base requiere un link
      const objectStorySpec = { page_id: pageId };
      if (igActorId) {
        objectStorySpec.instagram_user_id = igActorId;
      }

      // Determinar el link a usar
      const resolvedLink = linkUrl || callToAction?.value?.link || '';
      const firstPrimaryText = texts.find(t => t.text_type === 'primary_text')?.text || '';
      const firstHeadline = texts.find(t => t.text_type === 'headline')?.text || '';

      // Obtener primera descripción si existe
      const firstDescription = texts.find(t => t.text_type === 'description')?.text || '';

      if (videos.length > 0) {
        // Video: usar video_data
        objectStorySpec.video_data = {
          video_id: videos[0].video_id,
          message: firstPrimaryText,
          title: firstHeadline,
          call_to_action: {
            type: callToAction?.type || 'LEARN_MORE',
            value: { link: resolvedLink }
          }
        };
        // Thumbnail: image_hash tiene prioridad, luego image_url, luego auto-fetch
        if (videos[0].image_hash) {
          objectStorySpec.video_data.image_hash = videos[0].image_hash;
        } else if (videos[0].image_url) {
          objectStorySpec.video_data.image_url = videos[0].image_url;
        } else {
          // Fallback: obtener thumbnail automáticamente del video via servidor proxy
          console.log('Flexible Ad: no thumbnail, fetching from server for video:', videos[0].video_id);
          try {
            const thumbResponse = await axios.get(`${BACKEND_API_URL}/video-thumbnail/${videos[0].video_id}`, {
              params: { adAccountId: normalizedId }
            });
            const autoThumbUrl = thumbResponse.data?.data?.thumbnailUrl || '';
            const autoThumbHash = thumbResponse.data?.data?.thumbnailHash || '';
            if (autoThumbHash) {
              objectStorySpec.video_data.image_hash = autoThumbHash;
            } else if (autoThumbUrl) {
              objectStorySpec.video_data.image_url = autoThumbUrl;
            } else {
              console.warn('Flexible Ad: server could not obtain thumbnail for video:', videos[0].video_id);
            }
          } catch (thumbErr) {
            console.warn('Flexible Ad: failed to fetch video thumbnail:', thumbErr.message);
          }
        }
        if (firstDescription) {
          objectStorySpec.video_data.link_description = firstDescription;
        }
      } else {
        // Imagen: usar link_data
        objectStorySpec.link_data = {
          link: resolvedLink,
          message: firstPrimaryText,
          name: firstHeadline,
          call_to_action: {
            type: callToAction?.type || 'LEARN_MORE',
            value: { link: resolvedLink }
          }
        };
        if (firstDescription) {
          objectStorySpec.link_data.description = firstDescription;
        }
        if (images.length > 0 && images[0].hash) {
          objectStorySpec.link_data.image_hash = images[0].hash;
        }
      }

      // Creative inline
      const creative = {
        name: name + ' - Creative',
        object_story_spec: objectStorySpec
      };

      // Construir creative_asset_groups_spec
      const group = {};

      if (images.length > 0) {
        group.images = images.map(img => ({ hash: img.hash }));
      }
      if (videos.length > 0) {
        group.videos = videos.map(vid => {
          const v = { video_id: vid.video_id };
          if (vid.image_hash) {
            v.image_hash = vid.image_hash;
          } else if (vid.image_url) {
            v.image_url = vid.image_url;
          }
          return v;
        });
      }

      // Textos: primary_text, headline y description (máximo 5 por text_type = 15 total)
      group.texts = texts.filter(t => t.text?.trim()).slice(0, 15); // max 5+5+5

      // CTA — todos deben tener el mismo type
      // Flexible ads SIEMPRE requieren link en call_to_action.value (incluso messaging)
      if (callToAction) {
        // Asegurar que siempre haya un link en el value
        if (!callToAction.value?.link && linkUrl) {
          callToAction.value = { ...callToAction.value, link: linkUrl };
        }
        group.call_to_action = callToAction;
      }

      const creativeAssetGroupsSpec = { groups: [group] };

      console.log('Creating flexible ad:', {
        name, adsetId, pageId,
        images: images.length, videos: videos.length,
        texts: texts.length, cta: callToAction?.type,
        igActorId: igActorId || 'none'
      });
      console.log('creative_asset_groups_spec:', JSON.stringify(creativeAssetGroupsSpec, null, 2));

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('adset_id', adsetId);
      formData.append('creative', JSON.stringify(creative));
      formData.append('creative_asset_groups_spec', JSON.stringify(creativeAssetGroupsSpec));
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

      if (response.data?.error) {
        const err = response.data.error;
        const errorMsg = err.error_user_msg || err.message || 'Error desconocido';
        console.error('Flexible ad creation FAILED (200 with error):', errorMsg);
        return { success: false, error: errorMsg, errorSubcode: err.error_subcode };
      }
      console.log('Flexible ad creation SUCCESS:', JSON.stringify(response.data));
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Flexible ad creation FAILED:', JSON.stringify(error.response?.data, null, 2) || error.message);
      const errData = error.response?.data?.error;
      const errorMsg = errData?.error_user_msg || errData?.message || error.message;
      return { success: false, error: errorMsg, errorSubcode: errData?.error_subcode };
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
    igActorId = null,
    whatsappNumber = null
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      const objectStorySpec = { page_id: pageId };

      // Usar instagram_user_id (reemplazo de instagram_actor_id deprecado) en object_story_spec
      if (igActorId) {
        objectStorySpec.instagram_user_id = igActorId;
        console.log('Using instagram_user_id in objectStorySpec:', igActorId);
      }

      // Determinar CTA value según tipo
      const isMessagingCTA = ['WHATSAPP_MESSAGE', 'MESSAGE_PAGE', 'INSTAGRAM_MESSAGE'].includes(callToAction);
      const ctaValue = isMessagingCTA ? {} : { link: linkUrl };

      if (videoId) {
        // Video creative usando video_data
        const videoData = {
          video_id: videoId,
          message: primaryText,
          title: headline,
          call_to_action: {
            type: callToAction,
            value: ctaValue
          }
        };
        if (thumbnailUrl) videoData.image_url = thumbnailUrl;
        if (description && description.trim()) videoData.link_description = description;
        objectStorySpec.video_data = videoData;
      } else {
        // Image creative usando link_data
        const linkData = {
          message: primaryText,
          name: headline,
          call_to_action: { type: callToAction, value: ctaValue }
        };
        // Solo agregar link para destinos no-messaging (WhatsApp/Messenger/IG DM no usan link)
        if (!isMessagingCTA && linkUrl) {
          linkData.link = linkUrl;
        }
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

      console.log('Creating standard creative:', {
        name, pageId,
        type: videoId ? 'VIDEO' : 'IMAGE',
        headline,
        primaryText: primaryText?.substring(0, 50) + '...',
        linkUrl, callToAction,
        igActorId: igActorId || 'none'
      });

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('object_story_spec', JSON.stringify(objectStorySpec));

      // Advantage+ creative features — NO enhance_cta para messaging CTAs
      // (enhance_cta puede inyectar link en CTA value, incompatible con WHATSAPP_MESSAGE/MESSAGE_PAGE/INSTAGRAM_MESSAGE)
      const stdCreativeFeatures = {
        text_optimizations: { enroll_status: 'OPT_IN' },
        image_touchups: { enroll_status: 'OPT_IN' },
        inline_comment: { enroll_status: 'OPT_IN' }
      };
      if (!isMessagingCTA) {
        stdCreativeFeatures.enhance_cta = { enroll_status: 'OPT_IN' };
      }
      formData.append('degrees_of_freedom_spec', JSON.stringify({
        creative_features_spec: stdCreativeFeatures,
        text_transformation_types: ['TEXT_LIQUIDITY']
      }));

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
    igActorId = null,
    isWhatsApp = false, // WhatsApp: minimal asset_feed_spec sin link_urls ni ad_formats
    isInstagramDM = false // IG DM: SIEMPRE requiere link_urls con ig.me/m/{igActorId} (error 1885869 sin ellas)
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      // Asset Feed Spec - Dynamic Creative (5+5+5 en 1 solo anuncio)
      const assetFeedSpec = {
        bodies: bodies.slice(0, 5).map(text => ({ text })),
        titles: titles.slice(0, 5).map(text => ({ text })),
        descriptions: descriptions.slice(0, 5).map(text => ({ text })),
      };

      // CTA types en asset_feed_spec (requerido por Meta para dynamic creative)
      assetFeedSpec.call_to_action_types = [...new Set(callToActionTypes.slice(0, 5))];

      // WhatsApp: NO necesita link_urls (el destino viene del ad set)
      // IG DM: SIEMPRE requiere link_urls (error 1885869 sin ellas, aplica a TODOS los objetivos)
      if (isInstagramDM && igActorId) {
        assetFeedSpec.link_urls = [{ website_url: `https://ig.me/m/${igActorId}` }];
      } else if (linkUrl && !isWhatsApp) {
        assetFeedSpec.link_urls = [{ website_url: linkUrl }];
      }

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
      } else if (imageHash && imageHash9x16 && !isWhatsApp) {
        // Imagen con versión 9:16 para Stories/Reels (solo web/Messenger)
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
      // Usar instagram_user_id (reemplazo de instagram_actor_id deprecado) en object_story_spec
      if (igActorId) {
        objectStorySpec.instagram_user_id = igActorId;
        console.log('Using instagram_user_id in objectStorySpec:', igActorId);
      }

      console.log('Creating Asset Feed Spec creative (5+5+5):', {
        name, pageId,
        type: videoId ? 'VIDEO' : 'IMAGE',
        videoId: videoId || 'N/A',
        thumbnailHash: thumbnailHash || 'N/A',
        imageHash9x16: imageHash9x16 || 'N/A',
        titles: titles.length, bodies: bodies.length,
        descriptions: descriptions.length, callToActionTypes,
        igActorId: igActorId || 'none'
      });
      console.log('objectStorySpec:', JSON.stringify(objectStorySpec));
      console.log('assetFeedSpec:', JSON.stringify(assetFeedSpec, null, 2));

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('object_story_spec', JSON.stringify(objectStorySpec));
      formData.append('asset_feed_spec', JSON.stringify(assetFeedSpec));

      // Advantage+ creative features — NO enhance_cta para WhatsApp/Messaging
      // (enhance_cta puede inyectar link en CTA value, incompatible con WHATSAPP_MESSAGE)
      const creativeFeatures = {
        text_optimizations: { enroll_status: 'OPT_IN' },
        image_touchups: { enroll_status: 'OPT_IN' },
        inline_comment: { enroll_status: 'OPT_IN' }
      };
      if (!isWhatsApp && !isInstagramDM) {
        creativeFeatures.enhance_cta = { enroll_status: 'OPT_IN' };
      }
      formData.append('degrees_of_freedom_spec', JSON.stringify({
        creative_features_spec: creativeFeatures,
        text_transformation_types: ['TEXT_LIQUIDITY']
      }));

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
        status: 'ACTIVE',
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
        status: 'ACTIVE',
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
        status: 'ACTIVE'
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
        status: 'ACTIVE'
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
        status: 'ACTIVE'
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
    status = 'ACTIVE',
    promotedObject = null,
    whatsappPhoneNumber = null, // Número de teléfono real (ej: "573007189383")
    dailyBudget = null, // Presupuesto a nivel de ad set (cuando no es CBO)
    isDynamicCreative = false, // true para habilitar 5+5+5 (Asset Feed Spec)
    startTime = null, // Fecha de inicio (ISO string o timestamp UNIX)
    endTime = null, // Fecha de fin (ISO string o timestamp UNIX)
    bidStrategy = 'LOWEST_COST_WITHOUT_CAP', // Estrategia de puja para non-CBO
    bidAmount = null // Monto de puja (para COST_CAP o BID_CAP)
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('campaign_id', campaignId);
      formData.append('billing_event', billingEvent);
      formData.append('optimization_goal', optimizationGoal);
      // Limpiar targeting_optimization (eliminado por Meta Feb 2026)
      const cleanTargeting = { ...targeting };
      delete cleanTargeting.targeting_optimization;
      formData.append('targeting', JSON.stringify(cleanTargeting));
      formData.append('status', status);
      formData.append('destination_type', 'WHATSAPP');

      // Dynamic Creative permite 5+5+5 (múltiples títulos, descripciones, CTAs)
      if (isDynamicCreative) {
        formData.append('is_dynamic_creative', 'true');
      }

      // Fecha de inicio
      if (startTime) {
        const startTimestamp = typeof startTime === 'string' && startTime.includes('-')
          ? Math.floor(new Date(startTime).getTime() / 1000)
          : startTime;
        formData.append('start_time', startTimestamp.toString());
      }

      // Fecha de fin
      if (endTime) {
        const endTimestamp = typeof endTime === 'string' && endTime.includes('-')
          ? Math.floor(new Date(endTime + (endTime.includes('T') ? '' : 'T23:59:59')).getTime() / 1000)
          : endTime;
        formData.append('end_time', endTimestamp.toString());
      }

      // Si el presupuesto es a nivel de ad set (no CBO), incluirlo aquí
      if (dailyBudget) {
        formData.append('daily_budget', dailyBudget.toString());
        formData.append('bid_strategy', bidStrategy || 'LOWEST_COST_WITHOUT_CAP');
        // Monto de puja para COST_CAP o BID_CAP
        if (bidAmount && bidStrategy !== 'LOWEST_COST_WITHOUT_CAP') {
          formData.append('bid_amount', bidAmount.toString());
        }
        console.log('AdSet budget (non-CBO):', dailyBudget, 'bid_strategy:', bidStrategy);
      }

      const promotedObj = {};

      if (promotedObject?.page_id) {
        promotedObj.page_id = promotedObject.page_id;
      }

      // Pasar el número de WhatsApp específico para que Meta use ese número, no el default de la página
      if (whatsappPhoneNumber) {
        const cleanNumber = whatsappPhoneNumber.replace(/\D/g, '');
        promotedObj.whatsapp_phone_number = '+' + cleanNumber;
      }

      if (Object.keys(promotedObj).length > 0) {
        formData.append('promoted_object', JSON.stringify(promotedObj));
        console.log('WhatsApp promoted_object:', promotedObj);
      } else {
        console.warn('No page_id provided for WhatsApp campaign');
      }

      console.log('Creating WhatsApp AdSet with params:', {
        name, campaignId, billingEvent, optimizationGoal, status,
        destination_type: 'WHATSAPP',
        page_id: promotedObject?.page_id,
        whatsapp_phone_number: whatsappPhoneNumber,
        targeting: JSON.stringify(targeting).substring(0, 200)
      });

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adsets`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errData = error.response?.data?.error;
      console.error('AdSet for WhatsApp FULL error:', JSON.stringify(error.response?.data, null, 2));
      let errorMsg = errData?.error_user_msg || errData?.message || error.message;
      // Error específico: ToS de Lead Generation no aceptados (subcode 1815089)
      if (errData?.error_subcode === 1815089) {
        errorMsg = 'Tu página de Facebook debe aceptar las Condiciones del Servicio de Generación de Clientes Potenciales. Ve a la configuración de tu página en Facebook → Herramientas de publicación → Formularios de clientes potenciales y acepta los términos.';
      }
      return { success: false, error: errorMsg };
    }
  }

  // Crear AdSet para Messenger
  async createAdSetForMessenger(adAccountId, {
    name,
    campaignId,
    targeting,
    optimizationGoal = 'CONVERSATIONS',
    billingEvent = 'IMPRESSIONS',
    status = 'ACTIVE',
    promotedObject = null,
    isDynamicCreative = false,
    bidStrategy = 'LOWEST_COST_WITHOUT_CAP',
    bidAmount = null
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('campaign_id', campaignId);
      formData.append('billing_event', billingEvent);
      formData.append('optimization_goal', optimizationGoal);
      // Limpiar targeting_optimization (eliminado por Meta Feb 2026)
      const cleanTargeting = { ...targeting };
      delete cleanTargeting.targeting_optimization;
      formData.append('targeting', JSON.stringify(cleanTargeting));
      formData.append('status', status);
      formData.append('destination_type', 'MESSENGER');

      if (isDynamicCreative) {
        formData.append('is_dynamic_creative', 'true');
      }

      if (bidAmount && bidStrategy !== 'LOWEST_COST_WITHOUT_CAP') {
        formData.append('bid_amount', bidAmount);
      }
      if (bidStrategy && bidStrategy !== 'LOWEST_COST_WITHOUT_CAP') {
        formData.append('bid_strategy', bidStrategy);
      }

      if (promotedObject) {
        formData.append('promoted_object', JSON.stringify(promotedObject));
      }

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adsets`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.data?.error) {
        return {
          success: false,
          error: response.data.error.error_user_msg || response.data.error.message || 'Error desconocido'
        };
      }

      return { success: true, data: response.data };
    } catch (error) {
      const errData = error.response?.data?.error;
      console.error('AdSet for Messenger FULL error:', JSON.stringify(error.response?.data, null, 2));
      const errorMsg = errData?.error_user_msg || errData?.message || error.message;
      return { success: false, error: errorMsg };
    }
  }

  // Crear Creative para WhatsApp (usa URL de imagen directamente)
  async createCreativeForWhatsApp(adAccountId, {
    name,
    pageId,
    imageHash = null,
    imageUrl = null, // URL directa de la imagen
    videoId = null, // ID del video subido
    videoThumbnailUrl = null, // Thumbnail del video
    whatsappNumber,
    primaryText,
    headline,
    description,
    callToAction = 'WHATSAPP_MESSAGE'
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      let objectStorySpec;

      // CTA value: si hay número de WhatsApp, usar wa_id; si no, value vacío (asignar manualmente en Ads Manager)
      const ctaValue = whatsappNumber ? { wa_id: whatsappNumber } : {};

      if (videoId) {
        // Creativo con VIDEO para WhatsApp - usa video_data
        const videoData = {
          video_id: videoId,
          message: primaryText,
          title: headline,
          call_to_action: {
            type: callToAction,
            value: ctaValue
          }
        };

        // Thumbnail: solo usar URLs públicas (http/https), ignorar blob: y data: URLs
        if (imageHash) {
          videoData.image_hash = imageHash;
        } else if (videoThumbnailUrl && videoThumbnailUrl.startsWith('http')) {
          videoData.image_url = videoThumbnailUrl;
        } else if (imageUrl && imageUrl.startsWith('http')) {
          videoData.image_url = imageUrl;
        }
        // Si no hay thumbnail válido, Meta auto-genera uno del primer frame del video

        objectStorySpec = {
          page_id: pageId,
          video_data: videoData
        };
        console.log('Creating WhatsApp VIDEO creative:', JSON.stringify(objectStorySpec, null, 2));
      } else {
        // Creativo con IMAGEN para WhatsApp
        const linkData = {
          message: primaryText,
          name: headline,
          description: description,
          call_to_action: {
            type: callToAction,
            value: ctaValue
          }
        };

        if (imageHash) {
          linkData.image_hash = imageHash;
        } else if (imageUrl) {
          linkData.picture = imageUrl;
        }

        objectStorySpec = {
          page_id: pageId,
          link_data: linkData
        };
      }

      const specJson = JSON.stringify(objectStorySpec);
      console.log('WhatsApp creative object_story_spec length:', specJson.length, 'chars');

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('object_story_spec', specJson);

      // Advantage+ creative individual features (solo las que esta cuenta soporta)
      // + text_transformation_types para "Optimizar texto por persona" (swap headline/primary/description)
      formData.append('degrees_of_freedom_spec', JSON.stringify({
        creative_features_spec: {
          text_optimizations: { enroll_status: 'OPT_IN' },
          enhance_cta: { enroll_status: 'OPT_IN' },
          image_touchups: { enroll_status: 'OPT_IN' },
          inline_comment: { enroll_status: 'OPT_IN' }
        },
        text_transformation_types: ['TEXT_LIQUIDITY']
      }));

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adcreatives`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      // Diagnóstico: leer el creative de vuelta para verificar si degrees_of_freedom_spec fue guardado
      if (response.data?.id) {
        try {
          const readBack = await axios.get(
            `${META_API_BASE_URL}/${response.data.id}`,
            { params: { access_token: this.accessToken, fields: 'id,name,degrees_of_freedom_spec' } }
          );
          console.log('WhatsApp creative READ-BACK degrees_of_freedom_spec:', JSON.stringify(readBack.data, null, 2));
        } catch (readErr) {
          console.warn('Could not read back creative:', readErr.message);
        }
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Creative for WhatsApp FULL error:', JSON.stringify(error.response?.data, null, 2) || error.message);
      return { success: false, error: error.response?.data?.error?.error_user_msg || error.response?.data?.error?.message || error.message };
    }
  }

  // Crear Creative para Messenger (usa URL de imagen directamente)
  async createCreativeForMessenger(adAccountId, {
    name,
    pageId,
    imageHash = null,
    imageUrl = null, // URL directa de la imagen
    videoId = null,
    videoThumbnailUrl = null,
    primaryText,
    headline,
    description,
    callToAction = 'MESSAGE_PAGE'
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      const objectStorySpec = { page_id: pageId };

      const messengerLink = `https://m.me/${pageId}`;

      if (videoId) {
        // Video creative para Messenger
        const videoData = {
          video_id: videoId,
          message: primaryText,
          title: headline,
          call_to_action: {
            type: callToAction,
            value: {
              app_destination: 'MESSENGER',
              link: messengerLink
            }
          }
        };
        if (videoThumbnailUrl && videoThumbnailUrl.startsWith('http')) {
          videoData.image_url = videoThumbnailUrl;
        } else {
          try {
            const thumbResp = await axios.get(`${BACKEND_API_URL}/video-thumbnail/${videoId}`, { params: { adAccountId: normalizedId } });
            const tHash = thumbResp.data?.data?.thumbnailHash || '';
            const tUrl = thumbResp.data?.data?.thumbnailUrl || '';
            if (tHash) videoData.image_hash = tHash;
            else if (tUrl) videoData.image_url = tUrl;
          } catch (te) { console.warn('Messenger: thumbnail fetch failed:', te.message); }
        }
        if (description?.trim()) videoData.link_description = description;
        objectStorySpec.video_data = videoData;
      } else {
        // Image creative para Messenger
        const linkData = {
          link: messengerLink,
          message: primaryText,
          name: headline,
          description: description,
          call_to_action: {
            type: callToAction,
            value: { app_destination: 'MESSENGER' }
          }
        };

        if (imageHash) {
          linkData.image_hash = imageHash;
        } else if (imageUrl) {
          linkData.picture = imageUrl;
        }
        objectStorySpec.link_data = linkData;
      }

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('object_story_spec', JSON.stringify(objectStorySpec));

      // Contenido multimedia flexible (Advantage+ creative) + otras optimizaciones
      formData.append('degrees_of_freedom_spec', JSON.stringify({
        creative_features_spec: {
          image_auto_crop: { enroll_status: 'OPT_IN' },
          video_auto_crop: { enroll_status: 'OPT_IN' },
          text_optimizations: { enroll_status: 'OPT_IN' },
          enhance_cta: { enroll_status: 'OPT_IN' },
          image_touchups: { enroll_status: 'OPT_IN' },
          inline_comment: { enroll_status: 'OPT_IN' }
        },
        text_transformation_types: ['TEXT_LIQUIDITY']
      }));

      console.log('Messenger objectStorySpec:', JSON.stringify(objectStorySpec, null, 2));

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adcreatives`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.data?.error) {
        return {
          success: false,
          error: response.data.error.error_user_msg || response.data.error.message || 'Error desconocido'
        };
      }

      return { success: true, data: response.data };
    } catch (error) {
      const errData = error.response?.data?.error;
      console.error('Creative for Messenger FULL error:', JSON.stringify(error.response?.data, null, 2));
      const errorMsg = errData?.error_user_msg || errData?.message || error.message;
      return { success: false, error: errorMsg };
    }
  }

  // Crear campaña completa para WhatsApp (soporta múltiples ads, imagen y video)
  async createCampaignForWhatsApp(adAccountId, {
    campaignName,
    dailyBudget,
    budgetLevel = 'campaign', // 'campaign' (CBO) o 'adset'
    targeting,
    pageId,
    igActorId = null,
    whatsappNumber,
    adSetMode = 'dynamic', // 'single' = 1 AdSet sin 5+5+5, 'dynamic' = N AdSets con 5+5+5
    ads = [],
    // Legacy single-ad fields (fallback si ads está vacío)
    imageUrl,
    imageHash = null,
    videoId = null,
    videoThumbnailUrl = null,
    headlines = [],
    descriptions = [],
    primaryTexts = [],
    callToAction = 'WHATSAPP_MESSAGE',
    objective = 'OUTCOME_SALES',
    optimizationGoal = 'CONVERSATIONS',
    // Nuevos campos
    specialAdCategories = [],
    bidStrategy = 'LOWEST_COST_WITHOUT_CAP',
    bidAmount = null,
    startTime = null,
    endTime = null,
    linkUrl = null,
    pageWelcomeMessage = null, // Plantilla de mensaje de bienvenida para WhatsApp
    multiAudiences = [] // Múltiples públicos: replicar AdSets por cada público
  }) {
    const results = { campaign: null, adSets: [], creatives: [], ads: [], errors: [] };

    // Si no hay ads array, crear uno con los campos legacy
    if (!ads || ads.length === 0) {
      ads = [{
        imageUrl, imageHash, videoId, videoThumbnailUrl,
        headlines, descriptions, primaryTexts,
        ctas: [callToAction],
        adName: campaignName + ' - Ad'
      }];
    }

    // WhatsApp: isDynamicCreative con asset_feed_spec (5+5+5) para modos dynamic/per-ad
    // EXCEPCIÓN: OUTCOME_SALES y OUTCOME_ENGAGEMENT + WhatsApp NO soportan DC (error 1885392)
    // Meta acepta el AdSet+Creative pero rechaza el Ad. Forzar standard creative para estos objetivos.
    // FLEXIBLE mode: no usa isDynamicCreative, usa creative_asset_groups_spec en /ads
    const useFlexible = adSetMode === 'flexible';
    const dcBlockedObjectives = ['OUTCOME_SALES', 'OUTCOME_ENGAGEMENT'];
    const useDynamicCreative = !useFlexible && adSetMode !== 'single' && !dcBlockedObjectives.includes(objective);
    if (!useFlexible && adSetMode !== 'single' && dcBlockedObjectives.includes(objective)) {
      console.warn(`WhatsApp + ${objective}: DC not supported (error 1885392). Using standard creatives instead.`);
    }

    try {
      // 1. Crear Campaña
      const isCBO = budgetLevel === 'campaign';
      const modeStr = useFlexible ? 'FLEXIBLE' : (useDynamicCreative ? 'DYNAMIC 5+5+5' : 'standard');
      console.log(`Step 1: Creating WhatsApp campaign (budget: ${budgetLevel}, ${ads.length} ads, mode: ${adSetMode}, ${modeStr} creatives)...`);
      const campaignResult = await this.createCampaign(adAccountId, {
        name: campaignName,
        objective,
        status: 'PAUSED',
        dailyBudget: isCBO ? dailyBudget : null,
        specialAdCategories: specialAdCategories || [],
        bidStrategy: isCBO ? bidStrategy : 'LOWEST_COST_WITHOUT_CAP'
      });

      if (!campaignResult.success) {
        results.errors.push(`Campaign: ${campaignResult.error}`);
        return { success: false, ...results };
      }
      results.campaign = campaignResult.data;

      // 2. Crear AdSet(s) + Creative(s) + Ad(s) según adSetMode
      // Construir array de públicos a procesar
      const primaryAud = { name: 'Principal', targeting };
      const audiencesToProcess = (adSetMode !== 'per-ad' && multiAudiences.length > 0)
        ? [primaryAud, ...multiAudiences.map(a => ({
            name: a.name,
            targeting: { ...(a.targeting || targeting) }
          }))]
        : [primaryAud];

      if (audiencesToProcess.length > 1) {
        console.log(`Multi-audience: ${audiencesToProcess.length} públicos`);
      }

      for (let audIdx = 0; audIdx < audiencesToProcess.length; audIdx++) {
        const currentAudience = audiencesToProcess[audIdx];
        const audPrefix = audiencesToProcess.length > 1 ? ` [${currentAudience.name}]` : '';
        let sharedAdSetId = null;

      if (adSetMode === 'single' || adSetMode === 'flexible') {
        console.log(`Mode: 1 ADSET${audPrefix} → ${ads.length} ADS (${useFlexible ? 'flexible' : 'standard'} creatives en 1 Ad Set)`);

        let adSetResult = await this.createAdSetForWhatsApp(adAccountId, {
          name: `${campaignName} - Ad Set${audPrefix}`,
          campaignId: results.campaign.id,
          targeting: currentAudience.targeting,
          optimizationGoal,
          promotedObject: { page_id: pageId },
          whatsappPhoneNumber: whatsappNumber,
          dailyBudget: !isCBO ? dailyBudget : null,
          isDynamicCreative: false,
          startTime,
          endTime,
          bidStrategy: !isCBO ? bidStrategy : undefined,
          bidAmount: !isCBO ? bidAmount : undefined
        });

        // Fallback: si falla con número de WhatsApp, reintentar sin él
        if (!adSetResult.success && whatsappNumber) {
          console.warn(`AdSet${audPrefix}: falló con WhatsApp number, reintentando sin número...`);
          adSetResult = await this.createAdSetForWhatsApp(adAccountId, {
            name: `${campaignName} - Ad Set${audPrefix}`,
            campaignId: results.campaign.id,
            targeting: currentAudience.targeting,
            optimizationGoal,
            promotedObject: { page_id: pageId },
            whatsappPhoneNumber: null,
            dailyBudget: !isCBO ? dailyBudget : null,
            isDynamicCreative: false,
            startTime,
            endTime,
            bidStrategy: !isCBO ? bidStrategy : undefined,
            bidAmount: !isCBO ? bidAmount : undefined
          });
          if (adSetResult.success) {
            console.warn(`AdSet${audPrefix}: creado SIN número de WhatsApp. Asignar manualmente en Ads Manager.`);
          }
        }

        if (!adSetResult.success) {
          results.errors.push(`AdSet${audPrefix}: ${adSetResult.error}`);
          continue; // Seguir con el siguiente público
        }
        results.adSets.push(adSetResult.data);
        sharedAdSetId = adSetResult.data.id;
      }

      // ====== FLEXIBLE AD: Agrupar TODO el contenido en UN SOLO ad ======
      if (useFlexible) {
        console.log(`Creating 1 flexible ad with all content (${ads.length} pieces) in shared AdSet${audPrefix}...`);

        const allImages = [];
        const allVideos = [];
        const allHeadlines = new Set();
        const allPrimaryTexts = new Set();
        const allDescriptions = new Set();

        for (let i = 0; i < ads.length; i++) {
          const ad = ads[i];
          // Acumular contenido
          if (ad.videoId) {
            const vid = { video_id: ad.videoId };
            if (ad.videoThumbnailUrl) vid.image_url = ad.videoThumbnailUrl;
            allVideos.push(vid);
          } else if (ad.imageHash) {
            allImages.push({ hash: ad.imageHash });
          }
          // Acumular textos (deduplicados)
          (ad.headlines || []).filter(h => h?.trim()).forEach(h => allHeadlines.add(h.trim()));
          (ad.descriptions || []).filter(d => d?.trim()).forEach(d => allPrimaryTexts.add(d.trim()));
          (ad.linkDescriptions || []).filter(d => d?.trim()).forEach(d => allDescriptions.add(d.trim()));
        }

        // Construir textos (máximo 5 por tipo)
        const texts = [];
        const headlines = [...allHeadlines].slice(0, 5);
        const primaryTexts = [...allPrimaryTexts].slice(0, 5);
        const descriptions = [...allDescriptions].slice(0, 5);
        if (headlines.length === 0) headlines.push('Contáctanos');
        if (primaryTexts.length === 0) primaryTexts.push('Escríbenos por WhatsApp');
        headlines.forEach(h => texts.push({ text: h, text_type: 'headline' }));
        primaryTexts.forEach(d => texts.push({ text: d, text_type: 'primary_text' }));
        descriptions.forEach(d => texts.push({ text: d, text_type: 'description' }));

        // WhatsApp flexible: link obligatorio → deep link de WhatsApp
        const waLink = `https://api.whatsapp.com/send?phone=${(whatsappNumber || ads[0]?.whatsappNumber || '').replace(/\D/g, '')}`;

        const flexResult = await this.createFlexibleAd(adAccountId, {
          name: `${campaignName} - Flexible Ad${audPrefix}`,
          adsetId: sharedAdSetId,
          pageId,
          igActorId,
          images: allImages,
          videos: allVideos,
          texts,
          callToAction: { type: 'WHATSAPP_MESSAGE', value: { link: waLink } },
          linkUrl: waLink,
          status: 'ACTIVE'
        });

        if (!flexResult.success) {
          results.errors.push(`Flexible Ad${audPrefix}: ${flexResult.error}`);
        } else {
          results.ads.push(flexResult.data);
        }
      }

      // ====== MODOS NO-FLEXIBLE: loop por cada ad ======
      if (!useFlexible)
      for (let i = 0; i < ads.length; i++) {
        const ad = ads[i];
        const adLabel = ads.length > 1 ? ` ${i + 1}` : '';
        const adWhatsappNumber = ad.whatsappNumber || whatsappNumber;

        if (adSetMode !== 'single') {
          // MODO DYNAMIC/PER-AD: crear 1 AdSet por cada ad
          const adAudienceLabel = (adSetMode === 'per-ad' && ad.audienceName) ? ` (${ad.audienceName})` : audPrefix;
          console.log(`Creating Ad Set${adLabel}${adAudienceLabel} + ${useDynamicCreative ? 'Dynamic Creative 5+5+5' : 'Standard Creative'} + Ad (${i + 1}/${ads.length})...`);
          console.log(`  WhatsApp: ${adWhatsappNumber}${ad.whatsappNumber ? ' (per-ad)' : ' (global)'}`);

          const adTargeting = (adSetMode === 'per-ad' && ad.audienceTargeting) ? ad.audienceTargeting : currentAudience.targeting;
          let adSetResult = await this.createAdSetForWhatsApp(adAccountId, {
            name: `${campaignName} - Ad Set${adLabel}${adAudienceLabel}`,
            campaignId: results.campaign.id,
            targeting: adTargeting,
            optimizationGoal,
            promotedObject: { page_id: pageId },
            whatsappPhoneNumber: adWhatsappNumber,
            dailyBudget: !isCBO ? dailyBudget : null,
            isDynamicCreative: useDynamicCreative,
            startTime,
            endTime,
            bidStrategy: !isCBO ? bidStrategy : undefined,
            bidAmount: !isCBO ? bidAmount : undefined
          });

          // Fallback: si falla con número de WhatsApp, reintentar sin él
          if (!adSetResult.success && adWhatsappNumber) {
            console.warn(`AdSet${adLabel}${adAudienceLabel}: falló con WhatsApp number, reintentando sin número...`);
            adSetResult = await this.createAdSetForWhatsApp(adAccountId, {
              name: `${campaignName} - Ad Set${adLabel}${adAudienceLabel}`,
              campaignId: results.campaign.id,
              targeting: adTargeting,
              optimizationGoal,
              promotedObject: { page_id: pageId },
              whatsappPhoneNumber: null,
              dailyBudget: !isCBO ? dailyBudget : null,
              isDynamicCreative: useDynamicCreative,
              startTime,
              endTime,
              bidStrategy: !isCBO ? bidStrategy : undefined,
              bidAmount: !isCBO ? bidAmount : undefined
            });
            if (adSetResult.success) {
              console.warn(`AdSet${adLabel}${adAudienceLabel}: creado SIN número de WhatsApp. Asignar manualmente en Ads Manager.`);
            }
          }

          if (!adSetResult.success) {
            results.errors.push(`AdSet${adLabel}${adAudienceLabel}: ${adSetResult.error}`);
            continue;
          }
          results.adSets.push(adSetResult.data);
          sharedAdSetId = adSetResult.data.id;
        } else {
          console.log(`Creating Standard Creative + Ad ${i + 1}/${ads.length} in shared AdSet${audPrefix}...`);
        }

        let creativeResult;
        const adHeadlines = (ad.headlines || []).filter(h => h?.trim());
        const adDescriptions = (ad.descriptions || []).filter(d => d?.trim());
        const adVideoId = ad.videoId || null;
        const adImageHash = ad.imageHash || null;
        const adImageUrl = ad.imageUrl || null;
        const adThumbnailUrl = ad.videoThumbnailUrl || null;

        if (useDynamicCreative) {
          // ====== DYNAMIC CREATIVE (5+5+5) para WhatsApp ======
          const validTitles = adHeadlines.length > 0 ? adHeadlines : ['Contáctanos'];
          const validBodies = adDescriptions.length > 0 ? adDescriptions : ['Escríbenos por WhatsApp'];
          const validLinkDescs = (ad.linkDescriptions || []).filter(d => d?.trim());
          // WhatsApp DC: SOLO WHATSAPP_MESSAGE como CTA
          // Otros CTAs (SHOP_NOW, ORDER_NOW, GET_QUOTE, etc.) requieren link_urls en asset_feed_spec,
          // pero WhatsApp DC no tiene link_urls → error "demasiados parámetros: link"
          const validCTAs = ['WHATSAPP_MESSAGE'];

          console.log(`  Dynamic Creative 5+5+5: ${validTitles.length}t + ${validBodies.length}d + ${validCTAs.length}cta`);

          creativeResult = await this.createAdCreativeWithAssetFeedSpec(adAccountId, {
            name: `${ad.adName || campaignName + ' - Ad' + adLabel} - Creative`,
            pageId,
            imageHash: adImageHash,
            imageUrl: adImageUrl,
            videoId: adVideoId,
            thumbnailUrl: adThumbnailUrl,
            titles: validTitles,
            bodies: validBodies,
            descriptions: validLinkDescs.length > 0 ? validLinkDescs : validBodies,
            callToActionTypes: validCTAs,
            linkUrl: null,
            igActorId,
            isWhatsApp: true
          });

          // Si falla por igActorId, reintentar sin IG
          if (!creativeResult.success && (creativeResult.error?.includes('instagram_user_id') || creativeResult.error?.includes('instagram_actor_id') || creativeResult.error?.includes('Instagram account'))) {
            console.warn(`Creative${adLabel}: igActorId rejected, retrying without IG...`);
            creativeResult = await this.createAdCreativeWithAssetFeedSpec(adAccountId, {
              name: `${ad.adName || campaignName + ' - Ad' + adLabel} - Creative`,
              pageId,
              imageHash: adImageHash,
              imageUrl: adImageUrl,
              videoId: adVideoId,
              thumbnailUrl: adThumbnailUrl,
              titles: validTitles,
              bodies: validBodies,
              descriptions: validLinkDescs.length > 0 ? validLinkDescs : validBodies,
              callToActionTypes: validCTAs,
              linkUrl: null,
              igActorId: null,
              isWhatsApp: true
            });
          }
        } else {
          // ====== STANDARD CREATIVE para WhatsApp ======
          // Nota: flexible ads ahora van por rama separada (useFlexible) arriba
          const primaryText = adDescriptions[0] || 'Escríbenos por WhatsApp';
          const headline = adHeadlines[0] || 'Contáctanos';
          const adLinkDescs0 = (ad.linkDescriptions || []).filter(d => d?.trim());
          const description = adLinkDescs0[0] || adDescriptions[1] || adHeadlines[1] || '';
          // Usar CTA del ad (si viene), forzar WHATSAPP_MESSAGE como fallback
          const adCta = (ad.ctas || [])[0] || callToAction || 'WHATSAPP_MESSAGE';
          // Para WhatsApp standard, el CTA siempre debe ser WHATSAPP_MESSAGE
          const whatsAppCta = adCta === 'WHATSAPP_MESSAGE' ? adCta : 'WHATSAPP_MESSAGE';

          console.log(`  Standard Creative: "${headline}" | "${primaryText.substring(0, 60)}..." | CTA: ${whatsAppCta} (requested: ${adCta})`);

          const objectStorySpec = { page_id: pageId };

          if (adVideoId) {
            const videoData = {
              video_id: adVideoId,
              message: primaryText,
              title: headline,
              call_to_action: { type: whatsAppCta, value: {} }
            };
            if (adThumbnailUrl && adThumbnailUrl.startsWith('http')) {
              videoData.image_url = adThumbnailUrl;
            } else {
              try {
                const thumbResp = await axios.get(`${BACKEND_API_URL}/video-thumbnail/${adVideoId}`, { params: { adAccountId: this.normalizeAccountId(adAccountId) } });
                const tHash = thumbResp.data?.data?.thumbnailHash || '';
                const tUrl = thumbResp.data?.data?.thumbnailUrl || '';
                if (tHash) videoData.image_hash = tHash;
                else if (tUrl) videoData.image_url = tUrl;
              } catch (te) { console.warn('WA standard: thumbnail fetch failed:', te.message); }
            }
            if (description.trim()) videoData.link_description = description;
            objectStorySpec.video_data = videoData;
          } else {
            // WhatsApp image: NO incluir link en link_data (Meta interpreta link como CTA value.link
            // y WHATSAPP_MESSAGE no soporta link — error "demasiados parámetros" en OUTCOME_SALES)
            const linkData = {
              message: primaryText,
              name: headline,
              call_to_action: { type: whatsAppCta, value: {} }
            };
            if (adImageHash) {
              linkData.image_hash = adImageHash;
            } else if (adImageUrl && adImageUrl.trim()) {
              linkData.picture = adImageUrl;
            }
            if (description.trim()) linkData.description = description;
            objectStorySpec.link_data = linkData;
          }

          if (igActorId) {
            objectStorySpec.instagram_user_id = igActorId;
            console.log('WhatsApp creative using instagram_user_id:', igActorId);
          }

          const normalizedId = this.normalizeAccountId(adAccountId);
          const formData = new URLSearchParams();
          formData.append('access_token', this.accessToken);
          formData.append('name', `${ad.adName || campaignName + ' - Ad' + adLabel} - Creative`);
          formData.append('object_story_spec', JSON.stringify(objectStorySpec));

          // Advantage+ creative features — NO enhance_cta para WhatsApp
          // (enhance_cta puede inyectar link en CTA value, incompatible con WHATSAPP_MESSAGE)
          formData.append('degrees_of_freedom_spec', JSON.stringify({
            creative_features_spec: {
              text_optimizations: { enroll_status: 'OPT_IN' },
              image_touchups: { enroll_status: 'OPT_IN' },
              inline_comment: { enroll_status: 'OPT_IN' }
            },
            text_transformation_types: ['TEXT_LIQUIDITY']
          }));

          console.log('WhatsApp objectStorySpec:', JSON.stringify(objectStorySpec, null, 2));

          try {
            const normalizedId2 = this.normalizeAccountId(adAccountId);
            const response = await axios.post(`${META_API_BASE_URL}/${normalizedId2}/adcreatives`, formData,
              { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
            creativeResult = { success: true, data: response.data };
          } catch (error) {
            console.error('WhatsApp creative error:', JSON.stringify(error.response?.data, null, 2));
            const errData = error.response?.data?.error;
            creativeResult = { success: false, error: errData?.error_user_msg || errData?.message || error.message };
          }
        }

        if (!creativeResult.success) {
          console.error(`Creative${adLabel} failed:`, creativeResult.error);
          results.errors.push(`Creative${adLabel}: ${creativeResult.error}`);
          continue;
        }
        results.creatives.push(creativeResult.data);

        // Crear Ad
        let adResult = await this.createAd(adAccountId, {
          name: ad.adName || `${campaignName} - Ad${adLabel}`,
          adsetId: sharedAdSetId,
          creativeId: creativeResult.data.id,
          status: 'ACTIVE'
        });

        // ====== FALLBACK: Error 1885392 — DC no soportado para este objetivo ======
        // Meta acepta el AdSet con isDynamicCreative y el Creative con asset_feed_spec,
        // pero rechaza el Ad con "El contenido dinámico no admite el objetivo de la campaña".
        // Solución: re-crear AdSet sin DC + Creative estándar + Ad.
        if (!adResult.success && useDynamicCreative &&
            (adResult.error?.includes('1885392') || adResult.error?.includes('contenido dinámico no admite') || adResult.error?.includes('dynamic creative'))) {
          console.warn(`Ad${adLabel}: DC not supported for this objective+destination. Falling back to standard creative...`);

          // 1. Crear nuevo AdSet SIN isDynamicCreative
          const adAudienceLabel = (adSetMode === 'per-ad' && ad.audienceName) ? ` (${ad.audienceName})` : audPrefix;
          const adTargeting = (adSetMode === 'per-ad' && ad.audienceTargeting) ? ad.audienceTargeting : currentAudience.targeting;
          const fallbackAdSetResult = await this.createAdSetForWhatsApp(adAccountId, {
            name: `${campaignName} - Ad Set${adLabel}${adAudienceLabel} (std)`,
            campaignId: results.campaign.id,
            targeting: adTargeting,
            optimizationGoal,
            promotedObject: { page_id: pageId },
            whatsappPhoneNumber: adWhatsappNumber,
            dailyBudget: !isCBO ? dailyBudget : null,
            isDynamicCreative: false,
            startTime,
            endTime,
            bidStrategy: !isCBO ? bidStrategy : undefined,
            bidAmount: !isCBO ? bidAmount : undefined
          });

          if (!fallbackAdSetResult.success) {
            console.error(`Fallback AdSet${adLabel} failed:`, fallbackAdSetResult.error);
            results.errors.push(`Ad${adLabel}: DC no soportado y fallback AdSet falló: ${fallbackAdSetResult.error}`);
            continue;
          }
          results.adSets.push(fallbackAdSetResult.data);

          // 2. Crear Creative estándar (usa primer headline/description)
          const primaryText = adDescriptions[0] || 'Escríbenos por WhatsApp';
          const headline = adHeadlines[0] || 'Contáctanos';
          const adLinkDescs = (ad.linkDescriptions || []).filter(d => d?.trim());
          const description = adLinkDescs[0] || adDescriptions[1] || adHeadlines[1] || '';
          const whatsAppCta = 'WHATSAPP_MESSAGE';

          console.log(`  Fallback Standard Creative: "${headline}" | "${primaryText.substring(0, 60)}..." | CTA: ${whatsAppCta}`);

          const objectStorySpec = { page_id: pageId };
          if (adVideoId) {
            const videoData = {
              video_id: adVideoId,
              message: primaryText,
              title: headline,
              call_to_action: { type: whatsAppCta, value: {} }
            };
            if (adThumbnailUrl && adThumbnailUrl.startsWith('http')) videoData.image_url = adThumbnailUrl;
            if (description.trim()) videoData.link_description = description;
            objectStorySpec.video_data = videoData;
          } else {
            // WhatsApp image: NO incluir link (WHATSAPP_MESSAGE no soporta link en CTA value)
            const linkData = {
              message: primaryText,
              name: headline,
              call_to_action: { type: whatsAppCta, value: {} }
            };
            if (adImageHash) linkData.image_hash = adImageHash;
            else if (adImageUrl && adImageUrl.trim()) linkData.picture = adImageUrl;
            if (description.trim()) linkData.description = description;
            objectStorySpec.link_data = linkData;
          }
          if (igActorId) objectStorySpec.instagram_user_id = igActorId;

          const normalizedId = this.normalizeAccountId(adAccountId);
          const fallbackFormData = new URLSearchParams();
          fallbackFormData.append('access_token', this.accessToken);
          fallbackFormData.append('name', `${ad.adName || campaignName + ' - Ad' + adLabel} - Creative (std)`);
          fallbackFormData.append('object_story_spec', JSON.stringify(objectStorySpec));
          fallbackFormData.append('degrees_of_freedom_spec', JSON.stringify({
            creative_features_spec: {
              text_optimizations: { enroll_status: 'OPT_IN' },
              image_touchups: { enroll_status: 'OPT_IN' },
              inline_comment: { enroll_status: 'OPT_IN' }
            },
            text_transformation_types: ['TEXT_LIQUIDITY']
          }));

          let fallbackCreativeResult;
          try {
            const response = await axios.post(`${META_API_BASE_URL}/${normalizedId}/adcreatives`, fallbackFormData,
              { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
            fallbackCreativeResult = { success: true, data: response.data };
          } catch (error) {
            console.error('Fallback creative error:', JSON.stringify(error.response?.data, null, 2));
            const errData = error.response?.data?.error;
            fallbackCreativeResult = { success: false, error: errData?.error_user_msg || errData?.message || error.message };
          }

          if (!fallbackCreativeResult.success) {
            console.error(`Fallback Creative${adLabel} failed:`, fallbackCreativeResult.error);
            results.errors.push(`Ad${adLabel}: DC no soportado y fallback Creative falló: ${fallbackCreativeResult.error}`);
            continue;
          }
          results.creatives.push(fallbackCreativeResult.data);

          // 3. Crear Ad con el nuevo AdSet + Creative estándar
          adResult = await this.createAd(adAccountId, {
            name: ad.adName || `${campaignName} - Ad${adLabel}`,
            adsetId: fallbackAdSetResult.data.id,
            creativeId: fallbackCreativeResult.data.id,
            status: 'ACTIVE'
          });

          if (!adResult.success) {
            results.errors.push(`Ad${adLabel} (fallback): ${adResult.error}`);
            continue;
          }
          console.log(`  Fallback successful! Ad${adLabel} created with standard creative.`);
        } else if (!adResult.success) {
          results.errors.push(`Ad${adLabel}: ${adResult.error}`);
          continue;
        }
        results.ads.push(adResult.data);
      }

      } // fin loop audiencesToProcess

      const totalCreated = results.ads.length;
      console.log(`WhatsApp campaign done: 1 Campaign + ${results.adSets.length} AdSets + ${results.creatives.length} Creatives + ${totalCreated} Ads (${audiencesToProcess.length} públicos)`);

      return { success: totalCreated > 0, ...results };

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
    imageHash = null,
    videoId = null,
    videoThumbnailUrl = null,
    headlines = [],
    descriptions = [],
    primaryTexts = [],
    callToAction = 'MESSAGE_PAGE',
    objective = 'OUTCOME_ENGAGEMENT',
    optimizationGoal = 'CONVERSATIONS'
  }) {
    const results = { campaign: null, adSet: null, creative: null, ad: null, errors: [] };

    try {
      // 1. Crear Campaña
      console.log('Step 1/4: Creating campaign...');
      const campaignResult = await this.createCampaign(adAccountId, {
        name: campaignName,
        objective,
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
        optimizationGoal,
        promotedObject: { page_id: pageId }
      });

      if (!adSetResult.success) {
        results.errors.push(`AdSet: ${adSetResult.error}`);
        return { success: false, ...results };
      }
      results.adSet = adSetResult.data;

      // 3. Crear Creative para Messenger (soporta imagen o video)
      console.log(`Step 3/4: Creating creative (${videoId ? 'video' : 'image'})...`);
      const creativeResult = await this.createCreativeForMessenger(adAccountId, {
        name: `${campaignName} - Creative`,
        pageId,
        imageHash,
        imageUrl,
        videoId,
        videoThumbnailUrl,
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
        status: 'ACTIVE'
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

  // Crear AdSet para Instagram Direct
  async createAdSetForInstagramDM(adAccountId, {
    name,
    campaignId,
    targeting,
    optimizationGoal = 'CONVERSATIONS',
    billingEvent = 'IMPRESSIONS',
    status = 'ACTIVE',
    promotedObject = null,
    isDynamicCreative = false
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('campaign_id', campaignId);
      formData.append('billing_event', billingEvent);
      formData.append('optimization_goal', optimizationGoal);
      // Limpiar targeting_optimization (eliminado por Meta Feb 2026)
      const cleanTargeting = { ...targeting };
      delete cleanTargeting.targeting_optimization;
      formData.append('targeting', JSON.stringify(cleanTargeting));
      formData.append('status', status);
      formData.append('destination_type', 'INSTAGRAM_DIRECT');

      if (isDynamicCreative) {
        formData.append('is_dynamic_creative', 'true');
      }

      if (promotedObject) {
        formData.append('promoted_object', JSON.stringify(promotedObject));
      }

      console.log('Creating Instagram DM AdSet with params:', {
        name, campaignId, billingEvent, optimizationGoal, status,
        destination_type: 'INSTAGRAM_DIRECT',
        promotedObject
      });

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adsets`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errData = error.response?.data?.error;
      console.error('AdSet for Instagram DM FULL error:', JSON.stringify(error.response?.data, null, 2));
      const errorMsg = errData?.error_user_msg || errData?.message || error.message;
      return { success: false, error: errorMsg };
    }
  }

  // Crear Creative para Instagram Direct (usa URL de imagen directamente)
  async createCreativeForInstagramDM(adAccountId, {
    name,
    pageId,
    igActorId,
    imageHash = null,
    imageUrl = null,
    videoId = null,
    videoThumbnailUrl = null,
    primaryText,
    headline,
    description,
    callToAction = 'INSTAGRAM_MESSAGE'
  }) {
    try {
      const normalizedId = this.normalizeAccountId(adAccountId);

      if (!igActorId) {
        return { success: false, error: 'Se requiere una cuenta de Instagram para Instagram Direct' };
      }

      const objectStorySpec = {
        page_id: pageId,
        instagram_user_id: igActorId
      };

      const igDirectLink = `https://ig.me/m/${igActorId}`;

      if (videoId) {
        // Video creative para Instagram DM
        const videoData = {
          video_id: videoId,
          message: primaryText,
          title: headline,
          call_to_action: {
            type: callToAction,
            value: {
              app_destination: 'INSTAGRAM_DIRECT',
              link: igDirectLink
            }
          }
        };
        if (videoThumbnailUrl && videoThumbnailUrl.startsWith('http')) {
          videoData.image_url = videoThumbnailUrl;
        } else {
          try {
            const thumbResp = await axios.get(`${BACKEND_API_URL}/video-thumbnail/${videoId}`, { params: { adAccountId: normalizedId } });
            const tHash = thumbResp.data?.data?.thumbnailHash || '';
            const tUrl = thumbResp.data?.data?.thumbnailUrl || '';
            if (tHash) videoData.image_hash = tHash;
            else if (tUrl) videoData.image_url = tUrl;
          } catch (te) { console.warn('IG DM: thumbnail fetch failed:', te.message); }
        }
        if (description?.trim()) videoData.link_description = description;
        objectStorySpec.video_data = videoData;
      } else {
        // Image creative para Instagram DM
        const linkData = {
          link: igDirectLink,
          message: primaryText,
          name: headline,
          description: description,
          call_to_action: {
            type: callToAction,
            value: { app_destination: 'INSTAGRAM_DIRECT' }
          }
        };

        if (imageHash) {
          linkData.image_hash = imageHash;
        } else if (imageUrl) {
          linkData.picture = imageUrl;
        }
        objectStorySpec.link_data = linkData;
      }

      const formData = new URLSearchParams();
      formData.append('access_token', this.accessToken);
      formData.append('name', name);
      formData.append('object_story_spec', JSON.stringify(objectStorySpec));

      // Contenido multimedia flexible (Advantage+ creative) + otras optimizaciones
      formData.append('degrees_of_freedom_spec', JSON.stringify({
        creative_features_spec: {
          image_auto_crop: { enroll_status: 'OPT_IN' },
          video_auto_crop: { enroll_status: 'OPT_IN' },
          text_optimizations: { enroll_status: 'OPT_IN' },
          enhance_cta: { enroll_status: 'OPT_IN' },
          image_touchups: { enroll_status: 'OPT_IN' },
          inline_comment: { enroll_status: 'OPT_IN' }
        },
        text_transformation_types: ['TEXT_LIQUIDITY']
      }));

      console.log('Instagram DM objectStorySpec:', JSON.stringify(objectStorySpec, null, 2));

      const response = await axios.post(
        `${META_API_BASE_URL}/${normalizedId}/adcreatives`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.data?.error) {
        return {
          success: false,
          error: response.data.error.error_user_msg || response.data.error.message || 'Error desconocido'
        };
      }

      return { success: true, data: response.data };
    } catch (error) {
      const errData = error.response?.data?.error;
      console.error('Creative for Instagram DM FULL error:', JSON.stringify(error.response?.data, null, 2));
      const errorMsg = errData?.error_user_msg || errData?.message || error.message;
      return { success: false, error: errorMsg };
    }
  }

  // Crear campaña completa para Instagram Direct
  async createCampaignForInstagramDM(adAccountId, {
    campaignName,
    adSetName,
    adName,
    dailyBudget,
    targeting,
    pageId,
    igActorId,
    imageUrl,
    imageHash = null,
    videoId = null,
    videoThumbnailUrl = null,
    headlines = [],
    descriptions = [],
    primaryTexts = [],
    callToAction = 'INSTAGRAM_MESSAGE',
    objective = 'OUTCOME_ENGAGEMENT',
    optimizationGoal = 'CONVERSATIONS'
  }) {
    const results = { campaign: null, adSet: null, creative: null, ad: null, errors: [] };

    try {
      // 1. Crear Campaña
      console.log('Step 1/4: Creating Instagram DM campaign...');
      const campaignResult = await this.createCampaign(adAccountId, {
        name: campaignName,
        objective,
        status: 'PAUSED',
        dailyBudget
      });

      if (!campaignResult.success) {
        results.errors.push(`Campaign: ${campaignResult.error}`);
        return { success: false, ...results };
      }
      results.campaign = campaignResult.data;

      // 2. Crear AdSet para Instagram Direct
      console.log('Step 2/4: Creating ad set for Instagram Direct...');
      const adSetResult = await this.createAdSetForInstagramDM(adAccountId, {
        name: adSetName || `${campaignName} - Ad Set`,
        campaignId: results.campaign.id,
        targeting,
        optimizationGoal,
        promotedObject: { page_id: pageId }
      });

      if (!adSetResult.success) {
        results.errors.push(`AdSet: ${adSetResult.error}`);
        return { success: false, ...results };
      }
      results.adSet = adSetResult.data;

      // 3. Crear Creative para Instagram Direct (soporta imagen o video)
      console.log(`Step 3/4: Creating creative for Instagram Direct (${videoId ? 'video' : 'image'})...`);
      const creativeResult = await this.createCreativeForInstagramDM(adAccountId, {
        name: `${campaignName} - Creative`,
        pageId,
        igActorId,
        imageHash,
        imageUrl,
        videoId,
        videoThumbnailUrl,
        primaryText: primaryTexts[0] || descriptions[0] || 'Envíanos un DM',
        headline: headlines[0] || 'Escríbenos',
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
        status: 'ACTIVE'
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
  // MULTI-AD: Crear Campaign + AdSet(s) + N Creatives + N Ads
  // ============================================
  // adSetMode: 'single' = 1 AdSet con todos los ads, 'per-ad' = 1 AdSet por anuncio (público diferente)
  async createCampaignWithMultipleAds(adAccountId, {
    campaignName,
    objective = 'OUTCOME_TRAFFIC',
    specialAdCategories = [],
    dailyBudget,
    targeting,
    optimizationGoal = 'LANDING_PAGE_VIEWS',
    billingEvent = 'IMPRESSIONS',
    endDate = null,
    pageId,
    igActorId = null,
    linkUrl = null,
    conversionLocation = null, // 'WEBSITE', 'INSTAGRAM_PROFILE', etc.
    pixelId = null, // ID del pixel de Meta (para OUTCOME_SALES + WEBSITE)
    whatsappNumber = null, // Número de WhatsApp (ej: "573005410171")
    adSetMode = 'single', // 'single' | 'per-ad'
    ads = [],
    multiAudiences = [] // Múltiples públicos: replicar AdSets por cada público
  }) {
    const VALID_LINK_CLICKS_CTAS = [
      'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'SUBSCRIBE',
      'DOWNLOAD', 'GET_OFFER', 'APPLY_NOW', 'CONTACT_US', 'GET_QUOTE',
      'BUY_NOW', 'ORDER_NOW', 'BOOK_TRAVEL',
      'MESSAGE_PAGE', 'INSTAGRAM_MESSAGE', 'WHATSAPP_MESSAGE',
      'CALL_NOW', 'GET_DIRECTIONS', 'VISIT_INSTAGRAM_PROFILE'
    ];

    // Determinar CTA default según destino
    // NOTA: VISIT_INSTAGRAM_PROFILE NO es válido en asset_feed_spec (DC) — usar LEARN_MORE para IG Profile en DC
    const defaultCTAForDestination = conversionLocation === 'INSTAGRAM_PROFILE' ? 'LEARN_MORE'
      : conversionLocation === 'WHATSAPP' ? 'WHATSAPP_MESSAGE'
      : conversionLocation === 'INSTAGRAM_DIRECT' ? 'INSTAGRAM_MESSAGE'
      : conversionLocation === 'MESSENGER' ? 'MESSAGE_PAGE'
      : 'LEARN_MORE';

    // CTA para standard creatives (INSTAGRAM_PROFILE usa VISIT_INSTAGRAM_PROFILE ahí sí)
    const defaultCTAForStandard = conversionLocation === 'INSTAGRAM_PROFILE' ? 'VISIT_INSTAGRAM_PROFILE'
      : defaultCTAForDestination;

    // OUTCOME_AWARENESS + DC: solo permite estos CTAs (GET_OFFER, APPLY_NOW, etc. dan error 1885396)
    const AWARENESS_DC_VALID_CTAS = [
      'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'SUBSCRIBE', 'CONTACT_US', 'WATCH_MORE',
      'MESSAGE_PAGE', 'WHATSAPP_MESSAGE', 'INSTAGRAM_MESSAGE'
    ];

    // CTAs que NO funcionan en asset_feed_spec (DC) pero sí en standard creatives
    const DC_CTA_REPLACEMENTS = {
      'VISIT_INSTAGRAM_PROFILE': 'LEARN_MORE'
    };

    const sanitizeCTAs = (ctas, forDC = true) => {
      let filtered = (ctas || []).filter(c => VALID_LINK_CLICKS_CTAS.includes(c));
      if (forDC) {
        // Reemplazar CTAs no válidos en asset_feed_spec
        filtered = filtered.map(c => DC_CTA_REPLACEMENTS[c] || c);
      }
      // Filtrar CTAs no compatibles con OUTCOME_AWARENESS + Dynamic Creative
      if (objective === 'OUTCOME_AWARENESS' && forDC) {
        filtered = filtered.filter(c => AWARENESS_DC_VALID_CTAS.includes(c));
      }
      const defaultCta = forDC ? defaultCTAForDestination : defaultCTAForStandard;
      return filtered.length > 0 ? [...new Set(filtered)] : [defaultCta];
    };

    const results = {
      campaign: null,
      adSets: [],
      creatives: [],
      ads: [],
      errors: []
    };

    // Mapear conversionLocation a destination_type de Meta API
    let destinationType = conversionLocation === 'INSTAGRAM_PROFILE' ? 'INSTAGRAM_PROFILE'
      : conversionLocation === 'WEBSITE' ? 'WEBSITE'
      : conversionLocation === 'WHATSAPP' ? 'WHATSAPP'
      : conversionLocation === 'MESSENGER' ? 'MESSENGER'
      : conversionLocation === 'INSTAGRAM_DIRECT' ? 'INSTAGRAM_DIRECT'
      : null; // null = Meta decide automáticamente

    // promoted_object se construye DESPUÉS de resolver igActorId (ver abajo)
    let promotedObject = null;

    try {
      // 0. Resolver igActorId — verificar y auto-conectar IG al ad account si es necesario
      const normalizedAdAccount = this.normalizeAccountId(adAccountId);
      let igConnected = false;

      // Paso A: Verificar si ya hay IG conectada al ad account
      try {
        const checkResp = await axios.get(`${META_API_BASE_URL}/${normalizedAdAccount}/instagram_accounts`, {
          params: { access_token: this.accessToken, fields: 'id,username' }
        });
        const connected = checkResp.data?.data || [];
        console.log(`Ad account IG accounts connected: ${connected.length}`, connected.map(a => `${a.username}(${a.id})`));
        if (connected.length > 0) {
          const match = igActorId ? connected.find(a => a.id === igActorId) : null;
          igActorId = match ? match.id : connected[0].id;
          igConnected = true;
          console.log(`Using connected IG account: ${igActorId}`);
        }
      } catch (checkErr) {
        console.warn('Error checking ad account IG accounts:', checkErr.response?.data?.error?.message || checkErr.message);
      }

      // Paso B: Si no hay IG conectada y necesitamos INSTAGRAM_PROFILE → intentar auto-conectar
      if (!igConnected && destinationType === 'INSTAGRAM_PROFILE') {
        console.log('No IG connected to ad account. Attempting to auto-connect...');

        // B1: Obtener instagram_business_account de la página
        let realIgId = null;
        try {
          const pageResp = await axios.get(`${META_API_BASE_URL}/${pageId}`, {
            params: { access_token: this.accessToken, fields: 'instagram_business_account{id,username}' }
          });
          const igBiz = pageResp.data?.instagram_business_account;
          if (igBiz) {
            realIgId = igBiz.id;
            console.log(`Page's instagram_business_account: ${igBiz.username} (ID: ${realIgId})`);
          }
        } catch (igErr) {
          console.warn('Could not get instagram_business_account:', igErr.response?.data?.error?.message || igErr.message);
        }

        // B2: Obtener business_id del ad account
        let businessId = null;
        try {
          const acctResp = await axios.get(`${META_API_BASE_URL}/${normalizedAdAccount}`, {
            params: { access_token: this.accessToken, fields: 'business{id,name}' }
          });
          businessId = acctResp.data?.business?.id;
          if (businessId) {
            console.log(`Ad account business: ${acctResp.data.business.name} (ID: ${businessId})`);
          }
        } catch (bizErr) {
          console.warn('Could not get ad account business:', bizErr.response?.data?.error?.message || bizErr.message);
        }

        // B3: Intentar conectar el IG al ad account vía business
        if (realIgId && businessId) {
          // Primero: reclamar IG para el business (si no lo está ya)
          try {
            console.log(`Attempting to claim IG ${realIgId} to business ${businessId}...`);
            await axios.post(`${META_API_BASE_URL}/${businessId}/instagram_accounts`, null, {
              params: { access_token: this.accessToken, instagram_actor_id: realIgId }
            });
            console.log(`✅ IG ${realIgId} claimed to business ${businessId}`);
          } catch (claimErr) {
            const msg = claimErr.response?.data?.error?.message || claimErr.message;
            // Si ya está reclamado, no es error real
            if (msg.includes('already') || msg.includes('duplicate')) {
              console.log(`IG ${realIgId} already claimed by business`);
            } else {
              console.warn(`Could not claim IG to business: ${msg}`);
            }
          }

          // Segundo: asignar IG al ad account vía business
          try {
            console.log(`Attempting to assign IG ${realIgId} to ad account ${normalizedAdAccount} via business...`);
            await axios.post(`${META_API_BASE_URL}/${realIgId}/assigned_users`, null, {
              params: { access_token: this.accessToken, business: businessId }
            });
            console.log(`✅ IG ${realIgId} assigned to ad account`);
          } catch (assignErr) {
            console.warn('Could not assign IG to ad account:', assignErr.response?.data?.error?.message || assignErr.message);
          }

          // Verificar si ahora está conectada
          try {
            const recheck = await axios.get(`${META_API_BASE_URL}/${normalizedAdAccount}/instagram_accounts`, {
              params: { access_token: this.accessToken, fields: 'id,username' }
            });
            const nowConnected = recheck.data?.data || [];
            console.log(`After auto-connect attempt: ${nowConnected.length} IG accounts`, nowConnected.map(a => `${a.username}(${a.id})`));
            if (nowConnected.length > 0) {
              igActorId = nowConnected[0].id;
              igConnected = true;
              console.log(`✅ Auto-connected IG: ${igActorId}`);
            }
          } catch (recheckErr) {
            console.warn('Error rechecking IG accounts:', recheckErr.response?.data?.error?.message || recheckErr.message);
          }
        }
      }

      // Paso C: Si aún no hay IG conectada → fallback sin destination_type
      if (!igConnected) {
        igActorId = null;
        if (destinationType === 'INSTAGRAM_PROFILE') {
          console.warn('⚠️ Could not auto-connect IG. Falling back to generic traffic (link URL points to IG profile).');
          console.warn('💡 Para que aparezca como "Instagram o Facebook", conecta manualmente tu Instagram en: Meta Business Suite > Configuración > Cuentas de Instagram > Agregar > luego asignarla al Ad Account.');
          destinationType = null;
        }
      }

      // promoted_object según destino
      if (destinationType === 'INSTAGRAM_PROFILE' && igConnected) {
        promotedObject = { page_id: pageId, instagram_profile_id: igActorId };
        console.log(`promoted_object: INSTAGRAM_PROFILE with instagram_profile_id: ${igActorId}`);
      } else if (['WHATSAPP', 'MESSENGER', 'INSTAGRAM_DIRECT'].includes(destinationType)) {
        promotedObject = { page_id: pageId };
        console.log(`promoted_object: ${destinationType} with page_id: ${pageId}`);
      } else if (destinationType === 'WEBSITE' && objective === 'OUTCOME_SALES') {
        // OUTCOME_SALES + WEBSITE requiere pixel en promoted_object
        if (pixelId) {
          promotedObject = { pixel_id: pixelId, custom_event_type: 'PURCHASE' };
          console.log(`promoted_object: WEBSITE SALES with selected pixel: ${pixelId}`);
        } else {
          try {
            const pixelResult = await this.getPixels(adAccountId);
            if (pixelResult.success && pixelResult.data.length > 0) {
              const pixel = pixelResult.data[0];
              promotedObject = { pixel_id: pixel.id, custom_event_type: 'PURCHASE' };
              console.log(`promoted_object: WEBSITE SALES with auto pixel: ${pixel.name} (${pixel.id})`);
            } else {
              console.warn('⚠️ No pixel found for OUTCOME_SALES + WEBSITE. AdSet may fail.');
            }
          } catch (pixErr) {
            console.warn('Error fetching pixels:', pixErr.message);
          }
        }
      }

      // 1. Crear Campaña con CBO
      console.log(`Creating campaign with CBO for ${ads.length} ads... (destination: ${destinationType || 'auto'})`);
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

      // Helper: resolver thumbnail de un video
      const resolveThumbnail = async (ad, adIndex) => {
        let resolvedThumbUrl = ad.videoThumbnailUrl || null;
        let resolvedThumbHash = ad.imageHash || null;
        if (ad.videoId && !resolvedThumbHash && !resolvedThumbUrl) {
          try {
            const thumbResponse = await axios.get(`${BACKEND_API_URL}/video-thumbnail/${ad.videoId}`, {
              params: { adAccountId: this.normalizeAccountId(adAccountId) }
            });
            if (thumbResponse.data?.data?.thumbnailUrl) resolvedThumbUrl = thumbResponse.data.data.thumbnailUrl;
            else if (thumbResponse.data?.data?.thumbnailHash) resolvedThumbHash = thumbResponse.data.data.thumbnailHash;
          } catch (err) {
            console.warn('Thumbnail fetch failed for ad', adIndex, err.message);
          }
        }
        return { resolvedThumbUrl, resolvedThumbHash };
      };

      // Helper: crear Dynamic Creative (asset_feed_spec 5+5+5) + ad
      // fallbackContext: { targeting, campaignId } — datos para crear AdSet sin DC si falla con 1885392
      const createDynamicCreativeAndAd = async (ad, adIndex, adSetId, fallbackContext = null) => {
        const validTitles = ad.headlines?.filter(t => t?.trim()) || ['Conoce más'];
        const validBodies = ad.descriptions?.filter(b => b?.trim()) || ['Descubre más'];
        const validLinkDescs = ad.linkDescriptions?.filter(d => d?.trim()) || [];
        const validCTAs = sanitizeCTAs(ad.ctas);
        const { resolvedThumbUrl, resolvedThumbHash } = await resolveThumbnail(ad, adIndex);

        const creativeParams = {
          name: `${ad.adName || campaignName + ' Ad ' + (adIndex + 1)} - Creative`,
          pageId,
          imageUrl: !ad.videoId ? ad.imageUrl : null,
          imageHash: !ad.videoId ? ad.imageHash : null,
          imageHash9x16: !ad.videoId ? ad.imageHash9x16 : null,
          videoId: ad.videoId || null,
          thumbnailHash: resolvedThumbHash || null,
          thumbnailUrl: resolvedThumbUrl || null,
          titles: validTitles,
          bodies: validBodies,
          descriptions: validLinkDescs.length > 0 ? validLinkDescs : validBodies,
          callToActionTypes: validCTAs,
          linkUrl,
          igActorId,
          isInstagramDM: destinationType === 'INSTAGRAM_DIRECT'
        };

        let creativeResult = await this.createAdCreativeWithAssetFeedSpec(adAccountId, creativeParams);

        // Si falla por instagram_user_id inválido, reintentar sin IG
        if (!creativeResult.success && (creativeResult.error?.includes('instagram_user_id') || creativeResult.error?.includes('instagram_actor_id') || creativeResult.error?.includes('Instagram account'))) {
          console.warn(`Creative ${adIndex + 1}: igActorId rejected, retrying without IG...`);
          creativeResult = await this.createAdCreativeWithAssetFeedSpec(adAccountId, {
            ...creativeParams,
            igActorId: null
          });
        }

        if (!creativeResult.success) {
          results.errors.push(`Creative ${adIndex + 1}: ${creativeResult.error}`);
          return false;
        }
        results.creatives.push(creativeResult.data);

        // Crear Ad — el Creative ya tiene instagram_user_id
        let adResult = await this.createAd(adAccountId, {
          name: ad.adName || `${campaignName} - Ad ${adIndex + 1}`,
          adsetId: adSetId,
          creativeId: creativeResult.data.id,
          status: 'ACTIVE'
        });

        // ====== FALLBACK: Error 1885392 — DC no soportado para este objetivo ======
        if (!adResult.success && fallbackContext &&
            (adResult.error?.includes('1885392') || adResult.error?.includes('contenido dinámico no admite') || adResult.error?.includes('dynamic creative'))) {
          console.warn(`Ad ${adIndex + 1}: DC not supported for this objective+destination. Falling back to standard creative...`);

          // Crear nuevo AdSet SIN isDynamicCreative
          const fallbackAdSetResult = await this.createAdSet(adAccountId, {
            name: `${campaignName} - Ad Set ${adIndex + 1} (std)`,
            campaignId: fallbackContext.campaignId,
            billingEvent,
            optimizationGoal,
            targeting: fallbackContext.targeting,
            status: 'ACTIVE',
            endTime: endDate,
            isDynamicCreative: false,
            destinationType,
            promotedObject
          });

          if (!fallbackAdSetResult.success) {
            // Remove the stale DC error and add fallback error
            results.errors.pop(); // remove the pending error we haven't pushed yet
            results.errors.push(`Ad ${adIndex + 1}: DC no soportado y fallback AdSet falló: ${fallbackAdSetResult.error}`);
            return false;
          }
          results.adSets.push(fallbackAdSetResult.data);

          // Usar el helper de Standard Creative
          const stdSuccess = await createStandardCreativeAndAd(ad, adIndex, fallbackAdSetResult.data.id);
          if (stdSuccess) {
            console.log(`  Fallback successful! Ad ${adIndex + 1} created with standard creative.`);
          }
          return stdSuccess;
        }

        if (!adResult.success) {
          results.errors.push(`Ad ${adIndex + 1}: ${adResult.error}`);
          return false;
        }
        results.ads.push(adResult.data);
        return true;
      };

      // Helper: crear Standard Creative (object_story_spec) + ad
      const createStandardCreativeAndAd = async (ad, adIndex, adSetId) => {
        const headline = (ad.headlines?.find(h => h?.trim()) || 'Conoce más');
        const primaryText = (ad.descriptions?.find(d => d?.trim()) || 'Descubre más');
        const cta = sanitizeCTAs(ad.ctas, false)[0] || 'LEARN_MORE';
        const { resolvedThumbUrl } = await resolveThumbnail(ad, adIndex);

        const stdCreativeParams = {
          name: `${ad.adName || campaignName + ' Ad ' + (adIndex + 1)} - Creative`,
          pageId,
          imageUrl: !ad.videoId ? ad.imageUrl : null,
          imageHash: !ad.videoId ? ad.imageHash : null,
          videoId: ad.videoId || null,
          thumbnailUrl: resolvedThumbUrl || null,
          primaryText,
          headline,
          description: ad.linkDescriptions?.find(d => d?.trim()) || ad.descriptions?.[1]?.trim() || '',
          linkUrl,
          callToAction: cta,
          igActorId,
          whatsappNumber
        };

        let creativeResult = await this.createStandardAdCreative(adAccountId, stdCreativeParams);

        // Si falla por instagram_user_id inválido, reintentar sin IG
        if (!creativeResult.success && (creativeResult.error?.includes('instagram_user_id') || creativeResult.error?.includes('instagram_actor_id') || creativeResult.error?.includes('Instagram account'))) {
          console.warn(`Creative ${adIndex + 1}: igActorId rejected, retrying without IG...`);
          creativeResult = await this.createStandardAdCreative(adAccountId, {
            ...stdCreativeParams,
            igActorId: null
          });
        }

        if (!creativeResult.success) {
          results.errors.push(`Creative ${adIndex + 1}: ${creativeResult.error}`);
          return false;
        }
        results.creatives.push(creativeResult.data);

        // Crear Ad — el Creative ya tiene instagram_user_id
        let adResult = await this.createAd(adAccountId, {
          name: ad.adName || `${campaignName} - Ad ${adIndex + 1}`,
          adsetId: adSetId,
          creativeId: creativeResult.data.id,
          status: 'ACTIVE'
        });

        if (!adResult.success) {
          results.errors.push(`Ad ${adIndex + 1}: ${adResult.error}`);
          return false;
        }
        results.ads.push(adResult.data);
        return true;
      };

      // Construir array de públicos a procesar (principal + adicionales)
      const primaryAud = { name: 'Principal', targeting };
      const audiencesToProcess = (adSetMode !== 'per-ad' && multiAudiences.length > 0)
        ? [primaryAud, ...multiAudiences.map(a => ({
            name: a.name,
            targeting: { ...(a.targeting || targeting) }
          }))]
        : [primaryAud];

      if (audiencesToProcess.length > 1) {
        console.log(`Multi-audience: ${audiencesToProcess.length} públicos`);
      }

      if (adSetMode === 'single') {
        // ========================================================
        // MODO SINGLE: M AdSets (1 por público) → cada uno con N Ads estándar
        // ========================================================
        for (let audIdx = 0; audIdx < audiencesToProcess.length; audIdx++) {
          const currentAudience = audiencesToProcess[audIdx];
          const audPrefix = audiencesToProcess.length > 1 ? ` [${currentAudience.name}]` : '';
          console.log(`Mode: 1 ADSET${audPrefix} → ${ads.length} ADS (creatives estándar en 1 Ad Set)`);

          const adSetResult = await this.createAdSet(adAccountId, {
            name: `${campaignName} - Ad Set${audPrefix}`,
            campaignId: results.campaign.id,
            billingEvent,
            optimizationGoal,
            targeting: currentAudience.targeting,
            status: 'ACTIVE',
            endTime: endDate,
            isDynamicCreative: false,
            destinationType,
            promotedObject
          });

          if (!adSetResult.success) {
            results.errors.push(`AdSet${audPrefix}: ${adSetResult.error}`);
            continue;
          }
          results.adSets.push(adSetResult.data);

          for (let i = 0; i < ads.length; i++) {
            console.log(`Creating standard creative + ad ${i + 1}/${ads.length}${audPrefix} in shared AdSet...`);
            await createStandardCreativeAndAd(ads[i], i, adSetResult.data.id);
          }
        }

      } else if (adSetMode === 'dynamic') {
        // ========================================================
        // MODO DYNAMIC: N × M AdSets con 5+5+5 (por cada ad × público)
        // ========================================================
        for (let audIdx = 0; audIdx < audiencesToProcess.length; audIdx++) {
          const currentAudience = audiencesToProcess[audIdx];
          const audPrefix = audiencesToProcess.length > 1 ? ` [${currentAudience.name}]` : '';
          console.log(`Mode: ${ads.length} ADSETS con 5+5+5 Dynamic Creative${audPrefix}`);

          for (let i = 0; i < ads.length; i++) {
            console.log(`Creating adSet + dynamic creative + ad ${i + 1}/${ads.length}${audPrefix}...`);

            const adSetResult = await this.createAdSet(adAccountId, {
              name: `${campaignName} - Ad Set ${i + 1}${audPrefix}`,
              campaignId: results.campaign.id,
              billingEvent,
              optimizationGoal,
              targeting: currentAudience.targeting,
              status: 'ACTIVE',
              endTime: endDate,
              isDynamicCreative: true,
              destinationType,
              promotedObject
            });

            if (!adSetResult.success) {
              results.errors.push(`AdSet ${i + 1}${audPrefix}: ${adSetResult.error}`);
              continue;
            }
            results.adSets.push(adSetResult.data);

            await createDynamicCreativeAndAd(ads[i], i, adSetResult.data.id, {
              targeting: currentAudience.targeting,
              campaignId: results.campaign.id
            });
          }
        }

      } else if (adSetMode === 'flexible') {
        // ========================================================
        // MODO FLEXIBLE: M AdSets (1 por público) → N Ads con creative_asset_groups_spec
        // Solo soportado para OUTCOME_SALES y OUTCOME_APP_PROMOTION
        // ========================================================
        for (let audIdx = 0; audIdx < audiencesToProcess.length; audIdx++) {
          const currentAudience = audiencesToProcess[audIdx];
          const audPrefix = audiencesToProcess.length > 1 ? ` [${currentAudience.name}]` : '';
          console.log(`Mode: FLEXIBLE - 1 ADSET${audPrefix} → 1 Flexible Ad (${ads.length} contenidos combinados)`);

          const adSetResult = await this.createAdSet(adAccountId, {
            name: `${campaignName} - Ad Set${audPrefix}`,
            campaignId: results.campaign.id,
            billingEvent,
            optimizationGoal,
            targeting: currentAudience.targeting,
            status: 'ACTIVE',
            endTime: endDate,
            isDynamicCreative: false, // Flexible ads NO usan isDynamicCreative
            destinationType,
            promotedObject
          });

          if (!adSetResult.success) {
            results.errors.push(`AdSet${audPrefix}: ${adSetResult.error}`);
            continue;
          }
          results.adSets.push(adSetResult.data);

          // FLEXIBLE: Agrupar TODO el contenido (imágenes + videos) en UN SOLO ad
          console.log(`Creating 1 flexible ad with all content (${ads.length} pieces)${audPrefix}...`);

          const allImages = [];
          const allVideos = [];
          const allHeadlines = new Set();
          const allPrimaryTexts = new Set();
          const allDescriptions = new Set();
          let firstCTAType = null;

          for (let i = 0; i < ads.length; i++) {
            const ad = ads[i];
            const { resolvedThumbUrl, resolvedThumbHash } = await resolveThumbnail(ad, i);

            // Acumular contenido
            if (ad.videoId) {
              const vid = { video_id: ad.videoId };
              if (resolvedThumbHash) {
                vid.image_hash = resolvedThumbHash;
              } else if (resolvedThumbUrl) {
                vid.image_url = resolvedThumbUrl;
              }
              allVideos.push(vid);
            } else if (ad.imageHash) {
              allImages.push({ hash: ad.imageHash });
            }

            // Acumular textos (deduplicados)
            (ad.headlines || []).filter(h => h?.trim()).forEach(h => allHeadlines.add(h.trim()));
            (ad.descriptions || []).filter(d => d?.trim()).forEach(d => allPrimaryTexts.add(d.trim()));
            (ad.linkDescriptions || []).filter(d => d?.trim()).forEach(d => allDescriptions.add(d.trim()));

            // CTA: usar el primero encontrado
            if (!firstCTAType) {
              const validCTAs = sanitizeCTAs(ad.ctas, false);
              if (validCTAs.length > 0) firstCTAType = validCTAs[0];
            }
          }

          // Construir textos (máximo 5 por tipo)
          const texts = [];
          const headlines = [...allHeadlines].slice(0, 5);
          const primaryTexts = [...allPrimaryTexts].slice(0, 5);
          const descriptions = [...allDescriptions].slice(0, 5);
          if (headlines.length === 0) headlines.push('Conoce más');
          if (primaryTexts.length === 0) primaryTexts.push('Descubre más');
          headlines.forEach(t => texts.push({ text: t, text_type: 'headline' }));
          primaryTexts.forEach(b => texts.push({ text: b, text_type: 'primary_text' }));
          descriptions.forEach(d => texts.push({ text: d, text_type: 'description' }));

          // CTA
          const ctaType = firstCTAType || defaultCTAForStandard;
          let flexLinkUrl = linkUrl;
          if (ctaType === 'WHATSAPP_MESSAGE' && whatsappNumber) {
            flexLinkUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber.replace(/\D/g, '')}`;
          } else if (ctaType === 'INSTAGRAM_MESSAGE' && igActorId) {
            flexLinkUrl = `https://ig.me/m/${igActorId}`;
          } else if (ctaType === 'MESSAGE_PAGE' && pageId) {
            flexLinkUrl = `https://m.me/${pageId}`;
          }

          const flexResult = await this.createFlexibleAd(adAccountId, {
            name: `${campaignName} - Flexible Ad${audPrefix}`,
            adsetId: adSetResult.data.id,
            pageId,
            igActorId,
            images: allImages,
            videos: allVideos,
            texts,
            callToAction: { type: ctaType, value: { link: flexLinkUrl || '' } },
            linkUrl: flexLinkUrl,
            status: 'ACTIVE'
          });

          if (!flexResult.success) {
            results.errors.push(`Flexible Ad${audPrefix}: ${flexResult.error}`);
          } else {
            results.ads.push(flexResult.data);
          }
        }

      } else {
        // ========================================================
        // MODO PER-AD: N AdSets → N Ads con 5+5+5 (público diferente por ad)
        // ========================================================
        console.log(`Mode: ${ads.length} ADSETS con 5+5+5 (público diferente por anuncio)`);

        for (let i = 0; i < ads.length; i++) {
          const ad = ads[i];
          const adTargeting = ad.audienceTargeting || targeting;
          const audienceLabel = ad.audienceName ? ` (${ad.audienceName})` : '';

          console.log(`Creating adSet + dynamic creative + ad ${i + 1}/${ads.length}...`);

          const adSetResult = await this.createAdSet(adAccountId, {
            name: `${campaignName} - Ad Set ${i + 1}${audienceLabel}`,
            campaignId: results.campaign.id,
            billingEvent,
            optimizationGoal,
            targeting: adTargeting,
            status: 'ACTIVE',
            endTime: endDate,
            isDynamicCreative: true,
            destinationType,
            promotedObject
          });

          if (!adSetResult.success) {
            results.errors.push(`AdSet ${i + 1}: ${adSetResult.error}`);
            continue;
          }
          results.adSets.push(adSetResult.data);

          await createDynamicCreativeAndAd(ads[i], i, adSetResult.data.id, {
            targeting: adTargeting,
            campaignId: results.campaign.id
          });
        }
      }

      const totalCreated = results.ads.length;
      const totalFailed = ads.length - totalCreated;
      console.log(`Multi-ad campaign created: 1 Campaign + ${results.adSets.length} AdSet(s) + ${results.creatives.length} Creatives + ${totalCreated} Ads${totalFailed > 0 ? ` (${totalFailed} failed)` : ''}`);

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
