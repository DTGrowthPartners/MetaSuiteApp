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
  VISIT_INSTAGRAM_PROFILE: 'Maximizar visitas al perfil de IG',
  // Leads
  LEAD_GENERATION: 'Clientes potenciales',
  OFFSITE_CONVERSIONS: 'Conversiones',
  // Ventas
  VALUE: 'Valor de conversión',
  // Interacción
  CONVERSATIONS: 'Conversaciones'
};

// Opciones de CTA disponibles
// CTAs compatibles con LINK_CLICKS + Dynamic Creative
export const CTA_OPTIONS = [
  { value: 'LEARN_MORE', label: 'Más información' },
  { value: 'SHOP_NOW', label: 'Comprar' },
  { value: 'BUY_NOW', label: 'Comprar ahora' },
  { value: 'ORDER_NOW', label: 'Ordenar ahora' },
  { value: 'SIGN_UP', label: 'Registrarse' },
  { value: 'SUBSCRIBE', label: 'Suscribirse' },
  { value: 'DOWNLOAD', label: 'Descargar' },
  { value: 'GET_OFFER', label: 'Obtener oferta' },
  { value: 'APPLY_NOW', label: 'Aplicar ahora' },
  { value: 'CONTACT_US', label: 'Contactar' },
  { value: 'GET_QUOTE', label: 'Obtener cotización' },
  { value: 'WHATSAPP_MESSAGE', label: 'WhatsApp' },
  { value: 'SEND_MESSAGE', label: 'Enviar mensaje' },
  { value: 'CALL_NOW', label: 'Llamar ahora' },
  { value: 'GET_DIRECTIONS', label: 'Cómo llegar' },
  { value: 'BOOK_TRAVEL', label: 'Reservar' },
  { value: 'VISIT_INSTAGRAM_PROFILE', label: 'Ir al perfil de Instagram' }
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
  // 2. VENTAS WHATSAPP
  // ==========================================
  {
    id: 'ventas_whatsapp',
    name: 'Ventas WhatsApp',
    icon: '💰',
    category: 'Ventas',
    description: 'Genera ventas directamente por WhatsApp. Meta optimiza para personas con alta intención de compra que inicien conversación.',
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
      allowBudgetLevel: true, // Permite elegir entre CBO (campaña) o presupuesto por Ad Set
      budgetType: 'daily',
      suggestedBudget: 50000,
      minBudget: 15000,
      maxBudget: 500000,
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
      allowedCtas: ['WHATSAPP_MESSAGE', 'SHOP_NOW', 'GET_QUOTE', 'ORDER_NOW', 'CONTACT_US'],
      defaultCta: 'WHATSAPP_MESSAGE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: [
        'Haz tu pedido ahora',
        'Compra fácil por WhatsApp',
        'Precio especial por chat',
        'Reserva el tuyo hoy',
        'Pago contra entrega'
      ],
      descriptions: [
        'Escríbenos y te procesamos tu pedido al instante por WhatsApp.',
        'Pago contra entrega o transferencia. Tú eliges cómo pagar.',
        'Envío a todo el país. Tu pedido llega a la puerta de tu casa.',
        'Atención personalizada. Te ayudamos a elegir la mejor opción.',
        'Precio especial solo por WhatsApp. Escríbenos para conocerlo.'
      ],
      primaryTexts: [
        '¡Haz tu pedido por WhatsApp! Es súper fácil: escríbenos, elige tu producto, y te lo enviamos. Pago contra entrega disponible.',
        '¿Te gusta lo que ves? Escríbenos ahora por WhatsApp y te damos un precio especial. Stock limitado, no te quedes sin el tuyo.',
        'Comprar por WhatsApp es más fácil de lo que piensas. Un mensaje, eliges tu talla/modelo, pagas y listo. Envío rápido.',
        'Oferta exclusiva por WhatsApp. Escríbenos ahora y recibe un descuento especial en tu primera compra. No dejes pasar esta oportunidad.',
        '¿Tienes dudas sobre el producto? Escríbenos por WhatsApp, te asesoramos y si quieres, haces tu pedido en el momento. Sin presión.'
      ],
      ctas: ['WHATSAPP_MESSAGE', 'WHATSAPP_MESSAGE', 'SHOP_NOW', 'WHATSAPP_MESSAGE', 'GET_QUOTE']
    }
  },

  // ==========================================
  // 3. LEADS POR WHATSAPP
  // ==========================================
  {
    id: 'leads_whatsapp',
    name: 'Leads por WhatsApp',
    icon: '📋',
    category: 'Clientes potenciales',
    description: 'Captura leads calificados a través de WhatsApp. Meta optimiza para personas que probablemente te escriban.',
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
        'Solicita tu presupuesto',
        'Pide información gratis',
        'Cotiza sin compromiso',
        'Recibe asesoría experta',
        'Tu consulta es gratis'
      ],
      descriptions: [
        'Envía un mensaje y recibe tu cotización personalizada en minutos.',
        'Asesoría profesional gratuita. Solo escribe "Quiero info" por WhatsApp.',
        'Te respondemos en menos de 5 minutos con toda la información.',
        'Sin compromiso de compra. Pregunta lo que necesites.',
        'Nuestro equipo de asesores te atiende ahora mismo.'
      ],
      primaryTexts: [
        '¿Buscas la mejor opción? Solicita tu presupuesto por WhatsApp y recibe una cotización personalizada sin compromiso. Te respondemos al instante.',
        'Más de 500 personas nos contactaron esta semana. Escríbenos por WhatsApp y descubre por qué somos la mejor opción para ti.',
        '¡Atención! Estamos ofreciendo asesoría gratuita por WhatsApp. Envía un mensaje ahora y un experto te guía paso a paso.',
        'No compres a ciegas. Primero escríbenos por WhatsApp, te damos toda la información y luego tú decides. Sin presión.',
        'Recibe una propuesta personalizada en minutos. Solo envía un "Hola" por WhatsApp y nuestro equipo hace el resto.'
      ],
      ctas: ['WHATSAPP_MESSAGE', 'WHATSAPP_MESSAGE', 'GET_QUOTE', 'WHATSAPP_MESSAGE', 'CONTACT_US']
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
    description: 'Genera ventas y conversiones en tu sitio web. Meta busca personas con alta intención de compra.',
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
        'Compra ahora y ahorra',
        'Oferta por tiempo limitado',
        'Últimas unidades disponibles',
        'Envío gratis hoy',
        'Descuento exclusivo online'
      ],
      descriptions: [
        'Aprovecha este descuento especial antes de que se acabe. Compra segura.',
        'Stock limitado. Miles ya compraron el suyo. No te quedes sin el tuyo.',
        'Envío gratis en compras hoy. Pago seguro con todos los medios.',
        'Garantía de satisfacción. Si no te gusta, te devolvemos tu dinero.',
        'Precio exclusivo solo por esta semana. Ahorra hasta 50% en tu compra.'
      ],
      primaryTexts: [
        '¡Oferta flash! Solo por hoy con descuento especial. Compra ahora antes de que se agote. Envío rápido y pago seguro.',
        'Miles de clientes satisfechos ya tienen el suyo. Calidad premium al mejor precio. ¿Qué esperas para comprar?',
        'La mejor relación calidad-precio del mercado. Compra hoy y recíbelo en tu puerta. Satisfacción garantizada.',
        '¡Últimas unidades! Este producto se agota rápido. Asegura el tuyo ahora con envío gratis y pago contra entrega.',
        'Tu compra está 100% protegida. Pago seguro, envío rastreado y garantía de devolución. Compra con total confianza.'
      ],
      ctas: ['SHOP_NOW', 'SHOP_NOW', 'BUY_NOW', 'GET_OFFER', 'ORDER_NOW']
    }
  },

  // ==========================================
  // 5. MENSAJES WHATSAPP (INTERACCIÓN)
  // ==========================================
  {
    id: 'engagement_messages_wa',
    name: 'Mensajes WhatsApp',
    icon: '💬',
    category: 'Interacción',
    description: 'Maximiza conversaciones en WhatsApp. Meta optimiza para personas que probablemente inicien un chat.',
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
        '¿Tienes dudas? Pregúntanos',
        'Estamos en línea ahora',
        'Un mensaje y te ayudamos',
        'Chat directo con nosotros',
        'Respuesta inmediata'
      ],
      descriptions: [
        'Estamos conectados ahora mismo. Escríbenos y te respondemos al instante.',
        'Tu pregunta es importante. Nuestro equipo te atiende por WhatsApp.',
        'Sin llamadas, sin correos. Solo un mensaje y te ayudamos.',
        'Atención 100% personalizada por chat. Escríbenos ahora.',
        'Siempre disponibles para ti. Envía un mensaje cuando quieras.'
      ],
      primaryTexts: [
        '¿Tienes preguntas? Estamos en línea ahora mismo. Escríbenos por WhatsApp y te respondemos al instante. Sin esperas.',
        '¡Hola! Queremos ayudarte. Envíanos un mensaje por WhatsApp con tu consulta y nuestro equipo te atiende de inmediato.',
        'La forma más rápida de comunicarte con nosotros. Un mensaje por WhatsApp y listo. Te esperamos.',
        'No te quedes con la duda. Escríbenos por WhatsApp y te damos la información que necesitas. Es gratis y sin compromiso.',
        'Conecta con nosotros al instante. Nuestro equipo está listo para atenderte por WhatsApp. ¡Escríbenos!'
      ],
      ctas: ['WHATSAPP_MESSAGE', 'WHATSAPP_MESSAGE', 'WHATSAPP_MESSAGE', 'SEND_MESSAGE', 'CONTACT_US']
    }
  },

  // ==========================================
  // 6. TRÁFICO AL PERFIL DE INSTAGRAM
  // ==========================================
  {
    id: 'traffic_instagram_profile',
    name: 'Tráfico a Perfil Instagram',
    icon: '📲',
    category: 'Tráfico',
    description: 'Lleva personas a tu perfil de Instagram para ganar seguidores y visibilidad. Meta optimiza para visitas al perfil.',
    objective: 'OUTCOME_TRAFFIC',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'INSTAGRAM_PROFILE',
      optimizationGoal: 'VISIT_INSTAGRAM_PROFILE',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      requiresInstagram: true,
      allowBudgetLevel: true,
      budgetType: 'daily',
      suggestedBudget: 30000,
      minBudget: 10000,
      maxBudget: 300000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        allowLookalikes: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 45, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'story', 'reels'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_VIDEO',
      destinationConfig: { type: 'INSTAGRAM_PROFILE', requiresUrl: false, requiresInstagram: true },
      allowedCtas: ['VISIT_INSTAGRAM_PROFILE', 'LEARN_MORE', 'CONTACT_US', 'SHOP_NOW', 'GET_QUOTE'],
      defaultCta: 'VISIT_INSTAGRAM_PROFILE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: [
        'Síguenos en Instagram',
        'Conoce nuestro contenido',
        'Descubre más en nuestro perfil',
        'Únete a nuestra comunidad',
        'Visita nuestro Instagram'
      ],
      descriptions: [
        'Contenido exclusivo, tips y novedades todos los días en nuestro perfil de Instagram.',
        'Miles de personas ya nos siguen. Descubre por qué somos su cuenta favorita.',
        'Historias, reels y publicaciones que no te puedes perder. Síguenos ahora.',
        'Conecta con nosotros y sé parte de nuestra comunidad. Te esperamos en Instagram.',
        'Todo lo que buscas está en nuestro perfil. Visítanos y síguenos para más.'
      ],
      primaryTexts: [
        'Dale un vistazo a nuestro perfil de Instagram y descubre contenido que te va a encantar. Publicamos todos los días para ti.',
        'No te pierdas lo que estamos compartiendo en Instagram. Tips, novedades y mucho más. Visita nuestro perfil ahora.',
        'Nuestra comunidad en Instagram está creciendo. Únete y sé parte de los que reciben contenido exclusivo todos los días.',
        'Si te gustó este anuncio, espera a ver nuestro perfil completo. Contenido fresco todos los días. Síguenos.',
        'Todo lo mejor lo compartimos primero en Instagram. Visita nuestro perfil y no te pierdas ninguna novedad.'
      ],
      ctas: ['VISIT_INSTAGRAM_PROFILE', 'VISIT_INSTAGRAM_PROFILE', 'VISIT_INSTAGRAM_PROFILE', 'VISIT_INSTAGRAM_PROFILE', 'VISIT_INSTAGRAM_PROFILE']
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
    description: 'Genera mensajes directos en Instagram. Meta optimiza para personas que abran conversación en tus DMs.',
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
        'Escríbenos por DM',
        'Desliza y escríbenos',
        'Info por mensaje directo',
        'DM para precio especial',
        'Chatea con nosotros en IG'
      ],
      descriptions: [
        'Envía un DM y te respondemos al instante con toda la información.',
        'Atención personalizada por Instagram Direct. Te esperamos.',
        'Solo escribe "Info" en nuestros DMs y te contamos todo.',
        'Respuesta rápida garantizada. Nuestro equipo está en línea.',
        'La forma más fácil de contactarnos. Un DM y listo.'
      ],
      primaryTexts: [
        '¿Te interesa? Envíanos un DM y te contamos todo lo que necesitas saber. Respondemos en minutos, no en horas.',
        'No sigas buscando. Escríbenos por DM en Instagram y nuestro equipo te da atención personalizada al instante.',
        '¡Hola! Estamos activos en Instagram. Envía un mensaje directo con tu pregunta y te respondemos ya mismo.',
        'Información exclusiva por DM. Escríbenos "Quiero saber más" y te enviamos todos los detalles al instante.',
        'Miles de personas ya nos escribieron por DM y obtuvieron la mejor asesoría. ¡Te estamos esperando!'
      ],
      ctas: ['SEND_MESSAGE', 'SEND_MESSAGE', 'SEND_MESSAGE', 'CONTACT_US', 'GET_QUOTE']
    }
  }
];
