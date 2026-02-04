import { useState, useEffect } from 'react';
import MetaAdsService from '../services/metaAdsApi';
import './CreativeBuilder.css';

// Token de acceso de 3 meses con permisos: pages_show_list, ads_management, ads_read, business_management, pages_read_engagement
const ACCESS_TOKEN = 'EAALFI7ZB5B9MBQrzKEhsGwlcsa820qgiSn6ZA4XlfCZBTNGZBfZAHY6UN4ttDdRKjsuO2EFEBM6DA4hdSR5NFfxniZBhrdkneOaSA6YwuUGjiMYn59UyQSKTfhPkahJF4ZBOvBeevWAWnYa46nXKzKvfWOcZAEdS6K9TGkST76XXOrPcshkgnPmZCmSt7ls4XHx95';

// Prefijo para identificar campañas creadas por CARLOS
const CAMPAIGN_PREFIX = 'CARLOS - ';

// Opciones de CTA disponibles en Meta Ads
const CTA_OPTIONS = [
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
  { value: 'WHATSAPP_MESSAGE', label: 'WhatsApp' }
];

// ============================================
// PLANTILLAS DE CAMPAÑAS PRE-CONFIGURADAS
// ============================================
const CAMPAIGN_TEMPLATES = [
  {
    id: 'traffic_landing',
    name: 'Tráfico a Landing Page',
    icon: '🌐',
    category: 'Tráfico',
    description: 'Lleva visitantes a tu sitio web o landing page. Ideal para captación de leads.',
    objective: 'OUTCOME_TRAFFIC',
    optimizationGoal: 'LANDING_PAGE_VIEWS',
    suggestedBudget: 50000,
    headlines: [
      '¡Descubre cómo transformar tu negocio!',
      'La solución que estabas buscando',
      'Resultados garantizados',
      'Empieza hoy mismo',
      'Tu éxito comienza aquí'
    ],
    descriptions: [
      'Miles de empresarios ya están usando esta estrategia para hacer crecer su negocio. ¿Qué esperas para unirte?',
      'Descubre el método probado que ha ayudado a cientos de emprendedores a alcanzar sus metas.',
      'No dejes pasar esta oportunidad única. Haz clic y conoce todos los detalles.',
      'Aprende los secretos que los expertos no quieren que sepas. Información exclusiva.',
      'Transforma tu vida y tu negocio con esta metodología revolucionaria.'
    ],
    ctas: ['LEARN_MORE', 'LEARN_MORE', 'SIGN_UP', 'LEARN_MORE', 'LEARN_MORE']
  },
  {
    id: 'traffic_ecommerce',
    name: 'Tráfico a Tienda Online',
    icon: '🛒',
    category: 'Tráfico',
    description: 'Dirige compradores potenciales a tu tienda online o catálogo de productos.',
    objective: 'OUTCOME_TRAFFIC',
    optimizationGoal: 'LANDING_PAGE_VIEWS',
    suggestedBudget: 75000,
    headlines: [
      '¡Ofertas exclusivas solo por hoy!',
      'Los productos que amas, al mejor precio',
      'Envío gratis en tu primera compra',
      'Calidad premium, precios increíbles',
      'Tu próximo favorito te espera'
    ],
    descriptions: [
      'Encuentra los productos más buscados con descuentos de hasta el 50%. Stock limitado.',
      'Miles de clientes satisfechos nos respaldan. Compra segura y garantizada.',
      'No te pierdas nuestras promociones especiales. Válido hasta agotar existencias.',
      'La mejor selección de productos al alcance de un clic. Compra fácil y rápido.',
      'Descubre por qué somos la tienda preferida de miles de compradores.'
    ],
    ctas: ['SHOP_NOW', 'SHOP_NOW', 'GET_OFFER', 'SHOP_NOW', 'LEARN_MORE']
  },
  {
    id: 'traffic_services',
    name: 'Promoción de Servicios',
    icon: '💼',
    category: 'Tráfico',
    description: 'Promociona tus servicios profesionales y genera consultas de clientes potenciales.',
    objective: 'OUTCOME_TRAFFIC',
    optimizationGoal: 'LANDING_PAGE_VIEWS',
    suggestedBudget: 60000,
    headlines: [
      'Expertos a tu servicio',
      'Soluciones profesionales garantizadas',
      'Consulta sin compromiso',
      'Calidad que marca la diferencia',
      'Tu proyecto, nuestra prioridad'
    ],
    descriptions: [
      'Contamos con años de experiencia brindando soluciones de alta calidad a nuestros clientes.',
      'Nuestro equipo de expertos está listo para ayudarte a alcanzar tus objetivos.',
      'Agenda una consulta gratuita y descubre cómo podemos ayudarte.',
      'Servicios personalizados que se adaptan a tus necesidades específicas.',
      'Confía en profesionales comprometidos con tu éxito.'
    ],
    ctas: ['GET_QUOTE', 'CONTACT_US', 'LEARN_MORE', 'GET_QUOTE', 'CONTACT_US']
  },
  {
    id: 'traffic_events',
    name: 'Promoción de Eventos',
    icon: '🎉',
    category: 'Tráfico',
    description: 'Promociona eventos, webinars, talleres o conferencias y aumenta tus registros.',
    objective: 'OUTCOME_TRAFFIC',
    optimizationGoal: 'LANDING_PAGE_VIEWS',
    suggestedBudget: 45000,
    headlines: [
      '¡No te lo puedes perder!',
      'Cupos limitados - Reserva ahora',
      'El evento del año',
      'Aprende de los mejores',
      'Una experiencia única'
    ],
    descriptions: [
      'Únete a cientos de participantes en este evento exclusivo. Cupos limitados disponibles.',
      'Aprende estrategias prácticas que podrás aplicar inmediatamente en tu negocio.',
      'Networking, contenido de valor y sorpresas te esperan. ¡Regístrate ya!',
      'No dejes que otros te cuenten. Vive la experiencia en primera persona.',
      'Este es el momento de dar el siguiente paso. ¡Te esperamos!'
    ],
    ctas: ['SIGN_UP', 'SIGN_UP', 'BOOK_TRAVEL', 'LEARN_MORE', 'SIGN_UP']
  },
  {
    id: 'traffic_content',
    name: 'Contenido / Blog',
    icon: '📝',
    category: 'Tráfico',
    description: 'Promociona artículos, guías o contenido educativo para atraer lectores.',
    objective: 'OUTCOME_TRAFFIC',
    optimizationGoal: 'LANDING_PAGE_VIEWS',
    suggestedBudget: 35000,
    headlines: [
      'Guía completa [GRATIS]',
      'Los 10 secretos que debes conocer',
      'Aprende en 5 minutos',
      'La guía definitiva',
      'Información que cambiará tu perspectiva'
    ],
    descriptions: [
      'Descarga nuestra guía gratuita y descubre los secretos que los expertos usan a diario.',
      'Contenido exclusivo diseñado para ayudarte a mejorar tus resultados.',
      'Miles de personas ya aplicaron estos consejos. ¿Serás el próximo?',
      'Información clara, práctica y fácil de aplicar. Sin rodeos.',
      'Actualizado con las últimas tendencias y mejores prácticas del mercado.'
    ],
    ctas: ['LEARN_MORE', 'DOWNLOAD', 'LEARN_MORE', 'WATCH_MORE', 'LEARN_MORE']
  },
  {
    id: 'traffic_app',
    name: 'Promoción de App',
    icon: '📱',
    category: 'Tráfico',
    description: 'Dirige usuarios a la página de descarga de tu aplicación móvil.',
    objective: 'OUTCOME_TRAFFIC',
    optimizationGoal: 'LANDING_PAGE_VIEWS',
    suggestedBudget: 55000,
    headlines: [
      'Descarga la app GRATIS',
      'Tu vida más fácil con un clic',
      'La app #1 en su categoría',
      'Millones ya la usan',
      'Descubre la nueva forma de [X]'
    ],
    descriptions: [
      'Únete a millones de usuarios que ya disfrutan de nuestra app. Descarga gratuita.',
      'Todo lo que necesitas en la palma de tu mano. Fácil, rápido y seguro.',
      'Calificación de 4.8 estrellas. Descubre por qué somos los favoritos.',
      'Actualizaciones constantes y nuevas funciones cada mes. ¡No te quedes atrás!',
      'La app que revolucionó la forma de hacer las cosas. Pruébala ya.'
    ],
    ctas: ['DOWNLOAD', 'DOWNLOAD', 'LEARN_MORE', 'DOWNLOAD', 'DOWNLOAD']
  }
];

