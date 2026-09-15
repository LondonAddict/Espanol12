/**
 * Shared helper for pronouncing Spanish text aloud using the browser's
 * built-in text-to-speech (Web Speech API). No backend/API cost, and it
 * works for any word/phrase without needing hand-authored phonetics.
 */
function isSpeechSynthesisSupported() {
  return 'speechSynthesis' in window;
}

function speakSpanish(text) {
  if (!isSpeechSynthesisSupported() || !text) return;
  window.speechSynthesis.cancel(); // stop anything currently playing
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}
