import JSZip from 'jszip';

const PLATFORM_LABELS = {
  mac: 'macOS',
  win: 'Windows',
  both: 'macOS + Windows',
};

function sanitizeName(name = 'my-electron-app') {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-electron-app';
}

function createElectronPackageJson(appName, version, platform) {
  const packageName = sanitizeName(appName);
  const scripts = {
    start: 'electron .',
  };

  if (platform === 'mac' || platform === 'both') {
    scripts['build:mac'] = 'electron-builder --mac zip';
  }
  if (platform === 'win' || platform === 'both') {
    scripts['build:win'] = 'electron-builder --win portable';
  }

  return JSON.stringify(
    {
      name: packageName,
      version: version || '1.0.0',
      private: true,
      main: 'main.js',
      scripts,
      devDependencies: {
        electron: 'latest',
        'electron-builder': 'latest',
      },
    },
    null,
    2
  );
}

function createElectronMainJs(appName) {
  return `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: ${JSON.stringify(appName || 'Lanthanum App')},
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  win.loadFile(path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => win.show());
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
`;
}

function createReadme(appName, platform) {
  const target = PLATFORM_LABELS[platform] || PLATFORM_LABELS.both;
  const buildLines = [];

  if (platform === 'mac' || platform === 'both') {
    buildLines.push('- macOS: npm run build:mac');
  }
  if (platform === 'win' || platform === 'both') {
    buildLines.push('- Windows: npm run build:win');
  }

  return `# ${appName || 'Lanthanum Electron App'}

This project was exported from Lanthanum AI as a ready-to-run Electron app.
Target platform: ${target}

## Run locally

1. npm install
2. npm start

## Build distributables

${buildLines.join('\n')}
`;
}

export async function downloadElectronProjectZip({ html, appName, version, platform = 'both' }) {
  if (!html || !html.trim()) {
    throw new Error('No generated UI code found. Please generate a UI first.');
  }

  const folderName = sanitizeName(appName || 'my-electron-app');
  const zip = new JSZip();
  const root = zip.folder(folderName);

  root.file('package.json', createElectronPackageJson(appName, version, platform));
  root.file('main.js', createElectronMainJs(appName));
  root.file('index.html', html);
  root.file('README.md', createReadme(appName, platform));

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${folderName}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}
