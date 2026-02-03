# Meta Ads Dashboard API - Documentacion para Integracion DTOS

## Base URL
```
https://metasuite.dtgrowthpartners.com
```

---

## Endpoints Disponibles

### 1. Health Check
Verifica que el servicio este funcionando.

```
GET /api/health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-03T15:18:57.326Z",
  "service": "Meta Ads Dashboard API"
}
```

---

### 2. Obtener Todos los Businesses
Lista todos los portafolios comerciales (negocios) disponibles.

```
GET /api/businesses
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "3446729078775110",
      "name": "DT Growth Partners",
      "profile_picture_uri": "https://..."
    }
  ],
  "count": 8
}
```

---

### 3. Obtener Todas las Cuentas Publicitarias
Lista todas las cuentas de anuncios de todos los businesses.

```
GET /api/ad-accounts
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "businesses": [...],
    "adAccounts": [
      {
        "id": "act_123456789",
        "name": "Cuenta Ejemplo",
        "account_status": 1,
        "business_name": "DT Growth Partners",
        "business_id": "3446729078775110",
        "account_type": "owned"
      }
    ]
  },
  "counts": {
    "businesses": 8,
    "adAccounts": 15
  }
}
```

---

### 4. Obtener Campanas de una Cuenta Especifica
Lista las campanas activas y pausadas de una cuenta publicitaria.

```
GET /api/campaigns/{accountId}
```

**Parametros de Query:**
| Parametro | Tipo | Descripcion | Default |
|-----------|------|-------------|---------|
| date_preset | string | Periodo de tiempo para metricas | maximum |

**Valores de date_preset:**
- `maximum` - Todo el tiempo de vida de la campana
- `today` - Hoy
- `yesterday` - Ayer
- `last_7d` - Ultimos 7 dias
- `last_14d` - Ultimos 14 dias
- `last_30d` - Ultimos 30 dias
- `this_month` - Este mes
- `last_month` - Mes pasado

**Ejemplo:**
```
GET /api/campaigns/act_123456789?date_preset=last_30d
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123456789",
      "name": "Campana Instagram Perfil",
      "status": "ACTIVE",
      "objective": "OUTCOME_TRAFFIC",
      "daily_budget": "50000",
      "lifetime_budget": null,
      "budget_remaining": "25000",
      "insights": {
        "spend": "25000",
        "impressions": "15000",
        "reach": "8000",
        "cpm": "1666.67",
        "cpc": "500",
        "ctr": "2.5",
        "actions": [
          { "action_type": "link_click", "value": "50" },
          { "action_type": "landing_page_view", "value": "45" }
        ],
        "cost_per_action_type": [
          { "action_type": "link_click", "value": "500" }
        ],
        "cost_per_result": [
          {
            "indicator": "profile_visit_view",
            "values": [{ "value": "141" }]
          }
        ]
      }
    }
  ],
  "count": 5,
  "accountId": "act_123456789",
  "datePreset": "last_30d"
}
```

---

### 5. Activar/Pausar una Campana
Cambia el estado de una campana entre ACTIVE y PAUSED.

```
POST /api/campaigns/{campaignId}/status
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "status": "PAUSED"
}
```

