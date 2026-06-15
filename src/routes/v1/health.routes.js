const express = require('express');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    data: { status: 'ok' },
  });
});

router.get('/ready', async (_req, res) => {
  res.json({
    success: true,
    message: 'API is ready',
    data: { status: 'ready' },
  });
});

module.exports = router;
