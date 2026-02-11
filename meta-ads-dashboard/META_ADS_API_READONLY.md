# Meta Ads API - Endpoints de Solo Lectura (READ-ONLY)

**IMPORTANTE**: Este documento contiene SOLO endpoints de lectura. NO incluye métodos para crear, modificar o eliminar recursos. Esto es intencional para prevenir modificaciones accidentales desde sistemas externos.

---

## Configuración

```javascript
const MetaAdsService = require('./services/metaAdsApi');

// El ACCESS_TOKEN debe enviarse por separado (variable de entorno o parámetro)
const metaService = new MetaAdsService(ACCESS_TOKEN);
```

---

## Endpoints Disponibles

### 1. Obtener Cuentas Publicitarias

```javascript
const accounts = await metaService.getAdAccounts();
```

**Respuesta:**
```javascript
[
  {
    id: 'act_123456789',
    name: 'Mi Cuenta Publicitaria',
    account_status: 1,
    business: { id: '987654321', name: 'Mi Negocio' }
  }
]
```

---

### 2. Obtener Información del Token

```javascript
const tokenInfo = await metaService.getTokenInfo();
```

**Respuesta:**
```javascript
{
  id: '123456789',
  name: 'Usuario o Página'
}
```

---

### 3. Obtener Negocios (Business Portfolios)

```javascript
const businesses = await metaService.getBusinesses();
```

**Respuesta:**
```javascript
[
  {
    id: '987654321',
    name: 'Mi Negocio',
    profile_picture_uri: 'https://...'
  }
]
```

---

### 4. Obtener Todas las Cuentas de Todos los Negocios

```javascript
const result = await metaService.getAllAdAccountsFromBusinesses();
```

**Respuesta:**
```javascript
{
  businesses: [
    { id: '987654321', name: 'Mi Negocio' }
  ],
  adAccounts: [
    {
      id: 'act_123456789',
      name: 'Cuenta 1',
      account_status: 1,
      business_name: 'Mi Negocio',
      business_id: '987654321',
      account_type: 'owned' // 'owned', 'client', o 'direct'
    }
  ]
}
```

---

### 5. Obtener Cuentas de un Negocio Específico

```javascript
const result = await metaService.getAdAccountsFromSpecificBusiness(businessId);
```

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `businessId` | string | ID del Business Portfolio |

**Respuesta:**
```javascript
{
  businesses: [{ id: '987654321', name: 'Mi Negocio' }],
  adAccounts: [...]
}
```

---

### 6. Obtener Campañas Activas

```javascript
const campaigns = await metaService.getActiveCampaigns(adAccountId);
```

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `adAccountId` | string | ID de la cuenta (con o sin prefijo `act_`) |

**Respuesta:**
```javascript
[
  {
    id: '123456789',
    name: 'Mi Campaña',
    status: 'ACTIVE', // o 'PAUSED'
    objective: 'OUTCOME_TRAFFIC',
    daily_budget: '50000',
    lifetime_budget: null,
    budget_remaining: '45000',
    special_ad_categories: [],
    buying_type: 'AUCTION',
    configured_status: 'ACTIVE'
  }
]
```

**Nota:** Solo retorna campañas con status `ACTIVE` o `PAUSED`.

---

### 7. Obtener Insights de una Campaña

```javascript
const insights = await metaService.getCampaignInsights(campaignId, datePreset);
```

**Parámetros:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `campaignId` | string | - | ID de la campaña |
| `datePreset` | string | `'maximum'` | Período de tiempo |

**Date Presets Disponibles:**
- `'maximum'` - Todo el tiempo de vida (default)
- `'today'` - Hoy
- `'yesterday'` - Ayer
- `'this_week_sun_today'` - Esta semana
- `'last_7d'` - Últimos 7 días
- `'last_14d'` - Últimos 14 días
- `'last_30d'` - Últimos 30 días
- `'this_month'` - Este mes
- `'last_month'` - Mes pasado

**Respuesta:**
```javascript
{
  campaign_name: 'Mi Campaña',
  spend: '150000.50',
  impressions: '50000',
  reach: '35000',
  cpm: '3000.01',
  cpc: '500.00',
  ctr: '2.5',
  inline_link_clicks: '300',
  actions: [
    { action_type: 'link_click', value: '300' },
    { action_type: 'landing_page_view', value: '280' }
  ],
  cost_per_action_type: [
    { action_type: 'link_click', value: '500.00' }
  ]
}
```

---

### 8. Obtener Campañas con Insights

```javascript
const campaignsWithInsights = await metaService.getCampaignsWithInsights(adAccountId, datePreset);
```

**Parámetros:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `adAccountId` | string | - | ID de la cuenta publicitaria |
| `datePreset` | string | `'maximum'` | Período de tiempo |

