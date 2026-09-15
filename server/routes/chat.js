const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { getClassData } = require('../data');

const router = express.Router();

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';
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
    'When the student asks a question that has a real answer in the phrase bank (e.g. "¿Qué tal?" or "¿Cómo estás?"), actually answer it with an appropriate reply phrase (e.g. "Bien, gracias. ¿Y tú?") before continuing - do not just deflect by asking the same question back every time.',
    '',
    'You have some freedom in HOW you combine and order these phrases - do not follow an identical script every conversation. When more than one phrase in the bank fits the same moment (e.g. "¿Qué tal?" vs "¿Cómo estás?", "Bien, gracias. ¿Y tú?" vs "Muy bien, gracias", "Adiós" vs "Hasta luego"), vary which one you pick rather than always defaulting to the same choice, so repeat conversations feel a little different each time - while staying strictly within the phrase bank (plus its natural variants).',
    '',
    'If the student makes a small mistake while clearly attempting one of the target phrases (wrong verb conjugation, wrong gender ending, etc. - e.g. saying "me llamas" instead of "me llamo"), gently correct them in-character: briefly say the correct form in a warm, encouraging way (e.g. "¡Casi! Se dice \'me llamo\'.") and then continue the conversation - do not give a long grammar explanation, just model the correct phrase naturally and move on. If they go off-script or say something unrelated instead of attempting a target phrase, gently steer the conversation back toward the phrase bank rather than correcting unrelated language. Keep every response short: one or two brief sentences, in Spanish, appropriate for a total beginner.',
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
    let detail = 'unavailable right now';
    if (err instanceof Anthropic.NotFoundError) {
      console.error('AI chat error - model not found:', MODEL, err.message);
      detail = 'misconfigured (the configured model ID was not found - check ANTHROPIC_MODEL)';
    } else if (err instanceof Anthropic.AuthenticationError) {
      console.error('AI chat error - authentication failed:', err.message);
      detail = 'misconfigured (the API key was rejected - check ANTHROPIC_API_KEY)';
    } else if (err instanceof Anthropic.PermissionDeniedError) {
      console.error('AI chat error - permission denied:', err.message);
      detail = 'misconfigured (the API key does not have access to this model)';
    } else if (err instanceof Anthropic.RateLimitError) {
      console.error('AI chat error - rate limited:', err.message);
      detail = 'busy right now - please try again in a moment';
    } else if (err instanceof Anthropic.APIError) {
      console.error('AI chat error:', err.status, err.type, err.message);
      detail = `unavailable right now (${err.type || err.status})`;
    } else {
      console.error('AI chat error:', err.message);
    }
    res.status(502).json({ error: `The AI conversation partner is ${detail}.` });
  }
});

module.exports = router;
