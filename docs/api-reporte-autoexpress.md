# API Reporte Auto Express Detailing - Integración con Bot Maria

## Endpoint

```
GET https://metasuite.dtgrowthpartners.com/api/report/autoexpress?accessToken={TOKEN}
```

## Autenticación

El endpoint requiere un **Meta Access Token** válido con acceso a la cuenta publicitaria de Auto Express Detailing.

Se pasa como query parameter:
```
?accessToken={TOKEN}
```

> **Importante:** Los tokens de usuario de Facebook expiran. Para un bot que consulte automáticamente, se necesita un **token de larga duración** (60 días) o un **System User Token** (no expira) desde el Business Manager.

## Respuesta

```json
{
  "success": true,
  "accountId": "act_1243999697726589",
  "name": "Auto Express Detailing",
  "businessName": "Auto Express Detailing",
  "campaigns": [
    {
      "id": "120213456789",
      "name": "VENTAS WP TENNIS",
      "status": "ACTIVE",
      "objective": "OUTCOME_SALES",
      "insightsYesterday": {
        "spend": "50000",
        "impressions": "8000",
        "reach": "6500",
        "actions": [
          { "action_type": "onsite_conversion.total_messaging_connection", "value": "15" },
          { "action_type": "link_click", "value": "80" },
          { "action_type": "video_view", "value": "1200" }
        ],
        "inline_link_clicks": "80"
      },
      "insightsToday": { ... }
    }
  ],
  "dateRange": {
    "yesterday": "2026-03-29",
    "today": "2026-03-30"
  },
  "accountReachYesterday": 25000,
  "accountImpressionsYesterday": 45000,
  "totalCampaigns": 5,
  "cached": false
}
```

## Lógica de fechas (corte 7am Colombia)

- **Antes de las 7am Colombia:** "ayer" = anteayer real, "hoy" = ayer real
- **Después de las 7am:** "ayer" = ayer real, "hoy" = hoy real

Esto significa que si el bot consulta a las 7am, `insightsYesterday` contiene los datos completos del día anterior.

## Cómo extraer las métricas por campaña

Cada campaña tiene `insightsYesterday` e `insightsToday`. Extraer de cada campaña:

### Métricas directas (campos del insight)
| Métrica | Campo | Formato |
|---------|-------|---------|
| Gasto | `spend` | COP como string (dividir entre 1 para entero) |
| Impresiones | `impressions` | String numérico |
| Alcance | `reach` | String numérico |

### Métricas de acciones (dentro del array `actions`)
| Métrica | `action_type` | Icono |
|---------|---------------|-------|
| Contactos de mensajes | `onsite_conversion.total_messaging_connection` | 💬 |
| Leads | `lead` | 🎯 |
| Clicks | `link_click` | 🖱️ |
| Video views | `video_view` | 🎬 |
| ThruPlays | `video_thruplay_watched_actions[0].value` | 🎬 |

**Prioridad para mensajes:** buscar en este orden:
1. `onsite_conversion.total_messaging_connection` (Contactos de mensajes totales — PREFERIDO)
2. `onsite_conversion.messaging_conversation_started_7d` (fallback)
3. `onsite_conversion.messaging_first_reply` (último fallback)

**El costo por mensaje se calcula:** `spend / contactos_de_mensajes_totales`

### Métricas calculadas
| Métrica | Fórmula | Descripción |
|---------|---------|-------------|
| CPM | `(spend / impressions) * 1000` | Costo por mil impresiones |
| Costo x msg | `spend / mensajes` | Costo por cada mensaje recibido |
| Costo x lead | `spend / leads` | Costo por cada lead |
| Costo x ThruPlay | `spend / video_thruplay_watched_actions[0].value` | Costo por cada reproducción completa (15+ seg) |

## Formato del reporte — MODO CLIENTE (por defecto)

El reporte para el **cliente** debe ser SIMPLE. Se envía como saludo + reporte por WhatsApp. El emoji del cuadro al lado del nombre de la campaña depende del tipo de campaña (ver tabla abajo).

### Emojis por tipo de campaña (según objective y nombre)
| Tipo | Emoji | Cómo detectar |
|------|-------|---------------|
| Ventas / WhatsApp / Mensajes | 🟥 | `objective` = OUTCOME_SALES, o nombre contiene: venta, ventas, whatsapp, wp, wasap |
| Reconocimiento / ThruPlay | 🟦 | `objective` = OUTCOME_AWARENESS, o nombre contiene: reconocimiento, thruplay, awareness |
| Tráfico | 🟩 | `objective` = OUTCOME_TRAFFIC, o nombre contiene: trafico, tráfico, traffic, perfil ig |
| Leads | 🟨 | `objective` = OUTCOME_LEADS, o nombre contiene: lead, clientes potenciales |
| Engagement | 🟪 | `objective` = OUTCOME_ENGAGEMENT |
| Otro | ⬜ | Cualquier otro |

### Estructura del reporte cliente:

