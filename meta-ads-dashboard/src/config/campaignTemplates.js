// ============================================
// SISTEMA DE PLANTILLAS DE CAMPAÑAS META ADS
// 28 plantillas organizadas por objetivo
// ============================================

// Objetivos de campaña disponibles en Meta Ads
export const CAMPAIGN_OBJECTIVES = {
  OUTCOME_TRAFFIC: { label: 'Tráfico', icon: '🌐', description: 'Lleva personas a tu sitio web, app o evento' },
  OUTCOME_LEADS: { label: 'Clientes potenciales', icon: '📋', description: 'Recopila información de personas interesadas' },
  OUTCOME_SALES: { label: 'Ventas', icon: '💰', description: 'Encuentra personas que comprarán tus productos' },
  OUTCOME_ENGAGEMENT: { label: 'Interacción', icon: '💬', description: 'Genera mensajes, reproducciones de video o interacciones' },
  OUTCOME_AWARENESS: { label: 'Reconocimiento', icon: '📢', description: 'Alcanza personas y genera reconocimiento de marca' },
  OUTCOME_APP_PROMOTION: { label: 'Promoción de app', icon: '📱', description: 'Consigue instalaciones y eventos en tu app' }
};

// Metas de optimización por objetivo
export const OPTIMIZATION_GOALS = {
  // Tráfico
  LANDING_PAGE_VIEWS: 'Vistas de página de destino',
  LINK_CLICKS: 'Clics en el enlace',
  REACH: 'Alcance único diario',
  IMPRESSIONS: 'Impresiones',
  // Leads
  LEAD_GENERATION: 'Clientes potenciales',
  OFFSITE_CONVERSIONS: 'Conversiones',
  // Ventas
  VALUE: 'Valor de conversión',
  PRODUCT_CATALOG_SALES: 'Ventas de catálogo',
  // Interacción
  CONVERSATIONS: 'Conversaciones',
  THRUPLAY: 'ThruPlay (15s de video)',
  TWO_SECOND_CONTINUOUS_VIDEO_VIEWS: 'Reproducciones de 2 segundos',
  POST_ENGAGEMENT: 'Interacción con publicación',
  PAGE_LIKES: 'Me gusta de la página',
  // App
  APP_INSTALLS: 'Instalaciones de app',
  APP_EVENTS: 'Eventos de app',
  // Reconocimiento
  AD_RECALL_LIFT: 'Recordación de anuncio',
  VISIT_INSTAGRAM_PROFILE: 'Visitas al perfil de Instagram'
};

// Opciones de CTA disponibles
export const CTA_OPTIONS = [
  { value: 'LEARN_MORE', label: 'Más información' },
  { value: 'SHOP_NOW', label: 'Comprar' },
  { value: 'SIGN_UP', label: 'Registrarse' },
  { value: 'BOOK_TRAVEL', label: 'Reservar' },
  { value: 'CONTACT_US', label: 'Contactar' },
  { value: 'GET_QUOTE', label: 'Obtener cotización' },
  { value: 'SUBSCRIBE', label: 'Suscribirse' },
  { value: 'DOWNLOAD', label: 'Descargar' },
  { value: 'WATCH_MORE', label: 'Ver más' },
  { value: 'APPLY_NOW', label: 'Aplicar ahora' },
  { value: 'GET_OFFER', label: 'Obtener oferta' },
  { value: 'SEND_MESSAGE', label: 'Enviar mensaje' },
  { value: 'WHATSAPP_MESSAGE', label: 'WhatsApp' },
  { value: 'CALL_NOW', label: 'Llamar ahora' },
  { value: 'GET_DIRECTIONS', label: 'Cómo llegar' },
  { value: 'ORDER_NOW', label: 'Pedir ahora' },
  { value: 'REQUEST_TIME', label: 'Solicitar hora' },
  { value: 'SEE_MENU', label: 'Ver menú' },
  { value: 'OPEN_LINK', label: 'Abrir enlace' },
  { value: 'BUY_NOW', label: 'Comprar ahora' },
  { value: 'MESSAGE_PAGE', label: 'Enviar mensaje a página' },
  { value: 'INSTALL_APP', label: 'Instalar app' },
  { value: 'USE_APP', label: 'Usar app' },
  { value: 'PLAY_GAME', label: 'Jugar' },
  { value: 'LISTEN_NOW', label: 'Escuchar ahora' },
  { value: 'EVENT_RSVP', label: 'Confirmar asistencia' }
];

// Eventos de facturación
export const BILLING_EVENTS = {
  IMPRESSIONS: 'Por impresión (CPM)',
  LINK_CLICKS: 'Por clic en enlace (CPC)',
  POST_ENGAGEMENT: 'Por interacción',
  THRUPLAY: 'Por ThruPlay',
  APP_INSTALLS: 'Por instalación'
};

// Ubicaciones por plataforma
export const PLACEMENT_OPTIONS = {
  facebook: [
    { id: 'feed', label: 'Feed de Facebook' },
    { id: 'video_feeds', label: 'Feed de video' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'right_hand_column', label: 'Columna derecha' },
    { id: 'story', label: 'Stories' },
    { id: 'reels', label: 'Reels' },
    { id: 'instream_video', label: 'Videos in-stream' },
    { id: 'search', label: 'Resultados de búsqueda' }
  ],
  instagram: [
    { id: 'stream', label: 'Feed de Instagram' },
    { id: 'explore', label: 'Explorar' },
    { id: 'story', label: 'Stories' },
    { id: 'reels', label: 'Reels' },
    { id: 'shop', label: 'Tienda' },
    { id: 'profile_feed', label: 'Perfil' }
  ],
  messenger: [
    { id: 'messenger_home', label: 'Bandeja de entrada' },
    { id: 'story', label: 'Stories de Messenger' },
    { id: 'sponsored_messages', label: 'Mensajes patrocinados' }
  ],
  audience_network: [
    { id: 'classic', label: 'Nativo, banner e intersticial' },
    { id: 'rewarded_video', label: 'Videos con premio' }
  ]
};

// Formatos de anuncio
export const AD_FORMATS = {
  SINGLE_IMAGE: { label: 'Imagen única', icon: '🖼️' },
  SINGLE_VIDEO: { label: 'Video único', icon: '🎬' },
  CAROUSEL: { label: 'Carrusel', icon: '🎠', minCards: 2, maxCards: 10 },
  COLLECTION: { label: 'Colección', icon: '🛍️', requiresCatalog: true }
};

// ============================================
// PLANTILLAS DE CAMPAÑAS (28 total)
// ============================================

