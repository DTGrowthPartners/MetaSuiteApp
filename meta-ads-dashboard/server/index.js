import express from 'express';
import cors from 'cors';
import axios from 'axios';
import OpenAI from 'openai';
import multer from 'multer';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Load .env file from server directory (for local dev)
const __dirname_server = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname_server, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
  console.log('Loaded .env from', envPath);
}
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';

// Configurar ffmpeg path - usar ffmpeg-static si existe, sino el del sistema
let ffmpegPath = null;
try {
  const ffmpegStatic = (await import('ffmpeg-static')).default;
  if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
    ffmpegPath = ffmpegStatic;
  }
} catch {
  console.log('ffmpeg-static no disponible, usando ffmpeg del sistema');
}
// Si no se encontró ffmpeg-static, verificar si ffmpeg está en el PATH del sistema
if (!ffmpegPath) {
  try {
    const { execSync } = await import('child_process');
    const systemFfmpeg = execSync('which ffmpeg 2>/dev/null || where ffmpeg 2>NUL', { encoding: 'utf-8' }).trim().split('\n')[0];
    if (systemFfmpeg) {
      ffmpegPath = systemFfmpeg;
      console.log('Usando ffmpeg del sistema:', ffmpegPath);
    }
  } catch {
    console.warn('ffmpeg NO disponible. El análisis de video no funcionará.');
  }
}

const app = express();

// Configurar multer con almacenamiento en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB máximo
});
const PORT = process.env.PORT || 3002;

// Token de acceso con permisos: pages_show_list, ads_management, ads_read, business_management, pages_read_engagement
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'TU_META_ACCESS_TOKEN_AQUI';

// OpenAI Configuration - Configurar variable de entorno OPENAI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
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