```
👋 Buenos días Camilo, ¿cómo estás?

*📊 Reporte de Auto Express Detailing*
_{Día de la semana} {día} de {mes}_

📢 Campañas activas ayer:

{emoji}{NOMBRE CAMPAÑA}
{msgs} msg x ${costo_x_msg}

{emoji}{NOMBRE CAMPAÑA}
{msgs} msg x ${costo_x_msg}

(mostrar TODAS las campañas con gasto > 0)
(campañas de mensajes: msgs + costo x msg)
(campañas de reconocimiento/ThruPlay: 💰 ${gasto} | 🎬 {thruplay} ThruPlays | 💵 ${costo_x_thruplay} x ThruPlay)
(campañas de tráfico: 💰 ${gasto} | 🖱️ {clicks} visitas)

*RESUMEN DEL DÍA:*
💰 Gasto total: ${total_gasto}
💬 Mensajes totales: {total_msgs}
💵 Costo promedio x msg: ${costo_promedio_solo_mensajes}
👥 Cuentas alcanzadas: {accountReachYesterday}
📱 Impresiones totales: {accountImpressionsYesterday}

📋 Reporte preparado por
DT Growth Partners

¿Dudas o solicitudes?
📱 Dairo Traslaviña: +57 300 718 9383
```

### Reglas del modo cliente:
1. **Saludo personalizado:** "Buenos días Camilo"
2. **Emoji del cuadro** según tipo de campaña (tabla arriba)
3. **Nombre de campaña** tal cual viene de Meta (en mayúsculas)
4. **Solo 2 datos por campaña:** cantidad de mensajes + costo por mensaje
5. Mostrar TODAS las campañas con gasto > 0 (no solo las de mensajes)
6. Campañas de mensajes: mostrar msgs + costo x msg
7. Campañas de reconocimiento/ThruPlay: mostrar gasto + ThruPlays (de `video_thruplay_watched_actions[0].value`, NO `video_view`)
8. Campañas de tráfico: mostrar gasto + visitas o clicks
9. **Costo por mensaje por campaña** = `spend / contactos_de_mensajes_totales`
10. **Costo promedio x msg del RESUMEN** = SOLO sumar gasto de campañas con mensajes > 0 / total mensajes. NO incluir gasto de ThruPlay/reconocimiento/tráfico sin mensajes
7. El resumen incluye: gasto total, mensajes totales, costo promedio, alcance e impresiones
8. **Día de la semana** en español: Lunes, Martes, etc.

### Ejemplo modo cliente:

```
👋 Buenos días Camilo, ¿cómo estás?

*📊 Reporte de Auto Express Detailing*
_Domingo 29 de marzo_

📢 Campañas activas ayer:

🟥VENTAS WP TENNIS HOMBRES
18 msg x $4.200

🟥VENTAS WP TENNIS MUJERES
12 msg x $5.800

🟦RECONOCIMIENTO TENNIS CARTAGENA
0 msg (solo reconocimiento)

🟩TRAFICO PERFIL IG TENNIS
0 msg (solo tráfico)

*RESUMEN DEL DÍA:*
💰 Gasto total: $180.000
💬 Mensajes totales: 30
💵 Costo promedio x msg: $6.000
👥 Cuentas alcanzadas: 25.000
📱 Impresiones totales: 45.000

📋 Reporte preparado por
DT Growth Partners

¿Dudas o solicitudes?
📱 Dairo Traslaviña: +57 300 718 9383
```

### Contacto del negocio
| Negocio | Contacto | WhatsApp |
|---------|----------|----------|
| Auto Express Detailing | Camilo | Camilo |

---

## Formato del reporte — MODO DETALLADO (solo cuando Edgardo o Dairo lo pidan)

Este formato se usa ÚNICAMENTE cuando Edgardo Meza o Dairo lo soliciten explícitamente (ej: "dame el detallado", "reporte completo", "quiero ver todas las métricas"). Incluye todas las métricas técnicas por campaña.

```
Reporte detallado de ayer *{día} de {mes}* — Auto Express Detailing 📊

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

### Reglas del modo detallado:
1. Solo mostrar métricas que existan (si no hay leads, no poner 🎯; si no hay views, no poner 🎬)
2. Si una campaña tiene mensajes > 0, mostrar "Costo x msg"
3. Si una campaña tiene leads > 0, mostrar "Costo x lead" en vez de o además de "Costo x msg"
4. Agregar ✅ a la campaña con menor costo por mensaje
5. El "Mejor" del resumen es la campaña con menor costo por resultado principal
6. El "A revisar" es la campaña con mayor costo por resultado principal
7. Los valores en COP se formatean con puntos como separador de miles (ej: $21.593)
8. El nombre de la campaña va en MAYÚSCULAS y en negrita

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
- El `slug` (`autoexpress`) identifica la cuenta.
- La vista web del reporte está disponible en: `https://metasuite.dtgrowthpartners.com/autoexpress`
- **Alcance e impresiones** (`accountReachYesterday`, `accountImpressionsYesterday`) son a nivel de cuenta (deduplicados, cuentas únicas reales).