export const CAMPAIGN_TEMPLATES = [
  // ==========================================
  // TRÁFICO (6 plantillas)
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
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: ['messenger_home'],
          audience_network: ['classic']
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
      allowedCtas: ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'GET_QUOTE', 'CONTACT_US', 'DOWNLOAD'],
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
        'No dejes pasar esta oportunidad única. Haz clic y conoce todos los detalles.',
        'Aprende los secretos que los expertos no quieren que sepas.',
        'Transforma tu vida y tu negocio con esta metodología revolucionaria.'
      ],
      primaryTexts: [
        '¿Estás listo para llevar tu negocio al siguiente nivel? Descubre cómo miles de emprendedores están logrando resultados increíbles.',
        'Lo que nadie te cuenta sobre el éxito empresarial. Hoy te revelamos los secretos que transformarán tu forma de trabajar.',
        '¡Atención emprendedores! Esta es la oportunidad que estabas esperando para hacer crecer tu negocio.',
        'Si buscas resultados reales, esta es tu mejor opción. Comprobado por miles de clientes satisfechos.',
        'Deja de perder tiempo y dinero. Conoce la estrategia que realmente funciona para tu negocio.'
      ],
      ctas: ['LEARN_MORE', 'LEARN_MORE', 'SIGN_UP', 'LEARN_MORE', 'GET_QUOTE']
    }
  },
  {
    id: 'traffic_website_clicks',
    name: 'Clics en Enlaces',
    icon: '🔗',
    category: 'Tráfico',
    description: 'Maximiza los clics hacia tu sitio web. Ideal para blogs y contenido.',
    objective: 'OUTCOME_TRAFFIC',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'WEBSITE',
      optimizationGoal: 'LINK_CLICKS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      budgetType: 'daily',
      suggestedBudget: 40000,
      minBudget: 10000,
      maxBudget: 300000,
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
          facebook: ['feed', 'video_feeds', 'story', 'reels'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: [],
          audience_network: ['classic']
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'WEBSITE', requiresUrl: true, allowDisplayUrl: true, allowUtmParams: true },
      allowedCtas: ['LEARN_MORE', 'SHOP_NOW', 'DOWNLOAD', 'WATCH_MORE'],
      defaultCta: 'LEARN_MORE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['Guía completa GRATIS', 'Los 10 secretos que debes conocer', 'Aprende en 5 minutos', 'La guía definitiva', 'Información exclusiva'],
      descriptions: ['Descarga nuestra guía gratuita y descubre los secretos del éxito.', 'Contenido exclusivo diseñado para ti.', 'Miles de personas ya lo aplicaron.', 'Información clara y práctica.', 'Actualizado con las últimas tendencias.'],
      primaryTexts: ['¿Quieres saber más? Haz clic y descubre todo lo que necesitas saber.', 'Contenido de valor que no puedes perderte. ¡Entra ahora!', 'Lee el artículo completo y transforma tu perspectiva.', 'Información que cambiará tu forma de ver las cosas.', 'No te quedes con la duda. Haz clic y aprende más.'],
      ctas: ['LEARN_MORE', 'DOWNLOAD', 'LEARN_MORE', 'WATCH_MORE', 'LEARN_MORE']
    }
  },
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
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: [],
          audience_network: []
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
      headlines: ['¡Escríbenos ahora!', 'Atención personalizada', 'Respuesta inmediata', 'Chatea con nosotros', 'Te asesoramos gratis'],
      descriptions: ['Escríbenos por WhatsApp y recibe atención inmediata.', 'Nuestro equipo está listo para ayudarte.', 'Resolvemos todas tus dudas al instante.', 'Cotización sin compromiso por WhatsApp.', 'Agenda tu cita por chat.'],
      primaryTexts: ['¿Tienes preguntas? ¡Escríbenos por WhatsApp y te respondemos al instante! Nuestro equipo está listo para ayudarte.', 'Atención personalizada a un clic de distancia. Escríbenos y recibe la asesoría que necesitas.', '¡Hola! Estamos aquí para ayudarte. Envíanos un mensaje y te atendemos de inmediato.', 'La forma más fácil de contactarnos. Un mensaje y listo. ¿Qué esperas?', 'Cotiza sin compromiso. Solo escríbenos y te damos toda la información que necesitas.'],
      ctas: ['WHATSAPP_MESSAGE', 'WHATSAPP_MESSAGE', 'SEND_MESSAGE', 'GET_QUOTE', 'CONTACT_US']
    }
  },
  {
    id: 'traffic_messenger',
    name: 'Conversaciones Messenger',
    icon: '💭',
    category: 'Tráfico',
    description: 'Genera conversaciones en Facebook Messenger. Ideal para atención al cliente.',
    objective: 'OUTCOME_TRAFFIC',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'MESSENGER',
      optimizationGoal: 'CONVERSATIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      budgetType: 'daily',
      suggestedBudget: 40000,
      minBudget: 15000,
      maxBudget: 350000,
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
          facebook: ['feed', 'video_feeds', 'story', 'reels'],
          instagram: ['stream', 'story', 'reels'],
          messenger: ['messenger_home'],
          audience_network: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'MESSENGER', requiresUrl: false },
      allowedCtas: ['SEND_MESSAGE', 'MESSAGE_PAGE', 'GET_QUOTE', 'CONTACT_US'],
      defaultCta: 'SEND_MESSAGE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['¡Envíanos un mensaje!', 'Chatea con nosotros', 'Atención por Messenger', 'Respuesta rápida', 'Estamos en línea'],
      descriptions: ['Escríbenos por Messenger y te atendemos.', 'Resolvemos tus dudas por chat.', 'Atención personalizada al instante.', 'Cotiza sin compromiso.', 'Agenda tu cita por mensaje.'],
      primaryTexts: ['¿Necesitas ayuda? Envíanos un mensaje por Messenger y te respondemos al instante.', 'Nuestro equipo está listo para atenderte. ¡Escríbenos!', 'La forma más fácil de contactarnos. Un mensaje y listo.', 'Atención al cliente por Messenger. Rápido, fácil y sin complicaciones.', 'Todas tus preguntas tienen respuesta. Solo envíanos un mensaje.'],
      ctas: ['SEND_MESSAGE', 'MESSAGE_PAGE', 'SEND_MESSAGE', 'GET_QUOTE', 'CONTACT_US']
    }
  },
  {
    id: 'traffic_calls',
    name: 'Llamadas Telefónicas',
    icon: '📞',
    category: 'Tráfico',
    description: 'Genera llamadas directas a tu negocio. Ideal para servicios que requieren contacto inmediato.',
    objective: 'OUTCOME_TRAFFIC',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'CALLS',
      optimizationGoal: 'CALLS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      requiresPhoneNumber: true,
      budgetType: 'daily',
      suggestedBudget: 60000,
      minBudget: 20000,
      maxBudget: 500000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 25, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds', 'story'],
          instagram: ['stream', 'story'],
          messenger: [],
          audience_network: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'CALLS', requiresUrl: false, requiresPhoneNumber: true },
      allowedCtas: ['CALL_NOW', 'CONTACT_US', 'GET_QUOTE'],
      defaultCta: 'CALL_NOW',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['¡Llámanos ahora!', 'Atención inmediata', 'Línea directa', 'Habla con un asesor', 'Consulta gratis'],
      descriptions: ['Llámanos y te atendemos de inmediato.', 'Nuestros asesores están disponibles.', 'Resolvemos tus dudas por teléfono.', 'Cotización sin compromiso.', 'Agenda tu cita llamando.'],
      primaryTexts: ['¿Prefieres hablar con alguien? Llámanos ahora y te atendemos de inmediato.', 'Nuestros asesores están listos para ayudarte. Solo marca y listo.', 'Atención telefónica personalizada. Tu consulta es importante para nosotros.', 'La forma más directa de contactarnos. Una llamada y resolvemos todo.', 'Sin esperas, sin complicaciones. Llama y recibe la atención que mereces.'],
      ctas: ['CALL_NOW', 'CALL_NOW', 'CONTACT_US', 'GET_QUOTE', 'CALL_NOW']
    }
  },
  {
    id: 'traffic_app',
    name: 'Tráfico a App',
    icon: '📱',
    category: 'Tráfico',
    description: 'Dirige usuarios a tu aplicación móvil para que la usen o descarguen.',
    objective: 'OUTCOME_TRAFFIC',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'APP',
      optimizationGoal: 'APP_INSTALLS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      requiresApp: true,
      budgetType: 'daily',
      suggestedBudget: 55000,
      minBudget: 20000,
      maxBudget: 500000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 45, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds', 'story', 'reels'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: [],
          audience_network: ['classic', 'rewarded_video']
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_VIDEO',
      destinationConfig: { type: 'APP', requiresUrl: true, requiresAppId: true },
      allowedCtas: ['INSTALL_APP', 'USE_APP', 'DOWNLOAD', 'PLAY_GAME'],
      defaultCta: 'INSTALL_APP',
      trackingConfig: { requiresPixel: false, allowAppEvents: true }
    },
    creativeContent: {
      headlines: ['Descarga la app GRATIS', 'Tu vida más fácil', 'La app #1', 'Millones ya la usan', 'Descubre la nueva forma'],
      descriptions: ['Únete a millones de usuarios.', 'Todo en la palma de tu mano.', 'Calificación de 4.8 estrellas.', 'Actualizaciones constantes.', 'La app que necesitas.'],
      primaryTexts: ['Descarga nuestra app y descubre por qué millones de personas la prefieren.', 'Todo lo que necesitas, ahora en tu celular. Descarga gratis.', 'La app mejor calificada de su categoría. ¿Ya la tienes?', 'Simplifica tu vida con nuestra app. Descárgala ahora.', 'Miles de funciones en una sola app. Descubre todo lo que puedes hacer.'],
      ctas: ['INSTALL_APP', 'DOWNLOAD', 'USE_APP', 'INSTALL_APP', 'DOWNLOAD']
    }
  },

  // ==========================================
  // CLIENTES POTENCIALES (5 plantillas)
  // ==========================================
  {
    id: 'leads_instant_form',
    name: 'Formulario Instantáneo',
    icon: '📝',
    category: 'Clientes potenciales',
    description: 'Recopila leads con formularios dentro de Facebook/Instagram. Sin salir de la app.',
    objective: 'OUTCOME_LEADS',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'INSTANT_FORM',
      optimizationGoal: 'LEAD_GENERATION',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      requiresLeadForm: true,
      budgetType: 'daily',
      suggestedBudget: 50000,
      minBudget: 20000,
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
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: [],
          audience_network: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'INSTANT_FORM', requiresUrl: false, requiresLeadForm: true },
      allowedCtas: ['SIGN_UP', 'SUBSCRIBE', 'GET_QUOTE', 'LEARN_MORE', 'APPLY_NOW', 'GET_OFFER'],
      defaultCta: 'SIGN_UP',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['Regístrate GRATIS', 'Obtén tu cotización', 'Solicita información', 'Únete ahora', 'Inscríbete hoy'],
      descriptions: ['Completa el formulario y te contactamos.', 'Solo toma 30 segundos.', 'Sin compromiso.', 'Cupos limitados.', 'Respuesta en 24 horas.'],
      primaryTexts: ['¿Quieres más información? Completa el formulario y nuestro equipo te contactará en menos de 24 horas.', 'Regístrate ahora y recibe una asesoría gratuita. Solo toma unos segundos.', 'Deja tus datos y te enviamos toda la información que necesitas. Sin compromiso.', 'Únete a miles de personas que ya dieron el primer paso. Regístrate gratis.', 'Solicita tu cotización personalizada. Completa el formulario y te respondemos pronto.'],
      ctas: ['SIGN_UP', 'GET_QUOTE', 'SUBSCRIBE', 'APPLY_NOW', 'SIGN_UP']
    }
  },
  {
    id: 'leads_website',
    name: 'Leads en Sitio Web',
    icon: '🌐',
    category: 'Clientes potenciales',
    description: 'Genera leads en tu sitio web con seguimiento de Pixel. Para formularios propios.',
    objective: 'OUTCOME_LEADS',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'WEBSITE',
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: true,
      pixelEventType: 'LEAD',
      budgetType: 'daily',
      suggestedBudget: 60000,
      minBudget: 25000,
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
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: ['messenger_home'],
          audience_network: ['classic']
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'WEBSITE', requiresUrl: true, allowDisplayUrl: true, allowUtmParams: true },
      allowedCtas: ['SIGN_UP', 'LEARN_MORE', 'GET_QUOTE', 'APPLY_NOW', 'SUBSCRIBE'],
      defaultCta: 'SIGN_UP',
      trackingConfig: { requiresPixel: true, pixelEvent: 'Lead' }
    },
    creativeContent: {
      headlines: ['Regístrate ahora', 'Solicita información', 'Comienza gratis', 'Únete hoy', 'Accede ahora'],
      descriptions: ['Registra tus datos en nuestro sitio.', 'Formulario rápido y seguro.', 'Sin compromiso de compra.', 'Respuesta garantizada.', 'Proceso 100% online.'],
      primaryTexts: ['Completa nuestro formulario online y recibe atención personalizada.', 'Tu información está segura con nosotros. Regístrate y te contactamos.', 'Solo 3 pasos para comenzar. Ingresa a nuestro sitio y regístrate.', 'Miles de personas ya se registraron. ¿Qué esperas tú?', 'El primer paso hacia el éxito está a un clic. Regístrate ahora.'],
      ctas: ['SIGN_UP', 'LEARN_MORE', 'GET_QUOTE', 'APPLY_NOW', 'SIGN_UP']
    }
  },
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
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: [],
          audience_network: []
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
      headlines: ['Cotiza por WhatsApp', 'Asesoría gratis', 'Escríbenos ahora', 'Información al instante', 'Consulta sin costo'],
      descriptions: ['Envíanos un mensaje y te cotizamos.', 'Asesoría personalizada por chat.', 'Respuesta inmediata garantizada.', 'Sin compromiso de compra.', 'Tu consulta es importante.'],
      primaryTexts: ['¿Interesado? Escríbenos por WhatsApp y te damos toda la información que necesitas.', 'Cotización personalizada en minutos. Solo envía un mensaje.', 'Nuestros asesores están listos para atenderte por WhatsApp.', 'La forma más fácil de obtener información. Un mensaje y listo.', 'No te quedes con dudas. Escríbenos y resolvemos todo.'],
      ctas: ['WHATSAPP_MESSAGE', 'GET_QUOTE', 'WHATSAPP_MESSAGE', 'CONTACT_US', 'SEND_MESSAGE']
    }
  },
  {
    id: 'leads_messenger',
    name: 'Leads por Messenger',
    icon: '💭',
    category: 'Clientes potenciales',
    description: 'Captura leads mediante conversaciones en Messenger. Integración con chatbots.',
    objective: 'OUTCOME_LEADS',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'MESSENGER',
      optimizationGoal: 'LEAD_GENERATION',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
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
          facebook: ['feed', 'video_feeds', 'story', 'reels'],
          instagram: ['stream', 'story', 'reels'],
          messenger: ['messenger_home'],
          audience_network: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'MESSENGER', requiresUrl: false },
      allowedCtas: ['SEND_MESSAGE', 'MESSAGE_PAGE', 'GET_QUOTE', 'CONTACT_US'],
      defaultCta: 'SEND_MESSAGE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['Escríbenos ahora', 'Consulta gratis', 'Chatea con nosotros', 'Información inmediata', 'Te asesoramos'],
      descriptions: ['Envíanos un mensaje por Messenger.', 'Respuesta automática 24/7.', 'Asesoría personalizada.', 'Sin compromiso.', 'Fácil y rápido.'],
      primaryTexts: ['¿Tienes preguntas? Envíanos un mensaje y te respondemos al instante.', 'Nuestro chatbot te guía paso a paso. Escríbenos por Messenger.', 'Información completa a un mensaje de distancia.', 'Atención automatizada y humana cuando lo necesites.', 'El primer paso es escribirnos. ¡Hazlo ahora!'],
      ctas: ['SEND_MESSAGE', 'MESSAGE_PAGE', 'SEND_MESSAGE', 'GET_QUOTE', 'CONTACT_US']
    }
  },
  {
    id: 'leads_calls',
    name: 'Leads por Llamadas',
    icon: '📞',
    category: 'Clientes potenciales',
    description: 'Genera llamadas de personas interesadas. Para servicios que requieren contacto telefónico.',
    objective: 'OUTCOME_LEADS',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'CALLS',
      optimizationGoal: 'CALLS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      requiresPhoneNumber: true,
      budgetType: 'daily',
      suggestedBudget: 65000,
      minBudget: 25000,
      maxBudget: 500000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 25, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds', 'story'],
          instagram: ['stream', 'story'],
          messenger: [],
          audience_network: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'CALLS', requiresUrl: false, requiresPhoneNumber: true },
      allowedCtas: ['CALL_NOW', 'GET_QUOTE', 'CONTACT_US'],
      defaultCta: 'CALL_NOW',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['Llama y cotiza', 'Asesoría telefónica', 'Atención inmediata', 'Consulta gratis', 'Habla con un experto'],
      descriptions: ['Llámanos para cotizar sin compromiso.', 'Asesores disponibles ahora.', 'Tu llamada es importante.', 'Resolvemos tus dudas por teléfono.', 'Atención personalizada.'],
      primaryTexts: ['¿Quieres hablar con un asesor? Llámanos ahora y te atendemos de inmediato.', 'La forma más directa de obtener información. Una llamada y listo.', 'Nuestro equipo está listo para resolver todas tus preguntas.', 'Cotización telefónica sin compromiso. ¡Marca ahora!', 'Tu consulta merece atención personal. Llámanos.'],
      ctas: ['CALL_NOW', 'CALL_NOW', 'GET_QUOTE', 'CONTACT_US', 'CALL_NOW']
    }
  },

  // ==========================================
  // VENTAS (6 plantillas)
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
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore', 'shop'],
          messenger: ['messenger_home'],
          audience_network: ['classic']
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL', 'COLLECTION'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'WEBSITE', requiresUrl: true, allowDisplayUrl: true, allowUtmParams: true },
      allowedCtas: ['SHOP_NOW', 'BUY_NOW', 'ORDER_NOW', 'GET_OFFER', 'LEARN_MORE'],
      defaultCta: 'SHOP_NOW',
      trackingConfig: { requiresPixel: true, pixelEvent: 'Purchase' }
    },
    creativeContent: {
      headlines: ['¡Compra ahora!', 'Oferta especial', 'Últimas unidades', 'Envío gratis', 'Precio exclusivo'],
      descriptions: ['Compra hoy con descuento especial.', 'Stock limitado, no te quedes sin el tuyo.', 'Envío gratis en tu primera compra.', 'Pago seguro garantizado.', 'Satisfacción garantizada o te devolvemos tu dinero.'],
      primaryTexts: ['¡Oferta exclusiva! Compra ahora y recibe un descuento especial. Envío gratis incluido.', 'Miles de clientes satisfechos nos respaldan. ¿Qué esperas para unirte?', 'La calidad que buscas al precio que mereces. Compra hoy.', 'Stock limitado. No dejes que otros se lo lleven. Compra ahora.', 'Tu compra está protegida. Si no te gusta, te devolvemos el dinero.'],
      ctas: ['SHOP_NOW', 'BUY_NOW', 'ORDER_NOW', 'GET_OFFER', 'SHOP_NOW']
    }
  },
  {
    id: 'sales_website_value',
    name: 'Maximizar Valor de Compra',
    icon: '📈',
    category: 'Ventas',
    description: 'Optimiza para obtener el mayor valor de compra posible. Ideal para tickets altos.',
    objective: 'OUTCOME_SALES',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'WEBSITE',
      optimizationGoal: 'VALUE',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: true,
      pixelEventType: 'PURCHASE',
      budgetType: 'daily',
      suggestedBudget: 100000,
      minBudget: 50000,
      maxBudget: 2000000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        allowLookalikes: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 25, age_max: 55, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds', 'story', 'reels'],
          instagram: ['stream', 'story', 'reels', 'explore', 'shop'],
          messenger: [],
          audience_network: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL', 'COLLECTION'],
      defaultFormat: 'CAROUSEL',
      destinationConfig: { type: 'WEBSITE', requiresUrl: true, allowDisplayUrl: true, allowUtmParams: true },
      allowedCtas: ['SHOP_NOW', 'BUY_NOW', 'ORDER_NOW', 'GET_OFFER'],
      defaultCta: 'SHOP_NOW',
      trackingConfig: { requiresPixel: true, pixelEvent: 'Purchase', trackValue: true }
    },
    creativeContent: {
      headlines: ['Colección Premium', 'Calidad superior', 'Exclusivo para ti', 'Edición limitada', 'Lo mejor para ti'],
      descriptions: ['Productos premium seleccionados para ti.', 'Calidad que se nota en cada detalle.', 'Exclusividad que mereces.', 'Edición limitada, no te la pierdas.', 'Invierte en lo mejor.'],
      primaryTexts: ['Descubre nuestra colección premium. Calidad excepcional para quienes exigen lo mejor.', 'Productos cuidadosamente seleccionados para clientes exigentes como tú.', 'La excelencia tiene un precio, y hoy está a tu alcance.', 'Porque mereces lo mejor. Conoce nuestra línea exclusiva.', 'Invierte en calidad. Productos que duran y que amas.'],
      ctas: ['SHOP_NOW', 'SHOP_NOW', 'BUY_NOW', 'ORDER_NOW', 'GET_OFFER']
    }
  },
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
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: [],
          audience_network: []
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
      headlines: ['Compra por WhatsApp', 'Pide el tuyo', 'Haz tu pedido', 'Compra fácil', 'Ordena ahora'],
      descriptions: ['Escríbenos y haz tu pedido por WhatsApp.', 'Pago contra entrega disponible.', 'Envío a todo el país.', 'Atención personalizada.', 'Compra segura y fácil.'],
      primaryTexts: ['¿Te interesa? Escríbenos por WhatsApp y te ayudamos con tu compra.', 'Comprar nunca fue tan fácil. Un mensaje y listo.', 'Atención personalizada para tu pedido. Escríbenos ahora.', 'Resolvemos tus dudas y procesamos tu pedido por WhatsApp.', 'La forma más fácil de comprar. Envíanos un mensaje.'],
      ctas: ['WHATSAPP_MESSAGE', 'SHOP_NOW', 'WHATSAPP_MESSAGE', 'ORDER_NOW', 'GET_QUOTE']
    }
  },
  {
    id: 'sales_messenger',
    name: 'Ventas por Messenger',
    icon: '💭',
    category: 'Ventas',
    description: 'Cierra ventas mediante Messenger. Integración con tiendas de Facebook.',
    objective: 'OUTCOME_SALES',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'MESSENGER',
      optimizationGoal: 'CONVERSATIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      budgetType: 'daily',
      suggestedBudget: 50000,
      minBudget: 20000,
      maxBudget: 450000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels'],
          messenger: ['messenger_home'],
          audience_network: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'MESSENGER', requiresUrl: false },
      allowedCtas: ['SEND_MESSAGE', 'SHOP_NOW', 'MESSAGE_PAGE', 'ORDER_NOW'],
      defaultCta: 'SEND_MESSAGE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['Compra por Messenger', 'Pide ahora', 'Haz tu pedido', 'Ordena fácil', 'Escríbenos'],
      descriptions: ['Envía un mensaje para comprar.', 'Proceso fácil y rápido.', 'Atención inmediata.', 'Pago seguro.', 'Envío incluido.'],
      primaryTexts: ['¿Quieres comprarlo? Envíanos un mensaje y procesamos tu pedido.', 'Compra fácil por Messenger. Solo escríbenos.', 'Nuestro equipo te guía en tu compra. Envía un mensaje.', 'La forma más directa de comprar. Un mensaje y listo.', 'Atención personalizada para tu pedido. Escríbenos ahora.'],
      ctas: ['SEND_MESSAGE', 'SHOP_NOW', 'MESSAGE_PAGE', 'ORDER_NOW', 'SEND_MESSAGE']
    }
  },
  {
    id: 'sales_catalog_retarget',
    name: 'Retargeting de Catálogo',
    icon: '🔄',
    category: 'Ventas',
    description: 'Muestra productos a personas que ya visitaron tu tienda. Requiere catálogo.',
    objective: 'OUTCOME_SALES',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'WEBSITE',
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: true,
      requiresCatalog: true,
      pixelEventType: 'PURCHASE',
      budgetType: 'daily',
      suggestedBudget: 70000,
      minBudget: 30000,
      maxBudget: 800000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: false,
        allowCustomAudiences: true,
        allowLookalikes: false,
        useProductAudience: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace', 'right_hand_column'],
          instagram: ['stream', 'story', 'reels', 'explore', 'shop'],
          messenger: ['messenger_home'],
          audience_network: ['classic']
        }
      }
    },
    adConfig: {
      allowedFormats: ['CAROUSEL', 'COLLECTION'],
      defaultFormat: 'CAROUSEL',
      destinationConfig: { type: 'WEBSITE', requiresUrl: false, useProductUrl: true },
      allowedCtas: ['SHOP_NOW', 'BUY_NOW', 'ORDER_NOW', 'LEARN_MORE'],
      defaultCta: 'SHOP_NOW',
      trackingConfig: { requiresPixel: true, pixelEvent: 'Purchase' }
    },
    creativeContent: {
      headlines: ['¿Olvidaste algo?', 'Todavía disponible', 'Te estaba esperando', 'Completa tu compra', 'Vuelve por él'],
      descriptions: ['El producto que viste sigue disponible.', 'No dejes tu carrito abandonado.', 'Stock limitado, compra ahora.', 'El precio especial sigue activo.', 'Tu favorito te espera.'],
      primaryTexts: ['¿Aún lo estás pensando? Este producto sigue esperándote. ¡Completa tu compra!', 'Notamos que te interesó este producto. Sigue disponible con envío gratis.', 'Tu carrito te extraña. Vuelve y completa tu pedido con un descuento especial.', 'El producto que viste está en oferta. No dejes pasar esta oportunidad.', 'Sabemos que te gustó. Vuelve por él antes de que se agote.'],
      ctas: ['SHOP_NOW', 'BUY_NOW', 'SHOP_NOW', 'ORDER_NOW', 'SHOP_NOW']
    }
  },
  {
    id: 'sales_catalog_acquisition',
    name: 'Adquisición con Catálogo',
    icon: '🛍️',
    category: 'Ventas',
    description: 'Muestra productos de tu catálogo a nuevos clientes potenciales.',
    objective: 'OUTCOME_SALES',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'WEBSITE',
      optimizationGoal: 'OFFSITE_CONVERSIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: true,
      requiresCatalog: true,
      pixelEventType: 'PURCHASE',
      budgetType: 'daily',
      suggestedBudget: 90000,
      minBudget: 40000,
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
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore', 'shop'],
          messenger: [],
          audience_network: ['classic']
        }
      }
    },
    adConfig: {
      allowedFormats: ['CAROUSEL', 'COLLECTION'],
      defaultFormat: 'CAROUSEL',
      destinationConfig: { type: 'WEBSITE', requiresUrl: false, useProductUrl: true },
      allowedCtas: ['SHOP_NOW', 'BUY_NOW', 'ORDER_NOW', 'GET_OFFER'],
      defaultCta: 'SHOP_NOW',
      trackingConfig: { requiresPixel: true, pixelEvent: 'Purchase' }
    },
    creativeContent: {
      headlines: ['Descubre nuestra tienda', 'Productos para ti', 'Lo más vendido', 'Nuevos productos', 'Ofertas especiales'],
      descriptions: ['Explora nuestra colección completa.', 'Productos seleccionados para ti.', 'Los favoritos de nuestros clientes.', 'Recién llegados a la tienda.', 'Descuentos exclusivos por tiempo limitado.'],
      primaryTexts: ['Descubre productos increíbles perfectos para ti. Explora nuestra tienda ahora.', 'Miles de clientes satisfechos. Conoce los productos más vendidos.', 'Nuevos productos cada semana. No te pierdas las novedades.', 'Calidad y precio en un solo lugar. Visita nuestra tienda online.', 'Ofertas exclusivas que no encontrarás en otro lugar. ¡Compra ahora!'],
      ctas: ['SHOP_NOW', 'SHOP_NOW', 'BUY_NOW', 'ORDER_NOW', 'GET_OFFER']
    }
  },

  // ==========================================
  // INTERACCIÓN (6 plantillas)
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
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: [],
          audience_network: []
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
      headlines: ['Hablemos', 'Estamos en línea', 'Escríbenos', 'Chatea con nosotros', 'Te esperamos'],
      descriptions: ['Inicia una conversación con nosotros.', 'Respuesta rápida garantizada.', 'Atención personalizada.', 'Resolvemos tus dudas.', 'Siempre disponibles.'],
      primaryTexts: ['¿Tienes preguntas? Escríbenos por WhatsApp y te respondemos al instante.', 'Estamos aquí para ayudarte. Inicia una conversación ahora.', 'Tu consulta es importante. Escríbenos y te atendemos.', 'La comunicación directa que necesitas. Un mensaje y listo.', 'Conecta con nosotros. Te esperamos en WhatsApp.'],
      ctas: ['WHATSAPP_MESSAGE', 'SEND_MESSAGE', 'WHATSAPP_MESSAGE', 'GET_QUOTE', 'CONTACT_US']
    }
  },
  {
    id: 'engagement_messages_msg',
    name: 'Mensajes Messenger',
    icon: '💭',
    category: 'Interacción',
    description: 'Genera conversaciones en Messenger. Ideal para soporte y atención.',
    objective: 'OUTCOME_ENGAGEMENT',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'MESSENGER',
      optimizationGoal: 'CONVERSATIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      budgetType: 'daily',
      suggestedBudget: 35000,
      minBudget: 15000,
      maxBudget: 300000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds', 'story', 'reels'],
          instagram: ['stream', 'story', 'reels'],
          messenger: ['messenger_home'],
          audience_network: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'MESSENGER', requiresUrl: false },
      allowedCtas: ['SEND_MESSAGE', 'MESSAGE_PAGE', 'GET_QUOTE', 'CONTACT_US'],
      defaultCta: 'SEND_MESSAGE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['Envíanos un mensaje', 'Chatea ahora', 'Estamos aquí', 'Te atendemos', 'Escríbenos'],
      descriptions: ['Inicia una conversación por Messenger.', 'Respuesta inmediata.', 'Soporte en línea.', 'Atención 24/7.', 'Siempre disponibles.'],
      primaryTexts: ['¿Necesitas ayuda? Envíanos un mensaje por Messenger y te respondemos.', 'Nuestro equipo está listo para atenderte. Escríbenos ahora.', 'Soporte al cliente por Messenger. Rápido y eficiente.', 'Todas tus preguntas tienen respuesta. Solo envía un mensaje.', 'Conecta con nosotros de forma directa. Te esperamos en Messenger.'],
      ctas: ['SEND_MESSAGE', 'MESSAGE_PAGE', 'SEND_MESSAGE', 'GET_QUOTE', 'CONTACT_US']
    }
  },
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
          messenger: [],
          audience_network: []
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
      headlines: ['DM para más info', 'Escríbenos en IG', 'Chatea con nosotros', 'Te respondemos', 'Mensaje directo'],
      descriptions: ['Envía un DM para más información.', 'Respuesta rápida por Instagram.', 'Atención personalizada en IG.', 'Te esperamos en los DMs.', 'Conecta con nosotros.'],
      primaryTexts: ['¿Quieres saber más? Envíanos un DM y te contamos todo.', 'Atención personalizada por Instagram. Escríbenos ahora.', 'Tus preguntas, nuestras respuestas. Envía un mensaje directo.', 'La forma más fácil de contactarnos en Instagram.', 'Estamos en línea. Envía un DM y te atendemos.'],
      ctas: ['SEND_MESSAGE', 'SEND_MESSAGE', 'CONTACT_US', 'GET_QUOTE', 'SEND_MESSAGE']
    }
  },
  {
    id: 'engagement_video_thruplay',
    name: 'Video ThruPlay',
    icon: '🎬',
    category: 'Interacción',
    description: 'Maximiza visualizaciones completas de video (15 segundos o más).',
    objective: 'OUTCOME_ENGAGEMENT',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: null,
      optimizationGoal: 'THRUPLAY',
      billingEvent: 'THRUPLAY',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
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
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'instream_video'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: [],
          audience_network: ['rewarded_video']
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_VIDEO'],
      defaultFormat: 'SINGLE_VIDEO',
      destinationConfig: { type: 'NONE', requiresUrl: false },
      allowedCtas: ['LEARN_MORE', 'WATCH_MORE', 'SHOP_NOW', 'SIGN_UP'],
      defaultCta: 'LEARN_MORE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['Mira el video completo', 'No te lo pierdas', 'Historia increíble', 'Descubre más', 'Ve hasta el final'],
      descriptions: ['Un video que tienes que ver.', 'Contenido que te sorprenderá.', 'La historia que todos comentan.', 'Míralo completo.', 'No te arrepentirás.'],
      primaryTexts: ['Este video te va a sorprender. Míralo hasta el final.', 'La historia que todos están compartiendo. ¿Ya la viste?', 'Contenido que vale la pena. Dedica unos segundos a verlo.', 'No te pierdas este video. Te garantizamos que te gustará.', 'Algo que tienes que ver. Míralo ahora.'],
      ctas: ['WATCH_MORE', 'LEARN_MORE', 'WATCH_MORE', 'SHOP_NOW', 'SIGN_UP']
    }
  },
  {
    id: 'engagement_video_views',
    name: 'Visualizaciones de Video',
    icon: '▶️',
    category: 'Interacción',
    description: 'Maximiza reproducciones de video (2 segundos continuos).',
    objective: 'OUTCOME_ENGAGEMENT',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: null,
      optimizationGoal: 'TWO_SECOND_CONTINUOUS_VIDEO_VIEWS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      budgetType: 'daily',
      suggestedBudget: 35000,
      minBudget: 10000,
      maxBudget: 300000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'instream_video'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: [],
          audience_network: ['rewarded_video']
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_VIDEO'],
      defaultFormat: 'SINGLE_VIDEO',
      destinationConfig: { type: 'NONE', requiresUrl: false },
      allowedCtas: ['LEARN_MORE', 'WATCH_MORE', 'SHOP_NOW'],
      defaultCta: 'WATCH_MORE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['Mira esto', 'Video imperdible', 'Contenido nuevo', 'No te lo pierdas', 'Descubre'],
      descriptions: ['Un video que te encantará.', 'Contenido fresco para ti.', 'Lo más nuevo.', 'Entretenimiento garantizado.', 'Dale play.'],
      primaryTexts: ['Nuevo video que tienes que ver. Dale play ahora.', 'Contenido que te va a encantar. Míralo.', 'Entretenimiento de calidad. Disfrútalo.', 'Lo más reciente de nuestro canal. No te lo pierdas.', 'Un video para ti. Míralo y comparte.'],
      ctas: ['WATCH_MORE', 'WATCH_MORE', 'LEARN_MORE', 'SHOP_NOW', 'WATCH_MORE']
    }
  },
  {
    id: 'engagement_post',
    name: 'Interacción con Publicación',
    icon: '❤️',
    category: 'Interacción',
    description: 'Genera likes, comentarios y compartidos en tus publicaciones.',
    objective: 'OUTCOME_ENGAGEMENT',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: null,
      optimizationGoal: 'POST_ENGAGEMENT',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      budgetType: 'daily',
      suggestedBudget: 30000,
      minBudget: 10000,
      maxBudget: 250000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds'],
          instagram: ['stream', 'explore'],
          messenger: [],
          audience_network: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'NONE', requiresUrl: false },
      allowedCtas: ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP'],
      defaultCta: 'LEARN_MORE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['¿Qué opinas?', 'Comenta tu favorito', 'Dale like si te gusta', 'Comparte con amigos', 'Tu opinión importa'],
      descriptions: ['Queremos saber tu opinión.', 'Comenta y participa.', 'Dale like si estás de acuerdo.', 'Compártelo con quien lo necesite.', 'Interactúa con nosotros.'],
      primaryTexts: ['¿Qué te parece esto? Déjanos tu comentario y comparte con tus amigos.', 'Dale like si te identificas con esto. Tu opinión nos importa.', 'Comenta cuál es tu favorito. Queremos conocerte mejor.', 'Etiqueta a alguien que necesita ver esto. Comparte ahora.', '¿Estás de acuerdo? Dale like y cuéntanos qué piensas.'],
      ctas: ['LEARN_MORE', 'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'LEARN_MORE']
    }
  },

  // ==========================================
  // RECONOCIMIENTO (5 plantillas)
  // ==========================================
  {
    id: 'awareness_reach',
    name: 'Alcance Máximo',
    icon: '📢',
    category: 'Reconocimiento',
    description: 'Muestra tu anuncio al máximo número de personas posible.',
    objective: 'OUTCOME_AWARENESS',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: null,
      optimizationGoal: 'REACH',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      budgetType: 'daily',
      suggestedBudget: 40000,
      minBudget: 15000,
      maxBudget: 500000,
      frequencyCap: { value: 2, days: 7 },
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace', 'right_hand_column'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: ['messenger_home', 'story'],
          audience_network: ['classic']
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'OPTIONAL', requiresUrl: false },
      allowedCtas: ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'CONTACT_US'],
      defaultCta: 'LEARN_MORE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['Conócenos', 'Somos [Marca]', 'Descubre quiénes somos', 'Tu nuevo aliado', 'Llegamos para ti'],
      descriptions: ['Conoce nuestra marca.', 'Lo que nos hace diferentes.', 'Más de X años de experiencia.', 'Miles de clientes satisfechos.', 'La calidad que mereces.'],
      primaryTexts: ['Somos [Marca] y queremos que nos conozcas. Descubre por qué miles de personas confían en nosotros.', 'Llegamos para cambiar las reglas del juego. Conoce nuestra propuesta.', 'Más que una marca, somos tu aliado. Descubre todo lo que tenemos para ti.', 'La calidad y el servicio que buscabas. Ahora más cerca de ti.', 'Conoce la marca que está revolucionando la industria.'],
      ctas: ['LEARN_MORE', 'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'CONTACT_US']
    }
  },
  {
    id: 'awareness_brand',
    name: 'Reconocimiento de Marca',
    icon: '🏆',
    category: 'Reconocimiento',
    description: 'Aumenta el recuerdo de tu marca entre tu audiencia objetivo.',
    objective: 'OUTCOME_AWARENESS',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: null,
      optimizationGoal: 'AD_RECALL_LIFT',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      budgetType: 'daily',
      suggestedBudget: 50000,
      minBudget: 20000,
      maxBudget: 600000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds', 'story', 'reels'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: [],
          audience_network: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO'],
      defaultFormat: 'SINGLE_VIDEO',
      destinationConfig: { type: 'OPTIONAL', requiresUrl: false },
      allowedCtas: ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP'],
      defaultCta: 'LEARN_MORE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['[Marca] - Tu mejor opción', 'Confía en los expertos', 'Calidad garantizada', 'Líderes en el mercado', 'La marca que conoces'],
      descriptions: ['La marca líder en su categoría.', 'Más de X años de experiencia.', 'Calidad que se nota.', 'Tu confianza, nuestro compromiso.', 'Siempre contigo.'],
      primaryTexts: ['[Marca] - La opción preferida por miles de colombianos. Calidad, confianza y experiencia.', 'Cuando pienses en [categoría], piensa en [Marca]. Tu mejor aliado.', 'La marca que ha acompañado a miles de familias. Ahora más cerca de ti.', 'Tradición, calidad y compromiso. Eso es [Marca].', 'Nos conoces, confías en nosotros. Seguimos trabajando para ti.'],
      ctas: ['LEARN_MORE', 'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'LEARN_MORE']
    }
  },
  {
    id: 'awareness_video_reach',
    name: 'Video para Alcance',
    icon: '📺',
    category: 'Reconocimiento',
    description: 'Muestra tu video al máximo número de personas.',
    objective: 'OUTCOME_AWARENESS',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: null,
      optimizationGoal: 'REACH',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      budgetType: 'daily',
      suggestedBudget: 45000,
      minBudget: 15000,
      maxBudget: 500000,
      frequencyCap: { value: 2, days: 7 },
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'instream_video'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: [],
          audience_network: ['rewarded_video']
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_VIDEO'],
      defaultFormat: 'SINGLE_VIDEO',
      destinationConfig: { type: 'OPTIONAL', requiresUrl: false },
      allowedCtas: ['LEARN_MORE', 'WATCH_MORE', 'SHOP_NOW'],
      defaultCta: 'LEARN_MORE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['Conoce nuestra historia', 'Mira quiénes somos', 'Video institucional', 'Descubre [Marca]', 'Nuestra propuesta'],
      descriptions: ['Un video que tienes que ver.', 'Conoce nuestra historia.', 'Lo que nos hace únicos.', 'Descubre más sobre nosotros.', 'Te presentamos [Marca].'],
      primaryTexts: ['Mira este video y conoce la historia detrás de [Marca].', 'Un minuto para descubrir quiénes somos y qué hacemos.', 'Te invitamos a conocernos. Mira nuestro video.', 'La historia que queremos compartir contigo. Dale play.', 'Descubre por qué somos diferentes. Mira el video.'],
      ctas: ['WATCH_MORE', 'LEARN_MORE', 'WATCH_MORE', 'SHOP_NOW', 'LEARN_MORE']
    }
  },
  {
    id: 'awareness_store_traffic',
    name: 'Tráfico a Tienda Física',
    icon: '🏪',
    category: 'Reconocimiento',
    description: 'Atrae personas a tu tienda física o local comercial.',
    objective: 'OUTCOME_AWARENESS',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: 'STORE',
      optimizationGoal: 'REACH',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      requiresStoreLocation: true,
      budgetType: 'daily',
      suggestedBudget: 40000,
      minBudget: 15000,
      maxBudget: 400000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        useLocalRadius: true,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: [],
          audience_network: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'STORE', requiresUrl: false, requiresAddress: true },
      allowedCtas: ['GET_DIRECTIONS', 'LEARN_MORE', 'CALL_NOW', 'SHOP_NOW'],
      defaultCta: 'GET_DIRECTIONS',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['Visítanos hoy', 'Estamos cerca de ti', 'Te esperamos', 'Ven a conocernos', 'Tienda física'],
      descriptions: ['Encuentra nuestra tienda.', 'A minutos de tu ubicación.', 'Horario: Lunes a Sábado.', 'Atención personalizada.', 'Te esperamos con ofertas.'],
      primaryTexts: ['¡Visítanos! Estamos cerca de ti con las mejores ofertas.', 'Nada como ver y tocar los productos. Ven a nuestra tienda.', 'Atención personalizada te espera. Visita nuestra sucursal.', 'Ofertas exclusivas solo en tienda física. Te esperamos.', 'Encuentra todo lo que buscas en nuestra tienda. ¡Ven hoy!'],
      ctas: ['GET_DIRECTIONS', 'GET_DIRECTIONS', 'CALL_NOW', 'LEARN_MORE', 'SHOP_NOW']
    }
  },
  {
    id: 'awareness_local',
    name: 'Promoción Local',
    icon: '📍',
    category: 'Reconocimiento',
    description: 'Promociona tu negocio en un área geográfica específica.',
    objective: 'OUTCOME_AWARENESS',
    specialAdCategories: [],
    buyingType: 'AUCTION',
    adSetConfig: {
      conversionLocation: null,
      optimizationGoal: 'REACH',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      requiresPixel: false,
      budgetType: 'daily',
      suggestedBudget: 35000,
      minBudget: 10000,
      maxBudget: 300000,
      scheduleConfig: { allowScheduling: true, allowEndDate: true },
      audienceConfig: {
        allowAdvantage: true,
        allowCustomAudiences: true,
        useLocalRadius: true,
        radiusKm: 10,
        defaultTargeting: { geo_locations: { countries: ['CO'] }, age_min: 18, age_max: 65, genders: [0] }
      },
      placementsConfig: {
        allowAdvantage: true,
        defaultPlacements: {
          facebook: ['feed', 'video_feeds', 'story', 'reels', 'marketplace'],
          instagram: ['stream', 'story', 'reels', 'explore'],
          messenger: [],
          audience_network: []
        }
      }
    },
    adConfig: {
      allowedFormats: ['SINGLE_IMAGE', 'SINGLE_VIDEO', 'CAROUSEL'],
      defaultFormat: 'SINGLE_IMAGE',
      destinationConfig: { type: 'OPTIONAL', requiresUrl: false },
      allowedCtas: ['LEARN_MORE', 'GET_DIRECTIONS', 'CALL_NOW', 'WHATSAPP_MESSAGE', 'SHOP_NOW'],
      defaultCta: 'LEARN_MORE',
      trackingConfig: { requiresPixel: false }
    },
    creativeContent: {
      headlines: ['En tu zona', 'Cerca de ti', 'Tu vecino de confianza', 'En [Ciudad]', 'Local para ti'],
      descriptions: ['Negocio local a tu servicio.', 'Atención en tu zona.', 'Somos de aquí.', 'Conocemos tu barrio.', 'Tu comunidad, nuestro compromiso.'],
      primaryTexts: ['Somos un negocio local comprometido con nuestra comunidad. ¡Conócenos!', 'En tu zona, a tu servicio. Somos tu opción de confianza.', 'Negocio de barrio con calidad de primera. Te esperamos.', 'Apoya lo local. Somos tu vecino de confianza.', 'Atención cercana y personalizada. Estamos aquí para ti.'],
      ctas: ['LEARN_MORE', 'GET_DIRECTIONS', 'CALL_NOW', 'WHATSAPP_MESSAGE', 'SHOP_NOW']
    }
  }
];

