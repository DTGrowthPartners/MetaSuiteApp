// ===========================================
// META CREATIVE BUILDER - Upload Page
// ===========================================

import React, { useState, useCallback } from 'react';

interface AdAccount {
  id: string;
  name: string;
  metaAccountId: string;
}

interface Template {
  slug: string;
  name: string;
  description: string;
  objective: string;
}

interface UploadPageProps {
  onJobCreated?: (jobId: string) => void;
}

const API_BASE = '/api';

export const UploadPage: React.FC<UploadPageProps> = ({ onJobCreated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Fetch ad accounts and templates on mount
  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [accountsRes, templatesRes] = await Promise.all([
          fetch(`${API_BASE}/ad-accounts`),
          fetch(`${API_BASE}/templates`)
        ]);

        const accountsData = await accountsRes.json();
        const templatesData = await templatesRes.json();

        if (accountsData.success) {
          setAdAccounts(accountsData.data);
        }
        if (templatesData.success) {
          setTemplates(templatesData.data);
        }
      } catch (err) {
        setError('Error cargando datos. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) {
        setFile(droppedFile);
        setExternalUrl('');
        setError('');
      } else {
        setError('Tipo de archivo no válido. Usa MP4, MOV, JPG, PNG o WebP.');
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) {
        setFile(selectedFile);
        setExternalUrl('');
        setError('');
      } else {
        setError('Tipo de archivo no válido. Usa MP4, MOV, JPG, PNG o WebP.');
      }
    }
  };

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];
    return validTypes.includes(file.type);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file && !externalUrl) {
      setError('Por favor sube un archivo o proporciona una URL');
      return;
    }

    if (!selectedAccount) {
      setError('Por favor selecciona una cuenta publicitaria');
      return;
    }

    if (!selectedTemplate) {
      setError('Por favor selecciona un template');
      return;
    }

    setUploading(true);

    try {
      // Step 1: Upload asset
      let assetId: string;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch(`${API_BASE}/assets`, {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadRes.json();

        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Error subiendo archivo');
        }

        assetId = uploadData.asset.id;
      } else {
        const uploadRes = await fetch(`${API_BASE}/assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ externalUrl })
        });

        const uploadData = await uploadRes.json();

        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Error registrando URL');
        }

        assetId = uploadData.asset.id;
      }

      // Step 2: Create job
      const jobRes = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adAccountId: selectedAccount,
          assetId: assetId,
          templateSlug: selectedTemplate,
          clientId: adAccounts.find(a => a.id === selectedAccount)?.id
        })
      });

      const jobData = await jobRes.json();

      if (!jobData.success) {
        throw new Error(jobData.error || 'Error creando job');
      }

      setSuccess(`Job creado exitosamente! ID: ${jobData.job.id}`);

      // Step 3: Start analysis
      await fetch(`${API_BASE}/jobs/${jobData.job.id}/analyze`, {
        method: 'POST'
      });

      if (onJobCreated) {
        onJobCreated(jobData.job.id);
      }

      // Reset form
      setFile(null);
      setExternalUrl('');

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="upload-page loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <h1>Crear Nueva Campaña</h1>
      <p className="subtitle">Sube un video o imagen para generar creativos con IA</p>

      <form onSubmit={handleSubmit}>
        {/* File Upload Zone */}
        <div
          className={`upload-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="file-preview">
              <div className="file-icon">
                {file.type.startsWith('video/') ? '🎬' : '🖼️'}
              </div>
              <div className="file-info">
                <p className="file-name">{file.name}</p>
                <p className="file-size">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                className="remove-file"
                onClick={() => setFile(null)}
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className="upload-icon">📤</div>
              <p>Arrastra tu archivo aquí o</p>
              <label className="upload-button">
                Seleccionar archivo
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  hidden
                />
              </label>
              <p className="upload-hint">MP4, MOV, WebM, JPG, PNG, WebP - Max 500MB</p>
            </>
          )}
        </div>

        {/* Or divider */}
        <div className="divider">
          <span>o proporciona una URL</span>
        </div>

        {/* External URL */}
        <div className="form-group">
          <label htmlFor="externalUrl">URL del archivo</label>
          <input
            type="url"
            id="externalUrl"
            placeholder="https://example.com/video.mp4"
            value={externalUrl}
            onChange={(e) => {
              setExternalUrl(e.target.value);
              if (e.target.value) setFile(null);
            }}
            disabled={!!file}
          />
        </div>

        {/* Ad Account Selection */}
        <div className="form-group">
          <label htmlFor="adAccount">Cuenta Publicitaria *</label>
          <select
            id="adAccount"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            required
          >
            <option value="">Selecciona una cuenta</option>
            {adAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.metaAccountId})
              </option>
            ))}
          </select>
        </div>

        {/* Template Selection */}
        <div className="form-group">
          <label htmlFor="template">Template de Campaña *</label>
          <select
            id="template"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            required
          >
            <option value="">Selecciona un template</option>
            {templates.map((template) => (
              <option key={template.slug} value={template.slug}>
                {template.name} - {template.objective}
              </option>
            ))}
          </select>
          {selectedTemplate && (
            <p className="template-description">
              {templates.find(t => t.slug === selectedTemplate)?.description}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="message error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="message success">
            <span>✅</span> {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="submit-button"
          disabled={uploading || (!file && !externalUrl)}
        >
          {uploading ? (
            <>
              <span className="spinner-small"></span>
              Procesando...
            </>
          ) : (
            'Crear Campaña'
          )}
        </button>
      </form>

      <style>{`
        .upload-page {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
        }

        .upload-page.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        h1 {
          margin-bottom: 0.5rem;
          color: #1a1a2e;
        }

        .subtitle {
          color: #666;
          margin-bottom: 2rem;
        }

        .upload-zone {
          border: 2px dashed #ccc;
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          background: #fafafa;
          transition: all 0.2s;
          cursor: pointer;
        }

        .upload-zone.drag-active {
          border-color: #0066ff;
          background: #f0f7ff;
        }

        .upload-zone.has-file {
          border-style: solid;
          border-color: #00c853;
          background: #f0fff4;
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .upload-button {
          display: inline-block;
          background: #0066ff;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          margin: 0.5rem 0;
          transition: background 0.2s;
        }

        .upload-button:hover {
          background: #0052cc;
        }

        .upload-hint {
          font-size: 0.875rem;
          color: #999;
          margin-top: 0.5rem;
        }

        .file-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .file-icon {
          font-size: 2.5rem;
        }

        .file-info {
          flex: 1;
          text-align: left;
        }

        .file-name {
          font-weight: 500;
          margin: 0;
          word-break: break-all;
        }

        .file-size {
          color: #666;
          font-size: 0.875rem;
          margin: 0.25rem 0 0;
        }

        .remove-file {
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-size: 1rem;
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #ddd;
        }

        .divider span {
          padding: 0 1rem;
          color: #999;
          font-size: 0.875rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #0066ff;
        }

        .form-group input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .template-description {
          font-size: 0.875rem;
          color: #666;
          margin-top: 0.5rem;
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

        .message.success {
          background: #f0fff4;
          color: #006622;
          border: 1px solid #b3e6c4;
        }

        .submit-button {
          width: 100%;
          padding: 1rem;
          background: #0066ff;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-button:hover:not(:disabled) {
          background: #0052cc;
        }

        .submit-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #0066ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
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
      `}</style>
    </div>
  );
};

export default UploadPage;
