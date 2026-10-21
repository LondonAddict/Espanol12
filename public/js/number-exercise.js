/**
 * Number listening/reading exercise. Mounts into `container` from
 * `exerciseData.items`, an array of { words, label, number }. Shows a
 * spoken Spanish number (plus an optional 🔊 to hear it) in context
 * (e.g. "la habitación ciento ocho") and asks the student to type just
 * the digits (e.g. 108).
 */
function mountNumberExercise(container, exerciseData) {
  const items = (exerciseData && exerciseData.items) || [];
  if (!items.length) {
    container.innerHTML = '<p>No number exercise available yet.</p>';
    return;
  }

  const speechSupported = typeof isSpeechSynthesisSupported === 'function' && isSpeechSynthesisSupported();
  let index = 0;
  let correctCount = 0;

  function parseAnswer(raw) {
    const normalized = String(raw).trim();
    if (!/^\d+$/.test(normalized)) return null;
    return parseInt(normalized, 10);
  }

  function renderQuestion() {
    const item = items[index];

    container.innerHTML = `
      <p class="quiz-progress">Number ${index + 1} / ${items.length}</p>
      <div class="price-prompt">
        <p class="price-words">${escapeHtmlNumber(item.words)}</p>
        ${speechSupported ? '<button class="secondary" id="number-listen">🔊 Listen</button>' : ''}
      </div>
      <div class="price-answer-row">
        <input type="text" id="number-input" placeholder="e.g. 108" inputmode="numeric" autocomplete="off" />
        <button id="number-check">Check</button>
      </div>
      <div class="price-feedback" id="number-feedback"></div>
      <button id="number-next" class="secondary" hidden></button>
    `;

    const listenBtn = container.querySelector('#number-listen');
    const input = container.querySelector('#number-input');
    const checkBtn = container.querySelector('#number-check');
    const feedback = container.querySelector('#number-feedback');
    const nextBtn = container.querySelector('#number-next');
    let answered = false;

    if (listenBtn) {
      listenBtn.addEventListener('click', () => speakSpanish(item.words));
    }

    function check() {
      if (answered) return;
      const parsed = parseAnswer(input.value);
      const isCorrect = parsed !== null && parsed === item.number;
      answered = true;
      input.disabled = true;
      checkBtn.disabled = true;

      if (isCorrect) {
        correctCount += 1;
        feedback.textContent = '✅ ¡Correcto!';
        feedback.className = 'price-feedback correct';
      } else {
        feedback.textContent = `❌ Era ${item.number} (${item.words})`;
        feedback.className = 'price-feedback incorrect';
      }

      nextBtn.hidden = false;
      nextBtn.textContent = index === items.length - 1 ? 'See Results' : 'Next →';
    }

    checkBtn.addEventListener('click', check);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') check();
    });

    nextBtn.addEventListener('click', () => {
      if (index < items.length - 1) {
        index += 1;
        renderQuestion();
      } else {
        renderResults();
      }
    });

    input.focus();
  }

  function renderResults() {
    container.innerHTML = `
      <div class="quiz-result">You scored ${correctCount} / ${items.length}</div>
      <button id="number-retake" class="secondary">Try Again</button>
    `;
    container.querySelector('#number-retake').addEventListener('click', () => {
      index = 0;
      correctCount = 0;
      renderQuestion();
    });
  }

  renderQuestion();
}

function escapeHtmlNumber(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
