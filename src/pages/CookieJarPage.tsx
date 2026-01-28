import React, { useState, useEffect } from 'react';
import { 
  getJar, 
  restoreFromJar, 
  clearJar, 
  cleanExpired,
  getTimeAgo,
  getSessions,
  restoreSession,
  deleteSession,
  cleanExpiredSessions,
  clearSessions,
  type CookieJarEntry,
  type Session,
  type SessionTab,
} from '../utils/cookieJar';
import type { Breadcrumb } from '../utils/breadcrumbs';
import './CookieJarPage.css';

interface CookieJarPageProps {
  onNavigate: (url: string) => void;
  onRestoreTab: (url: string, title: string, favicon?: string, breadcrumbs?: Breadcrumb[]) => void;
  onRestoreSession?: (tabs: SessionTab[]) => void;
}

export const CookieJarPage: React.FC<CookieJarPageProps> = ({ 
  onRestoreTab,
  onRestoreSession,
}) => {
  const [entries, setEntries] = useState<CookieJarEntry[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Clean expired entries on load
    cleanExpired();
    cleanExpiredSessions();
    setEntries(getJar());
    setSessions(getSessions());
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

  const handleClearSessions = () => {
    clearSessions();
    setSessions([]);
  };

  const handleRestoreSession = (session: Session) => {
    const tabs = restoreSession(session.id);
    if (tabs && tabs.length > 0) {
      setSessions(getSessions());
      
      if (onRestoreSession) {
        // Use the dedicated session restore handler if available
        onRestoreSession(tabs);
      } else {
        // Fall back to restoring tabs one by one
        tabs.forEach((tab, index) => {
          // Small delay between tabs to avoid race conditions
          setTimeout(() => {
            onRestoreTab(tab.url, tab.title, tab.favicon, tab.breadcrumbs);
          }, index * 100);
        });
      }
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteSession(sessionId);
    setSessions(getSessions());
  };

  const toggleSessionExpanded = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
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
  const hasContent = entries.length > 0 || sessions.length > 0;

  return (
    <div className="cookie-jar-page">
      <div className="cookie-jar-content fade-in">
        <div className="cookie-jar-header">
          <h1>🫙 Cookie Jar</h1>
          <p className="cookie-jar-subtitle">Your recently closed tabs and saved sessions are safe here</p>
          {hasContent && (
            <div className="header-actions">
              {entries.length > 0 && (
                <button className="btn" onClick={handleClear}>
                  Clear Tabs
                </button>
              )}
              {sessions.length > 0 && (
                <button className="btn" onClick={handleClearSessions}>
                  Clear Sessions
                </button>
              )}
            </div>
          )}
        </div>

        {!hasContent ? (
          <div className="empty-state card">
            <span className="empty-emoji">🫙</span>
            <h2>Your Cookie Jar is empty!</h2>
            <p>Closed tabs and saved sessions will appear here so you never lose them.</p>
            <p className="empty-hint">Items are kept for 7 days before expiring.</p>
          </div>
        ) : (
          <>
            {/* Sessions Section */}
            {sessions.length > 0 && (
              <div className="sessions-section">
                <h2 className="section-title">✨ Saved Sessions</h2>
                <div className="sessions-list">
                  {sessions.map((session) => (
                    <div key={session.id} className="session-card card">
                      <div 
                        className="session-header"
                        onClick={() => toggleSessionExpanded(session.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            toggleSessionExpanded(session.id);
                          }
                        }}
                      >
                        <span className="session-expand-icon">
                          {expandedSessions.has(session.id) ? '▼' : '▶'}
                        </span>
                        <div className="session-info">
                          <span className="session-name">{session.name}</span>
                          <span className="session-meta">
                            {session.tabs.length} tab{session.tabs.length === 1 ? '' : 's'} • {getTimeAgo(session.savedAt)}
                          </span>
                        </div>
                        <div className="session-actions">
                          <button
                            className="session-restore-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreSession(session);
                            }}
                            aria-label="Restore all tabs"
                            title="Restore all tabs"
                          >
                            ↗️ Restore All
                          </button>
                          <button
                            className="session-delete-btn"
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            aria-label="Delete session"
                            title="Delete session"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      {expandedSessions.has(session.id) && (
                        <div className="session-tabs">
                          {session.tabs.map((tab, index) => (
                            <div 
                              key={index} 
                              className="session-tab-item"
                              onClick={() => onRestoreTab(tab.url, tab.title, tab.favicon, tab.breadcrumbs)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  onRestoreTab(tab.url, tab.title, tab.favicon, tab.breadcrumbs);
                                }
                              }}
                            >
                              <span className="tab-favicon">
                                {tab.favicon ? (
                                  <img src={tab.favicon} alt="" />
                                ) : (
                                  '🍪'
                                )}
                              </span>
                              <div className="tab-details">
                                <span className="tab-title">{tab.title}</span>
                                <span className="tab-url">{tab.url}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Tabs Section */}
            {entries.length > 0 && (
              <div className="jar-groups">
                {sessions.length > 0 && (
                  <h2 className="section-title">🍪 Individual Tabs</h2>
                )}
                {Object.entries(groupedEntries).map(([date, items]) => (
                  <div key={date} className="jar-group">
                    <h3 className="jar-date">{date}</h3>
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
          </>
        )}
      </div>
    </div>
  );
};
