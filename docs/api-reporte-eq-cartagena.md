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
```

> **Importante:** Los tokens de usuario de Facebook expiran. Para un bot que consulte automáticamente, se necesita un **token de larga duración** (60 días) o un **System User Token** (no expira) desde el Business Manager.

## Respuesta

```json
{
  "success": true,
  "accountId": "act_1604918750004319",
  "name": "EQ Cartagena",
  "businessName": "Equilibrio Clinic",
  "campaigns": [
    {
      "id": "120213456789",
      "name": "VENTAS LASER BOCAGRANDE TESTIMONIOS",
      "status": "ACTIVE",
      "objective": "OUTCOME_SALES",
      "insightsYesterday": {
        "spend": "66262",
        "impressions": "9023",
        "reach": "8367",
        "actions": [
          { "action_type": "onsite_conversion.messaging_conversation_started_7d", "value": "23" },
          { "action_type": "lead", "value": "2" },
          { "action_type": "link_click", "value": "100" },
          { "action_type": "video_view", "value": "1605" }
        ],
        "inline_link_clicks": "100"
      },
      "insightsToday": { ... }
    }
  ],
  "dateRange": {
    "yesterday": "2026-03-18",
    "today": "2026-03-19"
  },
  "totalCampaigns": 10,
  "cached": false
}
```

## Lógica de fechas (corte 7am Colombia)

- **Antes de las 7am Colombia:** "ayer" = anteayer real, "hoy" = ayer real
- **Después de las 7am:** "ayer" = ayer real, "hoy" = hoy real

Esto significa que si el bot consulta a las 7am, `insightsYesterday` contiene los datos completos del día anterior.

## Cómo extraer TODAS las métricas por campaña

Cada campaña tiene `insightsYesterday` e `insightsToday`. Para generar el reporte completo, extraer de cada campaña:

### Métricas directas (campos del insight)
| Métrica | Campo | Formato |
|---------|-------|---------|
| Gasto | `spend` | COP como string (dividir entre 1 para entero) |
| Impresiones | `impressions` | String numérico |
| Alcance | `reach` | String numérico |

### Métricas de acciones (dentro del array `actions`)
| Métrica | `action_type` | Icono |
|---------|---------------|-------|
| Mensajes | `onsite_conversion.messaging_conversation_started_7d` | 💬 |
| Leads | `lead` | 🎯 |
| Clicks | `link_click` | 🖱️ |
| Video views | `video_view` | 🎬 |

Si `messaging_conversation_started_7d` no existe, buscar `onsite_conversion.messaging_first_reply` como fallback para mensajes.

### Métricas calculadas
| Métrica | Fórmula | Descripción |
|---------|---------|-------------|
| CPM | `(spend / impressions) * 1000` | Costo por mil impresiones |
| Costo x msg | `spend / mensajes` | Costo por cada mensaje recibido |
| Costo x lead | `spend / leads` | Costo por cada lead |

## Formato del reporte (OBLIGATORIO)

El reporte SIEMPRE debe seguir esta estructura exacta. Cada campaña muestra TODAS sus métricas disponibles:

```
Aquí va el reporte de ayer *{día} de {mes}* — Equilibrio Clinic 📊

---

*📢 Campañas activas ayer:*

*🔵 {NOMBRE CAMPAÑA}*
💰 ${gasto} | 📱 {impresiones} imp | 👥 {alcance} alcance
💬 {mensajes} mensajes | 🎯 {leads} leads | 🖱️ {clicks} clicks | 🎬 {views} views
💵 CPM ${cpm} | Costo x msg ${costo_por_msg}

(repetir para cada campaña con gasto > 0)

---

*RESUMEN DÍA:*
💰 Gasto total: ~${total_gasto} COP
💬 Mensajes totales: ~{total_msgs}
🎯 Leads: ~{total_leads}
🏆 Mejor: {campaña con menor costo x msg} (${menor_costo} x msg)
⚠️ A revisar: {campaña con mayor costo x msg} (${mayor_costo} x msg)
```

### Reglas del formato:
1. Solo mostrar métricas que existan (si no hay leads, no poner 🎯; si no hay views, no poner 🎬)
2. Si una campaña tiene mensajes > 0, mostrar "Costo x msg"
3. Si una campaña tiene leads > 0, mostrar "Costo x lead" en vez de o además de "Costo x msg"
4. Agregar ✅ a la campaña con menor costo por mensaje
5. El "Mejor" del resumen es la campaña con menor costo por resultado principal
6. El "A revisar" es la campaña con mayor costo por resultado principal
7. Los valores en COP se formatean con puntos como separador de miles (ej: $21.593)
8. El nombre de la campaña va en MAYÚSCULAS y en negrita

## Ejemplo completo de salida

```
Aquí va el reporte de ayer *18 de marzo* — Equilibrio Clinic 📊

---

*📢 Campañas activas ayer:*

