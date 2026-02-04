// ===========================================
// META CREATIVE BUILDER - Main App Component
// ===========================================

import React, { useState } from 'react';
import { UploadPage } from './pages/Upload';
import { ReviewPage } from './pages/Review';
import { DraftPage } from './pages/Draft';

type PageView = 'upload' | 'review' | 'draft';

interface JobInfo {
  id: string;
  status: string;
}

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>('upload');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobInfo[]>([]);

  const handleJobCreated = (jobId: string) => {
    setCurrentJobId(jobId);
    setRecentJobs(prev => [{ id: jobId, status: 'ANALYZING' }, ...prev.slice(0, 9)]);
    setCurrentPage('review');
  };

  const handleDraftReady = (jobId: string) => {
    setCurrentPage('draft');
  };

  const handleComplete = () => {
    setCurrentJobId(null);
    setCurrentPage('upload');
  };

  const handleViewJob = (jobId: string) => {
    setCurrentJobId(jobId);
    setCurrentPage('review');
  };

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="main-nav">
        <div className="nav-brand">
          <span className="logo">🎨</span>
          <span className="brand-name">Meta Creative Builder</span>
        </div>
        <div className="nav-links">
          <button
            className={`nav-link ${currentPage === 'upload' ? 'active' : ''}`}
            onClick={() => setCurrentPage('upload')}
          >
            Nueva Campaña
          </button>
          {currentJobId && (
            <>
              <button
                className={`nav-link ${currentPage === 'review' ? 'active' : ''}`}
                onClick={() => setCurrentPage('review')}
              >
                Revisar
              </button>
              <button
                className={`nav-link ${currentPage === 'draft' ? 'active' : ''}`}
                onClick={() => setCurrentPage('draft')}
              >
                Publicar
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className={currentPage === 'upload' ? 'active' : ''}>1. Subir Asset</span>
        <span className="separator">→</span>
        <span className={currentPage === 'review' ? 'active' : ''}>2. Revisar Creativos</span>
        <span className="separator">→</span>
        <span className={currentPage === 'draft' ? 'active' : ''}>3. Crear Draft</span>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {currentPage === 'upload' && (
          <UploadPage onJobCreated={handleJobCreated} />
        )}
        {currentPage === 'review' && currentJobId && (
          <ReviewPage jobId={currentJobId} onDraftReady={handleDraftReady} />
        )}
        {currentPage === 'draft' && currentJobId && (
          <DraftPage jobId={currentJobId} onComplete={handleComplete} />
        )}
      </main>

      {/* Recent Jobs Sidebar */}
      {recentJobs.length > 0 && (
        <aside className="recent-jobs">
          <h3>Jobs Recientes</h3>
          <ul>
            {recentJobs.map((job) => (
              <li key={job.id}>
                <button
                  className={`job-link ${job.id === currentJobId ? 'active' : ''}`}
                  onClick={() => handleViewJob(job.id)}
                >
                  <span className="job-id">{job.id.slice(0, 8)}...</span>
                  <span className={`job-status ${job.status.toLowerCase()}`}>
                    {job.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <style>{`
        .app {
          min-height: 100vh;
          background: #f5f5f5;
        }

        .main-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo {
          font-size: 1.5rem;
        }

        .brand-name {
          font-weight: 600;
          font-size: 1.25rem;
          color: #1a1a2e;
        }

        .nav-links {
          display: flex;
          gap: 0.5rem;
        }

        .nav-link {
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          color: #666;
          font-size: 0.875rem;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .nav-link:hover {
          background: #f0f0f0;
        }

        .nav-link.active {
          background: #0066ff;
          color: white;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: white;
          border-bottom: 1px solid #eee;
          gap: 0.75rem;
        }

        .breadcrumb span {
          font-size: 0.875rem;
          color: #999;
        }

        .breadcrumb span.active {
          color: #0066ff;
          font-weight: 600;
        }

        .breadcrumb .separator {
          color: #ddd;
        }

        .main-content {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .recent-jobs {
          position: fixed;
          right: 0;
          top: 100px;
          width: 250px;
          background: white;
          padding: 1rem;
          border-radius: 12px 0 0 12px;
          box-shadow: -2px 0 10px rgba(0,0,0,0.1);
        }

        .recent-jobs h3 {
          font-size: 0.875rem;
          color: #666;
          margin: 0 0 1rem;
        }

        .recent-jobs ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .recent-jobs li {
          margin-bottom: 0.5rem;
        }

        .job-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #eee;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .job-link:hover {
          border-color: #0066ff;
        }

        .job-link.active {
          background: #f0f7ff;
          border-color: #0066ff;
        }

        .job-id {
          font-family: monospace;
          font-size: 0.75rem;
          color: #666;
        }

        .job-status {
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 3px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .job-status.pending,
        .job-status.analyzing,
        .job-status.generating,
        .job-status.creating_draft {
          background: #fff3e0;
          color: #e65100;
        }

        .job-status.analyzed,
        .job-status.generated {
          background: #e3f2fd;
          color: #1565c0;
        }

        .job-status.ready_for_draft {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .job-status.draft_created {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .job-status.error {
          background: #ffebee;
          color: #c62828;
        }

        @media (max-width: 1200px) {
          .recent-jobs {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