// ============================================
// FUNCIONES HELPER
// ============================================

// Obtener plantillas por categoría
export const getTemplatesByCategory = (category) => {
  if (category === 'all' || !category) return CAMPAIGN_TEMPLATES;
  return CAMPAIGN_TEMPLATES.filter(t => t.category === category);
};

// Obtener todas las categorías únicas
export const getCategories = () => {
  const categories = [...new Set(CAMPAIGN_TEMPLATES.map(t => t.category))];
  return ['all', ...categories];
};

// Obtener plantilla por ID
export const getTemplateById = (id) => {
  return CAMPAIGN_TEMPLATES.find(t => t.id === id);
};

// Obtener campos requeridos para una plantilla
export const getRequiredFieldsForTemplate = (template) => {
  const required = ['campaignName', 'adAccountId', 'pageId', 'dailyBudget'];

  if (template.adSetConfig.requiresPixel) required.push('pixelId');
  if (template.adSetConfig.requiresWhatsApp) required.push('whatsappNumber');
  if (template.adSetConfig.requiresPhoneNumber) required.push('phoneNumber');
  if (template.adSetConfig.requiresLeadForm) required.push('leadFormId');
  if (template.adSetConfig.requiresCatalog) required.push('catalogId');
  if (template.adSetConfig.requiresApp) required.push('appId');
  if (template.adSetConfig.requiresInstagram) required.push('instagramAccountId');
  if (template.adSetConfig.requiresStoreLocation) required.push('storeAddress');

  if (template.adConfig.destinationConfig.requiresUrl) required.push('linkUrl');
  if (template.adConfig.destinationConfig.requiresWhatsAppNumber) required.push('whatsappNumber');
  if (template.adConfig.destinationConfig.requiresPhoneNumber) required.push('phoneNumber');

  return [...new Set(required)];
};

// Verificar si una plantilla requiere recursos específicos
export const getTemplateRequirements = (template) => {
  return {
    pixel: template.adSetConfig.requiresPixel || false,
    whatsapp: template.adSetConfig.requiresWhatsApp || template.adConfig.destinationConfig.requiresWhatsAppNumber || false,
    phone: template.adSetConfig.requiresPhoneNumber || template.adConfig.destinationConfig.requiresPhoneNumber || false,
    leadForm: template.adSetConfig.requiresLeadForm || false,
    catalog: template.adSetConfig.requiresCatalog || false,
    app: template.adSetConfig.requiresApp || false,
    instagram: template.adSetConfig.requiresInstagram || false,
    website: template.adConfig.destinationConfig.requiresUrl || false,
    store: template.adSetConfig.requiresStoreLocation || false
  };
};

// Obtener CTA por valor
export const getCTALabel = (value) => {
  const cta = CTA_OPTIONS.find(c => c.value === value);
  return cta ? cta.label : value;
};

export default CAMPAIGN_TEMPLATES;
