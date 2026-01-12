import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  navigateToUrl: (url: string) => ipcRenderer.invoke('navigate-to-url', url),
  closeBrowserView: () => ipcRenderer.invoke('close-browser-view'),
  showBrowserView: () => ipcRenderer.invoke('show-browser-view'),
  getBrowserViewState: () => ipcRenderer.invoke('get-browser-view-state'),
  goBack: () => ipcRenderer.invoke('go-back'),
  goForward: () => ipcRenderer.invoke('go-forward'),
  reload: () => ipcRenderer.invoke('reload'),
  getCurrentUrl: () => ipcRenderer.invoke('get-current-url'),
  getPageTitle: () => ipcRenderer.invoke('get-page-title'),
  canGoBack: () => ipcRenderer.invoke('can-go-back'),
  canGoForward: () => ipcRenderer.invoke('can-go-forward'),
  isBrowserViewActive: () => ipcRenderer.invoke('is-browser-view-active'),
  
  // Event listeners for BrowserView navigation events
  onBrowserViewNavigated: (callback: (data: { url: string; title: string; canGoBack: boolean; canGoForward: boolean }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { url: string; title: string; canGoBack: boolean; canGoForward: boolean }) => callback(data);
    ipcRenderer.on('browser-view-navigated', handler);
    return () => ipcRenderer.removeListener('browser-view-navigated', handler);
  },
  
  onBrowserViewTitleUpdated: (callback: (data: { title: string; url: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { title: string; url: string }) => callback(data);
    ipcRenderer.on('browser-view-title-updated', handler);
    return () => ipcRenderer.removeListener('browser-view-title-updated', handler);
  },
});
