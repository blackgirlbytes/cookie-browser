import React, { useState, useEffect } from 'react';
import './Toolbar.css';

interface ToolbarProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onBookmarks: () => void;
  onHistory: () => void;
  onSettings: () => void;
  onCookieJar: () => void;
  onBreadcrumbs: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentUrl,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onHome,
  onBookmarks,
  onHistory,
  onSettings,
  onCookieJar,
  onBreadcrumbs,
  canGoBack,
  canGoForward,
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl);

  useEffect(() => {
    setInputUrl(currentUrl);
  }, [currentUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onNavigate(inputUrl.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setInputUrl(currentUrl);
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-nav-buttons">
        <button
          className="icon-btn"
          onClick={onBack}
          disabled={!canGoBack}
          aria-label="Go back"
          title="Go back"
        >
          ←
        </button>
        <button
          className="icon-btn"
          onClick={onForward}
          disabled={!canGoForward}
          aria-label="Go forward"
          title="Go forward"
        >
          →
        </button>
        <button
          className="icon-btn"
          onClick={onReload}
          aria-label="Reload"
          title="Reload page"
        >
          ↻
        </button>
        <button
          className="icon-btn"
          onClick={onHome}
          aria-label="Home"
          title="Go to home page"
        >
          🏠
        </button>
      </div>

      <form className="url-bar-container" onSubmit={handleSubmit}>
        <input
          type="text"
          className="url-bar"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search or enter URL..."
          aria-label="URL bar"
        />
        <button type="submit" className="go-btn" aria-label="Go">
          Go
        </button>
      </form>

      <div className="toolbar-action-buttons">
        <button
          className="icon-btn"
          onClick={onBreadcrumbs}
          aria-label="Breadcrumbs"
          title="How did I get here?"
        >
          🍞
        </button>
        <button
          className="icon-btn"
          onClick={onCookieJar}
          aria-label="Cookie Jar"
          title="View closed tabs"
        >
          🫙
        </button>
        <button
          className="icon-btn"
          onClick={onBookmarks}
          aria-label="Bookmarks"
          title="View bookmarks"
        >
          📚
        </button>
        <button
          className="icon-btn"
          onClick={onHistory}
          aria-label="History"
          title="View history"
        >
          🕐
        </button>
        <button
          className="icon-btn"
          onClick={onSettings}
          aria-label="Settings"
          title="Settings"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
};