*🔵 LASER BOCAGRANDE WP*
💰 $194.335 | 📱 23.755 imp | 👥 16.826 alcance
💬 9 mensajes | 🖱️ 112 clicks | 🎬 3.317 views
💵 CPM $8.181 | Costo x msg $21.593

*🔵 VENTAS LASER BOCAGRANDE (leads)*
💰 $158.700 | 📱 34.491 imp | 👥 23.186 alcance
💬 12 mensajes | 🎯 6 leads | 🖱️ 139 clicks
💵 CPM $4.601 | Costo x msg $13.225

*🔵 VENTAS LASER BOCAGRANDE TESTIMONIOS*
💰 $66.262 | 📱 9.023 imp | 👥 8.367 alcance
💬 23 mensajes | 🎯 2 leads | 🖱️ 100 clicks
💵 CPM $7.344 | Costo x msg $2.881 ✅

*🔵 VENTAS LASER CASTELLANA SIMILARES*
💰 $137.266 | 📱 19.409 imp | 👥 15.847 alcance
💬 16 mensajes | 🎯 4 leads | 🖱️ 81 clicks
💵 CPM $7.072 | Costo x msg $8.579

*🔵 VENTAS TIBIOS LASER CASTELLANA*
💰 $89.446 | 📱 14.417 imp | 👥 13.187 alcance
💬 13 mensajes | 🖱️ 66 clicks | 🎬 3.316 views
💵 CPM $6.204 | Costo x msg $6.880

*🔵 VENTAS CALIENTES LASER CASTELLANA*
💰 $138.755 | 📱 24.298 imp | 👥 18.521 alcance
💬 17 mensajes | 🎯 2 leads | 🖱️ 95 clicks
💵 CPM $5.711 | Costo x msg $8.162

*🔵 CALIENTES CLIENTES POT. LASER CASTELLANA*
💰 $175.362 | 📱 32.594 imp | 👥 25.271 alcance
💬 15 mensajes | 🎯 2 leads | 🖱️ 65 clicks
💵 CPM $5.380 | Costo x msg $11.691

*🔵 VENTAS LASER CASTELLANA TESTIMONIOS*
💰 $22.162 | 📱 5.192 imp | 👥 4.805 alcance
💬 15 mensajes | 🖱️ 37 clicks | 🎬 1.605 views
💵 CPM $4.268 | Costo x msg *$1.477* ✅ (mejor CPM)

*🔵 TENSAMAX CASTELLANA*
💰 $52.773 | 📱 4.004 imp | 👥 3.132 alcance
💬 19 mensajes | 🎯 2 leads | 🖱️ 31 clicks | 🎬 859 views
💵 Costo x msg $2.778

*🔵 TENSAMAX BOCAGRANDE*
💰 $69.385 | 📱 6.444 imp | 👥 4.953 alcance
💬 21 mensajes | 🎯 2 leads | 🖱️ 46 clicks | 🎬 1.358 views
💵 Costo x msg $3.304

---

