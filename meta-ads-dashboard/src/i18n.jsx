import { createContext, useContext, useState } from 'react';

const translations = {
  es: {
    // App - Login
    login_title: 'MetaSuite', login_subtitle: 'Inicia sesión para administrar tus campañas publicitarias',
    login_button: 'Continuar con Facebook', login_connecting: 'Conectando...',
    login_error: 'No se pudieron cargar las cuentas publicitarias. Verifica el token de acceso.',
    accounts_count: 'cuentas', campaigns: 'Campañas', audiences: 'Públicos',
    logout: 'Cerrar sesión', loading: 'Cargando...', loading_accounts: 'Cargando cuentas publicitarias...',
    // Steps
    step_template: 'Plantilla', step_configure: 'Configurar', step_create: 'Crear',
    // Template selector
    select_template: 'Selecciona una Plantilla',
    select_template_desc: 'Elije el tipo de campaña que quieres crear. Ya viene pre-configurada.',
    all_categories: 'Todas',
    cat_traffic: 'Tráfico', cat_sales: 'Ventas', cat_leads: 'Clientes potenciales',
    cat_engagement: 'Interacción', cat_awareness: 'Reconocimiento',
    tpl_budget: 'Presupuesto', tpl_ctas: 'CTAs', tpl_per_day: 'COP/día',
    // Template names
    'Tráfico a Sitio Web': 'Website Traffic', 'Tráfico a Perfil Instagram': 'Instagram Profile Traffic',
    'Mensajes WhatsApp': 'WhatsApp Messages', 'Mensajes Instagram': 'Instagram Messages',
    'Conversiones Web': 'Web Conversions', 'Ventas WhatsApp': 'WhatsApp Sales',
    'Ventas Instagram DM': 'Instagram DM Sales', 'Clientes potenciales a WhatsApp': 'WhatsApp Leads',
    'Reconocimiento ThruPlay': 'ThruPlay Awareness',
    // Template categories
    'Tráfico': 'Traffic', 'Ventas': 'Sales', 'Clientes potenciales': 'Leads',
    'Interacción': 'Engagement', 'Reconocimiento': 'Awareness',
    // Config section
    campaign_name: 'Nombre de la campaña', campaign_name_placeholder: 'Nombre de tu campaña',
    ad_account: 'Cuenta publicitaria', select_account: 'Selecciona una cuenta',
    first_select_account: 'Primero selecciona una cuenta',
    page: 'Página de Facebook', select_page: 'Selecciona una página',
    ig_account: 'Cuenta de Instagram', select_ig: 'Selecciona una cuenta de Instagram',
    whatsapp_number: 'Número de WhatsApp', select_whatsapp: 'Selecciona un número',
    budget: 'Presupuesto diario', budget_cop: 'COP', budget_level: 'Nivel de presupuesto',
    budget_campaign: 'Campaña (CBO)', budget_adset: 'Por Ad Set',
    start_date: 'Fecha de inicio', end_date: 'Fecha de fin',
    destination_url: 'URL de destino', destination_url_placeholder: 'https://tusitio.com',
    // Audience section
    audience: 'Público', audience_shared: 'Público (compartido) *', audience_default: 'Público (por defecto) *',
    select_audience: 'Selecciona un público', no_audiences: 'No hay públicos disponibles',
    advantage_audience: 'Advantage+ Público',
    advantage_on_desc: 'La IA de Meta puede expandir la audiencia para encontrar mejores resultados fuera del público seleccionado.',
    advantage_off_desc: 'Solo se mostrará a las personas del público seleccionado, sin expansión.',
    advantage_on: 'ON', advantage_off: 'OFF',
    age: 'Edad', gender: 'Sexo', gender_all: 'Todos', gender_male: 'Hombres', gender_female: 'Mujeres',
    add_audience: '+ Selecciona otro público para crear otro conjunto',
    set_number: 'Conjunto',
    // Ads section
    ads_title: 'Anuncios', ad_count: 'Anuncio',
    ad_structure: 'Estructura de Anuncios',
    standard_ad: 'Anuncio Estándar', standard_desc: '1-1-1 Copys x Ad',
    per_ad: '1 Ad × 1 AdSet', per_ad_desc: '1 creativo x AdSet · público diferente',
    flexible_ad: 'Anuncio Flexible', flexible_desc: '1 Ad · 10 img/vid · 5-5-5 Copys',
    ad_name: 'Nombre del anuncio', ad_name_placeholder: 'Ad',
    audience_for_ad: 'Público para este anuncio', use_default: 'Usar público por defecto',
    // Media
    upload_files: 'Subir archivos', upload_uploading: 'Subiendo',
    upload_done: 'archivo(s) subido(s) correctamente',
    upload_wait: 'Los archivos pueden tardar 1-2 min en aparecer en la biblioteca de Meta. Recarga si no los ves.',
    media_library: 'Biblioteca de medios',
    // AI content
    ai_config: 'Configuración de textos IA',
    text_length: 'Longitud:', short: 'Corto', medium: 'Medio', long: 'Largo',
    ai_context: 'Contexto adicional para la IA (opcional)',
    ai_context_placeholder: "Ej: 'Somos una clinica de depilacion laser, enfocarnos en precios bajos...'",
    ai_context_hint_active: 'La IA usara tu contexto para generar los textos.',
    ai_context_hint_empty: 'Sin contexto: la IA generara textos basandose solo en el contenido multimedia que subas.',
    generate_ai: 'Generar 5+5+5 con IA', regenerate_ai: 'Regenerar 5+5+5 con IA', generating: 'Generando...',
    // Content editor
    primary_text: 'Textos Principales', headlines: 'Títulos',
    link_descriptions: 'Descripciones', cta: 'Llamada a la acción',
    // Actions
    add_ad: '+ Agregar Otro Anuncio', remove: 'Eliminar',
    continue_create: 'Continuar a Crear Campaña', processing: 'Procesando...',
    analyzing_ai: 'Analizando con IA',
    pending: 'pendiente', pendientes: 'pendientes',
    // Creating
    creating_campaign: 'Creando Campaña', sending_meta: 'Enviando a Meta Ads...',
    progress: 'Progreso',
    // Success
    campaign_created: 'Campaña Creada', campaign_adset_created: 'Campaña y Ad Set Creados',
    sets_ads_paused: 'conjunto(s) + anuncio(s) en estado pausado',
    campaign_paused: 'Tu campaña ha sido creada en estado pausado',
    open_ads_manager: 'Abrir en Ads Manager', create_another: 'Crear Otra Campaña',
    // Report
    yesterday: 'Ayer', today: 'Hoy', last_month: 'Mes pasado',
    results: 'Resultados', total_investment: 'Inversión Total', avg_cost: 'Costo Promedio',
    campaign_col: 'Campaña', result_col: 'Resultado', cost_per: 'Costo/res', spent: 'Gastado',
    total: 'Total', total_general: 'TOTAL GENERAL',
    no_data_yesterday: 'Sin datos para ayer', no_data_today: 'Sin datos para hoy',
    no_data_month: 'Sin datos para el mes pasado',
    refresh: 'Actualizar', updating: 'Actualizando...', pdf_month: 'PDF Mes', csv_month: 'CSV Mes',
    updated: 'Actualizado', cache: 'cache',
    // Errors
    no_access: 'Sin Acceso', no_access_msg: 'Tu cuenta de Facebook no tiene acceso a esta cuenta publicitaria.',
    error: 'Error', retry: 'Reintentar',
    // Misc
    back: 'Volver', or: 'o', yes: 'Sí', no: 'No', save: 'Guardar', cancel: 'Cancelar',
    confirm: 'Confirmar', close: 'Cerrar', search: 'Buscar',
    loading_report: 'Cargando reporte...',
    // Template names by ID (Spanish - these match the original template names)
    tpl_traffic_website: 'Tráfico a Sitio Web',
    tpl_traffic_website_desc: 'Lleva visitantes a tu sitio web o landing page. Optimizado para vistas de página.',
    tpl_traffic_instagram_profile: 'Tráfico a Perfil Instagram',
    tpl_traffic_instagram_profile_desc: 'Lleva personas a tu perfil de Instagram para ganar seguidores y visibilidad.',
    tpl_ventas_whatsapp: 'Ventas WhatsApp',
    tpl_ventas_whatsapp_desc: 'Genera ventas directamente por WhatsApp. Meta optimiza para personas con alta intención de compra.',
    tpl_engagement_messages_wa: 'Mensajes WhatsApp',
    tpl_engagement_messages_wa_desc: 'Maximiza conversaciones en WhatsApp. Meta optimiza para personas que probablemente inicien un chat.',
    tpl_engagement_messages_ig: 'Mensajes Instagram',
    tpl_engagement_messages_ig_desc: 'Genera mensajes directos en Instagram. Meta optimiza para personas que abran conversación en tus DMs.',
    tpl_ventas_instagram_direct: 'Ventas Instagram DM',
    tpl_ventas_instagram_direct_desc: 'Genera ventas directamente por DM de Instagram. Meta optimiza para personas con alta intención de compra.',
    tpl_sales_website: 'Conversiones Web',
    tpl_sales_website_desc: 'Genera ventas y conversiones en tu sitio web. Meta busca personas con alta intención de compra.',
    tpl_leads_whatsapp: 'Clientes potenciales a WhatsApp',
    tpl_leads_whatsapp_desc: 'Captura clientes potenciales a través de WhatsApp. Meta optimiza para personas que probablemente te escriban.',
    tpl_leads_instagram: 'Clientes potenciales a Instagram',
    tpl_leads_instagram_desc: 'Captura clientes potenciales a través de Instagram Direct. Meta optimiza para maximizar clientes potenciales por DM.',
    tpl_awareness_thruplay_messenger: 'Reconocimiento ThruPlay',
    tpl_awareness_thruplay_messenger_desc: 'Maximiza reproducciones de video (ThruPlay) para reconocimiento de marca.',
  },
  en: {
    // App - Login
    login_title: 'MetaSuite', login_subtitle: 'Sign in to manage your advertising campaigns',
    login_button: 'Continue with Facebook', login_connecting: 'Connecting...',
    login_error: 'Could not load ad accounts. Please verify your access token.',
    accounts_count: 'accounts', campaigns: 'Campaigns', audiences: 'Audiences',
    logout: 'Sign out', loading: 'Loading...', loading_accounts: 'Loading ad accounts...',
    // Steps
    step_template: 'Template', step_configure: 'Configure', step_create: 'Create',
    // Template selector
    select_template: 'Select a Template',
    select_template_desc: 'Choose the campaign type you want to create. Already pre-configured.',
    all_categories: 'All',
    cat_traffic: 'Traffic', cat_sales: 'Sales', cat_leads: 'Leads',
    cat_engagement: 'Engagement', cat_awareness: 'Awareness',
    tpl_budget: 'Budget', tpl_ctas: 'CTAs', tpl_per_day: 'COP/day',
    // Template names
    'Tráfico a Sitio Web': 'Website Traffic', 'Tráfico a Perfil Instagram': 'Instagram Profile Traffic',
    'Mensajes WhatsApp': 'WhatsApp Messages', 'Mensajes Instagram': 'Instagram Messages',
    'Conversiones Web': 'Web Conversions', 'Ventas WhatsApp': 'WhatsApp Sales',
    'Ventas Instagram DM': 'Instagram DM Sales', 'Clientes potenciales a WhatsApp': 'WhatsApp Leads',
    'Reconocimiento ThruPlay': 'ThruPlay Awareness',
    // Template categories
    'Tráfico': 'Traffic', 'Ventas': 'Sales', 'Clientes potenciales': 'Leads',
    'Interacción': 'Engagement', 'Reconocimiento': 'Awareness',
    // Config section
    campaign_name: 'Campaign name', campaign_name_placeholder: 'Your campaign name',
    ad_account: 'Ad account', select_account: 'Select an account',
    first_select_account: 'Select an account first',
    page: 'Facebook Page', select_page: 'Select a page',
    ig_account: 'Instagram Account', select_ig: 'Select an Instagram account',
    whatsapp_number: 'WhatsApp Number', select_whatsapp: 'Select a number',
    budget: 'Daily budget', budget_cop: 'COP', budget_level: 'Budget level',
    budget_campaign: 'Campaign (CBO)', budget_adset: 'Per Ad Set',
    start_date: 'Start date', end_date: 'End date',
    destination_url: 'Destination URL', destination_url_placeholder: 'https://yoursite.com',
    // Audience section
    audience: 'Audience', audience_shared: 'Audience (shared) *', audience_default: 'Audience (default) *',
    select_audience: 'Select an audience', no_audiences: 'No audiences available',
    advantage_audience: 'Advantage+ Audience',
    advantage_on_desc: 'Meta AI can expand the audience to find better results beyond the selected audience.',
    advantage_off_desc: 'Only people in the selected audience will see your ads, no expansion.',
    advantage_on: 'ON', advantage_off: 'OFF',
    age: 'Age', gender: 'Gender', gender_all: 'All', gender_male: 'Male', gender_female: 'Female',
    add_audience: '+ Select another audience to create another ad set',
    set_number: 'Ad Set',
    // Ads section
    ads_title: 'Ads', ad_count: 'Ad',
    ad_structure: 'Ad Structure',
    standard_ad: 'Standard Ad', standard_desc: '1-1-1 Copy per Ad',
    per_ad: '1 Ad × 1 AdSet', per_ad_desc: '1 creative per AdSet · different audience',
    flexible_ad: 'Flexible Ad', flexible_desc: '1 Ad · 10 img/vid · 5-5-5 Copy',
    ad_name: 'Ad name', ad_name_placeholder: 'Ad',
    audience_for_ad: 'Audience for this ad', use_default: 'Use default audience',
    // Media
    upload_files: 'Upload files', upload_uploading: 'Uploading',
    upload_done: 'file(s) uploaded successfully',
    upload_wait: 'Files may take 1-2 min to appear in Meta library. Reload if needed.',
    media_library: 'Media library',
    // AI content
    ai_config: 'AI text configuration',
    text_length: 'Length:', short: 'Short', medium: 'Medium', long: 'Long',
    ai_context: 'Additional context for AI (optional)',
    ai_context_placeholder: "E.g.: 'We are a laser hair removal clinic, focus on low prices...'",
    ai_context_hint_active: 'AI will use your context to generate the texts.',
    ai_context_hint_empty: 'No context: AI will generate texts based only on the media you upload.',
    generate_ai: 'Generate 5+5+5 with AI', regenerate_ai: 'Regenerate 5+5+5 with AI', generating: 'Generating...',
    // Content editor
    primary_text: 'Primary Text', headlines: 'Headlines',
    link_descriptions: 'Descriptions', cta: 'Call to Action',
    // Actions
    add_ad: '+ Add Another Ad', remove: 'Remove',
    continue_create: 'Continue to Create Campaign', processing: 'Processing...',
    analyzing_ai: 'Analyzing with AI',
    pending: 'pending', pendientes: 'pending',
    // Creating
    creating_campaign: 'Creating Campaign', sending_meta: 'Sending to Meta Ads...',
    progress: 'Progress',
    // Success
    campaign_created: 'Campaign Created', campaign_adset_created: 'Campaign and Ad Set Created',
    sets_ads_paused: 'set(s) + ad(s) in paused status',
    campaign_paused: 'Your campaign has been created in paused status',
    open_ads_manager: 'Open in Ads Manager', create_another: 'Create Another Campaign',
    // Report
    yesterday: 'Yesterday', today: 'Today', last_month: 'Last month',
    results: 'Results', total_investment: 'Total Investment', avg_cost: 'Average Cost',
    campaign_col: 'Campaign', result_col: 'Result', cost_per: 'Cost/result', spent: 'Spent',
    total: 'Total', total_general: 'GRAND TOTAL',
    no_data_yesterday: 'No data for yesterday', no_data_today: 'No data for today',
    no_data_month: 'No data for last month',
    refresh: 'Refresh', updating: 'Updating...', pdf_month: 'PDF Month', csv_month: 'CSV Month',
    updated: 'Updated', cache: 'cache',
    // Errors
    no_access: 'No Access', no_access_msg: 'Your Facebook account does not have access to this ad account.',
    error: 'Error', retry: 'Retry',
    // Misc
    back: 'Back', or: 'or', yes: 'Yes', no: 'No', save: 'Save', cancel: 'Cancel',
    confirm: 'Confirm', close: 'Close', search: 'Search',
    loading_report: 'Loading report...',
    // Template names by ID
    tpl_traffic_website: 'Website Traffic',
    tpl_traffic_website_desc: 'Drive visitors to your website or landing page. Optimized for page views.',
    tpl_traffic_instagram_profile: 'Instagram Profile Traffic',
    tpl_traffic_instagram_profile_desc: 'Drive people to your Instagram profile to gain followers and visibility.',
    tpl_ventas_whatsapp: 'WhatsApp Sales',
    tpl_ventas_whatsapp_desc: 'Generate sales directly through WhatsApp. Meta optimizes for high-intent buyers who start a conversation.',
    tpl_engagement_messages_wa: 'WhatsApp Messages',
    tpl_engagement_messages_wa_desc: 'Maximize WhatsApp conversations. Meta optimizes for people likely to start a chat.',
    tpl_engagement_messages_ig: 'Instagram Messages',
    tpl_engagement_messages_ig_desc: 'Generate Instagram direct messages. Meta optimizes for people who open conversations in your DMs.',
    tpl_ventas_instagram_direct: 'Instagram DM Sales',
    tpl_ventas_instagram_direct_desc: 'Generate sales through Instagram DMs. Meta optimizes for high-intent buyers who start a conversation.',
    tpl_sales_website: 'Web Conversions',
    tpl_sales_website_desc: 'Generate sales and conversions on your website. Meta finds people with high purchase intent.',
    tpl_leads_whatsapp: 'WhatsApp Leads',
    tpl_leads_whatsapp_desc: 'Capture qualified leads through WhatsApp. Meta optimizes for people likely to message you.',
    tpl_leads_instagram: 'Instagram Leads',
    tpl_leads_instagram_desc: 'Capture leads through Instagram Direct. Meta optimizes to maximize leads via DM.',
    tpl_awareness_thruplay_messenger: 'ThruPlay Awareness',
    tpl_awareness_thruplay_messenger_desc: 'Maximize video plays (ThruPlay) for brand awareness. Direct to messaging to start conversations.',
    // CTA labels (key = Spanish label from CTA_OPTIONS)
    'Más información': 'Learn More', 'Comprar': 'Shop Now', 'Comprar ahora': 'Buy Now',
    'Ordenar ahora': 'Order Now', 'Registrarse': 'Sign Up', 'Suscribirse': 'Subscribe',
    'Descargar': 'Download', 'Obtener oferta': 'Get Offer', 'Aplicar ahora': 'Apply Now',
    'Contactar': 'Contact Us', 'Obtener cotización': 'Get Quote', 'WhatsApp': 'WhatsApp',
    'Enviar mensaje (Messenger)': 'Send Message (Messenger)',
    'Enviar mensaje (Instagram)': 'Send Message (Instagram)',
    'Llamar ahora': 'Call Now', 'Cómo llegar': 'Get Directions',
    'Reservar': 'Book Now', 'Ir al perfil de Instagram': 'View Instagram Profile',
    // Requirement badges
    'URL': 'URL', 'Pixel': 'Pixel', 'Instagram': 'Instagram',
    // Destination options
    'Messenger': 'Messenger', 'Instagram Direct': 'Instagram Direct',
    'Sitio Web': 'Website',
  }
};

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('es');
  const t = (key) => translations[lang]?.[key] || translations['es']?.[key] || key;
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
      style={{
        background: 'rgba(99, 102, 241, 0.15)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        color: '#a5b4fc',
        borderRadius: '8px',
        padding: '6px 12px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.2s'
      }}
      title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      {lang === 'es' ? '🇺🇸 EN' : '🇨🇴 ES'}
    </button>
  );
}
