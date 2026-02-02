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
          fields: 'id,name,account_status'
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener cuentas de anuncios:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
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

      console.log('Llamando a API con URL:', `${META_API_BASE_URL}/${normalizedId}/campaigns`);
      const response = await axios.get(`${META_API_BASE_URL}/${normalizedId}/campaigns`, { params });
      console.log('Respuesta de campañas:', response.data);

      // Filtrar en el frontend para mostrar solo activas y pausadas
      const allCampaigns = response.data.data || [];
      return allCampaigns.filter(c => c.status === 'ACTIVE' || c.status === 'PAUSED');
    } catch (error) {
      console.error('Error al obtener campañas:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCampaignInsights(campaignId, datePreset = 'maximum') {
    try {
      const params = {
        access_token: this.accessToken,
        fields: 'campaign_name,spend,impressions,reach,cpm,cpc,ctr,actions,cost_per_action_type'
      };

      // 'maximum' significa todo el tiempo de vida de la campaña (no se pasa date_preset)
      if (datePreset !== 'maximum') {
        params.date_preset = datePreset;
      }

      console.log('Obteniendo insights con date_preset:', datePreset);
      const response = await axios.get(`${META_API_BASE_URL}/${campaignId}/insights`, { params });
      const insights = response.data.data[0] || {};
      console.log('Insights para campaña', campaignId, ':', insights);
      console.log('Actions disponibles:', insights.actions);
      console.log('Cost per action:', insights.cost_per_action_type);
      return insights;
    } catch (error) {
      console.error('Error al obtener insights de campaña:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
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
      console.error('Error al obtener campañas con insights:', error);
      throw error;
    }
  }
}

export default MetaAdsService;
