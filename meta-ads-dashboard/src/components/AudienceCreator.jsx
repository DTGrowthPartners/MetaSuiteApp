import { useState, useEffect } from 'react';
import MetaAdsService from '../services/metaAdsApi';
import CustomSelect from './ui/CustomSelect';
import {
  Users, Instagram, MessageSquare, Video, ClipboardList,
  ArrowLeft, Check, Loader2, AlertCircle, Globe
} from 'lucide-react';

// Fuentes de engagement
const SOURCES = [
  {
    id: 'instagram',
    label: 'Cuenta de Instagram',
    icon: Instagram,
    color: '#E4405F',
    sourceType: 'ig_business',
    maxDays: 730,
    events: [
      { value: 'ig_business_profile_all', label: 'Todos los que interactuaron con la cuenta' },
      { value: 'ig_business_profile_visit', label: 'Personas que visitaron el perfil' },
      { value: 'ig_business_profile_engaged', label: 'Interactuaron con contenido o anuncios' },
      { value: 'ig_business_profile_ad_saved', label: 'Personas que guardaron un post o anuncio' },
      { value: 'ig_user_messaged_business', label: 'Personas que enviaron un mensaje DM' },
    ]
  },
  {
    id: 'page',
    label: 'Página de Facebook',
    icon: Globe,
    color: '#1877F2',
    sourceType: 'page',
    maxDays: 730,
    events: [
      { value: 'page_engaged', label: 'Cualquier interacción con la página' },
      { value: 'page_visited', label: 'Personas que visitaron la página' },
      { value: 'page_liked', label: 'Personas que le dieron like a la página' },
      { value: 'page_messaged', label: 'Personas que enviaron un mensaje por Messenger' },
      { value: 'page_cta_clicked', label: 'Personas que hicieron clic en el CTA' },
      { value: 'page_saved', label: 'Personas que guardaron una publicación' },
    ]
  },
  {
    id: 'video',
    label: 'Video',
    icon: Video,
    color: '#FF6B35',
    sourceType: 'video',
    maxDays: 365,
    noSource: true, // No requiere seleccionar fuente — Meta usa todos los videos de la cuenta
    events: [
      { value: 'video_watched_3s', label: 'Personas que vieron al menos 3 segundos' },
      { value: 'video_watched_10s', label: 'Personas que vieron al menos 10 segundos' },
      { value: 'video_watched_25_percent', label: 'Personas que vieron el 25% del video' },
      { value: 'video_watched_50_percent', label: 'Personas que vieron el 50% del video' },
      { value: 'video_watched_75_percent', label: 'Personas que vieron el 75% del video' },
      { value: 'video_watched_95_percent', label: 'Personas que vieron el 95% del video' },
      { value: 'video_completed', label: 'Personas que vieron el 100% del video' },
    ]
  },
  {
    id: 'leads',
    label: 'Formularios de Leads',
    icon: ClipboardList,
    color: '#10B981',
    sourceType: 'lead',
    maxDays: 90,
    needsLeadForm: true,
    events: [
      { value: 'lead_generation_submitted', label: 'Personas que completaron y enviaron el formulario' },
      { value: 'lead_generation_opened', label: 'Personas que abrieron el formulario' },
      { value: 'lead_generation_dropoff', label: 'Personas que abrieron pero no enviaron' },
    ]
  }
];

