/**
 * "Listen & Answer" drill. Mounts into `container` from
 * `exerciseData.items`, an array of { es, exampleAnswers, audio? }. The
 * student plays a clip of a Spanish question - but instead of picking from
 * multiple choice, they come up with their own spoken/typed-in-their-head
 * answer first. Both the written question text and the example answer(s)
 * start hidden and can be revealed independently as separate hints, so a
 * student can check just the wording without seeing the answer, or vice
 * versa. No scoring, pure practice. Items with a real recording are
 * shuffled and played first, then TTS-only items (shuffled among
 * themselves) fill out the rest - see shuffleRealAudioFirst() in
 * drill-helpers.js. The numbered row lets a student jump straight to a
 * specific item instead of only moving via Next.
 */
function mountListeningAnswer(container, exerciseData) {
  const items = shuffleRealAudioFirst((exerciseData && exerciseData.items) || []);
  if (!items.length) {
    container.innerHTML = '<p>No listening items available yet.</p>';
    return;
  }

  let index = 0;

  function renderItem() {
    const item = items[index];
    const examples = item.exampleAnswers || [];

    container.innerHTML = `
      <p class="quiz-progress">Question ${index + 1} / ${items.length}</p>
      ${renderJumpRow(items.length, index)}
      <div class="price-prompt">
        <button id="la-play">🔊 Play the question</button>
      </div>
      <p>Think of your own answer (out loud or in your head), then check it below.</p>
      <div class="price-answer-row">
        <button class="secondary" id="la-reveal-text">Show question text</button>
        <button class="secondary" id="la-reveal-answer">Show example answer${examples.length > 1 ? 's' : ''}</button>
      </div>
      <div class="price-feedback" id="la-text" hidden></div>
      <div class="price-feedback" id="la-answer" hidden></div>
      <button id="la-next" class="secondary">${index === items.length - 1 ? 'See Results' : 'Next →'}</button>
    `;

    wireJumpRow(container, (i) => {
      index = i;
      renderItem();
    });

    const playBtn = container.querySelector('#la-play');
    const revealTextBtn = container.querySelector('#la-reveal-text');
    const revealAnswerBtn = container.querySelector('#la-reveal-answer');
    const textEl = container.querySelector('#la-text');
    const answerEl = container.querySelector('#la-answer');
    const nextBtn = container.querySelector('#la-next');

    playBtn.addEventListener('click', () => playClip(item));

    revealTextBtn.addEventListener('click', () => {
      textEl.hidden = false;
      textEl.className = 'price-feedback correct';
      textEl.innerHTML = `You heard: <strong>${escapeHtmlListen(item.es)}</strong>`;
      revealTextBtn.disabled = true;
    });

    revealAnswerBtn.addEventListener('click', () => {
      answerEl.hidden = false;
      answerEl.className = 'price-feedback correct';
      answerEl.innerHTML = examples.map((a) => `Example: <strong>${escapeHtmlListen(a)}</strong>`).join('<br>');
      revealAnswerBtn.disabled = true;
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
      <div class="quiz-result">You've gone through all ${items.length} questions.</div>
      <button id="la-retake" class="secondary">Start Again</button>
    `;
    container.querySelector('#la-retake').addEventListener('click', () => {
      index = 0;
      renderItem();
    });
  }

  renderItem();
}
