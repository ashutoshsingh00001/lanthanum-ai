const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');
const ELECTRON_CACHE_DIR = process.env.ELECTRON_CACHE || path.join(os.homedir(), '.cache', 'electron');
const ELECTRON_BUILDER_CACHE_DIR = process.env.ELECTRON_BUILDER_CACHE || path.join(os.homedir(), '.cache', 'electron-builder');

// ─── Electron main.js template ────────────────────────────────────────────────
function generateMainJs(appName) {
  return `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: '${appName}',
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
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
`;
}

// ─── package.json template ────────────────────────────────────────────────────
function generatePackageJson(appName, version, platform) {
  const targets = {};
  if (platform === 'mac' || platform === 'both') {
    targets.mac = { target: [{ target: 'zip', arch: ['x64', 'arm64'] }] };
  }
  if (platform === 'win' || platform === 'both') {
    targets.win = { target: [{ target: 'portable', arch: ['x64'] }] };
  }

  return JSON.stringify({
    name: appName.toLowerCase().replace(/\s+/g, '-'),
    version,
    description: `${appName} — built with Lanthanum AI`,
    main: 'main.js',
    scripts: {
      start: 'electron .',
      build: 'electron-builder',
    },
    build: {
      appId: `com.lanthanum.${appName.toLowerCase().replace(/\s+/g, '')}`,
      productName: appName,
      copyright: `Copyright © ${new Date().getFullYear()}`,
      directories: { output: 'dist', buildResources: 'build' },
      files: ['main.js', 'index.html', 'assets/**/*'],
      ...targets,
      nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
      },
      dmg: {
        contents: [
          { x: 410, y: 150, type: 'link', path: '/Applications' },
          { x: 130, y: 150, type: 'file' },
        ],
      },
    },
    devDependencies: {
      electron: '^28.0.0',
      'electron-builder': '^24.9.1',
    },
  }, null, 2);
}

