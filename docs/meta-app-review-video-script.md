# MetaSuite App Review — Guion del video (palabra por palabra)

**Duración objetivo:** ~4 minutos
**Resolución:** 1080p (1920×1080), 60fps si es posible
**Idioma de la UI:** Inglés (obligatorio según la guía de Meta)
**Narración:** Español (natural para ti)
**Subtítulos:** Inglés quemados en el video (obligatorio — YouTube auto-caption → exportar .srt → quemar con cualquier editor)
**Ritmo:** Pausado. Deja 1 segundo de silencio antes y después de cada sección para que el revisor pueda saltar por timestamp.

### Preparación antes de grabar (hazlo en este orden)
- [ ] Cierra sesión en MetaSuite (`localStorage.clear()` en la consola del origen).
- [ ] Limpia la caché del navegador.
- [ ] Cierra todas las pestañas excepto MetaSuite.
- [ ] Oculta la barra de marcadores del navegador.
- [ ] Zoom del navegador al 100%.
- [ ] Activa un resaltador de mouse / clicks visible (OBS tiene "Mouse click highlight").
- [ ] Deja la cuenta de Facebook ya logueada en OTRA pestaña, para que el login no te pida contraseña dentro de la grabación. Si te la pide igual, no pasa nada, escríbela lento.
- [ ] Practica el guion una vez en voz alta antes de grabar.

---

## 00:00 – 00:20 · Intro + pantalla pre-login

**[Pantalla]** Inicia la grabación. Abre una pestaña nueva. Escribe: `https://metasuite.dtgrowthpartners.com`. Dale Enter. Aparece la pantalla de login.

**[Narración — di esto en voz alta]**:

> "Hola. Esta es MetaSuite, un dashboard para administrar campañas de Meta Ads de DT Growth Partners. En este video voy a mostrar cada uno de los permisos que la app solicita. Primero paso por el login de Meta y después demuestro cada permiso en contexto. La interfaz de la app está en inglés."

**[Mouse]** Mueve el cursor al botón de la bandera arriba a la derecha de la pantalla de login. Haz click para cambiar la UI a inglés si no está ya.

> "MetaSuite soporta español e inglés. Para esta revisión dejé la interfaz en inglés."

---

## 00:20 – 00:55 · Facebook Login + diálogo OAuth de consentimiento

**[Pantalla]** La pantalla de login muestra un botón grande "Continue with Facebook".

**[Narración]**

> "La autenticación usa el flujo estándar de OAuth 2.0 de Meta. Voy a hacer click en 'Continue with Facebook'."

**[Mouse]** Click en el botón "Continue with Facebook". Se abre el popup de OAuth de Meta.

**[Narración mientras carga el popup]**

> "Este es el diálogo de consentimiento de Meta. Aquí aparecen todos los permisos que la app solicita: ads_management, ads_read, pages_show_list, business_management, pages_read_engagement, instagram_basic y whatsapp_business_management."

**[Mouse]** Desplázate lentamente por la lista de permisos en el diálogo OAuth para que cada línea sea visible como un segundo.

**[Narración]**

> "Voy a continuar como el usuario logueado."

**[Mouse]** Click en "Continue as …". El popup se cierra. La app redirige de vuelta a MetaSuite. El header muestra el spinner de carga y luego los contadores.

---

## 00:55 – 01:25 · business_management — cuentas publicitarias de varios Business Managers

**[Pantalla]** Enfoca el nav superior. Hay un badge que dice, por ejemplo, "**30 accounts · 12 Business Managers**".

**[Narración]**

> "MetaSuite usa el permiso business_management para enumerar todos los Business Managers a los que pertenece el usuario y listar cada cuenta publicitaria dentro de ellos. Aquí pueden ver: treinta cuentas distribuidas en doce Business Managers. Sin business_management, el usuario tendría que configurar cada Business Manager manualmente."

**[Mouse]** Pasa el cursor sobre el badge "30 accounts · 12 Business Managers" — el tooltip explica que se carga mediante business_management.

**[Mouse]** Click en el dropdown de cuenta publicitaria en el creative builder (o abre la vista de Campañas si no está ya abierta). El dropdown lista las cuentas agrupadas por Business Manager.

**[Narración]**

> "Las cuentas están agrupadas por Business Manager para que el operador sepa exactamente dónde vive cada una. Voy a seleccionar una cuenta."

**[Mouse]** Selecciona una cuenta (por ejemplo "DTGP-CTG" de "DT Growth Partners"). El dropdown se cierra. Los campos relacionados (Pages, Instagram) empiezan a cargar.

---

