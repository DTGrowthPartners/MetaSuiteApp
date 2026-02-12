// ============================================
// SISTEMA DE PLANTILLAS DE CAMPAÑAS META ADS
// 7 plantillas principales para tu negocio
// ============================================

// Objetivos de campaña disponibles en Meta Ads
export const CAMPAIGN_OBJECTIVES = {
  OUTCOME_TRAFFIC: { label: 'Tráfico', icon: '🌐', description: 'Lleva personas a tu sitio web o evento' },
  OUTCOME_LEADS: { label: 'Clientes potenciales', icon: '📋', description: 'Recopila información de personas interesadas' },
  OUTCOME_SALES: { label: 'Ventas', icon: '💰', description: 'Encuentra personas que comprarán tus productos' },
  OUTCOME_ENGAGEMENT: { label: 'Interacción', icon: '💬', description: 'Genera mensajes y conversaciones' }
};

// Metas de optimización por objetivo
export const OPTIMIZATION_GOALS = {
  // Tráfico
  LANDING_PAGE_VIEWS: 'Vistas de página de destino',
  LINK_CLICKS: 'Clics en el enlace',
  // Leads
  LEAD_GENERATION: 'Clientes potenciales',
  OFFSITE_CONVERSIONS: 'Conversiones',
  // Ventas
  VALUE: 'Valor de conversión',
  // Interacción
  CONVERSATIONS: 'Conversaciones'
};

// Opciones de CTA disponibles
export const CTA_OPTIONS = [
  { value: 'LEARN_MORE', label: 'Más información' },
  { value: 'SHOP_NOW', label: 'Comprar' },
  { value: 'SIGN_UP', label: 'Registrarse' },
  { value: 'GET_QUOTE', label: 'Obtener cotización' },
  { value: 'CONTACT_US', label: 'Contactar' },
  { value: 'WHATSAPP_MESSAGE', label: 'WhatsApp' },
  { value: 'SEND_MESSAGE', label: 'Enviar mensaje' },
  { value: 'CALL_NOW', label: 'Llamar ahora' },
  { value: 'GET_DIRECTIONS', label: 'Cómo llegar' },
  { value: 'ORDER_NOW', label: 'Pedir ahora' },
  { value: 'BUY_NOW', label: 'Comprar ahora' },
  { value: 'MESSAGE_PAGE', label: 'Enviar mensaje a página' }
];

// Ubicaciones por plataforma
export const PLACEMENT_OPTIONS = {
  facebook: [
    { id: 'feed', label: 'Feed de Facebook' },
    { id: 'story', label: 'Stories' },
    { id: 'reels', label: 'Reels' },
    { id: 'marketplace', label: 'Marketplace' }
  ],
  instagram: [
    { id: 'stream', label: 'Feed de Instagram' },
    { id: 'story', label: 'Stories' },
    { id: 'reels', label: 'Reels' },
    { id: 'explore', label: 'Explorar' }
  ],
  messenger: [
    { id: 'messenger_home', label: 'Bandeja de entrada' },
    { id: 'story', label: 'Stories de Messenger' }
  ]
};

// Formatos de anuncio
export const AD_FORMATS = {
  SINGLE_IMAGE: { label: 'Imagen única', icon: '🖼️' },
  SINGLE_VIDEO: { label: 'Video único', icon: '🎬' },
  CAROUSEL: { label: 'Carrusel', icon: '🎠', minCards: 2, maxCards: 10 }
};

// ============================================
// FUNCIONES HELPER
// ============================================

// Obtener categorías únicas
export const getCategories = () => {
  const categories = new Set(CAMPAIGN_TEMPLATES.map(t => t.category));
  return ['all', ...Array.from(categories)];
};

// Obtener plantillas por categoría
export const getTemplatesByCategory = (category) => {
  if (category === 'all') return CAMPAIGN_TEMPLATES;
  return CAMPAIGN_TEMPLATES.filter(t => t.category === category);
};

