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

/**
 * Plays a listening-drill item's real audio file if it has one (item.audio),
 * otherwise falls back to browser text-to-speech on its Spanish text. Lets a
 * class mix real recorded/uploaded clips with TTS-read items with no change
 * in how the rest of the page calls it.
 */
function playClip(item) {
  if (item && item.audio) {
    const audio = new Audio(item.audio);
    audio.play().catch(() => speakSpanish(item.es));
    return;
  }
  speakSpanish(item && item.es);
}
