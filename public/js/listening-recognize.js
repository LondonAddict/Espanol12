/**
 * "Listen & Recognize" drill. Mounts into `container` from
 * `exerciseData.items`, an array of { es, en, audio? }. Plays one clip at a
 * time (a real audio file if `audio` is set, otherwise browser TTS reading
 * `es`) and lets the student reveal the answer (Spanish text + English
 * translation) whenever they're ready to check themselves - there's no
 * right/wrong scoring, this is pure recognition practice. Item order is
 * shuffled on each mount.
 */
function mountListeningRecognize(container, exerciseData) {
  const items = shuffleCopy((exerciseData && exerciseData.items) || []);
  if (!items.length) {
    container.innerHTML = '<p>No listening items available yet.</p>';
    return;
  }

  let index = 0;

  function renderItem() {
    const item = items[index];

    container.innerHTML = `
      <p class="quiz-progress">Item ${index + 1} / ${items.length}</p>
      <div class="price-prompt">
        <button id="lr-play">🔊 Play</button>
      </div>
      <div class="price-answer-row">
        <button class="secondary" id="lr-reveal">Show answer</button>
      </div>
      <div class="price-feedback" id="lr-answer" hidden></div>
      <button id="lr-next" class="secondary">${index === items.length - 1 ? 'See Results' : 'Next →'}</button>
    `;

    const playBtn = container.querySelector('#lr-play');
    const revealBtn = container.querySelector('#lr-reveal');
    const answerEl = container.querySelector('#lr-answer');
    const nextBtn = container.querySelector('#lr-next');

    playBtn.addEventListener('click', () => playClip(item));

    revealBtn.addEventListener('click', () => {
      answerEl.hidden = false;
      answerEl.className = 'price-feedback correct';
      answerEl.innerHTML = `<strong>${escapeHtmlListen(item.es)}</strong>${item.en ? ` — ${escapeHtmlListen(item.en)}` : ''}`;
      revealBtn.disabled = true;
    });

    nextBtn.addEventListener('click', () => {
      if (index < items.length - 1) {
        index += 1;
        renderItem();
      } else {
        renderResults();
      }
    });
  }

  function renderResults() {
    container.innerHTML = `
      <div class="quiz-result">You've gone through all ${items.length} items.</div>
      <button id="lr-retake" class="secondary">Start Again</button>
    `;
    container.querySelector('#lr-retake').addEventListener('click', () => {
      index = 0;
      renderItem();
    });
  }

  renderItem();
}

function shuffleCopy(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function escapeHtmlListen(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
