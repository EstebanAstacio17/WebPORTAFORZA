import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'http://localhost:5173/';
const outputDir = path.resolve('public/Software/styleAdminSoftPF/imgs');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Ensure unique user data dir so it doesn't collide with any running Chrome
const userDataDir = path.resolve('scratch/chrome_user_data');
if (!fs.existsSync(userDataDir)) {
  fs.mkdirSync(userDataDir, { recursive: true });
}

console.log('Starting dedicated Chrome instance...');
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9333',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--window-size=1440,900',
  '--no-first-run',
  '--no-default-browser-check',
  targetUrl
]);

// Wait for Chrome to boot
await new Promise(resolve => setTimeout(resolve, 2500));

try {
  const res = await fetch('http://localhost:9333/json/list');
  const tabs = await res.json();
  console.log('Tabs:', tabs.map(t => ({ title: t.title, url: t.url, type: t.type })));
  
  const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
  if (!pageTab || !pageTab.webSocketDebuggerUrl) {
    throw new Error('No page tab found with webSocketDebuggerUrl');
  }

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  console.log('WebSocket connected to page tab!');

  let id = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      const timeout = setTimeout(() => reject(new Error(`Timeout for ${method}`)), 10000);
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === msgId) {
          clearTimeout(timeout);
          ws.removeEventListener('message', handler);
          if (data.error) reject(new Error(JSON.stringify(data.error)));
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };

  await send('Page.enable');
  await send('DOM.enable');

  // Wait 3 seconds for React to finish mounting and rendering
  console.log('Waiting for React render...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Capturing Screenshot 1...');
  const shot1 = await send('Page.captureScreenshot', { format: 'png', quality: 90 });
  const file1 = path.join(outputDir, 'adminsoft_dashboard_live.png');
  fs.writeFileSync(file1, Buffer.from(shot1.data, 'base64'));
  console.log('Successfully saved:', file1);

  // Extract page content
  const doc = await send('Runtime.evaluate', { expression: 'document.body.innerText' });
  fs.writeFileSync('scratch/page_text.txt', doc.result.value || '');
  console.log('Page text extracted length:', doc.result.value?.length);

  ws.close();
} catch (err) {
  console.error('Error during capture:', err);
} finally {
  chrome.kill();
}