*RESUMEN DÍA:*
💰 Gasto total: ~$1.104.446 COP
💬 Mensajes totales: ~160
🎯 Leads: ~20
🏆 Mejor: Testimonios Castellana ($1.477 x msg)
⚠️ A revisar: Laser Bocagrande WP ($21.593 x msg)
```

## Código Python de referencia

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
active = []
for c in campaigns:
    ins = c.get("insightsYesterday", {})
    spend = float(ins.get("spend", 0))
    if spend == 0:
        continue

    # Extraer todas las métricas de actions
    msgs = 0
    leads = 0
    clicks = 0
    views = 0
    for a in ins.get("actions", []):
        at = a["action_type"]
        val = int(a["value"])
        if at == "onsite_conversion.messaging_conversation_started_7d":
            msgs = val
        elif at == "onsite_conversion.messaging_first_reply" and msgs == 0:
            msgs = val
        elif at == "lead":
            leads = val
        elif at == "link_click":
            clicks = val
        elif at == "video_view":
            views = val

    impressions = int(ins.get("impressions", 0))
    reach = int(ins.get("reach", 0))
    cpm = (spend / impressions * 1000) if impressions > 0 else 0
    cost_per_msg = (spend / msgs) if msgs > 0 else 0

    active.append({
        "name": c["name"],
        "spend": spend,
        "impressions": impressions,
        "reach": reach,
        "msgs": msgs,
        "leads": leads,
        "clicks": clicks,
        "views": views,
        "cpm": cpm,
        "cost_per_msg": cost_per_msg
    })

# Formatear números COP (con puntos como separador de miles)
def fmt(n):
    return f"{int(n):,}".replace(",", ".")

# Encontrar mejor y peor
campaigns_with_msgs = [c for c in active if c["msgs"] > 0]
best = min(campaigns_with_msgs, key=lambda x: x["cost_per_msg"]) if campaigns_with_msgs else None
worst = max(campaigns_with_msgs, key=lambda x: x["cost_per_msg"]) if campaigns_with_msgs else None

# Construir mensaje
from datetime import datetime
fecha_dt = datetime.strptime(fecha, "%Y-%m-%d")
meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
fecha_fmt = f"{fecha_dt.day} de {meses[fecha_dt.month - 1]}"

lines = [f"Aquí va el reporte de ayer *{fecha_fmt}* — Equilibrio Clinic 📊\n\n---\n\n*📢 Campañas activas ayer:*\n"]

for c in active:
    is_best = best and c["name"] == best["name"]
    line = f"*🔵 {c['name'].upper()}*\n"
    line += f"💰 ${fmt(c['spend'])} | 📱 {fmt(c['impressions'])} imp | 👥 {fmt(c['reach'])} alcance\n"

    # Línea de resultados (solo métricas que existan)
    results = []
    if c["msgs"] > 0: results.append(f"💬 {c['msgs']} mensajes")
    if c["leads"] > 0: results.append(f"🎯 {c['leads']} leads")
    if c["clicks"] > 0: results.append(f"🖱️ {c['clicks']} clicks")
    if c["views"] > 0: results.append(f"🎬 {fmt(c['views'])} views")
    if results:
        line += " | ".join(results) + "\n"

    # Línea de costos
    costs = []
    if c["cpm"] > 0: costs.append(f"CPM ${fmt(c['cpm'])}")
    if c["cost_per_msg"] > 0:
        msg_cost = f"Costo x msg ${fmt(c['cost_per_msg'])}"
        if is_best: msg_cost += " ✅"
        costs.append(msg_cost)
    if costs:
        line += "💵 " + " | ".join(costs)

    lines.append(line)

# Resumen
total_spend = sum(c["spend"] for c in active)
total_msgs = sum(c["msgs"] for c in active)
total_leads = sum(c["leads"] for c in active)

resumen = f"\n---\n\n*RESUMEN DÍA:*\n"
resumen += f"💰 Gasto total: ~${fmt(total_spend)} COP\n"
resumen += f"💬 Mensajes totales: ~{total_msgs}\n"
if total_leads > 0:
    resumen += f"🎯 Leads: ~{total_leads}\n"
if best:
    resumen += f"🏆 Mejor: {best['name']} (${fmt(best['cost_per_msg'])} x msg)\n"
if worst and worst["name"] != best["name"]:
    resumen += f"⚠️ A revisar: {worst['name']} (${fmt(worst['cost_per_msg'])} x msg)"

lines.append(resumen)

msg = "\n\n".join(lines)
print(msg)
```

## Configuración del cron (7am Colombia)

El bot debe ejecutar la consulta diariamente a las **7:00am hora Colombia (UTC-5)**, que equivale a **12:00 UTC**.

```cron
0 12 * * * /path/to/script.py
```

**Frecuencia: de lunes a lunes (todos los días, sin descanso).**

## Glosario de métricas

| Sigla | Significado | Explicación |
|-------|-------------|-------------|
| **CPM** | Costo Por Mil (impresiones) | Cuánto cuesta que el anuncio se muestre 1.000 veces. Fórmula: `(gasto / impresiones) × 1000`. Un CPM bajo indica que el anuncio es eficiente llegando a personas. Ejemplo: CPM $5.000 significa que por cada $5.000 invertidos, el anuncio se mostró 1.000 veces. |
| **CPR** | Costo Por Resultado | Cuánto cuesta obtener un resultado (mensaje, lead, click, etc). Depende del tipo de campaña: si es de mensajes, el CPR es el costo por mensaje; si es de leads, el costo por lead. Un CPR bajo es mejor. Ejemplo: CPR $3.000 en una campaña de WhatsApp significa que cada mensaje costó $3.000. |
| **CPC** | Costo Por Click | Cuánto cuesta cada click en el enlace del anuncio. Fórmula: `gasto / clicks`. |
| **CTR** | Click-Through Rate | Porcentaje de personas que vieron el anuncio e hicieron click. Fórmula: `(clicks / impresiones) × 100`. |
| **Impresiones** | — | Número total de veces que se mostró el anuncio (una persona puede verlo varias veces). |
| **Alcance** | — | Número de personas únicas que vieron el anuncio. Siempre es menor o igual a impresiones. |

> **Resumen rápido:** CPM = eficiencia de visibilidad, CPR = eficiencia de resultados. Si el CPM es bajo pero el CPR es alto, el anuncio llega a mucha gente pero pocos actúan. Si ambos son bajos, la campaña es eficiente.

## Notas

- El endpoint tiene **cache de 15 minutos**. Si se consulta varias veces seguidas, puede devolver `"cached": true`.
- Los valores de `spend` vienen en **COP** (pesos colombianos) como string.
- Las campañas desactivadas (PAUSED) con $0 de gasto no aparecen en los resultados filtrados por gasto, pero sí en la lista completa.
- El `slug` (`eq-cartagena`) identifica la cuenta.
- La vista web del reporte está disponible en: `https://metasuite.dtgrowthpartners.com/eq-cartagena`
