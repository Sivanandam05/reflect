'use strict';

/**
 * reflectapp - simple Express web service with SQS enqueue endpoint
 *
 * Environment variables:
 *   PORT           - port to listen on (default 8000)
 *   NODE_ENV       - node environment (default production)
 *   SQS_QUEUE_URL  - optional SQS queue URL (if provided, /enqueue will push)
 */

const express = require('express');
const pino = require('pino');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const logger = pino({
  prettyPrint: process.env.NODE_ENV !== 'production'
});

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;
const QUEUE_URL = process.env.SQS_QUEUE_URL || '';
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

let sqsClient = null;
if (QUEUE_URL) {
  sqsClient = new SQSClient({ region: AWS_REGION });
  logger.info({ queue: QUEUE_URL }, 'SQS client configured');
} else {
  logger.info('No SQS_QUEUE_URL provided — enqueue endpoint will be disabled');
}

app.get('/', (req, res) => {
  res.json({
    service: 'reflectapp',
    version: '1.0.0',
    message: 'Hello from reflectapp! Use POST /enqueue { "payload": "..." } to add messages to SQS (if configured).'
  });
});

app.get('/health', (req, res) => {
  // Basic health: returns HTTP 200 if server alive
  res.status(200).json({ status: 'ok' });
});

app.post('/enqueue', async (req, res) => {
  if (!sqsClient) {
    return res.status(400).json({ error: 'SQS not configured on this instance.' });
  }

  const payload = req.body.payload || 'heartbeat';
  try {
    const cmd = new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify({ payload, ts: new Date().toISOString() })
    });
    const out = await sqsClient.send(cmd);
    logger.info({ awsResult: out }, 'Message sent to SQS');
    res.status(200).json({ result: 'sent', messageId: out.MessageId });
  } catch (err) {
    logger.error({ err }, 'Failed to send to SQS');
    res.status(500).json({ error: 'Failed to send to SQS', details: err.message });
  }
});

// Graceful shutdown support
let server;
function start() {
  server = app.listen(PORT, () => {
    logger.info({ port: PORT }, 'reflectapp listening');
  });
}

async function shutdown(signal) {
  logger.info({ signal }, 'Received shutdown signal — starting graceful shutdown');
  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }
  // If the app had background processing, you'd stop it here.
  // Wait a short time for in-flight requests
  await new Promise((r) => setTimeout(r, 3000));
  logger.info('Graceful shutdown complete, exiting');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
