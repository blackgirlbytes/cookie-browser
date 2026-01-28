import React, { useState } from 'react';
import { getDefaultSessionName } from '../utils/cookieJar';
import './EasyCloseModal.css';

interface TabInfo {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

interface EasyCloseModalProps {
  tabs: TabInfo[];
  onSaveAndClose: (sessionName: string) => void;
  onJustClose: () => void;
  onCancel: () => void;
}

export const EasyCloseModal: React.FC<EasyCloseModalProps> = ({
  tabs,
  onSaveAndClose,
  onJustClose,
  onCancel,
}) => {
  const [sessionName, setSessionName] = useState(getDefaultSessionName());

  const handleSaveAndClose = () => {
    onSaveAndClose(sessionName.trim() || getDefaultSessionName());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      handleSaveAndClose();
    }
  };

  // Filter out new tab pages from the preview
  const savableTabs = tabs.filter(tab => tab.url !== 'cookie://newtab');

  return (
    <div className="easy-close-overlay" onClick={onCancel}>
      <div 
        className="easy-close-modal card" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-labelledby="easy-close-title"
        aria-modal="true"
      >
        <div className="easy-close-header">
          <span className="easy-close-emoji">✨</span>
          <h2 id="easy-close-title">Save these tabs as a session?</h2>
        </div>

        <div className="easy-close-content">
          <p className="easy-close-subtitle">
            {savableTabs.length === 0 
              ? "No tabs to save (only new tab pages open)"
              : `${savableTabs.length} tab${savableTabs.length === 1 ? '' : 's'} will be saved to your Cookie Jar`
            }
          </p>

          {savableTabs.length > 0 && (
            <>
              <div className="session-name-input">
                <label htmlFor="session-name">Session name:</label>
                <input
                  id="session-name"
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Enter session name..."
                  autoFocus
                />
              </div>

              <div className="tabs-preview">
                <h3>Tabs to save:</h3>
                <ul className="tabs-list">
                  {savableTabs.map((tab) => (
                    <li key={tab.id} className="tab-preview-item">
                      <span className="tab-favicon">
                        {tab.favicon ? (
                          <img src={tab.favicon} alt="" />
                        ) : (
                          '🍪'
                        )}
                      </span>
                      <span className="tab-title">{tab.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="easy-close-actions">
          <button 
            className="btn btn-secondary" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="btn btn-danger" 
            onClick={onJustClose}
          >
            Just Close
          </button>
          {savableTabs.length > 0 && (
            <button 
              className="btn btn-primary" 
              onClick={handleSaveAndClose}
            >
              Save & Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
