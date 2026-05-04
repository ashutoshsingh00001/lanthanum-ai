const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'electron-builds';

let queue = null;
let connection = null;

function getConnection() {
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
  }
  return connection;
}

async function addBuildJob(data) {
  if (!queue) {
    const conn = getConnection();
    await conn.connect();
    queue = new Queue(QUEUE_NAME, {
      connection: conn,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    });
  }
  return queue.add('build', data, { jobId: data.buildId });
}

function getBuildQueue() {
  return queue;
}

module.exports = { addBuildJob, getBuildQueue, QUEUE_NAME, getConnection };
