import axios from 'axios';

const META_API_BASE_URL = 'https://graph.facebook.com/v18.0';

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
      const response = await axios.get(`${META_API_BASE_URL}/me/adaccounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,account_status,business{id,name}'
        }
      });
      return response.data.data || [];
    } catch (error) {
      // Si es un Page Token, no tendrá acceso a adaccounts
      if (error.response?.data?.error?.message?.includes('Page')) {
        return [];
      }
      throw error;
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
      const response = await axios.get(`${META_API_BASE_URL}/me/businesses`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,profile_picture_uri'
        }
      });
      return response.data.data || [];
    } catch (error) {
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
      const businesses = await this.getBusinesses();
      const allAccounts = [];
      const seenIds = new Set();

      for (const business of businesses) {
        // Obtener cuentas propias del business
        const ownedAccounts = await this.getBusinessOwnedAdAccounts(business.id);
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
      }

      // También agregar cuentas de /me/adaccounts que no estén en businesses
      const personalAccounts = await this.getAdAccounts();
      for (const account of personalAccounts) {
        if (!seenIds.has(account.id)) {
          seenIds.add(account.id);
          allAccounts.push({
            ...account,
            business_name: account.business?.name || 'Personal',
            business_id: account.business?.id || null,
            account_type: 'personal'
          });
        }
      }

      return { businesses, adAccounts: allAccounts };
    } catch (error) {
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
}

export default MetaAdsService;
