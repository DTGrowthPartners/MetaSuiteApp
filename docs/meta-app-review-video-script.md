# MetaSuite App Review — Guion de 6 Videos (uno por permiso)

Meta exige que cada permiso tenga su propio video mostrando el caso de uso completo. En vez de subir el mismo video largo a los 6 permisos, produciremos **6 videos cortos y enfocados**, cada uno dedicado a un único permiso.

## Estrategia de producción (1 sola sesión de grabación → 6 clips)

**No grabes 6 videos por separado.** En una sola sesión de ~20 minutos, grabas todo el flujo con pausas claras entre secciones. Después, en el editor, cortas 6 clips. Cada clip reutiliza el segmento del login.

### Orden de la grabación larga (una sola toma)
```
[00:00-00:30]  Login flow (se reutiliza en los 6 videos)
[00:30-00:45]  PAUSA — vuelvo al home sin cerrar sesión
[00:45-02:00]  Demo business_management
[02:00-02:15]  PAUSA
[02:15-03:30]  Demo pages_show_list
[03:30-03:45]  PAUSA
[03:45-05:00]  Demo instagram_basic
[05:00-05:15]  PAUSA
[05:15-08:00]  Demo ads_management (completo)
[08:00-08:15]  PAUSA
[08:15-10:30]  Demo ads_read
[10:30-10:45]  PAUSA
[10:45-12:30]  Demo pages_read_engagement
```

En el editor, cada video final se arma así:
`[LOGIN 00:00-00:30] + [DEMO específico del permiso]`

El login es idéntico en los 6 videos. Lo cortas una vez y lo pegas al inicio de cada clip.

---

## Preparación antes de grabar

- [ ] Cierra sesión en MetaSuite (`localStorage.clear()` en la consola).
- [ ] Limpia la caché del navegador.
- [ ] Cierra todas las pestañas excepto MetaSuite.
- [ ] Oculta la barra de marcadores del navegador.
- [ ] Zoom del navegador al 100%.
- [ ] Activa el resaltador de mouse en OBS ("Mouse click highlight").
- [ ] Deja la cuenta de Facebook ya logueada en OTRA pestaña — si el login pide contraseña, escríbela lento.
- [ ] Practica cada bloque una vez antes de grabar en serio.
- [ ] Resolución: **1080p (1920×1080), 60fps**.
- [ ] Idioma de UI: **Inglés** (toggle con la bandera).
- [ ] Narración: Español. Subtítulos en inglés quemados al final.

---

## Segmento LOGIN (reutilizable — 0:00 a 0:30)

Este segmento abre los 6 videos finales.

**[Pantalla]** Abre una pestaña nueva. Escribe `https://metasuite.dtgrowthpartners.com`. Enter. Aparece la pantalla de login.

**[Mouse]** Click en la bandera para asegurar que UI está en inglés.

**[Narración]**
> "Esta es MetaSuite de DT Growth Partners. Voy a iniciar sesión con el flujo estándar de OAuth 2.0 de Meta."

**[Mouse]** Click en "Continue with Facebook". Popup de OAuth abre.

**[Narración mientras carga]**
> "Este es el diálogo de consentimiento de Meta. Aquí se listan los permisos que la app solicita."

**[Mouse]** Desplaza lentamente por la lista de permisos (1 segundo por cada uno). Click en "Continue as …". El popup cierra, la app carga.

---

# VIDEO 1 — business_management

**Nombre del archivo:** `01-business_management.mp4`
**Duración objetivo:** 1:30
**Contenido:** Login (0:30) + Demo business_management (1:00)

## Demo (0:30 a 1:30)

**[Pantalla]** Estás en el home con el nav cargado. El header muestra `30 accounts · 12 Business Managers`.

**[Narración]**
> "MetaSuite usa el permiso business_management para enumerar todos los Business Managers a los que pertenece el usuario y listar cada cuenta publicitaria dentro de ellos. Aquí puedo ver: treinta cuentas distribuidas en doce Business Managers."

**[Mouse]** Pasa el cursor sobre el badge `30 accounts · 12 Business Managers`. Aparece el tooltip: *"Ad accounts loaded via business_management permission from all your Business Managers"*. Déjalo visible 2 segundos.

**[Narración]**
> "El tooltip confirma que estas cuentas vienen del permiso business_management. Voy a abrir el selector de cuenta publicitaria para mostrar que las cuentas están agrupadas por Business Manager."

**[Mouse]** Click en el dropdown de cuenta publicitaria. El dropdown abre y muestra las cuentas agrupadas por Business Manager (DT Growth Partners, Equilibrio Clinic, Innovación Fashion, etc.).

