import React, { useState, useEffect } from 'react';
import './HistoryPage.css';

export interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  visitedAt: number;
}

interface HistoryPageProps {
  onNavigate: (url: string) => void;
}

const STORAGE_KEY = 'cookie-history';

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
  }, []);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const groupByDate = (entries: HistoryEntry[]) => {
    const groups: { [key: string]: HistoryEntry[] } = {};
    
    entries.forEach((entry) => {
      const date = new Date(entry.visitedAt);
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

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const groupedHistory = groupByDate(history);

  return (
    <div className="history-page">
      <div className="history-content fade-in">
        <div className="history-header">
          <h1>📜 History</h1>
          {history.length > 0 && (
            <button className="btn" onClick={clearHistory}>
              Clear History
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="empty-state card">
            <span className="empty-emoji">🕐</span>
            <h2>No history yet!</h2>
            <p>Your browsing history will appear here.</p>
          </div>
        ) : (
          <div className="history-groups">
            {Object.entries(groupedHistory).map(([date, entries]) => (
              <div key={date} className="history-group">
                <h2 className="history-date">{date}</h2>
                <div className="history-list">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="history-item card"
                      onClick={() => onNavigate(entry.url)}
                    >
                      <span className="history-time">
                        {formatTime(entry.visitedAt)}
                      </span>
                      <div className="history-details">
                        <span className="history-title">
                          {entry.title || 'Untitled'}
                        </span>
                        <span className="history-url">{entry.url}</span>
                      </div>
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

// Helper function to add history entry (exported for use in App)
export const addHistoryEntry = (title: string, url: string) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  let history: HistoryEntry[] = [];
  
  if (stored) {
    try {
      history = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse history:', e);
    }
  }
  
  const entry: HistoryEntry = {
    id: Date.now().toString(),
    title,
    url,
    visitedAt: Date.now(),
  };
  
  // Add to beginning, limit to 100 entries
  history = [entry, ...history].slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};
