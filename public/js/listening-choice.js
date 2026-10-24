/**
 * "Listen & Choose" drill. Mounts into `container` from
 * `exerciseData.items`, an array of { es, choices, answer, audio? }. The
 * student plays a clip of a Spanish question (`es`, read via real audio if
 * `audio` is set, otherwise browser TTS) and picks the correct response from
 * three Spanish `choices` - like the quiz engine, but the prompt is heard
 * rather than read. The question text is revealed after answering so the
 * student can confirm what they heard. Item order is shuffled on each mount.
 */
function mountListeningChoice(container, exerciseData) {
  const items = shuffleCopy((exerciseData && exerciseData.items) || []);
  if (!items.length) {
    container.innerHTML = '<p>No listening items available yet.</p>';
    return;
  }

  let index = 0;
  let correctCount = 0;

  function renderQuestion() {
    const item = items[index];

    container.innerHTML = `
      <p class="quiz-progress">Question ${index + 1} / ${items.length}</p>
      <div class="price-prompt">
        <button id="lc-play">🔊 Play the question</button>
      </div>
      <div class="quiz-choices">
        ${item.choices
          .map((choice) => `<button class="quiz-choice" data-choice="${escapeAttrListen(choice)}">${escapeHtmlListen(choice)}</button>`)
          .join('')}
      </div>
      <div class="price-feedback" id="lc-feedback"></div>
      <button id="lc-next" class="secondary" hidden></button>
    `;

    const playBtn = container.querySelector('#lc-play');
    const choiceButtons = container.querySelectorAll('.quiz-choice');
    const feedback = container.querySelector('#lc-feedback');
    const nextBtn = container.querySelector('#lc-next');
    let answered = false;

    playBtn.addEventListener('click', () => playClip(item));

    choiceButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const isCorrect = btn.dataset.choice === item.answer;
        if (isCorrect) correctCount += 1;

        choiceButtons.forEach((b) => {
          if (b.dataset.choice === item.answer) {
            b.classList.add('correct');
          } else if (b === btn) {
            b.classList.add('incorrect');
          }
        });

        feedback.innerHTML = `You heard: <strong>${escapeHtmlListen(item.es)}</strong>`;
        feedback.className = 'price-feedback correct';

        nextBtn.hidden = false;
        nextBtn.textContent = index === items.length - 1 ? 'See Results' : 'Next →';
      });
    });

    nextBtn.addEventListener('click', () => {
      if (index < items.length - 1) {
        index += 1;
        renderQuestion();
      } else {
        renderResults();
      }
    });
  }

  function renderResults() {
    container.innerHTML = `
      <div class="quiz-result">You scored ${correctCount} / ${items.length}</div>
      <button id="lc-retake" class="secondary">Try Again</button>
    `;
    container.querySelector('#lc-retake').addEventListener('click', () => {
      index = 0;
      correctCount = 0;
      renderQuestion();
    });
  }

  renderQuestion();
}

function escapeAttrListen(str) {
  return String(str || '').replace(/"/g, '&quot;');
}