const META_API_VERSION = 'v24.0';
const META_API_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

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
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Error handler for multer (file too large, etc.) - returns JSON instead of HTML
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, error: 'El archivo es demasiado grande. Máximo 200MB.' });
    }
    return res.status(400).json({ success: false, error: `Error de upload: ${err.message}` });
  }
  next(err);
});

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
  let tmpFilePath = null;
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

    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    console.log(`Uploading video file to ${normalizedId}: ${file.originalname} ${fileSizeMB}MB contentType: ${contentType}`);

    const CHUNKED_THRESHOLD = 80 * 1024 * 1024; // 80MB - use chunked upload above this
    let videoId;

    if (file.size > CHUNKED_THRESHOLD) {
      // === CHUNKED UPLOAD for large files (Meta Resumable Upload API) ===
      console.log(`Using chunked upload for ${fileSizeMB}MB file...`);

      // Step 1: Start upload session
      const startResponse = await axios.post(`${META_API_BASE_URL}/${normalizedId}/advideos`, null, {
        params: {
          access_token: token,
          upload_phase: 'start',
          file_size: file.size
        },
        timeout: 30000
      });

      const { upload_session_id, video_id: chunkedVideoId, start_offset: initialStart, end_offset: initialEnd } = startResponse.data;
      console.log(`Chunked upload session: ${upload_session_id}, video_id: ${chunkedVideoId}, first chunk: ${initialStart}-${initialEnd}`);

      // Write buffer to temp file for chunked reading
      tmpFilePath = path.join(os.tmpdir(), `upload_${Date.now()}_${file.originalname}`);
      fs.writeFileSync(tmpFilePath, file.buffer);

      // Step 2: Transfer chunks
      let startOffset = parseInt(initialStart);
      let endOffset = parseInt(initialEnd);
      let chunkNum = 0;

      while (startOffset < file.size) {
        chunkNum++;
        const chunkSize = endOffset - startOffset;
        console.log(`  Chunk ${chunkNum}: bytes ${startOffset}-${endOffset} (${(chunkSize / 1024 / 1024).toFixed(1)}MB)`);

        // Read chunk from temp file
        const fd = fs.openSync(tmpFilePath, 'r');
        const chunkBuffer = Buffer.alloc(chunkSize);
        fs.readSync(fd, chunkBuffer, 0, chunkSize, startOffset);
        fs.closeSync(fd);

        const chunkForm = new FormData();
        chunkForm.append('access_token', token);
        chunkForm.append('upload_phase', 'transfer');
        chunkForm.append('upload_session_id', upload_session_id);
        chunkForm.append('start_offset', startOffset.toString());
        chunkForm.append('video_file_chunk', chunkBuffer, {
          filename: file.originalname,
          contentType: 'application/octet-stream'
        });

        let transferResponse;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            transferResponse = await axios.post(
              `${META_API_BASE_URL}/${normalizedId}/advideos`,
              chunkForm,
              {
                headers: chunkForm.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 300000 // 5 min per chunk
              }
            );
            break;
          } catch (chunkErr) {
            if (attempt >= 1) throw chunkErr;
            console.log(`Chunk ${startOffset}-${endOffset} failed, retrying in 2s...`);
            await new Promise(r => setTimeout(r, 2000));
          }
        }

        startOffset = parseInt(transferResponse.data.start_offset);
        endOffset = parseInt(transferResponse.data.end_offset);
      }

      // Step 3: Finish upload
      const finishResponse = await axios.post(`${META_API_BASE_URL}/${normalizedId}/advideos`, null, {
        params: {
          access_token: token,
          upload_phase: 'finish',
          upload_session_id: upload_session_id,
          title: title || file.originalname
        },
        timeout: 60000
      });

      if (!finishResponse.data?.success && !finishResponse.data?.id) {
        throw new Error('Chunked upload finish failed: ' + JSON.stringify(finishResponse.data));
      }

      videoId = chunkedVideoId;
      console.log(`Chunked upload complete: video_id=${videoId} (${chunkNum} chunks)`);

    } else {
      // === DIRECT UPLOAD for smaller files ===
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
        {
          headers: formData.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 600000
        }
      );

      videoId = response.data.id;
      console.log('Direct upload response:', JSON.stringify(response.data, null, 2));
    }

    res.json({
      success: true,
      data: { videoId }
    });
  } catch (error) {
    const status = error.response?.status || 'N/A';
    const statusText = error.response?.statusText || '';
    const responseData = error.response?.data;
    console.error(`Video file upload error [${status} ${statusText}]:`, JSON.stringify(responseData, null, 2) || error.message);
    if (error.code) console.error('Error code:', error.code);
    const errorData = responseData?.error;
    let errorMsg = errorData?.error_user_msg || errorData?.message || error.message;
    if (error.code === 'ECONNABORTED') errorMsg = 'Timeout: la subida tardó demasiado. Intenta con un video más corto o comprimido.';
    res.status(error.response?.status || 500).json({ success: false, error: errorMsg });
  } finally {
    if (tmpFilePath) {
      try { fs.unlinkSync(tmpFilePath); } catch (e) { /* ignore */ }
    }
  }
});

