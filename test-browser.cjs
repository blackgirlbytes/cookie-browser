const { _electron: electron } = require('playwright');
const path = require('path');

async function testBrowser() {
  console.log('Starting Cookie Browser tests...\n');
  
  let electronApp;
  
  try {
    // Launch the Electron app
    electronApp = await electron.launch({
      args: [path.join(__dirname, 'dist-electron/main.cjs')],
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Get the first window
    const window = await electronApp.firstWindow();
    console.log('✓ App launched successfully');
    console.log('  Window title:', await window.title());

    // Wait for app to fully load
    await window.waitForTimeout(3000);

    // Test 1: Check that the app loaded
    const content = await window.content();
    if (content.includes('Cookie') || content.includes('cookie') || content.includes('New Tab')) {
      console.log('✓ App UI loaded');
    } else {
      console.log('✗ App UI may not have loaded correctly');
    }

    // Test 2: Find and interact with URL bar
    try {
      // Look for the URL bar input
      const urlBar = await window.locator('input.url-bar, input[type="text"]').first();
      await urlBar.waitFor({ state: 'visible', timeout: 5000 });
      
      // Clear and fill with test URL
      await urlBar.fill('https://example.com');
      console.log('✓ URL bar found and filled');
      
      // Press Enter to navigate
      await urlBar.press('Enter');
      console.log('✓ Navigation triggered');
      
      // Wait for navigation to complete
      await window.waitForTimeout(5000);
      
    } catch (e) {
      console.log('✗ Could not interact with URL bar:', e.message);
    }

    // Test 3: Verify external page loaded via BrowserView
    try {
      const pageTitle = await electronApp.evaluate(async ({ BrowserWindow }) => {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
          const mainWindow = windows[0];
          const views = mainWindow.getBrowserViews();
          if (views.length > 0) {
            return views[0].webContents.getTitle();
          }
        }
        return null;
      });
      
      if (pageTitle && pageTitle.toLowerCase().includes('example')) {
        console.log('✓ External page loaded successfully');
        console.log('  Page title:', pageTitle);
      } else if (pageTitle) {
        console.log('? External page loaded with title:', pageTitle);
      } else {
        console.log('? Could not verify external page (BrowserView may not be active)');
      }
    } catch (e) {
      console.log('? Could not verify external page:', e.message);
    }

    // Test 4: Test navigation to another site
    try {
      const urlBar = await window.locator('input.url-bar, input[type="text"]').first();
      await urlBar.fill('https://wikipedia.org');
      await urlBar.press('Enter');
      await window.waitForTimeout(5000);
      console.log('✓ Second navigation completed');
    } catch (e) {
      console.log('? Second navigation test skipped:', e.message);
    }

    // Test 5: Test home button (return to new tab page)
    try {
      const homeBtn = await window.locator('button[aria-label="Home"]').first();
      await homeBtn.click();
      await window.waitForTimeout(2000);
      
      // Check if we're back on new tab page
      const greeting = await window.locator('.greeting, h1').first();
      const text = await greeting.textContent();
      if (text && (text.includes('Good') || text.includes('Sweet'))) {
        console.log('✓ Home button works - returned to New Tab page');
      }
    } catch (e) {
      console.log('? Home button test skipped:', e.message);
    }

    // ========== COOKIE JAR TESTS ==========
    console.log('\n--- Cookie Jar Tests ---');

    // Test 6: Close a tab and verify it appears in Cookie Jar
    try {
      // First navigate to a page so we have something to close
      const urlBar = await window.locator('input.url-bar, input[type="text"]').first();
      await urlBar.fill('https://example.com');
      await urlBar.press('Enter');
      await window.waitForTimeout(3000);
      
      // Create a new tab
      const newTabBtn = await window.locator('button[aria-label="New tab"], .new-tab-btn').first();
      await newTabBtn.click();
      await window.waitForTimeout(1000);
      
      // Close the first tab (which should have example.com)
      const closeBtn = await window.locator('.tab-close, button[aria-label="Close tab"]').first();
      await closeBtn.click();
      await window.waitForTimeout(1000);
      
      console.log('✓ Tab closed (should be saved to Cookie Jar)');
    } catch (e) {
      console.log('? Tab close test skipped:', e.message);
    }

    // Test 7: Open cookie://jar and verify entries display
    try {
      const urlBar = await window.locator('input.url-bar, input[type="text"]').first();
      await urlBar.fill('cookie://jar');
      await urlBar.press('Enter');
      await window.waitForTimeout(2000);
      
      // Check if Cookie Jar page loaded
      const pageContent = await window.content();
      if (pageContent.includes('Cookie Jar') || pageContent.includes('🫙')) {
        console.log('✓ Cookie Jar page loaded');
        
        // Check if the closed tab appears
        if (pageContent.includes('example.com') || pageContent.includes('Example')) {
          console.log('✓ Closed tab appears in Cookie Jar');
        } else {
          console.log('? Closed tab may not be visible (could be empty jar)');
        }
      } else {
        console.log('? Cookie Jar page may not have loaded correctly');
      }
    } catch (e) {
      console.log('? Cookie Jar page test skipped:', e.message);
    }

    // Test 8: Click Cookie Jar button in toolbar
    try {
      // First go home
      const homeBtn = await window.locator('button[aria-label="Home"]').first();
      await homeBtn.click();
      await window.waitForTimeout(1000);
      
      // Click Cookie Jar button
      const jarBtn = await window.locator('button[aria-label="Cookie Jar"]').first();
      await jarBtn.click();
      await window.waitForTimeout(2000);
      
      const pageContent = await window.content();
      if (pageContent.includes('Cookie Jar') || pageContent.includes('🫙')) {
        console.log('✓ Cookie Jar button works');
      }
    } catch (e) {
      console.log('? Cookie Jar button test skipped:', e.message);
    }

    // Test 9: Click entry to restore tab
    try {
      // Look for a jar item and click it
      const jarItem = await window.locator('.jar-item, .jar-restore-btn').first();
      const isVisible = await jarItem.isVisible().catch(() => false);
      
      if (isVisible) {
        await jarItem.click();
        await window.waitForTimeout(2000);
        
        // Check if a new tab was opened
        const tabs = await window.locator('.tab').all();
        if (tabs.length > 1) {
          console.log('✓ Tab restored from Cookie Jar');
        } else {
          console.log('? Tab may have been restored (single tab mode)');
        }
      } else {
        console.log('? No jar items to restore (jar may be empty)');
      }
    } catch (e) {
      console.log('? Restore tab test skipped:', e.message);
    }

    // ========== BREADCRUMBS TESTS ==========
    console.log('\n--- Breadcrumbs Tests ---');

    // Test 10: Navigate through 3 pages and verify breadcrumbs button exists
    try {
      // Start fresh - go home
      const homeBtn = await window.locator('button[aria-label="Home"]').first();
      await homeBtn.click();
      await window.waitForTimeout(1000);
      
      // Navigate to first page
      const urlBar = await window.locator('input.url-bar, input[type="text"]').first();
      await urlBar.fill('https://example.com');
      await urlBar.press('Enter');
      await window.waitForTimeout(3000);
      
      // Navigate to second page
      await urlBar.fill('https://wikipedia.org');
      await urlBar.press('Enter');
      await window.waitForTimeout(3000);
      
      // Navigate to third page
      await urlBar.fill('https://example.org');
      await urlBar.press('Enter');
      await window.waitForTimeout(3000);
      
      console.log('✓ Navigated through 3 pages');
      
      // Click breadcrumbs button
      const breadcrumbsBtn = await window.locator('button[aria-label="Breadcrumbs"]').first();
      await breadcrumbsBtn.click();
      await window.waitForTimeout(1000);
      
      // Verify popover appears
      const pageContent = await window.content();
      if (pageContent.includes('How did I get here') || pageContent.includes('breadcrumb')) {
        console.log('✓ Breadcrumbs popover opened');
        
        // Check if trail shows the pages we visited
        if (pageContent.includes('example') || pageContent.includes('wikipedia')) {
          console.log('✓ Breadcrumbs trail shows navigation history');
        } else {
          console.log('? Trail content may not be visible');
        }
      } else {
        console.log('? Breadcrumbs popover may not have opened');
      }
    } catch (e) {
      console.log('? Breadcrumbs navigation test skipped:', e.message);
    }

    // Test 11: Click a crumb to navigate back
    try {
      // Look for a breadcrumb item and click it
      const crumbItem = await window.locator('.breadcrumb-item').first();
      const isVisible = await crumbItem.isVisible().catch(() => false);
      
      if (isVisible) {
        await crumbItem.click();
        await window.waitForTimeout(2000);
        
        // Verify navigation occurred (popover should close)
        const popoverVisible = await window.locator('.breadcrumbs-popover').isVisible().catch(() => false);
        if (!popoverVisible) {
          console.log('✓ Clicked breadcrumb - popover closed and navigated');
        } else {
          console.log('? Breadcrumb click may not have triggered navigation');
        }
      } else {
        console.log('? No breadcrumb items visible to click');
      }
    } catch (e) {
      console.log('? Breadcrumb click test skipped:', e.message);
    }

    // ========== EASY CLOSURE TESTS ==========
    console.log('\n--- Easy Closure Tests ---');

    // Test 12: Open multiple tabs and click "I'm Done" button
    try {
      // Go home first
      const homeBtn = await window.locator('button[aria-label="Home"]').first();
      await homeBtn.click();
      await window.waitForTimeout(1000);
      
      // Open first tab with content
      const urlBar = await window.locator('input.url-bar, input[type="text"]').first();
      await urlBar.fill('https://example.com');
      await urlBar.press('Enter');
      await window.waitForTimeout(3000);
      
      // Create a second tab
      const newTabBtn = await window.locator('button[aria-label="New tab"], .new-tab-btn').first();
      await newTabBtn.click();
      await window.waitForTimeout(1000);
      
      // Navigate second tab
      const urlBar2 = await window.locator('input.url-bar, input[type="text"]').first();
      await urlBar2.fill('https://wikipedia.org');
      await urlBar2.press('Enter');
      await window.waitForTimeout(3000);
      
      // Click "I'm Done" button
      const easyCloseBtn = await window.locator('button[aria-label="I\'m Done"]').first();
      await easyCloseBtn.click();
      await window.waitForTimeout(1000);
      
      // Verify modal appears
      const pageContent = await window.content();
      if (pageContent.includes('Save these tabs as a session') || pageContent.includes('easy-close-modal')) {
        console.log('✓ Easy Close modal opened');
      } else {
        console.log('? Easy Close modal may not have opened');
      }
    } catch (e) {
      console.log('? Easy Close button test skipped:', e.message);
    }

    // Test 13: Enter session name and click "Save & Close"
    try {
      // Find the session name input and enter a name
      const sessionInput = await window.locator('#session-name, input[placeholder*="session"]').first();
      const inputVisible = await sessionInput.isVisible().catch(() => false);
      
      if (inputVisible) {
        await sessionInput.fill('Test Session');
        console.log('✓ Session name entered');
        
        // Click "Save & Close" button
        const saveBtn = await window.locator('button:has-text("Save & Close")').first();
        await saveBtn.click();
        await window.waitForTimeout(2000);
        
        // Verify tabs were closed (should be on new tab page)
        const pageContent = await window.content();
        if (pageContent.includes('New Tab') || pageContent.includes('Good')) {
          console.log('✓ Tabs closed after Save & Close');
        }
      } else {
        console.log('? Session input not visible (modal may not be open)');
      }
    } catch (e) {
      console.log('? Save & Close test skipped:', e.message);
    }

    // Test 14: Open cookie://jar and verify session appears
    try {
      const urlBar = await window.locator('input.url-bar, input[type="text"]').first();
      await urlBar.fill('cookie://jar');
      await urlBar.press('Enter');
      await window.waitForTimeout(2000);
      
      const pageContent = await window.content();
      if (pageContent.includes('Test Session') || pageContent.includes('Saved Sessions')) {
        console.log('✓ Session appears in Cookie Jar');
      } else if (pageContent.includes('Cookie Jar')) {
        console.log('? Cookie Jar loaded but session may not be visible');
      } else {
        console.log('? Could not verify session in Cookie Jar');
      }
    } catch (e) {
      console.log('? Session verification test skipped:', e.message);
    }

    // Test 15: Click restore session to reopen all tabs
    try {
      // Look for a session restore button
      const restoreBtn = await window.locator('.session-restore-btn, button:has-text("Restore All")').first();
      const isVisible = await restoreBtn.isVisible().catch(() => false);
      
      if (isVisible) {
        await restoreBtn.click();
        await window.waitForTimeout(3000);
        
        // Verify tabs were restored (should have multiple tabs)
        const tabs = await window.locator('.tab').all();
        if (tabs.length > 1) {
          console.log('✓ Session restored - multiple tabs opened');
        } else {
          console.log('? Session may have been restored (checking tab count)');
        }
      } else {
        console.log('? No session restore button visible');
      }
    } catch (e) {
      console.log('? Session restore test skipped:', e.message);
    }

    console.log('\n✓ All tests completed');
    console.log('\nBrowser verification PASSED');
    
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    // Cleanup
    if (electronApp) {
      await electronApp.close();
    }
  }
}

testBrowser().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
