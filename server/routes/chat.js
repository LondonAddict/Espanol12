const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { getClassData } = require('../data');

const router = express.Router();

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
const MAX_HISTORY_TURNS = 20;

let anthropicClient = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

function buildSystemPrompt(classData) {
  const { title, phraseBank, speakingPractice } = classData;
  const scenario = speakingPractice && speakingPractice.scenario
    ? speakingPractice.scenario
    : 'You are a friendly conversation partner practicing Spanish with a beginner student.';
  const goalOrder = speakingPractice && Array.isArray(speakingPractice.goalOrder)
    ? speakingPractice.goalOrder.map((step, i) => `${i + 1}. ${step}`).join('\n')
    : '';

  return [
    `You are a friendly Spanish conversation partner helping a beginner practice for Class ${classData.number}: "${title}".`,
    scenario,
    '',
    'STRICT RULE: You may ONLY use the following phrases, spoken in Spanish, exactly as written or with minor natural variants (e.g. adjusting for gender, or combining two of them). Do NOT introduce any Spanish vocabulary or grammar that is not on this list, and do not switch to English unless the student seems completely stuck and needs a one-word hint.',
    '',
    'PHRASE BANK:',
    phraseBank.map((p) => `- ${p}`).join('\n'),
    '',
    goalOrder ? `Try to guide the conversation naturally through this order, one step per turn:\n${goalOrder}` : '',
    '',
    'If the student replies with something reasonable but imperfect, accept it warmly and continue - do not correct their grammar or break character. If they go off-script or say something unrelated, gently steer the conversation back toward the phrase bank rather than lecturing them. Keep every response short: one or two brief sentences, in Spanish, appropriate for a total beginner.',
  ].filter(Boolean).join('\n');
}

router.post('/', async (req, res) => {
  const { classId, message, history } = req.body || {};

  if (!classId || typeof classId !== 'string') {
    return res.status(400).json({ error: 'classId is required.' });
  }

  const classData = getClassData(classId);
  if (!classData) {
    return res.status(404).json({ error: 'Class not found or not published yet.' });
  }

  const client = getClient();
  if (!client) {
    return res.status(503).json({
      error: 'AI Speaking Practice is not configured yet. Ask your admin to set ANTHROPIC_API_KEY.',
    });
  }

  const safeHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_TURNS) : [];
  const messages = safeHistory
    .filter((turn) => turn && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string')
    .map((turn) => ({ role: turn.role, content: turn.content }));

  if (typeof message === 'string' && message.trim()) {
    messages.push({ role: 'user', content: message.trim() });
  }

  if (messages.length === 0) {
    return res.status(400).json({ error: 'No message provided.' });
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: buildSystemPrompt(classData),
      messages,
    });

    const reply = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.status(502).json({ error: 'The AI conversation partner is unavailable right now. Please try again.' });
  }
});

module.exports = router;
