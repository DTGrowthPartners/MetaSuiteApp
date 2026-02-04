import { useState, useEffect } from 'react';
import MetaAdsService from '../services/metaAdsApi';
import {
  CAMPAIGN_TEMPLATES,
  CTA_OPTIONS,
  getCategories,
  getTemplatesByCategory,
  getTemplateRequirements,
  getCTALabel
} from '../config/campaignTemplates';
import './CreativeBuilder.css';

// Token de acceso de 3 meses con permisos: pages_show_list, ads_management, ads_read, business_management, pages_read_engagement
const ACCESS_TOKEN = 'EAALFI7ZB5B9MBQrzKEhsGwlcsa820qgiSn6ZA4XlfCZBTNGZBfZAHY6UN4ttDdRKjsuO2EFEBM6DA4hdSR5NFfxniZBhrdkneOaSA6YwuUGjiMYn59UyQSKTfhPkahJF4ZBOvBeevWAWnYa46nXKzKvfWOcZAEdS6K9TGkST76XXOrPcshkgnPmZCmSt7ls4XHx95';

// Prefijo para identificar campañas creadas por CARLOS
const CAMPAIGN_PREFIX = 'CARLOS - ';

// Las plantillas ahora se importan desde campaignTemplates.js

// ============================================
// TEMPLATE SELECTOR COMPONENT - Selección de plantilla
// ============================================
function TemplateSelector({ onSelectTemplate }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = getCategories();
  const filteredTemplates = getTemplatesByCategory(selectedCategory);

  // Función para obtener badges de requisitos
  const getRequirementBadges = (template) => {
    const reqs = getTemplateRequirements(template);
    const badges = [];
    if (reqs.pixel) badges.push({ label: 'Pixel', color: '#e74c3c' });
    if (reqs.whatsapp) badges.push({ label: 'WhatsApp', color: '#25D366' });
    if (reqs.catalog) badges.push({ label: 'Catálogo', color: '#9b59b6' });
    if (reqs.leadForm) badges.push({ label: 'Formulario', color: '#3498db' });
    if (reqs.website) badges.push({ label: 'URL', color: '#2ecc71' });
    return badges;
  };

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
        {filteredTemplates.map(template => {
          const requirements = getRequirementBadges(template);
          const suggestedBudget = template.adSetConfig?.suggestedBudget || template.suggestedBudget || 50000;
          const ctaList = template.creativeContent?.ctas || template.ctas || [];

          return (
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

                {/* Badges de requisitos */}
                {requirements.length > 0 && (
                  <div className="template-requirements">
                    {requirements.map((req, idx) => (
                      <span key={idx} className="requirement-badge" style={{ backgroundColor: req.color }}>
                        {req.label}
                      </span>
                    ))}
                  </div>
                )}

                <div className="template-meta">
                  <span className="meta-item">
                    <strong>Presupuesto:</strong> ${new Intl.NumberFormat('es-CO').format(suggestedBudget)} COP/día
                  </span>
                  <span className="meta-item">
                    <strong>CTAs:</strong> {[...new Set(ctaList)].slice(0, 3).map(c => getCTALabel(c)).join(', ')}
                  </span>
                </div>
              </div>
              <div className="template-arrow">→</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// TEMPLATE PREVIEW COMPONENT - Vista previa del contenido
// ============================================
function TemplatePreview({ template, onClose }) {
  const content = template.creativeContent || {};
  const headlines = content.headlines || template.headlines || [];
  const descriptions = content.descriptions || template.descriptions || [];
  const primaryTexts = content.primaryTexts || [];
  const ctas = content.ctas || template.ctas || [];
  const requirements = getTemplateRequirements(template);

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
          {/* Configuración técnica */}
          <div className="preview-section">
            <h4>Configuración</h4>
            <ul className="config-list">
              <li><strong>Objetivo:</strong> {template.objective}</li>
              <li><strong>Optimización:</strong> {template.adSetConfig?.optimizationGoal}</li>
              <li><strong>Ubicación:</strong> {template.adSetConfig?.conversionLocation || 'N/A'}</li>
              <li><strong>Formatos:</strong> {template.adConfig?.allowedFormats?.join(', ')}</li>
            </ul>
          </div>

          {/* Requisitos */}
          {Object.values(requirements).some(v => v) && (
            <div className="preview-section">
              <h4>Requisitos</h4>
              <ul className="requirements-list">
                {requirements.pixel && <li>Pixel de Meta configurado</li>}
                {requirements.whatsapp && <li>Número de WhatsApp Business</li>}
                {requirements.catalog && <li>Catálogo de productos</li>}
                {requirements.leadForm && <li>Formulario de leads</li>}
                {requirements.website && <li>URL de destino</li>}
                {requirements.phone && <li>Número de teléfono</li>}
              </ul>
            </div>
          )}

          {headlines.length > 0 && (
            <div className="preview-section">
              <h4>Títulos Pre-configurados</h4>
              <ul>
                {headlines.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          )}

          {primaryTexts.length > 0 && (
            <div className="preview-section">
              <h4>Textos Primarios</h4>
              <ul>
                {primaryTexts.slice(0, 3).map((t, i) => <li key={i}>{t.substring(0, 100)}...</li>)}
              </ul>
            </div>
          )}

          {descriptions.length > 0 && (
            <div className="preview-section">
              <h4>Descripciones</h4>
              <ul>
                {descriptions.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}

          {ctas.length > 0 && (
            <div className="preview-section">
              <h4>CTAs</h4>
              <div className="cta-badges">
                {[...new Set(ctas)].map((cta, i) => (
                  <span key={i} className="cta-badge">
                    {getCTALabel(cta)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// UPLOAD STEP COMPONENT - Configuración rápida post-plantilla
// ============================================
function UploadStep({ adAccounts, onJobCreated, selectedTemplate, onBackToTemplates }) {
  // Obtener configuración de la plantilla (nueva estructura)
  const templateContent = selectedTemplate?.creativeContent || {};
  const templateAdSetConfig = selectedTemplate?.adSetConfig || {};
  const templateAdConfig = selectedTemplate?.adConfig || {};
  const templateRequirements = getTemplateRequirements(selectedTemplate);

  const [campaignName, setCampaignName] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dailyBudget, setDailyBudget] = useState(
    (templateAdSetConfig.suggestedBudget || selectedTemplate?.suggestedBudget || 50000).toString()
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Campos obligatorios para crear el anuncio
  const [linkUrl, setLinkUrl] = useState(''); // URL de destino
  // NOTA: La funcionalidad de imagen está deshabilitada temporalmente

  // Campos dinámicos según tipo de campaña
  const [whatsappNumber, setWhatsappNumber] = useState(''); // Para campañas de WhatsApp
  const [phoneNumber, setPhoneNumber] = useState(''); // Para campañas de llamadas

  // Páginas de Facebook
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [loadingPages, setLoadingPages] = useState(false);

  // Audiences (Saved + Custom)
  const [allAudiences, setAllAudiences] = useState([]);
  const [selectedAudience, setSelectedAudience] = useState('');
  const [loadingAudiences, setLoadingAudiences] = useState(false);
  const [audienceError, setAudienceError] = useState('');

  // Creative Copy - Inicializado desde la plantilla (nueva estructura)
  const [headlines, setHeadlines] = useState(
    templateContent.headlines || selectedTemplate?.headlines || ['', '', '', '', '']
  );
  const [descriptions, setDescriptions] = useState(
    templateContent.descriptions || selectedTemplate?.descriptions || ['', '', '', '', '']
  );
  const [ctas, setCtas] = useState(
    templateContent.ctas || selectedTemplate?.ctas || ['LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE']
  );

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

    // Validar URL solo si es requerida
    if (templateRequirements.website && !linkUrl.trim()) {
      setError('Por favor ingresa la URL de destino');
      return;
    }

    // Validar WhatsApp si es requerido
    if (templateRequirements.whatsapp && !whatsappNumber.trim()) {
      setError('Por favor ingresa el número de WhatsApp (ej: 573001234567)');
      return;
    }

    // Validar teléfono si es requerido
    if (templateRequirements.phone && !phoneNumber.trim()) {
      setError('Por favor ingresa el número de teléfono');
      return;
    }

    // NOTA: La validación de imagen está deshabilitada temporalmente

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

      // Determinar tipo de campaña basado en la plantilla
      const conversionLocation = templateAdSetConfig.conversionLocation || 'WEBSITE';

      const jobData = {
        id: 'job_' + Date.now(),
        campaignName: fullCampaignName,
        adName: `${CAMPAIGN_PREFIX}${campaignName.trim()}`,
        adAccountId: selectedAccount,
        adAccountName: selectedAccountData?.name || selectedAccount,
        dailyBudgetCOP: parseFloat(dailyBudget),
        // Página de Facebook para el anuncio
        pageId: selectedPage,
        pageName: selectedPageData?.name || selectedPage,
        // URL de destino (si aplica)
        linkUrl: linkUrl.trim() || null,
        // NOTA: imageUrl deshabilitado temporalmente
        imageUrl: null,
        // Campos dinámicos según tipo
        whatsappNumber: whatsappNumber.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
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
        conversionLocation: conversionLocation,
        campaignType: `${selectedTemplate?.category?.toUpperCase() || 'TRAFFIC'}_${conversionLocation}`,
        objective: selectedTemplate?.objective || 'OUTCOME_TRAFFIC',
        optimizationGoal: templateAdSetConfig.optimizationGoal || selectedTemplate?.optimizationGoal || 'LANDING_PAGE_VIEWS',
        billingEvent: templateAdSetConfig.billingEvent || 'IMPRESSIONS',
        // CTAs permitidos
        allowedCtas: templateAdConfig.allowedCtas || [],
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

        {/* Landing Page URL - Solo si es requerido */}
        {templateRequirements.website && (
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
        )}

        {/* WhatsApp Number - Solo si es requerido */}
        {templateRequirements.whatsapp && (
          <div className="form-group">
            <label>Número de WhatsApp *</label>
            <input
              type="tel"
              placeholder="573001234567"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              required
            />
            <p className="hint">Número con código de país sin espacios ni guiones (ej: 573001234567)</p>
          </div>
        )}

        {/* Phone Number - Solo si es requerido */}
        {templateRequirements.phone && (
          <div className="form-group">
            <label>Número de Teléfono *</label>
            <input
              type="tel"
              placeholder="+57 300 123 4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            <p className="hint">Número de teléfono para recibir llamadas</p>
          </div>
        )}

        {/* NOTA: Campo de imagen deshabilitado temporalmente */}
        <div className="form-group" style={{ background: '#fff3cd', padding: '12px', borderRadius: '8px', border: '1px solid #ffc107' }}>
          <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
            <strong>⚠️ Nota:</strong> La subida de imágenes está deshabilitada temporalmente.
            Se creará la Campaña y Ad Set. Deberás agregar el Creative manualmente en Meta Ads Manager.
          </p>
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
            Presupuesto: ${formatCOP(dailyBudget || 0)} COP/día (CBO) - Sugerido: ${formatCOP(templateAdSetConfig.suggestedBudget || selectedTemplate?.suggestedBudget || 50000)}
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
        geo_locations: { countries: ['CO'] },
        age_min: 18,
        age_max: 65
      };

      // Obtener configuración desde el job
      const objective = job.objective || 'OUTCOME_TRAFFIC';
      const optimizationGoal = job.optimizationGoal || 'LANDING_PAGE_VIEWS';
      const billingEvent = job.billingEvent || 'IMPRESSIONS';
      const conversionLocation = job.conversionLocation || 'WEBSITE';

      addLog(`Tipo: ${job.templateName || 'Campaña personalizada'}`);
      addLog(`Objetivo: ${objective}`);
      addLog(`Optimización: ${optimizationGoal}`);
      addLog(`Destino: ${conversionLocation}`);
      addLog(`Cuenta: ${job.adAccountId}`);
      addLog(`Página: ${job.pageName}`);
      addLog(`Público: ${job.savedAudienceName || 'Colombia 18-65'}`);
      addLog(`Presupuesto: $${formatCOP(job.dailyBudgetCOP)} COP/día (CBO)`);

      let result;

      // Seleccionar método de creación según el tipo de campaña
      if (conversionLocation === 'WHATSAPP' && job.whatsappNumber) {
        addLog(`WhatsApp: ${job.whatsappNumber}`);
        addLog('Creando campaña para WhatsApp...');

        result = await metaService.createCampaignForWhatsApp(job.adAccountId, {
          campaignName: job.campaignName,
          adSetName: `${job.campaignName} - Ad Set`,
          adName: job.adName,
          dailyBudget: Math.round(job.dailyBudgetCOP),
          targeting,
          pageId: job.pageId,
          whatsappNumber: job.whatsappNumber,
          imageUrl: job.imageUrl,
          headlines: job.headlines || [],
          descriptions: job.descriptions || [],
          primaryTexts: job.descriptions || [],
          callToAction: job.ctas?.[0] || 'WHATSAPP_MESSAGE'
        });

      } else if (conversionLocation === 'MESSENGER') {
        addLog('Creando campaña para Messenger...');

        result = await metaService.createCampaignForMessenger(job.adAccountId, {
          campaignName: job.campaignName,
          adSetName: `${job.campaignName} - Ad Set`,
          adName: job.adName,
          dailyBudget: Math.round(job.dailyBudgetCOP),
          targeting,
          pageId: job.pageId,
          imageUrl: job.imageUrl,
          headlines: job.headlines || [],
          descriptions: job.descriptions || [],
          primaryTexts: job.descriptions || [],
          callToAction: job.ctas?.[0] || 'SEND_MESSAGE'
        });

      } else {
        // Campaña estándar (website, traffic, etc.)
        // NOTA: Solo crea Campaign + AdSet (sin creative ni ad por ahora)
        addLog(`URL destino: ${job.linkUrl || 'N/A'}`);
        addLog('Creando solo Campaign + AdSet (sin creative)...');

        result = await metaService.createCampaignAndAdSet(job.adAccountId, {
          campaignName: job.campaignName,
          objective,
          specialAdCategories: [],
          adSetName: `${job.campaignName} - Ad Set`,
          dailyBudget: Math.round(job.dailyBudgetCOP),
          targeting,
          optimizationGoal,
          billingEvent
        });
      }

      if (result.success) {
        addLog('✅ ¡Campaña y Ad Set creados exitosamente!');
        addLog('⚠️ Recuerda agregar el Creative y Anuncio manualmente en Meta Ads Manager');
        setDraftData({
          campaignId: result.campaign?.id,
          campaignName: job.campaignName,
          adSetId: result.adSet?.id,
          creativeId: result.creative?.id || null,
          adId: result.ad?.id || null,
          adName: job.adName,
          dailyBudgetCOP: job.dailyBudgetCOP,
          savedAudienceName: job.savedAudienceName,
          pageName: job.pageName,
          linkUrl: job.linkUrl,
          whatsappNumber: job.whatsappNumber,
          conversionLocation: conversionLocation,
          objective: objective,
          optimizationGoal: optimizationGoal,
          headlines: job.headlines || [],
          descriptions: job.descriptions || [],
          ctas: job.ctas || [],
          status: 'PAUSED',
          // Flag para indicar que falta el creative
          needsCreative: !result.creative && !result.ad
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
          <div className="success-icon">{draftData.needsCreative ? '⚠️' : '✅'}</div>
          <h2>{draftData.needsCreative ? '¡Campaña y Ad Set Creados!' : '¡Campaña Completa Creada!'}</h2>
          <p>
            {draftData.needsCreative
              ? <>Tu campaña y ad set han sido creados en Meta Ads Manager en estado <strong>PAUSADO</strong>. <span style={{color: '#cc6600'}}>Falta agregar el Creative y Anuncio manualmente.</span></>
              : <>Tu campaña, ad set y anuncio han sido creados en Meta Ads Manager en estado <strong>PAUSADO</strong>.</>
            }
          </p>

          <div className="draft-details">
            <div className="draft-card">
              <span className="card-icon">📊</span>
              <div>
                <h4>Campaña</h4>
                <p>{draftData.campaignName}</p>
                <p className="hint">ID: {draftData.campaignId}</p>
                <p className="hint">Objetivo: {draftData.objective || 'OUTCOME_TRAFFIC'}</p>
                <p className="hint">Destino: {draftData.conversionLocation || 'WEBSITE'}</p>
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

            {draftData.adId && (
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
            )}

            {draftData.needsCreative && (
              <div className="draft-card" style={{ background: '#fff3cd', borderColor: '#ffc107' }}>
                <span className="card-icon">⚠️</span>
                <div>
                  <h4>Creative y Anuncio Pendientes</h4>
                  <p style={{ color: '#856404' }}>Debes agregar el creative (imagen/video) y crear el anuncio manualmente en Meta Ads Manager.</p>
                </div>
              </div>
            )}
          </div>

          {/* Resumen del contenido creativo - DESHABILITADO TEMPORALMENTE */}

          <div className="next-steps">
            <h3>Próximos Pasos</h3>
            <ol>
              <li>Ve a <a href="https://business.facebook.com/adsmanager" target="_blank" rel="noopener noreferrer">Meta Ads Manager</a></li>
              {draftData.needsCreative && (
                <>
                  <li><strong style={{color: '#cc6600'}}>Agrega un Creative (imagen/video) al Ad Set</strong></li>
                  <li><strong style={{color: '#cc6600'}}>Crea el Anuncio dentro del Ad Set</strong></li>
                </>
              )}
              <li>Revisa la configuración de la campaña</li>
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
        {job.conversionLocation === 'WHATSAPP' ? (
          <><span>💬</span> Campaña de WhatsApp - Optimizada para Conversaciones</>
        ) : job.conversionLocation === 'MESSENGER' ? (
          <><span>💭</span> Campaña de Messenger - Optimizada para Conversaciones</>
        ) : job.conversionLocation === 'CALLS' ? (
          <><span>📞</span> Campaña de Llamadas - Optimizada para Llamadas</>
        ) : (
          <><span>🌐</span> {job.templateName || 'Campaña de Tráfico Web'} - {job.optimizationGoal || 'Landing Page Views'}</>
        )}
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
          {/* URL de destino - solo si aplica */}
          {job.linkUrl && (
            <div className="summary-item" style={{ gridColumn: '1 / -1' }}>
              <label>URL de Destino</label>
              <p style={{ wordBreak: 'break-all' }}>{job.linkUrl}</p>
            </div>
          )}
          {/* WhatsApp - solo si aplica */}
          {job.whatsappNumber && (
            <div className="summary-item" style={{ gridColumn: '1 / -1' }}>
              <label>Número de WhatsApp</label>
              <p>{job.whatsappNumber}</p>
            </div>
          )}
          {/* Teléfono - solo si aplica */}
          {job.phoneNumber && (
            <div className="summary-item" style={{ gridColumn: '1 / -1' }}>
              <label>Número de Teléfono</label>
              <p>{job.phoneNumber}</p>
            </div>
          )}
          {/* Imagen deshabilitada temporalmente
          <div className="summary-item" style={{ gridColumn: '1 / -1' }}>
            <label>Imagen del Anuncio</label>
            <p style={{ wordBreak: 'break-all' }}>{job.imageUrl}</p>
          </div>
          */}
        </div>

        {/* Creative Copy Summary - DESHABILITADO TEMPORALMENTE
        {(job.headlines?.length > 0 || job.descriptions?.length > 0) && (
          <div className="creative-summary">
            ...
          </div>
        )}
        */}
      </div>

      <div className="info-box">
        <span className="info-icon">ℹ️</span>
        <div>
          <p><strong>Se creará en Meta Ads:</strong></p>
          <ul>
            <li><strong>1 Campaña</strong> - Objetivo: {job.objective || 'Tráfico'} (PAUSADA)</li>
            <li><strong>1 Ad Set</strong> - Optimización: {job.optimizationGoal || 'Landing Page Views'}</li>
          </ul>
          <p style={{ marginTop: '10px', color: '#cc6600' }}>
            <strong>⚠️ Nota:</strong> El Creative y Anuncio deberás agregarlos manualmente en Meta Ads Manager.
          </p>
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
