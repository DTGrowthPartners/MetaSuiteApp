# Meta Ads API - Endpoint para Crear Campañas Completas

Este documento describe cómo crear una campaña completa de Meta Ads (Facebook/Instagram) con Campaign + AdSet + Creative + Ad usando el servicio `MetaAdsService`.

---

## Resumen

El método `createCampaignWithAd` crea una campaña completa de tráfico web en 5 pasos:
1. **Campaign** - Con CBO (Campaign Budget Optimization)
2. **AdSet** - Configuración de público y optimización
3. **Image Upload** - Sube imagen desde URL
4. **AdCreative** - Con Asset Feed Spec (múltiples títulos/descripciones/CTAs)
5. **Ad** - El anuncio final

---

## Método Principal

```javascript
const MetaAdsService = require('./services/metaAdsApi');

const metaService = new MetaAdsService(ACCESS_TOKEN);

const result = await metaService.createCampaignWithAd(adAccountId, {
  // Campaign
  campaignName: string,           // Nombre de la campaña
  objective: string,              // 'OUTCOME_TRAFFIC' (default)
  specialAdCategories: array,     // [] para ninguna categoría especial

  // AdSet
  adSetName: string,              // Nombre del ad set
  dailyBudget: number,            // Presupuesto diario en moneda local (COP = pesos directos)
  targeting: object,              // Objeto de targeting (ver abajo)
  optimizationGoal: string,       // 'LANDING_PAGE_VIEWS' (default)
  billingEvent: string,           // 'IMPRESSIONS' (default)

  // Creative & Ad
  adName: string,                 // Nombre del anuncio
  pageId: string,                 // ID de la página de Facebook
  imageUrl: string,               // URL pública de la imagen (JPG/PNG)
  titles: array,                  // Array de hasta 5 títulos
  bodies: array,                  // Array de hasta 5 textos primarios (descripciones largas)
  descriptions: array,            // Array de hasta 5 descripciones cortas
  callToActionTypes: array,       // Array de CTAs (ver opciones abajo)
  linkUrl: string,                // URL de destino (landing page)
  igActorId: string               // (Opcional) ID de cuenta de Instagram
});
```

---

## Parámetros Detallados

### Campaign

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `campaignName` | string | Sí | Nombre identificador de la campaña |
| `objective` | string | No | Objetivo ODAX. Default: `OUTCOME_TRAFFIC` |
| `specialAdCategories` | array | No | Categorías especiales. Default: `[]` |

**Objetivos disponibles (ODAX):**
- `OUTCOME_TRAFFIC` - Tráfico web
- `OUTCOME_ENGAGEMENT` - Interacción
- `OUTCOME_LEADS` - Generación de leads
- `OUTCOME_SALES` - Ventas/Conversiones
- `OUTCOME_APP_PROMOTION` - Promoción de app
- `OUTCOME_AWARENESS` - Reconocimiento de marca

### AdSet

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `adSetName` | string | Sí | Nombre del conjunto de anuncios |
| `dailyBudget` | number | Sí | Presupuesto diario. **COP: enviar en pesos directos (ej: 50000)** |
| `targeting` | object | Sí | Configuración de público objetivo |
| `optimizationGoal` | string | No | Meta de optimización. Default: `LANDING_PAGE_VIEWS` |
| `billingEvent` | string | No | Evento de facturación. Default: `IMPRESSIONS` |

**Optimization Goals para OUTCOME_TRAFFIC:**
- `LANDING_PAGE_VIEWS` - Vistas de página de destino (recomendado)
- `LINK_CLICKS` - Clics en el enlace
- `REACH` - Alcance
- `IMPRESSIONS` - Impresiones

### Targeting Object

```javascript
const targeting = {
  // Ubicación geográfica (requerido)
  geo_locations: {
    countries: ['CO'],              // Códigos de país ISO
    // O más específico:
    cities: [{ key: '123456' }],
    regions: [{ key: '789' }],
    zips: [{ key: '110111' }]
  },

  // Edad (opcional)
  age_min: 18,                      // Mínimo 18
  age_max: 65,                      // Máximo 65

  // Género (opcional)
  genders: [1, 2],                  // 1 = Hombre, 2 = Mujer

  // Públicos personalizados (opcional)
  custom_audiences: [{ id: 'AUDIENCE_ID' }],
  excluded_custom_audiences: [{ id: 'AUDIENCE_ID' }],

  // Intereses (opcional)
  flexible_spec: [{
    interests: [{ id: '123', name: 'Business' }]
  }],

  // Idiomas (opcional)
  locales: [24]                     // 24 = Español
};
```

**Targeting por defecto (Colombia 18-65):**
```javascript
const defaultTargeting = {
  geo_locations: {
    countries: ['CO']
  },
  age_min: 18,
  age_max: 65
};
```

### Creative & Ad

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `adName` | string | Sí | Nombre del anuncio |
| `pageId` | string | Sí | ID de la página de Facebook |
| `imageUrl` | string | Sí | URL pública de imagen (1200x628px recomendado) |
| `titles` | array | Sí | Hasta 5 títulos (max 40 chars c/u) |
| `bodies` | array | Sí | Hasta 5 textos primarios (max 125 chars c/u) |
| `descriptions` | array | Sí | Hasta 5 descripciones cortas |
| `callToActionTypes` | array | Sí | Hasta 5 CTAs |
| `linkUrl` | string | Sí | URL de destino |
| `igActorId` | string | No | ID de Instagram Business |