**[Narración]**
> "Cada grupo corresponde a un Business Manager. Sin business_management, el usuario tendría que configurar cada Business Manager manualmente. Este permiso es esencial para que una agencia que administra múltiples cuentas las pueda ver en un solo lugar."

**[Mouse]** Selecciona una cuenta (ej: "DTGP-CTG" de "DT Growth Partners"). El dropdown cierra.

**[Narración — cierre]**
> "Con esto queda demostrado el uso del permiso business_management."

---

# VIDEO 2 — pages_show_list

**Nombre del archivo:** `02-pages_show_list.mp4`
**Duración objetivo:** 1:30
**Contenido:** Login (0:30) + Demo pages_show_list (1:00)

## Demo (0:30 a 1:30)

**[Pantalla]** Estás en el home, ya con sesión iniciada.

**[Narración]**
> "Ahora voy a demostrar el permiso pages_show_list. Este permiso permite que la app obtenga la lista de páginas de Facebook que el usuario administra."

**[Mouse]** Selecciona una cuenta publicitaria desde el dropdown superior. Desplázate a la sección "Identity" del creative builder.

**[Narración]**
> "Como todo anuncio en Meta debe publicarse desde una página de Facebook, MetaSuite necesita pages_show_list para mostrar al usuario las páginas desde las que puede publicar."

**[Mouse]** Señala el hint bajo el dropdown "Facebook Page": *"Select the Facebook Page from your connected Business Managers that will publish this ad."* Déjalo visible 2 segundos.

**[Mouse]** Click en el dropdown "Facebook Page". Aparece la lista de páginas.

**[Narración]**
> "Aquí están todas las páginas cargadas mediante pages_show_list. El usuario elige desde cuál se publicará el anuncio."

**[Mouse]** Selecciona una página (ej: "DT Growth Partners"). El dropdown cierra.

**[Narración — cierre]**
> "La página seleccionada se usa como promoted_object.page_id cuando la campaña se crea. Con esto queda demostrado el uso del permiso pages_show_list."

---

# VIDEO 3 — instagram_basic

**Nombre del archivo:** `03-instagram_basic.mp4`
**Duración objetivo:** 1:30
**Contenido:** Login (0:30) + Demo instagram_basic (1:00)

## Demo (0:30 a 1:30)

**[Pantalla]** Estás en el home, ya con sesión iniciada.

**[Narración]**
> "Ahora voy a demostrar el permiso instagram_basic. Este permiso permite que la app identifique las cuentas profesionales de Instagram vinculadas a las páginas de Facebook del usuario."

**[Mouse]** Selecciona una cuenta publicitaria y una página de Facebook en el creative builder. Desplázate al dropdown "Instagram Account" en la sección "Identity".

**[Narración]**
> "Para que un anuncio pueda aparecer en Instagram, necesitamos saber qué cuenta profesional de Instagram está vinculada a la página de Facebook seleccionada. Eso es lo que permite instagram_basic."

**[Mouse]** Señala el hint bajo el dropdown: *"Select the Instagram professional account linked to your Facebook Page."* Déjalo visible 2 segundos.

**[Mouse]** Click en el dropdown "Instagram Account". La cuenta profesional vinculada aparece como "@dtgrowthpartners".

**[Narración]**
> "Aquí está la cuenta de Instagram vinculada a la página. Sin este permiso, la app no puede identificar qué cuenta de Instagram usar, y el anuncio no podría aparecer en superficies de Instagram."

**[Mouse]** Selecciona la cuenta de Instagram. El dropdown cierra.

**[Narración — cierre]**
> "Esta cuenta se adjunta al creativo del anuncio como instagram_user_id. Con esto queda demostrado el uso del permiso instagram_basic."

---

# VIDEO 4 — ads_management

**Nombre del archivo:** `04-ads_management.mp4`
**Duración objetivo:** 2:30
**Contenido:** Login (0:30) + Demo ads_management (2:00)

Este es el video más largo porque muestra la creación completa de una campaña. No puede ser más corto — Meta exige ver la experiencia completa.

## Demo (0:30 a 2:30)

**[Pantalla]** Estás en el home, ya con sesión iniciada.

**[Narración]**
> "Ahora voy a demostrar el permiso ads_management, que es la funcionalidad principal de la app: crear campañas publicitarias programáticamente. Importante: toda campaña creada desde MetaSuite queda en estado PAUSED, por lo que no se genera ningún gasto."

**[Mouse]** Click en "New Campaign" o el selector de plantilla. Selecciona la plantilla "Website Traffic".

**[Narración]**
> "Elijo la plantilla Website Traffic. Cada plantilla viene pre-configurada con objetivo, meta de optimización y presupuesto."

**[Mouse]** Desplázate y selecciona cuenta publicitaria, página de Facebook e Instagram (rápido, ya los vimos).

