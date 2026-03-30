# API Reporte ACB Fit - Integración con Bot Maria

## Endpoint

```
GET https://metasuite.dtgrowthpartners.com/api/report/acbfit?accessToken={TOKEN}
```

## Autenticación

El endpoint requiere un **Meta Access Token** válido con acceso a la cuenta publicitaria `act_1214099615878120` (ACB Fit).

Se pasa como query parameter:
```
?accessToken=EAALFI7ZB5B9MBQ0jsmTQdiWShFRaZAIsul0nalJDnOTiXKKyZCFV1ACg3qvZBriIY5XzLaYpZCZAJoFKTXRcf33xBsmZACZB5hxLNqsXopvKAGMooqF33URxNrZAzwyg9hsVaXehh0l4Vg5t6CrKXx9ZACdjA0IqgN4y4NZBzMo3VZCt2o0tW8JMUmAIOkoFhjIkXpm9
```

> **Importante:** Los tokens de usuario de Facebook expiran. Para un bot que consulte automáticamente, se necesita un **token de larga duración** (60 días) o un **System User Token** (no expira) desde el Business Manager.

## Respuesta

```json
{
  "success": true,
  "accountId": "act_1214099615878120",
  "name": "ACB Fit",
  "businessName": "ACB Fit",
  "campaigns": [
    {
      "id": "120213456789",
      "name": "Nombre de campaña",
      "status": "ACTIVE",
      "objective": "OUTCOME_SALES",
      "insightsYesterday": {
        "spend": "50000",
        "actions": [
          { "action_type": "onsite_conversion.messaging_conversation_started_7d", "value": "10" },
          { "action_type": "link_click", "value": "45" }
        ]
      },
      "insightsToday": {
        "spend": "20000",
        "actions": [...]
      }
    }
  ],
  "dateRange": {
    "yesterday": "2026-03-12",
    "today": "2026-03-13"
  },
  "totalCampaigns": 5,
  "cached": false
}
```

## Lógica de fechas (corte 7am Colombia)

- **Antes de las 7am Colombia:** "ayer" = anteayer real, "hoy" = ayer real
- **Después de las 7am:** "ayer" = ayer real, "hoy" = hoy real

Esto significa que si el bot consulta a las 7am, `insightsYesterday` contiene los datos completos del día anterior.

## Cómo extraer los resultados por campaña

Cada campaña tiene `insightsYesterday` e `insightsToday`. Para obtener el resultado relevante:

### Mensajes (campañas WhatsApp/Messenger/Instagram)
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
url = f"https://metasuite.dtgrowthpartners.com/api/report/acbfit?accessToken={TOKEN}"
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

# Armar mensaje — MODO CLIENTE (por defecto, simple)
# Ordenar por costo por mensaje (menor primero)
lines_sorted = sorted([(l, s, m) for l, s, m in zip(lines, spends, msgs_list)], key=lambda x: x[1]/x[2] if x[2] > 0 else 999999)

msg = f"""📊 *Reporte ACB Fit* — {fecha}

💬 {total_msgs} mensajes | 💰 ${int(total_spend):,} invertido

Top campañas:
{top 3 mejores con ✅}
{peor con ⚠️ si costo > promedio}
"""
print(msg)
```

## Formato del reporte — MODO CLIENTE (por defecto)

El reporte para el **cliente** debe ser SIMPLE. Sin CPM, impresiones ni alcance. Solo lo esencial:

```
📊 *Reporte ACB Fit* — {día} de {mes}

💬 {total_msgs} mensajes | 💰 ${total_gasto} invertido

📢 Campañas:
🔵 {nombre campaña} — 💰 ${gasto} | 💬 {msgs} msgs
🔵 {nombre campaña} — 💰 ${gasto} | 💬 {msgs} msgs
(todas las campañas con gasto > 0)
```

### Reglas modo cliente:
1. NO mostrar: CPM, impresiones, alcance, clicks, views, costo por mensaje
2. SÍ mostrar: cada campaña con su gasto y mensajes
3. Mostrar TODAS las campañas con gasto > 0
4. Si tiene leads, agregar 🎯 {leads} leads
5. Si tiene 0 mensajes, mostrar solo el gasto

## Formato del reporte — MODO DETALLADO (solo Edgardo o Dairo)

Se activa cuando Edgardo o Dairo dicen "detallado", "completo" o "todas las métricas":

```
📊 *Reporte detallado ACB Fit* — {día} de {mes}

*🔵 {NOMBRE CAMPAÑA}*
💰 ${gasto} | 📱 {imp} imp | 👥 {alcance} alcance
💬 {msgs} mensajes | 🖱️ {clicks} clicks | 🎬 {views} views
💵 CPM ${cpm} | Costo x msg ${costo}

(repetir para cada campaña)

RESUMEN:
💰 Total: ${gasto} | 💬 {msgs} msgs | 🏆 Mejor: {nombre} (${costo} x msg)
```

## Configuración del cron (7am Colombia)

El bot debe ejecutar la consulta diariamente a las **7:00am hora Colombia (UTC-5)**, que equivale a **12:00 UTC**.

```cron
0 12 * * * /path/to/script.py
```

**Frecuencia: de lunes a lunes (todos los días, sin descanso).**

## Notas

- El endpoint tiene **cache de 15 minutos**. Si se consulta varias veces seguidas, puede devolver `"cached": true`.
- Los valores de `spend` vienen en **COP** (pesos colombianos) como string.
- Las campañas desactivadas (PAUSED) con $0 de gasto no aparecen en los resultados filtrados por gasto, pero sí en la lista completa.
- El `slug` (`acbfit`) identifica la cuenta.
- La vista web del reporte está disponible en: `https://metasuite.dtgrowthpartners.com/acbfit`
