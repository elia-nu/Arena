const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    const logs = [];
    const errors = [];
    page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => errors.push(err.toString()));

    console.log('Navigating to http://localhost:5173/login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Current URL:', page.url());

    // Type credentials
    await page.type('input[name="identifier"]', 'admin@kickit.com');
    await page.type('input[name="password"]', 'admin123');

    console.log('Submitting login form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(e => console.log('Nav note:', e.message)),
      page.click('button[type="submit"]')
    ]);

    console.log('URL after login:', page.url());
    
    // Check localStorage token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log('Stored token present?', !!token);

    if (page.url() !== 'http://localhost:5173/admin') {
      console.log('Navigating directly to /admin...');
      await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0', timeout: 15000 });
    }
    console.log('Final URL:', page.url());

    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
    console.log('Root HTML length:', rootHtml?.length);
    console.log('Root HTML preview:', rootHtml?.slice(0, 300));
    console.log('Page Errors:', errors);
    console.log('Browser Logs:', logs);

    await page.screenshot({ path: 'test_admin_screenshot.png', fullPage: true });
    console.log('Screenshot saved to test_admin_screenshot.png');

    await browser.close();
  } catch (err) {
    console.error('Fatal test error:', err);
  }
})();