## 01:25 – 01:55 · pages_show_list — dropdown de Facebook Pages

**[Pantalla]** Desplázate a la sección "Identity" del creative builder.

**[Narración]**

> "Como todo anuncio debe publicarse desde una página de Facebook, MetaSuite usa el permiso pages_show_list para obtener la lista de páginas desde las que el usuario puede publicar dentro de la cuenta publicitaria seleccionada. Pueden ver el hint explicativo debajo del dropdown."

**[Mouse]** Click en el dropdown "Facebook Page". Aparece la lista de páginas.

**[Narración mientras la lista está visible]**

> "Estas son las páginas cargadas mediante pages_show_list. Voy a elegir una."

**[Mouse]** Selecciona una página (por ejemplo "DT Growth Partners"). El dropdown se cierra. El hint debajo dice: "Select the Facebook Page from your connected Business Managers that will publish this ad."

---

## 01:55 – 02:20 · instagram_basic — dropdown de Instagram Account

**[Pantalla]** Mantente en la sección "Identity". Mueve el foco al dropdown "Instagram Account" justo debajo del dropdown de Page.

**[Narración]**

> "Para los anuncios que corren en Instagram, MetaSuite usa el permiso instagram_basic para identificar qué cuenta profesional de Instagram está vinculada a la página de Facebook seleccionada. El dropdown de abajo muestra el perfil de Instagram vinculado."

**[Mouse]** Click en el dropdown "Instagram Account". La cuenta profesional de Instagram vinculada aparece como "@dtgrowthpartners" (o equivalente).

**[Narración]**

> "Esta es la cuenta de Instagram que se va a adjuntar al creativo del anuncio. Sin instagram_basic, el anuncio no puede aparecer en Instagram."

**[Mouse]** Selecciona la cuenta de Instagram. El dropdown se cierra.

---

## 02:20 – 03:15 · ads_management — creación completa de campaña (en PAUSED)

**[Narración]**

> "Ahora el núcleo de la app: ads_management. Voy a crear una campaña completa de punta a punta. Toda campaña creada desde MetaSuite queda en estado PAUSED, por lo que no se genera gasto publicitario."

**[Mouse]** Desplázate hacia arriba al selector de plantilla o click en "New Campaign". Selecciona una plantilla, por ejemplo "Website Traffic".

**[Narración]**

> "Elijo la plantilla de Tráfico a Sitio Web. Cada plantilla ya viene con objetivo, meta de optimización, evento de facturación y presupuesto pre-configurados."

**[Mouse]** Desplázate al área de subida de media. Sube una imagen desde el computador o elige una de la Media Library.

**[Narración]**

> "Subo una imagen para este anuncio. La app también se integra con la biblioteca de medios de la cuenta publicitaria mediante el endpoint /adimages."

**[Mouse]** Espera a que termine la generación con IA. La app rellena 5 titulares, 5 descripciones y 5 CTAs.

**[Narración]**

> "MetaSuite usa la IA de Anthropic Claude para generar cinco titulares, cinco descripciones y cinco llamados a la acción. No se envía ningún dato de Meta a Claude, solo el brief del creativo."

**[Mouse]** Desplázate a la sección de público / presupuesto. Elige un público guardado por defecto (o deja los defaults). El presupuesto ya está pre-llenado.

**[Narración]**

> "Dejo el público y el presupuesto diario por defecto de veinte mil pesos. Pero recuerden: como la campaña queda en PAUSED, no se va a gastar nada realmente."

**[Mouse]** Click en el botón grande "Create Campaign". Empiezan a aparecer los logs de progreso:
- Campaign creation SUCCESS: …
- AdSet creation SUCCESS: …
- Creative SUCCESS: …
- Ad creation SUCCESS: …

**[Narración]**

> "La app ahora está llamando a la Marketing API en secuencia: Campaign, AdSet, Creative, Ad. Los cuatro objetos se crean con status PAUSED. Aquí está la confirmación de éxito."

**[Mouse]** OPCIONAL: abre una pestaña nueva con Meta Ads Manager, navega a la cuenta publicitaria y muestra la nueva campaña en estado PAUSED. Tarda 5 segundos y cierra.

> "Aquí está la campaña recién creada en Meta Ads Manager, confirmada como PAUSED. No se ha generado ningún gasto publicitario."

---

## 03:15 – 03:50 · ads_read — hub de reportes y dashboard por cuenta

**[Mouse]** Cierra la pestaña de Ads Manager. De vuelta en MetaSuite, click en el link "Reportes" en el nav.

**[Narración]**