// Obtener páginas de Facebook del usuario
app.get('/api/pages', async (req, res) => {
  try {
    const response = await axios.get(`${META_API_BASE_URL}/me/accounts`, {
      params: {
        access_token: getToken(req),
        fields: 'id,name,access_token,website,instagram_business_account{id,username}'
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
- 5 descripciones de enlace cortas (máx 30 caracteres cada una, detalles adicionales que complementan el título, ej: "Envío gratis", "Ver colección", "Disponible ahora")
- 5 CTAs recomendados de esta lista: LEARN_MORE, SHOP_NOW, SIGN_UP, CONTACT_US, GET_QUOTE, SUBSCRIBE, BOOK_NOW, DOWNLOAD, GET_OFFER, SEND_MESSAGE, WHATSAPP_MESSAGE, CALL_NOW

Responde en este formato JSON exacto:
{
  "headlines": ["título1", "título2", "título3", "título4", "título5"],
  "descriptions": ["desc1", "desc2", "desc3", "desc4", "desc5"],
  "linkDescriptions": ["detalle corto1", "detalle corto2", "detalle corto3", "detalle corto4", "detalle corto5"],
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
      max_tokens: 2000
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
        linkDescriptions: (generatedContent.linkDescriptions || []).slice(0, 5),
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

    // Extract audio with ffmpeg (with 60s timeout to prevent hanging)
    await new Promise((resolve, reject) => {
      let timedOut = false;
      const command = ffmpeg(inputPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('64k')
        .audioFrequency(16000)
        .audioChannels(1)
        .output(outputPath)
        .on('end', () => {
          clearTimeout(timeout);
          if (!timedOut) resolve();
        })
        .on('error', (err) => {
          clearTimeout(timeout);
          if (!timedOut) reject(err);
        });

      const timeout = setTimeout(() => {
        timedOut = true;
        command.kill('SIGKILL');
        reject(new Error('ffmpeg timeout: audio extraction exceeded 60 seconds'));
      }, 60000);

      command.run();
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
// Helper: generar contexto específico según tipo de campaña
function getCampaignContext(objective, destType) {
  if (destType === 'INSTAGRAM_PROFILE') {
    return {
      focus: `CAMPAÑA DE TRÁFICO AL PERFIL DE INSTAGRAM - El objetivo es que el usuario VISITE el perfil y SE HAGA SEGUIDOR.
- Los títulos deben despertar curiosidad sobre el contenido del perfil: "Mira lo que compartimos", "Contenido que no te puedes perder"
- Las descripciones deben mostrar el valor de seguir la cuenta: contenido exclusivo, tips, novedades, comunidad
- Usa frases como "Síguenos", "Visita nuestro perfil", "Únete a nuestra comunidad", "No te pierdas nuestro contenido"
- Resalta qué encontrarán en el perfil: tips diarios, ofertas exclusivas, detrás de cámaras, testimonios
- Crea FOMO (miedo a perderse algo): "Miles ya nos siguen", "Contenido nuevo cada día"
- NO uses CTAs de compra ni WhatsApp. El objetivo es que visiten el perfil de Instagram`,
      ctas: 'LEARN_MORE, CONTACT_US, SHOP_NOW, GET_QUOTE',
      preferredCtas: ['LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE']
    };
  }
  if (destType === 'WEBSITE' || objective === 'OUTCOME_TRAFFIC') {
    return {
      focus: `CAMPAÑA DE TRÁFICO WEB - El objetivo es que el usuario HAGA CLIC y visite la página web.
- Los títulos deben generar curiosidad o urgencia para que hagan clic
- Las descripciones deben dar una razón clara para visitar el sitio (oferta, beneficio, solución)
- Usa verbos de acción directos: "Descubre", "Conoce", "Visita", "Aprovecha", "Mira"
- NO seas genérico. Sé específico sobre lo que encontrarán al hacer clic
- Incluye llamados a la acción claros orientados al clic`,
      ctas: 'LEARN_MORE, SHOP_NOW, SIGN_UP, GET_OFFER, APPLY_NOW, DOWNLOAD, SUBSCRIBE, GET_QUOTE, CONTACT_US',
      preferredCtas: ['LEARN_MORE', 'SHOP_NOW', 'GET_OFFER']
    };
  }
  if (destType === 'WHATSAPP' || objective === 'OUTCOME_ENGAGEMENT') {
    return {
      focus: `CAMPAÑA DE WHATSAPP/MENSAJES - El objetivo es que el usuario ESCRIBA por WhatsApp.
- Los títulos deben invitar a la conversación directa
- Las descripciones deben dar confianza y facilitar el primer contacto
- Usa frases como "Escríbenos", "Pregunta sin compromiso", "Te asesoramos"`,
      ctas: 'WHATSAPP_MESSAGE, SEND_MESSAGE, CONTACT_US, GET_QUOTE, LEARN_MORE',
      preferredCtas: ['WHATSAPP_MESSAGE', 'SEND_MESSAGE', 'CONTACT_US']
    };
  }
  if (objective === 'OUTCOME_LEADS') {
    return {
      focus: `CAMPAÑA DE GENERACIÓN DE LEADS - El objetivo es capturar datos del usuario.
- Los títulos deben ofrecer algo de valor a cambio (descuento, info, demo)
- Las descripciones deben minimizar el esfuerzo percibido: "en 30 segundos", "sin compromiso"`,
      ctas: 'SIGN_UP, GET_QUOTE, LEARN_MORE, SUBSCRIBE, APPLY_NOW, DOWNLOAD, GET_OFFER, CONTACT_US',
      preferredCtas: ['SIGN_UP', 'GET_QUOTE', 'SUBSCRIBE']
    };
  }
  if (objective === 'OUTCOME_SALES') {
    return {
      focus: `CAMPAÑA DE VENTAS/CONVERSIONES - El objetivo es que el usuario COMPRE.
- Los títulos deben destacar ofertas, precios o beneficios concretos
- Las descripciones deben crear urgencia y mostrar valor: descuentos, envío gratis, tiempo limitado`,
      ctas: 'SHOP_NOW, GET_OFFER, LEARN_MORE, SIGN_UP, SUBSCRIBE, DOWNLOAD, APPLY_NOW',
      preferredCtas: ['SHOP_NOW', 'GET_OFFER', 'LEARN_MORE']
    };
  }
  // Default genérico
  return {
    focus: `Genera contenido persuasivo orientado a la acción.`,
    ctas: 'LEARN_MORE, SHOP_NOW, SIGN_UP, SUBSCRIBE, DOWNLOAD, GET_OFFER, APPLY_NOW, CONTACT_US, GET_QUOTE',
    preferredCtas: ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP']
  };
}

// Helper: get text length rules based on user selection
function getTextLengthRules(textLength) {
  switch (textLength) {
    case 'short':
      return {
        headlineMax: 30,
        headlineRule: 'máximo 30 caracteres. Cortos, directos y al grano.',
        descMin: 50, descMax: 100,
        descRule: 'entre 50 y 100 caracteres. Breves, directos, con 1 beneficio claro y un llamado a la acción corto.',
      };
    case 'long':
      return {
        headlineMax: 55,
        headlineRule: 'máximo 55 caracteres. Impactantes, con gancho emocional fuerte.',
        descMin: 250, descMax: 400,
        descRule: 'entre 250 y 400 caracteres. MUY DETALLADOS, con múltiples beneficios, detalles específicos del producto/servicio, prueba social implícita y un cierre persuasivo con llamado a la acción.',
      };
    default: // 'medium'
      return {
        headlineMax: 50,
        headlineRule: 'máximo 50 caracteres. Impactantes, con gancho emocional.',
        descMin: 150, descMax: 250,
        descRule: 'entre 150 y 250 caracteres. Persuasivos, con beneficios claros, detalles específicos del producto/servicio, y un cierre con llamado a la acción.',
      };
  }
}

async function generateContentFromText(transcription, adIndex, category, objective, templateName, destType, textLength = 'medium', campaignContext = '') {
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
  const ctx = getCampaignContext(objective, destType);
  const len = getTextLengthRules(textLength);

  const systemPrompt = `Eres un experto copywriter de Facebook/Instagram Ads con años de experiencia creando campañas virales y de alto rendimiento.

${ctx.focus}

REGLAS ESTRICTAS:
- TÍTULOS (headlines): ${len.headlineRule} Usa MÁXIMO 1 emoji por título (al inicio o final). Deben generar curiosidad o urgencia.
- DESCRIPCIONES (texto principal): ${len.descRule} Usa MÁXIMO 1 emoji por oración para separar ideas. NO llenes de emojis, sé profesional.
- Todo en español
- MÁXIMO 1 emoji por elemento (título o frase dentro de descripción). Menos es más. Si no aporta, no pongas emoji.
- NO uses frases genéricas vacías. Sé MUY ESPECÍFICO sobre el producto/servicio
- Responde SOLO en JSON válido, sin markdown`;

  const userPrompt = `Basándote en este contenido de un video/audio publicitario:

"${transcription.substring(0, 2000)}"

${category ? `Categoría del negocio: ${category}` : ''}
${templateName ? `Tipo de campaña: ${templateName}` : ''}
${campaignContext ? `\nCONTEXTO DE LA CAMPAÑA (proporcionado por el anunciante, PRIORIZA esta información):\n"${campaignContext}"\n` : ''}

Instrucción de ángulo: ${angle}

Genera exactamente:
- 5 TÍTULOS llamativos (máx ${len.headlineMax} chars) con máximo 1 emoji cada uno - que enganchen y generen curiosidad
- 5 DESCRIPCIONES persuasivas (${len.descMin}-${len.descMax} chars cada una) - con beneficios claros, detalles específicos del producto/servicio, y un cierre con llamado a la acción. Máximo 1 emoji por oración, no abuses
- 5 DESCRIPCIONES DE ENLACE cortas (máx 30 chars cada una) - detalles adicionales breves que complementan el título, ej: "Envío gratis hoy", "Ver colección", "Disponible ahora"
- 5 CTAs variados de esta lista: ${ctx.ctas}

JSON exacto:
{
  "headlines": ["título", "título", "título", "título", "título"],
  "descriptions": ["descripción con beneficios claros...", "otra descripción persuasiva...", "...", "...", "..."],
  "linkDescriptions": ["detalle corto", "detalle corto", "detalle corto", "detalle corto", "detalle corto"],
  "ctas": ["CTA1", "CTA2", "CTA3", "CTA4", "CTA5"]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7 + (adIndex * 0.05), // Slight variation per ad
    max_tokens: 2000
  });

  const responseText = completion.choices[0].message.content;
  const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleanJson);
  // Ensure exactly 5 CTAs using campaign-specific preferred CTAs
  const fallbackCtas = [...ctx.preferredCtas, 'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'SUBSCRIBE', 'DOWNLOAD', 'GET_OFFER', 'APPLY_NOW', 'CONTACT_US', 'GET_QUOTE'];
  if (!parsed.ctas || parsed.ctas.length < 5) {
    parsed.ctas = parsed.ctas || [];
    while (parsed.ctas.length < 5) {
      const next = fallbackCtas.find(c => !parsed.ctas.includes(c)) || 'LEARN_MORE';
      parsed.ctas.push(next);
    }
  }
  return parsed;
}

// Helper: Generate 5+5+5 content from image (vision)
async function generateContentFromImage(base64Image, adIndex, category, objective, templateName, destType, textLength = 'medium', campaignContext = '') {
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
  const ctx = getCampaignContext(objective, destType);
  const len = getTextLengthRules(textLength);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Eres un experto copywriter de Facebook/Instagram Ads con años de experiencia creando campañas virales y de alto rendimiento.

${ctx.focus}

REGLAS ESTRICTAS:
- TÍTULOS (headlines): ${len.headlineRule} Usa MÁXIMO 1 emoji por título (al inicio o final). Deben generar curiosidad o urgencia.
- DESCRIPCIONES (texto principal): ${len.descRule} Usa MÁXIMO 1 emoji por oración para separar ideas. NO llenes de emojis, sé profesional.
- Todo en español
- MÁXIMO 1 emoji por elemento (título o frase dentro de descripción). Menos es más. Si no aporta, no pongas emoji.
- NO uses frases genéricas vacías. Sé MUY ESPECÍFICO sobre el producto/servicio de la imagen
- Responde SOLO en JSON válido, sin markdown`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analiza esta imagen publicitaria y genera contenido para un anuncio de Facebook Ads.

${category ? `Categoría del negocio: ${category}` : ''}
${templateName ? `Tipo de campaña: ${templateName}` : ''}
${campaignContext ? `\nCONTEXTO DE LA CAMPAÑA (proporcionado por el anunciante, PRIORIZA esta información):\n"${campaignContext}"\n` : ''}
Instrucción de ángulo: ${angle}

Genera exactamente en JSON:
{
  "headlines": ["título (máx ${len.headlineMax} chars)", "título", "título", "título", "título"],
  "descriptions": ["descripción persuasiva (${len.descMin}-${len.descMax} chars)...", "otra descripción...", "...", "...", "..."],
  "linkDescriptions": ["detalle corto (máx 30 chars)", "detalle corto", "detalle corto", "detalle corto", "detalle corto"],
  "ctas": ["CTA1", "CTA2", "CTA3", "CTA4", "CTA5"]
}

Máximo 1 emoji por título y 1 emoji por oración en descripciones. No abuses de emojis.
linkDescriptions: detalles adicionales breves que complementan el título (ej: "Envío gratis", "Ver colección", "Disponible ahora").
CTAs variados de esta lista: ${ctx.ctas}`
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
    max_tokens: 2000
  });

  const responseText = completion.choices[0].message.content;
  const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleanJson);
  // Ensure exactly 5 CTAs using campaign-specific preferred CTAs
  const fallbackCtas = [...ctx.preferredCtas, 'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'SUBSCRIBE', 'DOWNLOAD', 'GET_OFFER', 'APPLY_NOW', 'CONTACT_US', 'GET_QUOTE'];
  if (!parsed.ctas || parsed.ctas.length < 5) {
    parsed.ctas = parsed.ctas || [];
    while (parsed.ctas.length < 5) {
      const next = fallbackCtas.find(c => !parsed.ctas.includes(c)) || 'LEARN_MORE';
      parsed.ctas.push(next);
    }
  }
  return parsed;
}

// POST /api/analyze-video - Transcribe video audio and generate 5+5+5
app.post('/api/analyze-video', upload.single('video'), async (req, res) => {
  try {
    // Check ffmpeg availability for video processing
    if (!ffmpegPath) {
      return res.status(400).json({
        success: false,
        error: 'ffmpeg no disponible. El análisis de video requiere ffmpeg-static. Instala con: npm install ffmpeg-static'
      });
    }

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
    const objective = req.body.objective || '';
    const templateName = req.body.templateName || '';
    const destType = req.body.destType || '';
    const textLength = req.body.textLength || 'medium';
    const campaignContext = req.body.campaignContext || '';
    const fileName = req.file.originalname || 'video.mp4';
    const fileSize = req.file.size;

    console.log(`Analyzing video: ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)}MB) for ad index ${adIndex}, objective: ${objective}, dest: ${destType}, length: ${textLength}`);

    let transcription = '';

    // Whisper only supports: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm
    const ext = fileName.toLowerCase().split('.').pop();
    const whisperSupported = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];
    const needsAudioExtraction = !whisperSupported.includes(ext) || fileSize > 25 * 1024 * 1024;

    try {
      let audioBuffer;

      if (needsAudioExtraction) {
        // Extract audio with ffmpeg (MOV, AVI, MKV, or files > 25MB)
        console.log(`Extracting audio with ffmpeg (format: ${ext}, size: ${(fileSize / 1024 / 1024).toFixed(1)}MB)...`);
        audioBuffer = await extractAudioFromBuffer(req.file.buffer, fileName);
        console.log(`Audio extracted: ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`);
      } else {
        // File is small enough and in a supported format - send directly
        audioBuffer = req.file.buffer;
        console.log('Video in supported format and <= 25MB, sending directly to Whisper...');
      }

      // Create a File-like object for the OpenAI API
      const audioFile = new File(
        [audioBuffer],
        needsAudioExtraction ? 'audio.mp3' : fileName,
        { type: needsAudioExtraction ? 'audio/mpeg' : (getContentTypeFromExt(fileName) || 'video/mp4') }
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
        const content = await generateContentFromImage(base64Frame, adIndex, category, objective, templateName, destType, textLength, campaignContext);

        return res.json({
          success: true,
          data: {
            headlines: content.headlines?.slice(0, 5) || [],
            descriptions: content.descriptions?.slice(0, 5) || [],
            linkDescriptions: content.linkDescriptions?.slice(0, 5) || [],
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
    const content = await generateContentFromText(transcription, adIndex, category, objective, templateName, destType, textLength, campaignContext);

    res.json({
      success: true,
      data: {
        headlines: content.headlines?.slice(0, 5) || [],
        descriptions: content.descriptions?.slice(0, 5) || [],
        linkDescriptions: content.linkDescriptions?.slice(0, 5) || [],
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
    const objective = req.body.objective || '';
    const templateName = req.body.templateName || '';
    const destType = req.body.destType || '';
    const textLength = req.body.textLength || 'medium';
    const campaignContext = req.body.campaignContext || '';
    const fileName = req.file.originalname || 'image.jpg';

    console.log(`Analyzing image: ${fileName} for ad index ${adIndex}, objective: ${objective}, dest: ${destType}, length: ${textLength}`);

    const base64Image = req.file.buffer.toString('base64');
    const content = await generateContentFromImage(base64Image, adIndex, category, objective, templateName, destType, textLength, campaignContext);

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

// POST /api/analyze-media-url - Download media from URL (server-side, no CORS) and analyze with AI
// Used for Meta library media where browser fetch fails due to CORS
app.post('/api/analyze-media-url', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ success: false, error: 'OpenAI no está configurado.' });
    }

    const { url, type, adIndex: adIndexStr, category, objective, templateName, destType, textLength: tl, campaignContext: cc } = req.body;
    const textLength = tl || 'medium';
    const campaignContext = cc || '';
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL requerida' });
    }

    const adIndex = parseInt(adIndexStr) || 0;
    const mediaType = type || 'image'; // 'image' or 'video'

    // Check ffmpeg availability for video processing
    if (mediaType === 'video' && !ffmpegPath) {
      return res.status(400).json({
        success: false,
        error: 'ffmpeg no disponible. El análisis de video requiere ffmpeg-static. Instala con: npm install ffmpeg-static'
      });
    }

    console.log(`Analyzing ${mediaType} from URL for ad ${adIndex}: ${url.substring(0, 100)}...`);

    // Download media from URL (server-side, avoids CORS)
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 120000, // 2 min
      maxContentLength: 200 * 1024 * 1024 // 200MB
    });
    const buffer = Buffer.from(response.data);
    console.log(`Downloaded ${mediaType}: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);

    if (mediaType === 'video') {
      // Video: transcribe audio with Whisper, then generate content
      let transcription = '';

      try {
        // Extract audio with ffmpeg (the buffer is a video file)
        const audioBuffer = await extractAudioFromBuffer(buffer, 'video.mp4');
        console.log(`Audio extracted: ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`);

        const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });
        const whisperResponse = await openai.audio.transcriptions.create({
          model: 'whisper-1',
          file: audioFile,
          language: 'es'
        });
        transcription = whisperResponse.text || '';
        console.log(`Transcription (${transcription.length} chars): ${transcription.substring(0, 200)}...`);
      } catch (whisperError) {
        console.warn('Whisper transcription failed for library video:', whisperError.message);
      }

      // If no meaningful speech, fall back to frame analysis
      if (transcription.length < 20) {
        console.log('No speech detected, falling back to frame analysis...');
        try {
          const frameBuffer = await extractFrameFromBuffer(buffer, 'video.mp4');
          const base64Frame = frameBuffer.toString('base64');
          const content = await generateContentFromImage(base64Frame, adIndex, category || '', objective || '', templateName || '', destType || '', textLength, campaignContext);
          return res.json({
            success: true,
            data: {
              headlines: content.headlines?.slice(0, 5) || [],
              descriptions: content.descriptions?.slice(0, 5) || [],
              ctas: content.ctas?.slice(0, 5) || [],
              method: 'vision-url'
            }
          });
        } catch (visionErr) {
          return res.status(500).json({ success: false, error: 'No se pudo analizar el video (sin audio ni frame)' });
        }
      }

      const content = await generateContentFromText(transcription, adIndex, category || '', objective || '', templateName || '', destType || '', textLength, campaignContext);
      return res.json({
        success: true,
        data: {
          headlines: content.headlines?.slice(0, 5) || [],
          descriptions: content.descriptions?.slice(0, 5) || [],
          ctas: content.ctas?.slice(0, 5) || [],
          transcription,
          method: 'whisper-url'
        }
      });

    } else {
      // Image: analyze with vision
      const base64Image = buffer.toString('base64');
      const content = await generateContentFromImage(base64Image, adIndex, category || '', objective || '', templateName || '', destType || '', textLength, campaignContext);
      return res.json({
        success: true,
        data: {
          headlines: content.headlines?.slice(0, 5) || [],
          descriptions: content.descriptions?.slice(0, 5) || [],
          ctas: content.ctas?.slice(0, 5) || [],
          method: 'vision-url'
        }
      });
    }

  } catch (error) {
    console.error('analyze-media-url error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Error analizando media desde URL'
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