**[Narración]**
> "Selecciono rápidamente cuenta, página e Instagram — ya vimos estos flujos en los videos anteriores."

**[Mouse]** Sube una imagen desde el computador o elige de la Media Library.

**[Narración]**
> "Subo una imagen para el anuncio. Espero a que la IA genere automáticamente cinco titulares, cinco descripciones y cinco llamados a la acción."

**[Pantalla]** Espera a que aparezcan los copys generados por la IA (5-15 segundos). La UI muestra los headlines, descriptions y CTAs.

**[Narración]**
> "La IA ya generó el contenido. Uso Anthropic Claude para esto — no se envían datos de Meta a Anthropic, solo el brief del creativo."

**[Mouse]** Desplázate a la sección de audiencia / presupuesto. Deja los defaults (presupuesto pre-llenado en unos 20.000 COP).

**[Narración]**
> "Dejo el público y el presupuesto por defecto. Como la campaña queda en PAUSED, no se va a gastar nada realmente."

**[Mouse]** Click en "Create Campaign". Aparecen los logs de progreso en secuencia:
- Campaign creation SUCCESS
- AdSet creation SUCCESS
- Creative SUCCESS
- Ad creation SUCCESS

**[Narración mientras aparecen los logs]**
> "La app llama a la Marketing API en secuencia: Campaign, AdSet, Creative y Ad. Los cuatro se crean con status PAUSED."

**[Pantalla]** Abre una pestaña nueva con Meta Ads Manager. Navega a la cuenta publicitaria. Muestra la campaña recién creada en estado PAUSED.

**[Narración]**
> "Aquí está la campaña en Meta Ads Manager — confirmada como PAUSED. Cero gasto generado. El revisor puede verificar esto en su propio Ads Manager después."

**[Mouse]** Cierra la pestaña de Ads Manager, vuelve a MetaSuite.

**[Narración — cierre]**
> "Con esto queda demostrado el uso del permiso ads_management."

---

# VIDEO 5 — ads_read

**Nombre del archivo:** `05-ads_read.mp4`
**Duración objetivo:** 2:00
**Contenido:** Login (0:30) + Demo ads_read (1:30)

## Demo (0:30 a 2:00)

**[Pantalla]** Estás en el home, ya con sesión iniciada.

**[Narración]**
> "Ahora voy a demostrar el permiso ads_read. Este permiso nos permite leer datos de rendimiento de las campañas del usuario para construir dashboards y reportes."

**[Mouse]** Click en "Reportes" en el nav superior. Se abre la página /reportes.

**[Narración]**
> "Este es el hub de reportes. Usa el endpoint Insights API de Meta para agregar datos de todas las cuentas publicitarias del usuario."

**[Pantalla]** Se ven las tarjetas de KPI arriba: urgent, review, healthy, inactive.

**[Narración]**
> "Arriba mostramos una clasificación automática por urgencia: cuentas que gastaron hoy sin resultados aparecen como urgentes. Debajo, los totales del portafolio con deltas día a día."

**[Mouse]** Señala la fila de totales: "Total spend today", "Results today" con los % de variación.

**[Mouse]** Click en cualquier tarjeta urgente o fila de cuenta. Se abre el reporte detallado de esa cuenta en /act_xxxx.

**[Narración]**
> "Al hacer click en una cuenta se abre su reporte detallado. Tenemos tres tabs: Yesterday, Today y Last Month."

**[Mouse]** Click en el tab Yesterday. Espera 2 segundos. Click en Today. Espera 2 segundos. Click en Last Month. Espera 2 segundos.

**[Narración durante los tabs]**
> "Cada tab muestra gasto, impresiones, alcance y el desglose por campaña con el tipo de resultado principal — mensajes, leads, compras, visitas o clicks."

**[Mouse]** Desplázate al footer del reporte. Señala los botones "Download PDF" y "Download CSV".

**[Narración]**
> "Los mismos datos están disponibles como descarga en PDF o CSV."

**[Narración — cierre]**
> "Con esto queda demostrado el uso del permiso ads_read."

---

# VIDEO 6 — pages_read_engagement

**Nombre del archivo:** `06-pages_read_engagement.mp4`
**Duración objetivo:** 1:30
**Contenido:** Login (0:30) + Demo pages_read_engagement (1:00)

## Demo (0:30 a 1:30)

**[Pantalla]** Estás en el home, ya con sesión iniciada.

**[Narración]**
> "Para terminar, voy a demostrar el permiso pages_read_engagement. Este permiso nos permite leer métricas de engagement a nivel de página: alcance, impresiones, y los resultados generados por la página."

**[Mouse]** Click en "Reportes". Click en cualquier cuenta para abrir su reporte detallado.

