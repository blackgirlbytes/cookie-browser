import React, { useState, useEffect } from 'react';
import './NewTabPage.css';

interface QuickLink {
  title: string;
  url: string;
  emoji: string;
}

const quickLinks: QuickLink[] = [
  { title: 'Google', url: 'https://google.com', emoji: '🔍' },
  { title: 'YouTube', url: 'https://youtube.com', emoji: '📺' },
  { title: 'GitHub', url: 'https://github.com', emoji: '🐙' },
  { title: 'Twitter', url: 'https://twitter.com', emoji: '🐦' },
  { title: 'Reddit', url: 'https://reddit.com', emoji: '🤖' },
  { title: 'Wikipedia', url: 'https://wikipedia.org', emoji: '📚' },
  { title: 'Amazon', url: 'https://amazon.com', emoji: '📦' },
  { title: 'Netflix', url: 'https://netflix.com', emoji: '🎬' },
];

interface NewTabPageProps {
  onNavigate: (url: string) => void;
}

export const NewTabPage: React.FC<NewTabPageProps> = ({ onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 5) return 'Sweet dreams! 🌙';
    if (hour < 12) return 'Good morning! ☀️';
    if (hour < 17) return 'Good afternoon! 🌤️';
    if (hour < 21) return 'Good evening! 🌅';
    return 'Good night! 🌙';
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Check if it's a URL
      if (searchQuery.includes('.') && !searchQuery.includes(' ')) {
        onNavigate(searchQuery);
      } else {
        // Search with Google
        onNavigate(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  return (
    <div className="new-tab-page">
      <div className="new-tab-content fade-in">
        <div className="cookie-mascot">🍪</div>
        
        <h1 className="greeting">{getGreeting()}</h1>
        
        <div className="time-display">
          <span className="time">{formatTime()}</span>
          <span className="date">{formatDate()}</span>
        </div>

        <form className="search-container" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-bar"
            placeholder="Search the web or enter a URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-btn">
            Search 🔍
          </button>
        </form>

        <div className="quick-links">
          <h2 className="quick-links-title">Quick Links</h2>
          <div className="quick-links-grid">
            {quickLinks.map((link) => (
              <button
                key={link.url}
                className="quick-link"
                onClick={() => onNavigate(link.url)}
              >
                <span className="quick-link-emoji">{link.emoji}</span>
                <span className="quick-link-title">{link.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
