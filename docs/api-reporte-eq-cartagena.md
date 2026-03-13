# API Reporte EQ Cartagena - Integración con Bot Maria

## Endpoint

```
GET https://metasuite.dtgrowthpartners.com/api/report/eq-cartagena?accessToken={TOKEN}
```

## Autenticación

El endpoint requiere un **Meta Access Token** válido con acceso a la cuenta publicitaria `act_1604918750004319` (EQ Cartagena).

Se pasa como query parameter:
```
accessToken=EAALFI7ZB5B9MBQ0jsmTQdiWShFRaZAIsul0nalJDnOTiXKKyZCFV1ACg3qvZBriIY5XzLaYpZCZAJoFKTXRcf33xBsmZACZB5hxLNqsXopvKAGMooqF33URxNrZAzwyg9hsVaXehh0l4Vg5t6CrKXx9ZACdjA0IqgN4y4NZBzMo3VZCt2o0tW8JMUmAIOkoFhjIkXpm9

> **Importante:** Los tokens de usuario de Facebook expiran. Para un bot que consulte automáticamente, se necesita un **token de larga duración** (60 días) o un **System User Token** (no expira) desde el Business Manager.

## Respuesta

```json
{
  "success": true,
  "accountId": "act_1604918750004319",
  "name": "EQ Cartagena",
  "businessName": "Equilibrio Clinic",
  "locations": ["Castellana", "Bocagrande"],
  "resultLabel": "Mensajes",
  "campaigns": [
    {
      "id": "120213456789",
      "name": "CARLOS - VENTAS WP Bocagrande",
      "status": "ACTIVE",
      "objective": "OUTCOME_SALES",
      "insightsYesterday": {
        "spend": "109313",
        "impressions": "15234",
        "reach": "12456",
        "actions": [
          { "action_type": "onsite_conversion.messaging_conversation_started_7d", "value": "15" },
          { "action_type": "link_click", "value": "113" }
        ],
        "inline_link_clicks": "113"
      },
      "insightsToday": {
        "spend": "36555",
        "actions": [
          { "action_type": "onsite_conversion.messaging_conversation_started_7d", "value": "8" },
          { "action_type": "link_click", "value": "39" }
        ]
      }
    }
  ],
  "dateRange": {
    "yesterday": "2026-03-12",
    "today": "2026-03-13"
  },
  "totalCampaigns": 9,
  "cached": false
}
```

## Lógica de fechas (corte 7am Colombia)

- **Antes de las 7am Colombia:** "ayer" = anteayer real, "hoy" = ayer real
- **Después de las 7am:** "ayer" = ayer real, "hoy" = hoy real

Esto significa que si el bot consulta a las 7am, `insightsYesterday` contiene los datos completos del día anterior.

## Cómo extraer los resultados por campaña

Cada campaña tiene `insightsYesterday` e `insightsToday`. Para obtener el resultado relevante:

### Mensajes (campañas WhatsApp/Messenger)
Buscar en `actions` el tipo:
```
onsite_conversion.messaging_conversation_started_7d
```
Si no existe, buscar:
```
onsite_conversion.messaging_first_reply
```

### Clicks (campañas de web)
Buscar en `actions`:
```
link_click
```

### Visitas a página (campañas de tráfico)
Buscar en `actions`:
```
landing_page_view
```

### Regla de prioridad
- Si `objective` = `OUTCOME_TRAFFIC` → mostrar `landing_page_view`
- Si tiene `messaging_conversation_started_7d` → mostrar como "Mensajes"
- Si no → mostrar `link_click` como "Clicks"

## Ejemplo: generar texto del reporte para WhatsApp

```python
import requests

TOKEN = "tu_meta_access_token"
url = f"https://metasuite.dtgrowthpartners.com/api/report/eq-cartagena?accessToken={TOKEN}"
data = requests.get(url).json()

if not data.get("success"):
    print("Error:", data.get("error"))
    exit()

fecha = data["dateRange"]["yesterday"]
campaigns = data["campaigns"]

# Filtrar campañas con gasto ayer
lines = []
total_spend = 0
total_msgs = 0

for c in campaigns:
    ins = c.get("insightsYesterday", {})
    spend = float(ins.get("spend", 0))
    if spend == 0:
        continue

    # Extraer mensajes
    msgs = 0
    for a in ins.get("actions", []):
        if a["action_type"] == "onsite_conversion.messaging_conversation_started_7d":
            msgs = int(a["value"])
            break
        if a["action_type"] == "onsite_conversion.messaging_first_reply":
            msgs = int(a["value"])

    # Extraer clicks (para campañas web)
    clicks = 0
    for a in ins.get("actions", []):
        if a["action_type"] == "link_click":
            clicks = int(a["value"])

    # Extraer visitas (para tráfico)
    lpv = 0
    for a in ins.get("actions", []):
        if a["action_type"] == "landing_page_view":
            lpv = int(a["value"])

    # Decidir resultado
    if c.get("objective") == "OUTCOME_TRAFFIC":
        result = f"{lpv} visitas" if lpv else f"{clicks} clicks"
    elif msgs > 0:
        result = f"{msgs} mensajes"
    elif clicks > 0:
        result = f"{clicks} clicks"
    else:
        result = "sin resultados"

    cost_per = f"${int(spend / msgs):,}" if msgs > 0 else "-"
    name = c["name"]

    lines.append(f"• {name}: {result} | Costo: {cost_per} | Gastado: ${int(spend):,}")
    total_spend += spend
    total_msgs += msgs

# Armar mensaje
msg = f"""📊 *Reporte EQ Cartagena*
📅 {fecha}

{chr(10).join(lines)}

💰 *Total gastado:* ${int(total_spend):,}
💬 *Total mensajes:* {total_msgs}
📊 *Costo promedio:* ${int(total_spend / total_msgs):,}/msn""" if total_msgs > 0 else ""

print(msg)
```

### Ejemplo de salida:
```
📊 Reporte EQ Cartagena
📅 2026-03-12

• CARLOS - VENTAS WP Bocagrande: 15 mensajes | Costo: $7,287 | Gastado: $109,313
• VENTAS similares: 12 mensajes | Costo: $16,420 | Gastado: $197,049
• VENTAS tibios: 8 mensajes | Costo: $25,369 | Gastado: $202,952
• VENTAS CALIENTES: 18 mensajes | Costo: $13,970 | Gastado: $251,462
• CLIENTES POTENCIALES WHATSAPP calientes: 22 mensajes | Costo: $16,432 | Gastado: $361,505
• trafico links mujer: 2100 visitas | Costo: - | Gastado: $58,079

💰 Total gastado: $1,180,360
💬 Total mensajes: 75
📊 Costo promedio: $15,738/msn
```

## Configuración del cron (7am Colombia)

El bot debe ejecutar la consulta diariamente a las **7:00am hora Colombia (UTC-5)**, que equivale a **12:00 UTC**.

```cron
0 12 * * * /path/to/script.py
```

## Notas

- El endpoint tiene **cache de 15 minutos**. Si se consulta varias veces seguidas, puede devolver `"cached": true`.
- Los valores de `spend` vienen en **COP** (pesos colombianos) como string.
- Las campañas desactivadas (PAUSED) con $0 de gasto no aparecen en los resultados filtrados por gasto, pero sí en la lista completa.
- El `slug` (`eq-cartagena`) identifica la cuenta. Se pueden agregar más cuentas en el servidor.