// ============================================
// TEMPLATE SELECTOR COMPONENT - Selección de plantilla
// ============================================
function TemplateSelector({ onSelectTemplate }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...new Set(CAMPAIGN_TEMPLATES.map(t => t.category))];

  const filteredTemplates = selectedCategory === 'all'
    ? CAMPAIGN_TEMPLATES
    : CAMPAIGN_TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <div className="template-selector">
      <h2>Selecciona una Plantilla</h2>
      <p className="subtitle">Elige el tipo de campaña que quieres crear. Ya viene pre-configurada.</p>

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all' ? 'Todas' : cat}
          </button>
        ))}
      </div>

      {/* Template Cards Grid */}
      <div className="templates-grid">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="template-card"
            onClick={() => onSelectTemplate(template)}
          >
            <div className="template-icon">{template.icon}</div>
            <div className="template-content">
              <h3>{template.name}</h3>
              <span className="template-category">{template.category}</span>
              <p className="template-description">{template.description}</p>
              <div className="template-meta">
                <span className="meta-item">
                  <strong>Presupuesto sugerido:</strong> ${new Intl.NumberFormat('es-CO').format(template.suggestedBudget)} COP/día
                </span>
                <span className="meta-item">
                  <strong>CTAs:</strong> {[...new Set(template.ctas)].map(c => CTA_OPTIONS.find(o => o.value === c)?.label).join(', ')}
                </span>
              </div>
            </div>
            <div className="template-arrow">→</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// TEMPLATE PREVIEW COMPONENT - Vista previa del contenido
