import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3002;

// Token de acceso con permisos: pages_show_list, ads_management, ads_read, business_management, pages_read_engagement
const ACCESS_TOKEN = 'EAALFI7ZB5B9MBQrzKEhsGwlcsa820qgiSn6ZA4XlfCZBTNGZBfZAHY6UN4ttDdRKjsuO2EFEBM6DA4hdSR5NFfxniZBhrdkneOaSA6YwuUGjiMYn59UyQSKTfhPkahJF4ZBOvBeevWAWnYa46nXKzKvfWOcZAEdS6K9TGkST76XXOrPcshkgnPmZCmSt7ls4XHx95';

const META_API_BASE_URL = 'https://graph.facebook.com/v18.0';

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// HELPER FUNCTIONS
// ============================================

const normalizeAccountId = (accountId) => {
  if (!accountId) return null;
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
};

// Obtener cuentas publicitarias del usuario
const getAdAccounts = async () => {
  try {
    const response = await axios.get(`${META_API_BASE_URL}/me/adaccounts`, {
      params: {
        access_token: ACCESS_TOKEN,
        fields: 'id,name,account_status,business{id,name}'
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error getting ad accounts:', error.response?.data || error.message);
    return [];
  }
};

// Obtener businesses del usuario
const getBusinesses = async () => {
  try {
    const response = await axios.get(`${META_API_BASE_URL}/me/businesses`, {
      params: {
        access_token: ACCESS_TOKEN,
        fields: 'id,name,profile_picture_uri'
      }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error getting businesses:', error.response?.data || error.message);
    return [];
  }
};

// Obtener cuentas propias de un business
const getBusinessOwnedAdAccounts = async (businessId) => {
  try {
    const response = await axios.get(`${META_API_BASE_URL}/${businessId}/owned_ad_accounts`, {
      params: {
        access_token: ACCESS_TOKEN,
        fields: 'id,name,account_status',
        limit: 100
      }
    });
    return response.data.data || [];
  } catch (error) {
    return [];
  }
};

// Obtener cuentas de clientes de un business
const getBusinessClientAdAccounts = async (businessId) => {
  try {
    const response = await axios.get(`${META_API_BASE_URL}/${businessId}/client_ad_accounts`, {
      params: {
        access_token: ACCESS_TOKEN,
        fields: 'id,name,account_status',
        limit: 100
      }
    });
    return response.data.data || [];
  } catch (error) {
    return [];
  }
};

// Obtener campañas activas de una cuenta
const getActiveCampaigns = async (adAccountId) => {
  try {
    const normalizedId = normalizeAccountId(adAccountId);
    const response = await axios.get(`${META_API_BASE_URL}/${normalizedId}/campaigns`, {
      params: {
        access_token: ACCESS_TOKEN,
        fields: 'id,name,status,objective,daily_budget,lifetime_budget,budget_remaining,special_ad_categories,buying_type,configured_status',
        limit: 100
      }
    });
    const allCampaigns = response.data.data || [];
    return allCampaigns.filter(c => c.status === 'ACTIVE' || c.status === 'PAUSED');
  } catch (error) {
    console.error('Error getting campaigns:', error.response?.data || error.message);
    return [];
  }
};

// Obtener insights de una campaña
const getCampaignInsights = async (campaignId, datePreset = 'maximum') => {
  try {
    const params = {
      access_token: ACCESS_TOKEN,
      fields: 'campaign_name,spend,impressions,reach,cpm,cpc,ctr,actions,cost_per_action_type,cost_per_result,website_ctr,inline_link_clicks,unique_actions,outbound_clicks'
    };
    if (datePreset !== 'maximum') {
      params.date_preset = datePreset;
    }
    const response = await axios.get(`${META_API_BASE_URL}/${campaignId}/insights`, { params });
    return response.data.data[0] || {};
  } catch (error) {
    return {};
  }
};

// Obtener campañas con insights
const getCampaignsWithInsights = async (adAccountId, datePreset = 'maximum') => {
  const campaigns = await getActiveCampaigns(adAccountId);
  const campaignsWithInsights = await Promise.all(
    campaigns.map(async (campaign) => {
      const insights = await getCampaignInsights(campaign.id, datePreset);
      return { ...campaign, insights };
    })
  );
  return campaignsWithInsights;
};

// Obtener todas las cuentas de todos los businesses
const getAllAdAccountsFromBusinesses = async () => {
  const businesses = await getBusinesses();
  const allAccounts = [];
  const seenIds = new Set();

  for (const business of businesses) {
    const ownedAccounts = await getBusinessOwnedAdAccounts(business.id);
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

    const clientAccounts = await getBusinessClientAdAccounts(business.id);
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

  const personalAccounts = await getAdAccounts();
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
};

// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Meta Ads Dashboard API'
  });
});

// Obtener todos los businesses
app.get('/api/businesses', async (req, res) => {
  try {
    const businesses = await getBusinesses();
    res.json({
      success: true,
      data: businesses,
      count: businesses.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener todas las cuentas publicitarias
app.get('/api/ad-accounts', async (req, res) => {
  try {
    const { businesses, adAccounts } = await getAllAdAccountsFromBusinesses();
    res.json({
      success: true,
      data: {
        businesses,
        adAccounts
      },
      counts: {
        businesses: businesses.length,
        adAccounts: adAccounts.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener campañas de una cuenta específica
app.get('/api/campaigns/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { date_preset = 'maximum' } = req.query;

    const campaigns = await getCampaignsWithInsights(accountId, date_preset);
    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length,
      accountId: normalizeAccountId(accountId),
      datePreset: date_preset
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar estado de una campaña
app.post('/api/campaigns/:campaignId/status', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { status } = req.body; // 'ACTIVE' o 'PAUSED'

    if (!['ACTIVE', 'PAUSED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status debe ser ACTIVE o PAUSED'
      });
    }

    const response = await axios.post(
      `${META_API_BASE_URL}/${campaignId}`,
      null,
      {
        params: {
          access_token: ACCESS_TOKEN,
          status: status
        }
      }
    );

    res.json({
      success: true,
      data: response.data,
      message: `Campaña ${campaignId} actualizada a ${status}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// ENDPOINT PRINCIPAL: Obtener TODOS los datos del dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    const { date_preset = 'maximum' } = req.query;

    // Obtener todas las cuentas
    const { businesses, adAccounts } = await getAllAdAccountsFromBusinesses();

    // Obtener campañas de todas las cuentas
    const accountsWithCampaigns = await Promise.all(
      adAccounts.map(async (account) => {
        const campaigns = await getCampaignsWithInsights(account.id, date_preset);
        return {
          ...account,
          campaigns,
          campaignCount: campaigns.length,
          activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
          pausedCampaigns: campaigns.filter(c => c.status === 'PAUSED').length,
          totalSpend: campaigns.reduce((sum, c) => sum + parseFloat(c.insights?.spend || 0), 0),
          totalImpressions: campaigns.reduce((sum, c) => sum + parseInt(c.insights?.impressions || 0), 0),
          totalReach: campaigns.reduce((sum, c) => sum + parseInt(c.insights?.reach || 0), 0)
        };
      })
    );

    // Calcular totales generales
    const totals = {
      totalAccounts: adAccounts.length,
      totalBusinesses: businesses.length,
      totalCampaigns: accountsWithCampaigns.reduce((sum, a) => sum + a.campaignCount, 0),
      totalActiveCampaigns: accountsWithCampaigns.reduce((sum, a) => sum + a.activeCampaigns, 0),
      totalPausedCampaigns: accountsWithCampaigns.reduce((sum, a) => sum + a.pausedCampaigns, 0),
      totalSpend: accountsWithCampaigns.reduce((sum, a) => sum + a.totalSpend, 0),
      totalImpressions: accountsWithCampaigns.reduce((sum, a) => sum + a.totalImpressions, 0),
      totalReach: accountsWithCampaigns.reduce((sum, a) => sum + a.totalReach, 0)
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      datePreset: date_preset,
      totals,
      businesses,
      accounts: accountsWithCampaigns
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ENDPOINT: Resumen ejecutivo (datos resumidos para reportes)
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const { date_preset = 'maximum' } = req.query;

    const { businesses, adAccounts } = await getAllAdAccountsFromBusinesses();

    const summaryByBusiness = {};

    for (const account of adAccounts) {
      const bizName = account.business_name || 'Sin Business';
      if (!summaryByBusiness[bizName]) {
        summaryByBusiness[bizName] = {
          business_name: bizName,
          business_id: account.business_id,
          accounts: [],
          totalSpend: 0,
          totalImpressions: 0,
          totalReach: 0,
          totalCampaigns: 0,
          activeCampaigns: 0
        };
      }

      const campaigns = await getCampaignsWithInsights(account.id, date_preset);
      const accountSummary = {
        account_id: account.id,
        account_name: account.name,
        campaigns: campaigns.length,
        active: campaigns.filter(c => c.status === 'ACTIVE').length,
        spend: campaigns.reduce((sum, c) => sum + parseFloat(c.insights?.spend || 0), 0),
        impressions: campaigns.reduce((sum, c) => sum + parseInt(c.insights?.impressions || 0), 0),
        reach: campaigns.reduce((sum, c) => sum + parseInt(c.insights?.reach || 0), 0)
      };

      summaryByBusiness[bizName].accounts.push(accountSummary);
      summaryByBusiness[bizName].totalSpend += accountSummary.spend;
      summaryByBusiness[bizName].totalImpressions += accountSummary.impressions;
      summaryByBusiness[bizName].totalReach += accountSummary.reach;
      summaryByBusiness[bizName].totalCampaigns += accountSummary.campaigns;
      summaryByBusiness[bizName].activeCampaigns += accountSummary.active;
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      datePreset: date_preset,
      summary: Object.values(summaryByBusiness)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// UPLOAD ENDPOINTS - Imágenes y Videos
// ============================================

// Subir imagen desde URL a Meta Ads
app.post('/api/upload/image', async (req, res) => {
  try {
    const { adAccountId, imageUrl } = req.body;

    if (!adAccountId) {
      return res.status(400).json({
        success: false,
        error: 'adAccountId es requerido'
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'imageUrl es requerido'
      });
    }

    // Validar que sea una URL válida
    try {
      new URL(imageUrl);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'imageUrl debe ser una URL válida (ej: https://ejemplo.com/imagen.jpg)'
      });
    }

    const normalizedId = normalizeAccountId(adAccountId);
    console.log(`Uploading image from URL to ${normalizedId}:`, imageUrl);

    // Subir imagen a Meta usando URL
    const response = await axios.post(
      `${META_API_BASE_URL}/${normalizedId}/adimages`,
      null,
      {
        params: {
          access_token: ACCESS_TOKEN,
          url: imageUrl
        }
      }
    );

    console.log('Image upload response:', JSON.stringify(response.data, null, 2));

    // Extraer el image_hash del resultado
    const images = response.data.images;
    const imageHash = images ? Object.values(images)[0]?.hash : null;

    if (!imageHash) {
      return res.status(500).json({
        success: false,
        error: 'No se obtuvo image_hash de Meta'
      });
    }

    res.json({
      success: true,
      data: {
        imageHash,
        images: response.data.images
      },
      message: 'Imagen subida exitosamente'
    });
  } catch (error) {
    console.error('Image upload error:', JSON.stringify(error.response?.data, null, 2) || error.message);

    const errorData = error.response?.data?.error;
    let errorMsg = errorData?.message || error.message;

    // Agregar más contexto al error
    if (errorData?.error_user_title) {
      errorMsg = `${errorData.error_user_title}: ${errorData.error_user_msg || errorMsg}`;
    }
    if (errorData?.code === 1487390) {
      errorMsg = 'Error de imagen: La URL no es accesible o el formato no es válido. Asegúrate de que la URL sea pública y el archivo sea JPG o PNG.';
    }

    res.status(500).json({
      success: false,
      error: errorMsg,
      details: errorData
    });
  }
});

// Subir video desde URL a Meta Ads
app.post('/api/upload/video', async (req, res) => {
  try {
    const { adAccountId, videoUrl, title } = req.body;

    if (!adAccountId) {
      return res.status(400).json({
        success: false,
        error: 'adAccountId es requerido'
      });
    }

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'videoUrl es requerido'
      });
    }

    // Validar que sea una URL válida
    try {
      new URL(videoUrl);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'videoUrl debe ser una URL válida (ej: https://ejemplo.com/video.mp4)'
      });
    }

    const normalizedId = normalizeAccountId(adAccountId);
    console.log(`Uploading video from URL to ${normalizedId}:`, videoUrl);

    // Subir video a Meta usando URL
    const response = await axios.post(
      `${META_API_BASE_URL}/${normalizedId}/advideos`,
      null,
      {
        params: {
          access_token: ACCESS_TOKEN,
          file_url: videoUrl,
          title: title || 'Video Creative'
        }
      }
    );

    console.log('Video upload response:', JSON.stringify(response.data, null, 2));

    res.json({
      success: true,
      data: {
        videoId: response.data.id,
        ...response.data
      },
      message: 'Video subido exitosamente'
    });
  } catch (error) {
    console.error('Video upload error:', JSON.stringify(error.response?.data, null, 2) || error.message);

    const errorData = error.response?.data?.error;
    let errorMsg = errorData?.message || error.message;

    if (errorData?.error_user_title) {
      errorMsg = `${errorData.error_user_title}: ${errorData.error_user_msg || errorMsg}`;
    }

    res.status(500).json({
      success: false,
      error: errorMsg,
      details: errorData
    });
  }
});

// Obtener páginas de Facebook del usuario
app.get('/api/pages', async (req, res) => {
  try {
    const response = await axios.get(`${META_API_BASE_URL}/me/accounts`, {
      params: {
        access_token: ACCESS_TOKEN,
        fields: 'id,name,access_token,instagram_business_account{id,username}'
      }
    });

    res.json({
      success: true,
      data: response.data.data || [],
      count: (response.data.data || []).length
    });
  } catch (error) {
    console.error('Error getting pages:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Obtener públicos guardados de una cuenta
app.get('/api/audiences/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const normalizedId = normalizeAccountId(accountId);

    // Obtener Saved Audiences
    const savedResponse = await axios.get(`${META_API_BASE_URL}/${normalizedId}/saved_audiences`, {
      params: {
        access_token: ACCESS_TOKEN,
        fields: 'id,name,targeting',
        limit: 100
      }
    }).catch(() => ({ data: { data: [] } }));

    // Obtener Custom Audiences
    const customResponse = await axios.get(`${META_API_BASE_URL}/${normalizedId}/customaudiences`, {
      params: {
        access_token: ACCESS_TOKEN,
        fields: 'id,name,subtype,description',
        limit: 100
      }
    }).catch(() => ({ data: { data: [] } }));

    res.json({
      success: true,
      data: {
        savedAudiences: savedResponse.data.data || [],
        customAudiences: customResponse.data.data || []
      },
      counts: {
        saved: (savedResponse.data.data || []).length,
        custom: (customResponse.data.data || []).length
      }
    });
  } catch (error) {
    console.error('Error getting audiences:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Obtener pixels de una cuenta publicitaria
app.get('/api/pixels/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const normalizedId = normalizeAccountId(accountId);

    const response = await axios.get(`${META_API_BASE_URL}/${normalizedId}/adspixels`, {
      params: {
        access_token: ACCESS_TOKEN,
        fields: 'id,name,code,last_fired_time,is_unavailable'
      }
    });

    res.json({
      success: true,
      data: response.data.data || [],
      count: (response.data.data || []).length
    });
  } catch (error) {
    console.error('Error getting pixels:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║        META ADS DASHBOARD API - DTOS INTEGRATION          ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                 ║
╠═══════════════════════════════════════════════════════════╣
║  ENDPOINTS DISPONIBLES:                                   ║
║  ─────────────────────────────────────────────────────────║
║  GET  /api/health              - Health check             ║
║  GET  /api/businesses          - Lista de businesses      ║
║  GET  /api/ad-accounts         - Todas las cuentas ads    ║
║  GET  /api/campaigns/:id       - Campañas de una cuenta   ║
║  POST /api/campaigns/:id/status- Activar/Pausar campaña   ║
║  GET  /api/dashboard           - TODOS los datos          ║
║  GET  /api/dashboard/summary   - Resumen ejecutivo        ║
║  ─────────────────────────────────────────────────────────║
║  UPLOAD & CONFIG ENDPOINTS:                               ║
║  POST /api/upload/image        - Subir imagen desde URL   ║
║  POST /api/upload/video        - Subir video desde URL    ║
║  GET  /api/pages               - Páginas de Facebook      ║
║  GET  /api/audiences/:id       - Públicos de una cuenta   ║
║  GET  /api/pixels/:id          - Pixels de una cuenta     ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
