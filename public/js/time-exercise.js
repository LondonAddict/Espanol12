/**
 * Time dictation exercise. Mounts into `container` from
 * `exerciseData.items`, an array of { digital, base, daypart, requireDaypart }.
 * Shows a 24-hour digital time and asks the student to type the Spanish
 * "a las…" form. When requireDaypart is false, the de la mañana/tarde/noche
 * suffix is optional; when true, the student must include the exact daypart
 * given (this is how we test the 24h-to-12h conversion, e.g. 18:00 -> "a las
 * seis de la tarde").
 */
function mountTimeExercise(container, exerciseData) {
  const items = (exerciseData && exerciseData.items) || [];
  if (!items.length) {
    container.innerHTML = '<p>No time exercise available yet.</p>';
    return;
  }

  let index = 0;
  let correctCount = 0;

  function acceptedAnswers(item) {
    if (item.requireDaypart) {
      return [`${item.base} ${item.daypart}`];
    }
    return [item.base, `${item.base} de la mañana`, `${item.base} de la tarde`, `${item.base} de la noche`];
  }

  function correctAnswerLabel(item) {
    return item.requireDaypart ? `${item.base} ${item.daypart}` : item.base;
  }

  function normalizeTime(str) {
    return String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[¿?¡!.,]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function renderQuestion() {
    const item = items[index];

    container.innerHTML = `
      <p class="quiz-progress">Time ${index + 1} / ${items.length}</p>
      <div class="price-prompt">
        <p class="price-words">${escapeHtmlTime(item.digital)}</p>
      </div>
      <div class="price-answer-row">
        <input type="text" id="time-input" placeholder="e.g. a las nueve y media" autocomplete="off" />
        <button id="time-check">Check</button>
      </div>
      <div class="price-feedback" id="time-feedback"></div>
      <button id="time-next" class="secondary" hidden></button>
    `;

    const input = container.querySelector('#time-input');
    const checkBtn = container.querySelector('#time-check');
    const feedback = container.querySelector('#time-feedback');
    const nextBtn = container.querySelector('#time-next');
    let answered = false;

    function check() {
      if (answered) return;
      const normalized = normalizeTime(input.value);
      const accepted = acceptedAnswers(item).map(normalizeTime);
      const isCorrect = accepted.includes(normalized);
      answered = true;
      input.disabled = true;
      checkBtn.disabled = true;

      if (isCorrect) {
        correctCount += 1;
        feedback.textContent = '✅ ¡Correcto!';
        feedback.className = 'price-feedback correct';
      } else {
        feedback.textContent = `❌ Era "${correctAnswerLabel(item)}"`;
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
      <button id="time-retake" class="secondary">Try Again</button>
    `;
    container.querySelector('#time-retake').addEventListener('click', () => {
      index = 0;
      correctCount = 0;
      renderQuestion();
    });
  }

  renderQuestion();
}

function escapeHtmlTime(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
