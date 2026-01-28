import React, { useState, useEffect } from 'react';
import { 
  getJar, 
  restoreFromJar, 
  clearJar, 
  cleanExpired,
  getTimeAgo,
  type CookieJarEntry 
} from '../utils/cookieJar';
import type { Breadcrumb } from '../utils/breadcrumbs';
import './CookieJarPage.css';

interface CookieJarPageProps {
  onNavigate: (url: string) => void;
  onRestoreTab: (url: string, title: string, favicon?: string, breadcrumbs?: Breadcrumb[]) => void;
}

export const CookieJarPage: React.FC<CookieJarPageProps> = ({ 
  onRestoreTab 
}) => {
  const [entries, setEntries] = useState<CookieJarEntry[]>([]);

  useEffect(() => {
    // Clean expired entries on load
    cleanExpired();
    setEntries(getJar());
  }, []);

  const handleRestore = (entry: CookieJarEntry) => {
    const restored = restoreFromJar(entry.id);
    if (restored) {
      setEntries(getJar());
      onRestoreTab(restored.url, restored.title, restored.favicon, restored.breadcrumbs);
    }
  };

  const handleClear = () => {
    clearJar();
    setEntries([]);
  };

  const groupByDate = (items: CookieJarEntry[]) => {
    const groups: { [key: string]: CookieJarEntry[] } = {};
    
    items.forEach((entry) => {
      const date = new Date(entry.closedAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    });
    
    return groups;
  };

  const groupedEntries = groupByDate(entries);

  return (
    <div className="cookie-jar-page">
      <div className="cookie-jar-content fade-in">
        <div className="cookie-jar-header">
          <h1>🫙 Cookie Jar</h1>
          <p className="cookie-jar-subtitle">Your recently closed tabs are safe here</p>
          {entries.length > 0 && (
            <button className="btn" onClick={handleClear}>
              Empty Jar
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="empty-state card">
            <span className="empty-emoji">🫙</span>
            <h2>Your Cookie Jar is empty!</h2>
            <p>Closed tabs will appear here so you never lose them.</p>
            <p className="empty-hint">Tabs are kept for 7 days before expiring.</p>
          </div>
        ) : (
          <div className="jar-groups">
            {Object.entries(groupedEntries).map(([date, items]) => (
              <div key={date} className="jar-group">
                <h2 className="jar-date">{date}</h2>
                <div className="jar-list">
                  {items.map((entry) => (
                    <div
                      key={entry.id}
                      className="jar-item card"
                      onClick={() => handleRestore(entry)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleRestore(entry);
                        }
                      }}
                    >
                      <span className="jar-favicon">
                        {entry.favicon ? (
                          <img src={entry.favicon} alt="" />
                        ) : (
                          '🍪'
                        )}
                      </span>
                      <div className="jar-details">
                        <span className="jar-title">
                          {entry.title || 'Untitled'}
                        </span>
                        <span className="jar-url">{entry.url}</span>
                      </div>
                      <span className="jar-time">
                        {getTimeAgo(entry.closedAt)}
                      </span>
                      <button 
                        className="jar-restore-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(entry);
                        }}
                        aria-label="Restore tab"
                      >
                        ↗️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
