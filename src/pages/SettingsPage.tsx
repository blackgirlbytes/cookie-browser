import React, { useState, useEffect } from 'react';
import './SettingsPage.css';

interface Settings {
  theme: 'pink' | 'lavender' | 'mint' | 'golden';
}

const STORAGE_KEY = 'cookie-settings';

const themes = [
  { id: 'pink', name: 'Pink Dream', emoji: '🌸', gradient: 'linear-gradient(135deg, #FFE8E0 0%, #FFD6E8 50%, #B4648C 100%)' },
  { id: 'lavender', name: 'Lavender Cloud', emoji: '💜', gradient: 'linear-gradient(135deg, #F0E8FF 0%, #E8D8FF 50%, #8C78B4 100%)' },
  { id: 'mint', name: 'Mint Garden', emoji: '🌿', gradient: 'linear-gradient(135deg, #E8F5E8 0%, #D8F0E0 50%, #64A078 100%)' },
  { id: 'golden', name: 'Golden Hour', emoji: '🌅', gradient: 'linear-gradient(135deg, #FFF5E6 0%, #FFE8D0 50%, #D4A574 100%)' },
] as const;

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    theme: 'pink',
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Apply theme to document
    if (newSettings.theme) {
      document.documentElement.setAttribute('data-theme', newSettings.theme);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-content fade-in">
        <h1>⚙️ Settings</h1>

        <section className="settings-section card">
          <h2>Theme</h2>
          <p className="section-description">
            Choose your favorite color palette for Cookie Browser.
          </p>
          <div className="theme-grid">
            {themes.map((theme) => (
              <button
                key={theme.id}
                className={`theme-option ${settings.theme === theme.id ? 'theme-active' : ''}`}
                onClick={() => updateSettings({ theme: theme.id })}
              >
                <span className="theme-emoji">{theme.emoji}</span>
                <span className="theme-name">{theme.name}</span>
                <span
                  className="theme-swatch"
                  style={{ background: theme.gradient }}
                />
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section card">
          <h2>About Cookie Browser</h2>
          <div className="about-content">
            <div className="about-logo">🍪</div>
            <p>
              <strong>Cookie Browser</strong> is a cozy, handcrafted web browser
              made with love. Every pixel was designed to feel warm and inviting.
            </p>
            <p className="version">Version 1.0.0</p>
          </div>
        </section>

        <section className="settings-section card">
          <h2>Data</h2>
          <p className="section-description">
            Manage your browsing data stored locally.
          </p>
          <div className="data-actions">
            <button
              className="btn"
              onClick={() => {
                localStorage.removeItem('cookie-history');
                alert('History cleared!');
              }}
            >
              Clear History
            </button>
            <button
              className="btn btn-lavender"
              onClick={() => {
                localStorage.removeItem('cookie-bookmarks');
                alert('Bookmarks cleared!');
              }}
            >
              Clear Bookmarks
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

// Helper to get current theme
export const getCurrentTheme = (): string => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const settings = JSON.parse(stored);
      return settings.theme || 'pink';
    } catch (e) {
      return 'pink';
    }
  }
  return 'pink';
};
