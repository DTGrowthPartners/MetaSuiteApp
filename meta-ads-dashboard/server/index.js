import express from 'express';
import cors from 'cors';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
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

// Verificar si faster-whisper está disponible (solo en Linux/VPS)
const WHISPER_PYTHON = process.env.WHISPER_PYTHON || '/home/ubuntu/whisper-env/bin/python3';
const WHISPER_SCRIPT = process.env.WHISPER_SCRIPT || '/home/ubuntu/whisper_transcribe.py';
let whisperAvailable = false;
try {
  whisperAvailable = fs.existsSync(WHISPER_PYTHON) && fs.existsSync(WHISPER_SCRIPT);
  if (whisperAvailable) console.log('faster-whisper disponible ✓');
  else console.log('faster-whisper no disponible — usando análisis visual de frames');
} catch (e) {}

const app = express();

// Configurar multer con almacenamiento en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB máximo
});
const PORT = process.env.PORT || 3002;

// Token de acceso con permisos: pages_show_list, ads_management, ads_read, business_management, pages_read_engagement
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'TU_META_ACCESS_TOKEN_AQUI';

// Anthropic (Claude) Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || null;
let anthropic = null;

if (ANTHROPIC_API_KEY) {
  try {
    anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    console.log('Anthropic (Claude) API configurada correctamente');
  } catch (err) {
    console.error('ERROR al inicializar Anthropic:', err.message);
  }
} else {
  console.warn('ADVERTENCIA: ANTHROPIC_API_KEY no está configurada. Las funciones de IA (5+5+5 automático) no funcionarán.');
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

// ============================================
// LEGAL PAGES (required for Meta App Review)
// ============================================

const LEGAL_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.7; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 24px; }
    h1 { color: #a5b4fc; font-size: 2rem; margin-bottom: 8px; }
    h2 { color: #818cf8; font-size: 1.3rem; margin: 32px 0 12px; }
    .subtitle { color: #94a3b8; margin-bottom: 32px; }
    p, li { color: #cbd5e1; margin-bottom: 12px; }
    ul { padding-left: 24px; }
    a { color: #6366f1; }
    .logo { font-size: 1.5rem; font-weight: 700; color: #6366f1; margin-bottom: 24px; display: block; }
    .card { background: #1e293b; border-radius: 12px; padding: 32px; margin: 24px 0; border: 1px solid #334155; }
    .updated { color: #64748b; font-size: 0.85rem; }
  </style>
`;

// Privacy Policy
app.get('/api/legal/privacy', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Política de Privacidad - MetaSuite by DT Growth Partners</title>${LEGAL_STYLE}</head><body>
  <div class="container">
    <span class="logo">MetaSuite</span>
    <h1>Política de Privacidad</h1>
    <p class="subtitle">Última actualización: 30 de marzo de 2026</p>

    <div class="card">
      <h2>1. Información que recopilamos</h2>
      <p>MetaSuite ("la App"), desarrollada por DT Growth Partners, accede a los siguientes datos a través de la API de Meta (Facebook):</p>
      <ul>
        <li><strong>Información de perfil público:</strong> Nombre y foto de perfil de Facebook para identificar al usuario dentro de la App.</li>
        <li><strong>Páginas de Facebook:</strong> Lista de páginas que administras para vincular campañas publicitarias.</li>
        <li><strong>Cuentas publicitarias:</strong> Información de tus cuentas de anuncios (nombre, ID, métricas de rendimiento) para gestionar campañas.</li>
        <li><strong>Datos de anuncios:</strong> Métricas de campañas (impresiones, clics, conversiones, costos) para mostrar reportes de rendimiento.</li>
        <li><strong>Activos comerciales:</strong> Acceso a Business Managers vinculados para administrar recursos publicitarios.</li>
        <li><strong>Cuentas de Instagram:</strong> Cuentas de Instagram vinculadas a tus páginas para crear anuncios en Instagram.</li>
      </ul>
    </div>

    <div class="card">
      <h2>2. Cómo usamos la información</h2>
      <p>Usamos los datos exclusivamente para:</p>
      <ul>
        <li>Permitirte crear, editar y gestionar campañas publicitarias en Meta.</li>
        <li>Mostrar reportes y métricas de rendimiento de tus anuncios.</li>
        <li>Generar contenido publicitario (textos e imágenes) mediante inteligencia artificial.</li>
        <li>Administrar tus activos publicitarios (páginas, cuentas, audiencias).</li>
      </ul>
      <p><strong>No vendemos, compartimos ni transferimos tus datos a terceros.</strong></p>
    </div>

    <div class="card">
      <h2>3. Almacenamiento de datos</h2>
      <ul>
        <li>Los tokens de acceso se almacenan <strong>únicamente en el navegador del usuario</strong> (localStorage) y nunca en nuestros servidores.</li>
        <li>No mantenemos bases de datos con información personal de los usuarios.</li>
        <li>Los datos de campañas y métricas se obtienen en tiempo real desde la API de Meta y no se almacenan permanentemente.</li>
        <li>Los reportes generados se cachean temporalmente (máximo 24 horas) para mejorar la velocidad de carga.</li>
      </ul>
    </div>

    <div class="card">
      <h2>4. Compartición de datos</h2>
      <p>No compartimos datos personales con terceros. Los únicos servicios externos que procesan información son:</p>
      <ul>
        <li><strong>API de Meta (Facebook):</strong> Para ejecutar las operaciones publicitarias solicitadas por el usuario.</li>
        <li><strong>API de Anthropic (Claude AI):</strong> Para generar textos publicitarios. Solo se envían las imágenes/videos del anuncio y el contexto del negocio proporcionado por el usuario. No se envían datos personales.</li>
      </ul>
    </div>

    <div class="card">
      <h2>5. Eliminación de datos</h2>
      <p>Puedes solicitar la eliminación de tus datos en cualquier momento:</p>
      <ul>
        <li>Cerrando sesión en la App (esto elimina todos los tokens almacenados en tu navegador).</li>
        <li>Revocando el acceso de la App desde tu <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank">Configuración de Facebook → Aplicaciones y sitios web</a>.</li>
        <li>Enviando una solicitud a: <strong>contacto@dtgrowthpartners.com</strong></li>
      </ul>
      <p>Para más detalles, visita nuestra <a href="/data-deletion">página de eliminación de datos</a>.</p>
    </div>

    <div class="card">
      <h2>6. Seguridad</h2>
      <ul>
        <li>Toda la comunicación se realiza a través de HTTPS.</li>
        <li>Los tokens de acceso nunca se transmiten ni almacenan en servidores propios.</li>
        <li>El acceso a la API de Meta utiliza los protocolos estándar de OAuth 2.0.</li>
      </ul>
    </div>

    <div class="card">
      <h2>7. Contacto</h2>
      <p>Si tienes preguntas sobre esta política de privacidad, contáctanos:</p>
      <ul>
        <li><strong>Empresa:</strong> DT Growth Partners</li>
        <li><strong>Responsable:</strong> Edgardo Meza</li>
        <li><strong>Email:</strong> contacto@dtgrowthpartners.com</li>
        <li><strong>Ubicación:</strong> Cartagena, Colombia</li>
      </ul>
    </div>

    <p class="updated">Esta política puede actualizarse periódicamente. La fecha de última actualización se indica al inicio del documento.</p>
  </div></body></html>`);
});

// Terms of Service
app.get('/api/legal/terms', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Términos de Servicio - MetaSuite by DT Growth Partners</title>${LEGAL_STYLE}</head><body>
  <div class="container">
    <span class="logo">MetaSuite</span>
    <h1>Términos de Servicio</h1>
    <p class="subtitle">Última actualización: 30 de marzo de 2026</p>

    <div class="card">
      <h2>1. Aceptación de los términos</h2>
      <p>Al usar MetaSuite ("la App"), aceptas estos términos de servicio. Si no estás de acuerdo, no uses la App.</p>
    </div>

    <div class="card">
      <h2>2. Descripción del servicio</h2>
      <p>MetaSuite es un dashboard de gestión de campañas publicitarias desarrollado por DT Growth Partners que permite:</p>
      <ul>
        <li>Crear, editar y gestionar campañas publicitarias en Meta (Facebook e Instagram).</li>
        <li>Visualizar métricas y reportes de rendimiento de anuncios.</li>
        <li>Generar contenido publicitario mediante inteligencia artificial.</li>
        <li>Administrar activos comerciales (páginas, cuentas publicitarias, audiencias).</li>
      </ul>
    </div>

    <div class="card">
      <h2>3. Requisitos de uso</h2>
      <ul>
        <li>Debes tener una cuenta activa de Facebook con acceso a cuentas publicitarias.</li>
        <li>Debes autorizar la App para acceder a tus datos publicitarios mediante Facebook Login.</li>
        <li>Eres responsable de todas las campañas y anuncios creados a través de la App.</li>
        <li>Debes cumplir con las <a href="https://www.facebook.com/policies/ads/" target="_blank">Políticas de Publicidad de Meta</a>.</li>
      </ul>
    </div>

    <div class="card">
      <h2>4. Responsabilidades del usuario</h2>
      <ul>
        <li>Eres el único responsable del contenido de tus anuncios y campañas.</li>
        <li>No debes usar la App para crear anuncios que violen las políticas de Meta o las leyes aplicables.</li>
        <li>Eres responsable de mantener la seguridad de tu cuenta de Facebook y token de acceso.</li>
        <li>Los presupuestos y gastos publicitarios son tu responsabilidad directa con Meta.</li>
      </ul>
    </div>

    <div class="card">
      <h2>5. Contenido generado por IA</h2>
      <p>La App utiliza inteligencia artificial para generar sugerencias de textos publicitarios. Este contenido:</p>
      <ul>
        <li>Son sugerencias que el usuario debe revisar y aprobar antes de publicar.</li>
        <li>DT Growth Partners no se responsabiliza por el contenido generado por IA.</li>
        <li>El usuario es responsable de verificar que el contenido cumple con las políticas de Meta.</li>
      </ul>
    </div>

    <div class="card">
      <h2>6. Limitación de responsabilidad</h2>
      <p>DT Growth Partners no se responsabiliza por:</p>
      <ul>
        <li>Interrupciones del servicio de Meta o cambios en su API.</li>
        <li>Resultados de las campañas publicitarias.</li>
        <li>Pérdida de datos debido a cambios en las políticas de Meta.</li>
        <li>Suspensión o restricción de cuentas publicitarias por parte de Meta.</li>
      </ul>
    </div>

    <div class="card">
      <h2>7. Contacto</h2>
      <p><strong>DT Growth Partners</strong><br>Edgardo Meza<br>contacto@dtgrowthpartners.com<br>Cartagena, Colombia</p>
    </div>
  </div></body></html>`);
});

// Data Deletion Callback & Instructions Page
app.get('/api/legal/data-deletion', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Eliminación de Datos - MetaSuite by DT Growth Partners</title>${LEGAL_STYLE}</head><body>
  <div class="container">
    <span class="logo">MetaSuite</span>
    <h1>Eliminación de Datos de Usuario</h1>
    <p class="subtitle">Cómo eliminar tus datos de MetaSuite</p>

    <div class="card">
      <h2>¿Qué datos almacena MetaSuite?</h2>
      <p>MetaSuite almacena datos mínimos, exclusivamente en tu navegador:</p>
      <ul>
        <li>Token de acceso de Facebook (en localStorage de tu navegador).</li>
        <li>Nombre y foto de perfil (para mostrar en la interfaz).</li>
      </ul>
      <p><strong>No almacenamos datos personales en nuestros servidores.</strong> Todos los datos de campañas y métricas se obtienen en tiempo real desde Meta.</p>
    </div>

    <div class="card">
      <h2>Cómo eliminar tus datos</h2>
      <p><strong>Opción 1:</strong> Cierra sesión en MetaSuite. Esto elimina inmediatamente todos los datos almacenados en tu navegador.</p>
      <p><strong>Opción 2:</strong> Revoca el acceso desde Facebook:</p>
      <ol>
        <li>Ve a <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank">Configuración de Facebook → Aplicaciones y sitios web</a>.</li>
        <li>Busca "ApiAppSuite" o "MetaSuite".</li>
        <li>Haz clic en "Eliminar" para revocar todos los permisos.</li>
      </ol>
      <p><strong>Opción 3:</strong> Envía un email a <strong>contacto@dtgrowthpartners.com</strong> solicitando la eliminación de tus datos.</p>
    </div>

    <div class="card">
      <h2>Confirmación</h2>
      <p>Dado que no almacenamos datos personales en nuestros servidores, la eliminación es inmediata al cerrar sesión o revocar permisos. No hay datos pendientes de borrar en nuestro lado.</p>
    </div>
  </div></body></html>`);
});

// Data Deletion Callback (POST) — Meta sends this when a user removes the app
app.post('/api/legal/data-deletion', (req, res) => {
  const { signed_request } = req.body;
  console.log('Data deletion request received from Meta:', signed_request ? 'signed_request present' : 'no signed_request');

  // Meta requires a JSON response with a confirmation URL and a confirmation code
  const confirmationCode = `DEL-${Date.now()}`;
  res.json({
    url: `https://metasuite.dtgrowthpartners.com/data-deletion?code=${confirmationCode}`,
    confirmation_code: confirmationCode
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Meta Ads Dashboard API',
    anthropicConfigured: !!anthropic
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

// Generar contenido 5+5+5 con Claude (Anthropic)
app.post('/api/generate-content', async (req, res) => {
  try {
    if (!anthropic) {
      return res.status(503).json({
        success: false,
        error: 'Anthropic no está configurado. Configura ANTHROPIC_API_KEY en las variables de entorno del servidor.'
      });
    }

    const { prompt, category } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'El prompt es requerido'
      });
    }

    console.log('Generating content with Claude for:', prompt.substring(0, 100) + '...');

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

    const completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseText = completion.content[0].text;
    console.log('Claude response:', responseText);

    // Parsear el JSON de la respuesta
    let generatedContent;
    try {
      // Limpiar posibles caracteres extra
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      generatedContent = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
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
        linkDescriptions: (() => { const ld = (generatedContent.linkDescriptions || []).filter(d => d && d.trim()).slice(0, 5); while (ld.length < 5) ld.push(''); return ld; })(),
        ctas: generatedContent.ctas.slice(0, 5),
        suggestedBudget: generatedContent.suggestedBudget || 50000,
        targetAudience: generatedContent.targetAudience || ''
      }
    });

  } catch (error) {
    console.error('Claude error:', error.response?.data || error.message);
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

// Helper: Transcribe audio from video buffer using faster-whisper
async function transcribeVideoAudio(videoBuffer, filename) {
  if (!whisperAvailable || !ffmpegPath) return null;
  const tmpDir = os.tmpdir();
  const ts = Date.now();
  const inputPath = path.join(tmpDir, `whisper_vid_${ts}_${filename}`);
  const audioPath = path.join(tmpDir, `whisper_aud_${ts}.wav`);
  try {
    fs.writeFileSync(inputPath, videoBuffer);
    // Extract mono 16kHz WAV audio (Whisper optimal format)
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(audioPath)
        .audioChannels(1)
        .audioFrequency(16000)
        .audioCodec('pcm_s16le')
        .noVideo()
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    // Transcribe with faster-whisper Python script
    const { execFile } = await import('child_process');
    const transcript = await new Promise((resolve, reject) => {
      execFile(WHISPER_PYTHON, [WHISPER_SCRIPT, audioPath, 'es'], { timeout: 180000 }, (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve(stdout.trim());
      });
    });
    return transcript || null;
  } catch (e) {
    console.warn(`Whisper transcription failed (${filename}): ${e.message}`);
    return null;
  } finally {
    try { fs.unlinkSync(inputPath); } catch (e) {}
    try { fs.unlinkSync(audioPath); } catch (e) {}
  }
}

// Helper: Extract multiple frames from video buffer at different timestamps
async function extractMultipleFramesFromBuffer(videoBuffer, filename, count = 3) {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `mframe_input_${Date.now()}_${filename}`);
  const frames = [];
  try {
    fs.writeFileSync(inputPath, videoBuffer);
    const duration = await new Promise((resolve) => {
      ffmpeg.ffprobe(inputPath, (err, meta) => {
        resolve(err ? 10 : (meta?.format?.duration || 10));
      });
    });
    const timestamps = Array.from({ length: count }, (_, i) => Math.max(0.5, duration * ((i + 1) / (count + 1))));
    for (const ts of timestamps) {
      const outputPath = path.join(tmpDir, `mframe_${Date.now()}_${ts.toFixed(0)}.jpg`);
      try {
        await new Promise((resolve, reject) => {
          ffmpeg(inputPath)
            .screenshots({ count: 1, timemarks: [ts.toFixed(1)], filename: path.basename(outputPath), folder: path.dirname(outputPath), size: '640x?' })
            .on('end', resolve).on('error', reject);
        });
        if (fs.existsSync(outputPath)) {
          frames.push(fs.readFileSync(outputPath).toString('base64'));
          try { fs.unlinkSync(outputPath); } catch (e) { /* ignore */ }
        }
      } catch (e) { /* skip frame */ }
    }
  } finally {
    try { fs.unlinkSync(inputPath); } catch (e) { /* ignore */ }
  }
  return frames;
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

  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    temperature: Math.min(0.7 + (adIndex * 0.05), 1.0),
    max_tokens: 2000
  });

  const responseText = completion.content[0].text;
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
  // Ensure exactly 5 linkDescriptions — must be SHORT and DIFFERENT from descriptions
  parsed.linkDescriptions = (parsed.linkDescriptions || []).filter(d => d && d.trim());
  // If linkDescriptions are too long (>40 chars avg), they're probably duplicates of descriptions — truncate headlines
  const avgLDLen = parsed.linkDescriptions.length > 0
    ? parsed.linkDescriptions.reduce((s, d) => s + d.length, 0) / parsed.linkDescriptions.length
    : 0;
  if (avgLDLen > 40 && parsed.headlines) {
    console.log(`linkDescriptions too long (avg ${Math.round(avgLDLen)} chars), using truncated headlines instead`);
    parsed.linkDescriptions = (parsed.headlines || []).map(h => h.substring(0, 30));
  }
  while (parsed.linkDescriptions.length < 5) parsed.linkDescriptions.push('');
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

  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    system: `Eres un experto copywriter de Facebook/Instagram Ads con años de experiencia creando campañas virales y de alto rendimiento.

${ctx.focus}

REGLAS ESTRICTAS:
- TÍTULOS (headlines): ${len.headlineRule} Usa MÁXIMO 1 emoji por título (al inicio o final). Deben generar curiosidad o urgencia.
- DESCRIPCIONES (texto principal): ${len.descRule} Usa MÁXIMO 1 emoji por oración para separar ideas. NO llenes de emojis, sé profesional.
- Todo en español
- MÁXIMO 1 emoji por elemento (título o frase dentro de descripción). Menos es más. Si no aporta, no pongas emoji.
- NO uses frases genéricas vacías. Sé MUY ESPECÍFICO sobre el producto/servicio de la imagen
- Responde SOLO en JSON válido, sin markdown`,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64Image }
          },
          {
            type: 'text',
            text: `Analiza esta imagen publicitaria y genera contenido para un anuncio de Facebook Ads.

${category ? `Categoría del negocio: ${category}` : ''}
${templateName ? `Tipo de campaña: ${templateName}` : ''}
${campaignContext ? `\nCONTEXTO DE LA CAMPAÑA (proporcionado por el anunciante, PRIORIZA esta información):\n"${campaignContext}"\n` : ''}
Instrucción de ángulo: ${angle}

Genera exactamente en JSON estos 4 campos DIFERENTES entre sí:
- "descriptions": 5 TEXTOS PRINCIPALES largos y persuasivos (${len.descMin}-${len.descMax} chars). Son el cuerpo del anuncio.
- "headlines": 5 TÍTULOS cortos y llamativos (máx ${len.headlineMax} chars). Van en negrita.
- "linkDescriptions": 5 FRASES MUY CORTAS (máx 25 chars cada una) que aparecen debajo del título. Ejemplos: "Ver ofertas", "Envío gratis", "Solo hoy", "Agenda tu cita", "Descúbrelo aquí". NO deben parecerse a descriptions.
- "ctas": 5 CTAs variados de esta lista: ${ctx.ctas}

⚠️ linkDescriptions DEBEN ser COMPLETAMENTE DIFERENTES a descriptions. Son frases de 2-4 palabras, NO párrafos.

{
  "descriptions": ["texto principal largo y persuasivo...", "otro texto principal...", "...", "...", "..."],
  "headlines": ["título corto", "título", "título", "título", "título"],
  "linkDescriptions": ["frase corta", "otra frase", "detalle", "beneficio", "acción"],
  "ctas": ["CTA1", "CTA2", "CTA3", "CTA4", "CTA5"]
}

Máximo 1 emoji por título y 1 emoji por oración en descripciones. No abuses de emojis.`
          }
        ]
      }
    ],
    temperature: Math.min(0.7 + (adIndex * 0.05), 1.0),
    max_tokens: 2000
  });

  const responseText = completion.content[0].text;
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
  // Ensure exactly 5 linkDescriptions — must be SHORT and DIFFERENT from descriptions
  parsed.linkDescriptions = (parsed.linkDescriptions || []).filter(d => d && d.trim());
  // If linkDescriptions are too long (>40 chars avg), they're probably duplicates of descriptions — truncate headlines
  const avgLDLen = parsed.linkDescriptions.length > 0
    ? parsed.linkDescriptions.reduce((s, d) => s + d.length, 0) / parsed.linkDescriptions.length
    : 0;
  if (avgLDLen > 40 && parsed.headlines) {
    console.log(`linkDescriptions too long (avg ${Math.round(avgLDLen)} chars), using truncated headlines instead`);
    parsed.linkDescriptions = (parsed.headlines || []).map(h => h.substring(0, 30));
  }
  while (parsed.linkDescriptions.length < 5) parsed.linkDescriptions.push('');
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

    if (!anthropic) {
      return res.status(503).json({
        success: false,
        error: 'Anthropic no está configurado. Configura ANTHROPIC_API_KEY en las variables de entorno del servidor para habilitar análisis de video.'
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
    // Claude no soporta transcripción de audio — usar análisis visual del frame
    console.log('Analyzing video via frame extraction (Claude vision)...');
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
          method: 'vision'
        }
      });
    } catch (visionError) {
      console.error('Video frame analysis failed:', visionError.message);
      return res.status(500).json({
        success: false,
        error: 'No se pudo analizar el video',
        details: visionError.message
      });
    }

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
    if (!anthropic) {
      return res.status(503).json({
        success: false,
        error: 'Anthropic no está configurado. Configura ANTHROPIC_API_KEY en las variables de entorno del servidor para habilitar análisis de imagen.'
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
        linkDescriptions: content.linkDescriptions?.slice(0, 5) || [],
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
    if (!anthropic) {
      return res.status(503).json({ success: false, error: 'Anthropic no está configurado.' });
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
      // Claude no soporta audio — usar análisis visual del frame
      console.log('Analyzing library video via frame extraction (Claude vision)...');
      try {
        const frameBuffer = await extractFrameFromBuffer(buffer, 'video.mp4');
        const base64Frame = frameBuffer.toString('base64');
        const content = await generateContentFromImage(base64Frame, adIndex, category || '', objective || '', templateName || '', destType || '', textLength, campaignContext);
        return res.json({
          success: true,
          data: {
            headlines: content.headlines?.slice(0, 5) || [],
            descriptions: content.descriptions?.slice(0, 5) || [],
            linkDescriptions: content.linkDescriptions?.slice(0, 5) || [],
            ctas: content.ctas?.slice(0, 5) || [],
            method: 'vision-url'
          }
        });
      } catch (visionErr) {
        return res.status(500).json({ success: false, error: 'No se pudo analizar el video' });
      }

    } else {
      // Image: analyze with vision
      const base64Image = buffer.toString('base64');
      const content = await generateContentFromImage(base64Image, adIndex, category || '', objective || '', templateName || '', destType || '', textLength, campaignContext);
      return res.json({
        success: true,
        data: {
          headlines: content.headlines?.slice(0, 5) || [],
          descriptions: content.descriptions?.slice(0, 5) || [],
          linkDescriptions: content.linkDescriptions?.slice(0, 5) || [],
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

// POST /api/analyze-media-url-batch - Analyze multiple media items (images + videos) for flexible ad groups
// Images → visual analysis; Videos with sourceUrl → multiple frame extraction (3 frames per video)
app.post('/api/analyze-media-url-batch', async (req, res) => {
  try {
    if (!anthropic) {
      return res.status(503).json({ success: false, error: 'Anthropic no está configurado.' });
    }
    const { mediaItems, adIndex: adIndexStr, category, objective, templateName, destType, textLength: tl, campaignContext: cc } = req.body;
    if (!mediaItems || !Array.isArray(mediaItems) || mediaItems.length === 0) {
      return res.status(400).json({ success: false, error: 'Se requiere array de mediaItems' });
    }
    const adIndex = parseInt(adIndexStr) || 0;
    const textLength = tl || 'medium';
    const campaignContext = cc || '';

    const itemsToProcess = mediaItems.slice(0, 6);
    console.log(`Batch analyzing ${itemsToProcess.length} media items (group ${adIndex})...`);

    const base64Frames = [];
    const videoTitles = [];
    const transcripts = [];

    for (const item of itemsToProcess) {
      if (item.type === 'video' && item.sourceUrl) {
        // Download full video → transcribe audio with Whisper + extract visual frames
        try {
          console.log(`Downloading video: ${item.sourceUrl.substring(0, 60)}...`);
          const vidResponse = await axios.get(item.sourceUrl, {
            responseType: 'arraybuffer', timeout: 90000, maxContentLength: 300 * 1024 * 1024
          });
          const vidBuffer = Buffer.from(vidResponse.data);
          const sizeMB = (vidBuffer.length / 1024 / 1024).toFixed(1);
          console.log(`Video ${sizeMB}MB — transcribing + extracting frames...`);

          // Run Whisper transcription and frame extraction in parallel
          const [transcript, frames] = await Promise.all([
            transcribeVideoAudio(vidBuffer, item.name || 'video.mp4'),
            ffmpegPath ? extractMultipleFramesFromBuffer(vidBuffer, item.name || 'video.mp4', 2) : Promise.resolve([])
          ]);

          if (transcript) {
            console.log(`Transcript (${transcript.length} chars): ${transcript.substring(0, 80)}...`);
            transcripts.push({ name: item.name || 'video', text: transcript });
          }
          if (frames.length > 0) {
            base64Frames.push(...frames);
            console.log(`Extracted ${frames.length} frames from video`);
          } else if (!transcript) {
            // No transcript and no frames — fall back to thumbnail
            const thumbUrl = item.thumbnailUrl || item.url;
            if (thumbUrl) {
              const tr = await axios.get(thumbUrl, { responseType: 'arraybuffer', timeout: 15000 });
              base64Frames.push(Buffer.from(tr.data).toString('base64'));
            }
          }
          if (item.name) videoTitles.push(item.name.replace(/\.[^.]+$/, ''));
        } catch (vidErr) {
          console.warn(`Video processing failed (${item.name}): ${vidErr.message} — using thumbnail fallback`);
          const thumbUrl = item.thumbnailUrl || item.url;
          if (thumbUrl) {
            try {
              const tr = await axios.get(thumbUrl, { responseType: 'arraybuffer', timeout: 15000 });
              base64Frames.push(Buffer.from(tr.data).toString('base64'));
            } catch (e) { /* skip */ }
          }
        }
      } else {
        // Image or video without sourceUrl → use image/thumbnail URL
        const imgUrl = item.url || item.thumbnailUrl;
        if (imgUrl) {
          try {
            const ir = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000, maxContentLength: 20 * 1024 * 1024 });
            base64Frames.push(Buffer.from(ir.data).toString('base64'));
          } catch (dlErr) {
            console.warn(`Image download failed (${item.name}): ${dlErr.message}`);
          }
        }
      }
    }

    if (base64Frames.length === 0 && transcripts.length === 0) {
      return res.status(400).json({ success: false, error: 'No se pudieron procesar los medios' });
    }

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

    const businessContext = campaignContext
      ? `⚠️ CONTEXTO DEL NEGOCIO (OBLIGATORIO — basa el copy en esto, no en lo que parezcan las imágenes):\n"${campaignContext}"\n\n`
      : '';
    const videoCtx = videoTitles.length > 0 ? `Videos analizados: ${videoTitles.join(', ')}\n` : '';

    // Build transcript context if any
    const transcriptCtx = transcripts.length > 0
      ? `\n🎙️ TRANSCRIPCIÓN DE AUDIO (lo que se dice en el/los videos):\n${transcripts.map(t => `"${t.text}"`).join('\n')}\n`
      : '';

    const hasVisual = base64Frames.length > 0;
    const framesDesc = hasVisual
      ? (base64Frames.length > 1
        ? `estas ${base64Frames.length} imágenes/frames del anuncio flexible (${itemsToProcess.length} elemento(s))`
        : 'esta imagen/frame')
      : null;

    const framesToSend = base64Frames.slice(0, 8);
    const msgContent = framesToSend.map(b64 => ({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: b64 }
    }));
    const analysisDesc = hasVisual && transcripts.length > 0
      ? `el siguiente material del anuncio flexible (${itemsToProcess.length} elemento(s)):`
      : hasVisual
        ? `${framesDesc}:`
        : 'el siguiente audio transcrito:';

    msgContent.push({
      type: 'text',
      text: `${businessContext}${videoCtx}${transcriptCtx}Analiza ${analysisDesc} y genera contenido para un anuncio de Facebook Ads.

${templateName ? `Tipo de campaña: ${templateName}` : ''}
Instrucción de ángulo: ${angle}

IMPORTANTE:${transcripts.length > 0 ? '\n- La transcripción de audio muestra EXACTAMENTE lo que se comunica en el video — úsala como fuente principal del mensaje del anuncio.' : ''}
- Si hay contexto del negocio, el copy DEBE ser 100% sobre ese negocio.${hasVisual ? '\n- Las imágenes muestran el contenido visual del anuncio — úsalas para entender el estilo.' : ''}
- El tipo de negocio lo define el contexto textual, no las imágenes.

Genera exactamente en JSON estos 4 campos DIFERENTES entre sí:
- "descriptions": 5 TEXTOS PRINCIPALES largos y persuasivos (${len.descMin}-${len.descMax} chars). Son el cuerpo del anuncio.
- "headlines": 5 TÍTULOS cortos y llamativos (máx ${len.headlineMax} chars). Van en negrita.
- "linkDescriptions": 5 FRASES MUY CORTAS (máx 25 chars cada una) que aparecen debajo del título. Ejemplos: "Ver ofertas", "Envío gratis", "Solo hoy", "Agenda tu cita", "Descúbrelo aquí". NO deben parecerse a descriptions.
- "ctas": 5 CTAs variados de esta lista: ${ctx.ctas}

⚠️ linkDescriptions DEBEN ser COMPLETAMENTE DIFERENTES a descriptions. Son frases de 2-4 palabras, NO párrafos.

{
  "descriptions": ["texto principal largo y persuasivo...", "otro texto principal...", "...", "...", "..."],
  "headlines": ["título corto", "título", "título", "título", "título"],
  "linkDescriptions": ["frase corta", "otra frase", "detalle", "beneficio", "acción"],
  "ctas": ["CTA1", "CTA2", "CTA3", "CTA4", "CTA5"]
}

Máximo 1 emoji por elemento.`
    });

    const completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      system: `Eres un experto copywriter de Facebook/Instagram Ads.\n\n${ctx.focus}\n\nREGLAS:\n- TÍTULOS: ${len.headlineRule}\n- DESCRIPCIONES: ${len.descRule}\n- Todo en español\n- MÁXIMO 1 emoji por elemento\n- Si hay contexto del negocio, ÚSALO — NO inventes un tipo de negocio diferente por las imágenes\n- Responde SOLO en JSON válido, sin markdown`,
      messages: [{ role: 'user', content: msgContent }],
      temperature: Math.min(0.7 + (adIndex * 0.05), 1.0),
      max_tokens: 2000
    });

    const responseText = completion.content[0].text;
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const fallbackCtas = [...ctx.preferredCtas, 'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP'];
    if (!parsed.ctas || parsed.ctas.length < 5) {
      parsed.ctas = parsed.ctas || [];
      while (parsed.ctas.length < 5) {
        const next = fallbackCtas.find(c => !parsed.ctas.includes(c)) || 'LEARN_MORE';
        parsed.ctas.push(next);
      }
    }
    // Ensure linkDescriptions are SHORT and DIFFERENT from descriptions
    parsed.linkDescriptions = (parsed.linkDescriptions || []).filter(d => d && d.trim());
    const batchAvgLDLen = parsed.linkDescriptions.length > 0
      ? parsed.linkDescriptions.reduce((s, d) => s + d.length, 0) / parsed.linkDescriptions.length
      : 0;
    if (batchAvgLDLen > 40 && parsed.headlines) {
      console.log(`Batch: linkDescriptions too long (avg ${Math.round(batchAvgLDLen)} chars), using truncated headlines`);
      parsed.linkDescriptions = (parsed.headlines || []).map(h => h.substring(0, 30));
    }
    while (parsed.linkDescriptions.length < 5) parsed.linkDescriptions.push('');

    const method = transcripts.length > 0 && framesToSend.length > 0 ? 'whisper+vision' : transcripts.length > 0 ? 'whisper' : 'vision-batch';
    console.log(`Batch done [${method}]: ${framesToSend.length} frames + ${transcripts.length} transcripts from ${itemsToProcess.length} items`);
    return res.json({ success: true, data: { ...parsed, method, mediaCount: framesToSend.length, transcriptCount: transcripts.length } });

  } catch (error) {
    console.error('analyze-media-url-batch error:', error.message);
    res.status(500).json({ success: false, error: error.message || 'Error analizando medios' });
  }
});

// ============================================
// REPORT SYSTEM — Vistas públicas por cuenta
// ============================================

// Mapeo de slugs a cuentas publicitarias
const REPORT_ACCOUNTS = {
  'eq-cartagena': {
    accountId: 'act_1604918750004319',
    name: 'EQ Cartagena',
    businessName: 'Equilibrio Clinic',
    locations: ['Castellana', 'Bocagrande'],
    resultMetric: 'conversations',
    resultLabel: 'Mensajes',
    // Patrones para categorizar campañas por tipo de servicio (orden importa: primera coincidencia gana)
    campaignTypePatterns: [
      { type: 'Depilación Láser', patterns: ['laser', 'láser', 'dep laser'], group: 'conversion' },
      { type: 'Tratamientos Faciales', patterns: ['facial', 'limpieza facial'], group: 'conversion' },
      { type: 'Tratamientos Corporales', patterns: ['corporal', 'relajación', 'relajacion', 'combo'], group: 'conversion' },
      { type: 'Ventas DM Instagram', patterns: ['dm ig', 'dm instagram', 'ventas dm'], group: 'conversion' },
      { type: 'Ventas WhatsApp', patterns: ['whatsapp', 'wsap', 'wahtsapp', 'waspp', 'clientes potenciales', 'ventas'], group: 'conversion' },
      { type: 'Reconocimiento', patterns: ['reconocimiento', 'true play', 'awareness'], group: 'awareness' },
      { type: 'Tráfico Web/Links', patterns: ['trafico', 'tráfico', 'traffic', 'perfil ig'], group: 'awareness' },
    ]
  },
  'acbfit': {
    accountId: 'act_1214099615878120',
    name: 'ACB Fit',
    businessName: 'ACB Fit',
    locations: [],
    resultMetric: 'conversations',
    resultLabel: 'Mensajes'
  },
  'dtgp': {
    accountId: 'act_781485172384812',
    name: 'DTGP Cartagena',
    businessName: 'DT Growth Partners',
    locations: [],
    resultMetric: 'conversations',
    resultLabel: 'Mensajes'
  },
  'tennis': {
    accountId: 'act_660842485358224',
    name: 'Tennis Cartagena',
    businessName: 'Tennis Cartagena',
    locations: [],
    resultMetric: 'conversations',
    resultLabel: 'Mensajes'
  },
  'autoexpress': {
    accountId: 'act_1243999697726589',
    name: 'Auto Express',
    businessName: 'Auto Express Detailing',
    locations: [],
    resultMetric: 'conversations',
    resultLabel: 'Mensajes'
  },
  'importaciones': {
    accountId: 'act_1365259718367004',
    name: 'Importaciones CTG',
    businessName: 'Importaciones CTG',
    locations: [],
    resultMetric: 'conversations',
    resultLabel: 'Mensajes'
  },
  'barbershop': {
    accountId: 'act_1480303013602887',
    name: 'Master Barber Shop',
    businessName: 'Master Barber Shop',
    locations: [],
    resultMetric: 'conversations',
    resultLabel: 'Mensajes'
  }
};

// Cache de reportes (se actualiza cada hora o a las 7am)
const reportCache = {};

// Helper: obtener fecha de ayer y hoy en formato YYYY-MM-DD (zona horaria Colombia UTC-5)
// Corte a las 7am: antes de las 7am, "ayer" es anteayer y "hoy" es ayer real
function getReportDates() {
  const now = new Date();
  // Ajustar a Colombia (UTC-5)
  const colombiaOffset = -5 * 60;
  const colombiaTime = new Date(now.getTime() + (colombiaOffset - now.getTimezoneOffset()) * 60000);
  const colombiaHour = colombiaTime.getHours();

  let todayDate, yesterdayDate;
  if (colombiaHour < 7) {
    // Antes de 7am: "hoy" = ayer real, "ayer" = anteayer real
    todayDate = new Date(colombiaTime.getTime() - 86400000);
    yesterdayDate = new Date(colombiaTime.getTime() - 2 * 86400000);
  } else {
    // 7am o después: normal
    todayDate = colombiaTime;
    yesterdayDate = new Date(colombiaTime.getTime() - 86400000);
  }

  const today = todayDate.toISOString().split('T')[0];
  const yesterday = yesterdayDate.toISOString().split('T')[0];
  return { yesterday, today, colombiaTime };
}

// Helper: obtener primer y último día de un mes relativo al actual (zona Colombia)
// offset: -1 = mes pasado, -2 = hace 2 meses, etc.
function getMonthRange(offset = -1) {
  const now = new Date();
  const colombiaOffset = -5 * 60;
  const colombiaTime = new Date(now.getTime() + (colombiaOffset - now.getTimezoneOffset()) * 60000);
  const y = colombiaTime.getFullYear();
  const m = colombiaTime.getMonth(); // mes actual (0-based)
  const firstDay = new Date(y, m + offset, 1);
  const lastDay = new Date(y, m + offset + 1, 0);
  const since = firstDay.toISOString().split('T')[0];
  const until = lastDay.toISOString().split('T')[0];
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const label = `${months[firstDay.getMonth()]} ${firstDay.getFullYear()}`;
  return { since, until, label };
}

function getLastMonthRange() { return getMonthRange(-1); }
function getMonthBeforeLastRange() { return getMonthRange(-2); }

// Helper: obtener insights a nivel de cuenta por rango de fechas (incluye campañas eliminadas/archivadas)
async function getAccountInsightsByCampaign(accountId, token, dateRange) {
  const insightsFields = 'campaign_id,campaign_name,spend,impressions,reach,actions,cost_per_action_type,inline_link_clicks,video_thruplay_watched_actions';
  const allResults = [];
  let url = `${META_API_BASE_URL}/${accountId}/insights`;
  let params = {
    access_token: token,
    fields: insightsFields,
    level: 'campaign',
    time_range: JSON.stringify({ since: dateRange.since, until: dateRange.until }),
    limit: 500
  };

  try {
    while (url) {
      const resp = await axios.get(url, { params });
      const data = resp.data.data || [];
      allResults.push(...data);
      url = resp.data.paging?.next || null;
      params = {};
    }
  } catch (e) {
    console.error('Error fetching account insights:', e.response?.data || e.message);
  }

  return allResults;
}

// Helper: obtener suma de reach a nivel de adset (más preciso que campaign-level)
async function getAdsetReachSum(accountId, token, dateRange) {
  let total = 0;
  let url = `${META_API_BASE_URL}/${accountId}/insights`;
  let params = {
    access_token: token,
    fields: 'reach',
    level: 'adset',
    time_range: JSON.stringify({ since: dateRange.since, until: dateRange.until }),
    limit: 500
  };
  try {
    while (url) {
      const resp = await axios.get(url, { params });
      for (const row of (resp.data.data || [])) total += parseInt(row.reach || 0);
      url = resp.data.paging?.next || null;
      params = {};
    }
  } catch (e) {
    console.error('Error fetching adset reach:', e.response?.data || e.message);
  }
  return total;
}

// Helper: construir mapa de insights por campaign_id
function buildInsightsMap(insightsArray) {
  const map = {};
  for (const ins of insightsArray) {
    map[ins.campaign_id] = ins;
  }
  return map;
}

// Helper: extraer métricas agregadas de un array de insights
function aggregateInsights(insightsArray) {
  let spend = 0, impressions = 0, reach = 0, conversations = 0, firstReplies = 0;
  for (const ins of insightsArray) {
    spend += parseFloat(ins.spend || 0);
    impressions += parseInt(ins.impressions || 0);
    reach += parseInt(ins.reach || 0);
    for (const a of (ins.actions || [])) {
      if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') conversations += parseInt(a.value || 0);
      if (a.action_type === 'onsite_conversion.messaging_first_reply') firstReplies += parseInt(a.value || 0);
    }
  }
  return { spend, impressions, reach, conversations, firstReplies };
}

// Helper: obtener campañas con insights por rango de fechas
async function getReportData(accountId, token) {
  const { yesterday, today } = getReportDates();
  const lastMonth = getLastMonthRange();
  const monthBeforeLast = getMonthBeforeLastRange();
  const normalizedId = normalizeAccountId(accountId);

  // Helper: ejecuta una promesa devolviendo `fallback` si lanza, para que un sub-fetch
  // fallido (cuenta sin permisos, sin campañas, deshabilitada) no rompa todo el reporte.
  const safe = async (fn, fallback, label) => {
    try { return await fn(); }
    catch (e) {
      console.warn(`getReportData[${normalizedId}] ${label} failed:`, e.response?.data?.error?.message || e.message);
      return fallback;
    }
  };

  // Obtener campañas activas y pausadas (para hoy/ayer)
  const campaigns = await safe(async () => {
    const resp = await axios.get(`${META_API_BASE_URL}/${normalizedId}/campaigns`, {
      params: {
        access_token: token,
        fields: 'id,name,status,objective,configured_status',
        filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED'] }]),
        limit: 100
      }
    });
    return resp.data.data || [];
  }, [], 'campaigns');

  const insightsFields = 'spend,impressions,reach,actions,cost_per_action_type,inline_link_clicks,video_thruplay_watched_actions';

  // Fetch ayer/hoy/meses a nivel de cuenta (insights agregados por campaña) — 6 calls totales
  // independientemente del número de campañas. Antes hacía 2N calls (una por campaña por día),
  // que en cuentas con muchas campañas saturaba el rate limit y disparaba timeouts del proxy
  // (nginx devolvía HTML 504, lo que rompía el frontend con "Unexpected token '<'").
  const [yesterdayInsightsByCampaign, todayInsightsByCampaign, lastMonthInsights, prevMonthInsights, adsetReachLastMonth, adsetReachPrevMonth, accountReachLastMonth, accountYesterdayInsights] = await Promise.all([
    safe(() => getAccountInsightsByCampaign(normalizedId, token, { since: yesterday, until: yesterday }), [], 'yesterdayByCampaign'),
    safe(() => getAccountInsightsByCampaign(normalizedId, token, { since: today, until: today }), [], 'todayByCampaign'),
    safe(() => getAccountInsightsByCampaign(normalizedId, token, lastMonth), [], 'lastMonthInsights'),
    safe(() => getAccountInsightsByCampaign(normalizedId, token, monthBeforeLast), [], 'prevMonthInsights'),
    safe(() => getAdsetReachSum(normalizedId, token, lastMonth), 0, 'adsetReachLastMonth'),
    safe(() => getAdsetReachSum(normalizedId, token, monthBeforeLast), 0, 'adsetReachPrevMonth'),
    safe(async () => {
      const resp = await axios.get(META_API_BASE_URL + '/' + normalizedId + '/insights', {
        params: { access_token: token, fields: 'reach', time_range: JSON.stringify({ since: lastMonth.since, until: lastMonth.until }) }
      });
      return parseInt(resp.data.data?.[0]?.reach || 0);
    }, 0, 'accountReachLastMonth'),
    safe(async () => {
      const resp = await axios.get(`${META_API_BASE_URL}/${normalizedId}/insights`, {
        params: { access_token: token, fields: 'reach,impressions', time_range: JSON.stringify({ since: yesterday, until: yesterday }) }
      });
      const d = resp.data.data?.[0] || {};
      return { reach: parseInt(d.reach || 0), impressions: parseInt(d.impressions || 0) };
    }, { reach: 0, impressions: 0 }, 'accountYesterdayInsights')
  ]);

  // Indexar insights de ayer/hoy por campaign_id (vienen agregados a nivel cuenta)
  const yesterdayMap = buildInsightsMap(yesterdayInsightsByCampaign);
  const todayMap = buildInsightsMap(todayInsightsByCampaign);

  // Mezclar insights con la lista de campañas conocidas
  const withInsights = campaigns.map(c => ({
    ...c,
    insightsYesterday: yesterdayMap[c.id] || {},
    insightsToday: todayMap[c.id] || {},
    insightsLastMonth: {},
    insightsMonthBeforeLast: {}
  }));

  // Asignar insightsLastMonth
  const lastMonthMap = buildInsightsMap(lastMonthInsights);
  for (const c of withInsights) {
    if (lastMonthMap[c.id]) {
      c.insightsLastMonth = lastMonthMap[c.id];
      delete lastMonthMap[c.id];
    }
  }
  // Campañas que solo existieron el mes pasado (eliminadas pero con gasto)
  for (const [campaignId, ins] of Object.entries(lastMonthMap)) {
    if (parseFloat(ins.spend || 0) > 0) {
      withInsights.push({
        id: campaignId,
        name: ins.campaign_name || `Campaña ${campaignId}`,
        status: 'DELETED', objective: '', configured_status: 'DELETED',
        insightsYesterday: yesterdayMap[campaignId] || {},
        insightsToday: todayMap[campaignId] || {},
        insightsLastMonth: ins, insightsMonthBeforeLast: {}
      });
    }
  }

  // Asignar insightsMonthBeforeLast
  const prevMonthMap = buildInsightsMap(prevMonthInsights);
  for (const c of withInsights) {
    if (prevMonthMap[c.id]) {
      c.insightsMonthBeforeLast = prevMonthMap[c.id];
    }
  }

  // Totales del mes anterior (para comparativa)
  const prevMonthTotals = aggregateInsights(prevMonthInsights);
  prevMonthTotals.adsetReach = adsetReachPrevMonth;

  const activeCampaigns = withInsights.filter(c =>
    parseFloat(c.insightsYesterday?.spend || 0) > 0 ||
    parseFloat(c.insightsToday?.spend || 0) > 0 ||
    parseFloat(c.insightsLastMonth?.spend || 0) > 0 ||
    c.status === 'ACTIVE'
  );

  return {
    campaigns: activeCampaigns,
    dateRange: {
      yesterday, today,
      lastMonth: { since: lastMonth.since, until: lastMonth.until, label: lastMonth.label },
      monthBeforeLast: { since: monthBeforeLast.since, until: monthBeforeLast.until, label: monthBeforeLast.label }
    },
    // Reach e impresiones de ayer a nivel de cuenta (deduplicado — cuentas únicas reales)
    accountReachYesterday: accountYesterdayInsights.reach,
    accountImpressionsYesterday: accountYesterdayInsights.impressions,
    adsetReachLastMonth: adsetReachLastMonth,
    accountReachLastMonth: accountReachLastMonth,
    prevMonthTotals,
    fetchedAt: new Date().toISOString(),
    totalCampaigns: activeCampaigns.length
  };
}

// Endpoint: obtener datos de reporte para una cuenta
// Helper: resolver accountConfig desde slug preconfigurado o desde act_xxx dinámico
function resolveAccountConfig(slug, query = {}) {
  if (REPORT_ACCOUNTS[slug]) return REPORT_ACCOUNTS[slug];
  // Slug dinámico: act_<id> usa info del query string para nombre/negocio
  if (typeof slug === 'string' && slug.startsWith('act_')) {
    return {
      accountId: slug,
      name: query.name || slug,
      businessName: query.business || query.businessName || '',
      locations: [],
      resultMetric: 'conversations',
      resultLabel: 'Mensajes'
    };
  }
  return null;
}

app.get('/api/report/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const accountConfig = resolveAccountConfig(slug, req.query);

    if (!accountConfig) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }

    // Usar token del servidor (.env) o del request
    const token = getToken(req);
    if (!token || token === 'TU_META_ACCESS_TOKEN_AQUI') {
      return res.status(401).json({ success: false, error: 'Token no configurado en el servidor' });
    }

    // Verificar cache (válido por 15 minutos)
    const cached = reportCache[slug];
    const cacheTTL = 15 * 60 * 1000;
    if (cached && (Date.now() - cached.timestamp < cacheTTL)) {
      return res.json({
        success: true,
        ...accountConfig,
        ...cached.data,
        cached: true
      });
    }

    // Fetch fresh data
    const data = await getReportData(accountConfig.accountId, token);
    reportCache[slug] = { data, timestamp: Date.now() };

    res.json({
      success: true,
      ...accountConfig,
      ...data,
      cached: false
    });
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message || 'Error interno';
    console.error(`Report error [${req.params.slug}]:`, errMsg);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: errMsg });
    }
  }
});

