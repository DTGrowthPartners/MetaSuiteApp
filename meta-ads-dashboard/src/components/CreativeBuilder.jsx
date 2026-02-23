import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MetaAdsService from '../services/metaAdsApi';
import {
  CAMPAIGN_TEMPLATES,
  CTA_OPTIONS,
  SPECIAL_AD_CATEGORIES,
  BID_STRATEGIES,
  PLACEMENT_OPTIONS,
  CHAT_FORM_FIELDS,
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
  const [budgetLevel, setBudgetLevel] = useState('campaign'); // 'campaign' (CBO) o 'adset'
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

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
    ctas: templateContent.ctas || selectedTemplate?.ctas || (templateAdSetConfig?.conversionLocation === 'INSTAGRAM_PROFILE'
      ? ['VISIT_INSTAGRAM_PROFILE', 'VISIT_INSTAGRAM_PROFILE', 'VISIT_INSTAGRAM_PROFILE', 'VISIT_INSTAGRAM_PROFILE', 'VISIT_INSTAGRAM_PROFILE']
      : ['LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE', 'LEARN_MORE']),
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

  // Multi-file upload mode: 'per-ad' = 1 file per ad, 'single' = all files for 1 ad (upload to library)
  const [multiUploadMode, setMultiUploadMode] = useState('per-ad');

  // Library multi-select (always active)
  const [selectedLibraryMedia, setSelectedLibraryMedia] = useState([]); // [{type: 'image'|'video', data: {...}}]
  const [libraryMode, setLibraryMode] = useState('per-ad'); // 'per-ad' = 1 ad por contenido, 'single' = todo para este ad

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
  const handleMultiFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedAccount) return;

    // Reset input so same files can be re-selected
    e.target.value = '';

    if (multiUploadMode === 'per-ad') {
      // MODE: 1 file per ad — create N ads
      setMultiUploadProgress(`Procesando ${files.length} archivo(s)...`);

      // Figure out which files go to existing empty ads and which need new ads
      const fileAdPairs = await new Promise(resolve => {
        setAds(prev => {
          const pairs = [];
          let updatedAds = [...prev];
          const usedIndices = new Set();

          for (let i = 0; i < files.length; i++) {
            const emptyIdx = updatedAds.findIndex((ad, idx) =>
              ad.mediaSource === 'none' && !ad.imageHash && !ad.videoId && !usedIndices.has(idx)
            );

            if (emptyIdx !== -1) {
              pairs.push({ file: files[i], adIndex: emptyIdx });
              usedIndices.add(emptyIdx);
            } else {
              const newAd = createEmptyAd(updatedAds.length);
              updatedAds = [...updatedAds, newAd];
              pairs.push({ file: files[i], adIndex: updatedAds.length - 1 });
            }
          }

          resolve(pairs);
          return updatedAds;
        });
      });

      // Wait for state to flush
      await new Promise(r => setTimeout(r, 100));

      for (let i = 0; i < fileAdPairs.length; i++) {
        const { file, adIndex } = fileAdPairs[i];
        setMultiUploadProgress(`Subiendo ${i + 1}/${fileAdPairs.length}: ${file.name}`);
        const fakeEvent = { target: { files: [file] } };
        await handleAdFileUpload(adIndex, fakeEvent);
        if (i < fileAdPairs.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      setMultiUploadProgress(`${fileAdPairs.length} ad(s) creado(s)`);
      setTimeout(() => setMultiUploadProgress(''), 5000);

    } else {
      // MODE: All files for 1 ad — upload all to the first empty ad (only first file used, rest go to Meta library)
      // Find first empty ad or use first ad
      const targetAdIdx = ads.findIndex(ad => ad.mediaSource === 'none' && !ad.imageHash && !ad.videoId) !== -1
        ? ads.findIndex(ad => ad.mediaSource === 'none' && !ad.imageHash && !ad.videoId)
        : 0;

      // Upload first file to the ad (with AI analysis)
      setMultiUploadProgress(`Subiendo archivo principal: ${files[0].name}`);
      const fakeEvent = { target: { files: [files[0]] } };
      await handleAdFileUpload(targetAdIdx, fakeEvent);

      // Upload remaining files to Meta library only (no ad creation)
      if (files.length > 1) {
        const metaService = new MetaAdsService(accessToken);
        for (let i = 1; i < files.length; i++) {
          setMultiUploadProgress(`Subiendo a biblioteca ${i + 1}/${files.length}: ${files[i].name}`);
          const file = files[i];
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
          if (i < files.length - 1) {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }

      setMultiUploadProgress(`1 ad creado + ${files.length - 1} archivo(s) subido(s) a biblioteca`);
      setTimeout(() => setMultiUploadProgress(''), 5000);
    }
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

  // Editor de chats (WhatsApp leads)
  const [chatGreeting, setChatGreeting] = useState('Te damos la bienvenida. Completa el siguiente formulario para registrarte.');
  const [chatFormFields, setChatFormFields] = useState(['name', 'email']);
  const [showChatEditor, setShowChatEditor] = useState(false);

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
        result = await metaService.analyzeVideoFile(file, adIndex, category, objective, templateName, destType, textLength, campaignContext);
      } else {
        result = await metaService.analyzeImageFile(file, adIndex, category, objective, templateName, destType, textLength, campaignContext);
      }

      if (result.success && result.data) {
        const isWhatsApp = templateAdSetConfig?.conversionLocation === 'WHATSAPP';
        const isIgProfile = templateAdSetConfig?.conversionLocation === 'INSTAGRAM_PROFILE';
        const defaultCta = isIgProfile ? 'VISIT_INSTAGRAM_PROFILE' : 'LEARN_MORE';
        updateAd(adIndex, {
          headlines: result.data.headlines || ['', '', '', '', ''],
          descriptions: result.data.descriptions || ['', '', '', '', ''],
          // WhatsApp: no generar CTAs, siempre usar WHATSAPP_MESSAGE predeterminado
          // Instagram Profile: usar VISIT_INSTAGRAM_PROFILE como CTA por defecto
          ...(!isWhatsApp && { ctas: isIgProfile
            ? [defaultCta, defaultCta, defaultCta, defaultCta, defaultCta]
            : (result.data.ctas || [defaultCta, defaultCta, defaultCta, defaultCta, defaultCta]) }),
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
        const isWhatsApp = templateAdSetConfig?.conversionLocation === 'WHATSAPP';
        const isIgProfile = templateAdSetConfig?.conversionLocation === 'INSTAGRAM_PROFILE';
        const defaultCta = isIgProfile ? 'VISIT_INSTAGRAM_PROFILE' : 'LEARN_MORE';
        updateAd(adIndex, {
          headlines: result.data.headlines || ['', '', '', '', ''],
          descriptions: result.data.descriptions || ['', '', '', '', ''],
          // WhatsApp: no generar CTAs, siempre usar WHATSAPP_MESSAGE predeterminado
          // Instagram Profile: usar VISIT_INSTAGRAM_PROFILE como CTA por defecto
          ...(!isWhatsApp && { ctas: isIgProfile
            ? [defaultCta, defaultCta, defaultCta, defaultCta, defaultCta]
            : (result.data.ctas || [defaultCta, defaultCta, defaultCta, defaultCta, defaultCta]) }),
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
      if (!selectedAccount) {
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
        setSelectedIgAccount(prev => prev || allIg[0].id);
      } else {
        setIgAccounts([]);
        setSelectedIgAccount('');
      }
    };
    loadIgAccounts();

    return () => { cancelled = true; };
  }, [selectedAccount, selectedPage, pages]);

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
    if (templateRequirements.whatsapp) {
      if (whatsappMode === 'per-ad') {
        // Validar que cada ad tenga un número seleccionado
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
        budgetLevel: templateAdSetConfig.allowBudgetLevel ? budgetLevel : 'campaign', // 'campaign' (CBO) o 'adset'
        // Página de Facebook para el anuncio
        pageId: selectedPage,
        pageName: selectedPageData?.name || selectedPage,
        // URL de destino (si aplica)
        linkUrl: linkUrl.trim() || null,
        // Cuenta de Instagram para el anuncio
        igActorId: selectedIgAccount || null,
        igUsername: (() => { const ig = igAccounts.find(ig => ig.id === selectedIgAccount); console.log('IG account being sent:', { id: selectedIgAccount, username: ig?.username, allAccounts: igAccounts.map(a => ({ id: a.id, username: a.username })) }); return ig?.username || null; })(),
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
        // Chat editor (WhatsApp leads)
        chatGreeting: chatGreeting || null,
        chatFormFields: chatFormFields.length > 0 ? chatFormFields : null,
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

        {/* Categorías de Anuncios Especiales */}
        <div className="form-group">
          <label>Categorías de Anuncios Especiales</label>
          <select
            value=""
            onChange={(e) => {
              const val = e.target.value;
              if (val && !specialAdCategories.includes(val)) {
                setSpecialAdCategories(prev => [...prev, val]);
              }
            }}
          >
            <option value="">Declara la categoría si corresponde</option>
            {SPECIAL_AD_CATEGORIES.filter(c => !specialAdCategories.includes(c.value)).map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          {specialAdCategories.length > 0 && (
            <div className="selected-categories" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {specialAdCategories.map(cat => {
                const catInfo = SPECIAL_AD_CATEGORIES.find(c => c.value === cat);
                return (
                  <span key={cat} className="requirement-badge" style={{ backgroundColor: '#3498db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setSpecialAdCategories(prev => prev.filter(c => c !== cat))}
                  >
                    {catInfo?.label || cat} ×
                  </span>
                );
              })}
            </div>
          )}
          <p className="hint">Declara si tus anuncios están relacionados con servicios financieros, empleos, viviendas o temas sociales</p>
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

        {/* WhatsApp Number - Selector de WhatsApp Business */}
        {templateRequirements.whatsapp && (
          <div className="form-group">
            <label>Número de WhatsApp Business *</label>
            {loadingWhatsAppNumbers ? (
              <select disabled>
                <option>Cargando números de WhatsApp...</option>
              </select>
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
                      console.log('WhatsApp number selected:', digits, 'ID:', val);
                    }
                  }}
                  required
                >
                  <option value="">Selecciona un número de WhatsApp</option>
                  {whatsAppNumbers.map(num => {
                    const statusLabel = num.quality_score?.score
                      ? ` [${num.quality_score.score}]`
                      : '';
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
                <p className="hint">
                  {whatsAppNumbers.length} número(s) encontrado(s). Selecciona el número de destino para tu campaña.
                </p>
              </>
            ) : (
              <>
                <input
                  type="tel"
                  placeholder="573001234567"
                  value={whatsappNumber}
                  onChange={(e) => {
                    setWhatsappNumber(e.target.value);
                  }}
                  required
                />
                {whatsAppNumbersError && <p className="hint error">{whatsAppNumbersError}</p>}
                <p className="hint">Número con código de país sin espacios ni guiones (ej: 573001234567)</p>
              </>
            )}

            {/* Toggle: mismo número vs número por ad set (solo con 2+ ads) */}
            {ads.length > 1 && whatsAppNumbers.length > 1 && (
              <div className="whatsapp-mode-toggle" style={{ marginTop: '8px' }}>
                <div className="budget-level-selector">
                  <button
                    type="button"
                    className={`budget-btn ${whatsappMode === 'same' ? 'active' : ''}`}
                    onClick={() => setWhatsappMode('same')}
                  >
                    Mismo número para todos
                  </button>
                  <button
                    type="button"
                    className={`budget-btn ${whatsappMode === 'per-ad' ? 'active' : ''}`}
                    onClick={() => setWhatsappMode('per-ad')}
                  >
                    Número por Ad Set
                  </button>
                </div>
                {whatsappMode === 'per-ad' && (
                  <p className="hint">Selecciona un número de WhatsApp diferente en cada anuncio abajo.</p>
                )}
              </div>
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
            <p className="hint" style={{ color: '#F59E0B' }}>
              {audienceError}
            </p>
          )}
          {selectedAudience && !audienceError && (
            <p className="hint success">
              Público seleccionado: {allAudiences.find(a => a.id === selectedAudience)?.name}
            </p>
          )}
        </div>

        {/* Budget Level Selector (only for templates that allow it) */}
        {templateAdSetConfig.allowBudgetLevel && (
          <div className="form-group">
            <label>Nivel de Presupuesto</label>
            <div className="budget-level-buttons" style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`gender-btn ${budgetLevel === 'campaign' ? 'active' : ''}`}
                onClick={() => setBudgetLevel('campaign')}
              >
                Por Campaña (CBO)
              </button>
              <button
                type="button"
                className={`gender-btn ${budgetLevel === 'adset' ? 'active' : ''}`}
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
        )}

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
            Presupuesto: ${formatCOP(dailyBudget || 0)} COP/día ({budgetLevel === 'campaign' ? 'CBO' : 'por Ad Set'}) - Sugerido: ${formatCOP(templateAdSetConfig.suggestedBudget || selectedTemplate?.suggestedBudget || 50000)}
          </p>
        </div>

        {/* Estrategia de Puja */}
        <div className="form-group">
          <label>Estrategia de Puja de la Campaña</label>
          <div className="budget-level-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {BID_STRATEGIES.map(bs => (
              <button
                key={bs.value}
                type="button"
                className={`gender-btn ${bidStrategy === bs.value ? 'active' : ''}`}
                onClick={() => {
                  setBidStrategy(bs.value);
                  if (bs.value === 'LOWEST_COST_WITHOUT_CAP') setBidAmount('');
                }}
              >
                {bs.label}
              </button>
            ))}
          </div>
          <p className="hint">
            {BID_STRATEGIES.find(bs => bs.value === bidStrategy)?.description || ''}
          </p>
          {bidStrategy !== 'LOWEST_COST_WITHOUT_CAP' && (
            <div style={{ marginTop: '10px' }}>
              <label>{bidStrategy === 'COST_CAP' ? 'Costo por Resultado Objetivo (COP)' : 'Límite de Puja (COP)'}</label>
              <input
                type="number"
                placeholder={bidStrategy === 'COST_CAP' ? 'Ej: 5000' : 'Ej: 3000'}
                min="100"
                step="100"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
              <p className="hint">
                {bidStrategy === 'COST_CAP'
                  ? 'Meta intentará mantener un costo promedio por resultado cerca de este monto'
                  : 'Meta no pujará más de este monto en cada subasta'}
              </p>
            </div>
          )}
        </div>

        {/* Presupuesto y Calendario */}
        <div className="targeting-section">
          <h4>Presupuesto y Calendario</h4>

          {/* Schedule: Start Date + End Date */}
          <div className="targeting-row">
            <div className="targeting-field">
              <label>Fecha de Inicio</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="hint" style={{ margin: '5px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                Deja vacío para iniciar inmediatamente
              </p>
            </div>
            <div className="targeting-field">
              <label>Fecha de Finalización</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="hint" style={{ margin: '5px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                Deja vacío para correr indefinidamente
              </p>
            </div>
          </div>
        </div>

        {/* Público / Audience Section */}
        <div className="targeting-section">
          <h4>Público</h4>

          {/* Advantage+ Audience Toggle */}
          {templateAdSetConfig.audienceConfig?.allowAdvantage !== false && (
            <div className="targeting-row">
              <div className="targeting-field" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ margin: 0 }}>Advantage+ Público</label>
                  <button
                    type="button"
                    className={`gender-btn ${advantageAudience ? 'active' : ''}`}
                    onClick={() => setAdvantageAudience(!advantageAudience)}
                    style={{ padding: '5px 14px', fontSize: '12px' }}
                  >
                    {advantageAudience ? 'Activado' : 'Desactivado'}
                  </button>
                </div>
                <p className="hint" style={{ margin: '5px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                  {advantageAudience
                    ? 'Meta ampliará automáticamente tu público para mejorar el rendimiento'
                    : 'Solo se mostrará a tu público definido, sin expansión automática'}
                </p>
              </div>
            </div>
          )}

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

        {/* Ubicaciones / Placements */}
        <div className="targeting-section">
          <h4>Ubicaciones</h4>
          <div className="targeting-row">
            <div className="targeting-field" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ margin: 0 }}>Advantage+ Ubicaciones</label>
                <button
                  type="button"
                  className={`gender-btn ${useAdvantagePlacements ? 'active' : ''}`}
                  onClick={() => {
                    setUseAdvantagePlacements(!useAdvantagePlacements);
                    if (!useAdvantagePlacements) setExcludedPlacements([]);
                  }}
                  style={{ padding: '5px 14px', fontSize: '12px' }}
                >
                  {useAdvantagePlacements ? 'Activado' : 'Desactivado'}
                </button>
              </div>
              <p className="hint" style={{ margin: '5px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                {useAdvantagePlacements
                  ? 'Meta mostrará los anuncios en los lugares donde generen respuesta'
                  : 'Elige manualmente dónde mostrar tus anuncios'}
              </p>
            </div>
          </div>

          {/* Exclusiones de ubicaciones (siempre visible para excluir específicas) */}
          {!useAdvantagePlacements && (
            <div className="targeting-row" style={{ marginTop: '10px' }}>
              <div className="targeting-field" style={{ flex: 1 }}>
                <label>Ubicaciones excluidas</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(PLACEMENT_OPTIONS).map(([platform, placements]) => (
                    <div key={platform}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'capitalize' }}>{platform}</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {placements.map(p => {
                          const key = `${platform}_${p.id}`;
                          const isExcluded = excludedPlacements.includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              className={`gender-btn ${!isExcluded ? 'active' : ''}`}
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                              onClick={() => {
                                setExcludedPlacements(prev =>
                                  isExcluded ? prev.filter(e => e !== key) : [...prev, key]
                                );
                              }}
                            >
                              {p.label} {isExcluded ? '(excluido)' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {useAdvantagePlacements && (
            <div className="targeting-row" style={{ marginTop: '8px' }}>
              <div className="targeting-field" style={{ flex: 1 }}>
                <label>Ubicaciones excluidas (opcional)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { key: 'facebook_marketplace', label: 'Facebook Marketplace' },
                    { key: 'facebook_right_column', label: 'Columna derecha de Facebook' }
                  ].map(p => {
                    const isExcluded = excludedPlacements.includes(p.key);
                    return (
                      <button
                        key={p.key}
                        type="button"
                        className={`gender-btn ${isExcluded ? 'active' : ''}`}
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                        onClick={() => {
                          setExcludedPlacements(prev =>
                            isExcluded ? prev.filter(e => e !== p.key) : [...prev, p.key]
                          );
                        }}
                      >
                        {isExcluded ? '×' : ''} {p.label}
                      </button>
                    );
                  })}
                </div>
                <p className="hint" style={{ margin: '5px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                  Haz clic para excluir ubicaciones específicas
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ============ MULTI-AD SECTION ============ */}
        <div className="section-divider" style={{ margin: '25px 0 15px' }}>
          <span>Anuncios ({ads.length})</span>
        </div>

        {/* AdSet Mode Toggle */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>Estructura de Anuncios</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setAdSetMode('single')}
              style={{
                padding: '10px 18px', borderRadius: '8px', border: '2px solid',
                borderColor: adSetMode === 'single' ? '#4A9FFF' : '#2A3441',
                background: adSetMode === 'single' ? 'rgba(74, 159, 255, 0.12)' : '#1B2333',
                cursor: 'pointer', fontSize: '13px', fontWeight: adSetMode === 'single' ? 'bold' : 'normal'
              }}
            >
              1 Ad Set (sin 5+5+5)
            </button>
            <button
              type="button"
              onClick={() => setAdSetMode('dynamic')}
              style={{
                padding: '10px 18px', borderRadius: '8px', border: '2px solid',
                borderColor: adSetMode === 'dynamic' ? '#4A9FFF' : '#2A3441',
                background: adSetMode === 'dynamic' ? 'rgba(74, 159, 255, 0.12)' : '#1B2333',
                cursor: 'pointer', fontSize: '13px', fontWeight: adSetMode === 'dynamic' ? 'bold' : 'normal'
              }}
            >
              5+5+5 por Ad (recomendado)
            </button>
            <button
              type="button"
              onClick={() => setAdSetMode('per-ad')}
              style={{
                padding: '10px 18px', borderRadius: '8px', border: '2px solid',
                borderColor: adSetMode === 'per-ad' ? '#4A9FFF' : '#2A3441',
                background: adSetMode === 'per-ad' ? 'rgba(74, 159, 255, 0.12)' : '#1B2333',
                cursor: 'pointer', fontSize: '13px', fontWeight: adSetMode === 'per-ad' ? 'bold' : 'normal'
              }}
            >
              Público diferente por Ad
            </button>
          </div>
          <p className="hint">
            {adSetMode === 'single'
              ? 'Todos los ads en 1 Ad Set. Cada ad usa 1 título + 1 descripción + 1 CTA (el mejor generado por IA).'
              : adSetMode === 'dynamic'
              ? 'Cada ad tiene su propio Ad Set con Dynamic Creative 5+5+5 (Meta prueba 125 combinaciones por ad). Mismo público para todos. CBO distribuye el presupuesto.'
              : 'Cada ad tiene su propio Ad Set con público diferente y Dynamic Creative 5+5+5.'}
          </p>
        </div>

        {/* AI Text Generation Settings */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>Configuracion de textos IA</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#8899AA', alignSelf: 'center', marginRight: '4px' }}>Longitud:</span>
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
                style={{
                  padding: '6px 14px', borderRadius: '6px', border: '2px solid',
                  borderColor: textLength === opt.value ? '#4A9FFF' : '#2A3441',
                  background: textLength === opt.value ? 'rgba(74, 159, 255, 0.12)' : '#1B2333',
                  cursor: 'pointer', fontSize: '12px', fontWeight: textLength === opt.value ? 'bold' : 'normal',
                  color: textLength === opt.value ? '#4A9FFF' : '#8899AA'
                }}
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
            style={{
              width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2A3441',
              background: '#1B2333', color: '#E0E0E0', fontSize: '13px', resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <p className="hint" style={{ marginTop: '4px' }}>
            {campaignContext.trim()
              ? 'La IA usara tu contexto para generar los textos.'
              : 'Sin contexto: la IA generara textos basandose solo en el contenido multimedia que subas.'}
          </p>
        </div>

        {/* Multi-file Upload Section */}
        <div style={{ marginBottom: '15px', border: '1px solid #2A3441', borderRadius: '12px', padding: '14px', background: '#1B2333' }}>
          <input
            ref={multiFileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,.jpg,.jpeg,.png,.webp,.mp4,.mov"
            onChange={handleMultiFileUpload}
            style={{ display: 'none' }}
          />
          {/* Mode selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#8899AA', marginRight: '4px' }}>Subida multiple:</span>
            <button
              type="button"
              onClick={() => setMultiUploadMode('per-ad')}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: '2px solid',
                borderColor: multiUploadMode === 'per-ad' ? '#4A9FFF' : '#2A3441',
                background: multiUploadMode === 'per-ad' ? 'rgba(74, 159, 255, 0.12)' : 'transparent',
                cursor: 'pointer', fontSize: '12px', fontWeight: multiUploadMode === 'per-ad' ? 'bold' : 'normal',
                color: multiUploadMode === 'per-ad' ? '#4A9FFF' : '#8899AA'
              }}
            >
              1 archivo por Ad
            </button>
            <button
              type="button"
              onClick={() => setMultiUploadMode('single')}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: '2px solid',
                borderColor: multiUploadMode === 'single' ? '#4A9FFF' : '#2A3441',
                background: multiUploadMode === 'single' ? 'rgba(74, 159, 255, 0.12)' : 'transparent',
                cursor: 'pointer', fontSize: '12px', fontWeight: multiUploadMode === 'single' ? 'bold' : 'normal',
                color: multiUploadMode === 'single' ? '#4A9FFF' : '#8899AA'
              }}
            >
              Todo para 1 Ad
            </button>
          </div>
          <p className="hint" style={{ marginBottom: '10px', fontSize: '11px' }}>
            {multiUploadMode === 'per-ad'
              ? 'Cada archivo crea un ad nuevo automaticamente con su contenido IA.'
              : 'El primer archivo se usa para el ad, el resto se sube a la biblioteca de Meta.'}
          </p>
          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => multiFileInputRef.current?.click()}
              disabled={!selectedAccount}
              style={{
                padding: '10px 18px', borderRadius: '10px', border: '2px solid #4A9FFF',
                background: 'rgba(74, 159, 255, 0.12)', color: '#4A9FFF',
                cursor: selectedAccount ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 'bold',
                opacity: selectedAccount ? 1 : 0.5
              }}
            >
              Subir Multiples Archivos
            </button>
            <button
              type="button"
              onClick={addAd}
              style={{
                padding: '10px 18px', borderRadius: '10px', border: '2px dashed #4A9FFF',
                background: 'transparent', color: '#4A9FFF',
                cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
              }}
            >
              + Agregar Ad Vacio
            </button>
            {multiUploadProgress && (
              <span style={{ fontSize: '12px', color: '#4A9FFF' }}>
                {multiUploadProgress}
              </span>
            )}
          </div>
        </div>

        {/* Ad Cards */}
        <div className="ads-section">
          {ads.map((ad, adIndex) => (
            <div key={ad.id} className="ad-card" style={{
              border: '2px solid #2A3441',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              background: '#212B3D'
            }}>
              {/* Ad Card Header */}
              <div className="ad-card-header" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'
              }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#E2E8F0' }}>
                  Anuncio {adIndex + 1}
                </h4>
                {ads.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAd(adIndex)}
                    className="remove-ad-btn"
                    style={{
                      background: '#F87171', color: 'white', border: 'none',
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

              {/* Per-ad WhatsApp Number (only in per-ad whatsapp mode) */}
              {whatsappMode === 'per-ad' && templateRequirements.whatsapp && whatsAppNumbers.length > 1 && (
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '13px' }}>Número de WhatsApp para este Ad Set *</label>
                  <select
                    value={ad.whatsappNumberId}
                    onChange={(e) => {
                      const val = e.target.value;
                      const selected = whatsAppNumbers.find(n => String(n.id) === String(val));
                      updateAd(adIndex, {
                        whatsappNumberId: val,
                        whatsappNumber: selected ? selected.display_phone_number.replace(/\D/g, '') : '',
                        whatsappDisplayNumber: selected ? selected.display_phone_number : ''
                      });
                    }}
                    style={{ fontSize: '13px' }}
                  >
                    <option value="">Selecciona un número</option>
                    {whatsAppNumbers.map(num => {
                      const pageName = num.page_name
                        ? ` - ${num.page_name}`
                        : num.whatsapp_business_account_name
                          ? ` - ${num.whatsapp_business_account_name}`
                          : '';
                      return (
                        <option key={num.id} value={String(num.id)}>
                          {num.display_phone_number} ({num.verified_name}{pageName})
                        </option>
                      );
                    })}
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
                      borderColor: ad.mediaSource === 'none' ? '#4A9FFF' : '#2A3441',
                      background: ad.mediaSource === 'none' ? 'rgba(74, 159, 255, 0.12)' : '#1B2333',
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
                      borderColor: ad.mediaSource === 'library' ? '#4A9FFF' : '#2A3441',
                      background: ad.mediaSource === 'library' ? 'rgba(74, 159, 255, 0.12)' : '#1B2333',
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
                      borderColor: ad.mediaSource === 'upload' ? '#4A9FFF' : '#2A3441',
                      background: ad.mediaSource === 'upload' ? 'rgba(74, 159, 255, 0.12)' : '#1B2333',
                      cursor: 'pointer', fontSize: '12px', fontWeight: ad.mediaSource === 'upload' ? 'bold' : 'normal'
                    }}
                  >
                    Subir archivo
                  </button>
                </div>

                {/* Library Browser — multi-select directo */}
                {ad.mediaSource === 'library' && (
                  <div style={{ border: '1px solid #2A3441', borderRadius: '8px', padding: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                    {/* Mode selector + apply button (always visible) */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#8899AA' }}>Modo:</span>
                      <button
                        type="button"
                        onClick={() => { setLibraryMode('single'); setSelectedLibraryMedia([]); }}
                        style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                          border: `1px solid ${libraryMode === 'single' ? '#4A9FFF' : '#2A3441'}`,
                          background: libraryMode === 'single' ? 'rgba(74, 159, 255, 0.12)' : 'transparent',
                          color: libraryMode === 'single' ? '#4A9FFF' : '#8899AA', cursor: 'pointer',
                          fontWeight: libraryMode === 'single' ? 'bold' : 'normal'
                        }}
                      >
                        Para este Ad
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLibraryMode('per-ad'); setSelectedLibraryMedia([]); }}
                        style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                          border: `1px solid ${libraryMode === 'per-ad' ? '#4A9FFF' : '#2A3441'}`,
                          background: libraryMode === 'per-ad' ? 'rgba(74, 159, 255, 0.12)' : 'transparent',
                          color: libraryMode === 'per-ad' ? '#4A9FFF' : '#8899AA', cursor: 'pointer',
                          fontWeight: libraryMode === 'per-ad' ? 'bold' : 'normal'
                        }}
                      >
                        1 Ad por contenido
                      </button>
                      {selectedLibraryMedia.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleApplyLibrarySelection(adIndex)}
                          style={{
                            padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
                            border: '2px solid #34D399', background: 'rgba(52, 211, 153, 0.15)',
                            color: '#34D399', cursor: 'pointer', marginLeft: 'auto'
                          }}
                        >
                          Aplicar ({selectedLibraryMedia.length})
                        </button>
                      )}
                    </div>
                    <p className="hint" style={{ fontSize: '10px', marginBottom: '8px' }}>
                      {libraryMode === 'single'
                        ? 'Haz click para seleccionar el contenido de este ad.'
                        : 'Selecciona varios y haz click en "Aplicar" para crear 1 ad por cada uno.'}
                    </p>
                    {loadingMedia ? (
                      <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>Cargando biblioteca...</p>
                    ) : (
                      <>
                        {mediaLibrary.images.length === 0 && mediaLibrary.videos.length === 0 ? (
                          <p style={{ textAlign: 'center', color: '#64748B', fontSize: '13px' }}>No hay medios en esta cuenta</p>
                        ) : (
                          <>
                            {mediaLibrary.images.length > 0 && (
                              <div>
                                <p style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '12px' }}>
                                  Imágenes ({mediaLibrary.images.length})
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px' }}>
                                  {mediaLibrary.images.map((img, i) => {
                                    const isSel = isLibraryMediaSelected('image', img);
                                    return (
                                      <div
                                        key={img.hash || i}
                                        onClick={() => {
                                          if (libraryMode === 'single') {
                                            // Directo: asignar a este ad
                                            handleAdSelectLibraryImage(adIndex, img);
                                          } else {
                                            // Multi: toggle seleccion
                                            toggleLibraryMediaSelection('image', img);
                                          }
                                        }}
                                        style={{
                                          cursor: 'pointer',
                                          border: (isSel || ad.imageHash === img.hash) ? '3px solid #4A9FFF' : '2px solid #2A3441',
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
                                        {isSel && (
                                          <div style={{
                                            position: 'absolute', top: '2px', right: '2px',
                                            background: '#F59E0B', color: 'white', borderRadius: '50%',
                                            width: '18px', height: '18px', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold'
                                          }}>{selectedLibraryMedia.findIndex(m => m.type === 'image' && m.data.hash === img.hash) + 1}</div>
                                        )}
                                        {!isSel && ad.imageHash === img.hash && (
                                          <div style={{
                                            position: 'absolute', top: '2px', right: '2px',
                                            background: '#4A9FFF', color: 'white', borderRadius: '50%',
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
                            {mediaLibrary.videos.length > 0 && (
                              <div style={{ marginTop: '10px' }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '12px' }}>
                                  Videos ({mediaLibrary.videos.length})
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '6px' }}>
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
                                        style={{
                                          border: (isSel || ad.videoId === vid.id) ? '3px solid #4A9FFF' : '2px solid #2A3441',
                                          borderRadius: '6px',
                                          overflow: 'hidden',
                                          cursor: 'pointer',
                                          background: (isSel || ad.videoId === vid.id) ? 'rgba(74, 159, 255, 0.12)' : '#1B2333',
                                          position: 'relative'
                                        }}
                                      >
                                        {thumbnail ? (
                                          <img src={thumbnail} alt={vid.title} style={{ width: '100%', height: '70px', objectFit: 'cover' }} />
                                        ) : (
                                          <div style={{ width: '100%', height: '70px', background: '#2A3441', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                            V
                                          </div>
                                        )}
                                        <div style={{ padding: '4px 6px', fontSize: '10px' }}>
                                          <p style={{ fontWeight: 'bold', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {vid.title || 'Sin título'}
                                          </p>
                                          {vid.length && <p style={{ color: '#94A3B8', margin: 0 }}>{Math.round(vid.length)}s</p>}
                                        </div>
                                        {isSel && (
                                          <div style={{
                                            position: 'absolute', top: '2px', right: '2px',
                                            background: '#F59E0B', color: 'white', borderRadius: '50%',
                                            width: '18px', height: '18px', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold'
                                          }}>{selectedLibraryMedia.findIndex(m => m.type === 'video' && m.data.id === vid.id) + 1}</div>
                                        )}
                                        {!isSel && ad.videoId === vid.id && (
                                          <div style={{
                                            position: 'absolute', top: '2px', right: '2px',
                                            background: '#4A9FFF', color: 'white', borderRadius: '50%',
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
                  <div style={{ border: '2px dashed #2A3441', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
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
                    background: 'rgba(74, 159, 255, 0.12)', borderRadius: '6px', padding: '8px 12px', marginTop: '6px'
                  }}>
                    <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                    <span style={{ fontSize: '12px', color: '#4A9FFF' }}>
                      {ad.uploadProgress || 'Analizando con IA...'}
                    </span>
                  </div>
                )}
                {!ad.analyzingMedia && ad.uploadProgress && ad.mediaSource !== 'none' && (
                  <p className="hint" style={{ color: ad.contentGenerated ? '#34D399' : ad.imageUrl || ad.imageHash || ad.videoId ? '#34D399' : '#F59E0B', marginTop: '6px', fontSize: '12px' }}>
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
                    border: ad.contentGenerated ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid #2A3441',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {ad.contentGenerated && (
                      <span style={{
                        background: '#34D399', color: '#064E3B', borderRadius: '4px',
                        padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px'
                      }}>IA</span>
                    )}
                    <span style={{ fontSize: '13px', color: ad.contentGenerated ? '#34D399' : '#94A3B8', fontWeight: '500' }}>
                      {ad.headlines.filter(h => h.trim()).length} Títulos + {ad.descriptions.filter(d => d.trim()).length} Descripciones + {[...new Set(ad.ctas)].length} CTAs
                    </span>
                  </div>
                  <span style={{ fontSize: '18px', color: '#64748B', transform: ad.showEditContent ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    {ad.showEditContent ? 'v' : '>'}
                  </span>
                </button>

                {/* Inline Content Editor */}
                {ad.showEditContent && (
                  <div style={{
                    marginTop: '8px', padding: '16px', background: '#1B2333', borderRadius: '10px',
                    border: '1px solid #2A3441', boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                  }}>
                    {/* Headlines */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px'
                      }}>
                        <span style={{
                          background: '#4A9FFF', color: 'white', borderRadius: '4px',
                          padding: '2px 8px', fontSize: '11px', fontWeight: 'bold'
                        }}>H</span>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>
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
                              borderRadius: '6px', border: headline.trim() ? '1px solid rgba(74, 159, 255, 0.4)' : '1px solid #2A3441',
                              background: headline.trim() ? 'rgba(74, 159, 255, 0.05)' : '#1B2333', color: '#E2E8F0',
                              width: '100%', boxSizing: 'border-box'
                            }}
                          />
                          <span style={{
                            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                            fontSize: '10px', color: headline.length > 50 ? '#F87171' : '#475569'
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
                          background: '#F59E0B', color: '#1B2333', borderRadius: '4px',
                          padding: '2px 8px', fontSize: '11px', fontWeight: 'bold'
                        }}>D</span>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>
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
                              borderRadius: '6px', border: desc.trim() ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #2A3441',
                              background: desc.trim() ? 'rgba(245, 158, 11, 0.05)' : '#1B2333', color: '#E2E8F0',
                              width: '100%', boxSizing: 'border-box'
                            }}
                          />
                          <span style={{
                            position: 'absolute', right: '8px', bottom: '8px',
                            fontSize: '10px', color: desc.length > 280 ? '#F87171' : '#475569'
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
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>
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
                              border: '1px solid #2A3441', background: 'rgba(156, 39, 176, 0.08)', cursor: 'pointer', color: '#E2E8F0'
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
              width: '100%', padding: '14px', border: '2px dashed #4A9FFF',
              borderRadius: '12px', background: 'transparent', color: '#4A9FFF',
              cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', marginBottom: '15px'
            }}
          >
            + Agregar Otro Anuncio
          </button>
        </div>

        {/* Editor de Chats (solo para campañas WhatsApp) */}
        {templateRequirements.whatsapp && (
          <>
            <div className="section-divider" style={{ margin: '25px 0 15px' }}>
              <span>Editor de Chats</span>
            </div>

            <div className="chat-editor-section" style={{ background: '#1B2333', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid #2A3441' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#E2E8F0' }}>Plantilla de Mensaje</h4>
                  <p className="hint" style={{ margin: '4px 0 0' }}>
                    Configura el mensaje que verán las personas cuando toquen tu anuncio
                  </p>
                </div>
                <button
                  type="button"
                  className={`gender-btn ${showChatEditor ? 'active' : ''}`}
                  onClick={() => setShowChatEditor(!showChatEditor)}
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  {showChatEditor ? 'Ocultar' : 'Editar'}
                </button>
              </div>

              {/* Preview siempre visible */}
              <div style={{ background: '#0F1724', borderRadius: '10px', padding: '16px', border: '1px solid #2A3441' }}>
                <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '6px', fontWeight: 'bold' }}>Mensaje de bienvenida</div>
                <div style={{ fontSize: '14px', color: '#E2E8F0', marginBottom: '12px' }}>{chatGreeting}</div>
                <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '6px', fontWeight: 'bold' }}>Detalles del formulario</div>
                <div style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '4px' }}>Comparte tus datos de contacto</div>
                <ol style={{ margin: '4px 0 0', paddingLeft: '20px', fontSize: '13px', color: '#E2E8F0' }}>
                  {chatFormFields.map((field, i) => {
                    const fieldInfo = CHAT_FORM_FIELDS.find(f => f.value === field);
                    return <li key={i}>{fieldInfo?.label || field}</li>;
                  })}
                </ol>
              </div>

              {/* Editor expandido */}
              {showChatEditor && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '6px', display: 'block' }}>Mensaje de bienvenida</label>
                    <textarea
                      value={chatGreeting}
                      onChange={(e) => setChatGreeting(e.target.value)}
                      rows={3}
                      style={{ width: '100%', background: '#0F1724', border: '1px solid #2A3441', borderRadius: '8px', padding: '10px', color: '#E2E8F0', fontSize: '14px', resize: 'vertical' }}
                      placeholder="Te damos la bienvenida. Completa el formulario..."
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '6px', display: 'block' }}>Campos del formulario</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {CHAT_FORM_FIELDS.map(field => {
                        const isSelected = chatFormFields.includes(field.value);
                        return (
                          <button
                            key={field.value}
                            type="button"
                            className={`gender-btn ${isSelected ? 'active' : ''}`}
                            style={{ padding: '5px 12px', fontSize: '12px' }}
                            onClick={() => {
                              setChatFormFields(prev =>
                                isSelected
                                  ? prev.filter(f => f !== field.value)
                                  : [...prev, field.value]
                              );
                            }}
                          >
                            {field.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="hint" style={{ margin: '6px 0 0' }}>
                      Selecciona los campos que quieres pedir en el formulario de contacto
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {error && <div className="error-message">{error}</div>}

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
      if (job.startDate) {
        addLog(`Fecha inicio: ${job.startDate}`);
      }
      if (job.endDate) {
        addLog(`Fecha fin: ${job.endDate}`);
      }
      const budgetLevelLabel = job.budgetLevel === 'adset' ? 'por Ad Set' : 'CBO';
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

      // Aplicar Advantage+ Audience al targeting
      if (job.advantageAudience) {
        targeting.targeting_optimization = 'expansion_all';
      }

      let result;

      // Seleccionar método de creación según el tipo de campaña
      if (conversionLocation === 'WHATSAPP' && job.whatsappNumber) {
        const totalAds = job.ads?.length || 1;
        addLog(`WhatsApp: ${job.whatsappNumber}`);
        if (job.whatsappNumberId) {
          addLog(`WhatsApp Business ID: ${job.whatsappNumberId}`);
        }
        if (job.chatGreeting) {
          addLog(`Chat: "${job.chatGreeting.substring(0, 50)}..."`);
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
          callToAction: job.ctas?.[0] || 'SHOP_NOW',
          objective,
          optimizationGoal,
          // Nuevos campos
          specialAdCategories: job.specialAdCategories || [],
          bidStrategy: job.bidStrategy || 'LOWEST_COST_WITHOUT_CAP',
          bidAmount: job.bidAmount || null,
          startTime: job.startDate || null,
          endTime: job.endDate || null,
          pageWelcomeMessage: job.chatGreeting ? {
            greeting: job.chatGreeting,
            formFields: job.chatFormFields || []
          } : null
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
          imageHash: job.imageHash || null,
          headlines: job.headlines || [],
          descriptions: job.descriptions || [],
          primaryTexts: job.primaryTexts || job.descriptions || [],
          callToAction: job.ctas?.[0] || 'SEND_MESSAGE',
          objective,
          optimizationGoal
        });

      } else if (conversionLocation === 'INSTAGRAM_DIRECT') {
        addLog('Creando campaña para Instagram Direct...');

        result = await metaService.createCampaignForInstagramDM(job.adAccountId, {
          campaignName: job.campaignName,
          adSetName: `${job.campaignName} - Ad Set`,
          adName: job.adName,
          dailyBudget: Math.round(job.dailyBudgetCOP),
          targeting,
          pageId: job.pageId,
          igActorId: job.igActorId,
          imageUrl: job.imageUrl,
          imageHash: job.imageHash || null,
          headlines: job.headlines || [],
          descriptions: job.descriptions || [],
          primaryTexts: job.primaryTexts || job.descriptions || [],
          callToAction: job.ctas?.[0] || 'SEND_MESSAGE',
          objective,
          optimizationGoal
        });

      } else {
        // Campaña estándar (website, traffic, etc.) - MULTI-AD
        const totalAds = job.ads?.length || 1;
        addLog(`URL destino: ${job.linkUrl || 'N/A'}`);
        const mode = job.adSetMode || 'dynamic';
        const modeLabel = mode === 'single' ? `1 Ad Set → ${totalAds} Ads (sin 5+5+5)`
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
          needsCreative: !hasAds,
          // Nuevos campos
          bidStrategy: job.bidStrategy || 'LOWEST_COST_WITHOUT_CAP',
          startDate: job.startDate || null,
          endDate: job.endDate || null,
          specialAdCategories: job.specialAdCategories || [],
          advantageAudience: job.advantageAudience,
          chatGreeting: job.chatGreeting || null
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
                {draftData.bidStrategy && draftData.bidStrategy !== 'LOWEST_COST_WITHOUT_CAP' && (
                  <p className="hint">Puja: {draftData.bidStrategy}</p>
                )}
                {draftData.specialAdCategories?.length > 0 && (
                  <p className="hint">Categorías: {draftData.specialAdCategories.join(', ')}</p>
                )}
                {draftData.startDate && <p className="hint">Inicio: {draftData.startDate}</p>}
                {draftData.endDate && <p className="hint">Fin: {draftData.endDate}</p>}
                <span className="status-badge paused">PAUSADO</span>
              </div>
            </div>

            <div className="draft-card">
              <span className="card-icon">AS</span>
              <div>
                <h4>Ad Set(s) ({draftData.totalAdSets || 1})</h4>
                <p>Presupuesto: ${formatCOP(draftData.dailyBudgetCOP)} COP/día ({draftData.budgetLevel === 'adset' ? 'por Ad Set' : 'CBO'})</p>
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
              <div className="draft-card" style={{ background: 'rgba(52, 211, 153, 0.1)', border: '2px solid #34D399' }}>
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
              <div className="draft-card" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '2px dashed #F59E0B' }}>
                <span className="card-icon">Ad</span>
                <div>
                  <h4>Anuncio (Pendiente)</h4>
                  <p style={{ color: '#F59E0B' }}>Crear manualmente en Meta Ads Manager</p>
                  <p className="hint">Página: {draftData.pageName}</p>
                  <p className="hint">Destino: {draftData.linkUrl}</p>
                  <span className="status-badge" style={{ background: '#F59E0B', color: '#1B2333' }}>PENDIENTE</span>
                </div>
              </div>
            )}
          </div>

          {/* Contenido - diferente según si se creó el Ad o no */}
          {adWasCreated ? (
            // Ads fueron creados - mostrar resumen de todas las variaciones
            <div className="generated-content-box" style={{
              background: 'rgba(52, 211, 153, 0.1)',
              border: '2px solid #34D399',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '20px'
            }}>
              <h3 style={{ color: '#34D399', marginBottom: '10px' }}>
                🎉 {draftData.totalAdsCreated > 1
                  ? `¡${draftData.totalAdsCreated} Anuncios Creados!`
                  : '¡Anuncio Creado Exitosamente!'}
              </h3>
              <p style={{ color: '#34D399', marginBottom: '15px', fontSize: '14px' }}>
                {draftData.totalAdsCreated > 1
                  ? `Se crearon ${draftData.totalAdsCreated} variaciones de anuncio. Meta optimizará y mostrará el de mejor rendimiento.`
                  : 'Tu anuncio está listo. Solo necesitas activar la campaña cuando quieras que empiece a correr.'}
              </p>

              {/* Mostrar cada variación creada */}
              {draftData.headlines?.filter(h => h?.trim()).map((headline, i) => {
                if (i >= (draftData.totalAdsCreated || 1)) return null;
                return (
                  <div key={i} style={{ background: '#212B3D', padding: '12px 15px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid #34D399' }}>
                    <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '5px' }}>Variación {i + 1}</p>
                    <p><strong>Título:</strong> {headline}</p>
                    <p><strong>Texto:</strong> {draftData.descriptions?.[i]?.substring(0, 80) || draftData.descriptions?.[0]?.substring(0, 80) || 'N/A'}...</p>
                  </div>
                );
              })}

              <div style={{ background: '#212B3D', padding: '12px 15px', borderRadius: '8px', marginTop: '10px' }}>
                <p><strong>Destino:</strong> {draftData.linkUrl}</p>
                <p><strong>CTA:</strong> {CTA_OPTIONS.find(c => c.value === draftData.ctas?.[0])?.label || draftData.ctas?.[0] || 'LEARN_MORE'}</p>
                {draftData.igUsername && <p><strong>Instagram:</strong> @{draftData.igUsername}</p>}
              </div>

              {!draftData.imageUrl && (
                <p style={{ fontSize: '13px', color: '#F59E0B', marginTop: '10px' }}>
                  💡 Nota: Los anuncios usan la imagen de vista previa del link. Puedes editarlos en Meta Ads Manager para agregar una imagen personalizada.
                </p>
              )}
            </div>
          ) : (
            // Ad NO fue creado - mostrar contenido para copiar
            <div className="generated-content-box" style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '2px solid #FBBF24',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '20px'
            }}>
              <h3 style={{ color: '#FBBF24', marginBottom: '10px' }}>
                📋 Contenido para crear tu Anuncio
              </h3>
              <p style={{ color: '#F59E0B', marginBottom: '15px', fontSize: '14px' }}>
                Usa este contenido al crear el Anuncio en Meta Ads Manager. <strong>Click para copiar.</strong>
              </p>

              {draftData.imageUrl && (
                <div className="copy-section" style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', color: '#E2E8F0' }}>🖼️ URL de Imagen</label>
                  <div className="copy-item" style={{
                    background: '#212B3D',
                    padding: '8px 12px',
                    margin: '5px 0',
                    borderRadius: '6px',
                    border: '2px solid #34D399',
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
                  <label style={{ fontWeight: 'bold', color: '#E2E8F0' }}>🔗 URL de Destino</label>
                  <div className="copy-item" style={{
                    background: '#212B3D',
                    padding: '8px 12px',
                    margin: '5px 0',
                    borderRadius: '6px',
                    border: '1px solid #2A3441',
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
                  <label style={{ fontWeight: 'bold', color: '#E2E8F0' }}>📝 Títulos ({draftData.headlines.length})</label>
                  {draftData.headlines.map((h, i) => (
                    <div key={i} className="copy-item" style={{
                      background: '#212B3D',
                      padding: '8px 12px',
                      margin: '5px 0',
                      borderRadius: '6px',
                      border: '1px solid #2A3441',
                      cursor: 'pointer'
                    }} onClick={() => navigator.clipboard.writeText(h)} title="Click para copiar">
                      {h}
                    </div>
                  ))}
                </div>
              )}

              {draftData.descriptions?.length > 0 && (
                <div className="copy-section" style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', color: '#E2E8F0' }}>💬 Descripciones ({draftData.descriptions.length})</label>
                  {draftData.descriptions.map((d, i) => (
                    <div key={i} className="copy-item" style={{
                      background: '#212B3D',
                      padding: '8px 12px',
                      margin: '5px 0',
                      borderRadius: '6px',
                      border: '1px solid #2A3441',
                      cursor: 'pointer'
                    }} onClick={() => navigator.clipboard.writeText(d)} title="Click para copiar">
                      {d}
                    </div>
                  ))}
                </div>
              )}

              {draftData.ctas?.length > 0 && (
                <div className="copy-section">
                  <label style={{ fontWeight: 'bold', color: '#E2E8F0' }}>🎯 CTAs Recomendados</label>
                  <div className="cta-badges" style={{ marginTop: '8px' }}>
                    {[...new Set(draftData.ctas)].map((cta, i) => (
                      <span key={i} className="cta-badge" style={{
                        background: 'rgba(74, 159, 255, 0.12)',
                        color: '#4A9FFF',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        marginRight: '8px',
                        fontSize: '13px'
                      }}>{CTA_OPTIONS.find(c => c.value === cta)?.label || cta}</span>
                    ))}
                  </div>
                </div>
              )}

              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '15px' }}>
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
            <p>{job.totalAds || 1} anuncio(s) | {job.adSetMode === 'single' ? '1 Ad Set' : `${job.totalAds || 1} Ad Sets${job.adSetMode === 'dynamic' ? ' con 5+5+5' : ' (público diferente)'}`}</p>
          </div>
          <div className="summary-item">
            <label>Presupuesto Diario ({job.budgetLevel === 'adset' ? 'por Ad Set' : 'CBO'})</label>
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
                background: '#212B3D', borderRadius: '8px', padding: '10px', marginBottom: '8px',
                borderLeft: '3px solid #4A9FFF'
              }}>
                <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
                  {ad.adName || `Ad ${i + 1}`}
                  {ad.videoId ? ' (Video)' : ad.imageUrl || ad.imageHash ? ' (Imagen)' : ' (Sin media)'}
                  {job.adSetMode === 'per-ad' && ad.audienceName ? ` - ${ad.audienceName}` : ''}
                </p>
                <p style={{ fontSize: '12px', color: '#94A3B8' }}>
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
            <li><strong>{job.adSetMode === 'single' ? '1 Ad Set' : (job.ads?.length || 1) + ' Ad Sets'}</strong> - {job.adSetMode === 'single' ? 'Standard' : 'Dynamic Creative 5+5+5'} - {job.optimizationGoal || 'Landing Page Views'}</li>
            <li><strong>{job.ads?.length || 1} Creative(s)</strong>{job.adSetMode !== 'single' ? ' - Cada uno con 5+5+5' : ''}</li>
            <li><strong>{job.ads?.length || 1} Anuncio(s)</strong></li>
          </ul>
          {job.ads?.length > 1 && (
            <div style={{ fontSize: '13px', marginTop: '10px', color: '#94A3B8' }}>
              {job.ads.map((ad, i) => (
                <p key={i} style={{ margin: '3px 0' }}>
                  Ad {i + 1}: {ad.adName || `Ad ${i + 1}`} | {ad.videoId ? 'Video' : ad.imageUrl || ad.imageHash ? 'Imagen' : 'Sin media'}
                  {job.adSetMode === 'per-ad' && ad.audienceName ? ` | ${ad.audienceName}` : ''}
                </p>
              ))}
            </div>
          )}
          <p style={{ fontSize: '13px', marginTop: '10px', color: '#94A3B8' }}>
            Meta probará automáticamente las diferentes combinaciones de títulos, descripciones y CTAs para encontrar la mejor.
          </p>
          {job.igActorId && (
            <p style={{ fontSize: '13px', marginTop: '5px', color: '#94A3B8' }}>
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