export default function AudienceCreator({ accessToken, adAccounts, pages, onBack }) {
  // Step: 'account' → 'source' → 'config' → 'done'
  const [step, setStep] = useState('account');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [retentionDays, setRetentionDays] = useState(30);
  const [audienceName, setAudienceName] = useState('');
  const [audienceDescription, setAudienceDescription] = useState('');

  // Source-specific
  const [sourceId, setSourceId] = useState(''); // IG account ID, Page ID, etc.
  const [selectedPageForIg, setSelectedPageForIg] = useState(''); // Page to load IG from
  const [igAccounts, setIgAccounts] = useState([]);
  const [accountPages, setAccountPages] = useState([]);
  const [leadForms, setLeadForms] = useState([]);
  const [loadingSource, setLoadingSource] = useState(false);
  const [loadingIg, setLoadingIg] = useState(false);
  const [selectedVideoSource, setSelectedVideoSource] = useState('page'); // 'page' or 'ig'

  // Videos
  const [adVideos, setAdVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState([]); // Array of { id, title, thumbnail }

  // Create state
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Load pages when account is selected
  useEffect(() => {
    if (!selectedAccount || !accessToken) return;
    const loadPages = async () => {
      setLoadingSource(true);
      const metaService = new MetaAdsService(accessToken);
      try {
        const normalizedId = metaService.normalizeAccountId(selectedAccount);
        const pagesResp = await fetch(
          `https://graph.facebook.com/v21.0/${normalizedId}/promote_pages?fields=id,name,picture&access_token=${accessToken}&limit=50`
        );
        const pagesData = await pagesResp.json();
        setAccountPages(pagesData.data || []);
      } catch (e) {
        console.error('Error loading pages:', e);
        setAccountPages([]);
      }
      setLoadingSource(false);
    };
    loadPages();
  }, [selectedAccount, accessToken]);

  // Load IG accounts when a page is selected (for Instagram source or Video IG)
  useEffect(() => {
    if (!selectedPageForIg || !accessToken) return;
    const loadIg = async () => {
      setLoadingIg(true);
      setIgAccounts([]);
      const allIg = [];
      const seenIds = new Set();

      // 1. Obtener page token via /me/accounts
      let pageToken = accessToken;
      try {
        const meResp = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,access_token&access_token=${accessToken}`);
        const meData = await meResp.json();
        const pageEntry = (meData.data || []).find(p => p.id === selectedPageForIg);
        if (pageEntry?.access_token) pageToken = pageEntry.access_token;
      } catch (e) { /* use user token */ }

      // 2. PRIORIDAD: instagram_business_account (cuenta IG real — crea audiencias funcionales)
      try {
        const resp = await fetch(
          `https://graph.facebook.com/v21.0/${selectedPageForIg}?fields=instagram_business_account{id,username,profile_picture_url}&access_token=${pageToken}`
        );
        const data = await resp.json();
        const iba = data.instagram_business_account;
        if (iba?.id && !seenIds.has(iba.id)) {
          seenIds.add(iba.id);
          allIg.push({ id: iba.id, username: iba.username || 'Instagram', profile_pic: iba.profile_picture_url });
          console.log('IG from instagram_business_account:', iba.id, '@' + iba.username);
        }
      } catch (e) { console.warn('instagram_business_account error:', e); }

      // 3. Fallback: /{page}/instagram_accounts
      if (allIg.length === 0) {
        try {
          const resp = await fetch(
            `https://graph.facebook.com/v21.0/${selectedPageForIg}/instagram_accounts?fields=id,username,profile_pic&access_token=${pageToken}`
          );
          const data = await resp.json();
          (data.data || []).forEach(ig => {
            if (ig.id && !seenIds.has(ig.id)) {
              seenIds.add(ig.id);
              allIg.push({ id: ig.id, username: ig.username || 'Instagram', profile_pic: ig.profile_pic });
              console.log('IG from page /instagram_accounts:', ig.id, '@' + ig.username);
            }
          });
        } catch (e) { /* silent */ }
      }

      // 4. Fallback: page_backed_instagram_accounts
      if (allIg.length === 0) {
        try {
          const resp = await fetch(
            `https://graph.facebook.com/v21.0/${selectedPageForIg}/page_backed_instagram_accounts?fields=id,username,profile_picture_url&access_token=${pageToken}`
          );
          const data = await resp.json();
          (data.data || []).forEach(ig => {
            if (ig.id && !seenIds.has(ig.id)) {
              seenIds.add(ig.id);
              // Usar nombre de la página si no hay username
              const pageName = accountPages.find(p => p.id === selectedPageForIg)?.name;
              allIg.push({ id: ig.id, username: ig.username || pageName || 'Instagram', profile_pic: ig.profile_picture_url });
              console.log('IG from page_backed:', ig.id, ig.username || pageName);
            }
          });
        } catch (e) { /* silent */ }
      }

      console.log('IG accounts found for page', selectedPageForIg, ':', allIg.length, allIg);
      setIgAccounts(allIg);
      if (allIg.length === 1) setSourceId(allIg[0].id);
      setLoadingIg(false);
    };
    loadIg();
  }, [selectedPageForIg, accessToken, selectedAccount]);

  // Load lead forms when source is leads and page is selected
  useEffect(() => {
    if (selectedSource?.id !== 'leads' || !sourceId || !accessToken) return;
    const loadForms = async () => {
      setLoadingSource(true);
      const metaService = new MetaAdsService(accessToken);
      const result = await metaService.getLeadForms(sourceId);
      setLeadForms(result.success ? result.data : []);
      setLoadingSource(false);
    };
    loadForms();
  }, [selectedSource, sourceId, accessToken]);

  // Load videos when source is video
  useEffect(() => {
    if (selectedSource?.id !== 'video' || !selectedAccount || !accessToken) return;
    const loadVideos = async () => {
      setLoadingVideos(true);
      try {
        const metaService = new MetaAdsService(accessToken);
        const normalizedId = metaService.normalizeAccountId(selectedAccount);
        const resp = await fetch(
          `https://graph.facebook.com/v21.0/${normalizedId}/advideos?fields=id,title,thumbnails,created_time&limit=50&access_token=${accessToken}`
        );
        const data = await resp.json();
        setAdVideos((data.data || []).map(v => ({
          id: v.id,
          title: v.title || `Video ${v.id}`,
          thumbnail: v.thumbnails?.data?.[0]?.uri || null,
          created: v.created_time
        })));
      } catch (e) {
        console.error('Error loading videos:', e);
        setAdVideos([]);
      }
      setLoadingVideos(false);
    };
    loadVideos();
  }, [selectedSource, selectedAccount, accessToken]);

  // Auto-generate name
  useEffect(() => {
    if (!selectedSource || !selectedEvent) return;
    const eventLabel = selectedSource.events.find(e => e.value === selectedEvent)?.label || '';
    const shortLabel = eventLabel.replace('Personas que ', '').substring(0, 40);
    setAudienceName(`${shortLabel} - ${retentionDays}d`);
  }, [selectedSource, selectedEvent, retentionDays]);

  const handleCreate = async () => {
    if (!audienceName.trim()) { setError('Ingresa un nombre para el público'); return; }
    if (selectedSource.id === 'video' && selectedVideos.length === 0) { setError('Selecciona al menos un video'); return; }
    if (selectedSource.id !== 'video' && !sourceId) { setError('Selecciona una fuente'); return; }
    if (!selectedEvent) { setError('Selecciona un evento'); return; }

    setCreating(true);
    setError('');
    const metaService = new MetaAdsService(accessToken);

    let createResult;
    if (selectedSource.id === 'video') {
      createResult = await metaService.createVideoAudience(selectedAccount, {
        name: audienceName.trim(),
        description: audienceDescription.trim() || null,
        videoIds: selectedVideos.map(v => v.id),
        event: selectedEvent,
        retentionDays
      });
    } else {
      createResult = await metaService.createEngagementAudience(selectedAccount, {
        name: audienceName.trim(),
        description: audienceDescription.trim() || null,
        sourceType: selectedSource.sourceType,
        sourceId,
        event: selectedEvent,
        retentionDays
      });
    }

    setCreating(false);
    if (createResult.success) {
      setResult(createResult.data);
      setStep('done');
    } else {
      setError(createResult.error);
    }
  };

  const accountOptions = (adAccounts || []).map(acc => ({
    value: acc.id,
    label: `${acc.name || acc.id} (${acc.id})`
  }));

  const resetForm = () => {
    setStep('source');
    setSelectedSource(null);
    setSelectedEvent('');
    setRetentionDays(30);
    setAudienceName('');
    setAudienceDescription('');
    setSourceId('');
    setResult(null);
    setError('');
  };

  return (
    <div className="builder-content" style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={step === 'account' ? onBack : step === 'source' ? () => setStep('account') : step === 'config' ? () => setStep('source') : resetForm}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>Crear Público Personalizado</h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
            {step === 'account' ? 'Selecciona la cuenta publicitaria' : step === 'source' ? 'Elige el origen del público' : step === 'config' ? 'Configura el público' : 'Público creado'}
          </p>
        </div>
      </div>

      {/* Step 1: Account Selection */}
      {step === 'account' && (
        <div className="section-card">
          <h4><span className="section-icon"><Users size={18} /></span> Cuenta Publicitaria</h4>
          <div className="form-group">
            <label>Selecciona la cuenta donde se creará el público</label>
            <CustomSelect
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              searchable
              placeholder="Selecciona una cuenta publicitaria"
              options={accountOptions}
            />
          </div>
          {selectedAccount && (
            <button
              type="button"
              className="submit-button"
              onClick={() => setStep('source')}
              style={{ marginTop: '16px' }}
            >
              Continuar
            </button>
          )}
        </div>
      )}

      {/* Step 2: Source Selection */}
      {step === 'source' && (
        <div className="section-card">
          <h4><span className="section-icon"><MessageSquare size={18} /></span> Orígenes de Meta</h4>
          <p className="hint" style={{ marginBottom: '16px' }}>Selecciona el tipo de interacción para crear tu público</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {SOURCES.map((source) => {
              const Icon = source.icon;
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => {
                    setSelectedSource(source);
                    setSelectedEvent('');
                    setSourceId('');
                    setSelectedPageForIg('');
                    setIgAccounts([]);
                    setSelectedVideos([]);
                    setStep('config');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  className="custom-select-option"
                >
                  <Icon size={20} style={{ color: source.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{source.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Configure */}
      {step === 'config' && selectedSource && (
        <div className="section-card">
          <h4>
            <span className="section-icon">
              {(() => { const Icon = selectedSource.icon; return <Icon size={18} style={{ color: selectedSource.color }} />; })()}
            </span>
            {selectedSource.label}
          </h4>

          {/* Source selector: IG account or Page */}
          <div className="form-group">
            <label>Origen</label>
            {selectedSource.id === 'instagram' ? (
              <>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Página de Facebook vinculada</label>
                <CustomSelect
                  value={selectedPageForIg}
                  onChange={(e) => { setSelectedPageForIg(e.target.value); setSourceId(''); setIgAccounts([]); }}
                  loading={loadingSource}
                  searchable
                  placeholder="Primero selecciona la página de Facebook"
                  options={accountPages.map(p => ({ value: p.id, label: p.name || p.id }))}
                />
                {selectedPageForIg && (
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Cuenta de Instagram</label>
                    <CustomSelect
                      value={sourceId}
                      onChange={(e) => setSourceId(e.target.value)}
                      loading={loadingIg}
                      searchable
                      placeholder={loadingIg ? 'Cargando...' : igAccounts.length === 0 ? 'No se encontraron cuentas de Instagram' : 'Selecciona cuenta de Instagram'}
                      options={igAccounts.map(ig => ({
                        value: ig.id,
                        label: ig.username ? `@${ig.username}` : ig.id
                      }))}
                    />
                  </div>
                )}
              </>
            ) : selectedSource.id === 'page' ? (
              <CustomSelect
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                loading={loadingSource}
                searchable
                placeholder={accountPages.length === 0 ? 'No se encontraron páginas' : 'Selecciona página de Facebook'}
                options={accountPages.map(p => ({
                  value: p.id,
                  label: p.name || p.id
                }))}
              />
            ) : selectedSource.id === 'video' ? (
              <>
                <p className="hint" style={{ marginBottom: '8px' }}>Selecciona los videos que quieres incluir en el público</p>
                {loadingVideos ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }} /> Cargando videos...
                  </div>
                ) : adVideos.length === 0 ? (
                  <p className="hint">No se encontraron videos en esta cuenta</p>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '4px' }}>
                    {adVideos.map(video => {
                      const isSelected = selectedVideos.some(v => v.id === video.id);
                      return (
                        <div
                          key={video.id}
                          onClick={() => {
                            setSelectedVideos(prev => isSelected
                              ? prev.filter(v => v.id !== video.id)
                              : [...prev, video]
                            );
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px', cursor: 'pointer', borderRadius: '4px',
                            background: isSelected ? 'rgba(59,130,246,0.12)' : 'transparent',
                            borderBottom: '1px solid rgba(255,255,255,0.03)'
                          }}
                        >
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                            border: isSelected ? 'none' : '2px solid var(--text-muted)',
                            background: isSelected ? 'var(--accent)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {isSelected && <Check size={12} style={{ color: '#fff' }} />}
                          </div>
                          {video.thumbnail && (
                            <img src={video.thumbnail} alt="" style={{ width: 40, height: 40, borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {video.title}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID: {video.id}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedVideos.length > 0 && (
                  <p className="hint mt-sm" style={{ color: 'var(--accent)' }}>
                    {selectedVideos.length} video{selectedVideos.length > 1 ? 's' : ''} seleccionado{selectedVideos.length > 1 ? 's' : ''}
                  </p>
                )}
              </>
            ) : selectedSource.id === 'leads' ? (
              <>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Página del formulario</label>
                <CustomSelect
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  loading={loadingSource}
                  searchable
                  placeholder="Selecciona página de Facebook"
                  options={accountPages.map(p => ({ value: p.id, label: p.name || p.id }))}
                />
                {sourceId && leadForms.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Formulario</label>
                    <CustomSelect
                      value={sourceId}
                      onChange={(e) => setSourceId(e.target.value)}
                      searchable
                      placeholder="Selecciona formulario"
                      options={leadForms.map(f => ({ value: f.id, label: f.name || f.id }))}
                    />
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Event selector */}
          <div className="form-group">
            <label>Eventos</label>
            <CustomSelect
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              placeholder="Selecciona el tipo de interacción"
              options={selectedSource.events.map(ev => ({
                value: ev.value,
                label: ev.label
              }))}
            />
          </div>

          {/* Retention days */}
          <div className="form-group">
            <label>Retención</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>En los últimos</span>
              <input
                type="number"
                min={1}
                max={selectedSource.maxDays}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Math.min(parseInt(e.target.value) || 1, selectedSource.maxDays))}
                style={{ width: '80px', textAlign: 'center' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>días</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>Máx: {selectedSource.maxDays} días</span>
            </div>
            {/* Quick buttons */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {[7, 14, 30, 60, 90, 180, 365].filter(d => d <= selectedSource.maxDays).map(days => (
                <button
                  key={days}
                  type="button"
                  className={`toggle-btn ${retentionDays === days ? 'active' : ''}`}
                  onClick={() => setRetentionDays(days)}
                  style={{ fontSize: '11px', padding: '3px 10px' }}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Name & Description */}
          <div className="form-group">
            <label>Nombre del público *</label>
            <input
              type="text"
              value={audienceName}
              onChange={(e) => setAudienceName(e.target.value)}
              placeholder="Ej: Interactuaron IG 30 días"
              maxLength={50}
            />
            <p className="hint">{audienceName.length}/50</p>
          </div>

          <div className="form-group">
            <label>Descripción (opcional)</label>
            <input
              type="text"
              value={audienceDescription}
              onChange={(e) => setAudienceDescription(e.target.value)}
              placeholder="Descripción del público"
              maxLength={100}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="button"
            className="submit-button"
            onClick={handleCreate}
            disabled={creating || (selectedSource?.id === 'video' ? selectedVideos.length === 0 : !sourceId) || !selectedEvent || !audienceName.trim()}
            style={{ marginTop: '16px' }}
          >
            {creating ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creando público...</>
            ) : (
              'Crear Público'
            )}
          </button>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && result && (
        <div className="section-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Check size={28} style={{ color: '#10B981' }} />
          </div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>Público Creado</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 4px' }}>
            <strong>{audienceName}</strong>
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '0 0 24px' }}>
            ID: {result.id} · Meta está recopilando datos...
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button type="button" className="toggle-btn active" onClick={resetForm}>
              Crear Otro Público
            </button>
            <button type="button" className="toggle-btn" onClick={onBack}>
              Volver al Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
