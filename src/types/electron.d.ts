export interface NavigationResult {
  success: boolean;
  title?: string;
  url?: string;
  error?: string;
  reason?: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export interface CloseBrowserViewResult {
  success: boolean;
  hasBrowserViewHistory?: boolean;
  browserViewUrl?: string;
}

export interface BrowserViewState {
  exists: boolean;
  url?: string;
  title?: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isVisible?: boolean;
}

export interface BrowserViewNavigatedData {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface BrowserViewTitleUpdatedData {
  title: string;
  url: string;
}

export interface ElectronAPI {
  navigateToUrl: (url: string) => Promise<NavigationResult>;
  closeBrowserView: () => Promise<CloseBrowserViewResult>;
  showBrowserView: () => Promise<NavigationResult>;
  getBrowserViewState: () => Promise<BrowserViewState>;
  goBack: () => Promise<NavigationResult>;
  goForward: () => Promise<NavigationResult>;
  reload: () => Promise<NavigationResult>;
  getCurrentUrl: () => Promise<string>;
  getPageTitle: () => Promise<string>;
  canGoBack: () => Promise<boolean>;
  canGoForward: () => Promise<boolean>;
  isBrowserViewActive: () => Promise<boolean>;
  onBrowserViewNavigated: (callback: (data: BrowserViewNavigatedData) => void) => () => void;
  onBrowserViewTitleUpdated: (callback: (data: BrowserViewTitleUpdatedData) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
