# DTOS - Solicitudes HTTP al Backend MetaSuite

**Base URL:** `https://metasuite.dtgrowthpartners.com/api`

**Autenticacion:** No requerida (el token ya esta configurado en el backend)

---

## Endpoints READ-ONLY Disponibles

### 1. Health Check

```
GET https://metasuite.dtgrowthpartners.com/api/health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-04T12:00:00.000Z",
  "service": "Meta Ads Dashboard API"
}
```

---

### 2. Obtener Businesses

```
GET https://metasuite.dtgrowthpartners.com/api/businesses
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "987654321",
      "name": "Mi Negocio",
      "profile_picture_uri": "https://..."
    }
  ],
  "count": 1
}
```

---

### 3. Obtener Todas las Cuentas Publicitarias

```
GET https://metasuite.dtgrowthpartners.com/api/ad-accounts
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "businesses": [
      { "id": "987654321", "name": "Mi Negocio" }
    ],
    "adAccounts": [
      {
        "id": "act_123456789",
        "name": "Cuenta Publicitaria 1",
        "account_status": 1,
        "business_name": "Mi Negocio",
        "business_id": "987654321",
        "account_type": "owned"
      }
    ]
  },
  "counts": {
    "businesses": 1,
    "adAccounts": 3
  }
}
```

**Tipos de cuenta (`account_type`):**
- `owned` - Cuenta propia del business
- `client` - Cuenta de cliente
- `personal` - Cuenta personal

---

### 4. Obtener Campanas de una Cuenta

```
GET https://metasuite.dtgrowthpartners.com/api/campaigns/{accountId}
```

**Con filtro de fecha:**
```
GET https://metasuite.dtgrowthpartners.com/api/campaigns/{accountId}?date_preset=last_30d
```

**Parametros:**

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `accountId` | string | Si | ID de la cuenta (con o sin `act_`) |
| `date_preset` | string | No | Periodo de tiempo para insights |

**Date Presets Disponibles:**
- `maximum` - Todo el tiempo (default)
- `today` - Hoy
- `yesterday` - Ayer
- `last_7d` - Ultimos 7 dias
- `last_14d` - Ultimos 14 dias
- `last_30d` - Ultimos 30 dias
- `this_month` - Este mes
- `last_month` - Mes pasado

**Ejemplo:**
```
GET https://metasuite.dtgrowthpartners.com/api/campaigns/act_123456789?date_preset=last_30d
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123456789",
      "name": "CARLOS - Mi Campana",
      "status": "ACTIVE",
      "objective": "OUTCOME_TRAFFIC",
      "daily_budget": "50000",
      "lifetime_budget": null,
      "budget_remaining": "45000",
      "insights": {
        "campaign_name": "CARLOS - Mi Campana",
        "spend": "150000.50",
        "impressions": "50000",
        "reach": "35000",
        "cpm": "3000.01",
        "cpc": "500.00",
        "ctr": "2.5",
        "inline_link_clicks": "300",
        "actions": [
          { "action_type": "link_click", "value": "300" },
          { "action_type": "landing_page_view", "value": "280" }
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

### 5. Dashboard Completo (TODOS los datos)

```
GET https://metasuite.dtgrowthpartners.com/api/dashboard
```

**Con filtro de fecha:**
```
GET https://metasuite.dtgrowthpartners.com/api/dashboard?date_preset=last_30d
```

**Respuesta:**
```json
{
  "success": true,
  "timestamp": "2026-02-04T12:00:00.000Z",
  "datePreset": "maximum",
  "totals": {
    "totalAccounts": 5,
    "totalBusinesses": 2,
    "totalCampaigns": 12,
    "totalActiveCampaigns": 8,
    "totalPausedCampaigns": 4,
    "totalSpend": 500000,
    "totalImpressions": 250000,
    "totalReach": 180000
  },
  "businesses": [
    { "id": "987654321", "name": "Mi Negocio" }
  ],
  "accounts": [
    {
      "id": "act_123456789",
      "name": "Cuenta 1",
      "business_name": "Mi Negocio",
      "campaigns": [...],
      "campaignCount": 5,
      "activeCampaigns": 3,
      "pausedCampaigns": 2,
      "totalSpend": 100000,
      "totalImpressions": 50000,
      "totalReach": 35000
    }
  ]
}
```

---

### 6. Resumen Ejecutivo (Agrupado por Business)

```
GET https://metasuite.dtgrowthpartners.com/api/dashboard/summary
```

**Con filtro de fecha:**
```
GET https://metasuite.dtgrowthpartners.com/api/dashboard/summary?date_preset=last_30d
```

**Respuesta:**
```json
{
  "success": true,
  "timestamp": "2026-02-04T12:00:00.000Z",
  "datePreset": "maximum",
  "summary": [
    {
      "business_name": "Mi Negocio",
      "business_id": "987654321",
      "accounts": [
        {
          "account_id": "act_123456789",
          "account_name": "Cuenta 1",
          "campaigns": 5,
          "active": 3,
          "spend": 100000,
          "impressions": 50000,
          "reach": 35000
        }
      ],
      "totalSpend": 300000,
      "totalImpressions": 150000,
      "totalReach": 100000,
      "totalCampaigns": 10,
      "activeCampaigns": 7
    }
  ]
}
```

---

## Ejemplos de Uso para DTOS

### Obtener todas las cuentas publicitarias:
```
Haz una solicitud HTTP GET a:
https://metasuite.dtgrowthpartners.com/api/ad-accounts

Headers:
Content-Type: application/json
```

### Obtener campanas de una cuenta especifica:
```
Haz una solicitud HTTP GET a:
https://metasuite.dtgrowthpartners.com/api/campaigns/act_123456789?date_preset=last_30d

Headers:
Content-Type: application/json
```

### Obtener resumen completo del dashboard:
```
Haz una solicitud HTTP GET a:
https://metasuite.dtgrowthpartners.com/api/dashboard

Headers:
Content-Type: application/json
```

---

## Codigos de Estado de Cuenta

| Codigo | Significado |
|--------|-------------|
| 1 | ACTIVE |
| 2 | DISABLED |
| 3 | UNSETTLED |
| 7 | PENDING_RISK_REVIEW |
| 9 | IN_GRACE_PERIOD |
| 101 | CLOSED |

---

## Estados de Campana

| Estado | Descripcion |
|--------|-------------|
| `ACTIVE` | Campana activa y corriendo |
| `PAUSED` | Campana pausada |

---

## Notas Importantes

1. **Sin autenticacion adicional** - El token ya esta configurado en el backend
2. **Solo lectura** - Estos endpoints NO modifican datos
3. **Respuestas JSON** - Todas las respuestas son en formato JSON
4. **Manejo de errores** - Si hay error, la respuesta tendra `success: false`

---

**Version:** 1.0
**Ultima actualizacion:** Febrero 2026
**Restriccion:** SOLO LECTURA
