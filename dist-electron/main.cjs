"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
let mainWindow;
let browserView = null;
// Track toolbar height for BrowserView positioning
// Tab bar (~52px) + Toolbar (~64px) = ~116px, using 140px for safe buffer
const TOOLBAR_HEIGHT = 140;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        backgroundColor: '#FFE8E0', // Cream background
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 16, y: 16 },
    });
    // Load the React app
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    // Handle window resize to update BrowserView bounds
    mainWindow.on('resize', () => {
        updateBrowserViewBounds();
    });
}
function updateBrowserViewBounds() {
    if (browserView && mainWindow) {
        const bounds = mainWindow.getBounds();
        browserView.setBounds({
            x: 0,
            y: TOOLBAR_HEIGHT,
            width: bounds.width,
            height: bounds.height - TOOLBAR_HEIGHT,
        });
    }
}
// Helper functions using the new navigationHistory API
function canGoBack() {
    if (!browserView)
        return false;
    return browserView.webContents.navigationHistory.canGoBack();
}
function canGoForward() {
    if (!browserView)
        return false;
    return browserView.webContents.navigationHistory.canGoForward();
}
function sendNavigationUpdate() {
    if (!browserView || !mainWindow)
        return;
    mainWindow.webContents.send('browser-view-navigated', {
        url: browserView.webContents.getURL(),
        title: browserView.webContents.getTitle(),
        canGoBack: canGoBack(),
        canGoForward: canGoForward(),
    });
}
function setupBrowserViewListeners() {
    if (!browserView)
        return;
    // Send navigation updates on various events
    browserView.webContents.on('did-navigate', () => {
        console.log('did-navigate, canGoBack:', canGoBack(), 'canGoForward:', canGoForward());
        sendNavigationUpdate();
    });
    browserView.webContents.on('did-navigate-in-page', () => {
        console.log('did-navigate-in-page, canGoBack:', canGoBack(), 'canGoForward:', canGoForward());
        sendNavigationUpdate();
    });
    browserView.webContents.on('did-finish-load', () => {
        console.log('did-finish-load, canGoBack:', canGoBack(), 'canGoForward:', canGoForward());
        sendNavigationUpdate();
    });
    browserView.webContents.on('page-title-updated', (_event, title) => {
        mainWindow.webContents.send('browser-view-title-updated', {
            title,
            url: browserView?.webContents.getURL() || '',
        });
    });
}
// Get or create BrowserView (reuse existing one to preserve history)
function getOrCreateBrowserView() {
    if (!browserView) {
        browserView = new electron_1.BrowserView({
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
            },
        });
        setupBrowserViewListeners();
    }
    // Make sure it's attached to the window
    const currentViews = mainWindow.getBrowserViews();
    if (!currentViews.includes(browserView)) {
        mainWindow.setBrowserView(browserView);
    }
    browserView.setAutoResize({ width: true, height: true });
    updateBrowserViewBounds();
    return browserView;
}
// Navigate to external URL using BrowserView
electron_1.ipcMain.handle('navigate-to-url', async (_event, url) => {
    try {
        // Ensure URL has protocol
        let normalizedUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            normalizedUrl = 'https://' + url;
        }
        const view = getOrCreateBrowserView();
        await view.webContents.loadURL(normalizedUrl);
        const back = canGoBack();
        const forward = canGoForward();
        console.log('Navigation complete:', {
            url: normalizedUrl,
            canGoBack: back,
            canGoForward: forward,
        });
        return {
            success: true,
            title: view.webContents.getTitle(),
            url: view.webContents.getURL(),
            canGoBack: back,
            canGoForward: forward,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
});
// Hide BrowserView (for internal pages) - but don't destroy it!
electron_1.ipcMain.handle('close-browser-view', async () => {
    if (browserView) {
        // Just hide it by removing from window, but keep the instance
        mainWindow.removeBrowserView(browserView);
    }
    // Return whether there's a BrowserView with history we can go back to
    return {
        success: true,
        hasBrowserViewHistory: browserView !== null && browserView.webContents.getURL() !== '',
        browserViewUrl: browserView?.webContents.getURL() || '',
    };
});
// Check if there's a hidden BrowserView we can return to
electron_1.ipcMain.handle('get-browser-view-state', async () => {
    if (!browserView) {
        return { exists: false };
    }
    return {
        exists: true,
        url: browserView.webContents.getURL(),
        title: browserView.webContents.getTitle(),
        canGoBack: canGoBack(),
        canGoForward: canGoForward(),
        isVisible: mainWindow.getBrowserViews().includes(browserView),
    };
});
// Show BrowserView again
electron_1.ipcMain.handle('show-browser-view', async () => {
    if (browserView) {
        const currentViews = mainWindow.getBrowserViews();
        if (!currentViews.includes(browserView)) {
            mainWindow.setBrowserView(browserView);
            updateBrowserViewBounds();
        }
        return {
            success: true,
            url: browserView.webContents.getURL(),
            title: browserView.webContents.getTitle(),
            canGoBack: canGoBack(),
            canGoForward: canGoForward(),
        };
    }
    return { success: false, reason: 'No BrowserView exists' };
});
// Navigation controls
electron_1.ipcMain.handle('go-back', async () => {
    console.log('go-back called, canGoBack:', canGoBack());
    if (browserView && canGoBack()) {
        const navigationPromise = new Promise((resolve) => {
            const handler = () => {
                browserView?.webContents.removeListener('did-finish-load', handler);
                browserView?.webContents.removeListener('did-fail-load', handler);
                resolve();
            };
            browserView?.webContents.once('did-finish-load', handler);
            browserView?.webContents.once('did-fail-load', handler);
            setTimeout(resolve, 5000);
        });
        browserView.webContents.navigationHistory.goBack();
        await navigationPromise;
        return {
            success: true,
            url: browserView.webContents.getURL(),
            title: browserView.webContents.getTitle(),
            canGoBack: canGoBack(),
            canGoForward: canGoForward(),
        };
    }
    return { success: false, reason: 'Cannot go back' };
});
electron_1.ipcMain.handle('go-forward', async () => {
    console.log('go-forward called, canGoForward:', canGoForward());
    if (browserView && canGoForward()) {
        const navigationPromise = new Promise((resolve) => {
            const handler = () => {
                browserView?.webContents.removeListener('did-finish-load', handler);
                browserView?.webContents.removeListener('did-fail-load', handler);
                resolve();
            };
            browserView?.webContents.once('did-finish-load', handler);
            browserView?.webContents.once('did-fail-load', handler);
            setTimeout(resolve, 5000);
        });
        browserView.webContents.navigationHistory.goForward();
        await navigationPromise;
        return {
            success: true,
            url: browserView.webContents.getURL(),
            title: browserView.webContents.getTitle(),
            canGoBack: canGoBack(),
            canGoForward: canGoForward(),
        };
    }
    return { success: false, reason: 'Cannot go forward' };
});
electron_1.ipcMain.handle('reload', async () => {
    if (browserView) {
        browserView.webContents.reload();
        return { success: true };
    }
    return { success: false, reason: 'No page to reload' };
});
electron_1.ipcMain.handle('get-current-url', async () => {
    return browserView?.webContents.getURL() || '';
});
electron_1.ipcMain.handle('get-page-title', async () => {
    return browserView?.webContents.getTitle() || '';
});
electron_1.ipcMain.handle('can-go-back', async () => {
    const result = canGoBack();
    console.log('can-go-back:', result);
    return result;
});
electron_1.ipcMain.handle('can-go-forward', async () => {
    const result = canGoForward();
    console.log('can-go-forward:', result);
    return result;
});
electron_1.ipcMain.handle('is-browser-view-active', async () => {
    if (!browserView)
        return false;
    const currentViews = mainWindow.getBrowserViews();
    return currentViews.includes(browserView);
});
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
//# sourceMappingURL=main.js.map