const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { addBuildJob, getBuildQueue } = require('./queue');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'] }));
app.use(express.json({ limit: '10mb' }));

// ── In-memory build status store (replace with Redis in prod) ─────────────────
const buildStore = new Map();

// ── Artifacts directory ───────────────────────────────────────────────────────
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

// ── Serve artifacts as static files ──────────────────────────────────────────
app.use('/artifacts', express.static(ARTIFACTS_DIR));

// ── POST /api/build ───────────────────────────────────────────────────────────
app.post('/api/build', async (req, res) => {
  const { html, appName, platform, version } = req.body;

  // Validation
  if (!html || typeof html !== 'string') {
    return res.status(400).json({ error: 'html is required' });
  }
  if (!platform || !['mac', 'win', 'both'].includes(platform)) {
    return res.status(400).json({ error: 'platform must be mac | win | both' });
  }

  const buildId = uuidv4();
  const cleanName = (appName || 'MyApp').replace(/[^a-zA-Z0-9-_]/g, '-');

  // Store initial status
  buildStore.set(buildId, {
    id: buildId,
    status: 'queued',
    platform,
    appName: cleanName,
    version: version || '1.0.0',
    createdAt: new Date().toISOString(),
    logs: [],
    downloads: {},
  });

  try {
    // Add to build queue
    await addBuildJob({
      buildId,
      html,
      appName: cleanName,
      platform,
      version: version || '1.0.0',
    });

    res.json({ buildId, status: 'queued' });
  } catch (err) {
    console.error('Queue error:', err.message);
    // Fallback: run build directly if Redis unavailable
    buildStore.get(buildId).status = 'queued';
    runBuildDirect(buildId, { html, appName: cleanName, platform, version: version || '1.0.0' }, buildStore);
    res.json({ buildId, status: 'queued', note: 'running without queue (Redis unavailable)' });
  }
});

// ── GET /api/build/:id/status ─────────────────────────────────────────────────
app.get('/api/build/:id/status', (req, res) => {
  const build = buildStore.get(req.params.id);
  if (!build) return res.status(404).json({ error: 'Build not found' });
  res.json(build);
});

// ── GET /api/build/:id/download ───────────────────────────────────────────────
app.get('/api/build/:id/download', (req, res) => {
  const build = buildStore.get(req.params.id);
  if (!build) return res.status(404).json({ error: 'Build not found' });
  if (build.status !== 'success') return res.status(400).json({ error: 'Build not ready', status: build.status });
  res.json({ downloads: build.downloads });
});

// ── Direct build runner (no Redis fallback) ───────────────────────────────────
function runBuildDirect(buildId, data, store) {
  const { buildWorkerFn } = require('./worker');
  buildWorkerFn(data, store, buildId).catch(err => {
    const build = store.get(buildId);
    if (build) { build.status = 'failed'; build.error = err.message; }
  });
}

// ── Expose buildStore for worker updates ──────────────────────────────────────
module.exports.buildStore = buildStore;

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Lanthanum Build Server running on http://localhost:${PORT}`);
  console.log(`   Artifacts served from /artifacts\n`);
});