**[Narración]**
> "Abro el reporte detallado de una cuenta. Aquí se mezclan datos de anuncios con datos de la página."

**[Mouse]** Click en el tab "Last Month". Desplázate arriba para mostrar "Reach" e "Impressions" de la cuenta.

**[Mouse]** Pasa el cursor sobre los valores de Reach e Impressions del mes. Déjalos visibles 2 segundos cada uno.

**[Narración]**
> "Reach e Impressions son métricas a nivel de cuenta que Meta calcula usando datos de la página que publicó el anuncio. Esto permite al operador conectar el rendimiento pagado con la página de Facebook."

**[Mouse]** Desplázate abajo para mostrar otras métricas de engagement (conversations, results, CPR).

**[Narración]**
> "Las métricas de conversaciones y resultados también vienen enriquecidas con datos de la página gracias a pages_read_engagement."

**[Mouse]** Click en "Download PDF" en el footer. Se abre el PDF en una pestaña nueva.

**[Narración]**
> "El mismo resumen mensual, con todas las métricas de la página, se genera como PDF descargable para compartir con clientes."

**[Mouse]** Espera 2 segundos a que cargue el PDF, luego cierra la pestaña.

**[Narración — cierre]**
> "Con esto queda demostrado el uso del permiso pages_read_engagement."

---

## Cómo editar los 6 videos (paso a paso)

### Plan de edición con un editor gratis (CapCut, DaVinci o Clipchamp)

1. **Importa la grabación larga** a un editor de video.
2. **Identifica en la timeline las marcas de pausas** (los 15 segundos entre cada sección donde estás quieto).
3. **Crea un "clip de login"** cortando los primeros 30 segundos (desde que abres el URL hasta que la app carga con tu nombre de usuario arriba). Guárdalo aparte.
4. **Para cada video final**, crea una nueva secuencia:
   - Arrastra el clip de login al inicio.
   - Arrastra el segmento específico de ese permiso justo después.
   - Aplica un fade-in de 0.5s al principio y fade-out de 0.5s al final.
5. **Exporta cada video como MP4, H.264, 1080p, 60fps, < 500 MB cada uno**.
6. Nómbralos exactamente así para que sea fácil cuando los subas:
   - `01-business_management.mp4`
   - `02-pages_show_list.mp4`
   - `03-instagram_basic.mp4`
   - `04-ads_management.mp4`
   - `05-ads_read.mp4`
   - `06-pages_read_engagement.mp4`

### Subtítulos en inglés (paso crítico)

Recomiendo **Whisper local** porque da mejor calidad en jerga técnica de ads que YouTube:

```bash
# Instalar una vez
pip install -U openai-whisper

# Generar subtítulos en inglés desde la grabación larga
whisper grabacion_larga.mp4 --language Spanish --task translate --model medium --output_format srt
```

Esto produce un `grabacion_larga.srt` con todo el audio transcrito y traducido a inglés.

Después de generarlo:
1. **Revisa el SRT a mano** — corrige términos como `ads_management`, `pages_show_list` (Whisper puede transcribirlos mal).
2. **Corta el SRT en 6 pedazos** usando un editor de texto, uno por cada video.
3. **Quema los subtítulos** en cada video con HandBrake o DaVinci Resolve (filter → subtitle burn-in).

### Al subir a Meta

En cada permiso del formulario:

1. **Sube el video correspondiente** (`01-business_management.mp4` al permiso `business_management`, etc.).
2. **En el campo de texto del caso de uso**, pega:

```
Dedicated screen recording for this permission. The video demonstrates
the complete Meta Login flow followed by the specific use case for
[NOMBRE DEL PERMISO]. Full implementation details and permission
relationships are documented in the attached
meta-app-review-instructions.txt file.
```

Reemplaza `[NOMBRE DEL PERMISO]` por el que corresponda.

3. **Adjunta `meta-app-review-instructions.txt`** en "Supporting documentation" (una sola vez).

---

## Si algo falla durante la grabación

Si el flujo de OAuth, una llamada a la API o la creación de la campaña tira un error, **PARA, soluciona y regraba desde cero**. Meta rechaza videos con errores visibles.

## Checklist antes de enviar la solicitud

- [ ] 6 videos MP4 exportados en 1080p.
- [ ] Cada video dura menos de 3 minutos.
- [ ] Cada video empieza con el login flow.
- [ ] UI en inglés en todo momento.
- [ ] Subtítulos en inglés quemados, revisados a mano.
- [ ] Cada video demuestra solo el permiso al que va adjuntado.
- [ ] `meta-app-review-instructions.txt` actualizado y adjunto.
- [ ] El nombre "MetaSuite" reemplazado por el nuevo nombre (si aplica).

Suerte con la grabación 🎬
