// ===========================================
// META CREATIVE BUILDER - Review Page
// ===========================================

import React, { useState, useEffect } from 'react';

interface JobData {
  id: string;
  status: string;
  templateSlug: string;
  asset: {
    id: string;
    type: string;
    originalName: string;
    storageUrl: string;
    thumbnailUrl?: string;
  };
  creativeBrief?: {
    product_or_service: string;
    category: string;
    angle: string;
    tone: string;
    key_benefits: string[];
    target_audience: string;
  };
  copies?: string[];
  headlines?: string[];
  descriptions?: string[];
  ctas?: string[];
  bestPick?: {
    copy: number;
    headline: number;
    description: number;
    cta: number;
  };
  selectedCopy?: number;
  selectedHeadline?: number;
  selectedDescription?: number;
  selectedCta?: number;
  error?: string;
}

interface ReviewPageProps {
  jobId: string;
  onDraftReady?: (jobId: string) => void;
}

const API_BASE = '/api';

export const ReviewPage: React.FC<ReviewPageProps> = ({ jobId, onDraftReady }) => {
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Selection state
  const [selectedCopy, setSelectedCopy] = useState<number | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<number | null>(null);
  const [selectedDescription, setSelectedDescription] = useState<number | null>(null);
  const [selectedCta, setSelectedCta] = useState<number | null>(null);
  const [customCampaignName, setCustomCampaignName] = useState('');
  const [customBudget, setCustomBudget] = useState('');

  useEffect(() => {
    fetchJob();
    // Poll for updates while processing
    const interval = setInterval(() => {
      if (job?.status === 'ANALYZING' || job?.status === 'GENERATING') {
        fetchJob();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}`);
      const data = await res.json();

      if (data.success) {
        setJob(data.job);

        // Pre-select AI recommended options
        if (data.job.bestPick) {
          if (selectedCopy === null) setSelectedCopy(data.job.bestPick.copy);
          if (selectedHeadline === null) setSelectedHeadline(data.job.bestPick.headline);
          if (selectedDescription === null) setSelectedDescription(data.job.bestPick.description);
          if (selectedCta === null) setSelectedCta(data.job.bestPick.cta);
        }

        // Restore saved selections
        if (data.job.selectedCopy !== null && data.job.selectedCopy !== undefined) {
          setSelectedCopy(data.job.selectedCopy);
        }
        if (data.job.selectedHeadline !== null && data.job.selectedHeadline !== undefined) {
          setSelectedHeadline(data.job.selectedHeadline);
        }
        if (data.job.selectedDescription !== null && data.job.selectedDescription !== undefined) {
          setSelectedDescription(data.job.selectedDescription);
        }
        if (data.job.selectedCta !== null && data.job.selectedCta !== undefined) {
          setSelectedCta(data.job.selectedCta);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error cargando el job');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setProcessing(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/generate`, {
        method: 'POST'
      });
      const data = await res.json();

      if (data.success) {
        fetchJob();
      } else {
        setError(data.error || 'Error generando copies');
      }
    } catch (err) {
      setError('Error en la generación');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveSelection = async () => {
    if (selectedCopy === null || selectedHeadline === null ||
        selectedDescription === null || selectedCta === null) {
      setError('Por favor selecciona todas las opciones');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/select`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedCopy,
          selectedHeadline,
          selectedDescription,
          selectedCta,
          customCampaignName: customCampaignName || undefined,
          customBudget: customBudget ? parseFloat(customBudget) : undefined
        })
      });

      const data = await res.json();

      if (data.success) {
        fetchJob();
        if (onDraftReady) {
          onDraftReady(jobId);
        }
      } else {
        setError(data.error || 'Error guardando selección');
      }
    } catch (err) {
      setError('Error guardando selección');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Pendiente', color: '#999' },
      ANALYZING: { label: 'Analizando...', color: '#ff9800' },
      ANALYZED: { label: 'Analizado', color: '#2196f3' },
      GENERATING: { label: 'Generando...', color: '#ff9800' },
      GENERATED: { label: 'Listo para revisar', color: '#4caf50' },
      READY_FOR_DRAFT: { label: 'Listo para publicar', color: '#9c27b0' },
      CREATING_DRAFT: { label: 'Creando draft...', color: '#ff9800' },
      DRAFT_CREATED: { label: 'Draft creado', color: '#00c853' },
      ERROR: { label: 'Error', color: '#f44336' }
    };

    const statusInfo = statusMap[status] || { label: status, color: '#999' };

    return (
      <span className="status-badge" style={{ backgroundColor: statusInfo.color }}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="review-page loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="review-page error-state">
        <p>Job no encontrado</p>
      </div>
    );
  }

  return (
    <div className="review-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Revisar Creativos</h1>
          {getStatusBadge(job.status)}
        </div>
        <p className="job-id">Job ID: {job.id}</p>
      </header>

      {/* Asset Preview */}
      <section className="asset-section">
        <h2>Asset</h2>
        <div className="asset-preview">
          {job.asset.type === 'VIDEO' ? (
            <video
              src={job.asset.storageUrl}
              controls
              poster={job.asset.thumbnailUrl}
            />
          ) : (
            <img
              src={job.asset.storageUrl}
              alt={job.asset.originalName}
            />
          )}
          <p className="asset-name">{job.asset.originalName}</p>
        </div>
      </section>

      {/* Creative Brief */}
      {job.creativeBrief && (
        <section className="brief-section">
          <h2>Brief Creativo (generado por IA)</h2>
          <div className="brief-grid">
            <div className="brief-item">
              <label>Producto/Servicio</label>
              <p>{job.creativeBrief.product_or_service}</p>
            </div>
            <div className="brief-item">
              <label>Categoría</label>
              <p>{job.creativeBrief.category}</p>
            </div>
            <div className="brief-item">
              <label>Ángulo</label>
              <p>{job.creativeBrief.angle}</p>
            </div>
            <div className="brief-item">
              <label>Tono</label>
              <p>{job.creativeBrief.tone}</p>
            </div>
            <div className="brief-item full-width">
              <label>Beneficios Clave</label>
              <ul>
                {job.creativeBrief.key_benefits.map((benefit, i) => (
                  <li key={i}>{benefit}</li>
                ))}
              </ul>
            </div>
            <div className="brief-item full-width">
              <label>Audiencia Objetivo</label>
              <p>{job.creativeBrief.target_audience}</p>
            </div>
          </div>
        </section>
      )}

      {/* Generate Button */}
      {job.status === 'ANALYZED' && (
        <section className="action-section">
          <button
            onClick={handleGenerate}
            disabled={processing}
            className="generate-button"
          >
            {processing ? (
              <>
                <span className="spinner-small"></span>
                Generando copies...
              </>
            ) : (
              'Generar Copies con IA'
            )}
          </button>
        </section>
      )}

      {/* Processing indicator */}
      {(job.status === 'ANALYZING' || job.status === 'GENERATING') && (
        <section className="processing-section">
          <div className="spinner"></div>
          <p>
            {job.status === 'ANALYZING'
              ? 'Analizando el asset con IA...'
              : 'Generando variantes de copy...'}
          </p>
        </section>
      )}

      {/* Copies Selection */}
      {job.copies && job.copies.length > 0 && (
        <>
          <section className="selection-section">
            <h2>Copies Principales</h2>
            <p className="section-hint">Selecciona el copy que mejor representa tu mensaje</p>
            <div className="options-grid">
              {job.copies.map((copy, index) => (
                <div
                  key={index}
                  className={`option-card ${selectedCopy === index ? 'selected' : ''} ${job.bestPick?.copy === index ? 'recommended' : ''}`}
                  onClick={() => setSelectedCopy(index)}
                >
                  {job.bestPick?.copy === index && (
                    <span className="recommended-badge">IA Recomienda</span>
                  )}
                  <p>{copy}</p>
                  <span className="option-number">Opción {index + 1}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="selection-section">
            <h2>Headlines</h2>
            <div className="options-grid horizontal">
              {job.headlines?.map((headline, index) => (
                <div
                  key={index}
                  className={`option-card small ${selectedHeadline === index ? 'selected' : ''} ${job.bestPick?.headline === index ? 'recommended' : ''}`}
                  onClick={() => setSelectedHeadline(index)}
                >
                  {job.bestPick?.headline === index && (
                    <span className="recommended-badge">IA</span>
                  )}
                  <p>{headline}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="selection-section">
            <h2>Descripciones</h2>
            <div className="options-grid horizontal">
              {job.descriptions?.map((description, index) => (
                <div
                  key={index}
                  className={`option-card small ${selectedDescription === index ? 'selected' : ''} ${job.bestPick?.description === index ? 'recommended' : ''}`}
                  onClick={() => setSelectedDescription(index)}
                >
                  {job.bestPick?.description === index && (
                    <span className="recommended-badge">IA</span>
                  )}
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="selection-section">
            <h2>Call to Action</h2>
            <div className="options-grid horizontal">
              {job.ctas?.map((cta, index) => (
                <div
                  key={index}
                  className={`option-card cta ${selectedCta === index ? 'selected' : ''} ${job.bestPick?.cta === index ? 'recommended' : ''}`}
                  onClick={() => setSelectedCta(index)}
                >
                  <p>{cta.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Custom Options */}
          <section className="custom-section">
            <h2>Opciones Personalizadas</h2>
            <div className="custom-grid">
              <div className="form-group">
                <label>Nombre de Campaña (opcional)</label>
                <input
                  type="text"
                  placeholder="Mi campaña especial..."
                  value={customCampaignName}
                  onChange={(e) => setCustomCampaignName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Presupuesto Diario (USD, opcional)</label>
                <input
                  type="number"
                  placeholder="50"
                  min="1"
                  value={customBudget}
                  onChange={(e) => setCustomBudget(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Preview */}
          {selectedCopy !== null && selectedHeadline !== null && (
            <section className="preview-section">
              <h2>Vista Previa</h2>
              <div className="ad-preview">
                <div className="ad-copy">{job.copies[selectedCopy]}</div>
                <div className="ad-media">
                  {job.asset.type === 'VIDEO' ? (
                    <video src={job.asset.storageUrl} controls />
                  ) : (
                    <img src={job.asset.storageUrl} alt="Ad preview" />
                  )}
                </div>
                <div className="ad-headline">
                  {job.headlines && job.headlines[selectedHeadline!]}
                </div>
                <div className="ad-description">
                  {job.descriptions && selectedDescription !== null && job.descriptions[selectedDescription]}
                </div>
                <button className="ad-cta">
                  {selectedCta !== null && job.ctas && job.ctas[selectedCta].replace(/_/g, ' ')}
                </button>
              </div>
            </section>
          )}

          {/* Error Message */}
          {error && (
            <div className="message error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Save Button */}
          {job.status === 'GENERATED' && (
            <section className="action-section">
              <button
                onClick={handleSaveSelection}
                disabled={saving || selectedCopy === null || selectedHeadline === null || selectedDescription === null || selectedCta === null}
                className="save-button"
              >
                {saving ? (
                  <>
                    <span className="spinner-small"></span>
                    Guardando...
                  </>
                ) : (
                  'Guardar Selección y Continuar'
                )}
              </button>
            </section>
          )}
        </>
      )}

      {/* Error State */}
      {job.status === 'ERROR' && (
        <section className="error-section">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <h3>Error en el procesamiento</h3>
            <p>{job.error}</p>
            <button onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        </section>
      )}

      <style>{`
        .review-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
        }

        .review-page.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        h1 {
          margin: 0;
          color: #1a1a2e;
        }

        .job-id {
          color: #999;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
        }

        section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        h2 {
          margin: 0 0 1rem;
          font-size: 1.25rem;
          color: #333;
        }

        .section-hint {
          color: #666;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .asset-preview {
          text-align: center;
        }

        .asset-preview video,
        .asset-preview img {
          max-width: 100%;
          max-height: 300px;
          border-radius: 8px;
        }

        .asset-name {
          color: #666;
          margin-top: 0.5rem;
          font-size: 0.875rem;
        }

        .brief-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .brief-item label {
          display: block;
          font-size: 0.75rem;
          color: #999;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }

        .brief-item p {
          margin: 0;
          color: #333;
        }

        .brief-item.full-width {
          grid-column: 1 / -1;
        }

        .brief-item ul {
          margin: 0;
          padding-left: 1.25rem;
        }

        .options-grid {
          display: grid;
          gap: 1rem;
        }

        .options-grid.horizontal {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }

        .option-card {
          position: relative;
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .option-card:hover {
          border-color: #0066ff;
        }

        .option-card.selected {
          border-color: #0066ff;
          background: #f0f7ff;
        }

        .option-card.recommended {
          border-color: #00c853;
        }

        .option-card.recommended.selected {
          background: #f0fff4;
        }

        .option-card.small {
          padding: 0.75rem;
        }

        .option-card.cta {
          text-align: center;
          font-weight: 600;
        }

        .option-card p {
          margin: 0;
        }

        .option-number {
          display: block;
          font-size: 0.75rem;
          color: #999;
          margin-top: 0.5rem;
        }

        .recommended-badge {
          position: absolute;
          top: -10px;
          right: 10px;
          background: #00c853;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .custom-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
        }

        .form-group input:focus {
          outline: none;
          border-color: #0066ff;
        }

        .preview-section .ad-preview {
          max-width: 400px;
          margin: 0 auto;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
        }

        .ad-copy {
          padding: 1rem;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .ad-media video,
        .ad-media img {
          width: 100%;
          display: block;
        }

        .ad-headline {
          padding: 0.75rem 1rem 0;
          font-weight: 600;
        }

        .ad-description {
          padding: 0.25rem 1rem;
          color: #666;
          font-size: 0.875rem;
        }

        .ad-cta {
          margin: 1rem;
          padding: 0.75rem 1.5rem;
          background: #0066ff;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          width: calc(100% - 2rem);
        }

        .action-section {
          text-align: center;
        }

        .generate-button,
        .save-button {
          padding: 1rem 2rem;
          background: #0066ff;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .generate-button:hover:not(:disabled),
        .save-button:hover:not(:disabled) {
          background: #0052cc;
        }

        .generate-button:disabled,
        .save-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .processing-section {
          text-align: center;
          padding: 3rem;
        }

        .error-section {
          text-align: center;
          padding: 3rem;
        }

        .error-content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .message {
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .message.error {
          background: #fff0f0;
          color: #cc0000;
          border: 1px solid #ffcccc;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #0066ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .brief-grid,
          .custom-grid {
            grid-template-columns: 1fr;
          }

          .options-grid.horizontal {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ReviewPage;
