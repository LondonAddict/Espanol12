/**
 * AI Speaking Practice chat widget. Mounts into `container`. Talks to
 * POST /api/chat, which builds the system prompt server-side from the
 * class's phrase bank so the AI only ever produces those phrases.
 */
function mountSpeakingPractice(container, classData) {
  container.innerHTML = `
    <div class="chat-window" id="chat-window"></div>
    <div class="chat-input-row">
      <input type="text" id="chat-input" placeholder="Type your reply in Spanish..." disabled />
      <button id="chat-send" disabled>Send</button>
    </div>
    <div class="chat-controls">
      <button id="chat-start">Start Conversation</button>
      <button class="secondary" id="chat-end" disabled>End Conversation</button>
    </div>
  `;

  const windowEl = container.querySelector('#chat-window');
  const input = container.querySelector('#chat-input');
  const sendBtn = container.querySelector('#chat-send');
  const startBtn = container.querySelector('#chat-start');
  const endBtn = container.querySelector('#chat-end');

  let history = [];
  let active = false;

  function addBubble(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.textContent = text;
    windowEl.appendChild(bubble);
    windowEl.scrollTop = windowEl.scrollHeight;
  }

  function setActive(isActive) {
    active = isActive;
    input.disabled = !isActive;
    sendBtn.disabled = !isActive;
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
}
