"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    navigateToUrl: (url) => electron_1.ipcRenderer.invoke('navigate-to-url', url),
    closeBrowserView: () => electron_1.ipcRenderer.invoke('close-browser-view'),
    showBrowserView: () => electron_1.ipcRenderer.invoke('show-browser-view'),
    getBrowserViewState: () => electron_1.ipcRenderer.invoke('get-browser-view-state'),
    goBack: () => electron_1.ipcRenderer.invoke('go-back'),
    goForward: () => electron_1.ipcRenderer.invoke('go-forward'),
    reload: () => electron_1.ipcRenderer.invoke('reload'),
    getCurrentUrl: () => electron_1.ipcRenderer.invoke('get-current-url'),
    getPageTitle: () => electron_1.ipcRenderer.invoke('get-page-title'),
    canGoBack: () => electron_1.ipcRenderer.invoke('can-go-back'),
    canGoForward: () => electron_1.ipcRenderer.invoke('can-go-forward'),
    isBrowserViewActive: () => electron_1.ipcRenderer.invoke('is-browser-view-active'),
    // Event listeners for BrowserView navigation events
    onBrowserViewNavigated: (callback) => {
        const handler = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('browser-view-navigated', handler);
        return () => electron_1.ipcRenderer.removeListener('browser-view-navigated', handler);
    },
    onBrowserViewTitleUpdated: (callback) => {
        const handler = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('browser-view-title-updated', handler);
        return () => electron_1.ipcRenderer.removeListener('browser-view-title-updated', handler);
    },
});
//# sourceMappingURL=preload.js.map