import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MetaAdsService from '../services/metaAdsApi';
import {
  CAMPAIGN_TEMPLATES,
  CTA_OPTIONS,
  SPECIAL_AD_CATEGORIES,
  BID_STRATEGIES,
  PLACEMENT_OPTIONS,
  getCategories,
  getTemplatesByCategory,
  getTemplateRequirements,
  getCTALabel
} from '../config/campaignTemplates';
import './CreativeBuilder.css';

// Prefijo dinámico según objetivo de campaña
function getCampaignPrefix(objective) {
  if (objective === 'OUTCOME_LEADS') return '🟨 DTGP - ';
  if (objective === 'OUTCOME_SALES' || objective === 'OUTCOME_ENGAGEMENT') return '🟥 DTGP - ';
  // OUTCOME_TRAFFIC, OUTCOME_AWARENESS (ThruPlay), etc.
  return '🟦 DTGP - ';
}

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
      <p className="subtitle">Eligue el tipo de campaña que quieres crear. Ya viene pre-configurada.</p>

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
          const suggestedBudget = template.adSetConfig?.suggestedBudget || template.suggestedBudget || 20000;
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

  // DC (Dynamic Creative / 5+5+5) no está soportado en estas combinaciones por Meta
  const isDCBlocked =
    selectedTemplate?.objective === 'OUTCOME_ENGAGEMENT' ||
    (selectedTemplate?.objective === 'OUTCOME_SALES' && templateAdSetConfig?.conversionLocation === 'WHATSAPP');

  const [campaignName, setCampaignName] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dailyBudget, setDailyBudget] = useState(
    (templateAdSetConfig.suggestedBudget || selectedTemplate?.suggestedBudget || 20000).toString()
  );
  const [budgetLevel, setBudgetLevel] = useState('campaign'); // 'campaign' (CBO) o 'adset'
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Destino seleccionable (para plantillas con destinationOptions)
  const destinationOptions = templateAdSetConfig.destinationOptions || null;
  const [selectedDestination, setSelectedDestination] = useState(
    templateAdSetConfig.conversionLocation || 'WEBSITE'
  );

  // Campos obligatorios para crear el anuncio
  const [linkUrl, setLinkUrl] = useState(''); // URL de destino

  // Media library (shared across all ads)
  const [mediaLibrary, setMediaLibrary] = useState({ images: [], videos: [] });
  const [loadingMedia, setLoadingMedia] = useState(false);

  // AI content generation settings
  const [textLength, setTextLength] = useState('medium'); // 'short', 'medium', 'long'
  const [campaignContext, setCampaignContext] = useState(''); // Optional manual context for AI

  // Multi-Ad System
  const [adSetMode, setAdSetMode] = useState('dynamic'); // 'single' = 1 AdSet sin 5+5+5, 'dynamic' = N AdSets con 5+5+5 mismo público, 'per-ad' = N AdSets público diferente
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
    linkDescriptions: ['', '', '', '', ''],
    ctas: templateContent.ctas || (() => {
      const dc = templateAdConfig?.defaultCta
        || (templateAdSetConfig?.conversionLocation === 'WHATSAPP' ? 'WHATSAPP_MESSAGE'
          : templateAdSetConfig?.conversionLocation === 'INSTAGRAM_PROFILE' ? 'VISIT_INSTAGRAM_PROFILE'
          : templateAdSetConfig?.conversionLocation === 'INSTAGRAM_DIRECT' ? 'INSTAGRAM_MESSAGE'
          : templateAdSetConfig?.conversionLocation === 'MESSENGER' ? 'MESSAGE_PAGE'
          : 'LEARN_MORE');
      return [dc, dc, dc, dc, dc];
    })(),
    showEditContent: false,
    analyzingMedia: false, // AI is analyzing the media
    contentGenerated: false, // AI has generated content
    // Per-ad audience (only used in 'per-ad' mode)
    audienceId: '',
    audienceName: '',
    audienceTargeting: null,
    // Per-ad WhatsApp number (only used when whatsappMode === 'per-ad')
    whatsappNumber: '',
    whatsappNumberId: '',
    whatsappDisplayNumber: '',
  });
  const [ads, setAds] = useState([createEmptyAd(0)]);

  // ===== FLEXIBLE AD GROUPS (only used when adSetMode === 'flexible') =====
  const createEmptyFlexGroup = (index) => ({
    id: Date.now() + index,
    mediaItems: [], // [{ type: 'image'|'video', hash, url, videoId, thumbnailUrl, name }]
    headlines: ['', '', '', '', ''],
    descriptions: ['', '', '', '', ''], // primary texts
    linkDescriptions: ['', '', '', '', ''],
    ctas: ['LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE'],
    contentGenerated: false,
    showEditContent: false,
    analyzingMedia: false,
    uploadProgress: ''
  });
  const [flexibleAdGroups, setFlexibleAdGroups] = useState([createEmptyFlexGroup(0)]);
  const [flexGroupPickerOpen, setFlexGroupPickerOpen] = useState(null); // index of group with open media picker
  const [flexGroupPickerTab, setFlexGroupPickerTab] = useState('images');
  const [flexGroupUploadRefs] = useState(() => ({})); // keyed by group index

  const updateFlexGroup = (index, updates) =>
    setFlexibleAdGroups(prev => prev.map((g, i) => i === index ? { ...g, ...updates } : g));

  const addFlexGroup = () =>
    setFlexibleAdGroups(prev => [...prev, createEmptyFlexGroup(prev.length)]);

  const removeFlexGroup = (index) => {
    if (flexibleAdGroups.length <= 1) return;
    setFlexibleAdGroups(prev => prev.filter((_, i) => i !== index));
    if (flexGroupPickerOpen === index) setFlexGroupPickerOpen(null);
  };

  const addMediaToFlexGroup = (groupIndex, item) =>
    setFlexibleAdGroups(prev => prev.map((g, i) => i === groupIndex ? { ...g, mediaItems: [...g.mediaItems, item] } : g));

  const removeMediaFromFlexGroup = (groupIndex, mediaIndex) =>
    setFlexibleAdGroups(prev => prev.map((g, i) => i === groupIndex ? { ...g, mediaItems: g.mediaItems.filter((_, mi) => mi !== mediaIndex) } : g));

  const analyzeFlexGroupWithMedia = async (groupIndex) => {
    const group = flexibleAdGroups[groupIndex];
    if (!group || group.mediaItems.length === 0) return;
    // Build mediaItems array: images use url, videos include sourceUrl for multi-frame extraction
    const mediaItemsPayload = group.mediaItems.map(item => ({
      type: item.type,
      url: item.url || item.thumbnailUrl || '',
      thumbnailUrl: item.thumbnailUrl || '',
      sourceUrl: item.sourceUrl || '',  // set for library videos
      name: item.name || ''
    })).filter(item => item.url || item.thumbnailUrl || item.sourceUrl);
    if (mediaItemsPayload.length === 0) return;
    const hasVideos = mediaItemsPayload.some(i => i.type === 'video' && i.sourceUrl);
    updateFlexGroup(groupIndex, { analyzingMedia: true, uploadProgress: `Analizando ${group.mediaItems.length} medio(s) con IA${hasVideos ? ' (extrayendo frames de videos...)' : ''}...` });
    try {
      const metaService = new MetaAdsService(accessToken);
      const category = selectedTemplate?.category || '';
      const objective = selectedTemplate?.objective || '';
      const templateName = selectedTemplate?.name || '';
      const destType = templateAdConfig.destinationConfig?.type || '';
      const result = await metaService.analyzeMediaUrlBatch(
        mediaItemsPayload, groupIndex, category, objective, templateName, destType, textLength,
        campaignContext ? campaignContext : (campaignName ? `Campaña: ${campaignName}` : '')
      );
      if (result.success && result.data) {
        const effectiveDestination = destinationOptions ? selectedDestination : templateAdSetConfig?.conversionLocation;
        const isWhatsApp = effectiveDestination === 'WHATSAPP';
        const isMessenger = effectiveDestination === 'MESSENGER';
        const isIgDirect = effectiveDestination === 'INSTAGRAM_DIRECT';
        const isIgProfile = effectiveDestination === 'INSTAGRAM_PROFILE';
        const isMessaging = isMessenger || isIgDirect;
        const messagingCta = isWhatsApp ? 'WHATSAPP_MESSAGE' : isIgDirect ? 'INSTAGRAM_MESSAGE' : 'MESSAGE_PAGE';
        const defaultCta = isIgProfile ? 'VISIT_INSTAGRAM_PROFILE' : (isMessaging || isWhatsApp) ? messagingCta : 'LEARN_MORE';
        updateFlexGroup(groupIndex, {
          headlines: result.data.headlines?.length ? result.data.headlines : ['', '', '', '', ''],
          descriptions: result.data.descriptions?.length ? result.data.descriptions : ['', '', '', '', ''],
          linkDescriptions: result.data.linkDescriptions?.length ? result.data.linkDescriptions : ['', '', '', '', ''],
          ctas: (isWhatsApp || isMessaging || isIgProfile)
            ? [defaultCta, defaultCta, defaultCta, defaultCta, defaultCta]
            : (result.data.ctas?.length ? result.data.ctas : [defaultCta, defaultCta, defaultCta, defaultCta, defaultCta]),
          contentGenerated: true,
          analyzingMedia: false,
          uploadProgress: `Contenido generado con IA ✓`,
          showEditContent: true
        });
      } else {
        updateFlexGroup(groupIndex, { analyzingMedia: false, uploadProgress: `Media agregada. IA: ${result.error || 'Error'}` });
      }
    } catch (err) {
      updateFlexGroup(groupIndex, { analyzingMedia: false, uploadProgress: `Error IA: ${err.message}` });
    }
  };

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

  // Multi-file upload ref
  const multiFileInputRef = useRef(null);
  const [multiUploadProgress, setMultiUploadProgress] = useState(''); // Progress message for batch upload

  // Sticky nav: track which section is visible
  const [activeSection, setActiveSection] = useState('section-campana');
  useEffect(() => {
    const sectionIds = [
      'section-campana', 'section-identidad', 'section-destino',
      'section-presupuesto', 'section-publico', 'section-anuncios'
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
    );
    const timer = setTimeout(() => {
      sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 300);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  // Multi-file upload mode: 'per-ad' = 1 file per ad, 'single' = all files for 1 ad (upload to library)
  const [multiUploadMode, setMultiUploadMode] = useState('per-ad');

  // Library multi-select (always active)
  const [selectedLibraryMedia, setSelectedLibraryMedia] = useState([]); // [{type: 'image'|'video', data: {...}}]
  const [libraryMode, setLibraryMode] = useState('per-ad'); // 'per-ad' = 1 ad por contenido, 'single' = todo para este ad
  const [libraryTab, setLibraryTab] = useState('images'); // 'images' | 'videos'

  const toggleLibraryMediaSelection = (type, data) => {
    setSelectedLibraryMedia(prev => {
      const id = type === 'image' ? data.hash : data.id;
      const exists = prev.find(m => (type === 'image' ? m.data.hash : m.data.id) === id && m.type === type);
      if (exists) return prev.filter(m => m !== exists);
      return [...prev, { type, data }];
    });
  };

  const isLibraryMediaSelected = (type, data) => {
    const id = type === 'image' ? data.hash : data.id;
    return selectedLibraryMedia.some(m => (type === 'image' ? m.data.hash : m.data.id) === id && m.type === type);
  };

  // Helper: assign media to an ad index (works even for newly created ads via prev callback)
  // Helper: build ad fields from a library media item
  const buildMediaFields = (media) => {
    if (media.type === 'image') {
      const img = media.data;
      return {
        mediaSource: 'library',
        imageUrl: img.url || '',
        imageHash: img.hash || '',
        videoId: '',
        videoThumbnailUrl: '',
        uploadProgress: `Imagen seleccionada: ${img.name || 'Sin nombre'}`
      };
    } else {
      const vid = media.data;
      return {
        mediaSource: 'library',
        videoId: vid.id,
        videoThumbnailUrl: vid.thumbnails?.data?.[0]?.uri || vid.picture || '',
        imageUrl: '',
        imageHash: '',
        uploadProgress: `Video seleccionado: ${vid.title || 'Sin título'}`
      };
    }
  };

  // Helper: get the analysis URL/type for a library media item
  const getAnalysisInfo = (media) => {
    if (media.type === 'image') {
      return { url: media.data.url || '', mediaType: 'image' };
    } else {
      const vid = media.data;
      const videoSourceUrl = vid.source || '';
      const thumbUrl = vid.thumbnails?.data?.[0]?.uri || vid.picture || '';
      if (videoSourceUrl) return { url: videoSourceUrl, mediaType: 'video' };
      if (thumbUrl) return { url: thumbUrl, mediaType: 'image' };
      return { url: '', mediaType: 'image' };
    }
  };

  // Apply library selection: currentAdIndex = the ad card where the library is open
  const handleApplyLibrarySelection = async (currentAdIndex) => {
    if (selectedLibraryMedia.length === 0) return;

    const total = selectedLibraryMedia.length;

    if (libraryMode === 'single' || total === 1) {
      // Single mode or just 1 selected: assign to current ad
      setMultiUploadProgress(`Asignando contenido al ad...`);
      const fields = buildMediaFields(selectedLibraryMedia[0]);
      setAds(prev => prev.map((ad, i) => i === currentAdIndex ? { ...ad, ...fields } : ad));
      const info = getAnalysisInfo(selectedLibraryMedia[0]);
      if (info.url) analyzeLibraryMedia(currentAdIndex, info.url, info.mediaType);
      setMultiUploadProgress(`Contenido asignado al ad`);
    } else {
      // 1 ad por contenido: assign all media in ONE setAds call
      setMultiUploadProgress(`Creando ${total} ad(s)...`);

      // Build the full new state in a single setAds call
      const adIndexMap = []; // [{adIndex, media}] for AI analysis after
      setAds(prev => {
        const updated = [...prev];

        // First media → current ad
        updated[currentAdIndex] = { ...updated[currentAdIndex], ...buildMediaFields(selectedLibraryMedia[0]) };
        adIndexMap.push({ adIndex: currentAdIndex, media: selectedLibraryMedia[0] });

        // Rest → create new ads with media pre-assigned
        for (let i = 1; i < selectedLibraryMedia.length; i++) {
          const newAd = { ...createEmptyAd(updated.length), ...buildMediaFields(selectedLibraryMedia[i]) };
          adIndexMap.push({ adIndex: updated.length, media: selectedLibraryMedia[i] });
          updated.push(newAd);
        }

        return updated;
      });

      // Wait for React to process the state update
      await new Promise(r => setTimeout(r, 200));

      // Now trigger AI analysis for each ad sequentially
      for (let i = 0; i < adIndexMap.length; i++) {
        const { adIndex, media } = adIndexMap[i];
        const info = getAnalysisInfo(media);
        if (info.url) {
          setMultiUploadProgress(`Analizando con IA ${i + 1}/${total}...`);
          analyzeLibraryMedia(adIndex, info.url, info.mediaType);
          // Small delay between analyses to avoid rate limits
          if (i < adIndexMap.length - 1) {
            await new Promise(r => setTimeout(r, 800));
          }
        }
      }

      setMultiUploadProgress(`${total} ad(s) creado(s)`);
    }

    setSelectedLibraryMedia([]);
    setTimeout(() => setMultiUploadProgress(''), 5000);
  };

  // Multi-file upload handler
  // Sube archivos a la biblioteca de Meta (sin crear ads)
  const handleMultiFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedAccount) return;
    e.target.value = '';

    const metaService = new MetaAdsService(accessToken);
    setMultiUploadProgress(`Subiendo ${files.length} archivo(s) a biblioteca...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setMultiUploadProgress(`Subiendo ${i + 1}/${files.length}: ${file.name}`);
      const isVideo = file.type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(file.name.toLowerCase().split('.').pop());
      try {
        if (isVideo) {
          await metaService.uploadVideoFile(selectedAccount, file);
        } else {
          await metaService.uploadImageFile(selectedAccount, file);
        }
      } catch (err) {
        console.error(`Error uploading ${file.name} to library:`, err);
      }
      if (i < files.length - 1) await new Promise(r => setTimeout(r, 300));
    }

    setMultiUploadProgress(`${files.length} archivo(s) subido(s) a biblioteca`);
    setTimeout(() => setMultiUploadProgress(''), 4000);
    // Recargar biblioteca para mostrar los nuevos archivos
    handleLoadMediaLibrary();
  };

  // Campos dinámicos según tipo de campaña
  const [whatsappNumber, setWhatsappNumber] = useState(''); // Para campañas de WhatsApp (número manual)
  const [phoneNumber, setPhoneNumber] = useState(''); // Para campañas de llamadas
  const [whatsappMode, setWhatsappMode] = useState('same'); // 'same' = mismo número para todos, 'per-ad' = número por ad set

  // Números de WhatsApp Business
  const [whatsAppNumbers, setWhatsAppNumbers] = useState([]);
  const [selectedWhatsAppNumber, setSelectedWhatsAppNumber] = useState('');
  const [loadingWhatsAppNumbers, setLoadingWhatsAppNumbers] = useState(false);
  const [whatsAppNumbersError, setWhatsAppNumbersError] = useState('');

  // Targeting: Fecha, Edad, Sexo
  const [startDate, setStartDate] = useState(''); // Fecha de inicio (opcional)
  const [endDate, setEndDate] = useState(''); // Fecha de finalización (opcional)
  const [ageMin, setAgeMin] = useState(18); // Edad mínima
  const [ageMax, setAgeMax] = useState(65); // Edad máxima
  const [gender, setGender] = useState('all'); // 'all', 'male', 'female'

  // Nuevos campos de campaña
  const [specialAdCategories, setSpecialAdCategories] = useState([]); // Categorías de anuncios especiales
  const [bidStrategy, setBidStrategy] = useState(templateAdSetConfig.bidStrategy || 'LOWEST_COST_WITHOUT_CAP');
  const [bidAmount, setBidAmount] = useState(''); // Monto de puja (para COST_CAP o BID_CAP)

  // Advantage+ Audience
  const [advantageAudience, setAdvantageAudience] = useState(
    templateAdSetConfig.audienceConfig?.allowAdvantage !== false
  );

  // Ubicaciones / Placements
  const [useAdvantagePlacements, setUseAdvantagePlacements] = useState(
    templateAdSetConfig.placementsConfig?.allowAdvantage !== false
  );
  const [excludedPlacements, setExcludedPlacements] = useState([]);


  // Páginas de Facebook
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [loadingPages, setLoadingPages] = useState(false);
  const [pagesError, setPagesError] = useState('');

  // Cuentas de Instagram vinculadas
  const [igAccounts, setIgAccounts] = useState([]);
  const [selectedIgAccount, setSelectedIgAccount] = useState('');

  // Pixels de Meta (solo para OUTCOME_SALES + WEBSITE)
  const [pixels, setPixels] = useState([]);
  const [selectedPixel, setSelectedPixel] = useState('');
  const [loadingPixels, setLoadingPixels] = useState(false);

  // Audiences (Saved + Custom)
  const [allAudiences, setAllAudiences] = useState([]);
  const [selectedAudience, setSelectedAudience] = useState('');
  const [loadingAudiences, setLoadingAudiences] = useState(false);
  const [audienceError, setAudienceError] = useState('');
  // Múltiples públicos (replicar ads en varios AdSets con diferente público)
  const [multiAudiences, setMultiAudiences] = useState([]); // Array de { id, name, targeting, audienceType }

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
        result = await metaService.analyzeVideoFile(file, adIndex, category, objective, templateName, destType, textLength, campaignContext);
      } else {
        result = await metaService.analyzeImageFile(file, adIndex, category, objective, templateName, destType, textLength, campaignContext);
      }

      if (result.success && result.data) {
        // Determinar destino efectivo (dinámico si hay destinationOptions, sino del template)
        const effectiveDestination = destinationOptions ? selectedDestination : templateAdSetConfig?.conversionLocation;
        const isWhatsApp = effectiveDestination === 'WHATSAPP';
        const isMessenger = effectiveDestination === 'MESSENGER';
        const isIgDirect = effectiveDestination === 'INSTAGRAM_DIRECT';
        const isIgProfile = effectiveDestination === 'INSTAGRAM_PROFILE';
        const isMessaging = isMessenger || isIgDirect;
        // CTAs correctos por destino según Meta API
        const messagingCta = isWhatsApp ? 'WHATSAPP_MESSAGE' : isIgDirect ? 'INSTAGRAM_MESSAGE' : 'MESSAGE_PAGE';
        const defaultCta = isIgProfile ? 'VISIT_INSTAGRAM_PROFILE' : (isMessaging || isWhatsApp) ? messagingCta : 'LEARN_MORE';
        updateAd(adIndex, {
          headlines: result.data.headlines?.length ? result.data.headlines : ['', '', '', '', ''],
          descriptions: result.data.descriptions?.length ? result.data.descriptions : ['', '', '', '', ''],
          linkDescriptions: result.data.linkDescriptions?.length ? result.data.linkDescriptions : ['', '', '', '', ''],
          // Messaging destinations: forzar CTA de mensajería, no usar los generados por IA
          ...((isWhatsApp || isMessaging || isIgProfile)
            ? { ctas: [defaultCta, defaultCta, defaultCta, defaultCta, defaultCta] }
            : { ctas: result.data.ctas?.length ? result.data.ctas : [defaultCta, defaultCta, defaultCta, defaultCta, defaultCta] }),
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
  const handleAdSelectLibraryImage = (adIndex, image) => {
    updateAd(adIndex, {
      imageUrl: image.url || '',
      imageHash: image.hash || '',
      videoId: '',
      videoThumbnailUrl: '',
      uploadProgress: `Imagen seleccionada: ${image.name || 'Sin nombre'}`
    });
    // Analyze image via backend (server-side download avoids CORS)
    if (image.url) {
      analyzeLibraryMedia(adIndex, image.url, 'image');
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
    // Analyze the actual video (source URL) via backend for Whisper transcription
    // Falls back to thumbnail analysis if no source URL
    const videoSourceUrl = video.source || '';
    if (videoSourceUrl) {
      analyzeLibraryMedia(adIndex, videoSourceUrl, 'video');
    } else if (thumbUrl) {
      analyzeLibraryMedia(adIndex, thumbUrl, 'image');
    }
  };

  // Helper: Analyze library media via backend (server-side download, no CORS issues)
  const analyzeLibraryMedia = async (adIndex, mediaUrl, mediaType = 'image') => {
    const label = mediaType === 'video' ? 'Descargando y analizando video con IA...' : 'Analizando imagen con IA...';
    updateAd(adIndex, { analyzingMedia: true, uploadProgress: label });
    try {
      const metaService = new MetaAdsService(accessToken);
      const category = selectedTemplate?.category || '';
      const objective = selectedTemplate?.objective || '';
      const templateName = selectedTemplate?.name || '';
      const destType = templateAdConfig.destinationConfig?.type || '';

      const result = await metaService.analyzeMediaUrl(
        mediaUrl, mediaType, adIndex, category, objective, templateName, destType, textLength, campaignContext
      );

      if (result.success && result.data) {
        // Determinar destino efectivo (dinámico si hay destinationOptions, sino del template)
        const effectiveDestination = destinationOptions ? selectedDestination : templateAdSetConfig?.conversionLocation;
        const isWhatsApp = effectiveDestination === 'WHATSAPP';
        const isMessenger = effectiveDestination === 'MESSENGER';
        const isIgDirect = effectiveDestination === 'INSTAGRAM_DIRECT';
        const isIgProfile = effectiveDestination === 'INSTAGRAM_PROFILE';
        const isMessaging = isMessenger || isIgDirect;
        // CTAs correctos por destino según Meta API
        const messagingCta = isWhatsApp ? 'WHATSAPP_MESSAGE' : isIgDirect ? 'INSTAGRAM_MESSAGE' : 'MESSAGE_PAGE';
        const defaultCta = isIgProfile ? 'VISIT_INSTAGRAM_PROFILE' : (isMessaging || isWhatsApp) ? messagingCta : 'LEARN_MORE';
        updateAd(adIndex, {
          headlines: result.data.headlines?.length ? result.data.headlines : ['', '', '', '', ''],
          descriptions: result.data.descriptions?.length ? result.data.descriptions : ['', '', '', '', ''],
          linkDescriptions: result.data.linkDescriptions?.length ? result.data.linkDescriptions : ['', '', '', '', ''],
          // Messaging destinations: forzar CTA de mensajería
          ...((isWhatsApp || isMessaging || isIgProfile)
            ? { ctas: [defaultCta, defaultCta, defaultCta, defaultCta, defaultCta] }
            : { ctas: result.data.ctas?.length ? result.data.ctas : [defaultCta, defaultCta, defaultCta, defaultCta, defaultCta] }),
          analyzingMedia: false,
          contentGenerated: true,
          uploadProgress: `Contenido generado (${result.data.method || mediaType})`,
          showEditContent: true
        });
        console.log(`Ad ${adIndex}: Library ${mediaType} content generated via ${result.data.method}`);
      } else {
        updateAd(adIndex, {
          analyzingMedia: false,
          uploadProgress: `Media seleccionada. IA: ${result.error || 'Error generando contenido'}`
        });
      }
    } catch (err) {
      console.error('Library media analysis error:', err);
      updateAd(adIndex, {
        analyzingMedia: false,
        uploadProgress: `Media seleccionada. Error IA: ${err.message}`
      });
    }
  };

  // Si DC está bloqueado para esta plantilla y el modo actual es dynamic, cambiar a single
  useEffect(() => {
    if (isDCBlocked && adSetMode === 'dynamic') setAdSetMode('single');
  }, [isDCBlocked]);

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
        }
      } catch (err) {
        console.error('Error loading pages:', err);
        setPagesError('Error cargando páginas de Facebook. Recarga la página.');
      } finally {
        setLoadingPages(false);
      }
    };
    loadPages();
  }, []);

  // Auto-seleccionar página de Facebook según la cuenta publicitaria seleccionada
  useEffect(() => {
    if (!pages.length) return;
    const accountData = adAccounts.find(a => a.id === selectedAccount);
    const businessId = accountData?.business_id || accountData?.business?.id || null;
    // Buscar página del mismo negocio
    const matchingPage = businessId
      ? pages.find(p => p.business?.id === businessId)
      : null;
    // Si hay match usar esa; si no, usar la primera
    setSelectedPage(matchingPage ? matchingPage.id : pages[0].id);
  }, [selectedAccount, pages]);

  // Cargar números de WhatsApp Business del business de la cuenta publicitaria seleccionada
  useEffect(() => {
    let cancelled = false;

    const loadWhatsAppNumbers = async () => {
      if (!selectedAccount) {
        setWhatsAppNumbers([]);
        return;
      }

      setLoadingWhatsAppNumbers(true);
      setWhatsAppNumbersError('');
      setSelectedWhatsAppNumber('');
      setWhatsappNumber('');

      // Esperar 1.5s para no competir con otras cargas (audiences, pages, IG) y evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (cancelled) return;

      try {
        const metaService = new MetaAdsService(accessToken);

        const adAccountNumbers = await metaService.getWhatsAppNumbersFromAdAccount(selectedAccount);
        if (cancelled) return;

        console.log(`WhatsApp numbers for ad account ${selectedAccount}:`, adAccountNumbers.length, adAccountNumbers);

        if (adAccountNumbers.length > 0) {
          setWhatsAppNumbers(adAccountNumbers);
          if (adAccountNumbers.length === 1) {
            setSelectedWhatsAppNumber(String(adAccountNumbers[0].id));
            setWhatsappNumber(adAccountNumbers[0].display_phone_number.replace(/\D/g, ''));
          }
        } else {
          setWhatsAppNumbers([]);
          setWhatsAppNumbersError('No se encontraron números de WhatsApp Business para esta cuenta publicitaria.');
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err.response?.data?.error?.message || err.message;
        console.error('Error loading WhatsApp numbers:', msg);
        // Si es rate limit, reintentar después de 5s
        if (msg.includes('request limit')) {
          setWhatsAppNumbersError('Rate limit alcanzado. Reintentando...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          if (cancelled) return;
          try {
            const metaService2 = new MetaAdsService(accessToken);
            const retry = await metaService2.getWhatsAppNumbersFromAdAccount(selectedAccount);
            if (cancelled) return;
            if (retry.length > 0) {
              setWhatsAppNumbers(retry);
              setWhatsAppNumbersError('');
              if (retry.length === 1) {
                setSelectedWhatsAppNumber(String(retry[0].id));
                setWhatsappNumber(retry[0].display_phone_number.replace(/\D/g, ''));
              }
              return;
            }
          } catch (retryErr) {
            // Silenciar retry
          }
        }
        setWhatsAppNumbersError('Error al cargar números de WhatsApp: ' + msg);
      } finally {
        if (!cancelled) setLoadingWhatsAppNumbers(false);
      }
    };

    if (selectedAccount) {
      loadWhatsAppNumbers();
    }

    return () => { cancelled = true; };
  }, [selectedAccount]);

  // Cargar plantillas de bienvenida de WhatsApp de la cuenta seleccionada
  // Auto-fill linkUrl con el website de la página o perfil de Instagram
  useEffect(() => {
    const conversionLocation = templateAdSetConfig?.conversionLocation;

    // Para campañas de tráfico a Instagram: usar URL del perfil de Instagram
    if (conversionLocation === 'INSTAGRAM_PROFILE') {
      // Priorizar username de instagram_business_account (username real de IG, sin espacios)
      const page = selectedPage ? pages.find(p => p.id === selectedPage) : null;
      const igBizUsername = page?.instagram_business_account?.username;
      if (igBizUsername && !igBizUsername.includes(' ')) {
        const igUrl = `https://www.instagram.com/${igBizUsername}/`;
        setLinkUrl(igUrl);
        console.log('Auto-filled linkUrl from instagram_business_account:', igUrl);
        return;
      }
      // Fallback: username de la cuenta IG seleccionada (puede venir de page_backed con nombre de página)
      if (selectedIgAccount && igAccounts.length) {
        const ig = igAccounts.find(a => a.id === selectedIgAccount);
        if (ig?.username && !ig.username.includes(' ')) {
          const igUrl = `https://www.instagram.com/${ig.username}/`;
          setLinkUrl(igUrl);
          console.log('Auto-filled linkUrl from selected IG account:', igUrl);
          return;
        }
      }
    }

    // Para las demás campañas: usar website de la página
    if (!selectedPage || !pages.length) return;
    const page = pages.find(p => p.id === selectedPage);
    if (page?.website && !linkUrl) {
      const url = page.website.startsWith('http') ? page.website : `https://${page.website}`;
      setLinkUrl(url);
      console.log('Auto-filled linkUrl from page website:', url);
    }
  }, [selectedPage, pages, selectedIgAccount, igAccounts, templateAdSetConfig]);

  // Cargar cuentas de Instagram: usar page token para evitar restricciones de Business Manager
  useEffect(() => {
    let cancelled = false;

    const loadIgAccounts = async () => {
      if (!selectedAccount || pages.length === 0) {
        setIgAccounts([]);
        setSelectedIgAccount('');
        return;
      }

      const allIg = [];
      const seenIds = new Set();

      // 1. PRIORIDAD: /{ad-account}/instagram_accounts — IDs garantizados válidos para instagram_actor_id en creativos
      try {
        const metaService = new MetaAdsService(accessToken);
        const result = await metaService.getInstagramAccounts(selectedAccount);
        if (cancelled) return;
        console.log('Ad account instagram_accounts result:', result);
        if (result.success && result.data.length > 0) {
          result.data.forEach(ig => {
            if (ig.id && !seenIds.has(ig.id)) {
              seenIds.add(ig.id);
              allIg.push(ig);
              console.log(`Instagram from ad account endpoint: @${ig.username} (ID: ${ig.id})`);
            }
          });
        }
      } catch (err) {
        console.error('Error loading Instagram accounts from ad account:', err);
      }

      // 2. Fallback: /{page-id}/page_backed_instagram_accounts — cuenta IG creada por Meta para la página (siempre válida para ads)
      if (allIg.length === 0 && selectedPage && pages.length > 0) {
        const page = pages.find(p => p.id === selectedPage);
        if (page?.access_token) {
          try {
            const response = await axios.get(`https://graph.facebook.com/v21.0/${page.id}/page_backed_instagram_accounts`, {
              params: {
                access_token: page.access_token,
                fields: 'id,username,profile_picture_url'
              }
            });
            if (cancelled) return;
            const pbia = response.data?.data || [];
            pbia.forEach(ig => {
              if (ig.id && !seenIds.has(ig.id)) {
                seenIds.add(ig.id);
                allIg.push({
                  id: ig.id,
                  username: ig.username || page.name,
                  profile_pic: ig.profile_picture_url || null,
                  page_id: page.id,
                  page_name: page.name,
                  isPageBacked: true
                });
                console.log(`Instagram from page_backed_instagram_accounts: @${ig.username || page.name} (ID: ${ig.id})`);
              }
            });
          } catch (err) {
            console.warn('page_backed_instagram_accounts error:', err.response?.data?.error?.message || err.message);
          }
        }
      }

      // 3. Fallback: /{page-id}/instagram_accounts con page token
      if (allIg.length === 0 && pages.length > 0) {
        const targetPage = selectedPage ? pages.find(p => p.id === selectedPage) : null;
        const pagesToCheck = targetPage ? [targetPage] : pages;
        for (const page of pagesToCheck) {
          if (cancelled) return;
          if (!page.access_token) continue;
          try {
            const response = await axios.get(`https://graph.facebook.com/v21.0/${page.id}/instagram_accounts`, {
              params: {
                access_token: page.access_token,
                fields: 'id,username,profile_pic'
              }
            });
            const igList = response.data?.data || [];
            igList.forEach(ig => {
              if (ig.id && !seenIds.has(ig.id)) {
                seenIds.add(ig.id);
                allIg.push({
                  id: ig.id,
                  username: ig.username,
                  profile_pic: ig.profile_pic || null,
                  page_id: page.id,
                  page_name: page.name
                });
                console.log(`Instagram from /${page.id}/instagram_accounts: @${ig.username} (ID: ${ig.id})`);
              }
            });
          } catch (err) {
            // Silenciar errores individuales
          }
        }
      }

      // 4. Último fallback: instagram_business_account de la página (IG Graph API ID, puede no funcionar en ads)
      if (allIg.length === 0 && selectedPage && pages.length > 0) {
        const page = pages.find(p => p.id === selectedPage);
        if (page?.instagram_business_account) {
          const igBiz = page.instagram_business_account;
          console.log('Instagram from page data (last fallback — may not work for ads):', igBiz.username, igBiz.id);
          if (!seenIds.has(igBiz.id)) {
            seenIds.add(igBiz.id);
            allIg.push({ id: igBiz.id, username: igBiz.username, profile_pic: null });
          }
        }
      }

      if (cancelled) return;
      console.log('Total Instagram accounts found:', allIg.length, allIg);
      if (allIg.length > 0) {
        setIgAccounts(allIg);
        setSelectedIgAccount(allIg[0].id);
      } else {
        setIgAccounts([]);
        setSelectedIgAccount('');
      }
    };
    loadIgAccounts();

    return () => { cancelled = true; };
  }, [selectedAccount, selectedPage, pages]);

  // Cargar pixels cuando la cuenta cambia y es campaña OUTCOME_SALES + WEBSITE
  const isWebsiteSales = selectedTemplate?.objective === 'OUTCOME_SALES' &&
    (destinationOptions ? selectedDestination === 'WEBSITE' : templateAdSetConfig?.conversionLocation === 'WEBSITE');

  useEffect(() => {
    if (!selectedAccount || !isWebsiteSales) {
      setPixels([]);
      setSelectedPixel('');
      return;
    }
    let cancelled = false;
    const loadPixels = async () => {
      setLoadingPixels(true);
      try {
        const metaService = new MetaAdsService(accessToken);
        const result = await metaService.getPixels(selectedAccount);
        if (cancelled) return;
        if (result.success && result.data.length > 0) {
          setPixels(result.data);
          setSelectedPixel(result.data[0].id);
        }
      } catch (err) {
        console.error('Error loading pixels:', err);
      } finally {
        if (!cancelled) setLoadingPixels(false);
      }
    };
    loadPixels();
    return () => { cancelled = true; };
  }, [selectedAccount, isWebsiteSales]);

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

    // Bloquear submit si la IA aún está analizando media
    const adsStillAnalyzing = ads.filter(ad => ad.analyzingMedia);
    if (adsStillAnalyzing.length > 0) {
      setError(`Espera a que la IA termine de analizar ${adsStillAnalyzing.length} anuncio(s). El contenido 5+5+5 aún se está generando.`);
      return;
    }

    // Advertir si hay ads con media pero sin contenido generado (5+5+5 incompleto)
    const adsWithMediaButNoContent = ads.filter(ad =>
      (ad.imageHash || ad.videoId) && !ad.contentGenerated &&
      ad.headlines.every(h => !h?.trim()) && ad.descriptions.every(d => !d?.trim())
    );
    if (adsWithMediaButNoContent.length > 0) {
      setError(`${adsWithMediaButNoContent.length} anuncio(s) tienen media pero no se generó contenido 5+5+5. Espera a que la IA termine o edita el contenido manualmente.`);
      return;
    }

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

    // Validar Instagram si el destino es Instagram Direct
    const effectiveDestForValidation = destinationOptions ? selectedDestination : templateAdSetConfig?.conversionLocation;
    if ((effectiveDestForValidation === 'INSTAGRAM_DIRECT' || templateRequirements.instagram) && !selectedIgAccount) {
      setError('Por favor selecciona una cuenta de Instagram (requerida para Instagram Direct)');
      return;
    }

    // Validar URL solo si es requerida (por template o por destino seleccionado)
    const needsWebsite = templateRequirements.website || (destinationOptions && selectedDestination === 'WEBSITE');
    if (needsWebsite && !linkUrl.trim()) {
      setError('Por favor ingresa la URL de destino');
      return;
    }

    // Validar WhatsApp si es requerido (por plantilla o por destino seleccionado)
    const needsWhatsApp = templateRequirements.whatsapp || (destinationOptions && selectedDestination === 'WHATSAPP');
    if (needsWhatsApp) {
      if (whatsappMode === 'per-ad' && adSetMode !== 'flexible') {
        // Validar que cada ad tenga un número (solo en modos no-flexible; en flexible los números son por conjunto)
        const adsMissingNumber = ads.filter(ad => !ad.whatsappNumberId);
        if (adsMissingNumber.length > 0) {
          setError(`Selecciona un número de WhatsApp para cada anuncio (${adsMissingNumber.length} sin número)`);
          return;
        }
      } else {
        // Modo 'same': validar el selector global
        if (whatsAppNumbers.length > 0 && !selectedWhatsAppNumber) {
          setError('Por favor selecciona un número de WhatsApp Business');
          return;
        }
        // Si no hay números disponibles, permitir número manual (retrocompatibilidad)
        if (whatsAppNumbers.length === 0 && !whatsappNumber.trim()) {
          setError('Por favor ingresa el número de WhatsApp (ej: 573001234567)');
          return;
        }
      }
    }

    // Validar teléfono si es requerido
    if (templateRequirements.phone && !phoneNumber.trim()) {
      setError('Por favor ingresa el número de teléfono');
      return;
    }

    if (!dailyBudget || parseFloat(dailyBudget) < 5000) {
      setError(budgetLevel === 'adset' ? 'Agrega el presupuesto del Conjunto 1 (mínimo $5,000 COP)' : 'El presupuesto mínimo es $5,000 COP diario');
      return;
    }

    // Flexible mode: validate groups
    if (adSetMode === 'flexible') {
      const emptyGroup = flexibleAdGroups.findIndex(g => g.mediaItems.length === 0);
      if (emptyGroup !== -1) {
        setError(`El Anuncio Flexible ${emptyGroup + 1} no tiene medios. Agrega al menos una imagen o video.`);
        return;
      }
    }

    // Validar media — en flexible mode se valida por grupos (ya hecho arriba)
    if (adSetMode !== 'flexible') {
      const adsWithoutMedia = ads.filter(ad => !ad.imageHash && !ad.videoId);
      if (adsWithoutMedia.length === ads.length) {
        setError('Sube al menos una imagen o video para tus anuncios');
        return;
      }
      if (adsWithoutMedia.length > 0) {
        setError(`${adsWithoutMedia.length} anuncio(s) no tienen imagen ni video. Sube contenido o elimina los anuncios vacíos.`);
        return;
      }
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

      const campaignPrefix = getCampaignPrefix(selectedTemplate?.objective);
      const fullCampaignName = `${campaignPrefix}${campaignName.trim()}`;

      // Determinar tipo de campaña basado en la plantilla (o destino seleccionado por el usuario)
      const conversionLocation = destinationOptions ? selectedDestination : (templateAdSetConfig.conversionLocation || 'WEBSITE');

      // Build ads array for multi-ad
      const builtAds = ads.map((ad, i) => ({
        adName: `${i + 1}`,
        imageUrl: ad.imageUrl?.trim() || null,
        imageHash: ad.imageHash || null,
        imageHash9x16: ad.imageHash9x16 || null,
        videoId: ad.videoId || null,
        videoThumbnailUrl: ad.videoThumbnailUrl || null,
        headlines: ad.headlines.filter(h => h.trim() !== ''),
        descriptions: ad.descriptions.filter(d => d.trim() !== ''),
        linkDescriptions: (ad.linkDescriptions || []).filter(d => d.trim() !== ''),
        ctas: ad.ctas,
        // Per-ad audience (for per-ad mode)
        audienceId: ad.audienceId || null,
        audienceName: ad.audienceName || null,
        audienceTargeting: ad.audienceTargeting || null,
        // Per-ad WhatsApp number (for per-ad whatsapp mode)
        whatsappNumber: ad.whatsappNumber || null,
        whatsappNumberId: ad.whatsappNumberId || null,
      }));

      const jobData = {
        id: 'job_' + Date.now(),
        campaignName: fullCampaignName,
        adAccountId: selectedAccount,
        adAccountName: selectedAccountData?.name || selectedAccount,
        dailyBudgetCOP: parseFloat(dailyBudget),
        budgetLevel: budgetLevel, // 'campaign' (CBO) o 'adset'
        // Página de Facebook para el anuncio
        pageId: selectedPage,
        pageName: selectedPageData?.name || selectedPage,
        // URL de destino (si aplica)
        linkUrl: linkUrl.trim() || null,
        // Cuenta de Instagram para el anuncio
        igActorId: selectedIgAccount || null,
        igUsername: (() => { const ig = igAccounts.find(ig => ig.id === selectedIgAccount); console.log('IG account being sent:', { id: selectedIgAccount, username: ig?.username, allAccounts: igAccounts.map(a => ({ id: a.id, username: a.username })) }); return ig?.username || null; })(),
        // Pixel (para OUTCOME_SALES + WEBSITE)
        pixelId: selectedPixel || null,
        // Multi-ad
        adSetMode: adSetMode,
        ads: builtAds,
        totalAds: builtAds.length,
        // Campos dinámicos según tipo
        whatsappNumber: whatsappNumber.trim() || null,
        whatsappNumberId: selectedWhatsAppNumber || null,
        // Debug: log what WhatsApp values are being sent
        ...((() => { console.log('JOB WhatsApp values:', { whatsappNumber, selectedWhatsAppNumber, selectedInDropdown: whatsAppNumbers.find(n => String(n.id) === String(selectedWhatsAppNumber))?.display_phone_number }); return {}; })()),
        phoneNumber: phoneNumber.trim() || null,
        // Público (puede ser null si no hay disponibles)
        savedAudienceId: selectedAudience || null,
        savedAudienceName: selectedAudienceData?.name || `Colombia ${ageMin}-${ageMax} (Por defecto)`,
        savedAudienceTargeting: selectedAudienceData?.targeting || null,
        audienceType: selectedAudienceData?.audienceType || 'default',
        // Targeting personalizado
        startDate: startDate || null,
        endDate: endDate || null,
        ageMin: ageMin,
        ageMax: ageMax,
        gender: gender, // 'all', 'male', 'female'
        // Nuevos campos de campaña
        specialAdCategories: specialAdCategories.length > 0 ? specialAdCategories : [],
        bidStrategy: bidStrategy,
        bidAmount: bidAmount ? parseFloat(bidAmount) : null,
        advantageAudience: advantageAudience,
        useAdvantagePlacements: useAdvantagePlacements,
        excludedPlacements: excludedPlacements,
        // Múltiples públicos (replicar estructura por cada público adicional)
        whatsappMode: whatsappMode,
        flexibleAdGroups: adSetMode === 'flexible' ? flexibleAdGroups.map(g => ({
          mediaItems: g.mediaItems,
          headlines: g.headlines.filter(h => h.trim()),
          descriptions: g.descriptions.filter(d => d.trim()),
          linkDescriptions: g.linkDescriptions.filter(d => d.trim()),
          ctas: g.ctas
        })) : [],
        multiAudiences: adSetMode !== 'per-ad' && multiAudiences.length > 0 ? multiAudiences : [],
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

      <h2>Configuración de Campaña</h2>
      <p className="subtitle">Configura tu campaña siguiendo el flujo de Meta Ads Manager</p>

      <form onSubmit={handleSubmit}>

        {/* Sticky section navigation */}
        <nav className="config-nav">
          {[
            { id: 'section-campana', label: 'Campaña' },
            { id: 'section-identidad', label: 'Identidad' },
            { id: 'section-destino', label: 'Destino' },
            { id: 'section-presupuesto', label: 'Presupuesto' },
            { id: 'section-publico', label: 'Público' },
            { id: 'section-anuncios', label: 'Anuncios' },
          ].map(nav => (
            <button
              key={nav.id}
              type="button"
              className={`config-nav-item ${activeSection === nav.id ? 'active' : ''}`}
              onClick={() => {
                document.getElementById(nav.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {nav.label}
            </button>
          ))}
        </nav>

        {/* ===================== SECCIÓN: CAMPAÑA ===================== */}
        <div className="section-card" id="section-campana">
          <h4><span className="section-icon">📋</span> Campaña</h4>

        {/* Campaign Name */}
        <div className="form-group">
          <label>Nombre de la Campaña *</label>
          <div className="input-with-prefix">
            <span className="input-prefix">{getCampaignPrefix(selectedTemplate?.objective)}</span>
            <input
              type="text"
              placeholder="Ej: Landing Febrero 2024"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              required
            />
          </div>
          <p className="hint">Se agregará "{getCampaignPrefix(selectedTemplate?.objective)}" al inicio para identificar tus campañas</p>
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
              {adAccounts.length === 0 && (
                <p className="hint" style={{ color: 'var(--warning)' }}>No se encontraron cuentas publicitarias. Verifica los permisos de tu token.</p>
              )}
        </div>

        </div>{/* fin section-card Campaña */}

        {/* ===================== SECCIÓN: IDENTIDAD ===================== */}
        <div className="section-card" id="section-identidad">
          <h4><span className="section-icon">👤</span> Identidad</h4>

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
          {pagesError && <p className="hint" style={{ color: 'var(--error)' }}>{pagesError}</p>}
          <p className="hint">La página desde la cual se publicará el anuncio</p>
        </div>

        {/* Instagram Account Selection - cargadas desde la cuenta publicitaria + página */}
        <div className="form-group">
          <label>Cuenta de Instagram</label>
          <select
            value={selectedIgAccount}
            onChange={(e) => setSelectedIgAccount(e.target.value)}
          >
            <option value="">{igAccounts.length === 0 ? 'No se encontraron cuentas de Instagram' : 'Sin Instagram'}</option>
            {igAccounts.map((ig) => (
              <option key={ig.id} value={ig.id}>
                @{ig.username}
              </option>
            ))}
          </select>
          <p className="hint">
            {igAccounts.length === 0
              ? (templateAdSetConfig?.conversionLocation === 'INSTAGRAM_PROFILE'
                ? 'Se usará la cuenta de Instagram vinculada a tu página para dirigir tráfico al perfil'
                : 'Vincula una cuenta de Instagram a tu página de Facebook para publicar en Instagram')
              : 'El anuncio aparecerá también en Instagram con esta cuenta'}
          </p>
        </div>

        {/* Pixel selector - solo para OUTCOME_SALES + WEBSITE */}
        {isWebsiteSales && (
          <div className="form-group">
            <label>Pixel de Meta *</label>
            <select
              value={selectedPixel}
              onChange={(e) => setSelectedPixel(e.target.value)}
              disabled={loadingPixels}
            >
              <option value="">{loadingPixels ? 'Cargando pixels...' : 'Selecciona un pixel'}</option>
              {pixels.map((px) => (
                <option key={px.id} value={px.id}>{px.name} ({px.id})</option>
              ))}
            </select>
            <p className="hint">Pixel usado para rastrear conversiones en el sitio web</p>
          </div>
        )}

        </div>{/* fin section-card Identidad */}

        {/* ===================== SECCIÓN: DESTINO ===================== */}
        <div className="section-card" id="section-destino">
          <h4><span className="section-icon">🎯</span> Destino</h4>

        {/* Destination Selector - Para plantillas con múltiples destinos */}
        {destinationOptions && destinationOptions.length > 1 && (
          <div className="form-group">
            <label>Destino del anuncio *</label>
            <p className="hint mb-sm">Elige a dónde se dirigirán las personas al interactuar con tu anuncio</p>
            <div className="budget-level-selector">
              {destinationOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`budget-btn ${selectedDestination === opt.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDestination(opt.id);
                    // Actualizar CTAs de todos los ads cuando cambia el destino
                    const newCta = opt.id === 'WHATSAPP' ? 'WHATSAPP_MESSAGE'
                      : opt.id === 'INSTAGRAM_DIRECT' ? 'INSTAGRAM_MESSAGE'
                      : opt.id === 'INSTAGRAM_PROFILE' ? 'VISIT_INSTAGRAM_PROFILE'
                      : opt.id === 'MESSENGER' ? 'MESSAGE_PAGE'
                      : opt.id === 'WEBSITE' ? 'LEARN_MORE'
                      : 'LEARN_MORE';
                    setAds(prev => prev.map(ad => ({
                      ...ad,
                      ctas: ad.ctas.map(() => newCta)
                    })));
                  }}
                  title={opt.description}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
            <p className="hint mt-sm">
              {destinationOptions.find(o => o.id === selectedDestination)?.description || ''}
            </p>
          </div>
        )}

        {/* Landing Page URL - Solo si es requerido (por template o por destino seleccionado) */}
        {(templateRequirements.website || (destinationOptions && selectedDestination === 'WEBSITE')) && (
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

        {/* WhatsApp Number - Selector de WhatsApp Business */}
        {(templateRequirements.whatsapp || (destinationOptions && selectedDestination === 'WHATSAPP')) && (
          <div className="form-group">
            <label>Número de WhatsApp Business *</label>

            {/* Toggle por campaña / por conjunto — siempre visible si hay 2+ números */}
            {whatsAppNumbers.length > 1 && (
              <div style={{ marginBottom: '10px' }}>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${whatsappMode === 'same' ? 'active' : ''}`}
                    onClick={() => setWhatsappMode('same')}
                  >
                    Por campaña
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${whatsappMode === 'per-ad' ? 'active' : ''}`}
                    onClick={() => setWhatsappMode('per-ad')}
                  >
                    Por conjunto
                  </button>
                </div>
                {whatsappMode === 'per-ad' && (
                  <p className="hint" style={{ marginTop: '4px' }}>Selecciona el número para cada conjunto en la sección de Público.</p>
                )}
              </div>
            )}

            {/* Selector global — solo cuando es "por campaña" o no hay números cargados */}
            {(whatsappMode === 'same' || whatsAppNumbers.length <= 1) && (
              loadingWhatsAppNumbers ? (
                <select disabled><option>Cargando números de WhatsApp...</option></select>
              ) : whatsAppNumbers.length > 0 ? (
                <>
                  <select
                    value={selectedWhatsAppNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      const selected = whatsAppNumbers.find(n => String(n.id) === String(val));
                      setSelectedWhatsAppNumber(val);
                      if (selected) {
                        const digits = selected.display_phone_number.replace(/\D/g, '');
                        setWhatsappNumber(digits);
                      }
                    }}
                    required
                  >
                    <option value="">Selecciona un número de WhatsApp</option>
                    {whatsAppNumbers.map(num => {
                      const statusLabel = num.quality_score?.score ? ` [${num.quality_score.score}]` : '';
                      const pageName = num.page_name
                        ? ` - ${num.page_name}`
                        : num.whatsapp_business_account_name
                          ? ` - ${num.whatsapp_business_account_name}`
                          : '';
                      return (
                        <option key={num.id} value={String(num.id)}>
                          {num.display_phone_number} ({num.verified_name}{pageName}){statusLabel}
                        </option>
                      );
                    })}
                  </select>
                  <p className="hint">{whatsAppNumbers.length} número(s) encontrado(s).</p>
                </>
              ) : (
                <>
                  <input
                    type="tel"
                    placeholder="573001234567"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    required
                  />
                  {whatsAppNumbersError && <p className="hint error">{whatsAppNumbersError}</p>}
                  <p className="hint">Número con código de país sin espacios ni guiones (ej: 573001234567)</p>
                </>
              )
            )}
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

        </div>{/* fin section-card Destino */}

        {/* ===================== SECCIÓN: PÚBLICO ===================== */}
        {/* ===================== SECCIÓN: PRESUPUESTO Y CALENDARIO ===================== */}
        <div className="section-card" id="section-presupuesto">
          <h4><span className="section-icon">💰</span> Presupuesto y Calendario</h4>

        {/* Budget Level Selector - siempre visible */}
        <div className="form-group">
            <label>Nivel de Presupuesto</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${budgetLevel === 'campaign' ? 'active' : ''}`}
                onClick={() => setBudgetLevel('campaign')}
              >
                Por Campaña (CBO)
              </button>
              <button
                type="button"
                className={`toggle-btn ${budgetLevel === 'adset' ? 'active' : ''}`}
                onClick={() => setBudgetLevel('adset')}
              >
                Por Conjunto de Anuncios
              </button>
            </div>
            <p className="hint">
              {budgetLevel === 'campaign'
                ? 'Meta distribuye el presupuesto automáticamente entre los conjuntos de anuncios'
                : 'Tú controlas cuánto gasta cada conjunto de anuncios'}
            </p>
          </div>

        {/* Daily Budget in COP - solo visible en modo CBO */}
        {budgetLevel === 'campaign' && (
          <div className="form-group">
            <label>Presupuesto Diario (COP) *</label>
            <input
              type="number"
              placeholder="20000"
              min="5000"
              step="1000"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              required
            />
            <p className="hint">
              Presupuesto: ${formatCOP(dailyBudget || 0)} COP/día (CBO) - Sugerido: ${formatCOP(templateAdSetConfig.suggestedBudget || selectedTemplate?.suggestedBudget || 20000)}
            </p>
          </div>
        )}
        {budgetLevel === 'adset' && (
          <p className="hint" style={{ color: 'var(--text-muted)' }}>
            Define el presupuesto de cada conjunto en la sección de Público. Sugerido: ${formatCOP(templateAdSetConfig.suggestedBudget || selectedTemplate?.suggestedBudget || 20000)} COP/día por conjunto.
          </p>
        )}

        </div>{/* fin section-card Presupuesto */}

        <div className="section-card" id="section-publico">
          <h4><span className="section-icon">👥</span> Público por conjunto de anuncio</h4>

        {/* Audience Selection (Saved + Custom) - Shared when adSetMode=single */}
        <div className="form-group">
          <label>Público {adSetMode === 'single' ? '(compartido) *' : '(por defecto) *'}</label>
          {/* Cabecera de columnas */}
          {(budgetLevel === 'adset' || (whatsappMode === 'per-ad' && templateRequirements.whatsapp && whatsAppNumbers.length > 1)) && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px', paddingRight: '28px' }}>
              <div style={{ flex: 1 }} />
              {budgetLevel === 'adset' && (
                <div style={{ width: '110px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Presupuesto</div>
              )}
              {whatsappMode === 'per-ad' && templateRequirements.whatsapp && whatsAppNumbers.length > 1 && (
                <div style={{ width: '150px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Número WhatsApp</div>
              )}
            </div>
          )}
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', display: 'block' }}>Conjunto 1</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingRight: '28px' }}>
            <select
              style={{ flex: 1 }}
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
            {budgetLevel === 'adset' && (
              <input
                type="number"
                min="5000"
                step="1000"
                placeholder="20000"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                style={{ width: '110px', fontSize: '12px' }}
              />
            )}
            {whatsappMode === 'per-ad' && templateRequirements.whatsapp && whatsAppNumbers.length > 1 && (
              <select
                value={selectedWhatsAppNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  const selected = whatsAppNumbers.find(n => String(n.id) === String(val));
                  setSelectedWhatsAppNumber(val);
                  if (selected) setWhatsappNumber(selected.display_phone_number.replace(/\D/g, ''));
                }}
                style={{ width: '150px', fontSize: '12px' }}
              >
                <option value="">Número WA...</option>
                {whatsAppNumbers.map(num => (
                  <option key={num.id} value={String(num.id)}>
                    {num.display_phone_number}
                  </option>
                ))}
              </select>
            )}
          </div>
          {audienceError && (
            <p className="hint text-warning">{audienceError}</p>
          )}
          {budgetLevel === 'adset' && selectedAudience && dailyBudget && (
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '2px 0 0' }}>${formatCOP(dailyBudget)} COP/día</p>
          )}

          {/* Multi-Audience Selector (oculto en per-ad mode) */}
          {adSetMode !== 'per-ad' && selectedAudience && allAudiences.length > 1 && (
            <div className="mt-sm">
              {/* Dropdowns de públicos adicionales */}
              {multiAudiences.map((aud, index) => (
                <div key={aud.id} className="form-group" style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', display: 'block' }}>Conjunto {index + 2}</label>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <select
                          style={{ flex: 1 }}
                          value={aud.id}
                          onChange={(e) => {
                            const newAud = allAudiences.find(a => a.id === e.target.value);
                            if (newAud) setMultiAudiences(prev => prev.map((a, i) => i === index ? { ...a, id: newAud.id, name: newAud.name, targeting: newAud.targeting, audienceType: newAud.audienceType } : a));
                          }}
                        >
                          {allAudiences
                            .map((audience) => (
                              <option key={audience.id} value={audience.id}>
                                {audience.audienceType === 'custom' ? '[Custom] ' : ''}{audience.name}
                              </option>
                            ))}
                        </select>
                        {budgetLevel === 'adset' && (
                          <input
                            type="number"
                            min="5000"
                            step="1000"
                            placeholder={dailyBudget || '20000'}
                            value={aud.dailyBudget || ''}
                            onChange={(e) => setMultiAudiences(prev => prev.map((a, i) => i === index ? { ...a, dailyBudget: e.target.value } : a))}
                            style={{ width: '110px', fontSize: '12px' }}
                          />
                        )}
                        {whatsappMode === 'per-ad' && templateRequirements.whatsapp && whatsAppNumbers.length > 1 && (
                          <select
                            value={aud.whatsappNumberId || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const selected = whatsAppNumbers.find(n => String(n.id) === String(val));
                              setMultiAudiences(prev => prev.map((a, i) => i === index ? {
                                ...a,
                                whatsappNumberId: val,
                                whatsappNumber: selected ? selected.display_phone_number.replace(/\D/g, '') : ''
                              } : a));
                            }}
                            style={{ width: '150px', fontSize: '12px' }}
                          >
                            <option value="">Número WA...</option>
                            {whatsAppNumbers.map(num => (
                              <option key={num.id} value={String(num.id)}>
                                {num.display_phone_number}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      {budgetLevel === 'adset' && (
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                          ${formatCOP(aud.dailyBudget || dailyBudget || 0)} COP/día
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMultiAudiences(prev => prev.filter((_, i) => i !== index))}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', padding: '0 4px', marginTop: '14px' }}
                    >×</button>
                  </div>
                </div>
              ))}

              {/* Dropdown para agregar otro público */}
              <select
                value=""
                onChange={(e) => {
                  const aud = allAudiences.find(a => a.id === e.target.value);
                  if (aud) setMultiAudiences(prev => [...prev, { id: aud.id, name: aud.name, targeting: aud.targeting, audienceType: aud.audienceType }]);
                }}
                style={{ marginTop: '4px' }}
              >
                <option value="">+ Selecciona otro público para crear otro conjunto</option>
                {allAudiences
                  .map((audience) => (
                    <option key={audience.id} value={audience.id}>
                      {audience.audienceType === 'custom' ? '[Custom] ' : ''}{audience.name}
                    </option>
                  ))}
              </select>

              {multiAudiences.length > 0 && (
                <p className="hint mt-sm text-accent">
                  {multiAudiences.length + 1} conjuntos = {
                    adSetMode === 'flexible'
                      ? `${multiAudiences.length + 1} Ad Sets (1 anuncio flexible con ${ads.length} contenido${ads.length > 1 ? 's' : ''} cada uno)`
                      : adSetMode === 'single'
                        ? `${multiAudiences.length + 1} Ad Sets (cada uno con ${ads.length} ad${ads.length > 1 ? 's' : ''})`
                        : `${(multiAudiences.length + 1) * ads.length} Ad Sets con 5+5+5`
                  }
                </p>
              )}
            </div>
          )}
        </div>

        </div>{/* fin section-card Público */}

        {/* ===================== SECCIÓN: ANUNCIOS ===================== */}
        <div className="section-card" id="section-anuncios">
          <h4><span className="section-icon">🎬</span> Anuncios ({ads.length})</h4>

        {/* AdSet Mode Toggle */}
        <div className="form-group">
          <label>Estructura de Anuncios</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`ad-mode-btn ${adSetMode === 'single' ? 'active' : ''}`}
              onClick={() => setAdSetMode('single')}
            >
              <strong>Anuncio Estándar</strong>
              <small>1-1-1 Copys x Ad</small>
            </button>
            {!isDCBlocked && (
              <button
                type="button"
                className={`ad-mode-btn ${adSetMode === 'dynamic' ? 'active' : ''}`}
                onClick={() => setAdSetMode('dynamic')}
              >
                <strong>Anuncio Dinámico</strong>
                <small>1 creativo x Ad · 5-5-5 Copys</small>
              </button>
            )}
            {['OUTCOME_SALES', 'OUTCOME_APP_PROMOTION'].includes(selectedTemplate?.objective) && (
              <button
                type="button"
                className={`ad-mode-btn ${adSetMode === 'flexible' ? 'active' : ''}`}
                onClick={() => setAdSetMode('flexible')}
              >
                <strong>Anuncio Flexible</strong>
                <small>1 Ad · 10 img/vid · 5-5-5 Copys</small>
              </button>
            )}
          </div>
          <p className="hint">
            {adSetMode === 'single'
              ? 'Todos los anuncios en 1 solo Ad Set. Ideal para campañas simples con 1-2 anuncios.'
              : adSetMode === 'dynamic'
              ? 'Crea docenas de combinaciones automáticamente (5 títulos + 5 descripciones + 5 CTAs). Meta optimiza las mejores. Recomendado para la mayoría de campañas.'
              : 'Usa el formato nativo de Meta que combina imágenes, videos y textos en un solo anuncio. Meta optimiza automáticamente. Solo para campañas de Ventas o Apps.'}
          </p>
        </div>

        {/* AI Text Generation Settings */}
        <div className="form-group">
          <label>Configuración de textos IA</label>
          <div className="toggle-group mb-sm" style={{ alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '12px', marginRight: '4px' }}>Longitud:</span>
            {[
              { value: 'short', label: 'Corto', desc: 'Titulos ~30 chars, Textos ~80 chars' },
              { value: 'medium', label: 'Medio', desc: 'Titulos ~50 chars, Textos ~200 chars' },
              { value: 'long', label: 'Largo', desc: 'Titulos ~55 chars, Textos ~300 chars' }
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTextLength(opt.value)}
                title={opt.desc}
                className={`toggle-btn ${textLength === opt.value ? 'active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <textarea
            value={campaignContext}
            onChange={(e) => setCampaignContext(e.target.value)}
            placeholder="Contexto adicional para la IA (opcional) - Ej: 'Somos una clinica de depilacion laser, enfocarnos en precios bajos y resultados rapidos, el publico es mujeres de 20-35 anos...'"
            rows={2}
            style={{ resize: 'vertical' }}
          />
          <p className="hint">
            {campaignContext.trim()
              ? 'La IA usara tu contexto para generar los textos.'
              : 'Sin contexto: la IA generara textos basandose solo en el contenido multimedia que subas.'}
          </p>
        </div>

        {/* Library Upload Section */}
        <div className="upload-area">
          <input
            ref={multiFileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,.jpg,.jpeg,.png,.webp,.mp4,.mov"
            onChange={handleMultiFileUpload}
            style={{ display: 'none' }}
          />
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontSize: '16px', textAlign: 'center' }}>
            Subir archivos a la Biblioteca de Meta
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => multiFileInputRef.current?.click()}
              disabled={!selectedAccount}
              className="toggle-btn active"
              style={{ padding: '14px 32px', fontSize: '15px', opacity: selectedAccount ? 1 : 0.5 }}
            >
              Subir archivos
            </button>
            {multiUploadProgress && (
              <span className="text-accent" style={{ fontSize: '12px' }}>
                {multiUploadProgress}
              </span>
            )}
          </div>
        </div>

        {/* Ad Cards */}
        <div className="ads-section">
          {adSetMode === 'flexible' ? (
            /* ===== FLEXIBLE MODE: N Groups = N Flexible Ads ===== */
            <>
              {flexibleAdGroups.map((group, groupIndex) => (
                <div key={group.id} className="ad-card" style={{ marginBottom: '16px' }}>
                  {/* Group Header */}
                  <div className="ad-card-header">
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Anuncio Flexible {groupIndex + 1}
                      {group.contentGenerated && (
                        <span className="content-badge content-badge--h" style={{ background: 'var(--success)', color: '#064E3B', fontSize: '10px', fontWeight: 700 }}>IA</span>
                      )}
                    </h4>
                    {flexibleAdGroups.length > 1 && (
                      <button type="button" className="remove-ad-btn" onClick={() => removeFlexGroup(groupIndex)}>Eliminar</button>
                    )}
                  </div>

                  {/* Media Strip */}
                  <div className="form-group">
                    <label style={{ marginBottom: '6px', display: 'block' }}>
                      Medios ({group.mediaItems.length} {group.mediaItems.length === 1 ? 'elemento' : 'elementos'})
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                      {group.mediaItems.map((item, mi) => (
                        <div key={mi} style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0 }}>
                          <img
                            src={item.type === 'video' ? (item.thumbnailUrl || '') : item.url}
                            alt={item.name || `Media ${mi + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                          {item.type === 'video' && (
                            <div style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '9px', borderRadius: '3px', padding: '1px 4px' }}>VID</div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeMediaFromFlexGroup(groupIndex, mi)}
                            style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}
                          >×</button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => { setFlexGroupPickerOpen(flexGroupPickerOpen === groupIndex ? null : groupIndex); handleLoadMediaLibrary(); }}
                        style={{ width: '64px', height: '64px', border: '2px dashed var(--border)', borderRadius: '6px', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}
                        title="Agregar desde biblioteca"
                      >+</button>
                      <label
                        style={{ width: '64px', height: '64px', border: '2px dashed var(--accent)', borderRadius: '6px', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0, textAlign: 'center', fontWeight: 600 }}
                        title="Subir archivo"
                      >
                        ↑ Subir
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,.jpg,.jpeg,.png,.webp,.mp4,.mov"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file || !selectedAccount) return;
                            const ext = file.name.toLowerCase().split('.').pop();
                            const isVid = file.type.startsWith('video/') || ['mp4','mov','avi','mkv','webm'].includes(ext);
                            const isImg = !isVid && (file.type.startsWith('image/') || ['jpg','jpeg','png','webp','gif'].includes(ext));
                            if (!isVid && !isImg) return;
                            updateFlexGroup(groupIndex, { uploadProgress: `Subiendo ${file.name}...`, analyzingMedia: false });
                            try {
                              const metaService = new MetaAdsService(accessToken);
                              let res;
                              if (isImg) {
                                res = await metaService.uploadImageFile(selectedAccount, file);
                                if (res.success) {
                                  addMediaToFlexGroup(groupIndex, { type: 'image', hash: res.data.imageHash, url: res.data.url, thumbnailUrl: '', name: file.name });
                                  updateFlexGroup(groupIndex, { uploadProgress: `Imagen subida ✓` });
                                }
                              } else {
                                res = await metaService.uploadVideoFile(selectedAccount, file);
                                if (res.success) {
                                  addMediaToFlexGroup(groupIndex, { type: 'video', hash: res.data.thumbnailHash || '', url: res.data.thumbnailUrl || '', videoId: res.data.videoId, thumbnailUrl: res.data.thumbnailUrl || '', name: file.name });
                                  updateFlexGroup(groupIndex, { uploadProgress: `Video subido ✓` });
                                }
                              }
                              if (!res.success) updateFlexGroup(groupIndex, { uploadProgress: `Error: ${res.error}` });
                            } catch (err) {
                              updateFlexGroup(groupIndex, { uploadProgress: `Error: ${err.message}` });
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>

                    {/* Inline media library picker for this group */}
                    {flexGroupPickerOpen === groupIndex && (
                      <div className="library-grid" style={{ display: 'block', gridTemplateColumns: 'none', maxHeight: '300px', padding: '10px' }}>
                        <div className="toggle-group mb-sm">
                          <button type="button" className={`toggle-btn ${flexGroupPickerTab === 'images' ? 'active' : ''}`} onClick={() => setFlexGroupPickerTab('images')}>
                            Imágenes ({mediaLibrary.images.length})
                          </button>
                          <button type="button" className={`toggle-btn ${flexGroupPickerTab === 'videos' ? 'active' : ''}`} onClick={() => setFlexGroupPickerTab('videos')}>
                            Videos ({mediaLibrary.videos.length})
                          </button>
                          <button type="button" className="toggle-btn" onClick={() => setFlexGroupPickerOpen(null)} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>Cerrar</button>
                        </div>
                        <p className="hint mb-sm" style={{ fontSize: '10px' }}>Haz click en un elemento para agregarlo al grupo. Puedes agregar múltiples.</p>
                        {loadingMedia ? (
                          <p className="text-muted" style={{ textAlign: 'center', fontSize: '13px' }}>Cargando biblioteca...</p>
                        ) : (
                          <>
                            {flexGroupPickerTab === 'images' && (
                              <div className="library-grid" style={{ maxHeight: 'none', border: 'none', padding: 0, gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))' }}>
                                {mediaLibrary.images.map((img, i) => {
                                  const alreadyIn = group.mediaItems.some(m => m.type === 'image' && m.hash === img.hash);
                                  return (
                                    <div
                                      key={img.hash || i}
                                      onClick={() => {
                                        if (alreadyIn) {
                                          removeMediaFromFlexGroup(groupIndex, group.mediaItems.findIndex(m => m.type === 'image' && m.hash === img.hash));
                                        } else {
                                          addMediaToFlexGroup(groupIndex, { type: 'image', hash: img.hash, url: img.url, thumbnailUrl: '', name: img.name || 'Imagen' });
                                        }
                                      }}
                                      className={`library-item ${alreadyIn ? 'selected' : ''}`}
                                    >
                                      <img src={img.url} alt={img.name || 'img'} onError={e => { e.target.style.display = 'none'; }} />
                                      {alreadyIn && <div className="library-item-badge">✓</div>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {flexGroupPickerTab === 'videos' && (
                              <div className="library-grid" style={{ maxHeight: 'none', border: 'none', padding: 0, gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
                                {mediaLibrary.videos.map((vid, i) => {
                                  const thumbnail = vid.thumbnails?.data?.[0]?.uri || null;
                                  const alreadyIn = group.mediaItems.some(m => m.type === 'video' && m.videoId === vid.id);
                                  return (
                                    <div
                                      key={vid.id || i}
                                      onClick={() => {
                                        if (alreadyIn) {
                                          removeMediaFromFlexGroup(groupIndex, group.mediaItems.findIndex(m => m.type === 'video' && m.videoId === vid.id));
                                        } else {
                                          addMediaToFlexGroup(groupIndex, { type: 'video', hash: '', url: thumbnail || '', videoId: vid.id, thumbnailUrl: thumbnail || '', sourceUrl: vid.source || '', name: vid.title || 'Video' });
                                        }
                                      }}
                                      className={`library-item ${alreadyIn ? 'selected' : ''}`}
                                      style={{ aspectRatio: 'auto' }}
                                    >
                                      {thumbnail ? <img src={thumbnail} alt={vid.title} style={{ height: '65px', objectFit: 'cover' }} /> : <div className="text-muted" style={{ width: '100%', height: '65px', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>V</div>}
                                      <div style={{ padding: '3px 5px', fontSize: '10px' }}>
                                        <p style={{ fontWeight: 'bold', marginBottom: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{vid.title || 'Sin título'}</p>
                                      </div>
                                      {alreadyIn && <div className="library-item-badge">✓</div>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* AI status */}
                    {group.analyzingMedia && (
                      <div className="chip mt-sm" style={{ gap: '8px' }}>
                        <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                        <span className="text-accent" style={{ fontSize: '12px' }}>{group.uploadProgress || 'Analizando con IA...'}</span>
                      </div>
                    )}
                    {!group.analyzingMedia && group.uploadProgress && (
                      <p className={`hint mt-sm ${group.contentGenerated ? 'text-success' : 'text-muted'}`}>{group.uploadProgress}</p>
                    )}
                  </div>

                  {/* Generar 5+5+5 con IA */}
                  {group.mediaItems.length > 0 && (
                    <div className="mt-sm" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => analyzeFlexGroupWithMedia(groupIndex)}
                        disabled={group.analyzingMedia}
                        className="toggle-btn active"
                        style={{ fontSize: '12px', padding: '6px 14px', opacity: group.analyzingMedia ? 0.6 : 1 }}
                      >
                        {group.analyzingMedia ? 'Generando...' : (group.contentGenerated ? 'Regenerar 5+5+5 con IA' : 'Generar 5+5+5 con IA')}
                      </button>
                      {!group.contentGenerated && (
                        <span className="text-muted" style={{ fontSize: '11px' }}>Analiza todos los medios del anuncio</span>
                      )}
                    </div>
                  )}

                  {/* 5+5+5 Content Toggle */}
                  <div className="mt-sm">
                    <button
                      type="button"
                      className={`content-editor-toggle ${group.contentGenerated ? 'generated' : ''}`}
                      onClick={() => updateFlexGroup(groupIndex, { showEditContent: !group.showEditContent })}
                    >
                      <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                        {group.contentGenerated && (
                          <span className="content-badge content-badge--h" style={{ background: 'var(--success)', color: '#064E3B', fontSize: '10px' }}>IA</span>
                        )}
                        <span className={group.contentGenerated ? 'text-success' : 'text-muted'} style={{ fontSize: '13px', fontWeight: '500' }}>
                          {group.contentGenerated
                            ? `5+5+5 generado (${group.headlines.filter(h => h.trim()).length}T + ${group.descriptions.filter(d => d.trim()).length}D)`
                            : `${group.headlines.filter(h => h.trim()).length} Títulos + ${group.descriptions.filter(d => d.trim()).length} Textos`}
                        </span>
                      </div>
                      <span className="content-editor-arrow" style={{ transform: group.showEditContent ? 'rotate(180deg)' : 'none' }}>
                        {group.showEditContent ? 'v' : '>'}
                      </span>
                    </button>

                    {group.showEditContent && (
                      <div className="content-editor">
                        {/* Primary Texts */}
                        <div className="content-editor-section">
                          <div className="content-editor-section-header">
                            <span className="content-badge content-badge--d">D</span>
                            <label>Textos Principales ({group.descriptions.filter(d => d.trim()).length}/5)</label>
                          </div>
                          {group.descriptions.map((desc, di) => (
                            <div key={`fg${groupIndex}-d${di}`} className="content-input-wrapper">
                              <textarea
                                placeholder={`Texto principal ${di + 1}`}
                                value={desc}
                                onChange={(e) => {
                                  const arr = [...group.descriptions]; arr[di] = e.target.value;
                                  updateFlexGroup(groupIndex, { descriptions: arr });
                                }}
                                maxLength={500} rows={3}
                                className={`content-input ${desc.trim() ? 'filled-desc' : ''}`}
                                style={{ padding: '8px 10px', resize: 'vertical' }}
                              />
                              <span className={`char-count ${desc.length > 280 ? 'error' : ''}`} style={{ top: 'auto', bottom: '8px' }}>{desc.length}/500</span>
                            </div>
                          ))}
                        </div>
                        {/* Headlines */}
                        <div className="content-editor-section">
                          <div className="content-editor-section-header">
                            <span className="content-badge content-badge--h">H</span>
                            <label>Títulos ({group.headlines.filter(h => h.trim()).length}/5)</label>
                          </div>
                          {group.headlines.map((headline, hi) => (
                            <div key={`fg${groupIndex}-h${hi}`} className="content-input-wrapper">
                              <input
                                type="text" placeholder={`Título ${hi + 1}`} value={headline}
                                onChange={(e) => {
                                  const arr = [...group.headlines]; arr[hi] = e.target.value;
                                  updateFlexGroup(groupIndex, { headlines: arr });
                                }}
                                maxLength={55} className={`content-input ${headline.trim() ? 'filled' : ''}`}
                              />
                              <span className={`char-count ${headline.length > 50 ? 'error' : ''}`} style={{ top: '50%', transform: 'translateY(-50%)' }}>{headline.length}/55</span>
                            </div>
                          ))}
                        </div>
                        {/* Link Descriptions */}
                        <div className="content-editor-section">
                          <div className="content-editor-section-header">
                            <span className="content-badge content-badge--d" style={{ opacity: 0.7 }}>LD</span>
                            <label>Descripciones ({group.linkDescriptions.filter(d => d.trim()).length}/5) <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>· texto corto bajo el título</span></label>
                          </div>
                          {group.linkDescriptions.map((desc, di) => (
                            <div key={`fg${groupIndex}-ld${di}`} className="content-input-wrapper">
                              <input
                                type="text" placeholder={`Descripción ${di + 1} (máx 30)`} value={desc}
                                onChange={(e) => {
                                  const arr = [...group.linkDescriptions]; arr[di] = e.target.value;
                                  updateFlexGroup(groupIndex, { linkDescriptions: arr });
                                }}
                                maxLength={30} className={`content-input ${desc.trim() ? 'filled' : ''}`}
                              />
                              <span className={`char-count ${desc.length > 27 ? 'error' : ''}`} style={{ top: '50%', transform: 'translateY(-50%)' }}>{desc.length}/30</span>
                            </div>
                          ))}
                        </div>
                        {/* CTAs */}
                        <div>
                          <div className="content-editor-section-header">
                            <span className="content-badge content-badge--cta">CTA</span>
                            <label>Llamados a la Acción ({[...new Set(group.ctas)].length} únicos)</label>
                          </div>
                          <div className="cta-grid">
                            {group.ctas.map((cta, ci) => (
                              <select key={`fg${groupIndex}-c${ci}`} value={cta} className="cta-select"
                                onChange={(e) => {
                                  const arr = [...group.ctas]; arr[ci] = e.target.value;
                                  updateFlexGroup(groupIndex, { ctas: arr });
                                }}
                              >
                                {CTA_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add new flexible ad group button */}
              <button type="button" className="add-ad-btn" onClick={addFlexGroup}>
                + Nuevo anuncio flexible
              </button>
            </>
          ) : (
          /* ===== NON-FLEXIBLE MODES: existing ads list ===== */
          <>
          {ads.map((ad, adIndex) => (
            <div key={ad.id} className="ad-card">
              {/* Ad Card Header */}
              <div className="ad-card-header">
                <h4>
                  Anuncio {adIndex + 1}
                </h4>
                {ads.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAd(adIndex)}
                    className="remove-ad-btn"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              {/* Ad Name */}
              <div className="form-group">
                <label>Nombre del anuncio</label>
                <input
                  type="text"
                  placeholder={`Ad ${adIndex + 1}`}
                  value={ad.adName}
                  onChange={(e) => updateAd(adIndex, { adName: e.target.value })}
                />
              </div>

              {/* Per-ad Audience (only in per-ad mode) */}
              {adSetMode === 'per-ad' && (
                <div className="form-group">
                  <label>Público para este anuncio</label>
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

              {/* Per-ad WhatsApp Number — removido: los números ahora se seleccionan por conjunto en la sección de Público */}

              {/* Media Source Tabs */}
              <div className="form-group">
                <label>Contenido (imagen/video)</label>
                <div className="toggle-group mb-sm">
                  <button
                    type="button"
                    className={`media-tab ${ad.mediaSource === 'none' ? 'active' : ''}`}
                    onClick={() => updateAd(adIndex, { mediaSource: 'none' })}
                  >
                    Vacío
                  </button>
                  <button
                    type="button"
                    className={`media-tab ${ad.mediaSource === 'library' ? 'active' : ''}`}
                    onClick={() => { updateAd(adIndex, { mediaSource: 'library' }); handleLoadMediaLibrary(); }}
                  >
                    Biblioteca
                  </button>
                  <button
                    type="button"
                    className={`media-tab ${ad.mediaSource === 'upload' ? 'active' : ''}`}
                    onClick={() => updateAd(adIndex, { mediaSource: 'upload' })}
                  >
                    Subir archivo
                  </button>
                </div>

                {/* Library Browser — multi-select directo */}
                {ad.mediaSource === 'library' && (
                  <div className="library-grid" style={{ display: 'block', gridTemplateColumns: 'none', maxHeight: '350px', padding: '10px' }}>
                    {/* Mode selector + apply button (always visible) */}
                    <div className="toggle-group mb-sm" style={{ alignItems: 'center' }}>
                      <span className="text-muted" style={{ fontSize: '11px' }}>Modo:</span>
                      <button
                        type="button"
                        className={`toggle-btn ${libraryMode === 'single' ? 'active' : ''}`}
                        onClick={() => { setLibraryMode('single'); setSelectedLibraryMedia([]); }}
                      >
                        1 Anuncio x conjunto
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn ${libraryMode === 'per-ad' ? 'active' : ''}`}
                        onClick={() => { setLibraryMode('per-ad'); setSelectedLibraryMedia([]); }}
                      >
                        Múltiples Anuncios por conjunto
                      </button>
                      {selectedLibraryMedia.length > 1 && (
                        <button
                          type="button"
                          className="toggle-btn active"
                          onClick={() => handleApplyLibrarySelection(adIndex)}
                          style={{ marginLeft: 'auto', borderColor: 'var(--success)', color: 'var(--success)', background: 'rgba(52, 211, 153, 0.15)' }}
                        >
                          Aplicar ({selectedLibraryMedia.length})
                        </button>
                      )}
                    </div>
                    <p className="hint mb-sm" style={{ fontSize: '10px' }}>
                      {libraryMode === 'single'
                        ? 'Haz click para seleccionar el contenido de este ad.'
                        : 'Selecciona varios y haz click en "Aplicar" para crear 1 ad por cada uno.'}
                    </p>
                    {loadingMedia ? (
                      <p className="text-muted" style={{ textAlign: 'center', fontSize: '13px' }}>Cargando biblioteca...</p>
                    ) : (
                      <>
                        {mediaLibrary.images.length === 0 && mediaLibrary.videos.length === 0 ? (
                          <p className="text-muted" style={{ textAlign: 'center', fontSize: '13px' }}>No hay medios en esta cuenta</p>
                        ) : (
                          <>
                            {/* Tabs */}
                            <div className="toggle-group mb-sm">
                              <button
                                type="button"
                                className={`toggle-btn ${libraryTab === 'images' ? 'active' : ''}`}
                                onClick={() => setLibraryTab('images')}
                              >
                                Imágenes ({mediaLibrary.images.length})
                              </button>
                              <button
                                type="button"
                                className={`toggle-btn ${libraryTab === 'videos' ? 'active' : ''}`}
                                onClick={() => setLibraryTab('videos')}
                              >
                                Videos ({mediaLibrary.videos.length})
                              </button>
                            </div>

                            {/* Tab: Imágenes */}
                            {libraryTab === 'images' && (
                              <div className="library-grid" style={{ maxHeight: 'none', border: 'none', padding: 0, gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
                                {mediaLibrary.images.map((img, i) => {
                                  const isSel = isLibraryMediaSelected('image', img);
                                  return (
                                    <div
                                      key={img.hash || i}
                                      onClick={() => {
                                        if (libraryMode === 'single') {
                                          handleAdSelectLibraryImage(adIndex, img);
                                        } else {
                                          toggleLibraryMediaSelection('image', img);
                                        }
                                      }}
                                      className={`library-item ${(isSel || ad.imageHash === img.hash) ? 'selected' : ''}`}
                                    >
                                      <img
                                        src={img.url}
                                        alt={img.name || 'Ad image'}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                      {isSel && (
                                        <div className="library-item-badge" style={{ background: 'var(--warning)' }}>{selectedLibraryMedia.findIndex(m => m.type === 'image' && m.data.hash === img.hash) + 1}</div>
                                      )}
                                      {!isSel && ad.imageHash === img.hash && (
                                        <div className="library-item-badge">✓</div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Tab: Videos */}
                            {libraryTab === 'videos' && (
                              <div className="library-grid" style={{ maxHeight: 'none', border: 'none', padding: 0, gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                                {mediaLibrary.videos.map((vid, i) => {
                                  const thumbnail = vid.thumbnails?.data?.[0]?.uri || null;
                                  const isSel = isLibraryMediaSelected('video', vid);
                                  return (
                                    <div
                                      key={vid.id || i}
                                      onClick={() => {
                                        if (libraryMode === 'single') {
                                          handleAdSelectLibraryVideo(adIndex, vid);
                                        } else {
                                          toggleLibraryMediaSelection('video', vid);
                                        }
                                      }}
                                      className={`library-item ${(isSel || ad.videoId === vid.id) ? 'selected' : ''}`}
                                      style={{ aspectRatio: 'auto' }}
                                    >
                                      {thumbnail ? (
                                        <img src={thumbnail} alt={vid.title} style={{ height: '70px', objectFit: 'cover' }} />
                                      ) : (
                                        <div className="text-muted" style={{ width: '100%', height: '70px', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>V</div>
                                      )}
                                      <div style={{ padding: '4px 6px', fontSize: '10px' }}>
                                        <p style={{ fontWeight: 'bold', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                                          {vid.title || 'Sin título'}
                                        </p>
                                        {vid.length && <p className="text-muted" style={{ margin: 0 }}>{Math.round(vid.length)}s</p>}
                                      </div>
                                      {isSel && (
                                        <div className="library-item-badge" style={{ background: 'var(--warning)' }}>{selectedLibraryMedia.findIndex(m => m.type === 'video' && m.data.id === vid.id) + 1}</div>
                                      )}
                                      {!isSel && ad.videoId === vid.id && (
                                        <div className="library-item-badge">✓</div>
                                      )}
                                    </div>
                                  );
                                })}
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
                  <div className="upload-area" style={{ borderStyle: 'dashed', textAlign: 'center' }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,.jpg,.jpeg,.png,.webp,.mp4,.mov"
                      onChange={(e) => handleAdFileUpload(adIndex, e)}
                      disabled={ad.uploadingFile || !selectedAccount}
                      style={{ marginBottom: '8px' }}
                    />
                    <p className="hint">
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
                  <div className="chip mt-sm" style={{ gap: '8px' }}>
                    <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                    <span className="text-accent" style={{ fontSize: '12px' }}>
                      {ad.uploadProgress || 'Analizando con IA...'}
                    </span>
                  </div>
                )}
                {!ad.analyzingMedia && ad.uploadProgress && ad.mediaSource !== 'none' && (
                  <p className={`hint mt-sm ${ad.contentGenerated || ad.imageUrl || ad.imageHash || ad.videoId ? 'text-success' : 'text-warning'}`}>
                    {ad.uploadProgress}
                  </p>
                )}
                {ad.mediaSource === 'none' && (
                  <p className="hint">Sin imagen/video, usará la vista previa del link.</p>
                )}
              </div>

              {/* Content Summary & Edit Toggle */}
              <div className="mt-sm">
                <button
                  type="button"
                  className={`content-editor-toggle ${ad.contentGenerated ? 'generated' : ''}`}
                  onClick={() => updateAd(adIndex, { showEditContent: !ad.showEditContent })}
                >
                  <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                    {ad.contentGenerated && (
                      <span className="content-badge content-badge--h" style={{ background: 'var(--success)', color: '#064E3B', fontSize: '10px' }}>IA</span>
                    )}
                    <span className={ad.contentGenerated ? 'text-success' : 'text-muted'} style={{ fontSize: '13px', fontWeight: '500' }}>
                      {ad.contentGenerated 
                        ? '5 Títulos + 5 Descripciones (CTAs de la plantilla)'
                        : `${ad.headlines.filter(h => h.trim()).length} Títulos + ${ad.descriptions.filter(d => d.trim()).length} Descripciones`}
                    </span>
                  </div>
                  <span className="content-editor-arrow" style={{ transform: ad.showEditContent ? 'rotate(180deg)' : 'none' }}>
                    {ad.showEditContent ? 'v' : '>'}
                  </span>
                </button>

                {/* Inline Content Editor */}
                {ad.showEditContent && (
                  <div className="content-editor">
                    {/* Descriptions */}
                    <div className="content-editor-section">
                      <div className="content-editor-section-header">
                        <span className="content-badge content-badge--d">D</span>
                        <label>
                          Textos Principales ({ad.descriptions.filter(d => d.trim()).length}/5)
                        </label>
                      </div>
                      {ad.descriptions.map((desc, di) => (
                        <div key={`ad${adIndex}-d${di}`} className="content-input-wrapper">
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
                            className={`content-input ${desc.trim() ? 'filled-desc' : ''}`}
                            style={{ padding: '8px 10px', resize: 'vertical' }}
                          />
                          <span className={`char-count ${desc.length > 280 ? 'error' : ''}`} style={{ top: 'auto', bottom: '8px' }}>{desc.length}/500</span>
                        </div>
                      ))}
                    </div>

                    {/* Headlines */}
                    <div className="content-editor-section">
                      <div className="content-editor-section-header">
                        <span className="content-badge content-badge--h">H</span>
                        <label>
                          Títulos ({ad.headlines.filter(h => h.trim()).length}/5)
                        </label>
                      </div>
                      {ad.headlines.map((headline, hi) => (
                        <div key={`ad${adIndex}-h${hi}`} className="content-input-wrapper">
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
                            className={`content-input ${headline.trim() ? 'filled' : ''}`}
                          />
                          <span className={`char-count ${headline.length > 50 ? 'error' : ''}`} style={{ top: '50%', transform: 'translateY(-50%)' }}>{headline.length}/55</span>
                        </div>
                      ))}
                    </div>

                    {/* Link Descriptions */}
                    <div className="content-editor-section">
                      <div className="content-editor-section-header">
                        <span className="content-badge content-badge--d" style={{ opacity: 0.7 }}>LD</span>
                        <label>
                          Descripciones ({ad.linkDescriptions?.filter(d => d.trim()).length || 0}/5) <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>· texto corto bajo el título</span>
                        </label>
                      </div>
                      {(ad.linkDescriptions || ['', '', '', '', '']).map((desc, di) => (
                        <div key={`ad${adIndex}-ld${di}`} className="content-input-wrapper">
                          <input
                            type="text"
                            placeholder={`Descripción ${di + 1} (máx 30 chars)`}
                            value={desc}
                            onChange={(e) => {
                              const newLD = [...(ad.linkDescriptions || ['', '', '', '', ''])];
                              newLD[di] = e.target.value;
                              updateAd(adIndex, { linkDescriptions: newLD });
                            }}
                            maxLength={30}
                            className={`content-input ${desc.trim() ? 'filled' : ''}`}
                          />
                          <span className={`char-count ${desc.length > 27 ? 'error' : ''}`} style={{ top: '50%', transform: 'translateY(-50%)' }}>{desc.length}/30</span>
                        </div>
                      ))}
                    </div>

                    {/* CTAs */}
                    <div>
                      <div className="content-editor-section-header">
                        <span className="content-badge content-badge--cta">CTA</span>
                        <label>
                          Llamados a la Acción ({[...new Set(ad.ctas)].length} únicos)
                        </label>
                      </div>
                      <div className="cta-grid">
                        {ad.ctas.map((cta, ci) => (
                          <select
                            key={`ad${adIndex}-c${ci}`}
                            value={cta}
                            onChange={(e) => {
                              const newCtas = [...ad.ctas];
                              newCtas[ci] = e.target.value;
                              updateAd(adIndex, { ctas: newCtas });
                            }}
                            className="cta-select"
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
          >
            + Agregar Otro Anuncio
          </button>
          </>
          )}
        </div>


        </div>{/* fin section-card Anuncios */}

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="submit-button" disabled={uploading || loadingAudiences || ads.some(ad => ad.analyzingMedia)}>
          {uploading ? 'Procesando...' : ads.some(ad => ad.analyzingMedia) ? `Analizando con IA (${ads.filter(ad => ad.analyzingMedia).length} pendiente${ads.filter(ad => ad.analyzingMedia).length > 1 ? 's' : ''})...` : 'Continuar a Crear Campaña'}
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

  // Auto-start creation on mount
  useEffect(() => {
    handleCreateDraft();
  }, []);

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
      if (job.startDate) {
        addLog(`Fecha inicio: ${job.startDate}`);
      }
      if (job.endDate) {
        addLog(`Fecha fin: ${job.endDate}`);
      }
      const budgetLevelLabel = (job.budgetLevel || 'campaign') === 'adset' ? 'por Ad Set' : 'CBO';
      addLog(`Presupuesto: $${formatCOP(job.dailyBudgetCOP)} COP/día (${budgetLevelLabel})`);
      if (job.bidStrategy && job.bidStrategy !== 'LOWEST_COST_WITHOUT_CAP') {
        addLog(`Puja: ${job.bidStrategy}${job.bidAmount ? ' - $' + formatCOP(job.bidAmount) + ' COP' : ''}`);
      }
      if (job.specialAdCategories?.length > 0) {
        addLog(`Categorías especiales: ${job.specialAdCategories.join(', ')}`);
      }
      if (job.advantageAudience !== undefined) {
        addLog(`Advantage+ Público: ${job.advantageAudience ? 'Activado' : 'Desactivado'}`);
      }

      // Nota: targeting_optimization fue eliminado por Meta (Feb 2026)
      // Advantage+ Audience se aplica automáticamente a los conjuntos de anuncios

      let result;

      // Debug: mostrar exactamente qué conversionLocation y CTAs se están usando
      console.log('ROUTING DEBUG:', {
        conversionLocation,
        whatsappNumber: job.whatsappNumber,
        whatsappNumberId: job.whatsappNumberId,
        adSetMode: job.adSetMode,
        adCTAs: job.ads?.map(a => a.ctas?.[0]),
        templateId: job.templateId,
        selectedDestination: job.conversionLocation
      });

      // Seleccionar método de creación según el tipo de campaña
      if (conversionLocation === 'WHATSAPP' && job.whatsappNumber) {
        const totalAds = job.ads?.length || 1;
        addLog(`WhatsApp: ${job.whatsappNumber}`);
        if (job.whatsappNumberId) {
          addLog(`WhatsApp Business ID: ${job.whatsappNumberId}`);
        } else {
          addLog(`⚠️ Número de WhatsApp ingresado manualmente (no detectado en la cuenta). Si no está vinculado a la página en Meta Business, la optimización puede cambiar a "clicks al enlace" en vez de "conversaciones".`);
        }
        addLog(`Creando campaña para WhatsApp (${totalAds} anuncio(s), presupuesto ${budgetLevelLabel})...`);

        result = await metaService.createCampaignForWhatsApp(job.adAccountId, {
          campaignName: job.campaignName,
          dailyBudget: Math.round(job.dailyBudgetCOP),
          budgetLevel: job.budgetLevel || 'campaign',
          targeting,
          pageId: job.pageId,
          igActorId: job.igActorId || null,
          whatsappNumber: job.whatsappNumber,
          linkUrl: job.linkUrl || null,
          adSetMode: job.adSetMode || 'dynamic',
          ads: job.ads || [],
          // Legacy fields (fallback si ads está vacío)
          imageUrl: job.imageUrl,
          imageHash: job.imageHash || null,
          videoId: job.videoId || null,
          videoThumbnailUrl: job.videoThumbnailUrl || null,
          headlines: job.headlines || [],
          descriptions: job.descriptions || [],
          primaryTexts: job.primaryTexts || job.descriptions || [],
          callToAction: job.ctas?.[0] || 'WHATSAPP_MESSAGE',
          objective,
          optimizationGoal,
          // Nuevos campos
          specialAdCategories: job.specialAdCategories || [],
          bidStrategy: job.bidStrategy || 'LOWEST_COST_WITHOUT_CAP',
          bidAmount: job.bidAmount || null,
          startTime: job.startDate || null,
          endTime: job.endDate || null,
          pageWelcomeMessage: null,
          multiAudiences: job.multiAudiences || [],
          flexibleAdGroups: job.flexibleAdGroups || []
        });

      } else if (conversionLocation === 'MESSENGER' || conversionLocation === 'INSTAGRAM_DIRECT') {
        const isIgDM = conversionLocation === 'INSTAGRAM_DIRECT';
        const destLabel = isIgDM ? 'Instagram Direct' : 'Messenger';
        const defaultCta = isIgDM ? 'INSTAGRAM_MESSAGE' : 'MESSAGE_PAGE';
        const adsArray = job.ads?.length > 0 ? job.ads : [job];
        const totalAds = adsArray.length;
        const mode = job.adSetMode || 'dynamic';
        // OUTCOME_ENGAGEMENT + IG DM + DC no es soportado por Meta
        // Error: "INSTAGRAM_MESSAGE no es compatible con OUTCOME_ENGAGEMENT en conjunto de anuncios con contenido dinámico"
        const dcBlockedObjectives = ['OUTCOME_ENGAGEMENT', 'OUTCOME_SALES'];
        const dcBlocked = isIgDM && dcBlockedObjectives.includes(objective);
        // Flexible mode bypasses DC restrictions (no isDynamicCreative needed)
        const effectiveMode = mode === 'flexible' ? 'flexible' : (dcBlocked ? 'single' : mode);
        const useDynamic = (mode === 'dynamic' || mode === 'per-ad') && !dcBlocked;

        if (dcBlocked && mode !== 'single' && mode !== 'flexible') {
          addLog(`${destLabel} + ${objective}: DC no soportado. Usando standard creatives.`);
        }

        const modeLabel = effectiveMode === 'single' ? `1 Ad Set → ${totalAds} Ads (standard creatives)`
          : effectiveMode === 'flexible' ? `1 Ad Set → 1 Flexible Ad (${totalAds} contenidos combinados)`
          : effectiveMode === 'dynamic' ? `${totalAds} Ad Set(s) con 5+5+5 (mismo público)`
          : `${totalAds} Ad Set(s) con 5+5+5 (público diferente)`;

        addLog(`Creando campaña para ${destLabel} (${modeLabel})...`);

        // 1. Crear Campaña
        const campaignResult = await metaService.createCampaign(job.adAccountId, {
          name: job.campaignName,
          objective,
          status: 'PAUSED',
          dailyBudget: Math.round(job.dailyBudgetCOP)
        });

        if (!campaignResult.success) {
          result = { success: false, errors: [`Campaign: ${campaignResult.error}`] };
        } else {
          addLog(`Campaña creada: ${campaignResult.data.id}`);
          const createdAds = [];
          const createdAdSets = [];
          const errors = [];

          // Construir array de públicos a procesar (principal + adicionales)
          const multiAuds = job.multiAudiences || [];
          const primaryAud = {
            name: job.savedAudienceName || 'Principal',
            targeting: targeting
          };
          const audiencesToProcess = mode === 'per-ad'
            ? [primaryAud] // per-ad ya maneja públicos por ad
            : (multiAuds.length > 0
              ? [primaryAud, ...multiAuds.map(a => ({
                  name: a.name,
                  targeting: {
                    ...(a.targeting || { geo_locations: { countries: ['CO'] } }),
                    age_min: job.ageMin || 18,
                    age_max: job.ageMax || 65,
                    ...(job.gender && job.gender !== 'all' ? { genders: job.gender === 'male' ? [1] : [2] } : {})
                  }
                }))]
              : [primaryAud]);

          if (audiencesToProcess.length > 1) {
            addLog(`Múltiples públicos: ${audiencesToProcess.length} (se replicarán los ads para cada público)`);
          }

          for (let audIdx = 0; audIdx < audiencesToProcess.length; audIdx++) {
            const currentAudience = audiencesToProcess[audIdx];
            const audPrefix = audiencesToProcess.length > 1 ? ` [${currentAudience.name}]` : '';
            if (audiencesToProcess.length > 1) {
              addLog(`--- Público ${audIdx + 1}/${audiencesToProcess.length}: ${currentAudience.name} ---`);
            }

          if (effectiveMode === 'single') {
            // ========== MODO SINGLE (o DC bloqueado): 1 AdSet por público → N standard creatives (1-1-1) ==========
            const adSetMethod = isIgDM ? 'createAdSetForInstagramDM' : 'createAdSetForMessenger';
            const adSetResult = await metaService[adSetMethod](job.adAccountId, {
              name: `${currentAudience?.name || 'Principal'} · ${job.campaignName}`,
              campaignId: campaignResult.data.id,
              targeting: currentAudience.targeting,
              optimizationGoal,
              promotedObject: { page_id: job.pageId }
            });

            if (!adSetResult.success) {
              errors.push(`AdSet${audPrefix}: ${adSetResult.error}`);
            } else {
              addLog(`Ad Set creado${audPrefix}: ${adSetResult.data.id}`);
              createdAdSets.push(adSetResult.data);

              for (let i = 0; i < totalAds; i++) {
                const ad = adsArray[i];
                const adLabel = totalAds > 1 ? ` ${i + 1}` : '';
                const adVideoId = ad.videoId || null;
                const adImageUrl = ad.imageUrl || null;
                const adImageHash = ad.imageHash || null;
                const adThumbnailUrl = ad.videoThumbnailUrl || null;
                const adHeadlines = (ad.headlines || []).filter(h => h?.trim());
                const adDescriptions = (ad.descriptions || []).filter(d => d?.trim());
                const adCta = ad.ctas?.[0] || defaultCta;

                addLog(`Creando standard creative + ad${adLabel}${audPrefix} (${adVideoId ? 'video' : 'imagen'})...`);

                const creativeMethod = isIgDM ? 'createCreativeForInstagramDM' : 'createCreativeForMessenger';
                const creativeParams = {
                  name: `${ad.adName || job.campaignName + ' - Ad' + adLabel}${audPrefix} - Creative`,
                  pageId: job.pageId,
                  imageHash: adImageHash,
                  imageUrl: adImageUrl,
                  videoId: adVideoId,
                  videoThumbnailUrl: adThumbnailUrl,
                  primaryText: adDescriptions[0] || 'Envíanos un mensaje',
                  headline: adHeadlines[0] || 'Contáctanos',
                  description: adDescriptions[1] || adHeadlines[1] || '',
                  callToAction: adCta
                };
                if (isIgDM) creativeParams.igActorId = job.igActorId;

                const creativeResult = await metaService[creativeMethod](job.adAccountId, creativeParams);

                if (!creativeResult.success) {
                  errors.push(`Creative${adLabel}${audPrefix}: ${creativeResult.error}`);
                  addLog(`Error creative${adLabel}${audPrefix}: ${creativeResult.error}`);
                  continue;
                }

                const adResult = await metaService.createAd(job.adAccountId, {
                  name: `${ad.adName || job.campaignName + ' - Ad' + adLabel}${audPrefix}`,
                  adsetId: adSetResult.data.id,
                  creativeId: creativeResult.data.id,
                  status: 'ACTIVE'
                });

                if (!adResult.success) {
                  errors.push(`Ad${adLabel}${audPrefix}: ${adResult.error}`);
                  addLog(`Error ad${adLabel}${audPrefix}: ${adResult.error}`);
                } else {
                  createdAds.push(adResult.data);
                  addLog(`Ad${adLabel}${audPrefix} creado: ${adResult.data.id}`);
                }
              }
            }
          } else if (effectiveMode === 'flexible') {
            // ========== MODO FLEXIBLE: 1 AdSet por público → 1 Flexible Ad con TODO el contenido ==========
            const adSetMethod = isIgDM ? 'createAdSetForInstagramDM' : 'createAdSetForMessenger';
            const adSetResult = await metaService[adSetMethod](job.adAccountId, {
              name: `${currentAudience?.name || 'Principal'} · ${job.campaignName}`,
              campaignId: campaignResult.data.id,
              targeting: currentAudience.targeting,
              optimizationGoal,
              promotedObject: { page_id: job.pageId },
              isDynamicCreative: false
            });

            if (!adSetResult.success) {
              errors.push(`AdSet${audPrefix}: ${adSetResult.error}`);
            } else {
              addLog(`Ad Set creado${audPrefix}: ${adSetResult.data.id}`);
              createdAdSets.push(adSetResult.data);

              // N flexible ads per AdSet (one per flexibleAdGroups entry)
              const flexGroups = job.flexibleAdGroups?.length > 0 ? job.flexibleAdGroups : null;
              const groupsToCreate = flexGroups || [{
                mediaItems: adsArray.map(ad => ad.videoId
                  ? { type: 'video', hash: ad.imageHash || '', url: ad.videoThumbnailUrl || '', videoId: ad.videoId, thumbnailUrl: ad.videoThumbnailUrl || '' }
                  : { type: 'image', hash: ad.imageHash || '', url: ad.imageUrl || '' }),
                headlines: [...new Set(adsArray.flatMap(a => (a.headlines || [])).filter(Boolean))].slice(0, 5),
                descriptions: [...new Set(adsArray.flatMap(a => (a.descriptions || [])).filter(Boolean))].slice(0, 5),
                linkDescriptions: [],
                ctas: adsArray[0]?.ctas || [defaultCta]
              }];
              const flexLink = isIgDM ? `https://ig.me/m/${job.igActorId}` : `https://m.me/${job.pageId}`;
              addLog(`Creando ${groupsToCreate.length} flexible ad(s)${audPrefix}...`);

              for (let gi = 0; gi < groupsToCreate.length; gi++) {
                const flexGroup = groupsToCreate[gi];
                const groupLabel = groupsToCreate.length > 1 ? ` (Ad ${gi + 1})` : '';
                const images = flexGroup.mediaItems.filter(m => m.type === 'image' && m.hash).map(m => ({ hash: m.hash }));
                const videos = flexGroup.mediaItems.filter(m => m.type === 'video' && m.videoId).map(m => {
                  const v = { video_id: m.videoId };
                  if (m.hash) v.image_hash = m.hash;
                  else if (m.thumbnailUrl) v.image_url = m.thumbnailUrl;
                  return v;
                });
                const texts = [];
                (flexGroup.headlines || []).filter(Boolean).slice(0, 5).forEach(h => texts.push({ text: h, text_type: 'headline' }));
                (flexGroup.descriptions || []).filter(Boolean).slice(0, 5).forEach(d => texts.push({ text: d, text_type: 'primary_text' }));
                (flexGroup.linkDescriptions || []).filter(Boolean).slice(0, 5).forEach(d => texts.push({ text: d, text_type: 'description' }));
                if (texts.filter(t => t.text_type === 'headline').length === 0) texts.push({ text: 'Conoce más', text_type: 'headline' });
                if (texts.filter(t => t.text_type === 'primary_text').length === 0) texts.push({ text: 'Descubre más', text_type: 'primary_text' });
                const adCta = flexGroup.ctas?.[0] || defaultCta;

                const flexResult = await metaService.createFlexibleAd(job.adAccountId, {
                  name: `${job.campaignName} - Flexible Ad${audPrefix}${groupLabel}`,
                  adsetId: adSetResult.data.id,
                  pageId: job.pageId,
                  igActorId: isIgDM ? job.igActorId : null,
                  images,
                  videos,
                  texts,
                  callToAction: { type: adCta, value: { link: flexLink } },
                  linkUrl: flexLink,
                  status: 'ACTIVE'
                });

                if (!flexResult.success) {
                  errors.push(`Flexible Ad${audPrefix}${groupLabel}: ${flexResult.error}`);
                  addLog(`Error flexible ad${audPrefix}${groupLabel}: ${flexResult.error}`);
                } else {
                  createdAds.push(flexResult.data);
                  addLog(`Flexible Ad${audPrefix}${groupLabel} creado: ${flexResult.data.id}`);
                }
              }
            }
          } else {
            // ========== MODO DYNAMIC/PER-AD: N AdSets con Dynamic Creative 5+5+5 ==========
            for (let i = 0; i < totalAds; i++) {
              const ad = adsArray[i];
              const adLabel = totalAds > 1 ? ` ${i + 1}` : '';
              const adTargeting = (mode === 'per-ad' && ad.audienceTargeting) ? ad.audienceTargeting : currentAudience.targeting;
              const audienceLabel = (mode === 'per-ad' && ad.audienceName) ? ` (${ad.audienceName})` : audPrefix;

              addLog(`Creando Ad Set${adLabel}${audienceLabel} + dynamic creative 5+5+5...`);

              // Crear AdSet con isDynamicCreative: true
              const adSetMethod = isIgDM ? 'createAdSetForInstagramDM' : 'createAdSetForMessenger';
              const adSetResult = await metaService[adSetMethod](job.adAccountId, {
                name: `${currentAudience?.name || 'Principal'} · ${job.campaignName}`,
                campaignId: campaignResult.data.id,
                targeting: adTargeting,
                optimizationGoal,
                promotedObject: { page_id: job.pageId },
                isDynamicCreative: true
              });

              if (!adSetResult.success) {
                errors.push(`AdSet${adLabel}${audienceLabel}: ${adSetResult.error}`);
                addLog(`Error AdSet${adLabel}${audienceLabel}: ${adSetResult.error}`);
                continue;
              }
              createdAdSets.push(adSetResult.data);
              addLog(`Ad Set${adLabel}${audienceLabel} creado (DC): ${adSetResult.data.id}`);

              // Preparar datos del ad
              const adVideoId = ad.videoId || null;
              const adImageUrl = ad.imageUrl || null;
              const adImageHash = ad.imageHash || null;
              const adThumbnailUrl = ad.videoThumbnailUrl || null;
              const adHeadlines = (ad.headlines || []).filter(h => h?.trim());
              const adDescriptions = (ad.descriptions || []).filter(d => d?.trim());
              const AWARENESS_VALID_CTAS = ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'SUBSCRIBE', 'CONTACT_US', 'WATCH_MORE', 'MESSAGE_PAGE', 'WHATSAPP_MESSAGE', 'INSTAGRAM_MESSAGE'];
              // VISIT_INSTAGRAM_PROFILE NO es válido en asset_feed_spec (DC) — reemplazar con LEARN_MORE
              let validCTAs = [...new Set((ad.ctas || [defaultCta]).filter(c => c))].map(c => c === 'VISIT_INSTAGRAM_PROFILE' ? 'LEARN_MORE' : c);
              if (objective === 'OUTCOME_AWARENESS') {
                validCTAs = validCTAs.filter(c => AWARENESS_VALID_CTAS.includes(c));
                if (validCTAs.length === 0) validCTAs = [defaultCta];
              }

              addLog(`Creando dynamic creative 5+5+5 + ad${adLabel}${audienceLabel} (${adVideoId ? 'video' : 'imagen'})...`);

              // IG DM con DC SIEMPRE requiere link_urls (error 1885869 sin ellas)
              const igDmLink = isIgDM ? `https://ig.me/m/${job.igActorId}` : null;
              const messengerLink = (!isIgDM && objective === 'OUTCOME_SALES') ? `https://m.me/${job.pageId}` : null;
              const dcLinkUrl = igDmLink || messengerLink || null;
              const dcIsWhatsApp = !isIgDM && !messengerLink;

              let creativeResult = await metaService.createAdCreativeWithAssetFeedSpec(job.adAccountId, {
                name: `${ad.adName || job.campaignName + ' - Ad' + adLabel}${audienceLabel} - Creative`,
                pageId: job.pageId,
                imageHash: adImageHash,
                imageUrl: adImageUrl,
                videoId: adVideoId,
                thumbnailUrl: adThumbnailUrl,
                titles: adHeadlines.length > 0 ? adHeadlines : ['Contáctanos'],
                bodies: adDescriptions.length > 0 ? adDescriptions : ['Envíanos un mensaje'],
                descriptions: adDescriptions.length > 0 ? adDescriptions : ['Envíanos un mensaje'],
                callToActionTypes: validCTAs,
                linkUrl: dcLinkUrl,
                igActorId: isIgDM ? job.igActorId : null,
                isWhatsApp: dcIsWhatsApp,
                isInstagramDM: isIgDM
              });

              if (!creativeResult.success && (creativeResult.error?.includes('instagram_user_id') || creativeResult.error?.includes('instagram_actor_id') || creativeResult.error?.includes('Instagram account'))) {
                addLog(`Creative${adLabel}: igActorId rejected, reintentando sin IG...`);
                creativeResult = await metaService.createAdCreativeWithAssetFeedSpec(job.adAccountId, {
                  name: `${ad.adName || job.campaignName + ' - Ad' + adLabel}${audienceLabel} - Creative`,
                  pageId: job.pageId,
                  imageHash: adImageHash,
                  imageUrl: adImageUrl,
                  videoId: adVideoId,
                  thumbnailUrl: adThumbnailUrl,
                  titles: adHeadlines.length > 0 ? adHeadlines : ['Contáctanos'],
                  bodies: adDescriptions.length > 0 ? adDescriptions : ['Envíanos un mensaje'],
                  descriptions: adDescriptions.length > 0 ? adDescriptions : ['Envíanos un mensaje'],
                  callToActionTypes: validCTAs,
                  linkUrl: dcLinkUrl,
                  igActorId: null,
                  isWhatsApp: dcIsWhatsApp,
                  isInstagramDM: isIgDM
                });
              }

              if (!creativeResult.success) {
                errors.push(`Creative${adLabel}${audienceLabel}: ${creativeResult.error}`);
                addLog(`Error creative${adLabel}${audienceLabel}: ${creativeResult.error}`);
                continue;
              }

              const adResult = await metaService.createAd(job.adAccountId, {
                name: `${ad.adName || job.campaignName + ' - Ad' + adLabel}${audienceLabel}`,
                adsetId: adSetResult.data.id,
                creativeId: creativeResult.data.id,
                status: 'ACTIVE'
              });

              if (!adResult.success) {
                errors.push(`Ad${adLabel}${audienceLabel}: ${adResult.error}`);
                addLog(`Error ad${adLabel}${audienceLabel}: ${adResult.error}`);
              } else {
                createdAds.push(adResult.data);
                addLog(`Ad${adLabel}${audienceLabel} creado: ${adResult.data.id}`);
              }
            }
          }

          } // fin loop audiencesToProcess

          const totalExpected = audiencesToProcess.length > 1
            ? (mode === 'single' ? totalAds * audiencesToProcess.length : totalAds * audiencesToProcess.length)
            : totalAds;
          result = {
            success: createdAds.length > 0,
            campaign: campaignResult.data,
            adSets: createdAdSets,
            adSet: createdAdSets[0] || null,
            ads: createdAds,
            errors
          };
          addLog(`${destLabel}: ${createdAds.length}/${totalExpected} ads creados exitosamente`);
        }

      } else {
        // Campaña estándar (website, traffic, etc.) - MULTI-AD
        const totalAds = job.ads?.length || 1;
        addLog(`URL destino: ${job.linkUrl || 'N/A'}`);
        const mode = job.adSetMode || 'dynamic';
        const modeLabel = mode === 'single' ? `1 Ad Set → ${totalAds} Ads (sin 5+5+5)`
          : mode === 'flexible' ? `1 Ad Set → 1 Flexible Ad (${totalAds} contenidos combinados)`
          : mode === 'dynamic' ? `${totalAds} Ad Sets con 5+5+5 (mismo público, CBO)`
          : `${totalAds} Ad Sets con 5+5+5 (público diferente)`;
        addLog(`Modo: ${modeLabel}`);
        addLog(`Total anuncios: ${totalAds}`);
        if (job.igActorId) addLog(`Instagram: @${job.igUsername || 'vinculada'}`);

        // Log each ad's content
        (job.ads || []).forEach((ad, i) => {
          const numTitles = ad.headlines?.filter(h => h?.trim()).length || 0;
          const numDescs = ad.descriptions?.filter(d => d?.trim()).length || 0;
          const hasMedia = ad.videoId || ad.imageUrl || ad.imageHash;
          addLog(`  Ad ${i + 1}: ${numTitles}t + ${numDescs}d | Media: ${hasMedia ? 'Sí' : 'No'}${ad.audienceName ? ' | Público: ' + ad.audienceName : ''}`);
        });

        const numAdSets = mode === 'single' ? 1 : totalAds;
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
          conversionLocation,
          pixelId: job.pixelId || null,
          whatsappNumber: job.whatsappNumber || null,
          budgetLevel: job.budgetLevel || 'campaign',
          adSetMode: job.adSetMode || 'single',
          multiAudiences: job.multiAudiences || [],
          flexibleAdGroups: job.flexibleAdGroups || [],
          ads: job.ads || [{
            adName: job.adName,
            imageUrl: job.imageUrl,
            imageHash: job.imageHash,
            videoId: job.videoId,
            videoThumbnailUrl: job.videoThumbnailUrl,
            headlines: job.headlines || [],
            descriptions: job.descriptions || [],
            ctas: job.ctas || [conversionLocation === 'INSTAGRAM_PROFILE' ? 'VISIT_INSTAGRAM_PROFILE'
              : conversionLocation === 'WHATSAPP' ? 'WHATSAPP_MESSAGE'
              : conversionLocation === 'INSTAGRAM_DIRECT' ? 'INSTAGRAM_MESSAGE'
              : conversionLocation === 'MESSENGER' ? 'MESSAGE_PAGE'
              : selectedTemplate?.adConfig?.defaultCta || 'LEARN_MORE']
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
          status: 'ACTIVE',
          noImage: job.noImage || !job.imageUrl,
          needsCreative: !hasAds,
          // Nuevos campos
          bidStrategy: job.bidStrategy || 'LOWEST_COST_WITHOUT_CAP',
          startDate: job.startDate || null,
          endDate: job.endDate || null,
          specialAdCategories: job.specialAdCategories || [],
          advantageAudience: job.advantageAudience
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
    const destLabels = { WHATSAPP: 'WhatsApp', MESSENGER: 'Messenger', INSTAGRAM_DIRECT: 'Instagram DM', WEBSITE: 'Web', INSTAGRAM_PROFILE: 'Instagram' };

    return (
      <div className="draft-step">
        <div className="success-section" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>
            {adWasCreated ? String.fromCodePoint(0x1F389) : String.fromCodePoint(0x1F4CB)}
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px' }}>
            {adWasCreated ? 'Campaña Creada Exitosamente' : 'Campaña y Ad Set Creados'}
          </h2>
          <p className="text-muted" style={{ fontSize: '14px', margin: '0 0 24px' }}>
            {adWasCreated
              ? `${draftData.totalAdSets || 1} conjunto(s) + ${draftData.totalAdsCreated} anuncio(s) en estado pausado`
              : 'Tu campaña ha sido creada en estado pausado'}
          </p>

          {/* Resumen compacto en grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', textAlign: 'left', marginBottom: '20px' }}>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '14px', borderLeft: '3px solid var(--accent-color)' }}>
              <p className="text-muted" style={{ fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Campaña</p>
              <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{draftData.campaignName}</p>
              <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>
                {destLabels[draftData.conversionLocation] || draftData.conversionLocation} · ${formatCOP(draftData.dailyBudgetCOP)}/dia
              </p>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '14px', borderLeft: '3px solid #4ecdc4' }}>
              <p className="text-muted" style={{ fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conjuntos ({draftData.totalAdSets || 1})</p>
              <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{draftData.savedAudienceName || 'Advantage+'}</p>
              <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>
                {draftData.pageName}{draftData.igUsername ? ` · @${draftData.igUsername}` : ''}
              </p>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '14px', borderLeft: `3px solid ${adWasCreated ? '#45b7d1' : '#f0ad4e'}` }}>
              <p className="text-muted" style={{ fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Anuncios ({draftData.totalAdsCreated})</p>
              {draftData.ads?.length > 0 ? (
                <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  {draftData.ads.map((ad, i) => `#${i + 1}`).join(', ')}
                </p>
              ) : (
                <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Pendiente</p>
              )}
              <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>
                {draftData.whatsappNumber ? `WA: ${draftData.whatsappNumber}` : draftData.linkUrl?.substring(0, 35) || ''}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
            <a
              href="https://business.facebook.com/adsmanager"
              target="_blank"
              rel="noopener noreferrer"
              className="toggle-btn active"
              style={{ padding: '12px 24px', fontSize: '14px', textDecoration: 'none', display: 'inline-block' }}
            >
              Abrir en Ads Manager
            </a>
            <button className="done-button" onClick={onComplete} style={{ padding: '12px 24px', fontSize: '14px' }}>
              Crear Otra Campaña
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="draft-step">
      <h2>Creando Campaña...</h2>

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

      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <span className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }}></span>
        <p className="text-muted" style={{ marginTop: '16px' }}>Enviando a Meta Ads...</p>
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

      {error && (
        <>
          <div className="error-message">⚠️ {error}</div>
          <button className="create-button" onClick={handleCreateDraft} style={{ marginTop: '16px' }}>
            Reintentar
          </button>
        </>
      )}

      {/* HIDDEN — kept for structure but replaced above */}
      <div style={{ display: 'none' }}>
        <h3>Configuración de Campaña</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <label>Nombre Campaña</label>
            <p>{job.campaignName}</p>
          </div>
          <div className="summary-item">
            <label>Anuncios</label>
            <p>{(() => {
              const totalAds = job.totalAds || 1;
              const numAudiences = (job.multiAudiences?.length || 0) + 1;
              const hasMulti = numAudiences > 1 && job.adSetMode !== 'per-ad';
              if (job.adSetMode === 'flexible') {
                return hasMulti
                  ? `${numAudiences} Ad Sets · 1 anuncio flexible con ${totalAds} contenido${totalAds > 1 ? 's' : ''} c/u`
                  : `1 Ad Set · 1 anuncio flexible con ${totalAds} contenido${totalAds > 1 ? 's' : ''}`;
              } else if (job.adSetMode === 'single') {
                return hasMulti
                  ? `${totalAds} ad(s) x ${numAudiences} públicos = ${numAudiences} Ad Sets`
                  : `${totalAds} anuncio(s) | 1 Ad Set`;
              } else if (job.adSetMode === 'dynamic') {
                return hasMulti
                  ? `${totalAds} ad(s) x ${numAudiences} públicos = ${totalAds * numAudiences} Ad Sets con 5+5+5`
                  : `${totalAds} Ad Sets con 5+5+5`;
              } else {
                return `${totalAds} Ad Sets (público diferente)`;
              }
            })()}</p>
          </div>
          <div className="summary-item">
            <label>Presupuesto Diario ({(job.budgetLevel || 'campaign') === 'adset' ? 'por Ad Set' : 'CBO'})</label>
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
            <label>Público{job.multiAudiences?.length > 0 ? `s (${job.multiAudiences.length + 1})` : ''}</label>
            <p>{job.savedAudienceName || 'Colombia 18-65'}
            {job.multiAudiences?.length > 0 && job.multiAudiences.map((a, i) => (
              <span key={i} className="text-accent" style={{ display: 'block', fontSize: '12px' }}>+ {a.name}</span>
            ))}</p>
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
            <div className="summary-item summary-item--full">
              <label>URL de Destino</label>
              <p style={{ wordBreak: 'break-all' }}>{job.linkUrl}</p>
            </div>
          )}
          {/* WhatsApp - solo si aplica */}
          {job.whatsappNumber && (
            <div className="summary-item summary-item--full">
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
            <div className="summary-item summary-item--full">
              <label>Número de Teléfono</label>
              <p>{job.phoneNumber}</p>
            </div>
          )}
          <div className="summary-item summary-item--full">
            <label>{job.adSetMode === 'flexible' ? 'Anuncios Flexibles' : 'Media por Anuncio'}</label>
            {job.adSetMode === 'flexible' ? (
              (job.flexibleAdGroups || []).map((g, i) => (
                <p key={i} style={{ fontSize: '13px', margin: '2px 0' }}>
                  Anuncio {i + 1}: {g.mediaItems?.length || 0} medio(s) — {g.mediaItems?.filter(m => m.type === 'image').length || 0} img · {g.mediaItems?.filter(m => m.type === 'video').length || 0} vid
                </p>
              ))
            ) : (
              job.ads?.map((ad, i) => (
                <p key={i} style={{ fontSize: '13px', margin: '2px 0' }}>
                  {ad.adName || `Ad ${i + 1}`}: {ad.videoId ? 'Video' : ad.imageUrl || ad.imageHash ? 'Imagen' : 'Sin media'}
                </p>
              )) || <p>Sin media</p>
            )}
          </div>
        </div>

        {/* Creative Copy Summary */}
        {job.adSetMode === 'flexible' ? (
          (job.flexibleAdGroups?.length > 0) && (
            <div className="creative-summary">
              <h4>Anuncios Flexibles ({job.flexibleAdGroups.length})</h4>
              {job.flexibleAdGroups.map((g, i) => (
                <div key={i} className="draft-variation-card" style={{ borderLeftColor: 'var(--accent)' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
                    Anuncio Flexible {i + 1} — {g.mediaItems?.length || 0} medio(s)
                  </p>
                  <p className="text-muted" style={{ fontSize: '12px' }}>
                    {g.headlines?.length || 0} títulos + {g.descriptions?.length || 0} textos + {[...new Set(g.ctas || [])].length} CTAs
                  </p>
                </div>
              ))}
            </div>
          )
        ) : (
          job.ads?.length > 0 && (
            <div className="creative-summary">
              <h4>Contenido de los Anuncios ({job.ads.length})</h4>
              {job.ads.map((ad, i) => (
                <div key={i} className="draft-variation-card" style={{ borderLeftColor: 'var(--accent)' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
                    {ad.adName || `Ad ${i + 1}`}
                    {ad.videoId ? ' (Video)' : ad.imageUrl || ad.imageHash ? ' (Imagen)' : ' (Sin media)'}
                    {job.adSetMode === 'per-ad' && ad.audienceName ? ` - ${ad.audienceName}` : ''}
                  </p>
                  <p className="text-muted" style={{ fontSize: '12px' }}>
                    {ad.headlines?.length || 0} títulos + {ad.descriptions?.length || 0} descripciones + {[...new Set(ad.ctas || [])].length} CTAs
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div className="info-box">
        <span className="info-icon">i</span>
        <div>
          <p><strong>Se creará en Meta Ads:</strong></p>
          <ul>
            <li><strong>1 Campaña</strong> - Objetivo: {job.objective || 'Tráfico'} (PAUSADA)</li>
            <li><strong>{(() => {
              const numAds = job.ads?.length || 1;
              const numAuds = (job.multiAudiences?.length || 0) + 1;
              if (job.adSetMode === 'flexible') {
                return numAuds > 1 ? `${numAuds} Ad Sets` : '1 Ad Set';
              } else if (job.adSetMode === 'single') {
                return numAuds > 1 ? `${numAuds} Ad Sets` : '1 Ad Set';
              } else {
                return numAuds > 1 ? `${numAds * numAuds} Ad Sets` : `${numAds} Ad Sets`;
              }
            })()}</strong> - {job.adSetMode === 'flexible' ? 'Flexible (todos los assets en 1 Ad)' : job.adSetMode === 'single' ? 'Standard' : 'Dynamic Creative 5+5+5'} - {job.optimizationGoal || 'Landing Page Views'}
            {(job.multiAudiences?.length || 0) > 0 && <span className="text-accent"> ({(job.multiAudiences.length || 0) + 1} públicos)</span>}
            </li>
            {job.adSetMode === 'flexible' ? (
              <li><strong>1 Creative Flexible</strong> - {job.ads?.length || 1} asset(s) · 5+5+5 Copys</li>
            ) : (
              <li><strong>{job.ads?.length || 1} Creative(s)</strong>{job.adSetMode !== 'single' ? ' - Cada uno con 5+5+5' : ''}</li>
            )}
            <li><strong>{(() => {
              const numAds = job.ads?.length || 1;
              const numAuds = (job.multiAudiences?.length || 0) + 1;
              if (job.adSetMode === 'flexible') {
                return numAuds > 1 ? `${numAuds} Anuncio(s)` : '1 Anuncio';
              } else if (job.adSetMode === 'single') {
                return numAuds > 1 ? `${numAds * numAuds} Anuncio(s)` : `${numAds} Anuncio(s)`;
              } else {
                return numAuds > 1 ? `${numAds * numAuds} Anuncio(s)` : `${numAds} Anuncio(s)`;
              }
            })()}</strong>{job.adSetMode === 'flexible' ? ' flexible con todos los contenidos' : ''}</li>
          </ul>
          {job.adSetMode === 'flexible' ? (
            <div className="text-muted mt-sm" style={{ fontSize: '13px' }}>
              {(job.flexibleAdGroups || []).map((g, gi) => {
                const imgs = (g.mediaItems || []).filter(m => m.type === 'image').length;
                const vids = (g.mediaItems || []).filter(m => m.type === 'video').length;
                const txts = (g.headlines || []).length;
                const descs = (g.descriptions || []).length;
                return (
                  <p key={gi} style={{ margin: '3px 0' }}>
                    Anuncio Flexible {gi + 1}: {(g.mediaItems || []).length} medio(s) ({imgs} img · {vids} vid) · {txts}T + {descs}D
                  </p>
                );
              })}
            </div>
          ) : job.ads?.length > 1 && (
            <div className="text-muted mt-sm" style={{ fontSize: '13px' }}>
              {job.ads.map((ad, i) => (
                <p key={i} style={{ margin: '3px 0' }}>
                  Ad {i + 1}: {ad.adName || `Ad ${i + 1}`} | {ad.videoId ? 'Video' : ad.imageUrl || ad.imageHash ? 'Imagen' : 'Sin media'}
                  {job.adSetMode === 'per-ad' && ad.audienceName ? ` | ${ad.audienceName}` : ''}
                </p>
              ))}
            </div>
          )}
          <p className="hint mt-sm">
            Meta probará automáticamente las diferentes combinaciones de títulos, descripciones y CTAs para encontrar la mejor.
          </p>
          {job.igActorId && (
            <p className="hint mt-sm">
              Instagram: @{job.igUsername || 'vinculada'} - Los anuncios aparecerán también en Instagram.
            </p>
          )}
        </div>
      </div>

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
