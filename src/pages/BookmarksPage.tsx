import React, { useState, useEffect } from 'react';
import './BookmarksPage.css';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

interface BookmarksPageProps {
  onNavigate: (url: string) => void;
}

const STORAGE_KEY = 'cookie-bookmarks';

export const BookmarksPage: React.FC<BookmarksPageProps> = ({ onNavigate }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBookmarks(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse bookmarks:', e);
      }
    }
  }, []);

  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));
  };

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newUrl.trim()) {
      const bookmark: Bookmark = {
        id: Date.now().toString(),
        title: newTitle.trim(),
        url: newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`,
        createdAt: Date.now(),
      };
      saveBookmarks([bookmark, ...bookmarks]);
      setNewTitle('');
      setNewUrl('');
      setShowForm(false);
    }
  };

  const handleDeleteBookmark = (id: string) => {
    saveBookmarks(bookmarks.filter((b) => b.id !== id));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bookmarks-page">
      <div className="bookmarks-content fade-in">
        <div className="bookmarks-header">
          <h1>📚 Bookmarks</h1>
          <button
            className="btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Add Bookmark'}
          </button>
        </div>

        {showForm && (
          <form className="bookmark-form card" onSubmit={handleAddBookmark}>
            <h3>Add New Bookmark</h3>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="My Favorite Site"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="url">URL</label>
              <input
                id="url"
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>
            <button type="submit" className="btn btn-sage">
              Save Bookmark
            </button>
          </form>
        )}

        {bookmarks.length === 0 ? (
          <div className="empty-state card">
            <span className="empty-emoji">📖</span>
            <h2>No bookmarks yet!</h2>
            <p>Save your favorite sites for quick access.</p>
          </div>
        ) : (
          <div className="bookmarks-list">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bookmark-item card">
                <div
                  className="bookmark-info"
                  onClick={() => onNavigate(bookmark.url)}
                >
                  <span className="bookmark-favicon">🔖</span>
                  <div className="bookmark-details">
                    <span className="bookmark-title">{bookmark.title}</span>
                    <span className="bookmark-url">{bookmark.url}</span>
                    <span className="bookmark-date">
                      Added {formatDate(bookmark.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteBookmark(bookmark.id)}
                  aria-label="Delete bookmark"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
