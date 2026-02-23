const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log(`[Page Error] ${error.message}`);
  });
  
  // Capture network failures
  const networkFailures = [];
  page.on('requestfailed', request => {
    networkFailures.push({ url: request.url(), failure: request.failure() });
    console.log(`[Network Failed] ${request.url()}`);
  });

  console.log('\n=== Navigating to http://167.86.83.145/ ===\n');
  
  try {
    await page.goto('http://167.86.83.145/', { waitUntil: 'networkidle', timeout: 20000 });
  } catch (e) {
    console.log(`Navigation error: ${e.message}`);
  }
  
  // Wait 15 seconds
  console.log('\n=== Waiting 15 seconds... ===\n');
  await page.waitForTimeout(15000);
  
  // Take screenshot
  console.log('\n=== Taking screenshot ===\n');
  await page.screenshot({ path: '/home/openclaw/.openclaw/workspace/page_screenshot.png', fullPage: true });
  
  // Get page content
  const content = await page.content();
  
  // Check for loading spinner
  const hasLoadingSpinner = await page.evaluate(() => {
    const spinners = document.querySelectorAll('.loading, .spinner, [class*="loading"], [class*="spinner"], .animate-spin');
    return spinners.length > 0 ? spinners[0].outerHTML : null;
  });
  
  // Check for auth form elements
  const authForm = await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], button[type="submit"]');
    return {
      formCount: forms.length,
      inputCount: inputs.length,
      formHTML: forms.length > 0 ? forms[0].outerHTML.substring(0, 500) : null,
      visibleInputs: Array.from(inputs).map(i => ({
        type: i.type,
        name: i.name,
        placeholder: i.placeholder,
        visible: i.offsetParent !== null
      }))
    };
  });
  
  // Check for any hidden content
  const bodyText = await page.evaluate(() => document.body.innerText);
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));
  
  console.log('\n=== DIAGNOSTIC REPORT ===\n');
  console.log('1. LOADING SPINNER:');
  console.log(hasLoadingSpinner ? `Found: ${hasLoadingSpinner.substring(0, 200)}...` : 'No loading spinner detected');
  
  console.log('\n2. AUTH FORM ELEMENTS:');
  console.log(JSON.stringify(authForm, null, 2));
  
  console.log('\n3. PAGE TEXT CONTENT:');
  console.log(bodyText.substring(0, 500));
  
  console.log('\n4. BODY HTML (first 2000 chars):');
  console.log(bodyHTML);
  
  console.log('\n5. CONSOLE LOGS:');
  console.log(JSON.stringify(consoleLogs, null, 2));
  
  console.log('\n6. PAGE ERRORS:');
  console.log(pageErrors.length > 0 ? pageErrors : 'No page errors');
  
  console.log('\n7. NETWORK FAILURES:');
  console.log(networkFailures.length > 0 ? JSON.stringify(networkFailures, null, 2) : 'No network failures');
  
  console.log('\n=== Screenshot saved to /home/openclaw/.openclaw/workspace/page_screenshot.png ===');
  
  await browser.close();
})();
