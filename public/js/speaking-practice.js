/**
 * AI Speaking Practice chat widget. Mounts into `container`. Talks to
 * POST /api/chat, which builds the system prompt server-side from the
 * class's phrase bank so the AI only ever produces those phrases.
 */
function mountSpeakingPractice(container, classData) {
  const speechSupported = typeof isSpeechSynthesisSupported === 'function' && isSpeechSynthesisSupported();

  container.innerHTML = `
    <div class="chat-window" id="chat-window"></div>
    <div class="chat-input-row">
      <input type="text" id="chat-input" placeholder="Type your reply in Spanish..." disabled />
      <button class="secondary" id="chat-mic" disabled title="Tap to speak, tap again when done" hidden>🎤</button>
      <button id="chat-send" disabled>Send</button>
    </div>
    <div class="chat-controls">
      <button id="chat-start">Start Conversation</button>
      <button class="secondary" id="chat-end" disabled>End Conversation</button>
      ${speechSupported ? '<button class="secondary" id="chat-autospeak" aria-pressed="true">🔊 Auto-speak: On</button>' : ''}
    </div>
  `;

  const windowEl = container.querySelector('#chat-window');
  const input = container.querySelector('#chat-input');
  const sendBtn = container.querySelector('#chat-send');
  const micBtn = container.querySelector('#chat-mic');
  const startBtn = container.querySelector('#chat-start');
  const endBtn = container.querySelector('#chat-end');
  const autospeakBtn = container.querySelector('#chat-autospeak');

  let history = [];
  let active = false;
  let autospeak = true;

  if (autospeakBtn) {
    autospeakBtn.addEventListener('click', () => {
      autospeak = !autospeak;
      autospeakBtn.setAttribute('aria-pressed', String(autospeak));
      autospeakBtn.textContent = autospeak ? '🔊 Auto-speak: On' : '🔇 Auto-speak: Off';
      if (!autospeak) window.speechSynthesis.cancel();
    });
  }

  function addBubble(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;

    if (role === 'ai' && speechSupported) {
      const textSpan = document.createElement('span');
      textSpan.textContent = text;
      bubble.appendChild(textSpan);

      const speakBtn = document.createElement('button');
      speakBtn.className = 'speak-btn';
      speakBtn.type = 'button';
      speakBtn.title = 'Listen';
      speakBtn.setAttribute('aria-label', 'Listen to this reply');
      speakBtn.textContent = '🔊';
      speakBtn.addEventListener('click', () => speakSpanish(text));
      bubble.appendChild(speakBtn);

      if (autospeak) speakSpanish(text);
    } else {
      bubble.textContent = text;
    }

    windowEl.appendChild(bubble);
    windowEl.scrollTop = windowEl.scrollHeight;
  }

  function setActive(isActive) {
    active = isActive;
    input.disabled = !isActive;
    sendBtn.disabled = !isActive;
    micBtn.disabled = !isActive;
    startBtn.disabled = isActive;
    endBtn.disabled = !isActive;
  }

  async function callChat(userMessage) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classId: classData.id,
        message: userMessage || null,
        history,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Something went wrong.');
    }
    return data.reply;
  }

  startBtn.addEventListener('click', async () => {
    windowEl.innerHTML = '';
    history = [];
    setActive(true);
    addBubble('system', 'Conversation started. Reply in Spanish using what you learned!');

    const opening =
      (classData.speakingPractice && classData.speakingPractice.openingLine) || null;

    if (opening) {
      addBubble('ai', opening);
      history.push({ role: 'assistant', content: opening });
    } else {
      try {
        const reply = await callChat(null);
        addBubble('ai', reply);
        history.push({ role: 'assistant', content: reply });
      } catch (err) {
        addBubble('system', err.message);
      }
    }
  });

  endBtn.addEventListener('click', () => {
    setActive(false);
    addBubble('system', 'Conversation ended. Great practice!');
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || !active) return;
    addBubble('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    sendBtn.disabled = true;

    try {
      const reply = await callChat(text);
      addBubble('ai', reply);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      addBubble('system', err.message);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  setupVoiceInput(micBtn, input, sendMessage);
}

/**
 * Wires a microphone button to the browser's Web Speech API so students
 * can speak their reply instead of typing it. Hidden entirely in
 * browsers that don't support SpeechRecognition (e.g. Firefox, Safari).
 */
function setupVoiceInput(micBtn, input, sendMessage) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return; // stays hidden
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = true; // don't auto-stop on a mid-sentence pause
  recognition.interimResults = true; // show live transcript while speaking
  recognition.maxAlternatives = 1;

  let listening = false;
  let stoppedManually = false;
  // Keyed by result index rather than appended, because some browsers
  // (notably Android Chrome) can re-fire the same index as "final" more
  // than once in continuous mode - concatenating blindly duplicated words.
  let finalSegments = [];

  micBtn.hidden = false;

  function resetButton() {
    listening = false;
    micBtn.classList.remove('active');
    micBtn.textContent = '🎤';
    micBtn.title = 'Speak your reply';
  }

  function currentFinalText() {
    return finalSegments.filter(Boolean).join(' ');
  }

  recognition.addEventListener('result', (event) => {
    let interim = '';
    // Rebuild from index 0 every time (not just from event.resultIndex) so
    // a re-finalized index overwrites its slot instead of adding a new one.
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalSegments[i] = result[0].transcript.trim();
      } else {
        interim += result[0].transcript;
      }
    }
    input.value = (currentFinalText() + ' ' + interim).trim();
  });

  // Fires when recognition actually stops - either because the student
  // clicked the button again (stoppedManually) or the browser gave up on
  // its own (e.g. long silence). Only send the message on manual stop, so
  // a normal mid-sentence pause never cuts the student off.
  recognition.addEventListener('end', () => {
    resetButton();
    const text = currentFinalText() || input.value.trim();
    finalSegments = [];
    if (stoppedManually && text) {
      input.value = text;
      sendMessage();
    }
    stoppedManually = false;
  });

  recognition.addEventListener('error', () => {
    resetButton();
    finalSegments = [];
    stoppedManually = false;
  });

  micBtn.addEventListener('click', () => {
    if (micBtn.disabled) return;
    if (listening) {
      stoppedManually = true;
      micBtn.textContent = '…';
      recognition.stop(); // triggers 'end', which sends the accumulated text
      return;
    }
    listening = true;
    stoppedManually = false;
    finalSegments = [];
    input.value = '';
    micBtn.classList.add('active');
    micBtn.textContent = '⏹';
    micBtn.title = 'Tap again when you’re done speaking';
    try {
      recognition.start();
    } catch (err) {
      resetButton();
    }
  });
}
