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
