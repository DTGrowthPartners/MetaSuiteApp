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
  const [imageUrl, setImageUrl] = useState(''); // URL de imagen para el anuncio (opcional)
  const [imageHash, setImageHash] = useState(''); // Hash de imagen subida a Meta

  // Media selector
  const [mediaSource, setMediaSource] = useState('none'); // 'none', 'library', 'upload', 'url'
  const [mediaLibrary, setMediaLibrary] = useState({ images: [], videos: [] });
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState(''); // ID de video seleccionado de la biblioteca
  const [videoThumbnailHash, setVideoThumbnailHash] = useState(''); // Hash de miniatura para video ads

  // IA Content Generation
  const [aiPrompt, setAiPrompt] = useState(''); // Descripción para generar contenido con IA
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [contentGenerated, setContentGenerated] = useState(false);

  // Campos dinámicos según tipo de campaña
  const [whatsappNumber, setWhatsappNumber] = useState(''); // Para campañas de WhatsApp
  const [phoneNumber, setPhoneNumber] = useState(''); // Para campañas de llamadas

  // Targeting: Fecha, Edad, Sexo
  const [endDate, setEndDate] = useState(''); // Fecha de finalización (opcional)
  const [ageMin, setAgeMin] = useState(18); // Edad mínima
  const [ageMax, setAgeMax] = useState(65); // Edad máxima
  const [gender, setGender] = useState('all'); // 'all', 'male', 'female'

  // Páginas de Facebook
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [loadingPages, setLoadingPages] = useState(false);

  // Cuentas de Instagram vinculadas
  const [igAccounts, setIgAccounts] = useState([]);
  const [selectedIgAccount, setSelectedIgAccount] = useState('');

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

  // Cargar biblioteca de medios de Meta
  const handleLoadMediaLibrary = async () => {
    if (!selectedAccount) return;
    setLoadingMedia(true);
    try {
      const metaService = new MetaAdsService(ACCESS_TOKEN);
      const [imgResult, vidResult] = await Promise.all([
        metaService.getAdImages(selectedAccount),
        metaService.getAdVideos(selectedAccount)
      ]);
      setMediaLibrary({
        images: imgResult.success ? imgResult.data : [],
        videos: vidResult.success ? vidResult.data : []
      });
      console.log('Media library loaded:', imgResult.data?.length, 'images,', vidResult.data?.length, 'videos');
    } catch (err) {
      console.error('Error loading media library:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  // Subir archivo desde dispositivo
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedAccount) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      setUploadProgress('Error: Solo se aceptan imágenes (JPG, PNG) o videos (MP4)');
      return;
    }

    setUploadingFile(true);
    setUploadProgress(`Subiendo ${file.name}...`);

    try {
      const metaService = new MetaAdsService(ACCESS_TOKEN);
      let result;

      if (isImage) {
        result = await metaService.uploadImageFile(selectedAccount, file);
        if (result.success) {
          setImageUrl(result.data.url || '');
          setImageHash(result.data.imageHash || '');
          setUploadProgress(`Imagen "${file.name}" subida exitosamente`);
        }
      } else {
        result = await metaService.uploadVideoFile(selectedAccount, file);
        if (result.success) {
          // Guardar videoId y limpiar imagen (el video reemplaza la imagen)
          setSelectedVideoId(result.data.videoId);
          setImageUrl('');
          setImageHash('');
          setVideoThumbnailHash(''); // Necesita seleccionar miniatura
          setUploadProgress(`Video "${file.name}" subido exitosamente (ID: ${result.data.videoId})`);
          // Cargar la biblioteca de imágenes para que pueda seleccionar miniatura
          if (mediaLibrary.images.length === 0) {
            handleLoadMediaLibrary();
          }
        }
      }

      if (!result.success) {
        setUploadProgress(`Error: ${result.error}`);
      }
    } catch (err) {
      setUploadProgress(`Error: ${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  // Seleccionar imagen de la biblioteca
  const handleSelectLibraryImage = (image) => {
    setImageUrl(image.url || '');
    setImageHash(image.hash || '');
    setSelectedVideoId('');
    setVideoThumbnailHash('');
    setUploadProgress(`Imagen seleccionada: ${image.name || 'Sin nombre'}`);
  };

  // Seleccionar video de la biblioteca
  const handleSelectLibraryVideo = (video) => {
    setSelectedVideoId(video.id);
    // Limpiar imagen principal (el video reemplaza la imagen como contenido)
    setImageUrl('');
    setImageHash('');
    setVideoThumbnailHash(''); // Resetear miniatura al cambiar de video
    setUploadProgress(`Video seleccionado: ${video.title || 'Sin título'} (${video.length ? Math.round(video.length) + 's' : ''})`);
    // Asegurar que las imágenes de la biblioteca estén cargadas para la miniatura
    if (mediaLibrary.images.length === 0) {
      handleLoadMediaLibrary();
    }
  };

  // Seleccionar miniatura para video ad
  const handleSelectVideoThumbnail = (image) => {
    setVideoThumbnailHash(image.hash || '');
  };

  // Función para generar contenido con IA
  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Por favor describe tu campaña para generar el contenido');
      return;
    }

    setGeneratingAI(true);
    setAiError('');

    try {
      const metaService = new MetaAdsService(ACCESS_TOKEN);
      const result = await metaService.generateContentWithAI(aiPrompt, selectedTemplate?.category);

      if (result.success) {
        // Actualizar los campos con el contenido generado
        setHeadlines(result.data.headlines || []);
        setDescriptions(result.data.descriptions || []);
        setCtas(result.data.ctas || ['LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE']);

        // Actualizar presupuesto sugerido si viene
        if (result.data.suggestedBudget) {
          setDailyBudget(result.data.suggestedBudget.toString());
        }

        setContentGenerated(true);
        setShowAdvanced(true); // Mostrar el contenido generado
      } else {
        setAiError(result.error || 'Error generando contenido');
      }
    } catch (err) {
      setAiError(err.message || 'Error generando contenido con IA');
    } finally {
      setGeneratingAI(false);
    }
  };

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

  // Cargar cuentas de Instagram desde la cuenta publicitaria
  useEffect(() => {
    const loadIgAccounts = async () => {
      if (!selectedAccount) {
        setIgAccounts([]);
        setSelectedIgAccount('');
        return;
      }
      try {
        const metaService = new MetaAdsService(ACCESS_TOKEN);
        const result = await metaService.getInstagramAccounts(selectedAccount);
        console.log('Instagram accounts loaded:', result);
        if (result.success && result.data.length > 0) {
          setIgAccounts(result.data);
          setSelectedIgAccount(result.data[0].id);
        } else {
          setIgAccounts([]);
          setSelectedIgAccount('');
        }
      } catch (err) {
        console.error('Error loading Instagram accounts:', err);
        setIgAccounts([]);
      }
    };
    loadIgAccounts();
  }, [selectedAccount]);

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
        // Imagen/Video para el anuncio
        imageUrl: imageUrl.trim() || null,
        imageHash: imageHash || null,
        videoId: selectedVideoId || null,
        videoThumbnailHash: videoThumbnailHash || null, // Miniatura para video ads
        noImage: !imageUrl.trim() && !imageHash && !selectedVideoId,
        // Cuenta de Instagram para el anuncio
        igActorId: selectedIgAccount || null,
        igUsername: igAccounts.find(ig => ig.id === selectedIgAccount)?.username || null,
        // Campos dinámicos según tipo
        whatsappNumber: whatsappNumber.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
        // Público (puede ser null si no hay disponibles)
        savedAudienceId: selectedAudience || null,
        savedAudienceName: selectedAudienceData?.name || `Colombia ${ageMin}-${ageMax} (Por defecto)`,
        savedAudienceTargeting: selectedAudienceData?.targeting || null,
        audienceType: selectedAudienceData?.audienceType || 'default',
        // Targeting personalizado
        endDate: endDate || null,
        ageMin: ageMin,
        ageMax: ageMax,
        gender: gender, // 'all', 'male', 'female'
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

        {/* Instagram Account Selection - cargadas desde la cuenta publicitaria */}
        {igAccounts.length > 0 && (
          <div className="form-group">
            <label>Cuenta de Instagram</label>
            <select
              value={selectedIgAccount}
              onChange={(e) => setSelectedIgAccount(e.target.value)}
            >
              <option value="">Sin Instagram</option>
              {igAccounts.map((ig) => (
                <option key={ig.id} value={ig.id}>
                  @{ig.username}
                </option>
              ))}
            </select>
            <p className="hint">El anuncio aparecerá también en Instagram con esta cuenta</p>
          </div>
        )}

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

        {/* AI Content Generation */}
        <div className="form-group ai-section">
          <label>🤖 Genera el contenido con IA</label>
          <textarea
            placeholder="Describe tu campaña... Ej: Esta campaña es para una tienda de ropa deportiva llamada 'FitWear'. Quiero promocionar nuestra nueva colección de verano con descuentos del 30%. El público objetivo son personas de 25-45 años interesadas en fitness y moda deportiva."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={4}
            style={{ resize: 'vertical' }}
          />
          <button
            type="button"
            className="ai-generate-btn"
            onClick={handleGenerateWithAI}
            disabled={generatingAI || !aiPrompt.trim()}
          >
            {generatingAI ? (
              <>
                <span className="spinner"></span>
                Generando...
              </>
            ) : (
              '✨ Generar 5+5+5 con IA'
            )}
          </button>
          {aiError && <p className="hint" style={{ color: '#cc0000' }}>⚠️ {aiError}</p>}
          {contentGenerated && <p className="hint" style={{ color: '#00aa00' }}>✅ Contenido generado. Revísalo en la sección de edición avanzada.</p>}
          <p className="hint">La IA generará 5 títulos, 5 descripciones y 5 CTAs basados en tu descripción.</p>
        </div>

        {/* Selector de Medios para el Anuncio */}
        <div className="form-group">
          <label>🖼️ Imagen del Anuncio (Opcional)</label>

          {/* Tabs de selección */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setMediaSource('none')}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '2px solid',
                borderColor: mediaSource === 'none' ? '#1877f2' : '#ddd',
                background: mediaSource === 'none' ? '#e7f3ff' : 'white',
                cursor: 'pointer', fontSize: '13px', fontWeight: mediaSource === 'none' ? 'bold' : 'normal'
              }}
            >
              Sin imagen
            </button>
            <button
              type="button"
              onClick={() => { setMediaSource('library'); handleLoadMediaLibrary(); }}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '2px solid',
                borderColor: mediaSource === 'library' ? '#1877f2' : '#ddd',
                background: mediaSource === 'library' ? '#e7f3ff' : 'white',
                cursor: 'pointer', fontSize: '13px', fontWeight: mediaSource === 'library' ? 'bold' : 'normal'
              }}
            >
              📚 Biblioteca de Meta
            </button>
            <button
              type="button"
              onClick={() => setMediaSource('upload')}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '2px solid',
                borderColor: mediaSource === 'upload' ? '#1877f2' : '#ddd',
                background: mediaSource === 'upload' ? '#e7f3ff' : 'white',
                cursor: 'pointer', fontSize: '13px', fontWeight: mediaSource === 'upload' ? 'bold' : 'normal'
              }}
            >
              📤 Subir archivo
            </button>
            <button
              type="button"
              onClick={() => setMediaSource('url')}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '2px solid',
                borderColor: mediaSource === 'url' ? '#1877f2' : '#ddd',
                background: mediaSource === 'url' ? '#e7f3ff' : 'white',
                cursor: 'pointer', fontSize: '13px', fontWeight: mediaSource === 'url' ? 'bold' : 'normal'
              }}
            >
              🔗 URL directa
            </button>
          </div>

          {/* Biblioteca de Meta */}
          {mediaSource === 'library' && (
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px', maxHeight: '300px', overflowY: 'auto' }}>
              {loadingMedia ? (
                <p style={{ textAlign: 'center', color: '#666' }}>Cargando biblioteca...</p>
              ) : (
                <>
                  {mediaLibrary.images.length === 0 && mediaLibrary.videos.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999' }}>No hay medios en esta cuenta publicitaria</p>
                  ) : (
                    <>
                      {mediaLibrary.images.length > 0 && (
                        <div>
                          <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>
                            Imágenes ({mediaLibrary.images.length})
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                            {mediaLibrary.images.map((img, i) => (
                              <div
                                key={img.hash || i}
                                onClick={() => handleSelectLibraryImage(img)}
                                style={{
                                  cursor: 'pointer',
                                  border: imageHash === img.hash ? '3px solid #1877f2' : '2px solid #eee',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  position: 'relative',
                                  aspectRatio: '1'
                                }}
                              >
                                <img
                                  src={img.url}
                                  alt={img.name || 'Ad image'}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                {imageHash === img.hash && (
                                  <div style={{
                                    position: 'absolute', top: '4px', right: '4px',
                                    background: '#1877f2', color: 'white', borderRadius: '50%',
                                    width: '20px', height: '20px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                                  }}>✓</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {mediaLibrary.videos.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>
                            Videos ({mediaLibrary.videos.length})
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                            {mediaLibrary.videos.map((vid, i) => {
                              const thumbnail = vid.thumbnails?.data?.[0]?.uri || null;
                              const isSelected = selectedVideoId === vid.id;
                              return (
                                <div
                                  key={vid.id || i}
                                  onClick={() => handleSelectLibraryVideo(vid)}
                                  style={{
                                    border: isSelected ? '3px solid #1877f2' : '2px solid #eee',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    background: isSelected ? '#e7f3ff' : 'white',
                                    position: 'relative'
                                  }}
                                >
                                  {thumbnail ? (
                                    <img src={thumbnail} alt={vid.title} style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: '100%', height: '80px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                                      🎬
                                    </div>
                                  )}
                                  <div style={{ padding: '6px 8px', fontSize: '11px' }}>
                                    <p style={{ fontWeight: 'bold', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {vid.title || 'Sin título'}
                                    </p>
                                    {vid.length && <p style={{ color: '#666', margin: 0 }}>{Math.round(vid.length)}s</p>}
                                  </div>
                                  {isSelected && (
                                    <div style={{
                                      position: 'absolute', top: '4px', right: '4px',
                                      background: '#1877f2', color: 'white', borderRadius: '50%',
                                      width: '20px', height: '20px', display: 'flex',
                                      alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                                    }}>✓</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Subir archivo */}
          {mediaSource === 'upload' && (
            <div style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/mov"
                onChange={handleFileUpload}
                disabled={uploadingFile || !selectedAccount}
                style={{ marginBottom: '10px' }}
              />
              <p className="hint">
                {!selectedAccount
                  ? '⚠️ Selecciona una cuenta publicitaria primero'
                  : uploadingFile
                    ? '⏳ ' + uploadProgress
                    : 'JPG, PNG o MP4. Tamaño recomendado: 1200x628px para imágenes.'
                }
              </p>
            </div>
          )}

          {/* URL directa */}
          {mediaSource === 'url' && (
            <div>
              <input
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); setImageHash(''); }}
              />
              <p className="hint" style={{ fontSize: '12px', color: '#666' }}>
                Pega una URL pública de imagen (JPG, PNG). Tamaño recomendado: 1200x628px para feed.
              </p>
            </div>
          )}

          {/* Estado actual */}
          {uploadProgress && mediaSource !== 'none' && (
            <p className="hint" style={{ color: imageUrl || imageHash ? '#00aa00' : '#cc6600', marginTop: '8px' }}>
              {uploadProgress}
            </p>
          )}
          {mediaSource === 'none' && (
            <p className="hint">💡 Sin imagen/video, el anuncio usará la vista previa del link de destino.</p>
          )}
          {(imageUrl || imageHash) && (
            <p className="hint" style={{ color: '#00aa00' }}>✅ Imagen lista para el anuncio</p>
          )}
          {selectedVideoId && (
            <p className="hint" style={{ color: '#00aa00' }}>✅ Video seleccionado para el anuncio</p>
          )}

          {/* Selector de miniatura para video ads */}
          {selectedVideoId && (
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '14px', display: 'block', marginBottom: '6px' }}>
                Miniatura del video (requerida)
              </label>
              <p className="hint" style={{ marginBottom: '8px' }}>
                Selecciona una imagen de tu biblioteca como miniatura del video ad.
              </p>
              {mediaLibrary.images.length > 0 ? (
                <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
                    {mediaLibrary.images.map((img, i) => (
                      <div
                        key={img.hash || i}
                        onClick={() => handleSelectVideoThumbnail(img)}
                        style={{
                          cursor: 'pointer',
                          border: videoThumbnailHash === img.hash ? '3px solid #1877f2' : '2px solid #eee',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          position: 'relative',
                          aspectRatio: '1'
                        }}
                      >
                        <img
                          src={img.url}
                          alt={img.name || 'Miniatura'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        {videoThumbnailHash === img.hash && (
                          <div style={{
                            position: 'absolute', top: '4px', right: '4px',
                            background: '#1877f2', color: 'white', borderRadius: '50%',
                            width: '20px', height: '20px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                          }}>✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="hint" style={{ color: '#cc6600' }}>
                  No hay imagenes en la biblioteca. Sube una imagen primero usando la pestana "Subir archivo".
                </p>
              )}
              {!videoThumbnailHash && (
                <p className="hint" style={{ color: '#cc6600', marginTop: '6px' }}>
                  ⚠️ Debes seleccionar una miniatura para crear el video ad.
                </p>
              )}
              {videoThumbnailHash && (
                <p className="hint" style={{ color: '#00aa00', marginTop: '6px' }}>
                  ✅ Miniatura seleccionada
                </p>
              )}
            </div>
          )}
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

        {/* Targeting Section: End Date, Age, Gender */}
        <div className="targeting-section">
          <h4>🎯 Segmentación del Público</h4>

          {/* End Date (Optional) */}
          <div className="targeting-row">
            <div className="targeting-field" style={{ flex: 2 }}>
              <label>Fecha de Finalización (Opcional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="hint" style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
                Deja vacío para que la campaña corra indefinidamente
              </p>
            </div>
          </div>

          {/* Age Range */}
          <div className="targeting-row">
            <div className="targeting-field">
              <label>Edad Mínima</label>
              <select value={ageMin} onChange={(e) => setAgeMin(parseInt(e.target.value))}>
                {[...Array(48)].map((_, i) => (
                  <option key={i + 18} value={i + 18}>{i + 18} años</option>
                ))}
              </select>
            </div>
            <div className="targeting-field">
              <label>Edad Máxima</label>
              <select value={ageMax} onChange={(e) => setAgeMax(parseInt(e.target.value))}>
                {[...Array(48)].map((_, i) => (
                  <option key={i + 18} value={i + 18} disabled={i + 18 < ageMin}>{i + 18} años</option>
                ))}
                <option value={65}>65+ años</option>
              </select>
            </div>
          </div>

          {/* Gender */}
          <div className="targeting-row">
            <div className="targeting-field" style={{ flex: 1 }}>
              <label>Sexo</label>
              <div className="gender-options">
                <div
                  className={`gender-option ${gender === 'all' ? 'selected' : ''}`}
                  onClick={() => setGender('all')}
                >
                  <span className="icon">👥</span>
                  Todos
                </div>
                <div
                  className={`gender-option ${gender === 'male' ? 'selected' : ''}`}
                  onClick={() => setGender('male')}
                >
                  <span className="icon">👨</span>
                  Hombres
                </div>
                <div
                  className={`gender-option ${gender === 'female' ? 'selected' : ''}`}
                  onClick={() => setGender('female')}
                >
                  <span className="icon">👩</span>
                  Mujeres
                </div>
              </div>
            </div>
          </div>
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

      // Construir targeting con los valores personalizados
      let targeting = job.savedAudienceTargeting || {
        geo_locations: { countries: ['CO'] }
      };

      // Agregar edad personalizada
      targeting.age_min = job.ageMin || 18;
      targeting.age_max = job.ageMax || 65;

      // Agregar género si no es "todos"
      if (job.gender && job.gender !== 'all') {
        // Meta API: 1 = male, 2 = female
        targeting.genders = job.gender === 'male' ? [1] : [2];
      }

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
      addLog(`Edad: ${job.ageMin || 18} - ${job.ageMax || 65} años`);
      addLog(`Sexo: ${job.gender === 'male' ? 'Hombres' : job.gender === 'female' ? 'Mujeres' : 'Todos'}`);
      if (job.endDate) {
        addLog(`Fecha fin: ${job.endDate}`);
      }
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
        // Crear Campaign + AdSet + Creative + Ad completo
        // La imagen es OPCIONAL - si no hay, Meta usa la vista previa del link
        addLog(`URL destino: ${job.linkUrl || 'N/A'}`);
        if (job.videoId) {
          addLog(`Video: Sí (de biblioteca)`);
          addLog(`Miniatura: ${job.videoThumbnailHash ? 'Sí' : 'No seleccionada'}`);
        } else {
          addLog(`Imagen: ${job.imageUrl || job.imageHash ? 'Sí' : 'No (se usará vista previa del link)'}`);
        }
        if (job.igActorId) addLog(`Instagram: @${job.igUsername || 'vinculada'}`);
        const numVariations = Math.min(job.headlines?.filter(h => h?.trim()).length || 1, 5);
        addLog(`Variaciones: ${numVariations} título(s), ${job.descriptions?.filter(d => d?.trim()).length || 0} descripción(es)`);

        addLog(`Creando Campaign + AdSet + ${numVariations} Creative(s) + ${numVariations} Ad(s)...`);
        addLog(`CTA: ${job.ctas?.[0] || 'LEARN_MORE'}`);

        result = await metaService.createCampaignWithAd(job.adAccountId, {
          campaignName: job.campaignName,
          objective,
          specialAdCategories: [],
          adSetName: `${job.campaignName} - Ad Set`,
          dailyBudget: Math.round(job.dailyBudgetCOP),
          targeting,
          optimizationGoal,
          billingEvent,
          adName: job.adName,
          pageId: job.pageId,
          imageUrl: job.imageUrl || null,
          imageHash: job.imageHash || null,
          videoId: job.videoId || null,
          videoThumbnailHash: job.videoThumbnailHash || null,
          titles: job.headlines || [],
          bodies: job.descriptions || [],
          descriptions: job.headlines || [],
          callToActionTypes: job.ctas || ['LEARN_MORE'],
          linkUrl: job.linkUrl,
          endDate: job.endDate,
          igActorId: job.igActorId || null
        });
      }

      if (result.success) {
        const hasCreative = result.creative && result.ad;
        const totalAds = result.ads?.length || (result.ad ? 1 : 0);

        if (hasCreative) {
          addLog(`✅ ¡Campaña completa creada! ${totalAds} anuncio(s) creados.`);
        } else {
          addLog('✅ ¡Campaña y Ad Set creados exitosamente!');
          addLog('📋 El contenido 5+5+5 está listo para copiar');
        }

        setDraftData({
          campaignId: result.campaign?.id,
          campaignName: job.campaignName,
          adSetId: result.adSet?.id,
          creativeId: result.creative?.id || null,
          adId: result.ad?.id || null,
          adName: job.adName,
          totalAdsCreated: totalAds,
          creatives: result.creatives || [],
          ads: result.ads || [],
          dailyBudgetCOP: job.dailyBudgetCOP,
          savedAudienceName: job.savedAudienceName,
          pageName: job.pageName,
          pageId: job.pageId,
          igActorId: job.igActorId || null,
          igUsername: job.igUsername || null,
          linkUrl: job.linkUrl,
          imageUrl: job.imageUrl || null,
          whatsappNumber: job.whatsappNumber,
          conversionLocation: conversionLocation,
          objective: objective,
          optimizationGoal: optimizationGoal,
          headlines: job.headlines || [],
          descriptions: job.descriptions || [],
          ctas: job.ctas || [],
          status: 'PAUSED',
          noImage: job.noImage || !job.imageUrl,
          needsCreative: !hasCreative
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
    const adWasCreated = draftData.adId && draftData.creativeId;

    return (
      <div className="draft-step">
        <div className="success-section">
          <div className="success-icon">✅</div>
          <h2>{adWasCreated ? '¡Campaña Completa Creada!' : '¡Campaña y Ad Set Creados!'}</h2>
          <p>
            {adWasCreated
              ? 'Tu campaña, conjunto de anuncios y anuncio han sido creados en Meta Ads Manager en estado PAUSADO.'
              : 'Tu campaña y conjunto de anuncios han sido creados en Meta Ads Manager en estado PAUSADO.'
            }
          </p>
          {!adWasCreated && (
            <p style={{ color: '#f57c00', fontSize: '14px', marginTop: '10px' }}>
              ⚠️ Solo falta crear el <strong>Anuncio</strong> manualmente en Meta Ads Manager con el contenido de abajo.
            </p>
          )}

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

            {adWasCreated ? (
              <div className="draft-card" style={{ background: '#e8f5e9', border: '2px solid #4caf50' }}>
                <span className="card-icon">📢</span>
                <div>
                  <h4>Anuncios ({draftData.totalAdsCreated || 1})</h4>
                  <p>{draftData.adName}</p>
                  {draftData.ads?.length > 0 ? (
                    draftData.ads.map((ad, i) => (
                      <p key={i} className="hint">Ad {i + 1} ID: {ad.id}</p>
                    ))
                  ) : (
                    <p className="hint">ID: {draftData.adId}</p>
                  )}
                  <p className="hint">Página: {draftData.pageName}</p>
                  {draftData.igUsername && (
                    <p className="hint">Instagram: @{draftData.igUsername}</p>
                  )}
                  <span className="status-badge paused">PAUSADO</span>
                </div>
              </div>
            ) : (
              <div className="draft-card" style={{ background: '#fff3e0', border: '2px dashed #ff9800' }}>
                <span className="card-icon">📢</span>
                <div>
                  <h4>Anuncio (Pendiente)</h4>
                  <p style={{ color: '#e65100' }}>Crear manualmente en Meta Ads Manager</p>
                  <p className="hint">Página: {draftData.pageName}</p>
                  <p className="hint">Destino: {draftData.linkUrl}</p>
                  <span className="status-badge" style={{ background: '#ff9800', color: 'white' }}>PENDIENTE</span>
                </div>
              </div>
            )}
          </div>

          {/* Contenido - diferente según si se creó el Ad o no */}
          {adWasCreated ? (
            // Ads fueron creados - mostrar resumen de todas las variaciones
            <div className="generated-content-box" style={{
              background: '#e8f5e9',
              border: '2px solid #4caf50',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '20px'
            }}>
              <h3 style={{ color: '#2e7d32', marginBottom: '10px' }}>
                🎉 {draftData.totalAdsCreated > 1
                  ? `¡${draftData.totalAdsCreated} Anuncios Creados!`
                  : '¡Anuncio Creado Exitosamente!'}
              </h3>
              <p style={{ color: '#1b5e20', marginBottom: '15px', fontSize: '14px' }}>
                {draftData.totalAdsCreated > 1
                  ? `Se crearon ${draftData.totalAdsCreated} variaciones de anuncio. Meta optimizará y mostrará el de mejor rendimiento.`
                  : 'Tu anuncio está listo. Solo necesitas activar la campaña cuando quieras que empiece a correr.'}
              </p>

              {/* Mostrar cada variación creada */}
              {draftData.headlines?.filter(h => h?.trim()).map((headline, i) => {
                if (i >= (draftData.totalAdsCreated || 1)) return null;
                return (
                  <div key={i} style={{ background: 'white', padding: '12px 15px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid #4caf50' }}>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Variación {i + 1}</p>
                    <p><strong>Título:</strong> {headline}</p>
                    <p><strong>Texto:</strong> {draftData.descriptions?.[i]?.substring(0, 80) || draftData.descriptions?.[0]?.substring(0, 80) || 'N/A'}...</p>
                  </div>
                );
              })}

              <div style={{ background: 'white', padding: '12px 15px', borderRadius: '8px', marginTop: '10px' }}>
                <p><strong>Destino:</strong> {draftData.linkUrl}</p>
                <p><strong>CTA:</strong> {CTA_OPTIONS.find(c => c.value === draftData.ctas?.[0])?.label || draftData.ctas?.[0] || 'LEARN_MORE'}</p>
                {draftData.igUsername && <p><strong>Instagram:</strong> @{draftData.igUsername}</p>}
              </div>

              {!draftData.imageUrl && (
                <p style={{ fontSize: '13px', color: '#ff9800', marginTop: '10px' }}>
                  💡 Nota: Los anuncios usan la imagen de vista previa del link. Puedes editarlos en Meta Ads Manager para agregar una imagen personalizada.
                </p>
              )}
            </div>
          ) : (
            // Ad NO fue creado - mostrar contenido para copiar
            <div className="generated-content-box" style={{
              background: '#fff8e1',
              border: '2px solid #ffc107',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '20px'
            }}>
              <h3 style={{ color: '#f57c00', marginBottom: '10px' }}>
                📋 Contenido para crear tu Anuncio
              </h3>
              <p style={{ color: '#e65100', marginBottom: '15px', fontSize: '14px' }}>
                Usa este contenido al crear el Anuncio en Meta Ads Manager. <strong>Click para copiar.</strong>
              </p>

              {draftData.imageUrl && (
                <div className="copy-section" style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', color: '#333' }}>🖼️ URL de Imagen</label>
                  <div className="copy-item" style={{
                    background: 'white',
                    padding: '8px 12px',
                    margin: '5px 0',
                    borderRadius: '6px',
                    border: '2px solid #4caf50',
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    fontSize: '13px'
                  }} onClick={() => navigator.clipboard.writeText(draftData.imageUrl)} title="Click para copiar URL de imagen">
                    {draftData.imageUrl}
                  </div>
                </div>
              )}

              {draftData.linkUrl && (
                <div className="copy-section" style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', color: '#333' }}>🔗 URL de Destino</label>
                  <div className="copy-item" style={{
                    background: 'white',
                    padding: '8px 12px',
                    margin: '5px 0',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    fontSize: '13px'
                  }} onClick={() => navigator.clipboard.writeText(draftData.linkUrl)} title="Click para copiar">
                    {draftData.linkUrl}
                  </div>
                </div>
              )}

              {draftData.headlines?.length > 0 && (
                <div className="copy-section" style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', color: '#333' }}>📝 Títulos ({draftData.headlines.length})</label>
                  {draftData.headlines.map((h, i) => (
                    <div key={i} className="copy-item" style={{
                      background: 'white',
                      padding: '8px 12px',
                      margin: '5px 0',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      cursor: 'pointer'
                    }} onClick={() => navigator.clipboard.writeText(h)} title="Click para copiar">
                      {h}
                    </div>
                  ))}
                </div>
              )}

              {draftData.descriptions?.length > 0 && (
                <div className="copy-section" style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', color: '#333' }}>💬 Descripciones ({draftData.descriptions.length})</label>
                  {draftData.descriptions.map((d, i) => (
                    <div key={i} className="copy-item" style={{
                      background: 'white',
                      padding: '8px 12px',
                      margin: '5px 0',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      cursor: 'pointer'
                    }} onClick={() => navigator.clipboard.writeText(d)} title="Click para copiar">
                      {d}
                    </div>
                  ))}
                </div>
              )}

              {draftData.ctas?.length > 0 && (
                <div className="copy-section">
                  <label style={{ fontWeight: 'bold', color: '#333' }}>🎯 CTAs Recomendados</label>
                  <div className="cta-badges" style={{ marginTop: '8px' }}>
                    {[...new Set(draftData.ctas)].map((cta, i) => (
                      <span key={i} className="cta-badge" style={{
                        background: '#e3f2fd',
                        color: '#1976d2',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        marginRight: '8px',
                        fontSize: '13px'
                      }}>{CTA_OPTIONS.find(c => c.value === cta)?.label || cta}</span>
                    ))}
                  </div>
                </div>
              )}

              <p style={{ fontSize: '12px', color: '#666', marginTop: '15px' }}>
                💡 Tip: Haz click en cualquier texto para copiarlo al portapapeles
              </p>
            </div>
          )}

          <div className="next-steps">
            <h3>{adWasCreated ? 'Próximos Pasos' : 'Próximos Pasos para Completar el Anuncio'}</h3>
            <ol>
              <li>Ve a <a href="https://business.facebook.com/adsmanager" target="_blank" rel="noopener noreferrer">Meta Ads Manager</a></li>
              <li>Busca la campaña <strong>"{draftData.campaignName}"</strong></li>
              {adWasCreated ? (
                <>
                  <li>Revisa que todo esté correcto</li>
                  <li><strong>Activa la campaña</strong> cuando estés listo</li>
                </>
              ) : (
                <>
                  <li>Entra al Ad Set y haz click en <strong>"Crear Anuncio"</strong></li>
                  <li>Selecciona la página <strong>{draftData.pageName}</strong></li>
                  <li>{draftData.imageUrl ? 'Descarga y sube la imagen desde la URL de arriba' : 'Sube una imagen para el anuncio'}</li>
                  <li>Copia los títulos y descripciones de arriba</li>
                  <li>Configura el CTA y la URL de destino</li>
                  <li>Guarda y activa cuando estés listo</li>
                </>
              )}
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
          <div className="summary-item">
            <label>Segmentación</label>
            <p>
              Edad: {job.ageMin || 18} - {job.ageMax || 65} años |
              Sexo: {job.gender === 'male' ? 'Hombres' : job.gender === 'female' ? 'Mujeres' : 'Todos'}
            </p>
          </div>
          {job.endDate && (
            <div className="summary-item">
              <label>Fecha de Finalización</label>
              <p>{new Date(job.endDate).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          )}
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
          {/* Instagram - solo si aplica */}
          {job.igActorId && (
            <div className="summary-item">
              <label>Instagram</label>
              <p>@{job.igUsername || 'Vinculada'}</p>
            </div>
          )}
          {/* Teléfono - solo si aplica */}
          {job.phoneNumber && (
            <div className="summary-item" style={{ gridColumn: '1 / -1' }}>
              <label>Número de Teléfono</label>
              <p>{job.phoneNumber}</p>
            </div>
          )}
          {job.imageUrl ? (
            <div className="summary-item" style={{ gridColumn: '1 / -1' }}>
              <label>Imagen del Anuncio</label>
              <p style={{ wordBreak: 'break-all' }}>{job.imageUrl}</p>
            </div>
          ) : (
            <div className="summary-item" style={{ gridColumn: '1 / -1', background: '#e3f2fd' }}>
              <label>🔗 Sin Imagen Personalizada</label>
              <p>El anuncio usará la imagen de vista previa del link de destino.</p>
            </div>
          )}
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
            <li><strong>1 Campaña</strong> - Objetivo: {job.objective || 'Tráfico'} (PAUSADA)</li>
            <li><strong>1 Ad Set</strong> - Optimización: {job.optimizationGoal || 'Landing Page Views'}</li>
            <li><strong>{Math.min(job.headlines?.filter(h => h?.trim()).length || 1, 5)} Creative(s)</strong> - {job.imageUrl ? 'Con imagen personalizada' : 'Usando vista previa del link'}</li>
            <li><strong>{Math.min(job.headlines?.filter(h => h?.trim()).length || 1, 5)} Anuncio(s)</strong> - Cada uno con un título/descripción diferente</li>
          </ul>
          {job.headlines?.filter(h => h?.trim()).length > 1 && (
            <p style={{ fontSize: '13px', marginTop: '10px', color: '#666' }}>
              💡 Se creará un anuncio por cada variación de título. Meta optimizará automáticamente el mejor.
            </p>
          )}
          {job.igActorId && (
            <p style={{ fontSize: '13px', marginTop: '5px', color: '#666' }}>
              📸 Instagram: @{job.igUsername || 'vinculada'} - Los anuncios aparecerán también en Instagram.
            </p>
          )}
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
