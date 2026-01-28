import React from 'react';
import type { Breadcrumb } from '../utils/breadcrumbs';
import './BreadcrumbsPopover.css';

interface BreadcrumbsPopoverProps {
  trail: Breadcrumb[];
  onNavigate: (url: string) => void;
  onClose: () => void;
}

export const BreadcrumbsPopover: React.FC<BreadcrumbsPopoverProps> = ({
  trail,
  onNavigate,
  onClose,
}) => {
  const handleCrumbClick = (url: string) => {
    onNavigate(url);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Format title for display (truncate if too long)
  const formatTitle = (title: string): string => {
    if (title.length > 40) {
      return title.substring(0, 37) + '...';
    }
    return title;
  };

  // Get domain from URL for display
  const getDomain = (url: string): string => {
    if (url.startsWith('cookie://')) {
      return url.replace('cookie://', '');
    }
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="breadcrumbs-backdrop" onClick={handleBackdropClick}>
      <div className="breadcrumbs-popover">
        <div className="breadcrumbs-header">
          <h3>🍞 How did I get here?</h3>
          <button className="breadcrumbs-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        
        <div className="breadcrumbs-content">
          {trail.length === 0 ? (
            <p className="breadcrumbs-empty">No navigation history yet.</p>
          ) : (
            <div className="breadcrumbs-trail">
              {trail.map((crumb, index) => (
                <React.Fragment key={`${crumb.url}-${crumb.timestamp}`}>
                  <button
                    className={`breadcrumb-item ${index === trail.length - 1 ? 'current' : ''}`}
                    onClick={() => handleCrumbClick(crumb.url)}
                    title={crumb.url}
                  >
                    <span className="breadcrumb-title">{formatTitle(crumb.title)}</span>
                    <span className="breadcrumb-domain">{getDomain(crumb.url)}</span>
                  </button>
                  {index < trail.length - 1 && (
                    <span className="breadcrumb-arrow">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