// ============================================
function TemplatePreview({ template, onClose }) {
  return (
    <div className="template-preview-overlay" onClick={onClose}>
      <div className="template-preview-modal" onClick={e => e.stopPropagation()}>
        <button className="close-preview" onClick={onClose}>×</button>

        <div className="preview-header">
          <span className="preview-icon">{template.icon}</span>
          <h2>{template.name}</h2>
          <span className="preview-category">{template.category}</span>
        </div>

        <div className="preview-content">
          <div className="preview-section">
            <h4>Títulos Pre-configurados</h4>
            <ul>
              {template.headlines.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </div>

          <div className="preview-section">
            <h4>Descripciones Pre-configuradas</h4>
            <ul>
              {template.descriptions.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>

          <div className="preview-section">
            <h4>CTAs</h4>
            <div className="cta-badges">
              {template.ctas.map((cta, i) => (
                <span key={i} className="cta-badge">
                  {CTA_OPTIONS.find(c => c.value === cta)?.label || cta}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// UPLOAD STEP COMPONENT - Configuración rápida post-plantilla
// ============================================
function UploadStep({ adAccounts, onJobCreated, selectedTemplate, onBackToTemplates }) {
  const [campaignName, setCampaignName] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dailyBudget, setDailyBudget] = useState(selectedTemplate?.suggestedBudget?.toString() || '50000');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Campos obligatorios para crear el anuncio
  const [linkUrl, setLinkUrl] = useState(''); // URL de destino
  const [imageUrl, setImageUrl] = useState(''); // URL de imagen para el creative

  // Páginas de Facebook
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [loadingPages, setLoadingPages] = useState(false);

  // Audiences (Saved + Custom)
  const [allAudiences, setAllAudiences] = useState([]);
  const [selectedAudience, setSelectedAudience] = useState('');
  const [loadingAudiences, setLoadingAudiences] = useState(false);
  const [audienceError, setAudienceError] = useState('');

  // Creative Copy - Inicializado desde la plantilla
  const [headlines, setHeadlines] = useState(selectedTemplate?.headlines || ['', '', '', '', '']);
  const [descriptions, setDescriptions] = useState(selectedTemplate?.descriptions || ['', '', '', '', '']);
  const [ctas, setCtas] = useState(selectedTemplate?.ctas || ['LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE']);

  // Edición avanzada toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Cargar páginas de Facebook al montar
  useEffect(() => {
    const loadPages = async () => {
      setLoadingPages(true);
      try {
        const metaService = new MetaAdsService(ACCESS_TOKEN);
        const result = await metaService.getPages();
        console.log('Pages loaded:', result);
        if (result.success && result.data) {
          setPages(result.data);
          // Auto-seleccionar la primera página
          if (result.data.length > 0) {
            setSelectedPage(result.data[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading pages:', err);
      } finally {
        setLoadingPages(false);
      }
    };
    loadPages();
  }, []);

  // Cargar todos los públicos cuando se selecciona una cuenta
  useEffect(() => {
    const loadAllAudiences = async () => {
      if (!selectedAccount) {
        setAllAudiences([]);
        setSelectedAudience('');
        setAudienceError('');
        return;
      }

      setLoadingAudiences(true);
      setAudienceError('');
      try {
        const metaService = new MetaAdsService(ACCESS_TOKEN);
        const result = await metaService.getAllAudiences(selectedAccount);

        console.log('All audiences result:', result);

        // Combinar Saved y Custom audiences
        const combined = [
          ...result.savedAudiences.map(a => ({ ...a, audienceType: 'saved' })),
          ...result.customAudiences.map(a => ({ ...a, audienceType: 'custom' }))
        ];

        setAllAudiences(combined);

        if (combined.length === 0) {
          setAudienceError(result.errors.length > 0
            ? `No se encontraron públicos. ${result.errors.join(' | ')}`
            : 'No hay públicos guardados en esta cuenta. Puedes crear uno en Meta Ads Manager.'
          );
        } else {
          // Buscar y seleccionar automáticamente el público "CTG - Empresarios..."
          const defaultAudience = combined.find(a =>
            a.name.includes('CTG - Empresarios') ||
            a.name.includes('DTGP') ||
            a.name.includes('Empresarios')
          );
          if (defaultAudience) {
            setSelectedAudience(defaultAudience.id);
          }
        }
      } catch (err) {
        console.error('Error loading audiences:', err);
        setAudienceError('Error cargando públicos: ' + err.message);
      } finally {
        setLoadingAudiences(false);
      }
    };

    loadAllAudiences();
  }, [selectedAccount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!campaignName.trim()) {
      setError('Por favor ingresa un nombre para la campaña');
      return;
    }

    if (!selectedAccount) {
      setError('Por favor selecciona una cuenta publicitaria');
      return;
    }

    if (!selectedPage) {
      setError('Por favor selecciona una página de Facebook');
      return;
    }

    if (!linkUrl.trim()) {
      setError('Por favor ingresa la URL de destino');
      return;
    }

    if (!imageUrl.trim()) {
      setError('Por favor ingresa la URL de una imagen para el anuncio');
      return;
    }

    if (!dailyBudget || parseFloat(dailyBudget) < 5000) {
      setError('El presupuesto mínimo es $5,000 COP diario');
      return;
    }

    // El público es opcional - si no hay ninguno disponible, se usa targeting por defecto
    if (!selectedAudience && allAudiences.length > 0) {
      setError('Por favor selecciona un público');
      return;
    }

    setUploading(true);

    try {
      const selectedAccountData = adAccounts.find(a => a.id === selectedAccount);
      const selectedAudienceData = selectedAudience
        ? allAudiences.find(a => a.id === selectedAudience)
        : null;
      const selectedPageData = pages.find(p => p.id === selectedPage);

      // Agregar prefijo "CARLOS - " al nombre de la campaña
      const fullCampaignName = `${CAMPAIGN_PREFIX}${campaignName.trim()}`;

      const jobData = {
        id: 'job_' + Date.now(),
        campaignName: fullCampaignName,
        adName: `${CAMPAIGN_PREFIX}${campaignName.trim()}`, // Nombre del anuncio = CARLOS + nombre campaña
        adAccountId: selectedAccount,
        adAccountName: selectedAccountData?.name || selectedAccount,
        dailyBudgetCOP: parseFloat(dailyBudget), // En pesos colombianos
        // Página de Facebook para el anuncio
        pageId: selectedPage,
        pageName: selectedPageData?.name || selectedPage,
        // URL de destino y imagen
        linkUrl: linkUrl.trim(),
        imageUrl: imageUrl.trim(),
        // Público (puede ser null si no hay disponibles)
        savedAudienceId: selectedAudience || null,
        savedAudienceName: selectedAudienceData?.name || 'Colombia 18-65 (Por defecto)',
        savedAudienceTargeting: selectedAudienceData?.targeting || null,
        audienceType: selectedAudienceData?.audienceType || 'default',
        // Creative Copy (desde plantilla o editado)
        headlines: headlines.filter(h => h.trim() !== ''),
        descriptions: descriptions.filter(d => d.trim() !== ''),
        ctas: ctas,
        // Configuración desde plantilla
        templateId: selectedTemplate?.id,
        templateName: selectedTemplate?.name,
        campaignType: 'TRAFFIC_WEBSITE',
        objective: selectedTemplate?.objective || 'OUTCOME_TRAFFIC',
        optimizationGoal: selectedTemplate?.optimizationGoal || 'LANDING_PAGE_VIEWS',
        status: 'PENDING'
      };

      onJobCreated(jobData);

    } catch (err) {
      setError(err.message || 'Error creando el job');
    } finally {
      setUploading(false);
    }
  };

  // Formatear número con separadores de miles
  const formatCOP = (value) => {
    return new Intl.NumberFormat('es-CO').format(value);
  };

  return (
    <div className="upload-step">
      <button className="back-button" onClick={onBackToTemplates}>← Cambiar plantilla</button>

      {/* Template Badge */}
      <div className="selected-template-badge">
        <span className="template-badge-icon">{selectedTemplate?.icon}</span>
        <div className="template-badge-info">
          <h3>{selectedTemplate?.name}</h3>
          <p>{selectedTemplate?.description}</p>
        </div>
        <button className="preview-btn" onClick={() => setShowPreview(true)}>
          Ver contenido
        </button>
      </div>

      {showPreview && (
        <TemplatePreview template={selectedTemplate} onClose={() => setShowPreview(false)} />
      )}

      <h2>Configuración Rápida</h2>
      <p className="subtitle">Solo necesitas ajustar estos campos básicos. El contenido ya está listo.</p>

      <form onSubmit={handleSubmit}>
        {/* Campaign Name */}
        <div className="form-group">
          <label>Nombre de la Campaña *</label>
          <div className="input-with-prefix">
            <span className="input-prefix">{CAMPAIGN_PREFIX}</span>
            <input
              type="text"
              placeholder="Ej: Landing Febrero 2024"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              required
            />
          </div>
          <p className="hint">Se agregará "{CAMPAIGN_PREFIX}" al inicio para identificar tus campañas</p>
        </div>

        {/* Ad Account Selection */}
        <div className="form-group">
          <label>Cuenta Publicitaria *</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            required
          >
            <option value="">Selecciona una cuenta</option>
            {adAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.id})
              </option>
            ))}
          </select>
        </div>

        {/* Facebook Page Selection */}
        <div className="form-group">
          <label>Página de Facebook *</label>
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            disabled={loadingPages}
            required
          >
            <option value="">
              {loadingPages ? 'Cargando páginas...' : 'Selecciona una página'}
            </option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name}
              </option>
            ))}
          </select>
          <p className="hint">La página desde la cual se publicará el anuncio</p>
        </div>

        {/* Landing Page URL */}
        <div className="form-group">
          <label>URL de Destino (Landing Page) *</label>
          <input
            type="url"
            placeholder="https://tusitio.com/landing"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            required
          />
          <p className="hint">Donde llegarán los usuarios al hacer clic en el anuncio</p>
        </div>

        {/* Image URL */}
        <div className="form-group">
          <label>URL de Imagen del Anuncio *</label>
          <input
            type="url"
            placeholder="https://tusitio.com/imagen.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            required
          />
          <p className="hint">URL pública de la imagen (JPG, PNG). Recomendado: 1200x628px</p>
        </div>

        {/* Audience Selection (Saved + Custom) */}
        <div className="form-group">
          <label>Público *</label>
          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            disabled={!selectedAccount || loadingAudiences}
          >
            <option value="">
              {loadingAudiences
                ? 'Cargando públicos...'
                : !selectedAccount
                  ? 'Primero selecciona una cuenta'
                  : allAudiences.length === 0
                    ? 'No hay públicos disponibles'
                    : 'Selecciona un público'}
            </option>
            {allAudiences.map((audience) => (
              <option key={audience.id} value={audience.id}>
                {audience.audienceType === 'custom' ? '[Custom] ' : ''}{audience.name}
              </option>
            ))}
          </select>
          {audienceError && (
            <p className="hint" style={{ color: '#cc6600' }}>
              ⚠️ {audienceError}
            </p>
          )}
          {selectedAudience && !audienceError && (
            <p className="hint success">
              ✓ Público seleccionado: {allAudiences.find(a => a.id === selectedAudience)?.name}
            </p>
          )}
        </div>

        {/* Daily Budget in COP */}
        <div className="form-group">
          <label>Presupuesto Diario (COP) *</label>
          <input
            type="number"
            placeholder="50000"
            min="5000"
            step="1000"
            value={dailyBudget}
            onChange={(e) => setDailyBudget(e.target.value)}
            required
          />
          <p className="hint">
            Presupuesto: ${formatCOP(dailyBudget || 0)} COP/día (CBO) - Sugerido: ${formatCOP(selectedTemplate?.suggestedBudget || 50000)}
          </p>
        </div>

        {/* Advanced Edit Toggle */}
        <div className="advanced-toggle">
          <button
            type="button"
            className="toggle-advanced-btn"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▼ Ocultar edición avanzada' : '▶ Editar contenido (opcional)'}
          </button>
        </div>

        {/* Advanced Content Edit (Collapsed by default) */}
        {showAdvanced && (
          <div className="advanced-edit-section">
            <div className="section-divider">
              <span>Editar Contenido de la Plantilla</span>
            </div>

            {/* Headlines - 5 títulos */}
            <div className="form-group">
              <label>Títulos (5)</label>
              {headlines.map((headline, index) => (
                <input
                  key={`headline-${index}`}
                  type="text"
                  placeholder={`Título ${index + 1}`}
                  value={headline}
                  onChange={(e) => {
                    const newHeadlines = [...headlines];
                    newHeadlines[index] = e.target.value;
                    setHeadlines(newHeadlines);
                  }}
                  maxLength={40}
                  style={{ marginBottom: '8px' }}
                />
              ))}
            </div>

            {/* Descriptions - 5 descripciones */}
            <div className="form-group">
              <label>Descripciones (5)</label>
              {descriptions.map((desc, index) => (
                <textarea
                  key={`desc-${index}`}
                  placeholder={`Descripción ${index + 1}`}
                  value={desc}
                  onChange={(e) => {
                    const newDescriptions = [...descriptions];
                    newDescriptions[index] = e.target.value;
                    setDescriptions(newDescriptions);
                  }}
                  maxLength={125}
                  rows={2}
                  style={{ marginBottom: '8px', resize: 'vertical' }}
                />
              ))}
            </div>

            {/* CTAs - 5 call to actions */}
            <div className="form-group">
              <label>CTAs (5)</label>
              {ctas.map((cta, index) => (
                <select
                  key={`cta-${index}`}
                  value={cta}
                  onChange={(e) => {
                    const newCtas = [...ctas];
                    newCtas[index] = e.target.value;
                    setCtas(newCtas);
                  }}
                  style={{ marginBottom: '8px' }}
                >
                  {CTA_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>

            {/* Reset to Template Button */}
            <button
              type="button"
              className="reset-template-btn"
              onClick={() => {
                setHeadlines(selectedTemplate?.headlines || ['', '', '', '', '']);
                setDescriptions(selectedTemplate?.descriptions || ['', '', '', '', '']);
                setCtas(selectedTemplate?.ctas || ['LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE']);
              }}
            >
              Restaurar contenido original de la plantilla
            </button>
          </div>
        )}

        {error && <div className="error-message">⚠️ {error}</div>}

        <button type="submit" className="submit-button" disabled={uploading || loadingAudiences}>
          {uploading ? 'Procesando...' : 'Continuar a Crear Campaña'}
        </button>
      </form>
    </div>
  );
}

// ============================================
// DRAFT STEP COMPONENT - CREA CAMPAIGN + ADSET + CREATIVE + AD
// ============================================
function DraftStep({ job, onComplete, onBack }) {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Formatear número con separadores de miles
  const formatCOP = (value) => {
    return new Intl.NumberFormat('es-CO').format(value);
  };

  const handleCreateDraft = async () => {
    setCreating(true);
    setError('');
    setLogs([]);

    const metaService = new MetaAdsService(ACCESS_TOKEN);

    try {
      addLog('Iniciando creación de campaña completa...');

      // Usar el targeting del público guardado
      const targeting = job.savedAudienceTargeting || {
        geo_locations: {
          countries: ['CO']
        },
        age_min: 18,
        age_max: 65
      };

      const objective = 'OUTCOME_TRAFFIC';
      const optimizationGoal = 'LANDING_PAGE_VIEWS';
      const billingEvent = 'IMPRESSIONS';

      addLog(`Objetivo: ${objective}`);
      addLog(`Optimización: ${optimizationGoal}`);
      addLog(`Cuenta: ${job.adAccountId}`);
      addLog(`Página: ${job.pageName}`);
      addLog(`Público: ${job.savedAudienceName || 'Colombia 18-65'}`);
      addLog(`Presupuesto: $${formatCOP(job.dailyBudgetCOP)} COP/día (CBO)`);
      addLog(`URL destino: ${job.linkUrl}`);
      addLog(`Títulos: ${job.headlines?.length || 0}, Descripciones: ${job.descriptions?.length || 0}`);

      // Crear Campaign + AdSet + Creative + Ad completo
      const result = await metaService.createCampaignWithAd(job.adAccountId, {
        // Campaign
        campaignName: job.campaignName,
        objective,
        specialAdCategories: [],
        // AdSet
        adSetName: `${job.campaignName} - Ad Set`,
        dailyBudget: Math.round(job.dailyBudgetCOP), // COP directo en pesos
        targeting,
        optimizationGoal,
        billingEvent,
        // Creative & Ad
        adName: job.adName,
        pageId: job.pageId,
        imageUrl: job.imageUrl,
        titles: job.headlines || [],
        bodies: job.descriptions || [], // Las descripciones largas van como "bodies" (texto primario)
        descriptions: job.headlines || [], // Las descripciones cortas del link (reusamos títulos)
        callToActionTypes: job.ctas || ['LEARN_MORE'],
        linkUrl: job.linkUrl
      });

      if (result.success) {
        addLog('✅ ¡Campaña, Ad Set, Creative y Anuncio creados exitosamente!');
        setDraftData({
          campaignId: result.campaign?.id,
          campaignName: job.campaignName,
          adSetId: result.adSet?.id,
          creativeId: result.creative?.id,
          adId: result.ad?.id,
          adName: job.adName,
          dailyBudgetCOP: job.dailyBudgetCOP,
          savedAudienceName: job.savedAudienceName,
          pageName: job.pageName,
          linkUrl: job.linkUrl,
          headlines: job.headlines || [],
          descriptions: job.descriptions || [],
          ctas: job.ctas || [],
          status: 'PAUSED'
        });
        setCreated(true);
      } else {
        const errorMessages = result.errors?.join(', ') || 'Error desconocido';
        addLog(`❌ Error: ${errorMessages}`);
        setError(errorMessages);
      }

    } catch (err) {
      addLog(`❌ Error: ${err.message}`);
      setError(err.message || 'Error creando la campaña');
    } finally {
      setCreating(false);
    }
  };

  if (created && draftData) {
    return (
      <div className="draft-step">
        <div className="success-section">
          <div className="success-icon">✅</div>
          <h2>¡Campaña Completa Creada!</h2>
          <p>Tu campaña, ad set y anuncio han sido creados en Meta Ads Manager en estado <strong>PAUSADO</strong>.</p>

          <div className="draft-details">
            <div className="draft-card">
              <span className="card-icon">📊</span>
              <div>
                <h4>Campaña</h4>
                <p>{draftData.campaignName}</p>
                <p className="hint">ID: {draftData.campaignId}</p>
                <p className="hint">Objetivo: Tráfico Web (Landing Page Views)</p>
                <span className="status-badge paused">PAUSADO</span>
              </div>
            </div>

            <div className="draft-card">
              <span className="card-icon">🎯</span>
              <div>
                <h4>Conjunto de Anuncios</h4>
                <p>Presupuesto: ${formatCOP(draftData.dailyBudgetCOP)} COP/día (CBO)</p>
                <p className="hint">ID: {draftData.adSetId}</p>
                <p className="hint">Público: {draftData.savedAudienceName || 'Colombia 18-65'}</p>
                <span className="status-badge paused">PAUSADO</span>
              </div>
            </div>

            <div className="draft-card">
              <span className="card-icon">📢</span>
              <div>
                <h4>Anuncio</h4>
                <p>{draftData.adName}</p>
                <p className="hint">ID: {draftData.adId}</p>
                <p className="hint">Página: {draftData.pageName}</p>
                <p className="hint">Destino: {draftData.linkUrl}</p>
                <span className="status-badge paused">PAUSADO</span>
              </div>
            </div>
          </div>

          {/* Resumen del contenido creativo usado */}
          {(draftData.headlines?.length > 0 || draftData.descriptions?.length > 0) && (
            <div className="saved-creative-copy" style={{ background: '#e8f5e9', borderColor: '#81c784' }}>
              <h3 style={{ color: '#2e7d32' }}>📝 Contenido del Anuncio (Ya aplicado)</h3>
              <p className="hint" style={{ color: '#388e3c' }}>Este contenido ya está configurado en tu anuncio</p>

              {draftData.headlines?.length > 0 && (
                <div className="copy-section">
                  <label>Títulos ({draftData.headlines.length})</label>
                  {draftData.headlines.map((h, i) => (
                    <div key={i} className="copy-item">{h}</div>
                  ))}
                </div>
              )}

              {draftData.descriptions?.length > 0 && (
                <div className="copy-section">
                  <label>Descripciones ({draftData.descriptions.length})</label>
                  {draftData.descriptions.map((d, i) => (
                    <div key={i} className="copy-item">{d}</div>
                  ))}
                </div>
              )}

              {draftData.ctas?.length > 0 && (
                <div className="copy-section">
                  <label>CTAs</label>
                  <div className="cta-badges">
                    {[...new Set(draftData.ctas)].map((cta, i) => (
                      <span key={i} className="cta-badge">{CTA_OPTIONS.find(c => c.value === cta)?.label || cta}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="next-steps">
            <h3>Próximos Pasos</h3>
            <ol>
              <li>Ve a <a href="https://business.facebook.com/adsmanager" target="_blank" rel="noopener noreferrer">Meta Ads Manager</a></li>
              <li>Revisa la campaña, ad set y anuncio creados</li>
              <li>Ajusta cualquier configuración si es necesario</li>
              <li>Cuando estés listo, <strong>activa la campaña</strong></li>
            </ol>
          </div>

          <button className="done-button" onClick={onComplete}>
            Crear Otra Campaña
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="draft-step">
      <button className="back-button" onClick={onBack}>← Volver</button>

      <h2>Crear Campaña</h2>

      <div className="campaign-type-badge">
        <span>🌐</span> Campaña de Tráfico Web - Optimizada para Landing Page Views
      </div>

      <div className="summary-section">
        <h3>Configuración de Campaña</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <label>Nombre Campaña</label>
            <p>{job.campaignName}</p>
          </div>
          <div className="summary-item">
            <label>Nombre Anuncio</label>
            <p>{job.adName}</p>
          </div>
          <div className="summary-item">
            <label>Presupuesto Diario (CBO)</label>
            <p>${formatCOP(job.dailyBudgetCOP)} COP</p>
          </div>
          <div className="summary-item">
            <label>Cuenta Publicitaria</label>
            <p>{job.adAccountName}</p>
          </div>
          <div className="summary-item">
            <label>Página de Facebook</label>
            <p>{job.pageName}</p>
          </div>
          <div className="summary-item">
            <label>Público</label>
            <p>{job.savedAudienceName || 'Colombia 18-65'}</p>
          </div>
          <div className="summary-item" style={{ gridColumn: '1 / -1' }}>
            <label>URL de Destino</label>
            <p style={{ wordBreak: 'break-all' }}>{job.linkUrl}</p>
          </div>
          <div className="summary-item" style={{ gridColumn: '1 / -1' }}>
            <label>Imagen del Anuncio</label>
            <p style={{ wordBreak: 'break-all' }}>{job.imageUrl}</p>
          </div>
        </div>

        {/* Creative Copy Summary */}
        {(job.headlines?.length > 0 || job.descriptions?.length > 0) && (
          <div className="creative-summary">
            <h4>Contenido del Anuncio ({job.headlines?.length || 0} títulos, {job.descriptions?.length || 0} descripciones)</h4>
            {job.headlines?.length > 0 && (
              <div className="creative-list">
                <label>Títulos</label>
                <ul>
                  {job.headlines.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </div>
            )}
            {job.descriptions?.length > 0 && (
              <div className="creative-list">
                <label>Descripciones</label>
                <ul>
                  {job.descriptions.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}
            {job.ctas?.length > 0 && (
              <div className="creative-list">
                <label>CTAs</label>
                <p>{[...new Set(job.ctas)].map(c => CTA_OPTIONS.find(o => o.value === c)?.label || c).join(', ')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="info-box">
        <span className="info-icon">ℹ️</span>
        <div>
          <p><strong>Se creará en Meta Ads:</strong></p>
          <ul>
            <li><strong>1 Campaña</strong> - Objetivo: Tráfico (PAUSADA)</li>
            <li><strong>1 Ad Set</strong> - Optimización: Landing Page Views</li>
            <li><strong>1 Creative</strong> - Con {job.headlines?.length || 0} títulos y {job.descriptions?.length || 0} descripciones</li>
            <li><strong>1 Anuncio</strong> - "{job.adName}"</li>
          </ul>
        </div>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="logs-section">
          <h4>Progreso:</h4>
          {logs.map((log, i) => (
            <p key={i} className="log-line">{log}</p>
          ))}
        </div>
      )}

      {error && <div className="error-message">⚠️ {error}</div>}

      <button
        className="create-button"
        onClick={handleCreateDraft}
        disabled={creating}
      >
        {creating ? (
          <>
            <span className="spinner"></span>
            Creando en Meta...
          </>
        ) : (
          'Crear Campaña en Meta'
        )}
      </button>
    </div>
  );
}

// ============================================
// MAIN CREATIVE BUILDER COMPONENT (Con sistema de plantillas)
// ============================================
export default function CreativeBuilder({ adAccounts }) {
  const [step, setStep] = useState('templates'); // templates, config, draft
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setStep('config');
  };

  const handleBackToTemplates = () => {
    setSelectedTemplate(null);
    setStep('templates');
  };

  const handleJobCreated = (job) => {
    setCurrentJob(job);
    setStep('draft');
  };

  const handleComplete = () => {
    setCurrentJob(null);
    setSelectedTemplate(null);
    setStep('templates');
  };

  const handleBack = () => {
    setStep('config');
  };

  // Determinar el paso activo para los indicadores
  const getStepStatus = (targetStep) => {
    const stepOrder = ['templates', 'config', 'draft'];
    const currentIndex = stepOrder.indexOf(step);
    const targetIndex = stepOrder.indexOf(targetStep);

    if (currentIndex === targetIndex) return 'active';
    if (currentIndex > targetIndex) return 'completed';
    return '';
  };

  return (
    <div className="creative-builder">
      <div className="progress-steps">
        <div className={`progress-step ${getStepStatus('templates')}`}>
          <span className="step-number">1</span>
          <span className="step-label">Plantilla</span>
        </div>
        <div className="step-connector"></div>
        <div className={`progress-step ${getStepStatus('config')}`}>
          <span className="step-number">2</span>
          <span className="step-label">Configurar</span>
        </div>
        <div className="step-connector"></div>
        <div className={`progress-step ${getStepStatus('draft')}`}>
          <span className="step-number">3</span>
          <span className="step-label">Crear</span>
        </div>
      </div>

      <div className="builder-content">
        {step === 'templates' && (
          <TemplateSelector onSelectTemplate={handleSelectTemplate} />
        )}
        {step === 'config' && selectedTemplate && (
          <UploadStep
            adAccounts={adAccounts}
            onJobCreated={handleJobCreated}
            selectedTemplate={selectedTemplate}
            onBackToTemplates={handleBackToTemplates}
          />
        )}
        {step === 'draft' && currentJob && (
          <DraftStep
            job={currentJob}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