// Obtener requisitos de una plantilla
export const getTemplateRequirements = (template) => {
  const requirements = {
    pixel: template.adSetConfig?.requiresPixel || false,
    whatsapp: template.adSetConfig?.requiresWhatsApp || 
              template.adSetConfig?.conversionLocation === 'WHATSAPP' ||
              template.adSetConfig?.conversionLocation === 'WHATSAPP',
    catalog: template.adSetConfig?.requiresCatalog || false,
    leadForm: template.adSetConfig?.conversionLocation === 'INSTANT_FORM' || false,
    website: template.adConfig?.destinationConfig?.type === 'WEBSITE' || false,
    phone: template.adSetConfig?.requiresPhoneNumber || false,
    instagram: template.adSetConfig?.requiresInstagram ||
               template.adSetConfig?.conversionLocation === 'INSTAGRAM_DIRECT' || false
  };
  return requirements;
};

// Obtener etiqueta legible del CTA
export const getCTALabel = (ctaValue) => {
  const cta = CTA_OPTIONS.find(c => c.value === ctaValue);
  return cta ? cta.label : ctaValue;
};

// ============================================
// PLANTILLAS DE CAMPAÑAS (7 total)
// ============================================

export const CAMPAIGN_TEMPLATES = [
  // ==========================================
  // 1. TRÁFICO A SITIO WEB
  // ==========================================
  {
    id: 'traffic_website',
    name: 'Tráfico a Sitio Web',
    icon: '🌐',
    category: 'Tráfico',
    description: 'Lleva visitantes a tu sitio web o landing page. Optimizado para vistas de página.',
    objective: 'OUTCOME_TRAFFIC',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'WEBSITE',
      optimizationGoal: 'LANDING_PAGE_VIEWS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      pixelEventType: null,
      budgetType: 'daily',
      suggestedBudget: 50000,
      minBudget: 15000,
      maxBudget: 500000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        allowLookalikes: true,
        defaultTargeting: {
          geo_locations: { countries: ['CO'] },
          age_min: 18,
          age_max: 65,
          genders: [0]
        }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: ['messenger_home']
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: {
        type: 'WEBSITE',
        requiresUrl: true,
        allowDisplayUrl: true,
        allowUtmParams: true
      },
      allowedCtas: ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'GET_QUOTE', 'CONTACT_US'],
      defaultCta: 'LEARN_MORE',
      trackingConfig: { requiresPixel: false, allowAppEvents: false }
    },
    creativeContent: {
      headlines: [
        '¡Descubre cómo transformar tu negocio!',
        'La solución que estabas buscando',
        'Resultados garantizados',
        'Empieza hoy mismo',
        'Tu éxito comienza aquí'
      ],
      descriptions: [
        'Miles de empresarios ya están usando esta estrategia para hacer crecer su negocio.',
        'Descubre el método probado que ha ayudado a cientos de emprendedores.',
        'No dejes pasar esta oportunidad única.',
        'Aprende los secretos que los expertos no quieren que sepas.',
        'Transforma tu vida y tu negocio con esta metodología revolucionaria.'
      ],
      primaryTexts: [
        '¿Estás listo para llevar tu negocio al siguiente nivel? Descubre cómo lograr resultados increíbles.',
        'Lo que nadie te cuenta sobre el éxito empresarial. Hoy te revelamos los secretos.',
        '¡Atención emprendedores! Esta es la oportunidad que estabas esperando.',
        'Si buscas resultados reales, esta es tu mejor opción.',
        'Deja de perder tiempo y dinero. Conoce la estrategia que realmente funciona.'
      ],
      ctas: ['LEARN_MORE', 'LEARN_MORE', 'SIGN_UP', 'LEARN_MORE', 'GET_QUOTE']
    }
  },

  // ==========================================
  // 2. CONVERSACIONES WHATSAPP (TRÁFICO)
  // ==========================================
  {
    id: 'traffic_whatsapp',
    name: 'Conversaciones WhatsApp',
    icon: '💬',
    category: 'Tráfico',
    description: 'Genera conversaciones directas en WhatsApp. Ideal para ventas consultivas.',
    objective: 'OUTCOME_TRAFFIC',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'WHATSAPP',
      optimizationGoal: 'CONVERSATIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      requiresWhatsApp: true,
      budgetType: 'daily',
      suggestedBudget: 45000,
      minBudget: 15000,
      maxBudget: 400000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        allowLookalikes: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'WHATSAPP', requiresUrl: false, requiresWhatsAppNumber: true },
      allowedCtas: ['WHATSAPP_MESSAGE', 'SEND_MESSAGE', 'GET_QUOTE', 'CONTACT_US'],
      defaultCta: 'WHATSAPP_MESSAGE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: [
        '¡Escríbenos ahora!',
        'Atención personalizada',
        'Respuesta inmediata',
        'Chatea con nosotros',
        'Te asesoramos gratis'
      ],
      descriptions: [
        'Escríbenos por WhatsApp y recibe atención inmediata.',
        'Nuestro equipo está listo para ayudarte.',
        'Resolvemos todas tus dudas al instante.',
        'Cotización sin compromiso por WhatsApp.',
        'Agenda tu cita por chat.'
      ],
      primaryTexts: [
        '¿Tienes preguntas? ¡Escríbenos por WhatsApp y te respondemos al instante!',
        'Atención personalizada a un clic de distancia. Escríbenos.',
        '¡Hola! Estamos aquí para ayudarte. Envíanos un mensaje y te atendemos.',
        'La forma más fácil de contactarnos. Un mensaje y listo.',
        'Cotiza sin compromiso. Solo escríbenos y te damos toda la información.'
      ],
      ctas: ['WHATSAPP_MESSAGE', 'WHATSAPP_MESSAGE', 'SEND_MESSAGE', 'GET_QUOTE', 'CONTACT_US']
    }
  },

  // ==========================================
  // 3. LEADS POR WHATSAPP
  // ==========================================
  {
    id: 'leads_whatsapp',
    name: 'Leads por WhatsApp',
    icon: '💬',
    category: 'Clientes potenciales',
    description: 'Captura leads a través de conversaciones en WhatsApp. Contacto directo.',
    objective: 'OUTCOME_LEADS',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'WHATSAPP',
      optimizationGoal: 'LEAD_GENERATION',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      requiresWhatsApp: true,
      budgetType: 'daily',
      suggestedBudget: 45000,
      minBudget: 15000,
      maxBudget: 400000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'WHATSAPP', requiresUrl: false, requiresWhatsAppNumber: true },
      allowedCtas: ['WHATSAPP_MESSAGE', 'GET_QUOTE', 'CONTACT_US', 'SEND_MESSAGE'],
      defaultCta: 'WHATSAPP_MESSAGE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: [
        'Cotiza por WhatsApp',
        'Asesoría gratis',
        'Escríbenos ahora',
        'Información al instante',
        'Consulta sin costo'
      ],
      descriptions: [
        'Envíanos un mensaje y te cotizamos.',
        'Asesoría personalizada por chat.',
        'Respuesta inmediata garantizada.',
        'Sin compromiso de compra.',
        'Tu consulta es importante.'
      ],
      primaryTexts: [
        '¿Interesado? Escríbenos por WhatsApp y te damos toda la información.',
        'Cotización personalizada en minutos. Solo envía un mensaje.',
        'Nuestros asesores están listos para atenderte por WhatsApp.',
        'La forma más fácil de obtener información. Un mensaje y listo.',
        'No te quedes con dudas. Escríbenos y resolvemos todo.'
      ],
      ctas: ['WHATSAPP_MESSAGE', 'GET_QUOTE', 'WHATSAPP_MESSAGE', 'CONTACT_US', 'SEND_MESSAGE']
    }
  },

  // ==========================================
  // 4. CONVERSIONES WEB (VENTAS)
  // ==========================================
  {
    id: 'sales_website',
    name: 'Conversiones Web',
    icon: '💰',
    category: 'Ventas',
    description: 'Genera ventas y conversiones en tu sitio web. Requiere Pixel de Meta.',
    objective: 'OUTCOME_SALES',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'WEBSITE',
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: true,
      pixelEventType: 'PURCHASE',
      budgetType: 'daily',
      suggestedBudget: 80000,
      minBudget: 30000,
      maxBudget: 1000000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        allowLookalikes: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore', 'shop'],
          messenger: ['messenger_home']
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'WEBSITE', requiresUrl: true, allowDisplayUrl: true, allowUtmParams: true },
      allowedCtas: ['SHOP_NOW', 'BUY_NOW', 'ORDER_NOW', 'GET_OFFER', 'LEARN_MORE'],
      defaultCta: 'SHOP_NOW',
      trackingConfig: { requiresPixel: true, pixelEvent: 'Purchase' }
    },
    creativeContent: {
      headlines: [
        '¡Compra ahora!',
        'Oferta especial',
        'Últimas unidades',
        'Envío gratis',
        'Precio exclusivo'
      ],
      descriptions: [
        'Compra hoy con descuento especial.',
        'Stock limitado, no te quedes sin el tuyo.',
        'Envío gratis en tu primera compra.',
        'Pago seguro garantizado.',
        'Satisfacción garantizada o te devolvemos tu dinero.'
      ],
      primaryTexts: [
        '¡Oferta exclusiva! Compra ahora y recibe un descuento especial.',
        'Miles de clientes satisfechos nos respaldan. ¿Qué esperas para unirte?',
        'La calidad que buscas al precio que mereces. Compra hoy.',
        'Stock limitado. No dejes que otros se lo lleven. Compra ahora.',
        'Tu compra está protegida. Si no te gusta, te devolvemos el dinero.'
      ],
      ctas: ['SHOP_NOW', 'BUY_NOW', 'ORDER_NOW', 'GET_OFFER', 'SHOP_NOW']
    }
  },

  // ==========================================
  // 5. VENTAS POR WHATSAPP
  // ==========================================
  {
    id: 'sales_whatsapp',
    name: 'Ventas por WhatsApp',
    icon: '💬',
    category: 'Ventas',
    description: 'Cierra ventas a través de WhatsApp. Ideal para productos que requieren asesoría.',
    objective: 'OUTCOME_SALES',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'WHATSAPP',
      optimizationGoal: 'CONVERSATIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      requiresWhatsApp: true,
      budgetType: 'daily',
      suggestedBudget: 55000,
      minBudget: 20000,
      maxBudget: 500000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'WHATSAPP', requiresUrl: false, requiresWhatsAppNumber: true },
      allowedCtas: ['WHATSAPP_MESSAGE', 'SHOP_NOW', 'GET_QUOTE', 'ORDER_NOW'],
      defaultCta: 'WHATSAPP_MESSAGE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: [
        'Compra por WhatsApp',
        'Pide el tuyo',
        'Haz tu pedido',
        'Compra fácil',
        'Ordena ahora'
      ],
      descriptions: [
        'Escríbenos y haz tu pedido por WhatsApp.',
        'Pago contra entrega disponible.',
        'Envío a todo el país.',
        'Atención personalizada.',
        'Compra segura y fácil.'
      ],
      primaryTexts: [
        '¿Te interesa? Escríbenos por WhatsApp y te ayudamos con tu compra.',
        'Comprar nunca fue tan fácil. Un mensaje y listo.',
        'Atención personalizada para tu pedido. Escríbenos ahora.',
        'Resolvemos tus dudas y procesamos tu pedido por WhatsApp.',
        'La forma más fácil de comprar. Envíanos un mensaje.'
      ],
      ctas: ['WHATSAPP_MESSAGE', 'SHOP_NOW', 'WHATSAPP_MESSAGE', 'ORDER_NOW', 'GET_QUOTE']
    }
  },

  // ==========================================
  // 6. MENSAJES WHATSAPP (INTERACCIÓN)
  // ==========================================
  {
    id: 'engagement_messages_wa',
    name: 'Mensajes WhatsApp',
    icon: '💬',
    category: 'Interacción',
    description: 'Genera conversaciones en WhatsApp. Optimizado para iniciar chats.',
    objective: 'OUTCOME_ENGAGEMENT',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'WHATSAPP',
      optimizationGoal: 'CONVERSATIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      requiresWhatsApp: true,
      budgetType: 'daily',
      suggestedBudget: 40000,
      minBudget: 15000,
      maxBudget: 350000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'WHATSAPP', requiresUrl: false, requiresWhatsAppNumber: true },
      allowedCtas: ['WHATSAPP_MESSAGE', 'SEND_MESSAGE', 'GET_QUOTE', 'CONTACT_US'],
      defaultCta: 'WHATSAPP_MESSAGE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: [
        'Hablemos',
        'Estamos en línea',
        'Escríbenos',
        'Chatea con nosotros',
        'Te esperamos'
      ],
      descriptions: [
        'Inicia una conversación con nosotros.',
        'Respuesta rápida garantizada.',
        'Atención personalizada.',
        'Resolvemos tus dudas.',
        'Siempre disponibles.'
      ],
      primaryTexts: [
        '¿Tienes preguntas? Escríbenos por WhatsApp y te respondemos al instante.',
        'Estamos aquí para ayudarte. Inicia una conversación ahora.',
        'Tu consulta es importante. Escríbenos y te atendemos.',
        'La comunicación directa que necesitas. Un mensaje y listo.',
        'Conecta con nosotros. Te esperamos en WhatsApp.'
      ],
      ctas: ['WHATSAPP_MESSAGE', 'SEND_MESSAGE', 'WHATSAPP_MESSAGE', 'GET_QUOTE', 'CONTACT_US']
    }
  },

  // ==========================================
  // 7. MENSAJES INSTAGRAM (INTERACCIÓN)
  // ==========================================
  {
    id: 'engagement_messages_ig',
    name: 'Mensajes Instagram',
    icon: '📸',
    category: 'Interacción',
    description: 'Genera mensajes directos en Instagram. Para marcas con presencia en IG.',
    objective: 'OUTCOME_ENGAGEMENT',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'INSTAGRAM_DIRECT',
      optimizationGoal: 'CONVERSATIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      requiresInstagram: true,
      budgetType: 'daily',
      suggestedBudget: 35000,
      minBudget: 15000,
      maxBudget: 300000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 45, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: false,
        defaultPlacements: {
          facebook: [],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'INSTAGRAM_DIRECT', requiresUrl: false },
      allowedCtas: ['SEND_MESSAGE', 'CONTACT_US', 'GET_QUOTE'],
      defaultCta: 'SEND_MESSAGE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: [
        'DM para más info',
        'Escríbenos en IG',
        'Chatea con nosotros',
        'Te respondemos',
        'Mensaje directo'
      ],
      descriptions: [
        'Envía un DM para más información.',
        'Respuesta rápida por Instagram.',
        'Atención personalizada en IG.',
        'Te esperamos en los DMs.',
        'Conecta con nosotros.'
      ],
      primaryTexts: [
        '¿Quieres saber más? Envíanos un DM y te contamos todo.',
        'Atención personalizada por Instagram. Escríbenos ahora.',
        'Tus preguntas, nuestras respuestas. Envía un mensaje directo.',
        'La forma más fácil de contactarnos en Instagram.',
        'Estamos en línea. Envía un DM y te atendemos.'
      ],
      ctas: ['SEND_MESSAGE', 'SEND_MESSAGE', 'CONTACT_US', 'GET_QUOTE', 'SEND_MESSAGE']
    }
  }
];