**Respuesta:**
```javascript
[
  {
    id: '123456789',
    name: 'Mi Campaña',
    status: 'ACTIVE',
    objective: 'OUTCOME_TRAFFIC',
    daily_budget: '50000',
    insights: {
      spend: '150000.50',
      impressions: '50000',
      reach: '35000',
      // ... más métricas
    }
  }
]
```

---

### 9. Obtener Públicos Guardados (Saved Audiences)

```javascript
const result = await metaService.getSavedAudiences(adAccountId);
```

**Respuesta:**
```javascript
{
  success: true,
  data: [
    {
      id: '123456789',
      name: 'Mi Público Guardado',
      targeting: {
        geo_locations: { countries: ['CO'] },
        age_min: 18,
        age_max: 65,
        genders: [1, 2]
      }
    }
  ],
  type: 'saved'
}
```

---

### 10. Obtener Custom Audiences

```javascript
const result = await metaService.getCustomAudiences(adAccountId);
```

**Respuesta:**
```javascript
{
  success: true,
  data: [
    {
      id: '987654321',
      name: 'Visitantes Web 180 días',
      subtype: 'WEBSITE',
      description: 'Personas que visitaron el sitio web'
    }
  ],
  type: 'custom'
}
```

---

### 11. Obtener Todos los Públicos (Saved + Custom)

```javascript
const result = await metaService.getAllAudiences(adAccountId);
```

**Respuesta:**
```javascript
{
  savedAudiences: [...],
  customAudiences: [...],
  errors: [] // Errores si alguna llamada falló
}
```

---

### 12. Obtener Páginas de Facebook

```javascript
const result = await metaService.getPages();
```

**Respuesta:**
```javascript
{
  success: true,
  data: [
    {
      id: '123456789012345',
      name: 'Mi Página de Facebook',
      access_token: 'PAGE_ACCESS_TOKEN',
      instagram_business_account: {
        id: '17841234567890',
        username: 'mi_instagram'
      }
    }
  ]
}
```

---

### 13. Obtener Información de un Negocio

```javascript
const businessInfo = await metaService.getBusinessInfo(businessId);
```

**Respuesta:**
```javascript
{
  id: '987654321',
  name: 'Mi Negocio',
  profile_picture_uri: 'https://...'
}
```

---

## Códigos de Estado de Cuenta

| Código | Significado |
|--------|-------------|
| 1 | ACTIVE |
| 2 | DISABLED |
| 3 | UNSETTLED |
| 7 | PENDING_RISK_REVIEW |
| 8 | PENDING_SETTLEMENT |
| 9 | IN_GRACE_PERIOD |
| 100 | PENDING_CLOSURE |
| 101 | CLOSED |
| 201 | ANY_ACTIVE |
| 202 | ANY_CLOSED |

---

## Estados de Campaña

| Estado | Descripción |
|--------|-------------|
| `ACTIVE` | Campaña activa y corriendo |
| `PAUSED` | Campaña pausada por el usuario |
| `DELETED` | Campaña eliminada |
| `ARCHIVED` | Campaña archivada |

---

## Manejo de Errores

Todos los métodos manejan errores internamente y retornan arrays vacíos o objetos con `success: false` en caso de error.

```javascript
// Ejemplo de manejo de errores
const result = await metaService.getSavedAudiences(adAccountId);

if (!result.success) {
  console.error('Error:', result.error);
}
```

---

## Errores Comunes

| Código | Descripción | Solución |
|--------|-------------|----------|
| 100 | Parámetro inválido | Verificar formato de IDs |
| 190 | Token expirado | Renovar access token |
| 200 | Permisos insuficientes | Verificar permisos del token |
| 294 | Página no autorizada | Verificar acceso a la página |

---

## Permisos Requeridos del Token

Para operaciones de **solo lectura**:
- `ads_read` - Leer datos de anuncios
- `pages_show_list` - Listar páginas
- `pages_read_engagement` - Leer engagement de páginas
- `business_management` - Gestión de negocio (solo lectura)

---

## Notas de Seguridad

1. **NO almacenar tokens en código fuente** - Usar variables de entorno
2. **Tokens tienen expiración** - Implementar renovación automática
3. **Este documento NO incluye métodos de escritura** - Intencionalmente limitado a lectura
4. **Validar siempre las respuestas** - Los datos pueden cambiar en la API de Meta

---

## Ejemplo de Uso Completo

```javascript
const MetaAdsService = require('./services/metaAdsApi');

async function getDashboardData(accessToken, adAccountId) {
  const metaService = new MetaAdsService(accessToken);

  try {
    // Obtener campañas con métricas
    const campaigns = await metaService.getCampaignsWithInsights(adAccountId, 'last_30d');

    // Obtener públicos disponibles
    const audiences = await metaService.getAllAudiences(adAccountId);

    // Obtener páginas
    const pages = await metaService.getPages();

    return {
      campaigns,
      audiences,
      pages: pages.data || []
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}
```

---

**Versión**: 1.0
**Última actualización**: Febrero 2026
**Restricción**: SOLO LECTURA - Sin métodos de escritura
