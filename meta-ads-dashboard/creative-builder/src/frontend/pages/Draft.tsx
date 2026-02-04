// ===========================================
// META CREATIVE BUILDER - Draft Page
// ===========================================

import React, { useState, useEffect } from 'react';

interface DraftData {
  id: string;
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  adSetId: string;
  adSetName: string;
  adSetStatus: string;
  creativeId: string;
  adId: string;
  adName: string;
  adStatus: string;
  dailyBudget: number;
  finalCopy: string;
  finalHeadline: string;
  finalDescription: string;
  finalCta: string;
  campaignUrl: string;
  adSetUrl: string;
  adUrl: string;
  createdAt: string;
}

interface JobData {
  id: string;
  status: string;
  templateSlug: string;
  asset: {
    type: string;
    storageUrl: string;
    originalName: string;
  };
  copies: string[];
  headlines: string[];
  descriptions: string[];
  ctas: string[];
  selectedCopy: number;
  selectedHeadline: number;
  selectedDescription: number;
  selectedCta: number;
  customCampaignName?: string;
  customBudget?: number;
  draft?: DraftData;
}

interface DraftPageProps {
  jobId: string;
  onComplete?: () => void;
}

const API_BASE = '/api';

export const DraftPage: React.FC<DraftPageProps> = ({ jobId, onComplete }) => {
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}`);
      const data = await res.json();

      if (data.success) {
        setJob(data.job);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error cargando el job');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraft = async () => {
    setCreating(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: job?.customCampaignName,
          dailyBudget: job?.customBudget
        })
      });

      const data = await res.json();

      if (data.success) {
        fetchJob();
      } else {
        setError(data.error || 'Error creando draft en Meta');
      }
    } catch (err) {
      setError('Error al conectar con Meta');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="draft-page loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="draft-page error-state">
        <p>Job no encontrado</p>
      </div>
    );
  }

  const selectedCopy = job.copies?.[job.selectedCopy];
  const selectedHeadline = job.headlines?.[job.selectedHeadline];
  const selectedDescription = job.descriptions?.[job.selectedDescription];
  const selectedCta = job.ctas?.[job.selectedCta];

  return (
    <div className="draft-page">
      <header className="page-header">
        <h1>
          {job.draft ? 'Draft Creado en Meta' : 'Crear Draft en Meta'}
        </h1>
        <p className="job-id">Job ID: {job.id}</p>
      </header>

      {/* Summary Section */}
      <section className="summary-section">
        <h2>Resumen del Anuncio</h2>
        <div className="summary-content">
          <div className="summary-preview">
            {job.asset.type === 'VIDEO' ? (
              <video src={job.asset.storageUrl} controls />
            ) : (
              <img src={job.asset.storageUrl} alt="Ad asset" />
            )}
          </div>
          <div className="summary-details">
            <div className="detail-item">
              <label>Copy Principal</label>
              <p>{selectedCopy}</p>
            </div>
            <div className="detail-item">
              <label>Headline</label>
              <p>{selectedHeadline}</p>
            </div>
            <div className="detail-item">
              <label>Descripción</label>
              <p>{selectedDescription}</p>
            </div>
            <div className="detail-item">
              <label>Call to Action</label>
              <p className="cta-badge">{selectedCta?.replace(/_/g, ' ')}</p>
            </div>
            {job.customCampaignName && (
              <div className="detail-item">
                <label>Nombre de Campaña</label>
                <p>{job.customCampaignName}</p>
              </div>
            )}
            {job.customBudget && (
              <div className="detail-item">
                <label>Presupuesto Diario</label>
                <p>${job.customBudget} USD</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Create Draft Section */}
      {job.status === 'READY_FOR_DRAFT' && !job.draft && (
        <section className="action-section">
          <div className="info-box">
            <span className="info-icon">ℹ️</span>
            <div>
              <p><strong>¿Qué pasará?</strong></p>
              <ul>
                <li>Se creará una campaña en Meta Ads Manager</li>
                <li>Se creará un Ad Set con la configuración del template</li>
                <li>Se creará un Creative con tu asset y copy</li>
                <li>Se creará un Ad que une todo</li>
                <li><strong>Todo quedará en estado PAUSADO</strong></li>
              </ul>
            </div>
          </div>

          {error && (
            <div className="message error">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            onClick={handleCreateDraft}
            disabled={creating}
            className="create-button"
          >
            {creating ? (
              <>
                <span className="spinner-small"></span>
                Creando en Meta...
              </>
            ) : (
              'Crear Draft en Meta'
            )}
          </button>
        </section>
      )}

      {/* Creating Status */}
      {job.status === 'CREATING_DRAFT' && (
        <section className="processing-section">
          <div className="spinner"></div>
          <p>Creando campaña en Meta Ads Manager...</p>
          <p className="hint">Esto puede tardar unos segundos</p>
        </section>
      )}

      {/* Draft Created */}
      {job.draft && (
        <section className="success-section">
          <div className="success-icon">✅</div>
          <h2>¡Draft Creado Exitosamente!</h2>
          <p>Tu campaña ha sido creada en Meta Ads Manager en estado PAUSADO.</p>

          <div className="draft-details">
            <h3>Detalles del Draft</h3>

            <div className="draft-card">
              <div className="card-header">
                <span className="card-icon">📊</span>
                <div>
                  <h4>Campaña</h4>
                  <p className="card-name">{job.draft.campaignName}</p>
                </div>
                <span className={`status-badge ${job.draft.campaignStatus.toLowerCase()}`}>
                  {job.draft.campaignStatus}
                </span>
              </div>
              <a
                href={job.draft.campaignUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card-link"
              >
                Ver en Ads Manager →
              </a>
            </div>

            <div className="draft-card">
              <div className="card-header">
                <span className="card-icon">🎯</span>
                <div>
                  <h4>Ad Set</h4>
                  <p className="card-name">{job.draft.adSetName}</p>
                </div>
                <span className={`status-badge ${job.draft.adSetStatus.toLowerCase()}`}>
                  {job.draft.adSetStatus}
                </span>
              </div>
              <p className="card-detail">Presupuesto: ${job.draft.dailyBudget} USD/día</p>
              <a
                href={job.draft.adSetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card-link"
              >
                Ver en Ads Manager →
              </a>
            </div>

            <div className="draft-card">
              <div className="card-header">
                <span className="card-icon">📢</span>
                <div>
                  <h4>Anuncio</h4>
                  <p className="card-name">{job.draft.adName}</p>
                </div>
                <span className={`status-badge ${job.draft.adStatus.toLowerCase()}`}>
                  {job.draft.adStatus}
                </span>
              </div>
              <a
                href={job.draft.adUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card-link"
              >
                Ver en Ads Manager →
              </a>
            </div>
          </div>

          <div className="next-steps">
            <h3>Próximos Pasos</h3>
            <ol>
              <li>Revisa la campaña en Meta Ads Manager</li>
              <li>Verifica la segmentación del Ad Set</li>
              <li>Cuando estés listo, activa la campaña desde Ads Manager</li>
            </ol>
          </div>

          {onComplete && (
            <button onClick={onComplete} className="done-button">
              Crear Otra Campaña
            </button>
          )}
        </section>
      )}

      {/* Error State */}
      {job.status === 'ERROR' && (
        <section className="error-section">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <h3>Error al crear el draft</h3>
            <p>{error || 'Ocurrió un error inesperado'}</p>
            <button onClick={handleCreateDraft}>
              Reintentar
            </button>
          </div>
        </section>
      )}

      <style>{`
        .draft-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .draft-page.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .page-header {
          margin-bottom: 2rem;
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

        .summary-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .summary-preview video,
        .summary-preview img {
          width: 100%;
          border-radius: 8px;
        }

        .detail-item {
          margin-bottom: 1rem;
        }

        .detail-item label {
          display: block;
          font-size: 0.75rem;
          color: #999;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }

        .detail-item p {
          margin: 0;
          color: #333;
        }

        .cta-badge {
          display: inline-block;
          background: #0066ff;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .info-box {
          display: flex;
          gap: 1rem;
          background: #f0f7ff;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .info-icon {
          font-size: 1.5rem;
        }

        .info-box ul {
          margin: 0.5rem 0 0;
          padding-left: 1.25rem;
        }

        .info-box li {
          margin-bottom: 0.25rem;
        }

        .action-section {
          text-align: center;
        }

        .create-button,
        .done-button {
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

        .create-button:hover:not(:disabled),
        .done-button:hover {
          background: #0052cc;
        }

        .create-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .processing-section {
          text-align: center;
          padding: 3rem;
        }

        .hint {
          color: #999;
          font-size: 0.875rem;
        }

        .success-section {
          text-align: center;
        }

        .success-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .draft-details {
          margin: 2rem 0;
          text-align: left;
        }

        .draft-details h3 {
          margin-bottom: 1rem;
        }

        .draft-card {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .card-icon {
          font-size: 1.5rem;
        }

        .card-header h4 {
          margin: 0;
          font-size: 0.875rem;
          color: #666;
        }

        .card-name {
          margin: 0.25rem 0 0;
          font-weight: 500;
        }

        .card-header .status-badge {
          margin-left: auto;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.paused {
          background: #fff3e0;
          color: #e65100;
        }

        .status-badge.active {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .card-detail {
          margin: 0.5rem 0 0 2.5rem;
          font-size: 0.875rem;
          color: #666;
        }

        .card-link {
          display: block;
          margin-top: 0.75rem;
          margin-left: 2.5rem;
          color: #0066ff;
          text-decoration: none;
          font-size: 0.875rem;
        }

        .card-link:hover {
          text-decoration: underline;
        }

        .next-steps {
          text-align: left;
          background: #f0fff4;
          padding: 1rem;
          border-radius: 8px;
          margin: 2rem 0;
        }

        .next-steps h3 {
          margin: 0 0 0.5rem;
          color: #2e7d32;
        }

        .next-steps ol {
          margin: 0;
          padding-left: 1.25rem;
        }

        .next-steps li {
          margin-bottom: 0.25rem;
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
          margin-bottom: 1rem;
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
          .summary-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DraftPage;