// Helper: generar HTML del informe PDF
function generatePdfHtml(accountConfig, data) {
  const { campaigns = [], dateRange, prevMonthTotals = {}, adsetReachLastMonth = 0, accountReachLastMonth = 0 } = data;
  const lastMonth = dateRange?.lastMonth || {};
  const active = campaigns.filter(c => parseFloat(c.insightsLastMonth?.spend || 0) > 0);
  const biz = accountConfig.businessName;
  const period = lastMonth.label || 'Mes';

  let totalSpend = 0, totalImp = 0, totalConv = 0, totalFirst = 0, totalClicks = 0;
  const rows = [];

  for (const c of active) {
    const ins = c.insightsLastMonth || {};
    const spend = parseFloat(ins.spend || 0);
    const imp = parseInt(ins.impressions || 0);
    const reach = parseInt(ins.reach || 0);
    let conv = 0, first = 0, clicks = 0, views = 0, thruplay = 0;
    for (const a of (ins.actions || [])) {
      if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') conv = parseInt(a.value);
      if (a.action_type === 'onsite_conversion.messaging_first_reply') first = parseInt(a.value);
      if (a.action_type === 'link_click') clicks = parseInt(a.value);
      if (a.action_type === 'video_view') views = parseInt(a.value);
    }
    thruplay = parseInt(ins.video_thruplay_watched_actions?.[0]?.value || 0);
    const nl = c.name.toLowerCase();
    let type = 'Mensajes', result = conv, cpr = conv > 0 ? spend / conv : 0;
    if (c.objective === 'OUTCOME_AWARENESS' || nl.includes('reconocimiento') || nl.includes('thruplay') || nl.includes('true play')) {
      type = 'Video'; result = thruplay || views; cpr = result > 0 ? spend / result : 0;
    } else if (c.objective === 'OUTCOME_TRAFFIC' || nl.includes('trafico') || nl.includes('perfil ig')) {
      type = 'Tráfico'; result = clicks; cpr = clicks > 0 ? spend / clicks : 0;
    } else if (conv === 0 && clicks > 0) {
      type = 'Clics'; result = clicks; cpr = clicks > 0 ? spend / clicks : 0;
    }
    totalSpend += spend; totalImp += imp;
    if (type === 'Mensajes') { totalConv += conv; totalFirst += first; }
    totalClicks += clicks;
    rows.push({ name: c.name, type, spend, result, cpr, reach, conv, first });
  }
  rows.sort((a, b) => b.spend - a.spend);

  const msgSpend = rows.filter(r => r.type === 'Mensajes').reduce((s, r) => s + r.spend, 0);
  const avgCPR = totalConv > 0 ? msgSpend / totalConv : 0;
  const msgPct = totalSpend > 0 ? Math.round(msgSpend / totalSpend * 100) : 0;
  const best = rows.filter(r => r.type === 'Mensajes' && r.conv > 0).sort((a, b) => a.cpr - b.cpr)[0];
  const bestVol = rows.filter(r => r.type === 'Mensajes').sort((a, b) => b.conv - a.conv)[0];
  const f = (n) => '$' + Math.round(n).toLocaleString('es-CO');
  const fc = (n) => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(n);

  const rowsHtml = rows.map(r => '<tr><td>' + r.name + '</td><td>' + r.type + '</td><td>' + f(r.spend) + '</td><td>' + (r.result > 0 ? (r.result >= 1000 ? fc(r.result) : r.result) : '—') + '</td><td>' + (r.cpr > 0 ? f(r.cpr) : '—') + '</td><td>' + fc(r.reach) + '</td></tr>').join('');

  const hdr = '<div style="background:#1a3a5c;color:#fff;padding:20px 40px;display:flex;justify-content:space-between;align-items:center"><div style="font-size:18px;font-weight:700;letter-spacing:1px"><span style="color:#5ba3d9">DT</span> GROWTH PARTNERS</div><div style="font-size:12px;color:#a0c4e8;text-align:right">' + biz + ' | ' + period + '</div></div>';

  return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe ' + biz + ' | ' + period + '</title>'
    + '<style>@page{size:A4;margin:20mm 15mm}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none}.page-break{page-break-before:always}}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Segoe UI,Arial,sans-serif;color:#333;line-height:1.6;background:#fff}'
    + '.stitle{font-size:22px;font-weight:700;color:#1a3a5c;border-bottom:3px solid #5ba3d9;padding-bottom:6px;margin:30px 40px 20px}.cnt{padding:0 40px}'
    + '.mg{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.mc{border:1px solid #e0e0e0;border-radius:8px;padding:16px;text-align:center}.mc.hl{background:#fff8e6;border-color:#f0c040}'
    + '.mv{font-size:26px;font-weight:700;color:#1a3a5c}.ml{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}'
    + '.st{font-size:13px;color:#555;line-height:1.8;margin:16px 0}.st strong{color:#333}'
    + 'table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}th{background:#1a3a5c;color:#fff;padding:10px 12px;text-align:left;font-size:12px}td{padding:10px 12px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f8f9fa}'
    + '.ic{background:#f0f7ff;border-left:4px solid #5ba3d9;padding:14px 18px;margin:12px 0;border-radius:0 8px 8px 0}.ic h4{color:#1a3a5c;font-size:14px;margin-bottom:6px}.ic p{font-size:13px;color:#555}.ic.yl{background:#fff8e6;border-color:#f0c040}'
    + '.rc{background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;padding:20px;margin:16px 0}.rc ol{padding-left:20px}.rc li{margin-bottom:10px;font-size:13px;color:#555}'
    + '.pb{position:fixed;top:20px;right:20px;background:#1a3a5c;color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:14px;z-index:1000}.pb:hover{background:#2a5a8c}'
    + '</style></head><body>'
    + '<button class="pb no-print" onclick="window.print()">Descargar PDF</button>'
    // PORTADA
    + '<div style="background:#1a3a5c;color:#fff;padding:20px 40px"><div style="font-size:18px;font-weight:700;letter-spacing:1px"><span style="color:#5ba3d9">DT</span> GROWTH PARTNERS</div></div>'
    + '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;text-align:center">'
    + '<h1 style="font-size:36px;color:#1a3a5c;margin-bottom:8px">INFORME DE RESULTADOS</h1>'
    + '<h2 style="font-size:18px;color:#5ba3d9;font-weight:400;margin-bottom:40px">Meta Ads | ' + period + '</h2>'
    + '<h3 style="font-size:28px;color:#333;font-weight:700">' + biz.toUpperCase() + '</h3>'
    + '<div style="margin-top:60px;color:#999;font-size:13px">Preparado por<br><strong style="color:#333">DT Growth Partners</strong><br>dtgrowthpartners.com | +57 300 7189383</div></div>'
    // RESUMEN EJECUTIVO
    + '<div class="page-break"></div>' + hdr
    + '<h2 class="stitle">RESUMEN EJECUTIVO</h2><div class="cnt"><div class="mg">'
    + '<div class="mc"><div class="mv">' + fc(totalSpend) + '</div><div class="ml">Inversión Total</div></div>'
    + '<div class="mc"><div class="mv">' + totalConv.toLocaleString('es-CO') + '</div><div class="ml">Conversaciones WP</div></div>'
    + '<div class="mc"><div class="mv">' + f(avgCPR) + '</div><div class="ml">Costo por Conversación</div></div>'
    + '<div class="mc"><div class="mv">' + totalFirst.toLocaleString('es-CO') + '</div><div class="ml">Contactos Nuevos</div></div>'
    + '<div class="mc"><div class="mv">' + fc(accountReachLastMonth || adsetReachLastMonth) + '</div><div class="ml">Alcance Total</div></div>'
    + '<div class="mc"><div class="mv">' + fc(totalImp) + '</div><div class="ml">Impresiones</div></div>'
    + '<div class="mc"><div class="mv">' + fc(totalClicks) + '</div><div class="ml">Clics en Enlace</div></div>'
    + '<div class="mc hl"><div class="mv">' + msgPct + '%</div><div class="ml">Inversión en Mensajes</div></div>'
    + '</div>'
    + '<p class="st">Durante ' + period + ', se invirtieron <strong>' + f(totalSpend) + ' COP</strong> en campañas de Meta Ads para ' + biz + '. Las campañas de mensajes representaron el <strong>' + msgPct + '%</strong> de la inversión y generaron <strong>' + totalConv + ' conversaciones de WhatsApp</strong>, de las cuales <strong>' + totalFirst + '</strong> fueron contactos completamente nuevos. El costo promedio por conversación fue de <strong>' + f(avgCPR) + ' COP</strong>.'
    + (best ? ' La campaña con mejor rendimiento fue <strong>' + best.name + '</strong> con un costo por conversación de <strong>' + f(best.cpr) + ' COP</strong>.' : '')
    + (bestVol && bestVol !== best ? ' <strong>' + bestVol.name + '</strong> fue la de mayor volumen con <strong>' + bestVol.conv + '</strong> conversaciones generadas.' : '')
    + '</p></div>'
    // TABLA
    + '<div class="page-break"></div>' + hdr
    + '<h2 class="stitle">RENDIMIENTO POR CAMPAÑA</h2><div class="cnt"><table><thead><tr><th>Campaña</th><th>Tipo</th><th>Inversión</th><th>Resultados</th><th>CPR</th><th>Alcance</th></tr></thead><tbody>' + rowsHtml + '</tbody></table></div>'
    // INSIGHTS
    + '<div class="page-break"></div>' + hdr
    + '<h2 class="stitle">INSIGHTS Y APRENDIZAJES</h2><div class="cnt">'
    + (best ? '<div class="ic"><h4>Mejor CPR: ' + best.name + '</h4><p>Menor costo por conversación del mes a ' + f(best.cpr) + ' COP, generando ' + best.conv + ' conversaciones con ' + f(best.spend) + ' COP de inversión.</p></div>' : '')
    + (bestVol && bestVol !== best ? '<div class="ic"><h4>Mayor volumen: ' + bestVol.name + '</h4><p>Líder en volumen con ' + bestVol.conv + ' conversaciones y ' + bestVol.first + ' contactos nuevos. CPR: ' + f(bestVol.cpr) + ' COP.</p></div>' : '')
    + '<div class="ic yl"><h4>' + totalFirst + ' contactos nuevos por WhatsApp</h4><p>Las campañas de mensajes generaron ' + totalConv + ' conversaciones y ' + totalFirst + ' contactos nuevos. Inversión en mensajes: ' + f(msgSpend) + ' COP (' + msgPct + '%). CPR promedio: ' + f(avgCPR) + ' COP.</p></div>'
    + (totalSpend - msgSpend > 0 ? '<div class="ic"><h4>Reconocimiento y tráfico complementan el embudo</h4><p>' + f(totalSpend - msgSpend) + ' COP (' + (100-msgPct) + '%) en campañas de video y tráfico generaron impactos de marca adicionales.</p></div>' : '')
    + '</div>'
    // RECOMENDACIONES
    + '<h2 class="stitle">RECOMENDACIONES PRÓXIMO MES</h2><div class="cnt"><div class="rc"><ol>'
    + '<li>Preparar promociones o planes especiales para el próximo mes que podamos impulsar con las campañas — los resultados muestran que los contactos llegan, el siguiente paso es tener ofertas atractivas listas.</li>'
    + '<li>Responder los mensajes de WhatsApp lo más rápido posible (idealmente en menos de 5 minutos). Cada minuto de demora reduce la probabilidad de convertir ese contacto en cliente.</li>'
    + '<li>Compartir testimonios y fotos/videos de clientes reales — este tipo de contenido genera más confianza y reduce el costo de adquisición.</li>'
    + '<li>Reportar las ventas cerradas del mes para calcular el retorno real de la inversión (ROAS) y optimizar las campañas según lo que más genera ingresos.</li>'
    + '</ol></div></div>'
    // CIERRE
    + '<div class="page-break"></div>' + hdr
    + '<div style="text-align:center;padding:80px 40px"><h3 style="color:#1a3a5c;margin-bottom:16px">¡Gracias por confiar en nosotros!</h3><p>¿Tienes preguntas sobre este reporte?</p><p style="margin-top:12px"><strong style="color:#5ba3d9">+57 300 7189383</strong></p><p><strong style="color:#5ba3d9">dtgrowthpartners.com</strong></p><p style="margin-top:40px;color:#999;font-size:13px">Impulsamos crecimiento con estrategia, tecnología y ejecución.</p></div>'
    + '</body></html>';
}

