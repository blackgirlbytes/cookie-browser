import React, { useState, useEffect } from 'react';
import { getJar, restoreFromJar, clearJar, getTimeAgo, type CookieJarEntry } from '../utils/cookieJar';
import './CookieJarPage.css';

interface CookieJarPageProps {
  onNavigate: (url: string) => void;
  onRestoreTab?: (url: string, title: string) => void;
}

export const CookieJarPage: React.FC<CookieJarPageProps> = ({ onNavigate, onRestoreTab }) => {
  const [jarEntries, setJarEntries] = useState<CookieJarEntry[]>([]);

  const loadJar = () => {
    const entries = getJar();
    setJarEntries(entries);
  };

  useEffect(() => {
    loadJar();
    
    // Refresh every minute to update "time ago" labels
    const interval = setInterval(loadJar, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRestore = (entry: CookieJarEntry) => {
    restoreFromJar(entry.id);
    
    // If there's a custom restore handler, use it (for creating new tabs)
    if (onRestoreTab) {
      onRestoreTab(entry.url, entry.title);
    } else {
      // Otherwise just navigate
      onNavigate(entry.url);
    }
    
    // Refresh the jar display
    loadJar();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all saved tabs? This cannot be undone.')) {
      clearJar();
      loadJar();
    }
  };

  return (
    <div className="cookie-jar-page">
      <div className="jar-content fade-in">
        <div className="jar-header">
          <h1>🫙 Cookie Jar</h1>
          {jarEntries.length > 0 && (
            <button className="btn" onClick={handleClearAll}>
              Clear All
            </button>
          )}
        </div>

        <p className="jar-subtitle">
          Your safety net for closed tabs. Tabs are saved for 7 days.
        </p>

        {jarEntries.length === 0 ? (
          <div className="empty-state card">
            <span className="empty-emoji">🍪</span>
            <h2>Your jar is empty!</h2>
            <p>Closed tabs will appear here so you can restore them later.</p>
          </div>
        ) : (
          <div className="jar-list">
            {jarEntries.map((entry) => (
              <div
                key={entry.id}
                className="jar-item card"
                onClick={() => handleRestore(entry)}
              >
                <div className="jar-item-icon">
                  {entry.favicon ? (
                    <img src={entry.favicon} alt="" className="favicon" />
                  ) : (
                    <span className="default-icon">🌐</span>
                  )}
                </div>
                <div className="jar-item-details">
                  <span className="jar-item-title">
                    {entry.title || 'Untitled'}
                  </span>
                  <span className="jar-item-url">{entry.url}</span>
                  <span className="jar-item-time">
                    Closed {getTimeAgo(entry.closedAt)}
                  </span>
                </div>
                <button 
                  className="restore-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(entry);
                  }}
                  aria-label="Restore tab"
                >
                  ↺
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