> "MetaSuite usa el permiso ads_read para construir dashboards cruzados entre cuentas. El hub de reportes que ven ahora agrega gasto, resultados, alcance e impresiones de todas las cuentas publicitarias a las que el usuario tiene acceso."

**[Mouse]** Señala las tarjetas de KPI arriba: "urgent accounts", "in review", "healthy", "inactive". Señala la fila de totales del portafolio: "total spend today", "results today".

**[Narración]**

> "Arriba mostramos una clasificación de salud. Las cuentas urgentes son las que gastaron dinero hoy sin producir resultados. Abajo se ven los totales del portafolio con los deltas día contra día."

**[Mouse]** Click en cualquier tarjeta o fila de cuenta (por ejemplo "DTGP-CTG"). Se abre el reporte por cuenta en /act_781485172384812.

**[Narración]**

> "Al hacer click en una cuenta se abre su reporte detallado. Tenemos tres tabs: Yesterday, Today y Last Month. Cada tab muestra gasto, impresiones, alcance y el desglose por campaña con el tipo de resultado principal de cada una: mensajes, leads, compras, visitas o clicks."

**[Mouse]** Click en el tab Yesterday, después Today, después Last Month. Deja cada tab renderizar unos 3 segundos.

---

## 03:50 – 04:10 · pages_read_engagement — métricas a nivel de página

**[Pantalla]** Mantente en el tab Last Month del reporte por cuenta.

**[Narración]**

> "Por último, pages_read_engagement nos da acceso a las métricas de engagement a nivel de página: alcance, impresiones y resultados generados por la página, que mostramos junto a las métricas de anuncios para que el operador pueda conectar el rendimiento pagado con la página que publicó el anuncio."

**[Mouse]** Señala los campos "Reach", "Impressions" y los contadores de "conversations / results" en la parte de arriba del reporte. Pasa el mouse por cada uno como 1 segundo.

**[Mouse]** OPCIONAL: click en "Download PDF" en el footer para mostrar que el reporte mensual se abre en una pestaña nueva. Déjalo cargar y ciérralo.

**[Narración]**

> "Los mismos datos se incluyen en el PDF descargable. Con eso termina el recorrido."

---

## 04:10 – 04:20 · Cierre

**[Pantalla]** Vuelve al hub /reportes o a la vista home.

**[Narración]**

> "Gracias por revisar MetaSuite. El video cubre cada uno de los permisos solicitados: business_management para el acceso multi-cuenta, pages_show_list para el dropdown de páginas de Facebook, instagram_basic para la selección de cuenta de Instagram, ads_management para la creación de campañas en PAUSED, ads_read para el dashboard de reportes, y pages_read_engagement para las métricas a nivel de página. El caso de uso completo está descrito en el documento de instrucciones adjunto."

**[Pantalla]** Detén la grabación.

---

## Checklist después de grabar, antes de subir

- [ ] Abre la grabación y confirma que la resolución es 1080p o más.
- [ ] Confirma que todo el diálogo de consentimiento de OAuth se ve legible.
- [ ] Confirma que cada sección dura al menos 15 segundos para que el revisor pueda seguir.
- [ ] Genera los subtítulos en **inglés**. Opciones:
  - YouTube: sube el video privado → YouTube transcribe → traduce al inglés → exporta .srt → quema en el video con un editor.
  - Whisper local: `whisper video.mp4 --language Spanish --task translate --model medium` produce subtítulos en inglés.
  - Alternativamente DaVinci Resolve tiene transcripción y traducción incorporadas.
- [ ] Exporta como .mp4, H.264, menos de 2 GB (tope de Meta).
- [ ] Sube el mismo MP4 a los 6 permisos. Meta permite explícitamente subir el mismo video a cada permiso.
- [ ] En el campo de texto de cada permiso pega el bloque de cheat sheet de timestamps que está abajo.
- [ ] Adjunta el `meta-app-review-instructions.txt` actualizado en "Supporting documentation".

## Si algo falla durante la grabación
Si el flujo de OAuth, una llamada a la API o la creación de la campaña tira un error, **PARA, soluciónalo y regraba desde cero**. Meta rechaza videos con errores visibles.

## Bloque para pegar en cada permiso del formulario

```
Master video walkthrough. Relevant segment for this permission:

  business_management    00:55 – 01:25
  pages_show_list        01:25 – 01:55
  instagram_basic        01:55 – 02:20
  ads_management         02:20 – 03:15
  ads_read               03:15 – 03:50
  pages_read_engagement  03:50 – 04:10

Full context for every permission is in the attached
meta-app-review-instructions.txt document.
```
