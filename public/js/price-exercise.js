/**
 * Price listening/reading exercise. Mounts into `container` from
 * `exerciseData.items`, an array of { words, euros, cents }. Shows one
 * price at a time (as Spanish words, plus an optional 🔊 to hear it) and
 * asks the student to type the numeric amount. Accepts either a comma or
 * a dot as the decimal separator (e.g. "3,70" or "3.70").
 */
function mountPriceExercise(container, exerciseData) {
  const items = (exerciseData && exerciseData.items) || [];
  if (!items.length) {
    container.innerHTML = '<p>No price exercise available yet.</p>';
    return;
  }

  const speechSupported = typeof isSpeechSynthesisSupported === 'function' && isSpeechSynthesisSupported();
  let index = 0;
  let correctCount = 0;

  function expectedValue(item) {
    return item.euros + item.cents / 100;
  }

  function expectedLabel(item) {
    return `${item.euros},${String(item.cents).padStart(2, '0')}`;
  }

  function parseAnswer(raw) {
    const normalized = String(raw).trim().replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
    return parseFloat(normalized);
  }

  function renderQuestion() {
    const item = items[index];

    container.innerHTML = `
      <p class="quiz-progress">Price ${index + 1} / ${items.length}</p>
      <div class="price-prompt">
        <p class="price-words">${escapeHtmlPrice(item.words)}</p>
        ${speechSupported ? '<button class="secondary" id="price-listen">🔊 Listen</button>' : ''}
      </div>
      <div class="price-answer-row">
        <input type="text" id="price-input" placeholder="e.g. 3,70" inputmode="decimal" autocomplete="off" />
        <button id="price-check">Check</button>
      </div>
      <div class="price-feedback" id="price-feedback"></div>
      <button id="price-next" class="secondary" hidden></button>
    `;

    const listenBtn = container.querySelector('#price-listen');
    const input = container.querySelector('#price-input');
    const checkBtn = container.querySelector('#price-check');
    const feedback = container.querySelector('#price-feedback');
    const nextBtn = container.querySelector('#price-next');
    let answered = false;

    if (listenBtn) {
      listenBtn.addEventListener('click', () => speakSpanish(item.words));
    }

    function check() {
      if (answered) return;
      const parsed = parseAnswer(input.value);
      const isCorrect = parsed !== null && Math.abs(parsed - expectedValue(item)) < 0.001;
      answered = true;
      input.disabled = true;
      checkBtn.disabled = true;

      if (isCorrect) {
        correctCount += 1;
        feedback.textContent = '✅ ¡Correcto!';
        feedback.className = 'price-feedback correct';
      } else {
        feedback.textContent = `❌ Era ${expectedLabel(item)} € (${item.words})`;
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
      <button id="price-retake" class="secondary">Try Again</button>
    `;
    container.querySelector('#price-retake').addEventListener('click', () => {
      index = 0;
      correctCount = 0;
      renderQuestion();
    });
  }

  renderQuestion();
}

function escapeHtmlPrice(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