**Valores validos para status:**
- `ACTIVE` - Activa la campana
- `PAUSED` - Pausa la campana

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": { "success": true },
  "message": "Campana 123456789 actualizada a PAUSED"
}
```

**Respuesta de error:**
```json
{
  "success": false,
  "error": "Status debe ser ACTIVE o PAUSED"
}
```

---

### 6. DASHBOARD COMPLETO (Endpoint Principal)
**Este es el endpoint principal que devuelve TODOS los datos del dashboard.**

```
GET /api/dashboard
```

**Parametros de Query:**
| Parametro | Tipo | Descripcion | Default |
|-----------|------|-------------|---------|
| date_preset | string | Periodo de tiempo | maximum |

**Ejemplo:**
```
GET /api/dashboard?date_preset=last_30d
```

**Respuesta:**
```json
{
  "success": true,
  "timestamp": "2026-02-03T15:13:53.566Z",
  "datePreset": "last_30d",
  "totals": {
    "totalAccounts": 15,
    "totalBusinesses": 8,
    "totalCampaigns": 25,
    "totalActiveCampaigns": 18,
    "totalPausedCampaigns": 7,
    "totalSpend": 5000000,
    "totalImpressions": 2500000,
    "totalReach": 1200000
  },
  "businesses": [
    {
      "id": "3446729078775110",
      "name": "DT Growth Partners",
      "profile_picture_uri": "https://..."
    }
  ],
  "accounts": [
    {
      "id": "act_123456789",
      "name": "Cuenta Ejemplo",
      "account_status": 1,
      "business_name": "DT Growth Partners",
      "business_id": "3446729078775110",
      "account_type": "owned",
      "campaigns": [
        {
          "id": "987654321",
          "name": "Campana Instagram",
          "status": "ACTIVE",
          "objective": "OUTCOME_TRAFFIC",
          "daily_budget": "50000",
          "insights": {
            "spend": "25000",
            "impressions": "15000",
            "reach": "8000",
            "actions": [...],
            "cost_per_result": [...]
          }
        }
      ],
      "campaignCount": 3,
      "activeCampaigns": 2,
      "pausedCampaigns": 1,
      "totalSpend": 75000,
      "totalImpressions": 45000,
      "totalReach": 22000
    }
  ]
}
```

---

### 7. Resumen Ejecutivo por Negocio
Devuelve un resumen agrupado por business/negocio.

```
GET /api/dashboard/summary
```

**Parametros de Query:**
| Parametro | Tipo | Descripcion | Default |
|-----------|------|-------------|---------|
| date_preset | string | Periodo de tiempo | maximum |

**Respuesta:**
```json
{
  "success": true,
  "timestamp": "2026-02-03T15:13:53.566Z",
  "datePreset": "maximum",
  "summary": [
    {
      "business_name": "DT Growth Partners",
      "business_id": "3446729078775110",
      "accounts": [
        {
          "account_id": "act_123456789",
          "account_name": "Cuenta 1",
          "campaigns": 5,
          "active": 3,
          "spend": 250000,
          "impressions": 150000,
          "reach": 75000
        }
      ],
      "totalSpend": 500000,
      "totalImpressions": 300000,
      "totalReach": 150000,
      "totalCampaigns": 10,
      "activeCampaigns": 7
    }
  ]
}
```

---

## Estructura de Datos Importantes

### Objeto Campaign
```json
{
  "id": "123456789",
  "name": "Nombre de la campana",
  "status": "ACTIVE | PAUSED",
  "objective": "OUTCOME_TRAFFIC | OUTCOME_ENGAGEMENT | ...",
  "daily_budget": "50000",
  "lifetime_budget": null,
  "budget_remaining": "25000",
  "insights": { ... }
}
```

### Objeto Insights
```json
{
  "campaign_name": "Nombre",
  "spend": "25000",
  "impressions": "15000",
  "reach": "8000",
  "cpm": "1666.67",
  "cpc": "500",
  "ctr": "2.5",
  "actions": [
    { "action_type": "link_click", "value": "50" },
    { "action_type": "landing_page_view", "value": "45" },
    { "action_type": "post_engagement", "value": "100" }
  ],
  "cost_per_action_type": [
    { "action_type": "link_click", "value": "500" }
  ],
  "cost_per_result": [
    {
      "indicator": "profile_visit_view",
      "values": [{ "value": "141" }]
    }
  ]
}
```

### Tipos de Acciones Comunes
| action_type | Descripcion |
|-------------|-------------|
| link_click | Clics en enlace |
| landing_page_view | Vistas de pagina de destino |
| post_engagement | Interacciones con publicacion |
| page_engagement | Interacciones con pagina |
| video_view | Vistas de video |
| ig_account_visit | Visitas al perfil de Instagram |
| profile_visit | Visitas al perfil |
| purchase | Compras |
| lead | Leads generados |

### Indicadores de cost_per_result
| indicator | Descripcion |
|-----------|-------------|
| profile_visit_view | Costo por visita al perfil |
| landing_page_view | Costo por vista de pagina |
| link_click | Costo por clic |
| purchase | Costo por compra |
| lead | Costo por lead |

---

## Codigos de Estado HTTP

| Codigo | Descripcion |
|--------|-------------|
| 200 | Exito |
| 400 | Error de validacion (ej: status invalido) |
| 500 | Error interno del servidor |

---

## Ejemplo de Integracion (JavaScript/Node.js)

```javascript
const axios = require('axios');

const BASE_URL = 'https://metasuite.dtgrowthpartners.com';

// Obtener todo el dashboard
async function getDashboard(datePreset = 'maximum') {
  const response = await axios.get(`${BASE_URL}/api/dashboard`, {
    params: { date_preset: datePreset }
  });
  return response.data;
}

// Pausar una campana
async function pauseCampaign(campaignId) {
  const response = await axios.post(
    `${BASE_URL}/api/campaigns/${campaignId}/status`,
    { status: 'PAUSED' }
  );
  return response.data;
}

// Activar una campana
async function activateCampaign(campaignId) {
  const response = await axios.post(
    `${BASE_URL}/api/campaigns/${campaignId}/status`,
    { status: 'ACTIVE' }
  );
  return response.data;
}

// Uso
const dashboard = await getDashboard('last_30d');
console.log('Total campanas:', dashboard.totals.totalCampaigns);
console.log('Gasto total:', dashboard.totals.totalSpend);
```

---

## Ejemplo de Integracion (Python)

```python
import requests

BASE_URL = 'https://metasuite.dtgrowthpartners.com'

def get_dashboard(date_preset='maximum'):
    response = requests.get(
        f'{BASE_URL}/api/dashboard',
        params={'date_preset': date_preset}
    )
    return response.json()

def toggle_campaign(campaign_id, status):
    response = requests.post(
        f'{BASE_URL}/api/campaigns/{campaign_id}/status',
        json={'status': status}
    )
    return response.json()

# Uso
dashboard = get_dashboard('last_30d')
print(f"Total campanas: {dashboard['totals']['totalCampaigns']}")
print(f"Gasto total: {dashboard['totals']['totalSpend']}")
```

---

## Notas Importantes

1. **Moneda**: Todos los valores monetarios estan en Pesos Colombianos (COP)
2. **Token**: El token de acceso tiene validez de 3 meses desde febrero 2026
3. **Rate Limits**: La API de Meta tiene limites de requests. Si hay muchas campanas, las llamadas pueden demorar
4. **Actualizacion**: Los datos de Meta se actualizan en tiempo real desde la API de Facebook
5. **CORS**: La API tiene CORS habilitado para permitir llamadas desde cualquier origen
