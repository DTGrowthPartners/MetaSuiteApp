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
function UploadStep({ adAccounts, onJobCreated, selectedTemplate, onBackToTemplates, accessToken }) {
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

  // Media library (shared across all ads)
  const [mediaLibrary, setMediaLibrary] = useState({ images: [], videos: [] });
  const [loadingMedia, setLoadingMedia] = useState(false);

  // (AI content is now auto-generated per-ad when media is uploaded)

  // Multi-Ad System
  const [adSetMode, setAdSetMode] = useState('single'); // 'single' = 1 AdSet, 'per-ad' = N AdSets
  const createEmptyAd = (index) => ({
    id: Date.now() + index,
    adName: '',
    mediaSource: 'none', // 'none', 'library', 'upload'
    imageUrl: '',
    imageHash: '',
    imageHash9x16: '',
    videoId: '',
    videoThumbnailUrl: '',
    uploadingFile: false,
    uploadProgress: '',
    headlines: templateContent.headlines || selectedTemplate?.headlines || ['', '', '', '', ''],
    descriptions: templateContent.descriptions || selectedTemplate?.descriptions || ['', '', '', '', ''],
    ctas: templateContent.ctas || selectedTemplate?.ctas || ['LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE'],
    showEditContent: false,
    analyzingMedia: false, // AI is analyzing the media
    contentGenerated: false, // AI has generated content
    // Per-ad audience (only used in 'per-ad' mode)
    audienceId: '',
    audienceName: '',
    audienceTargeting: null,
  });
  const [ads, setAds] = useState([createEmptyAd(0)]);

  const addAd = () => {
    setAds(prev => [...prev, createEmptyAd(prev.length)]);
  };

  const removeAd = (index) => {
    if (ads.length <= 1) return;
    setAds(prev => prev.filter((_, i) => i !== index));
  };

  const updateAd = (index, updates) => {
    setAds(prev => prev.map((ad, i) => i === index ? { ...ad, ...updates } : ad));
  };

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

  // (headlines, descriptions, ctas are now per-ad in the ads array)

  // Cargar biblioteca de medios de Meta
  const handleLoadMediaLibrary = async () => {
    if (!selectedAccount) return;
    setLoadingMedia(true);
    try {
      const metaService = new MetaAdsService(accessToken);
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

  // Helper: Auto-analyze media with AI and fill 5+5+5
  const autoAnalyzeMedia = async (adIndex, file, isVideo) => {
    updateAd(adIndex, {
      analyzingMedia: true,
      uploadProgress: `Analizando ${isVideo ? 'audio del video' : 'imagen'} con IA...`
    });

    try {
      const metaService = new MetaAdsService(accessToken);
      const category = selectedTemplate?.category || '';
      const objective = selectedTemplate?.objective || '';
      const templateName = selectedTemplate?.name || '';
      const destType = templateAdConfig.destinationConfig?.type || '';

      let result;
      if (isVideo) {
        result = await metaService.analyzeVideoFile(file, adIndex, category, objective, templateName, destType);
      } else {
        result = await metaService.analyzeImageFile(file, adIndex, category, objective, templateName, destType);
      }

      if (result.success && result.data) {
        updateAd(adIndex, {
          headlines: result.data.headlines || ['', '', '', '', ''],
          descriptions: result.data.descriptions || ['', '', '', '', ''],
          ctas: result.data.ctas || ['LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE'],
          analyzingMedia: false,
          contentGenerated: true,
          uploadProgress: `Contenido generado (${result.data.method === 'whisper' ? 'audio transcrito' : 'análisis visual'})`,
          showEditContent: true
        });
        console.log(`Ad ${adIndex}: AI content generated via ${result.data.method}`);
      } else {
        updateAd(adIndex, {
          analyzingMedia: false,
          uploadProgress: `Media subida. IA: ${result.error || 'Error generando contenido'}`
        });
      }
    } catch (err) {
      console.error('Auto-analyze error:', err);
      updateAd(adIndex, {
        analyzingMedia: false,
        uploadProgress: `Media subida. Error IA: ${err.message}`
      });
    }
  };

  // Subir archivo desde dispositivo (per-ad) + auto AI analysis
  const handleAdFileUpload = async (adIndex, e) => {
    const file = e.target.files[0];
    if (!file || !selectedAccount) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    // Algunos navegadores no detectan .mov correctamente, verificar por extensión
    const ext = file.name.toLowerCase().split('.').pop();
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'];
    const isVideoByExt = videoExts.includes(ext);
    const isImageByExt = imageExts.includes(ext);

    if (!isImage && !isVideo && !isVideoByExt && !isImageByExt) {
      updateAd(adIndex, { uploadProgress: 'Error: Solo se aceptan imágenes (JPG, PNG, WebP) o videos (MP4, MOV)' });
      return;
    }

    // Reclasificar si el MIME type falló pero la extensión es válida
    const finalIsVideo = isVideo || isVideoByExt;
    const finalIsImage = !finalIsVideo && (isImage || isImageByExt);

    updateAd(adIndex, { uploadingFile: true, uploadProgress: `Subiendo ${file.name}...` });

    try {
      const metaService = new MetaAdsService(accessToken);
      let result;

      if (finalIsImage) {
        result = await metaService.uploadImageFile(selectedAccount, file);
        if (result.success) {
          updateAd(adIndex, {
            imageUrl: result.data.url || '',
            imageHash: result.data.imageHash || '',
            imageHash9x16: result.data.imageHash9x16 || '',
            videoId: '',
            videoThumbnailUrl: '',
            uploadProgress: `Imagen subida${result.data.imageHash9x16 ? ' + 9:16 Stories/Reels' : ''}. Analizando con IA...`,
            uploadingFile: false
          });
          // Auto-analyze the uploaded image
          autoAnalyzeMedia(adIndex, file, false);
          return;
        }
      } else if (finalIsVideo) {
        result = await metaService.uploadVideoFile(selectedAccount, file);
        if (result.success) {
          updateAd(adIndex, {
            videoId: result.data.videoId,
            videoThumbnailUrl: result.data.thumbnailUrl || '',
            imageUrl: '',
            imageHash: result.data.thumbnailHash || '',
            uploadProgress: `Video subido. Analizando audio con IA...`,
            uploadingFile: false
          });
          // Auto-analyze the uploaded video
          autoAnalyzeMedia(adIndex, file, true);
          return;
        }
      }

      if (!result.success) {
        updateAd(adIndex, { uploadProgress: `Error: ${result.error}`, uploadingFile: false });
      }
    } catch (err) {
      updateAd(adIndex, { uploadProgress: `Error: ${err.message}`, uploadingFile: false });
    }
  };

  // Seleccionar imagen de la biblioteca (per-ad)
  // Note: Library items don't have the file blob, so we can't auto-analyze them.
  // Content can be generated with the AI prompt instead.
  const handleAdSelectLibraryImage = (adIndex, image) => {
    updateAd(adIndex, {
      imageUrl: image.url || '',
      imageHash: image.hash || '',
      videoId: '',
      videoThumbnailUrl: '',
      uploadProgress: `Imagen seleccionada: ${image.name || 'Sin nombre'}`
    });
    // Try to fetch the image URL and analyze it
    if (image.url) {
      fetchAndAnalyzeImageUrl(adIndex, image.url);
    }
  };

  // Seleccionar video de la biblioteca (per-ad)
  const handleAdSelectLibraryVideo = (adIndex, video) => {
    const thumbUrl = video.thumbnails?.data?.[0]?.uri || video.picture || '';
    updateAd(adIndex, {
      videoId: video.id,
      videoThumbnailUrl: thumbUrl,
      imageUrl: '',
      imageHash: '',
      uploadProgress: `Video seleccionado: ${video.title || 'Sin título'}`
    });
    // For library videos, try to analyze the thumbnail image as fallback
    if (thumbUrl) {
      fetchAndAnalyzeImageUrl(adIndex, thumbUrl, 'video');
    }
  };

  // Helper: Fetch image from URL and analyze it
  const fetchAndAnalyzeImageUrl = async (adIndex, imageUrl, mediaType = 'imagen') => {
    const label = mediaType === 'video' ? 'Analizando video con IA...' : 'Analizando imagen con IA...';
    updateAd(adIndex, { analyzingMedia: true, uploadProgress: label });
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'library-image.jpg', { type: blob.type || 'image/jpeg' });
      await autoAnalyzeMedia(adIndex, file, false);
    } catch (err) {
      console.warn('Could not fetch library image for analysis:', err.message);
      updateAd(adIndex, {
        analyzingMedia: false,
        uploadProgress: 'Media seleccionada. Usa el generador de IA para el contenido.'
      });
    }
  };

  // Cargar páginas de Facebook al montar
  useEffect(() => {
    const loadPages = async () => {
      setLoadingPages(true);
      try {
        const metaService = new MetaAdsService(accessToken);
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

  // Auto-fill linkUrl con el website de la página seleccionada
  useEffect(() => {
    if (!selectedPage || !pages.length) return;
    const page = pages.find(p => p.id === selectedPage);
    if (page?.website && !linkUrl) {
      const url = page.website.startsWith('http') ? page.website : `https://${page.website}`;
      setLinkUrl(url);
      console.log('Auto-filled linkUrl from page website:', url);
    }
  }, [selectedPage, pages]);

  // Cargar cuentas de Instagram desde la cuenta publicitaria
  useEffect(() => {
    const loadIgAccounts = async () => {
      if (!selectedAccount) {
        setIgAccounts([]);
        setSelectedIgAccount('');
        return;
      }
      try {
        const metaService = new MetaAdsService(accessToken);
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
        const metaService = new MetaAdsService(accessToken);
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

      // Build ads array for multi-ad
      const builtAds = ads.map((ad, i) => ({
        adName: ad.adName?.trim() || `${fullCampaignName} - Ad ${i + 1}`,
        imageUrl: ad.imageUrl?.trim() || null,
        imageHash: ad.imageHash || null,
        imageHash9x16: ad.imageHash9x16 || null,
        videoId: ad.videoId || null,
        videoThumbnailUrl: ad.videoThumbnailUrl || null,
        headlines: ad.headlines.filter(h => h.trim() !== ''),
        descriptions: ad.descriptions.filter(d => d.trim() !== ''),
        ctas: ad.ctas,
        // Per-ad audience (for per-ad mode)
        audienceId: ad.audienceId || null,
        audienceName: ad.audienceName || null,
        audienceTargeting: ad.audienceTargeting || null,
      }));

      const jobData = {
        id: 'job_' + Date.now(),
        campaignName: fullCampaignName,
        adAccountId: selectedAccount,
        adAccountName: selectedAccountData?.name || selectedAccount,
        dailyBudgetCOP: parseFloat(dailyBudget),
        // Página de Facebook para el anuncio
        pageId: selectedPage,
        pageName: selectedPageData?.name || selectedPage,
        // URL de destino (si aplica)
        linkUrl: linkUrl.trim() || null,
        // Cuenta de Instagram para el anuncio
        igActorId: selectedIgAccount || null,
        igUsername: igAccounts.find(ig => ig.id === selectedIgAccount)?.username || null,
        // Multi-ad
        adSetMode: adSetMode,
        ads: builtAds,
        totalAds: builtAds.length,
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
        // Legacy fields from first ad (for WhatsApp/Messenger compat)
        headlines: builtAds[0]?.headlines || [],
        descriptions: builtAds[0]?.descriptions || [],
        ctas: builtAds[0]?.ctas || [],
        imageUrl: builtAds[0]?.imageUrl || null,
        imageHash: builtAds[0]?.imageHash || null,
        videoId: builtAds[0]?.videoId || null,
        videoThumbnailUrl: builtAds[0]?.videoThumbnailUrl || null,
        adName: builtAds[0]?.adName || fullCampaignName,
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

        {/* Audience Selection (Saved + Custom) - Shared when adSetMode=single */}
        <div className="form-group">
          <label>Público {adSetMode === 'single' ? '(compartido) *' : '(por defecto) *'}</label>
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
              {audienceError}
            </p>
          )}
          {selectedAudience && !audienceError && (
            <p className="hint success">
              Público seleccionado: {allAudiences.find(a => a.id === selectedAudience)?.name}
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
          <h4>Segmentación del Público</h4>

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
                  <span className="icon">Todos</span>
                </div>
                <div
                  className={`gender-option ${gender === 'male' ? 'selected' : ''}`}
                  onClick={() => setGender('male')}
                >
                  <span className="icon">Hombres</span>
                </div>
                <div
                  className={`gender-option ${gender === 'female' ? 'selected' : ''}`}
                  onClick={() => setGender('female')}
                >
                  <span className="icon">Mujeres</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ MULTI-AD SECTION ============ */}
        <div className="section-divider" style={{ margin: '25px 0 15px' }}>
          <span>Anuncios ({ads.length})</span>
        </div>

        {/* AdSet Mode Toggle */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>Estructura de Ad Sets</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setAdSetMode('single')}
              style={{
                padding: '10px 18px', borderRadius: '8px', border: '2px solid',
                borderColor: adSetMode === 'single' ? '#1877f2' : '#ddd',
                background: adSetMode === 'single' ? '#e7f3ff' : 'white',
                cursor: 'pointer', fontSize: '13px', fontWeight: adSetMode === 'single' ? 'bold' : 'normal'
              }}
            >
              Mismo público para todos
            </button>
            <button
              type="button"
              onClick={() => setAdSetMode('per-ad')}
              style={{
                padding: '10px 18px', borderRadius: '8px', border: '2px solid',
                borderColor: adSetMode === 'per-ad' ? '#1877f2' : '#ddd',
                background: adSetMode === 'per-ad' ? '#e7f3ff' : 'white',
                cursor: 'pointer', fontSize: '13px', fontWeight: adSetMode === 'per-ad' ? 'bold' : 'normal'
              }}
            >
              Público diferente por anuncio
            </button>
          </div>
          <p className="hint">
            {adSetMode === 'single'
              ? 'Todos los anuncios van en 1 Ad Set con el mismo público. Cada ad tiene su propio Creative con 5+5+5.'
              : 'Cada anuncio tiene su propio Ad Set con público diferente y Dynamic Creative 5+5+5.'}
          </p>
        </div>

        {/* Ad Cards */}
        <div className="ads-section">
          {ads.map((ad, adIndex) => (
            <div key={ad.id} className="ad-card" style={{
              border: '2px solid #e0e0e0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              background: '#fafafa'
            }}>
              {/* Ad Card Header */}
              <div className="ad-card-header" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'
              }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#333' }}>
                  Anuncio {adIndex + 1}
                </h4>
                {ads.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAd(adIndex)}
                    className="remove-ad-btn"
                    style={{
                      background: '#ff5252', color: 'white', border: 'none',
                      borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    Eliminar
                  </button>
                )}
              </div>

              {/* Ad Name */}
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '13px' }}>Nombre del anuncio</label>
                <input
                  type="text"
                  placeholder={`Ad ${adIndex + 1}`}
                  value={ad.adName}
                  onChange={(e) => updateAd(adIndex, { adName: e.target.value })}
                  style={{ fontSize: '13px' }}
                />
              </div>

              {/* Per-ad Audience (only in per-ad mode) */}
              {adSetMode === 'per-ad' && (
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px' }}>Público para este anuncio</label>
                  <select
                    value={ad.audienceId}
                    onChange={(e) => {
                      const aud = allAudiences.find(a => a.id === e.target.value);
                      updateAd(adIndex, {
                        audienceId: e.target.value,
                        audienceName: aud?.name || '',
                        audienceTargeting: aud?.targeting || null
                      });
                    }}
                    style={{ fontSize: '13px' }}
                  >
                    <option value="">Usar público por defecto</option>
                    {allAudiences.map((audience) => (
                      <option key={audience.id} value={audience.id}>
                        {audience.audienceType === 'custom' ? '[Custom] ' : ''}{audience.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Media Source Tabs */}
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '13px' }}>Contenido (imagen/video)</label>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => updateAd(adIndex, { mediaSource: 'none' })}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', border: '2px solid',
                      borderColor: ad.mediaSource === 'none' ? '#1877f2' : '#ddd',
                      background: ad.mediaSource === 'none' ? '#e7f3ff' : 'white',
                      cursor: 'pointer', fontSize: '12px', fontWeight: ad.mediaSource === 'none' ? 'bold' : 'normal'
                    }}
                  >
                    Vacío
                  </button>
                  <button
                    type="button"
                    onClick={() => { updateAd(adIndex, { mediaSource: 'library' }); handleLoadMediaLibrary(); }}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', border: '2px solid',
                      borderColor: ad.mediaSource === 'library' ? '#1877f2' : '#ddd',
                      background: ad.mediaSource === 'library' ? '#e7f3ff' : 'white',
                      cursor: 'pointer', fontSize: '12px', fontWeight: ad.mediaSource === 'library' ? 'bold' : 'normal'
                    }}
                  >
                    Biblioteca
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAd(adIndex, { mediaSource: 'upload' })}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', border: '2px solid',
                      borderColor: ad.mediaSource === 'upload' ? '#1877f2' : '#ddd',
                      background: ad.mediaSource === 'upload' ? '#e7f3ff' : 'white',
                      cursor: 'pointer', fontSize: '12px', fontWeight: ad.mediaSource === 'upload' ? 'bold' : 'normal'
                    }}
                  >
                    Subir archivo
                  </button>
                </div>

                {/* Library Browser */}
                {ad.mediaSource === 'library' && (
                  <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                    {loadingMedia ? (
                      <p style={{ textAlign: 'center', color: '#666', fontSize: '13px' }}>Cargando biblioteca...</p>
                    ) : (
                      <>
                        {mediaLibrary.images.length === 0 && mediaLibrary.videos.length === 0 ? (
                          <p style={{ textAlign: 'center', color: '#999', fontSize: '13px' }}>No hay medios en esta cuenta</p>
                        ) : (
                          <>
                            {mediaLibrary.images.length > 0 && (
                              <div>
                                <p style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '12px' }}>
                                  Imágenes ({mediaLibrary.images.length})
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px' }}>
                                  {mediaLibrary.images.map((img, i) => (
                                    <div
                                      key={img.hash || i}
                                      onClick={() => handleAdSelectLibraryImage(adIndex, img)}
                                      style={{
                                        cursor: 'pointer',
                                        border: ad.imageHash === img.hash ? '3px solid #1877f2' : '2px solid #eee',
                                        borderRadius: '6px',
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
                                      {ad.imageHash === img.hash && (
                                        <div style={{
                                          position: 'absolute', top: '2px', right: '2px',
                                          background: '#1877f2', color: 'white', borderRadius: '50%',
                                          width: '16px', height: '16px', display: 'flex',
                                          alignItems: 'center', justifyContent: 'center', fontSize: '10px'
                                        }}>v</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {mediaLibrary.videos.length > 0 && (
                              <div style={{ marginTop: '10px' }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '12px' }}>
                                  Videos ({mediaLibrary.videos.length})
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '6px' }}>
                                  {mediaLibrary.videos.map((vid, i) => {
                                    const thumbnail = vid.thumbnails?.data?.[0]?.uri || null;
                                    const isSelected = ad.videoId === vid.id;
                                    return (
                                      <div
                                        key={vid.id || i}
                                        onClick={() => handleAdSelectLibraryVideo(adIndex, vid)}
                                        style={{
                                          border: isSelected ? '3px solid #1877f2' : '2px solid #eee',
                                          borderRadius: '6px',
                                          overflow: 'hidden',
                                          cursor: 'pointer',
                                          background: isSelected ? '#e7f3ff' : 'white',
                                          position: 'relative'
                                        }}
                                      >
                                        {thumbnail ? (
                                          <img src={thumbnail} alt={vid.title} style={{ width: '100%', height: '70px', objectFit: 'cover' }} />
                                        ) : (
                                          <div style={{ width: '100%', height: '70px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                            V
                                          </div>
                                        )}
                                        <div style={{ padding: '4px 6px', fontSize: '10px' }}>
                                          <p style={{ fontWeight: 'bold', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {vid.title || 'Sin título'}
                                          </p>
                                          {vid.length && <p style={{ color: '#666', margin: 0 }}>{Math.round(vid.length)}s</p>}
                                        </div>
                                        {isSelected && (
                                          <div style={{
                                            position: 'absolute', top: '2px', right: '2px',
                                            background: '#1877f2', color: 'white', borderRadius: '50%',
                                            width: '16px', height: '16px', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontSize: '10px'
                                          }}>v</div>
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

                {/* Upload from device */}
                {ad.mediaSource === 'upload' && (
                  <div style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,.jpg,.jpeg,.png,.webp,.mp4,.mov"
                      onChange={(e) => handleAdFileUpload(adIndex, e)}
                      disabled={ad.uploadingFile || !selectedAccount}
                      style={{ marginBottom: '8px', fontSize: '12px' }}
                    />
                    <p className="hint" style={{ fontSize: '12px' }}>
                      {!selectedAccount
                        ? 'Selecciona una cuenta publicitaria primero'
                        : ad.uploadingFile
                          ? ad.uploadProgress
                          : 'JPG, PNG o MP4.'}
                    </p>
                  </div>
                )}

                {/* Media & AI analysis status */}
                {ad.analyzingMedia && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: '#e3f2fd', borderRadius: '6px', padding: '8px 12px', marginTop: '6px'
                  }}>
                    <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                    <span style={{ fontSize: '12px', color: '#1565c0' }}>
                      {ad.uploadProgress || 'Analizando con IA...'}
                    </span>
                  </div>
                )}
                {!ad.analyzingMedia && ad.uploadProgress && ad.mediaSource !== 'none' && (
                  <p className="hint" style={{ color: ad.contentGenerated ? '#00aa00' : ad.imageUrl || ad.imageHash || ad.videoId ? '#00aa00' : '#cc6600', marginTop: '6px', fontSize: '12px' }}>
                    {ad.uploadProgress}
                  </p>
                )}
                {ad.mediaSource === 'none' && (
                  <p className="hint" style={{ fontSize: '12px' }}>Sin imagen/video, usará la vista previa del link.</p>
                )}
              </div>

              {/* Content Summary & Edit Toggle */}
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => updateAd(adIndex, { showEditContent: !ad.showEditContent })}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: ad.contentGenerated ? 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' : '#f0f4f8',
                    borderRadius: '10px', padding: '10px 14px', cursor: 'pointer',
                    border: ad.contentGenerated ? '1px solid #81c784' : '1px solid #e0e0e0',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {ad.contentGenerated && (
                      <span style={{
                        background: '#4caf50', color: 'white', borderRadius: '4px',
                        padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px'
                      }}>IA</span>
                    )}
                    <span style={{ fontSize: '13px', color: ad.contentGenerated ? '#1b5e20' : '#555', fontWeight: '500' }}>
                      {ad.headlines.filter(h => h.trim()).length} Títulos + {ad.descriptions.filter(d => d.trim()).length} Descripciones + {[...new Set(ad.ctas)].length} CTAs
                    </span>
                  </div>
                  <span style={{ fontSize: '18px', color: '#888', transform: ad.showEditContent ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    {ad.showEditContent ? 'v' : '>'}
                  </span>
                </button>

                {/* Inline Content Editor */}
                {ad.showEditContent && (
                  <div style={{
                    marginTop: '8px', padding: '16px', background: '#fff', borderRadius: '10px',
                    border: '1px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }}>
                    {/* Headlines */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px'
                      }}>
                        <span style={{
                          background: '#1877f2', color: 'white', borderRadius: '4px',
                          padding: '2px 8px', fontSize: '11px', fontWeight: 'bold'
                        }}>H</span>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
                          Títulos ({ad.headlines.filter(h => h.trim()).length}/5)
                        </label>
                      </div>
                      {ad.headlines.map((headline, hi) => (
                        <div key={`ad${adIndex}-h${hi}`} style={{ position: 'relative', marginBottom: '6px' }}>
                          <input
                            type="text"
                            placeholder={`Título ${hi + 1}`}
                            value={headline}
                            onChange={(e) => {
                              const newHeadlines = [...ad.headlines];
                              newHeadlines[hi] = e.target.value;
                              updateAd(adIndex, { headlines: newHeadlines });
                            }}
                            maxLength={55}
                            style={{
                              fontSize: '13px', padding: '8px 40px 8px 10px',
                              borderRadius: '6px', border: headline.trim() ? '1px solid #90caf9' : '1px solid #e0e0e0',
                              background: headline.trim() ? '#f8fbff' : '#fff',
                              width: '100%', boxSizing: 'border-box'
                            }}
                          />
                          <span style={{
                            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                            fontSize: '10px', color: headline.length > 50 ? '#e53935' : '#bbb'
                          }}>{headline.length}/55</span>
                        </div>
                      ))}
                    </div>

                    {/* Descriptions */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px'
                      }}>
                        <span style={{
                          background: '#ff9800', color: 'white', borderRadius: '4px',
                          padding: '2px 8px', fontSize: '11px', fontWeight: 'bold'
                        }}>D</span>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
                          Textos Principales ({ad.descriptions.filter(d => d.trim()).length}/5)
                        </label>
                      </div>
                      {ad.descriptions.map((desc, di) => (
                        <div key={`ad${adIndex}-d${di}`} style={{ position: 'relative', marginBottom: '6px' }}>
                          <textarea
                            placeholder={`Texto principal ${di + 1} - Escribe un texto atractivo con emojis y beneficios`}
                            value={desc}
                            onChange={(e) => {
                              const newDescriptions = [...ad.descriptions];
                              newDescriptions[di] = e.target.value;
                              updateAd(adIndex, { descriptions: newDescriptions });
                            }}
                            maxLength={500}
                            rows={3}
                            style={{
                              fontSize: '13px', padding: '8px 10px', resize: 'vertical',
                              borderRadius: '6px', border: desc.trim() ? '1px solid #ffcc80' : '1px solid #e0e0e0',
                              background: desc.trim() ? '#fffbf5' : '#fff',
                              width: '100%', boxSizing: 'border-box'
                            }}
                          />
                          <span style={{
                            position: 'absolute', right: '8px', bottom: '8px',
                            fontSize: '10px', color: desc.length > 280 ? '#e53935' : '#bbb'
                          }}>{desc.length}/500</span>
                        </div>
                      ))}
                    </div>

                    {/* CTAs */}
                    <div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px'
                      }}>
                        <span style={{
                          background: '#9c27b0', color: 'white', borderRadius: '4px',
                          padding: '2px 8px', fontSize: '11px', fontWeight: 'bold'
                        }}>CTA</span>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
                          Call to Actions ({[...new Set(ad.ctas)].length} únicos)
                        </label>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {ad.ctas.map((cta, ci) => (
                          <select
                            key={`ad${adIndex}-c${ci}`}
                            value={cta}
                            onChange={(e) => {
                              const newCtas = [...ad.ctas];
                              newCtas[ci] = e.target.value;
                              updateAd(adIndex, { ctas: newCtas });
                            }}
                            style={{
                              fontSize: '12px', padding: '7px 8px', borderRadius: '6px',
                              border: '1px solid #e0e0e0', background: '#faf5ff', cursor: 'pointer'
                            }}
                          >
                            {CTA_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Another Ad Button */}
          <button
            type="button"
            className="add-ad-btn"
            onClick={addAd}
            style={{
              width: '100%', padding: '14px', border: '2px dashed #1877f2',
              borderRadius: '12px', background: 'transparent', color: '#1877f2',
              cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', marginBottom: '15px'
            }}
          >
            + Agregar Otro Anuncio
          </button>
        </div>

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
function DraftStep({ job, onComplete, onBack, accessToken }) {
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

    const metaService = new MetaAdsService(accessToken);

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
        // Campaña estándar (website, traffic, etc.) - MULTI-AD
        const totalAds = job.ads?.length || 1;
        addLog(`URL destino: ${job.linkUrl || 'N/A'}`);
        const isSingleMode = (job.adSetMode || 'single') === 'single';
        addLog(`Modo: ${isSingleMode ? `1 Ad Set → ${totalAds} Ads` : `${totalAds} Ad Sets (público diferente)`}`);
        addLog(`Total anuncios: ${totalAds}`);
        if (job.igActorId) addLog(`Instagram: @${job.igUsername || 'vinculada'}`);

        // Log each ad's content
        (job.ads || []).forEach((ad, i) => {
          const numTitles = ad.headlines?.filter(h => h?.trim()).length || 0;
          const numDescs = ad.descriptions?.filter(d => d?.trim()).length || 0;
          const hasMedia = ad.videoId || ad.imageUrl || ad.imageHash;
          addLog(`  Ad ${i + 1}: ${numTitles}t + ${numDescs}d | Media: ${hasMedia ? 'Sí' : 'No'}${ad.audienceName ? ' | Público: ' + ad.audienceName : ''}`);
        });

        const numAdSets = isSingleMode ? 1 : totalAds;
        addLog(`Creando Campaign + ${numAdSets} AdSet(s) + ${totalAds} Creative(s) + ${totalAds} Ad(s)...`);

        result = await metaService.createCampaignWithMultipleAds(job.adAccountId, {
          campaignName: job.campaignName,
          objective,
          specialAdCategories: [],
          dailyBudget: Math.round(job.dailyBudgetCOP),
          targeting,
          optimizationGoal,
          billingEvent,
          endDate: job.endDate,
          pageId: job.pageId,
          igActorId: job.igActorId || null,
          linkUrl: job.linkUrl,
          adSetMode: job.adSetMode || 'single',
          ads: job.ads || [{
            adName: job.adName,
            imageUrl: job.imageUrl,
            imageHash: job.imageHash,
            videoId: job.videoId,
            videoThumbnailUrl: job.videoThumbnailUrl,
            headlines: job.headlines || [],
            descriptions: job.descriptions || [],
            ctas: job.ctas || ['LEARN_MORE']
          }]
        });
      }

      if (result.success) {
        // Multi-ad result
        const totalCreated = result.totalCreated || result.ads?.length || (result.ad ? 1 : 0);
        const hasAds = totalCreated > 0;

        if (hasAds) {
          addLog(`Campaña creada: ${result.adSets?.length || 1} Ad Set(s) + ${totalCreated} anuncio(s).`);
          if (result.totalFailed > 0) {
            addLog(`⚠️ ${result.totalFailed} anuncio(s) fallaron.`);
            (result.errors || []).forEach(err => addLog(`  → ${err}`));
          }
        } else {
          addLog('Campaña y Ad Set creados. Anuncios pendientes.');
          (result.errors || []).forEach(err => addLog(`  → ${err}`));
        }

        setDraftData({
          campaignId: result.campaign?.id,
          campaignName: job.campaignName,
          adSetId: result.adSets?.[0]?.id || result.adSet?.id,
          adSets: result.adSets || (result.adSet ? [result.adSet] : []),
          creativeId: result.creatives?.[0]?.id || result.creative?.id || null,
          adId: result.ads?.[0]?.id || result.ad?.id || null,
          ads: result.ads || (result.ad ? [result.ad] : []),
          adName: job.ads?.[0]?.adName || job.adName,
          totalAdsCreated: totalCreated,
          totalAdSets: result.adSets?.length || 1,
          adSetMode: job.adSetMode || 'single',
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
          jobAds: job.ads || [],
          status: 'PAUSED',
          noImage: job.noImage || !job.imageUrl,
          needsCreative: !hasAds
        });
        setCreated(true);
      } else {
        const errorMessages = result.errors?.join(', ') || 'Error desconocido';
        addLog(`Error: ${errorMessages}`);
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
    const adWasCreated = draftData.totalAdsCreated > 0;

    return (
      <div className="draft-step">
        <div className="success-section">
          <div className="success-icon">OK</div>
          <h2>{adWasCreated
            ? `Campaña Creada con ${draftData.totalAdsCreated} Anuncio(s)`
            : 'Campaña y Ad Set Creados'
          }</h2>
          <p>
            {adWasCreated
              ? `Se crearon ${draftData.totalAdSets || 1} Ad Set(s) y ${draftData.totalAdsCreated} anuncio(s) en Meta Ads Manager en estado PAUSADO.`
              : 'Tu campaña y conjunto de anuncios han sido creados en Meta Ads Manager en estado PAUSADO.'
            }
          </p>

          <div className="draft-details">
            <div className="draft-card">
              <span className="card-icon">C</span>
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
              <span className="card-icon">AS</span>
              <div>
                <h4>Ad Set(s) ({draftData.totalAdSets || 1})</h4>
                <p>Presupuesto: ${formatCOP(draftData.dailyBudgetCOP)} COP/día (CBO)</p>
                {draftData.adSets?.length > 0 ? (
                  draftData.adSets.map((adSet, i) => (
                    <p key={i} className="hint">Ad Set {i + 1} ID: {adSet.id}</p>
                  ))
                ) : (
                  <p className="hint">ID: {draftData.adSetId}</p>
                )}
                <p className="hint">
                  {draftData.adSetMode === 'per-ad'
                    ? 'Modo: 1 Ad Set por anuncio'
                    : `Público: ${draftData.savedAudienceName || 'Colombia 18-65'}`}
                </p>
                <span className="status-badge paused">PAUSADO</span>
              </div>
            </div>

            {adWasCreated ? (
              <div className="draft-card" style={{ background: '#e8f5e9', border: '2px solid #4caf50' }}>
                <span className="card-icon">Ad</span>
                <div>
                  <h4>Anuncios ({draftData.totalAdsCreated})</h4>
                  {draftData.ads?.length > 0 ? (
                    draftData.ads.map((ad, i) => (
                      <p key={i} className="hint">
                        Ad {i + 1}: {draftData.jobAds?.[i]?.adName || `Ad ${i + 1}`} (ID: {ad.id})
                      </p>
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
                <span className="card-icon">Ad</span>
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
            <label>Anuncios</label>
            <p>{job.totalAds || 1} anuncio(s) | {job.adSetMode === 'per-ad' ? 'Ad Sets separados' : '1 Ad Set'}</p>
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
          <div className="summary-item" style={{ gridColumn: '1 / -1' }}>
            <label>Media por Anuncio</label>
            {job.ads?.map((ad, i) => (
              <p key={i} style={{ fontSize: '13px', margin: '2px 0' }}>
                {ad.adName || `Ad ${i + 1}`}: {ad.videoId ? 'Video' : ad.imageUrl || ad.imageHash ? 'Imagen' : 'Sin media'}
              </p>
            )) || <p>Sin media</p>}
          </div>
        </div>

        {/* Creative Copy Summary - Per Ad */}
        {job.ads?.length > 0 && (
          <div className="creative-summary">
            <h4>Contenido de los Anuncios ({job.ads.length})</h4>
            {job.ads.map((ad, i) => (
              <div key={i} style={{
                background: '#f8f9fa', borderRadius: '8px', padding: '10px', marginBottom: '8px',
                borderLeft: '3px solid #1877f2'
              }}>
                <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
                  {ad.adName || `Ad ${i + 1}`}
                  {ad.videoId ? ' (Video)' : ad.imageUrl || ad.imageHash ? ' (Imagen)' : ' (Sin media)'}
                  {job.adSetMode === 'per-ad' && ad.audienceName ? ` - ${ad.audienceName}` : ''}
                </p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  {ad.headlines?.length || 0} títulos + {ad.descriptions?.length || 0} descripciones + {[...new Set(ad.ctas || [])].length} CTAs
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="info-box">
        <span className="info-icon">i</span>
        <div>
          <p><strong>Se creará en Meta Ads:</strong></p>
          <ul>
            <li><strong>1 Campaña</strong> - Objetivo: {job.objective || 'Tráfico'} (PAUSADA)</li>
            <li><strong>{job.adSetMode === 'per-ad' ? (job.ads?.length || 1) + ' Ad Sets' : '1 Ad Set'}</strong> - Dynamic Creative - {job.optimizationGoal || 'Landing Page Views'}</li>
            <li><strong>{job.ads?.length || 1} Creative(s)</strong> - Cada uno con 5+5+5</li>
            <li><strong>{job.ads?.length || 1} Anuncio(s)</strong></li>
          </ul>
          {job.ads?.length > 1 && (
            <div style={{ fontSize: '13px', marginTop: '10px', color: '#666' }}>
              {job.ads.map((ad, i) => (
                <p key={i} style={{ margin: '3px 0' }}>
                  Ad {i + 1}: {ad.adName || `Ad ${i + 1}`} | {ad.videoId ? 'Video' : ad.imageUrl || ad.imageHash ? 'Imagen' : 'Sin media'}
                  {job.adSetMode === 'per-ad' && ad.audienceName ? ` | ${ad.audienceName}` : ''}
                </p>
              ))}
            </div>
          )}
          <p style={{ fontSize: '13px', marginTop: '10px', color: '#666' }}>
            Meta probará automáticamente las diferentes combinaciones de títulos, descripciones y CTAs para encontrar la mejor.
          </p>
          {job.igActorId && (
            <p style={{ fontSize: '13px', marginTop: '5px', color: '#666' }}>
              Instagram: @{job.igUsername || 'vinculada'} - Los anuncios aparecerán también en Instagram.
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
export default function CreativeBuilder({ adAccounts, accessToken }) {
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
            accessToken={accessToken}
          />
        )}
        {step === 'draft' && currentJob && (
          <DraftStep
            job={currentJob}
            onComplete={handleComplete}
            onBack={handleBack}
            accessToken={accessToken}
          />
        )}
      </div>
    </div>
  );
}