// ─── Core build function ──────────────────────────────────────────────────────
async function buildWorkerFn(data, buildStore, buildId) {
  const { html, appName, platform, version } = data;
  const build = buildStore.get(buildId);

  const log = (msg) => {
    console.log(`[${buildId}] ${msg}`);
    if (build) build.logs.push(`${new Date().toISOString().slice(11,19)} ${msg}`);
  };

  const tmpDir = path.join(os.tmpdir(), `lanthanum-build-${buildId}`);
  const artifactDir = path.join(ARTIFACTS_DIR, buildId);

  try {
    // ── Update status ──────────────────────────────────────────────────
    if (build) build.status = 'building';
    log('Starting build...');

    // ── Create directories ─────────────────────────────────────────────
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(artifactDir, { recursive: true });
    fs.mkdirSync(ELECTRON_CACHE_DIR, { recursive: true });
    fs.mkdirSync(ELECTRON_BUILDER_CACHE_DIR, { recursive: true });
    log(`Build dir: ${tmpDir}`);
    log(`Electron cache: ${ELECTRON_CACHE_DIR}`);
    log(`Builder cache: ${ELECTRON_BUILDER_CACHE_DIR}`);

    // ── Write user HTML ────────────────────────────────────────────────
    fs.writeFileSync(path.join(tmpDir, 'index.html'), html, 'utf8');
    log('Written index.html');

    // ── Write Electron main.js ─────────────────────────────────────────
    fs.writeFileSync(path.join(tmpDir, 'main.js'), generateMainJs(appName), 'utf8');
    log('Written main.js');

    // ── Write package.json ─────────────────────────────────────────────
    const pkgJson = generatePackageJson(appName, version, platform);
    fs.writeFileSync(path.join(tmpDir, 'package.json'), pkgJson, 'utf8');
    log('Written package.json');

    // ── Install dependencies ───────────────────────────────────────────
    log('Installing dependencies (this takes ~60s)...');
    execSync('npm install --prefer-offline', {
      cwd: tmpDir,
      stdio: 'pipe',
      timeout: 300_000, // 5 min
      env: {
        ...process.env,
        ELECTRON_SKIP_BINARY_DOWNLOAD: '0',
        ELECTRON_CACHE: ELECTRON_CACHE_DIR,
        ELECTRON_BUILDER_CACHE: ELECTRON_BUILDER_CACHE_DIR,
      },
    });
    log('Dependencies installed');

    // ── Determine build flags ──────────────────────────────────────────
    const buildFlags = [];
    if (platform === 'mac' || platform === 'both') buildFlags.push('--mac');
    if (platform === 'win' || platform === 'both') buildFlags.push('--win');

    // ── Run electron-builder ───────────────────────────────────────────
    const builderCmd = `npx electron-builder ${buildFlags.join(' ')} --publish=never`;
    log(`Running: ${builderCmd}`);

    await runCommand(builderCmd, tmpDir, log);
    log('electron-builder finished');

    // ── Collect artifacts ──────────────────────────────────────────────
    const distDir = path.join(tmpDir, 'dist');
    const downloads = {};

    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir);

      for (const file of files) {
        const fullPath = path.join(distDir, file);
        const stat = fs.statSync(fullPath);
        if (!stat.isFile()) continue;

        if (file.endsWith('.zip')) {
          const dest = path.join(artifactDir, file);
          fs.copyFileSync(fullPath, dest);
          downloads.mac = `http://localhost:3001/artifacts/${buildId}/${encodeURIComponent(file)}`;
          log(`macOS artifact: ${file}`);
        } else if (file.endsWith('.exe')) {
          const dest = path.join(artifactDir, file);
          fs.copyFileSync(fullPath, dest);
          downloads.win = `http://localhost:3001/artifacts/${buildId}/${encodeURIComponent(file)}`;
          log(`Windows artifact: ${file}`);
        }
      }
    }

    if (Object.keys(downloads).length === 0) {
      throw new Error('No artifacts produced. Check electron-builder logs.');
    }

    // ── Success ────────────────────────────────────────────────────────
    if (build) {
      build.status = 'success';
      build.downloads = downloads;
      build.completedAt = new Date().toISOString();
    }
    log('Build complete ✓');

  } catch (err) {
    log(`ERROR: ${err.message}`);
    if (build) {
      build.status = 'failed';
      build.error = err.message;
    }
  } finally {
    // ── Cleanup temp dir ───────────────────────────────────────────────
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      log('Cleaned up temp dir');
    } catch (_) {}
  }
}

// ─── Promisified child process ────────────────────────────────────────────────
function runCommand(cmd, cwd, log) {
  return new Promise((resolve, reject) => {
    const [bin, ...args] = cmd.split(' ');
    const proc = spawn(bin, args, {
      cwd,
      shell: true,
      env: {
        ...process.env,
        CI: '1',
        ELECTRON_CACHE: ELECTRON_CACHE_DIR,
        ELECTRON_BUILDER_CACHE: ELECTRON_BUILDER_CACHE_DIR,
      },
    });

    proc.stdout.on('data', d => log(d.toString().trim()));
    proc.stderr.on('data', d => log(d.toString().trim()));

    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Command exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

// ─── BullMQ Worker entry point ────────────────────────────────────────────────
async function startWorker(buildStore) {
  let Worker;
  try {
    ({ Worker } = require('bullmq'));
    const { getConnection, QUEUE_NAME } = require('./queue');
    const conn = getConnection();
    await conn.connect();

    const worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        await buildWorkerFn(job.data, buildStore, job.data.buildId);
      },
      {
        connection: conn,
        concurrency: 2,
        limiter: { max: 2, duration: 60_000 },
      }
    );

    worker.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err.message);
    });
    worker.on('completed', job => {
      console.log(`Job ${job.id} completed`);
    });

    console.log('🔧 Build worker started (concurrency: 2)');
    return worker;
  } catch (err) {
    console.warn('Worker startup warning (Redis may be unavailable):', err.message);
  }
}

module.exports = { buildWorkerFn, startWorker };
