#!/usr/bin/env node
/**
 * Standalone worker process — run alongside server.js
 * node run-worker.js
 */
const { buildStore } = require('./server');
const { startWorker } = require('./worker');

startWorker(buildStore).catch(err => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
