// Simple translation system — NO React Context, just a pure function
// Usage: tr('key', lang) where lang is 'es' or 'en'

const strings = {
  // ==================== APP ====================
  login_subtitle: { es: 'Inicia sesión para administrar tus campañas publicitarias', en: 'Sign in to manage your advertising campaigns' },
  login_button: { es: 'Continuar con Facebook', en: 'Continue with Facebook' },
  login_connecting: { es: 'Conectando...', en: 'Connecting...' },
  campaigns: { es: 'Campañas', en: 'Campaigns' },
  audiences: { es: 'Públicos', en: 'Audiences' },
  accounts_count: { es: 'cuentas', en: 'accounts' },
  loading: { es: 'Cargando...', en: 'Loading...' },
  error_label: { es: 'Error', en: 'Error' },

  // ==================== STEPS ====================
  step_template: { es: 'Plantilla', en: 'Template' },
  step_configure: { es: 'Configurar', en: 'Configure' },
  step_create: { es: 'Crear', en: 'Create' },

  // ==================== TEMPLATE SELECTOR ====================
  select_template: { es: 'Selecciona una Plantilla', en: 'Select a Template' },
  select_template_desc: { es: 'Elije el tipo de campaña que quieres crear. Ya viene pre-configurada.', en: 'Choose the campaign type you want to create. Already pre-configured.' },
  all_categories: { es: 'Todas', en: 'All' },
  tpl_budget: { es: 'Presupuesto', en: 'Budget' },
  tpl_per_day: { es: 'COP/día', en: 'COP/day' },

  // Categories
  'Tráfico': { es: 'Tráfico', en: 'Traffic' },
  'Ventas': { es: 'Ventas', en: 'Sales' },
  'Clientes potenciales': { es: 'Clientes potenciales', en: 'Leads' },
  'Interacción': { es: 'Interacción', en: 'Engagement' },
  'Reconocimiento': { es: 'Reconocimiento', en: 'Awareness' },

  // Template names
  tpl_traffic_website: { es: 'Tráfico a Sitio Web', en: 'Website Traffic' },
  tpl_traffic_website_desc: { es: 'Lleva visitantes a tu sitio web o landing page. Optimizado para vistas de página.', en: 'Drive visitors to your website or landing page. Optimized for page views.' },
  tpl_traffic_instagram_profile: { es: 'Tráfico a Perfil Instagram', en: 'Instagram Profile Traffic' },
  tpl_traffic_instagram_profile_desc: { es: 'Lleva personas a tu perfil de Instagram para ganar seguidores y visibilidad.', en: 'Drive people to your Instagram profile to gain followers and visibility.' },
  tpl_engagement_messages_wa: { es: 'Mensajes WhatsApp', en: 'WhatsApp Messages' },
  tpl_engagement_messages_wa_desc: { es: 'Maximiza conversaciones en WhatsApp. Meta optimiza para personas que probablemente inicien un chat.', en: 'Maximize WhatsApp conversations. Meta optimizes for people likely to start a chat.' },
  tpl_engagement_messages_ig: { es: 'Mensajes Instagram', en: 'Instagram Messages' },
  tpl_engagement_messages_ig_desc: { es: 'Genera mensajes directos en Instagram. Meta optimiza para personas que abran conversación en tus DMs.', en: 'Generate Instagram DMs. Meta optimizes for people who open conversations in your DMs.' },
  tpl_ventas_whatsapp: { es: 'Ventas WhatsApp', en: 'WhatsApp Sales' },
  tpl_ventas_whatsapp_desc: { es: 'Genera ventas directamente por WhatsApp. Meta optimiza para personas con alta intención de compra.', en: 'Generate sales through WhatsApp. Meta optimizes for high-intent buyers.' },
  tpl_ventas_instagram_direct: { es: 'Ventas Instagram DM', en: 'Instagram DM Sales' },
  tpl_ventas_instagram_direct_desc: { es: 'Genera ventas directamente por DM de Instagram.', en: 'Generate sales through Instagram DMs.' },
  tpl_sales_website: { es: 'Conversiones Web', en: 'Web Conversions' },
  tpl_sales_website_desc: { es: 'Genera ventas y conversiones en tu sitio web.', en: 'Generate sales and conversions on your website.' },
  tpl_leads_whatsapp: { es: 'Clientes potenciales a WhatsApp', en: 'WhatsApp Leads' },
  tpl_leads_whatsapp_desc: { es: 'Captura clientes potenciales a través de WhatsApp.', en: 'Capture qualified leads through WhatsApp.' },
  tpl_leads_instagram: { es: 'Clientes potenciales a Instagram', en: 'Instagram Leads' },
  tpl_leads_instagram_desc: { es: 'Captura clientes potenciales a través de Instagram Direct.', en: 'Capture leads through Instagram Direct.' },
  tpl_awareness_thruplay_messenger: { es: 'Reconocimiento ThruPlay', en: 'ThruPlay Awareness' },
  tpl_awareness_thruplay_messenger_desc: { es: 'Maximiza reproducciones de video (ThruPlay) para reconocimiento de marca.', en: 'Maximize video plays (ThruPlay) for brand awareness.' },

  // CTA labels
  'Más información': { es: 'Más información', en: 'Learn More' },
  'Comprar': { es: 'Comprar', en: 'Shop Now' },
  'Comprar ahora': { es: 'Comprar ahora', en: 'Buy Now' },
  'Registrarse': { es: 'Registrarse', en: 'Sign Up' },
  'Suscribirse': { es: 'Suscribirse', en: 'Subscribe' },
  'Descargar': { es: 'Descargar', en: 'Download' },
  'Obtener oferta': { es: 'Obtener oferta', en: 'Get Offer' },
  'Contactar': { es: 'Contactar', en: 'Contact Us' },
  'Obtener cotización': { es: 'Obtener cotización', en: 'Get Quote' },
  'Enviar mensaje (Messenger)': { es: 'Enviar mensaje (Messenger)', en: 'Send Message (Messenger)' },
  'Enviar mensaje (Instagram)': { es: 'Enviar mensaje (Instagram)', en: 'Send Message (Instagram)' },
  'Llamar ahora': { es: 'Llamar ahora', en: 'Call Now' },
  'Cómo llegar': { es: 'Cómo llegar', en: 'Get Directions' },
  'Reservar': { es: 'Reservar', en: 'Book Now' },
  'Ir al perfil de Instagram': { es: 'Ir al perfil de Instagram', en: 'View Instagram Profile' },

  // ==================== CONFIG FORM ====================
  campaign_name_label: { es: 'Nombre de la campaña', en: 'Campaign name' },
  campaign_name_placeholder: { es: 'Nombre de tu campaña', en: 'Your campaign name' },
  ad_account: { es: 'Cuenta publicitaria', en: 'Ad account' },
  select_account: { es: 'Selecciona una cuenta', en: 'Select an account' },
  first_select_account: { es: 'Primero selecciona una cuenta', en: 'Select an account first' },
  page_label: { es: 'Página de Facebook', en: 'Facebook Page' },
  select_page: { es: 'Selecciona una página', en: 'Select a page' },
  ig_account: { es: 'Cuenta de Instagram', en: 'Instagram Account' },
  whatsapp_number: { es: 'Número de WhatsApp', en: 'WhatsApp Number' },
  budget_label: { es: 'Presupuesto Diario', en: 'Daily Budget' },
  budget_campaign: { es: 'Campaña (CBO)', en: 'Campaign (CBO)' },
  budget_adset: { es: 'Por Ad Set', en: 'Per Ad Set' },
  start_date: { es: 'Fecha de inicio', en: 'Start date' },
  end_date: { es: 'Fecha de fin', en: 'End date' },
  destination_url: { es: 'URL de destino', en: 'Destination URL' },

  // ==================== AUDIENCE ====================
  audience_shared: { es: 'Público (compartido) *', en: 'Audience (shared) *' },
  audience_default: { es: 'Público (por defecto) *', en: 'Audience (default) *' },
  select_audience: { es: 'Selecciona un público', en: 'Select an audience' },
  no_audiences: { es: 'No hay públicos disponibles', en: 'No audiences available' },
  advantage_audience: { es: 'Advantage+ Público', en: 'Advantage+ Audience' },
  advantage_on_desc: { es: 'La IA de Meta puede expandir la audiencia para encontrar mejores resultados fuera del público seleccionado.', en: 'Meta AI can expand the audience to find better results beyond the selected audience.' },
  advantage_off_desc: { es: 'Solo se mostrará a las personas del público seleccionado, sin expansión.', en: 'Only people in the selected audience will see your ads, no expansion.' },
  age_label: { es: 'Edad', en: 'Age' },
  gender_label: { es: 'Sexo', en: 'Gender' },
  gender_all: { es: 'Todos', en: 'All' },
  gender_male: { es: 'Hombres', en: 'Male' },
  gender_female: { es: 'Mujeres', en: 'Female' },
  add_audience: { es: '+ Selecciona otro público para crear otro conjunto', en: '+ Select another audience to create another ad set' },
  set_label: { es: 'Conjunto', en: 'Ad Set' },
  audience_for_ad: { es: 'Público para este anuncio', en: 'Audience for this ad' },
  use_default_audience: { es: 'Usar público por defecto', en: 'Use default audience' },

  // ==================== ADS ====================
  ads_title: { es: 'Anuncios', en: 'Ads' },
  ad_structure: { es: 'Estructura de Anuncios', en: 'Ad Structure' },
  standard_ad: { es: 'Anuncio Estándar', en: 'Standard Ad' },
  standard_desc: { es: '1-1-1 Copys x Ad', en: '1-1-1 Copy per Ad' },
  per_ad: { es: '1 Ad × 1 AdSet', en: '1 Ad × 1 AdSet' },
  per_ad_desc: { es: '1 creativo x AdSet · público diferente', en: '1 creative per AdSet · different audience' },
  flexible_ad: { es: 'Anuncio Flexible', en: 'Flexible Ad' },
  flexible_desc: { es: '1 Ad · 10 img/vid · 5-5-5 Copys', en: '1 Ad · 10 img/vid · 5-5-5 Copy' },
  ad_name_label: { es: 'Nombre del anuncio', en: 'Ad name' },
  add_ad: { es: '+ Agregar Otro Anuncio', en: '+ Add Another Ad' },
  remove: { es: 'Eliminar', en: 'Remove' },
  ad_label: { es: 'Anuncio', en: 'Ad' },
  flexible_label: { es: 'Anuncio Flexible', en: 'Flexible Ad' },

  // ==================== MEDIA ====================
  upload_files: { es: 'Subir archivos', en: 'Upload files' },
  upload_uploading: { es: 'Subiendo', en: 'Uploading' },
  upload_done: { es: 'archivo(s) subido(s) correctamente', en: 'file(s) uploaded successfully' },
  upload_wait: { es: 'Los archivos pueden tardar 1-2 min en aparecer en la biblioteca de Meta. Recarga si no los ves.', en: 'Files may take 1-2 min to appear in Meta library. Reload if needed.' },

  // ==================== AI CONTENT ====================
  ai_config: { es: 'Configuración de textos IA', en: 'AI Text Configuration' },
  text_length: { es: 'Longitud:', en: 'Length:' },
  short: { es: 'Corto', en: 'Short' },
  medium: { es: 'Medio', en: 'Medium' },
  long: { es: 'Largo', en: 'Long' },
  ai_context_placeholder: { es: "Contexto adicional para la IA (opcional) - Ej: 'Somos una clinica de depilacion laser...'", en: "Additional context for AI (optional) - E.g.: 'We are a laser hair removal clinic...'" },
  ai_context_active: { es: 'La IA usara tu contexto para generar los textos.', en: 'AI will use your context to generate the texts.' },
  ai_context_empty: { es: 'Sin contexto: la IA generara textos basandose solo en el contenido multimedia que subas.', en: 'No context: AI will generate texts based only on the media you upload.' },
  generate_ai: { es: 'Generar 5+5+5 con IA', en: 'Generate 5+5+5 with AI' },
  regenerate_ai: { es: 'Regenerar 5+5+5 con IA', en: 'Regenerate 5+5+5 with AI' },
  generating: { es: 'Generando...', en: 'Generating...' },
  primary_text: { es: 'Textos Principales', en: 'Primary Text' },
  headlines: { es: 'Títulos', en: 'Headlines' },
  link_descriptions: { es: 'Descripciones', en: 'Descriptions' },
  cta_label: { es: 'Llamada a la acción', en: 'Call to Action' },

  // ==================== CONFIG PAGE ====================
  config_title: { es: 'Configuración de Campaña', en: 'Campaign Configuration' },
  config_subtitle: { es: 'Configura tu campaña siguiendo el flujo de Meta Ads Manager', en: 'Configure your campaign following the Meta Ads Manager flow' },
  change_template: { es: '← Cambiar plantilla', en: '← Change template' },
  view_content: { es: 'Ver contenido', en: 'View content' },
  // Config tabs
  tab_campaign: { es: 'Campaña', en: 'Campaign' },
  tab_identity: { es: 'Identidad', en: 'Identity' },
  tab_destination: { es: 'Destino', en: 'Destination' },
  tab_budget: { es: 'Presupuesto', en: 'Budget' },
  tab_audience: { es: 'Público', en: 'Audience' },
  tab_ads: { es: 'Anuncios', en: 'Ads' },
  // Campaign section
  section_campaign: { es: 'Campaña', en: 'Campaign' },
  campaign_name_label: { es: 'Nombre de la Campaña *', en: 'Campaign Name *' },
  campaign_prefix_hint: { es: 'Se agregará', en: 'Will be added' },
  campaign_prefix_hint2: { es: 'al inicio para identificar tus campañas', en: 'at the beginning to identify your campaigns' },
  ad_account_label: { es: 'Cuenta Publicitaria *', en: 'Ad Account *' },
  // Identity section
  section_identity: { es: 'Identidad', en: 'Identity' },
  page_hint: { es: 'La página desde la cual se publicará el anuncio', en: 'The page from which the ad will be published' },
  ig_hint: { es: 'El anuncio aparecerá también en Instagram con esta cuenta', en: 'The ad will also appear on Instagram with this account' },
  // Destination section
  section_destination: { es: 'Destino', en: 'Destination' },
  whatsapp_label: { es: 'Número de WhatsApp Business *', en: 'WhatsApp Business Number *' },
  whatsapp_not_found: { es: 'No se encontraron números de WhatsApp Business para esta cuenta publicitaria.', en: 'No WhatsApp Business numbers found for this ad account.' },
  whatsapp_hint: { es: 'Número con código de país sin espacios ni guiones ej: 573001234567', en: 'Number with country code, no spaces or dashes e.g.: 573001234567' },
  url_label: { es: 'URL de destino *', en: 'Destination URL *' },
  // Budget section
  section_budget: { es: 'Presupuesto y Calendario', en: 'Budget and Schedule' },
  budget_level_label: { es: 'Nivel de Presupuesto', en: 'Budget Level' },
  budget_campaign_btn: { es: 'Por Campaña (CBO)', en: 'Campaign (CBO)' },
  budget_adset_btn: { es: 'Por Conjunto de Anuncios', en: 'Per Ad Set' },
  budget_cbo_hint: { es: 'Meta distribuye el presupuesto automáticamente entre los conjuntos de anuncios', en: 'Meta distributes the budget automatically across ad sets' },
  budget_daily_label: { es: 'Presupuesto Diario (COP) *', en: 'Daily Budget (COP) *' },
  // Audience section
  section_audience: { es: 'Público por conjunto de anuncio', en: 'Audience per ad set' },
  saved_audience: { es: 'Público guardado', en: 'Saved audience' },
  custom_audience: { es: 'Personalizado', en: 'Custom' },
  select_audience_placeholder: { es: 'Selecciona un público', en: 'Select an audience' },
  set_label: { es: 'Conjunto', en: 'Ad Set' },
  // Ad modes
  dynamic_ad: { es: 'Anuncio Dinámico', en: 'Dynamic Ad' },
  dynamic_desc: { es: '1 creativo x Ad · 5-5-5 Copys', en: '1 creative per Ad · 5-5-5 Copy' },
  dynamic_hint: { es: 'Crea docenas de combinaciones automáticamente (5 títulos + 5 descripciones + 5 CTAs). Meta optimiza las mejores. Recomendado para la mayoría de campañas.', en: 'Creates dozens of combinations automatically (5 headlines + 5 descriptions + 5 CTAs). Meta optimizes the best ones. Recommended for most campaigns.' },
  // Ad content
  ad_name_placeholder: { es: 'Ad', en: 'Ad' },
  ad_content_label: { es: 'Contenido (Imagen/video)', en: 'Content (Image/video)' },
  media_empty: { es: 'Vacío', en: 'Empty' },
  media_library: { es: 'Biblioteca', en: 'Library' },
  media_upload: { es: 'Subir archivo', en: 'Upload file' },
  media_no_image: { es: 'Sin imagen/video, usará la vista previa del link.', en: 'No image/video, will use the link preview.' },
  titles_descriptions: { es: 'Títulos + Descripciones', en: 'Headlines + Descriptions' },

  // ==================== TEMPLATE PREVIEW ====================
  config_section: { es: 'Configuración', en: 'Configuration' },
  tpl_url_required: { es: 'URL de destino', en: 'Destination URL' },
  tpl_optimization: { es: 'Optimización', en: 'Optimization' },

  // ==================== MEDIA STATES ====================
  video_selected: { es: 'Video seleccionado', en: 'Video selected' },
  analyzing_video: { es: 'Analizando audio del video con IA...', en: 'Analyzing video audio with AI...' },
  analyzing_image: { es: 'Analizando imagen con IA...', en: 'Analyzing image with AI...' },
  add_media_first: { es: 'Agrega una imagen o video primero para generar contenido con IA', en: 'Add an image or video first to generate content with AI' },
  media_error_format: { es: 'Error: Solo se aceptan imágenes (JPG, PNG, WebP) o videos (MP4, MOV)', en: 'Error: Only images (JPG, PNG, WebP) or videos (MP4, MOV) accepted' },
  no_title: { es: 'Sin título', en: 'Untitled' },

  // ==================== AUDIENCE EXTRAS ====================
  no_saved_audiences: { es: 'No hay públicos guardados en esta cuenta. Puedes crear uno en Meta Ads Manager.', en: 'No saved audiences in this account. Create one in Meta Ads Manager.' },
  same_number: { es: 'Mismo número para todos', en: 'Same number for all' },
  per_adset_number: { es: 'Número por Ad Set', en: 'Number per Ad Set' },

  // ==================== MISC VISIBLE ====================
  all_sexes: { es: 'Todos los sexos', en: 'All genders' },
  men_only: { es: 'Solo hombres', en: 'Men only' },
  women_only: { es: 'Solo mujeres', en: 'Women only' },
  download_analyzing: { es: 'Descargando y analizando video con IA...', en: 'Downloading and analyzing video with AI...' },
  image_analyzing: { es: 'Analizando imagen con IA...', en: 'Analyzing image with AI...' },

  // ==================== CREATE ====================
  continue_create: { es: 'Continuar a Crear Campaña', en: 'Continue to Create Campaign' },
  processing: { es: 'Procesando...', en: 'Processing...' },
  analyzing_ai: { es: 'Analizando con IA', en: 'Analyzing with AI' },
  pending: { es: 'pendiente', en: 'pending' },
  creating_campaign: { es: 'Creando Campaña', en: 'Creating Campaign' },
  sending_meta: { es: 'Enviando a Meta Ads...', en: 'Sending to Meta Ads...' },
  progress: { es: 'Progreso', en: 'Progress' },

  // ==================== SUCCESS ====================
  campaign_created: { es: 'Campaña Creada', en: 'Campaign Created' },
  campaign_adset_created: { es: 'Campaña y Ad Set Creados', en: 'Campaign and Ad Set Created' },
  open_ads_manager: { es: 'Abrir en Ads Manager', en: 'Open in Ads Manager' },
  create_another: { es: 'Crear Otra Campaña', en: 'Create Another Campaign' },

  // ==================== REPORT ====================
  yesterday: { es: 'Ayer', en: 'Yesterday' },
  today: { es: 'Hoy', en: 'Today' },
  last_month: { es: 'Mes pasado', en: 'Last month' },
  results: { es: 'Resultados', en: 'Results' },
  total_investment: { es: 'Inversión Total', en: 'Total Investment' },
  avg_cost: { es: 'Costo Promedio', en: 'Average Cost' },
  campaign_col: { es: 'Campaña', en: 'Campaign' },
  result_col: { es: 'Resultado', en: 'Result' },
  cost_per: { es: 'Costo/res', en: 'Cost/result' },
  spent: { es: 'Gastado', en: 'Spent' },
  total_label: { es: 'Total', en: 'Total' },
  total_general: { es: 'TOTAL GENERAL', en: 'GRAND TOTAL' },
  no_data_yesterday: { es: 'Sin datos para ayer', en: 'No data for yesterday' },
  no_data_today: { es: 'Sin datos para hoy', en: 'No data for today' },
  no_data_month: { es: 'Sin datos para el mes pasado', en: 'No data for last month' },
  refresh: { es: 'Actualizar', en: 'Refresh' },
  updating: { es: 'Actualizando...', en: 'Updating...' },
  pdf_month: { es: 'PDF Mes', en: 'PDF Month' },
  csv_month: { es: 'CSV Mes', en: 'CSV Month' },
  loading_report: { es: 'Cargando reporte...', en: 'Loading report...' },
  no_access: { es: 'Sin Acceso', en: 'No Access' },
  no_access_msg: { es: 'Tu cuenta de Facebook no tiene acceso a esta cuenta publicitaria.', en: 'Your Facebook account does not have access to this ad account.' },
  retry: { es: 'Reintentar', en: 'Retry' },
  updated_label: { es: 'Actualizado', en: 'Updated' },
};

// Pure translation function — no React, no hooks, no Context
export function tr(key, lang) {
  if (!lang) lang = 'es';
  const entry = strings[key];
  if (!entry) return key; // Return key as-is if not found
  return entry[lang] || entry['es'] || key;
}

export default tr;