**CTAs Disponibles:**
```javascript
const CTA_OPTIONS = [
  'LEARN_MORE',        // Más información
  'SHOP_NOW',          // Comprar
  'SIGN_UP',           // Registrarse
  'BOOK_TRAVEL',       // Reservar
  'CONTACT_US',        // Contactar
  'GET_QUOTE',         // Obtener cotización
  'SUBSCRIBE',         // Suscribirse
  'DOWNLOAD',          // Descargar
  'WATCH_MORE',        // Ver más
  'APPLY_NOW',         // Aplicar ahora
  'GET_OFFER',         // Obtener oferta
  'SEND_MESSAGE',      // Enviar mensaje
  'WHATSAPP_MESSAGE'   // WhatsApp
];
```

---

## Ejemplo Completo

```javascript
const MetaAdsService = require('./services/metaAdsApi');

const ACCESS_TOKEN = 'tu_access_token_aqui';
const AD_ACCOUNT_ID = 'act_123456789';

const metaService = new MetaAdsService(ACCESS_TOKEN);

const result = await metaService.createCampaignWithAd(AD_ACCOUNT_ID, {
  // Campaign
  campaignName: 'CARLOS - Landing Febrero 2024',
  objective: 'OUTCOME_TRAFFIC',
  specialAdCategories: [],

  // AdSet
  adSetName: 'CARLOS - Landing Febrero 2024 - Ad Set',
  dailyBudget: 50000, // 50,000 COP
  targeting: {
    geo_locations: { countries: ['CO'] },
    age_min: 18,
    age_max: 65
  },
  optimizationGoal: 'LANDING_PAGE_VIEWS',
  billingEvent: 'IMPRESSIONS',

  // Creative & Ad
  adName: 'CARLOS - Landing Febrero 2024',
  pageId: '123456789012345',
  imageUrl: 'https://ejemplo.com/imagen-anuncio.jpg',
  titles: [
    '¡Descubre cómo transformar tu negocio!',
    'La solución que estabas buscando',
    'Resultados garantizados',
    'Empieza hoy mismo',
    'Tu éxito comienza aquí'
  ],
  bodies: [
    'Miles de empresarios ya están usando esta estrategia. ¿Qué esperas?',
    'Descubre el método probado que ha ayudado a cientos de emprendedores.',
    'No dejes pasar esta oportunidad única. Haz clic y conoce los detalles.',
    'Aprende los secretos que los expertos no quieren que sepas.',
    'Transforma tu vida y tu negocio con esta metodología revolucionaria.'
  ],
  descriptions: [
    'Resultados comprobados',
    'Método exclusivo',
    'Acceso inmediato',
    'Sin compromiso',
    'Garantía total'
  ],
  callToActionTypes: ['LEARN_MORE', 'LEARN_MORE', 'SIGN_UP', 'LEARN_MORE', 'LEARN_MORE'],
  linkUrl: 'https://tusitio.com/landing-page'
});

console.log(result);
```

---

## Respuesta

### Éxito

```javascript
{
  success: true,
  campaign: { id: '123456789' },
  adSet: { id: '234567890' },
  creative: { id: '345678901' },
  ad: { id: '456789012' },
  errors: []
}
```

### Error

```javascript
{
  success: false,
  campaign: { id: '123456789' } | null,
  adSet: { id: '234567890' } | null,
  creative: null,
  ad: null,
  errors: ['Creative: Error message here']
}
```

---

## Métodos Auxiliares

### Obtener Páginas de Facebook

```javascript
const pages = await metaService.getPages();
// { success: true, data: [{ id: '123', name: 'Mi Página', access_token: '...' }] }
```

### Obtener Públicos Guardados

```javascript
const audiences = await metaService.getAllAudiences(adAccountId);
// {
//   savedAudiences: [{ id: '123', name: 'Mi Público', targeting: {...} }],
//   customAudiences: [{ id: '456', name: 'Custom Audience' }],
//   errors: []
// }
```

### Obtener Cuentas Publicitarias

```javascript
const accounts = await metaService.getAdAccounts();
// { success: true, data: [{ id: 'act_123', name: 'Mi Cuenta' }] }
```

---

## Notas Importantes

1. **Presupuesto en COP**: Enviar el valor directo en pesos (50000 = $50,000 COP). NO multiplicar por 100.

2. **Estado PAUSED**: Todas las campañas se crean en estado PAUSADO. Activar manualmente en Meta Ads Manager.

3. **Imagen**: Debe ser una URL pública accesible. Tamaño recomendado: 1200x628px.

4. **Asset Feed Spec**: El creative usa Asset Feed Spec para Dynamic Creative Optimization, permitiendo múltiples variantes de copy.

5. **CBO (Campaign Budget Optimization)**: El presupuesto se configura a nivel de campaña, no de ad set.

6. **Prefijo CARLOS**: Por convención, las campañas creadas tienen el prefijo "CARLOS - " para identificación.

---

## Flujo Recomendado para IA

```
1. Obtener páginas de Facebook → getPages()
2. Obtener cuentas publicitarias → getAdAccounts()
3. Obtener públicos disponibles → getAllAudiences(adAccountId)
4. Crear campaña completa → createCampaignWithAd(adAccountId, config)
5. Informar al usuario los IDs creados
6. Dirigir al usuario a Meta Ads Manager para activar
```

---

## Códigos de Error Comunes

| Código | Descripción | Solución |
|--------|-------------|----------|
| 100 | Parámetro inválido | Verificar formato de parámetros |
| 190 | Token expirado | Renovar access token |
| 294 | Página no autorizada | Verificar permisos de página |
| 1487390 | Error de imagen | Verificar URL de imagen accesible |
| 368 | Cuenta bloqueada | Revisar estado de cuenta en Meta |

---

## Permisos Requeridos del Token

- `ads_management` - Gestionar anuncios
- `ads_read` - Leer datos de anuncios
- `pages_show_list` - Listar páginas
- `pages_read_engagement` - Leer engagement de páginas
- `business_management` - Gestión de negocio
