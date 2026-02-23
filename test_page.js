// Simple test script to check the page loading behavior
const http = require('http');

function fetchPage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '167.86.83.145',
      port: 80,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    console.log('Fetching page...');
    const response = await fetchPage();
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Content-Length: ${response.body.length}`);
    
    // Check for loading spinner in HTML
    const hasLoader = response.body.includes('route-loader') || response.body.includes('Loading mission control');
    const hasAuthForm = response.body.includes('local-auth-token') && response.body.includes('Access token');
    const hasNextData = response.body.includes('__next_f');
    
    console.log('\n=== Analysis ===');
    console.log(`Has loading spinner (route-loader): ${hasLoader}`);
    console.log(`Has auth form: ${hasAuthForm}`);
    console.log(`Has Next.js bootstrap data: ${hasNextData}`);
    
    // Check for the specific loader element
    const loaderMatch = response.body.match(/data-cy="route-loader"[\s\S]{0,200}/);
    if (loaderMatch) {
      console.log('\n=== Loading Spinner Found ===');
      console.log(loaderMatch[0].substring(0, 200));
    }
    
    // Check form visibility
    const formMatch = response.body.match(/<form[\s\S]{0,300}/);
    if (formMatch) {
      console.log('\n=== Auth Form Found ===');
      console.log(formMatch[0].substring(0, 300));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
