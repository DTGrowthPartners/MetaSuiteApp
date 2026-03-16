import { Loader2, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import './Skeleton.css';

export function Skeleton({ width, height, variant = 'rect', style = {}, className = '' }) {
  return (
    <div
      className={`skeleton skeleton--${variant} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style
      }}
    />
  );
}

export function Spinner({ size = 'md', text = '' }) {
  return (
    <span className={`spinner-container spinner-container--${size}`}>
      <Loader2 />
      {text && <span>{text}</span>}
    </span>
  );
}

export function ProgressLogItem({ text, status = 'pending' }) {
  const icons = {
    pending: <Loader2 size={14} />,
    success: <Check size={14} />,
    error: <AlertCircle size={14} />,
    warning: <AlertTriangle size={14} />
  };

  return (
    <div className="progress-log-item">
      <span className={`progress-log-item-icon progress-log-item-icon--${status}`}>
        {icons[status] || icons.pending}
      </span>
      <span>{text}</span>
    </div>
  );
}