// Endpoint: generar informe PDF (HTML print-ready) para una cuenta
app.get('/api/report/:slug/pdf', async (req, res) => {
  try {
    const { slug } = req.params;
    const accountConfig = resolveAccountConfig(slug, req.query);
    if (!accountConfig) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });

    const token = getToken(req);
    if (!token) return res.status(401).json({ success: false, error: 'Token requerido' });

    let data;
    const cached = reportCache[slug];
    const cacheTTL = 15 * 60 * 1000;
    if (cached && (Date.now() - cached.timestamp < cacheTTL)) {
      data = cached.data;
    } else {
      data = await getReportData(accountConfig.accountId, token);
      reportCache[slug] = { data, timestamp: Date.now() };
    }

    // For EQ Cartagena: fetch adset-level insights for sede classification
    let adsetData = null;
    if (slug === 'eq-cartagena') {
      try {
        const adsetInsights = [];
        let adsetUrl = META_API_BASE_URL + '/' + normalizeAccountId(accountConfig.accountId) + '/insights';
        let adsetParams = {
          access_token: getToken(req),
          fields: 'adset_name,campaign_name,spend,impressions,reach,actions,video_thruplay_watched_actions',
          level: 'adset',
          time_range: JSON.stringify({ since: data.dateRange.lastMonth.since, until: data.dateRange.lastMonth.until }),
          limit: 500
        };
        while (adsetUrl) {
          const resp = await axios.get(adsetUrl, { params: adsetParams });
          adsetInsights.push(...(resp.data.data || []));
          adsetUrl = resp.data.paging?.next || null;
          adsetParams = {};
        }
        adsetData = adsetInsights;
        console.log('EQ adset-level insights: ' + adsetInsights.length + ' rows');
      } catch (e) {
        console.warn('Could not fetch adset insights for EQ:', e.message);
      }
    }

    // Build campaign data for Python script
    const campaigns = data.campaigns.filter(c => parseFloat(c.insightsLastMonth?.spend || 0) > 0);
    const lastMonth = data.dateRange?.lastMonth || {};
    const monthsArr = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const monthName = lastMonth.label?.split(' ')[0] || monthsArr[new Date().getMonth() - 1] || 'Mes';
    const yearStr = lastMonth.label?.split(' ')[1] || String(new Date().getFullYear());

    const campData = campaigns.map(c => {
      const ins = c.insightsLastMonth || {};
      const spend = parseFloat(ins.spend || 0);
      const reach = parseInt(ins.reach || 0);
      const impressions = parseInt(ins.impressions || 0);
      let conv = 0, first = 0, clicks = 0, views = 0, thruplay = 0, reactions = 0, comments = 0, saves = 0, shares = 0;
      for (const a of (ins.actions || [])) {
        if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') conv = parseInt(a.value);
        if (a.action_type === 'onsite_conversion.messaging_first_reply') first = parseInt(a.value);
        if (a.action_type === 'link_click') clicks = parseInt(a.value);
        if (a.action_type === 'video_view') views = parseInt(a.value);
        if (a.action_type === 'post_reaction') reactions = parseInt(a.value);
        if (a.action_type === 'comment') comments = parseInt(a.value);
        if (a.action_type === 'onsite_conversion.post_save') saves = parseInt(a.value);
        if (a.action_type === 'post') shares = parseInt(a.value);
      }
      thruplay = parseInt(ins.video_thruplay_watched_actions?.[0]?.value || 0);
      const nl = c.name.toLowerCase();
      let type = 'Mensajes', result = conv;
      if (c.objective === 'OUTCOME_AWARENESS' || nl.includes('reconocimiento') || nl.includes('thruplay') || nl.includes('true play')) {
        type = 'Video'; result = thruplay || views;
      } else if (c.objective === 'OUTCOME_TRAFFIC' || nl.includes('trafico') || nl.includes('perfil ig')) {
        type = 'Trafico'; result = clicks;
      } else if (conv === 0 && clicks > 0) {
        type = 'Clics'; result = clicks;
      }
      return { name: c.name, objective: c.objective || '', type, spend, result, reach, impressions, conversations: conv, firstReplies: first, clicks, reactions, comments, saves, shares, cpr: result > 0 ? spend / result : 0 };
    });

    const outputPath = path.join(os.tmpdir(), 'report_' + slug + '_' + Date.now() + '.pdf');
    const inputJson = JSON.stringify({
      clientName: accountConfig.businessName,
      month: monthName,
      year: yearStr,
      outputPath,
      adsetReach: parseInt(data.accountReachLastMonth || data.adsetReachLastMonth || 0) || 0,
      campaigns: campData
    });

    // Use custom EQ script if eq-cartagena, otherwise generic
    const isEQ = slug === 'eq-cartagena';
    const scriptPath = path.join(__dirname_server, isEQ ? 'generate_eq_report.py' : 'generate_pdf_report.py');
    const assetsDir = path.join(__dirname_server, 'report-assets', 'brand');

    // For EQ, add ventas CSV if available
    if (isEQ) {
      const ventasKey = slug + '_current';
      const ventasData = salesDataStore[ventasKey];
      if (ventasData) {
        const parsed = JSON.parse(inputJson);
        parsed.ventasCsv = ventasData.csv;
        // Re-stringify (can't reassign const)
        Object.assign(JSON.parse(inputJson), parsed);
      }
    }

    let pdfGenerated = false;
    try {
      const { execSync: execSyncFn } = await import('child_process');
      // For EQ, inject ventas CSV + adset data into the JSON
      let finalJson = inputJson;
      if (isEQ) {
        const parsed = JSON.parse(inputJson);
        // Ventas CSV
        const ventasKey = slug + '_current';
        const ventasData = salesDataStore[ventasKey];
        if (ventasData) parsed.ventasCsv = ventasData.csv;
        // Adset-level data for sede classification
        if (adsetData) {
          parsed.adsets = adsetData.map(a => {
            const spend = parseFloat(a.spend || 0);
            const imp = parseInt(a.impressions || 0);
            const reach = parseInt(a.reach || 0);
            let conv = 0, first = 0, clicks = 0, reactions = 0, comments = 0, saves = 0, shares = 0;
            for (const ac of (a.actions || [])) {
              if (ac.action_type === 'onsite_conversion.messaging_conversation_started_7d') conv = parseInt(ac.value);
              if (ac.action_type === 'onsite_conversion.messaging_first_reply') first = parseInt(ac.value);
              if (ac.action_type === 'link_click') clicks = parseInt(ac.value);
              if (ac.action_type === 'post_reaction') reactions = parseInt(ac.value);
              if (ac.action_type === 'comment') comments = parseInt(ac.value);
              if (ac.action_type === 'onsite_conversion.post_save') saves = parseInt(ac.value);
              if (ac.action_type === 'post') shares = parseInt(ac.value);
            }
            const thruplay = parseInt(a.video_thruplay_watched_actions?.[0]?.value || 0);
            return { adsetName: a.adset_name, campaignName: a.campaign_name, spend, impressions: imp, reach, conversations: conv, firstReplies: first, clicks, reactions, comments, saves, shares, thruplay };
          });
        }
        finalJson = JSON.stringify(parsed);
      }
      execSyncFn('python3 "' + scriptPath + '"', {
        input: finalJson,
        timeout: 60000,
        env: { ...process.env, ASSETS_DIR: assetsDir }
      });
      pdfGenerated = fs.existsSync(outputPath);
    } catch (pyErr) {
      console.error('Python PDF error:', pyErr.stderr?.toString() || pyErr.message);
    }

    if (pdfGenerated) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="Informe_' + accountConfig.businessName.replace(/\s+/g, '_') + '_' + monthName + '_' + yearStr + '.pdf"');
      const pdfData = fs.readFileSync(outputPath);
      res.send(pdfData);
      fs.unlinkSync(outputPath);
    } else {
      // Fallback to HTML version
      console.log('PDF generation failed, falling back to HTML');
      const html = generatePdfHtml(accountConfig, data);
      res.send(html);
    }
  } catch (error) {
    console.error('PDF report error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ============================================
// EQ CARTAGENA — VENTAS CSV UPLOAD + CUSTOM PDF
// ============================================

// Storage for uploaded sales data (in-memory, persists until server restart)
const salesDataStore = {};

// Upload sales CSV for a specific slug/month
app.post('/api/report/:slug/ventas', upload.single('file'), (req, res) => {
  try {
    const { slug } = req.params;
    const month = req.query.month || 'current';
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const csvContent = req.file.buffer.toString('utf-8');
    const key = slug + '_' + month;
    salesDataStore[key] = { csv: csvContent, uploadedAt: new Date().toISOString(), filename: req.file.originalname };
    console.log('Sales CSV uploaded for ' + key + ': ' + req.file.originalname + ' (' + csvContent.length + ' bytes)');

    res.json({ success: true, message: 'CSV de ventas guardado', key, filename: req.file.originalname });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get uploaded sales data
app.get('/api/report/:slug/ventas', (req, res) => {
  const { slug } = req.params;
  const month = req.query.month || 'current';
  const key = slug + '_' + month;
  const data = salesDataStore[key];
  if (!data) return res.json({ success: true, data: null, message: 'No sales data uploaded for this period' });
  res.json({ success: true, data });
});

// Endpoint: generar CSV de insights para una cuenta publicitaria
app.get('/api/csv/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const token = getToken(req);
    if (!token) return res.status(401).json({ success: false, error: 'Token requerido' });

    const normalizedId = normalizeAccountId(accountId);
    const since = req.query.since || getLastMonthRange().since;
    const until = req.query.until || getLastMonthRange().until;
    const level = req.query.level || 'campaign'; // campaign, adset, ad

    console.log(`CSV export: ${normalizedId} | ${since} to ${until} | level: ${level}`);

    const insightsFields = [
      'campaign_name', 'campaign_id',
      'adset_name', 'adset_id',
      'ad_name', 'ad_id',
      'objective',
      'spend', 'impressions', 'reach',
      'frequency',
      'cpm', 'cpp', 'cpc', 'ctr',
      'actions', 'cost_per_action_type',
      'video_thruplay_watched_actions',
      'inline_link_clicks',
      'inline_link_click_ctr'
    ].join(',');

    // Paginar todos los resultados
    const allRows = [];
    let url = `${META_API_BASE_URL}/${normalizedId}/insights`;
    let params = {
      access_token: token,
      fields: insightsFields,
      level,
      time_range: JSON.stringify({ since, until }),
      limit: 500
    };

    while (url) {
      const resp = await axios.get(url, { params });
      const data = resp.data.data || [];
      allRows.push(...data);
      url = resp.data.paging?.next || null;
      params = {};
    }

    if (allRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sin datos para el periodo seleccionado' });
    }

    // Extraer action types para columnas dinámicas
    const actionTypes = new Set();
    const costActionTypes = new Set();
    for (const row of allRows) {
      for (const a of (row.actions || [])) actionTypes.add(a.action_type);
      for (const a of (row.cost_per_action_type || [])) costActionTypes.add(a.action_type);
    }

    // Construir cabeceras CSV
    const baseHeaders = [
      'campaign_name', 'campaign_id',
      'adset_name', 'adset_id',
      'ad_name', 'ad_id',
      'objective',
      'spend', 'impressions', 'reach',
      'frequency', 'cpm', 'cpp', 'cpc', 'ctr',
      'inline_link_clicks', 'inline_link_click_ctr',
      'thruplay'
    ];
    const actionHeaders = [...actionTypes].sort().map(t => `action_${t}`);
    const costHeaders = [...costActionTypes].sort().map(t => `cost_per_${t}`);
    const allHeaders = [...baseHeaders, ...actionHeaders, ...costHeaders];

    // Construir filas CSV
    const csvRows = [allHeaders.join(',')];

    for (const row of allRows) {
      const actionsMap = {};
      for (const a of (row.actions || [])) actionsMap[a.action_type] = a.value;
      const costMap = {};
      for (const a of (row.cost_per_action_type || [])) costMap[a.action_type] = a.value;
      const thruplay = row.video_thruplay_watched_actions?.[0]?.value || '';

      const values = [
        `"${(row.campaign_name || '').replace(/"/g, '""')}"`,
        row.campaign_id || '',
        `"${(row.adset_name || '').replace(/"/g, '""')}"`,
        row.adset_id || '',
        `"${(row.ad_name || '').replace(/"/g, '""')}"`,
        row.ad_id || '',
        row.objective || '',
        row.spend || '0',
        row.impressions || '0',
        row.reach || '0',
        row.frequency || '0',
        row.cpm || '0',
        row.cpp || '0',
        row.cpc || '0',
        row.ctr || '0',
        row.inline_link_clicks || '0',
        row.inline_link_click_ctr || '0',
        thruplay
      ];

      // Actions
      for (const t of [...actionTypes].sort()) {
        values.push(actionsMap[t] || '0');
      }
      // Cost per action
      for (const t of [...costActionTypes].sort()) {
        values.push(costMap[t] || '0');
      }

      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const filename = `meta_insights_${normalizedId}_${since}_${until}_${level}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8

  } catch (error) {
    console.error('CSV export error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data?.error?.message || error.message });
  }
});

// Auto-refresh cache a las 7am Colombia (UTC-5 = 12:00 UTC)
function scheduleReportRefresh() {
  const refreshReports = async () => {
    console.log('Auto-refreshing report cache...');
    const token = ACCESS_TOKEN;
    if (!token || token === 'TU_META_ACCESS_TOKEN_AQUI') return;

    for (const [slug, config] of Object.entries(REPORT_ACCOUNTS)) {
      try {
        const data = await getReportData(config.accountId, token);
        reportCache[slug] = { data, timestamp: Date.now() };
        console.log(`Report cache refreshed: ${slug} (${data.totalCampaigns} campaigns)`);
      } catch (err) {
        console.error(`Report cache refresh failed for ${slug}:`, err.message);
      }
    }
  };

  // Calcular ms hasta las 7am Colombia (12:00 UTC)
  const now = new Date();
  const next7am = new Date(now);
  next7am.setUTCHours(12, 0, 0, 0);
  if (now >= next7am) next7am.setDate(next7am.getDate() + 1);
  const msUntil7am = next7am.getTime() - now.getTime();

  console.log(`Report auto-refresh scheduled in ${Math.round(msUntil7am / 60000)} minutes (7am Colombia)`);
  setTimeout(() => {
    refreshReports();
    // Repetir cada 24 horas
    setInterval(refreshReports, 24 * 60 * 60 * 1000);
  }, msUntil7am);
}
scheduleReportRefresh();

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
