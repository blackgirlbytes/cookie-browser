import React from 'react';
import './TabBar.css';

export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab,
}) => {
  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? 'tab-active' : ''}`}
            onClick={() => onTabClick(tab.id)}
          >
            <span className="tab-favicon">
              {tab.favicon ? (
                <img src={tab.favicon} alt="" />
              ) : (
                '🍪'
              )}
            </span>
            <span className="tab-title">{tab.title || 'New Tab'}</span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              aria-label="Close tab"
            >
              ×
            </button>
          </div>
        ))}
        <button className="new-tab-btn" onClick={onNewTab} aria-label="New tab">
          +
        </button>
      </div>
    </div>
  );
};
