import { useState, useEffect, useCallback, useRef } from 'react';
import { TabBar, type Tab } from './components/TabBar';
import { Toolbar } from './components/Toolbar';
import { BreadcrumbsPopover } from './components/BreadcrumbsPopover';
import { NewTabPage } from './pages/NewTabPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { HistoryPage, addHistoryEntry } from './pages/HistoryPage';
import { SettingsPage, getCurrentTheme } from './pages/SettingsPage';
import { CookieJarPage } from './pages/CookieJarPage';
import { addToJar } from './utils/cookieJar';
import { addCrumb, clearTrail, exportTrail, getTrail, setTrail, type Breadcrumb } from './utils/breadcrumbs';
import './App.css';
import './types/electron.d.ts';

type InternalPage = 'newtab' | 'bookmarks' | 'history' | 'settings' | 'jar' | null;

interface HistoryEntry {
  url: string;
  title: string;
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'New Tab', url: 'cookie://newtab' },
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [currentUrl, setCurrentUrl] = useState('cookie://newtab');
  const [internalPage, setInternalPage] = useState<InternalPage>('newtab');
  
  // Unified history stack for back/forward navigation
  const [historyStack, setHistoryStack] = useState<HistoryEntry[]>([
    { url: 'cookie://newtab', title: 'New Tab' }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isNavigatingRef = useRef(false); // Prevent adding to history during back/forward
  
  // Breadcrumbs state
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(false);

  // Initialize breadcrumbs for the first tab
  useEffect(() => {
    addCrumb('1', 'cookie://newtab', 'New Tab');
  }, []);

  // Apply saved theme on load
  useEffect(() => {
    const theme = getCurrentTheme();
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  // Use a ref to track history state for the event listener (avoids stale closure)
  const historyRef = useRef({ stack: historyStack, index: historyIndex });
  useEffect(() => {
    historyRef.current = { stack: historyStack, index: historyIndex };
  }, [historyStack, historyIndex]);

  // Listen for BrowserView navigation events (for in-page navigation within external sites)
  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubscribeNavigated = window.electronAPI.onBrowserViewNavigated((data) => {
      setCurrentUrl(data.url);
      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === activeTabId ? { ...tab, url: data.url, title: data.title } : tab
        )
      );
      
      // Add to our history stack if this is a user-initiated navigation (not from our back/forward)
      if (!isNavigatingRef.current) {
        const { stack, index } = historyRef.current;
        const newStack = stack.slice(0, index + 1);
        
        // Don't add duplicate consecutive entries
        if (newStack.length > 0 && newStack[newStack.length - 1].url === data.url) {
          return; // Don't add duplicate
        }
        
        newStack.push({ url: data.url, title: data.title });
        setHistoryStack(newStack);
        setHistoryIndex(newStack.length - 1);
        
        // Add to breadcrumbs trail for this tab
        addCrumb(activeTabId, data.url, data.title);
        
        // Also add to persistent browsing history
        addHistoryEntry(data.title, data.url);
      }
    });

    const unsubscribeTitleUpdated = window.electronAPI.onBrowserViewTitleUpdated((data) => {
      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === activeTabId ? { ...tab, title: data.title } : tab
        )
      );
      // Update title in history stack for current entry
      setHistoryStack((prev) => {
        const updated = [...prev];
        // Update the most recent entry with this URL
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].url === data.url) {
            updated[i] = { ...updated[i], title: data.title };
            break;
          }
        }
        return updated;
      });
    });

    return () => {
      unsubscribeNavigated();
      unsubscribeTitleUpdated();
    };
  }, [activeTabId]);

  const updateActiveTab = useCallback((updates: Partial<Tab>) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId ? { ...tab, ...updates } : tab
      )
    );
  }, [activeTabId]);

  const parseInternalUrl = (url: string): InternalPage => {
    if (url === 'cookie://newtab') return 'newtab';
    if (url === 'cookie://bookmarks') return 'bookmarks';
    if (url === 'cookie://history') return 'history';
    if (url === 'cookie://settings') return 'settings';
    if (url === 'cookie://jar') return 'jar';
    return null;
  };

  const getInternalPageTitle = (page: InternalPage): string => {
    switch (page) {
      case 'newtab': return 'New Tab';
      case 'bookmarks': return 'Bookmarks';
      case 'history': return 'History';
      case 'settings': return 'Settings';
      case 'jar': return 'Cookie Jar';
      default: return 'Cookie Browser';
    }
  };

  // Navigate to a URL and show the appropriate view
  // Note: For external URLs, persistent history is added via onBrowserViewNavigated listener
  // to get the correct title. This function does NOT add external URLs to persistent history.
  const showUrl = useCallback(async (url: string, title: string, _addToHistory: boolean = true) => {
    const internal = parseInternalUrl(url);
    
    setCurrentUrl(url);
    setInternalPage(internal);
    updateActiveTab({ url, title });
    
    if (internal) {
      // Internal page - hide BrowserView
      if (window.electronAPI) {
        await window.electronAPI.closeBrowserView();
      }
    } else {
      // External URL - show BrowserView
      // Persistent history will be added by onBrowserViewNavigated listener
      if (window.electronAPI) {
        try {
          const result = await window.electronAPI.navigateToUrl(url);
          if (result.success && result.title) {
            updateActiveTab({ title: result.title });
          }
        } catch (e) {
          console.error('Failed to navigate:', e);
        }
      }
    }
  }, [updateActiveTab]);

  const navigateToUrl = useCallback(async (url: string) => {
    if (isNavigatingRef.current) return;
    
    const internal = parseInternalUrl(url);
    const title = internal ? getInternalPageTitle(internal) : 'Loading...';
    
    // Only add internal pages to history here - external URLs will be added 
    // by the BrowserView navigation event listener to avoid duplicates
    if (internal) {
      const newStack = historyStack.slice(0, historyIndex + 1);
      
      // Don't add duplicate consecutive entries
      if (newStack.length === 0 || newStack[newStack.length - 1].url !== url) {
        newStack.push({ url, title });
      }
      
      setHistoryStack(newStack);
      setHistoryIndex(newStack.length - 1);
      
      // Add to breadcrumbs trail for internal pages
      addCrumb(activeTabId, url, title);
    }
    
    // Show the URL
    await showUrl(url, title);
  }, [historyStack, historyIndex, showUrl, activeTabId]);

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      // Reset history for this tab switch
      setHistoryStack([{ url: tab.url, title: tab.title }]);
      setHistoryIndex(0);
      
      const internal = parseInternalUrl(tab.url);
      setInternalPage(internal);
      setCurrentUrl(tab.url);
      
      if (!internal && window.electronAPI) {
        window.electronAPI.navigateToUrl(tab.url);
      } else if (internal && window.electronAPI) {
        window.electronAPI.closeBrowserView();
      }
    }
  }, [tabs]);

  const handleTabClose = useCallback((tabId: string) => {
    // Find the tab being closed to save to Cookie Jar
    const closingTab = tabs.find((t) => t.id === tabId);
    
    // Save to Cookie Jar (unless it's a new tab or internal page)
    if (closingTab && closingTab.url !== 'cookie://newtab') {
      // Export breadcrumbs trail before saving to Cookie Jar
      const breadcrumbs = exportTrail(tabId);
      addToJar(closingTab.url, closingTab.title, closingTab.favicon, breadcrumbs);
    }
    
    // Clear breadcrumbs for the closed tab
    clearTrail(tabId);
    
    if (tabs.length === 1) {
      const newTabId = Date.now().toString();
      setTabs([{ id: newTabId, title: 'New Tab', url: 'cookie://newtab' }]);
      setActiveTabId(newTabId);
      setInternalPage('newtab');
      setCurrentUrl('cookie://newtab');
      setHistoryStack([{ url: 'cookie://newtab', title: 'New Tab' }]);
      setHistoryIndex(0);
      // Initialize breadcrumbs for the new tab
      addCrumb(newTabId, 'cookie://newtab', 'New Tab');
      if (window.electronAPI) {
        window.electronAPI.closeBrowserView();
      }
      return;
    }

    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);

    if (tabId === activeTabId) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
      const newActiveTab = newTabs[newActiveIndex];
      setActiveTabId(newActiveTab.id);
      
      // Reset history for new active tab
      setHistoryStack([{ url: newActiveTab.url, title: newActiveTab.title }]);
      setHistoryIndex(0);
      
      const internal = parseInternalUrl(newActiveTab.url);
      setInternalPage(internal);
      setCurrentUrl(newActiveTab.url);
      
      if (!internal && window.electronAPI) {
        window.electronAPI.navigateToUrl(newActiveTab.url);
      } else if (internal && window.electronAPI) {
        window.electronAPI.closeBrowserView();
      }
    }
  }, [tabs, activeTabId]);

  const handleNewTab = useCallback(() => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: 'New Tab',
      url: 'cookie://newtab',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setInternalPage('newtab');
    setCurrentUrl('cookie://newtab');
    setHistoryStack([{ url: 'cookie://newtab', title: 'New Tab' }]);
    setHistoryIndex(0);
    // Initialize breadcrumbs for the new tab
    addCrumb(newTab.id, 'cookie://newtab', 'New Tab');
    if (window.electronAPI) {
      window.electronAPI.closeBrowserView();
    }
  }, []);

  const handleBack = useCallback(async () => {
    if (historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    const entry = historyStack[newIndex];
    
    // Safety check
    if (!entry) {
      console.error('No history entry at index', newIndex);
      return;
    }
    
    isNavigatingRef.current = true;
    setHistoryIndex(newIndex);
    // Don't add to persistent history when navigating back
    await showUrl(entry.url, entry.title, false);
    
    // Small delay to prevent race conditions
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 150);
  }, [historyIndex, historyStack, showUrl]);

  const handleForward = useCallback(async () => {
    if (historyIndex >= historyStack.length - 1) return;
    
    const newIndex = historyIndex + 1;
    const entry = historyStack[newIndex];
    
    // Safety check
    if (!entry) {
      console.error('No history entry at index', newIndex);
      return;
    }
    
    isNavigatingRef.current = true;
    setHistoryIndex(newIndex);
    // Don't add to persistent history when navigating forward
    await showUrl(entry.url, entry.title, false);
    
    // Small delay to prevent race conditions
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 150);
  }, [historyIndex, historyStack, showUrl]);

  const handleReload = useCallback(async () => {
    if (window.electronAPI && !internalPage) {
      await window.electronAPI.reload();
    }
  }, [internalPage]);

  const handleHome = useCallback(() => {
    navigateToUrl('cookie://newtab');
  }, [navigateToUrl]);

  const handleBookmarks = useCallback(() => {
    navigateToUrl('cookie://bookmarks');
  }, [navigateToUrl]);

  const handleHistory = useCallback(() => {
    navigateToUrl('cookie://history');
  }, [navigateToUrl]);

  const handleSettings = useCallback(() => {
    navigateToUrl('cookie://settings');
  }, [navigateToUrl]);

  const handleCookieJar = useCallback(() => {
    navigateToUrl('cookie://jar');
  }, [navigateToUrl]);

  const handleBreadcrumbs = useCallback(() => {
    setShowBreadcrumbs((prev) => !prev);
  }, []);

  // Restore a tab from the Cookie Jar
  const handleRestoreTab = useCallback((url: string, title: string, favicon?: string, breadcrumbs?: Breadcrumb[]) => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title,
      url,
      favicon,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    
    const internal = parseInternalUrl(url);
    setInternalPage(internal);
    setCurrentUrl(url);
    setHistoryStack([{ url, title }]);
    setHistoryIndex(0);
    
    // Restore breadcrumbs trail if available
    if (breadcrumbs && breadcrumbs.length > 0) {
      setTrail(newTab.id, breadcrumbs);
    } else {
      // Initialize with current page if no breadcrumbs
      addCrumb(newTab.id, url, title);
    }
    
    if (!internal && window.electronAPI) {
      window.electronAPI.navigateToUrl(url);
    } else if (internal && window.electronAPI) {
      window.electronAPI.closeBrowserView();
    }
  }, []);

  const renderInternalPage = () => {
    switch (internalPage) {
      case 'newtab':
        return <NewTabPage onNavigate={navigateToUrl} />;
      case 'bookmarks':
        return <BookmarksPage onNavigate={navigateToUrl} />;
      case 'history':
        return <HistoryPage onNavigate={navigateToUrl} />;
      case 'settings':
        return <SettingsPage />;
      case 'jar':
        return <CookieJarPage onNavigate={navigateToUrl} onRestoreTab={handleRestoreTab} />;
      default:
        return null;
    }
  };

  // Determine if back/forward buttons should be enabled
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < historyStack.length - 1;

  return (
    <div className="app">
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onNewTab={handleNewTab}
      />
      <Toolbar
        currentUrl={currentUrl}
        onNavigate={navigateToUrl}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onHome={handleHome}
        onBookmarks={handleBookmarks}
        onHistory={handleHistory}
        onSettings={handleSettings}
        onCookieJar={handleCookieJar}
        onBreadcrumbs={handleBreadcrumbs}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
      />
      <main className="content">
        {internalPage && renderInternalPage()}
      </main>
      {showBreadcrumbs && (
        <BreadcrumbsPopover
          trail={getTrail(activeTabId)}
          onNavigate={navigateToUrl}
          onClose={() => setShowBreadcrumbs(false)}
        />
      )}
    </div>
  );
}

export default App;
