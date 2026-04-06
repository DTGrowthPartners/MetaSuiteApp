import { createContext, useContext, useState } from 'react';

const translations = {
  es: {
    // App
    login_title: 'Gestión de Campañas Meta Ads',
    login_subtitle: 'Inicia sesión con Facebook para gestionar tus campañas publicitarias',
    login_button: 'Iniciar sesión con Facebook',
    login_error: 'No se pudieron cargar las cuentas publicitarias. Verifica el token de acceso.',
    accounts_count: 'cuentas',
    campaigns: 'Campañas',
    audiences: 'Públicos',
    logout: 'Cerrar sesión',
    loading: 'Cargando...',
    loading_accounts: 'Cargando cuentas publicitarias...',
    // CreativeBuilder - Templates
    select_template: 'Selecciona un tipo de campaña',
    all_categories: 'Todas',
    // CreativeBuilder - Config
    campaign_name: 'Nombre de la campaña',
    campaign_name_placeholder: 'Nombre de tu campaña',
    ad_account: 'Cuenta publicitaria',
    select_account: 'Selecciona una cuenta',
    page: 'Página de Facebook',
    select_page: 'Selecciona una página',
    ig_account: 'Cuenta de Instagram',
    budget: 'Presupuesto diario (COP)',
    budget_level: 'Nivel de presupuesto',
    budget_campaign: 'Campaña (CBO)',
    budget_adset: 'Por Ad Set',
    start_date: 'Fecha de inicio',
    end_date: 'Fecha de fin',
    // CreativeBuilder - Audience
    audience: 'Público',
    audience_shared: 'Público (compartido)',
    audience_default: 'Público (por defecto)',
    select_audience: 'Selecciona un público',
    no_audiences: 'No hay públicos disponibles',
    advantage_audience: 'Advantage+ Público',
    advantage_on: 'La IA de Meta puede expandir la audiencia para encontrar mejores resultados fuera del público seleccionado.',
    advantage_off: 'Solo se mostrará a las personas del público seleccionado, sin expansión.',
    age: 'Edad',
    gender: 'Sexo',
    gender_all: 'Todos',
    gender_male: 'Hombres',
    gender_female: 'Mujeres',
    // CreativeBuilder - Ads
    ads: 'Anuncios',
    ad_structure: 'Estructura de Anuncios',
    standard: 'Anuncio Estándar',
    standard_desc: '1-1-1 Copys x Ad',
    per_ad: '1 Ad × 1 AdSet',
    per_ad_desc: '1 creativo x AdSet · público diferente',
    flexible: 'Anuncio Flexible',
    flexible_desc: '1 Ad · 10 img/vid · 5-5-5 Copys',
    ad_name: 'Nombre del anuncio',
    upload_files: 'Subir archivos',
    media_library: 'Biblioteca de medios',
    generate_ai: 'Generar 5+5+5 con IA',
    regenerate_ai: 'Regenerar 5+5+5 con IA',
    generating: 'Generando...',
    ai_context: 'Contexto adicional para la IA (opcional)',
    text_length: 'Longitud:',
    short: 'Corto',
    medium: 'Medio',
    long: 'Largo',
    primary_text: 'Textos Principales',
    headlines: 'Títulos',
    link_descriptions: 'Descripciones',
    cta: 'Llamada a la acción',
    add_ad: '+ Agregar Otro Anuncio',
    remove: 'Eliminar',
    // CreativeBuilder - Create
    continue_create: 'Continuar a Crear Campaña',
    processing: 'Procesando...',
    creating_campaign: 'Creando Campaña',
    sending_meta: 'Enviando a Meta Ads...',
    campaign_created: 'Campaña Creada',
    open_ads_manager: 'Abrir en Ads Manager',
    create_another: 'Crear Otra Campaña',
    // Report
    yesterday: 'Ayer',
    today: 'Hoy',
    last_month: 'Mes pasado',
    results: 'Resultados',
    total_investment: 'Inversión Total',
    avg_cost: 'Costo Promedio',
    campaign: 'Campaña',
    result: 'Resultado',
    cost_per: 'Costo/res',
    spent: 'Gastado',
    total: 'Total',
    no_data: 'Sin datos',
    refresh: 'Actualizar',
    updating: 'Actualizando...',
    pdf_month: 'PDF Mes',
    csv_month: 'CSV Mes',
    // Errors
    no_access: 'Sin Acceso',
    no_access_msg: 'Tu cuenta de Facebook no tiene acceso a esta cuenta publicitaria.',
    error: 'Error',
    retry: 'Reintentar',
  },
  en: {
    // App
    login_title: 'Meta Ads Campaign Manager',
    login_subtitle: 'Sign in with Facebook to manage your advertising campaigns',
    login_button: 'Sign in with Facebook',
    login_error: 'Could not load ad accounts. Please verify your access token.',
    accounts_count: 'accounts',
    campaigns: 'Campaigns',
    audiences: 'Audiences',
    logout: 'Sign out',
    loading: 'Loading...',
    loading_accounts: 'Loading ad accounts...',
    // CreativeBuilder - Templates
    select_template: 'Select a campaign type',
    all_categories: 'All',
    // CreativeBuilder - Config
    campaign_name: 'Campaign name',
    campaign_name_placeholder: 'Your campaign name',
    ad_account: 'Ad account',
    select_account: 'Select an account',
    page: 'Facebook Page',
    select_page: 'Select a page',
    ig_account: 'Instagram Account',
    budget: 'Daily budget (COP)',
    budget_level: 'Budget level',
    budget_campaign: 'Campaign (CBO)',
    budget_adset: 'Per Ad Set',
    start_date: 'Start date',
    end_date: 'End date',
    // CreativeBuilder - Audience
    audience: 'Audience',
    audience_shared: 'Audience (shared)',
    audience_default: 'Audience (default)',
    select_audience: 'Select an audience',
    no_audiences: 'No audiences available',
    advantage_audience: 'Advantage+ Audience',
    advantage_on: 'Meta AI can expand the audience to find better results beyond the selected audience.',
    advantage_off: 'Only people in the selected audience will see your ads, no expansion.',
    age: 'Age',
    gender: 'Gender',
    gender_all: 'All',
    gender_male: 'Male',
    gender_female: 'Female',
    // CreativeBuilder - Ads
    ads: 'Ads',
    ad_structure: 'Ad Structure',
    standard: 'Standard Ad',
    standard_desc: '1-1-1 Copy per Ad',
    per_ad: '1 Ad × 1 AdSet',
    per_ad_desc: '1 creative per AdSet · different audience',
    flexible: 'Flexible Ad',
    flexible_desc: '1 Ad · 10 img/vid · 5-5-5 Copy',
    ad_name: 'Ad name',
    upload_files: 'Upload files',
    media_library: 'Media library',
    generate_ai: 'Generate 5+5+5 with AI',
    regenerate_ai: 'Regenerate 5+5+5 with AI',
    generating: 'Generating...',
    ai_context: 'Additional context for AI (optional)',
    text_length: 'Length:',
    short: 'Short',
    medium: 'Medium',
    long: 'Long',
    primary_text: 'Primary Text',
    headlines: 'Headlines',
    link_descriptions: 'Descriptions',
    cta: 'Call to Action',
    add_ad: '+ Add Another Ad',
    remove: 'Remove',
    // CreativeBuilder - Create
    continue_create: 'Continue to Create Campaign',
    processing: 'Processing...',
    creating_campaign: 'Creating Campaign',
    sending_meta: 'Sending to Meta Ads...',
    campaign_created: 'Campaign Created',
    open_ads_manager: 'Open in Ads Manager',
    create_another: 'Create Another Campaign',
    // Report
    yesterday: 'Yesterday',
    today: 'Today',
    last_month: 'Last month',
    results: 'Results',
    total_investment: 'Total Investment',
    avg_cost: 'Average Cost',
    campaign: 'Campaign',
    result: 'Result',
    cost_per: 'Cost/result',
    spent: 'Spent',
    total: 'Total',
    no_data: 'No data',
    refresh: 'Refresh',
    updating: 'Updating...',
    pdf_month: 'PDF Month',
    csv_month: 'CSV Month',
    // Errors
    no_access: 'No Access',
    no_access_msg: 'Your Facebook account does not have access to this ad account.',
    error: 'Error',
    retry: 'Retry',
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
