require('dotenv').config();

const path = require('path');
const express = require('express');

const classesRouter = require('./routes/classes');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/classes', classesRouter);
app.use('/api/chat', chatRouter);

// Diagnostic endpoint for checking env var configuration without exposing
// secrets - useful when troubleshooting "not configured" errors on a host
// like Railway where the key is set but the running deploy may be stale.
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    anthropicKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    aiProvider: process.env.AI_PROVIDER || null,
    model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5 (default)',
    deployedAt: new Date().toISOString(),
  });
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/class/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'class.html'));
});

app.listen(PORT, () => {
  console.log(`Espanol12 server running on port ${PORT}`);
});
