import express from 'express';
import cors from 'cors';
import axios from 'axios';
import OpenAI from 'openai';
import multer from 'multer';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import sharp from 'sharp';

// Configurar ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();

// Configurar multer con almacenamiento en memoria (evita problemas de archivos temporales en Windows)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB máximo
});
const PORT = process.env.PORT || 3002;

// Token de acceso con permisos: pages_show_list, ads_management, ads_read, business_management, pages_read_engagement
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'TU_META_ACCESS_TOKEN_AQUI';

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
let openai = null;

if (OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    console.log('OpenAI API configurada correctamente');
  } catch (err) {
    console.error('ERROR al inicializar OpenAI:', err.message);
  }
} else {
  console.warn('ADVERTENCIA: OPENAI_API_KEY no está configurada. Las funciones de IA (5+5+5 automático) no funcionarán.');
  console.warn('Configura la variable de entorno OPENAI_API_KEY para habilitar generación de contenido con IA.');
}

const META_API_BASE_URL = 'https://graph.facebook.com/v18.0';

// Helper: obtener token dinámico del request (query, body, header) o fallback al hardcodeado
function getToken(req) {
  return req.query?.accessToken || req.body?.accessToken || req.headers['x-access-token'] || ACCESS_TOKEN;
}

// Helper: detectar content-type desde extensión de archivo
function getContentTypeFromExt(filename) {
  const ext = (filename || '').toLowerCase().split('.').pop();
  const types = {
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
    'png': 'image/png', 'gif': 'image/gif',
    'bmp': 'image/bmp', 'tiff': 'image/tiff',
    'mp4': 'video/mp4', 'mov': 'video/quicktime',
    'avi': 'video/x-msvideo', 'mkv': 'video/x-matroska',
    'webm': 'video/webm', 'webp': 'image/webp'
  };
  return types[ext] || 'application/octet-stream';
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// ============================================
// HELPER FUNCTIONS
// ============================================

const normalizeAccountId = (accountId) => {
  if (!accountId) return null;
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
};

// Obtener cuentas publicitarias del usuario
const getAdAccounts = async (token) => {
  try {
    const response = await axios.get(`${META_API_BASE_URL}/me/adaccounts`, {
      params: {
        access_token: token,
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
const getBusinesses = async (token) => {
  try {
    const response = await axios.get(`${META_API_BASE_URL}/me/businesses`, {
      params: {
        access_token: token,
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
const getBusinessOwnedAdAccounts = async (businessId, token) => {
  try {
    const response = await axios.get(`${META_API_BASE_URL}/${businessId}/owned_ad_accounts`, {
      params: {
        access_token: token,
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
const getBusinessClientAdAccounts = async (businessId, token) => {
  try {
    const response = await axios.get(`${META_API_BASE_URL}/${businessId}/client_ad_accounts`, {
      params: {
        access_token: token,
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
const getActiveCampaigns = async (adAccountId, token) => {
  try {
    const normalizedId = normalizeAccountId(adAccountId);
    const response = await axios.get(`${META_API_BASE_URL}/${normalizedId}/campaigns`, {
      params: {
        access_token: token,
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
const getCampaignInsights = async (campaignId, datePreset = 'maximum', token) => {
  try {
    const params = {
      access_token: token,
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
const getCampaignsWithInsights = async (adAccountId, datePreset = 'maximum', token) => {
  const campaigns = await getActiveCampaigns(adAccountId, token);
  const campaignsWithInsights = await Promise.all(
    campaigns.map(async (campaign) => {
      const insights = await getCampaignInsights(campaign.id, datePreset, token);
      return { ...campaign, insights };
    })
  );
  return campaignsWithInsights;
};

// Obtener todas las cuentas de todos los businesses
const getAllAdAccountsFromBusinesses = async (token) => {
  const businesses = await getBusinesses(token);
  const allAccounts = [];
  const seenIds = new Set();

  for (const business of businesses) {
    const ownedAccounts = await getBusinessOwnedAdAccounts(business.id, token);
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

    const clientAccounts = await getBusinessClientAdAccounts(business.id, token);
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

  const personalAccounts = await getAdAccounts(token);
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
    service: 'Meta Ads Dashboard API',
    openaiConfigured: !!openai
  });
});

// Obtener todos los businesses
app.get('/api/businesses', async (req, res) => {
  try {
    const token = getToken(req);
    const businesses = await getBusinesses(token);
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
    const token = getToken(req);
    const { businesses, adAccounts } = await getAllAdAccountsFromBusinesses(token);
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
    const token = getToken(req);

    const campaigns = await getCampaignsWithInsights(accountId, date_preset, token);
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
          access_token: getToken(req),
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
    const token = getToken(req);

    // Obtener todas las cuentas
    const { businesses, adAccounts } = await getAllAdAccountsFromBusinesses(token);

    // Obtener campañas de todas las cuentas
    const accountsWithCampaigns = await Promise.all(
      adAccounts.map(async (account) => {
        const campaigns = await getCampaignsWithInsights(account.id, date_preset, token);
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
    const token = getToken(req);

    const { businesses, adAccounts } = await getAllAdAccountsFromBusinesses(token);

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

      const campaigns = await getCampaignsWithInsights(account.id, date_preset, token);
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
    const token = getToken(req);

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
          access_token: token,
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
    const token = getToken(req);

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
          access_token: token,
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

// Helper: Auto-crop imagen a ratio 9:16 para Stories/Reels usando sharp
async function autoCropImage9x16(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    // Calcular si ya es ~9:16
    const currentRatio = width / height;
    const targetRatio = 9 / 16; // 0.5625

    // Si ya es suficientemente vertical (dentro de 10% del ratio), no recortar
    if (Math.abs(currentRatio - targetRatio) < 0.06) {
      console.log(`Image already ~9:16 (${width}x${height}, ratio ${currentRatio.toFixed(3)}), skipping crop`);
      return null;
    }

    // Calcular dimensiones del crop 9:16 centrado
    let cropWidth, cropHeight;
    if (currentRatio > targetRatio) {
      // Imagen más ancha que 9:16 → recortar lados
      cropHeight = height;
      cropWidth = Math.round(height * targetRatio);
    } else {
      // Imagen más alta que 9:16 → recortar arriba/abajo
      cropWidth = width;
      cropHeight = Math.round(width / targetRatio);
    }

    const left = Math.round((width - cropWidth) / 2);
    const top = Math.round((height - cropHeight) / 2);

    console.log(`Auto-cropping ${width}x${height} → 9:16 crop: ${cropWidth}x${cropHeight} (offset: ${left},${top})`);

    // Crop centrado + resize a max 1080px ancho (optimo para Stories/Reels)
    const croppedBuffer = await sharp(imageBuffer)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .resize(1080, 1920, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    console.log(`9:16 crop generated: ${(croppedBuffer.length / 1024).toFixed(0)}KB`);
    return croppedBuffer;
  } catch (err) {
    console.error('Auto-crop 9:16 failed:', err.message);
    return null;
  }
}

// Helper: Subir un buffer de imagen a Meta y retornar hash
async function uploadImageBufferToMeta(normalizedAccountId, token, imageBuffer, filename, contentType) {
  const formData = new FormData();
  formData.append('access_token', token);
  formData.append('filename', filename);
  formData.append('source', imageBuffer, { filename, contentType });

  const response = await axios.post(
    `${META_API_BASE_URL}/${normalizedAccountId}/adimages`,
    formData,
    { headers: formData.getHeaders() }
  );

  const images = response.data.images;
  const imageData = images ? Object.values(images)[0] : null;
  return imageData;
}

// Subir imagen desde ARCHIVO a Meta Ads (multipart) + auto-crop 9:16
app.post('/api/upload/image-file', upload.single('image'), async (req, res) => {
  try {
    const { adAccountId } = req.body;
    const token = getToken(req);
    const file = req.file;

    if (!adAccountId) {
      return res.status(400).json({ success: false, error: 'adAccountId es requerido' });
    }
    if (!file) {
      return res.status(400).json({ success: false, error: 'No se recibió ningún archivo' });
    }

    const normalizedId = normalizeAccountId(adAccountId);
    const contentType = file.mimetype || getContentTypeFromExt(file.originalname);

    // Validar formato soportado por Meta
    const supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
    if (!supportedImageTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        error: `Formato no soportado: ${contentType}. Meta acepta: JPG, PNG, GIF, BMP, TIFF. (No se acepta WebP)`
      });
    }

    console.log(`Uploading image file to ${normalizedId}:`, file.originalname, file.size, 'bytes', 'contentType:', contentType);

    // 1. Subir imagen original a Meta
    const originalData = await uploadImageBufferToMeta(normalizedId, token, file.buffer, file.originalname, contentType);

    if (!originalData?.hash) {
      return res.status(500).json({ success: false, error: 'No se obtuvo image_hash de Meta' });
    }

    console.log('Original image uploaded:', originalData.hash);

    // 2. Auto-crop a 9:16 para Stories/Reels
    let hash9x16 = null;
    try {
      const croppedBuffer = await autoCropImage9x16(file.buffer);
      if (croppedBuffer) {
        const croppedFilename = `stories_${file.originalname.replace(/\.[^.]+$/, '.jpg')}`;
        const croppedData = await uploadImageBufferToMeta(normalizedId, token, croppedBuffer, croppedFilename, 'image/jpeg');
        if (croppedData?.hash) {
          hash9x16 = croppedData.hash;
          console.log('9:16 crop uploaded:', hash9x16);
        }
      }
    } catch (cropErr) {
      console.warn('Auto-crop 9:16 upload failed (non-blocking):', cropErr.message);
    }

    res.json({
      success: true,
      data: {
        imageHash: originalData.hash,
        imageHash9x16: hash9x16,
        url: originalData.url,
        name: file.originalname
      }
    });
  } catch (error) {
    console.error('Image file upload error:', JSON.stringify(error.response?.data, null, 2) || error.message);
    const errorData = error.response?.data?.error;
    let errorMsg = errorData?.error_user_msg || errorData?.message || error.message;
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// Subir video desde ARCHIVO a Meta Ads (multipart)
app.post('/api/upload/video-file', upload.single('video'), async (req, res) => {
  try {
    const { adAccountId, title } = req.body;
    const token = getToken(req);
    const file = req.file;

    if (!adAccountId) {
      return res.status(400).json({ success: false, error: 'adAccountId es requerido' });
    }
    if (!file) {
      return res.status(400).json({ success: false, error: 'No se recibió ningún archivo' });
    }

    const normalizedId = normalizeAccountId(adAccountId);
    const contentType = file.mimetype || getContentTypeFromExt(file.originalname);

    // Validar formato soportado por Meta
    const supportedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
    if (!supportedVideoTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        error: `Formato no soportado: ${contentType}. Meta acepta: MP4, MOV, AVI, MKV.`
      });
    }

    console.log(`Uploading video file to ${normalizedId}:`, file.originalname, file.size, 'bytes', 'contentType:', contentType);
    console.log('Buffer size:', file.buffer.length, 'bytes');

    // Usar file.buffer directamente (memoryStorage)
    const formData = new FormData();
    formData.append('access_token', token);
    formData.append('title', title || file.originalname);
    formData.append('source', file.buffer, {
      filename: file.originalname,
      contentType: contentType
    });

    const response = await axios.post(
      `${META_API_BASE_URL}/${normalizedId}/advideos`,
      formData,
      { headers: formData.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity }
    );

    console.log('Video file upload response:', JSON.stringify(response.data, null, 2));

    res.json({
      success: true,
      data: {
        videoId: response.data.id,
        ...response.data
      }
    });
  } catch (error) {
    console.error('Video file upload error:', JSON.stringify(error.response?.data, null, 2) || error.message);
    const errorData = error.response?.data?.error;
    let errorMsg = errorData?.error_user_msg || errorData?.message || error.message;
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// Obtener páginas de Facebook del usuario
app.get('/api/pages', async (req, res) => {
  try {
    const response = await axios.get(`${META_API_BASE_URL}/me/accounts`, {
      params: {
        access_token: getToken(req),
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
        access_token: getToken(req),
        fields: 'id,name,targeting',
        limit: 100
      }
    }).catch(() => ({ data: { data: [] } }));

    // Obtener Custom Audiences
    const customResponse = await axios.get(`${META_API_BASE_URL}/${normalizedId}/customaudiences`, {
      params: {
        access_token: getToken(req),
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
        access_token: getToken(req),
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

// ============================================
// AI CONTENT GENERATION ENDPOINT
// ============================================

// Generar contenido 5+5+5 con OpenAI
app.post('/api/generate-content', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI no está configurado. Configura OPENAI_API_KEY en las variables de entorno del servidor.'
      });
    }

    const { prompt, category } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'El prompt es requerido'
      });
    }

    console.log('Generating content with OpenAI for:', prompt.substring(0, 100) + '...');

    const systemPrompt = `Eres un experto en marketing digital y copywriting para anuncios de Facebook/Instagram Ads.
Tu tarea es generar contenido creativo y persuasivo para campañas publicitarias.

IMPORTANTE:
- Los títulos deben tener máximo 40 caracteres
- Las descripciones deben tener máximo 125 caracteres
- El contenido debe ser en español
- Debe ser persuasivo y orientado a la acción
- Adapta el tono según el tipo de negocio

Responde ÚNICAMENTE en formato JSON válido, sin markdown ni texto adicional.`;

    const userPrompt = `Genera contenido para una campaña de Facebook Ads basándote en esta descripción:

"${prompt}"

${category ? `Categoría de campaña: ${category}` : ''}

Genera exactamente:
- 5 títulos cortos y llamativos (máx 40 caracteres cada uno)
- 5 descripciones persuasivas (máx 125 caracteres cada una)
- 5 CTAs recomendados de esta lista: LEARN_MORE, SHOP_NOW, SIGN_UP, CONTACT_US, GET_QUOTE, SUBSCRIBE, BOOK_NOW, DOWNLOAD, GET_OFFER, SEND_MESSAGE, WHATSAPP_MESSAGE, CALL_NOW

Responde en este formato JSON exacto:
{
  "headlines": ["título1", "título2", "título3", "título4", "título5"],
  "descriptions": ["desc1", "desc2", "desc3", "desc4", "desc5"],
  "ctas": ["CTA1", "CTA2", "CTA3", "CTA4", "CTA5"],
  "suggestedBudget": 50000,
  "targetAudience": "descripción breve del público objetivo sugerido"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const responseText = completion.choices[0].message.content;
    console.log('OpenAI response:', responseText);

    // Parsear el JSON de la respuesta
    let generatedContent;
    try {
      // Limpiar posibles caracteres extra
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      generatedContent = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Error procesando la respuesta de IA',
        rawResponse: responseText
      });
    }

    // Validar que tenga los campos necesarios
    if (!generatedContent.headlines || !generatedContent.descriptions || !generatedContent.ctas) {
      return res.status(500).json({
        success: false,
        error: 'La respuesta de IA no tiene el formato esperado',
        rawResponse: responseText
      });
    }

    res.json({
      success: true,
      data: {
        headlines: generatedContent.headlines.slice(0, 5),
        descriptions: generatedContent.descriptions.slice(0, 5),
        ctas: generatedContent.ctas.slice(0, 5),
        suggestedBudget: generatedContent.suggestedBudget || 50000,
        targetAudience: generatedContent.targetAudience || ''
      }
    });

  } catch (error) {
    console.error('OpenAI error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Error generando contenido con IA'
    });
  }
});

// ============================================
// AI MEDIA ANALYSIS ENDPOINTS
// ============================================

// Helper: Extract audio from video buffer using ffmpeg
async function extractAudioFromBuffer(videoBuffer, filename) {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `input_${Date.now()}_${filename}`);
  const outputPath = path.join(tmpDir, `audio_${Date.now()}.mp3`);

  try {
    // Write video buffer to temp file
    fs.writeFileSync(inputPath, videoBuffer);

    // Extract audio with ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('64k')
        .audioFrequency(16000)
        .audioChannels(1)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const audioBuffer = fs.readFileSync(outputPath);
    return audioBuffer;
  } finally {
    // Cleanup temp files
    try { fs.unlinkSync(inputPath); } catch (e) { /* ignore */ }
    try { fs.unlinkSync(outputPath); } catch (e) { /* ignore */ }
  }
}

// Helper: Extract a frame from video as JPEG (for vision fallback)
async function extractFrameFromBuffer(videoBuffer, filename) {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `frame_input_${Date.now()}_${filename}`);
  const outputPath = path.join(tmpDir, `frame_${Date.now()}.jpg`);

  try {
    fs.writeFileSync(inputPath, videoBuffer);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          count: 1,
          timemarks: ['1'],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '640x?'
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const frameBuffer = fs.readFileSync(outputPath);
    return frameBuffer;
  } finally {
    try { fs.unlinkSync(inputPath); } catch (e) { /* ignore */ }
    try { fs.unlinkSync(outputPath); } catch (e) { /* ignore */ }
  }
}

// Helper: Generate 5+5+5 content from transcription text
async function generateContentFromText(transcription, adIndex, category) {
  const angleVariations = [
    'Enfócate en el beneficio principal y la propuesta de valor.',
    'Enfócate en la urgencia y escasez. Usa un tono más directo.',
    'Enfócate en la prueba social y credibilidad. Usa testimonios implícitos.',
    'Enfócate en resolver un problema o dolor del cliente.',
    'Enfócate en la emoción y aspiración. Haz que el cliente se imagine el resultado.',
    'Enfócate en la curiosidad. Haz preguntas que enganchen.',
    'Enfócate en la exclusividad y diferenciación.'
  ];

  const angle = angleVariations[adIndex % angleVariations.length];

  const systemPrompt = `Eres un experto copywriter de Facebook/Instagram Ads.
Generas contenido persuasivo basándote en la transcripción/contenido de un video o imagen publicitario.

REGLAS:
- Títulos: máximo 40 caracteres cada uno
- Descripciones: máximo 125 caracteres cada una
- Todo en español
- Persuasivo y orientado a la acción
- Responde SOLO en JSON válido, sin markdown`;

  const userPrompt = `Basándote en este contenido de un video/audio publicitario:

"${transcription.substring(0, 2000)}"

${category ? `Categoría: ${category}` : ''}

Instrucción de ángulo: ${angle}

Genera exactamente:
- 5 títulos cortos y llamativos (máx 40 chars)
- 5 descripciones persuasivas (máx 125 chars)
- 5 CTAs de esta lista (SOLO estos son válidos para LINK_CLICKS): LEARN_MORE, SHOP_NOW, SIGN_UP, SUBSCRIBE, DOWNLOAD, GET_OFFER, APPLY_NOW, CONTACT_US, GET_QUOTE

JSON exacto:
{
  "headlines": ["t1", "t2", "t3", "t4", "t5"],
  "descriptions": ["d1", "d2", "d3", "d4", "d5"],
  "ctas": ["CTA1", "CTA2", "CTA3", "CTA4", "CTA5"]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7 + (adIndex * 0.05), // Slight variation per ad
    max_tokens: 1000
  });

  const responseText = completion.choices[0].message.content;
  const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleanJson);
  // Ensure exactly 5 CTAs
  const validCtas = ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'SUBSCRIBE', 'DOWNLOAD', 'GET_OFFER', 'APPLY_NOW', 'CONTACT_US', 'GET_QUOTE'];
  if (!parsed.ctas || parsed.ctas.length < 5) {
    parsed.ctas = parsed.ctas || [];
    while (parsed.ctas.length < 5) {
      const next = validCtas.find(c => !parsed.ctas.includes(c)) || 'LEARN_MORE';
      parsed.ctas.push(next);
    }
  }
  return parsed;
}

// Helper: Generate 5+5+5 content from image (vision)
async function generateContentFromImage(base64Image, adIndex, category) {
  const angleVariations = [
    'Enfócate en el beneficio principal y la propuesta de valor.',
    'Enfócate en la urgencia y escasez. Usa un tono más directo.',
    'Enfócate en la prueba social y credibilidad.',
    'Enfócate en resolver un problema o dolor del cliente.',
    'Enfócate en la emoción y aspiración.',
    'Enfócate en la curiosidad. Haz preguntas que enganchen.',
    'Enfócate en la exclusividad y diferenciación.'
  ];

  const angle = angleVariations[adIndex % angleVariations.length];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Eres un experto copywriter de Facebook/Instagram Ads.
Analizas imágenes publicitarias y generas contenido persuasivo.

REGLAS:
- Títulos: máximo 40 caracteres
- Descripciones: máximo 125 caracteres
- Todo en español
- Responde SOLO en JSON válido, sin markdown`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analiza esta imagen publicitaria y genera contenido para un anuncio de Facebook Ads.

${category ? `Categoría: ${category}` : ''}
Instrucción de ángulo: ${angle}

Genera exactamente en JSON:
{
  "headlines": ["t1", "t2", "t3", "t4", "t5"],
  "descriptions": ["d1", "d2", "d3", "d4", "d5"],
  "ctas": ["CTA1", "CTA2", "CTA3", "CTA4", "CTA5"]
}

CTAs válidos (SOLO estos para LINK_CLICKS): LEARN_MORE, SHOP_NOW, SIGN_UP, SUBSCRIBE, DOWNLOAD, GET_OFFER, APPLY_NOW, CONTACT_US, GET_QUOTE`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: 'low'
            }
          }
        ]
      }
    ],
    temperature: 0.7 + (adIndex * 0.05),
    max_tokens: 1000
  });

  const responseText = completion.choices[0].message.content;
  const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleanJson);
  // Ensure exactly 5 CTAs
  const validCtas = ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'SUBSCRIBE', 'DOWNLOAD', 'GET_OFFER', 'APPLY_NOW', 'CONTACT_US', 'GET_QUOTE'];
  if (!parsed.ctas || parsed.ctas.length < 5) {
    parsed.ctas = parsed.ctas || [];
    while (parsed.ctas.length < 5) {
      const next = validCtas.find(c => !parsed.ctas.includes(c)) || 'LEARN_MORE';
      parsed.ctas.push(next);
    }
  }
  return parsed;
}

// POST /api/analyze-video - Transcribe video audio and generate 5+5+5
app.post('/api/analyze-video', upload.single('video'), async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI no está configurado. Configura OPENAI_API_KEY en las variables de entorno del servidor para habilitar análisis de video.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se recibió archivo de video' });
    }

    const adIndex = parseInt(req.body.adIndex) || 0;
    const category = req.body.category || '';
    const fileName = req.file.originalname || 'video.mp4';
    const fileSize = req.file.size;

    console.log(`Analyzing video: ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)}MB) for ad index ${adIndex}`);

    let transcription = '';

    try {
      let audioBuffer;

      if (fileSize <= 25 * 1024 * 1024) {
        // File is small enough to send directly to Whisper
        audioBuffer = req.file.buffer;
        console.log('Video <= 25MB, sending directly to Whisper...');
      } else {
        // Extract audio first with ffmpeg
        console.log('Video > 25MB, extracting audio with ffmpeg...');
        audioBuffer = await extractAudioFromBuffer(req.file.buffer, fileName);
        console.log(`Audio extracted: ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`);
      }

      // Create a File-like object for the OpenAI API
      const mimeType = fileSize <= 25 * 1024 * 1024 ? (getContentTypeFromExt(fileName) || 'video/mp4') : 'audio/mpeg';
      const audioFile = new File(
        [audioBuffer],
        fileSize <= 25 * 1024 * 1024 ? fileName : 'audio.mp3',
        { type: mimeType }
      );

      const whisperResponse = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: audioFile,
        language: 'es'
      });

      transcription = whisperResponse.text || '';
      console.log(`Transcription (${transcription.length} chars): ${transcription.substring(0, 200)}...`);
    } catch (whisperError) {
      console.warn('Whisper transcription failed:', whisperError.message);
    }

    // If transcription is too short, fall back to vision analysis of a frame
    if (transcription.length < 20) {
      console.log('No meaningful speech detected, falling back to vision analysis...');

      try {
        const frameBuffer = await extractFrameFromBuffer(req.file.buffer, fileName);
        const base64Frame = frameBuffer.toString('base64');
        const content = await generateContentFromImage(base64Frame, adIndex, category);

        return res.json({
          success: true,
          data: {
            headlines: content.headlines?.slice(0, 5) || [],
            descriptions: content.descriptions?.slice(0, 5) || [],
            ctas: content.ctas?.slice(0, 5) || [],
            transcription: transcription || '(sin habla detectada)',
            method: 'vision'
          }
        });
      } catch (visionError) {
        console.error('Vision fallback also failed:', visionError.message);
        return res.status(500).json({
          success: false,
          error: 'No se pudo analizar el video (sin audio ni imagen)',
          details: visionError.message
        });
      }
    }

    // Generate content from transcription
    const content = await generateContentFromText(transcription, adIndex, category);

    res.json({
      success: true,
      data: {
        headlines: content.headlines?.slice(0, 5) || [],
        descriptions: content.descriptions?.slice(0, 5) || [],
        ctas: content.ctas?.slice(0, 5) || [],
        transcription,
        method: 'whisper'
      }
    });

  } catch (error) {
    console.error('Video analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Error analizando el video'
    });
  }
});

// POST /api/analyze-image - Analyze image with vision and generate 5+5+5
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI no está configurado. Configura OPENAI_API_KEY en las variables de entorno del servidor para habilitar análisis de imagen.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se recibió archivo de imagen' });
    }

    const adIndex = parseInt(req.body.adIndex) || 0;
    const category = req.body.category || '';
    const fileName = req.file.originalname || 'image.jpg';

    console.log(`Analyzing image: ${fileName} for ad index ${adIndex}`);

    const base64Image = req.file.buffer.toString('base64');
    const content = await generateContentFromImage(base64Image, adIndex, category);

    res.json({
      success: true,
      data: {
        headlines: content.headlines?.slice(0, 5) || [],
        descriptions: content.descriptions?.slice(0, 5) || [],
        ctas: content.ctas?.slice(0, 5) || [],
        method: 'vision'
      }
    });

  } catch (error) {
    console.error('Image analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Error analizando la imagen'
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
