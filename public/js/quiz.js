/**
 * Generic multiple-choice quiz engine. Mounts into `container` from a
 * `questions` array of { question, choices, answer }. Shows one question
 * at a time with immediate feedback, then a final score screen.
 */
function mountQuiz(container, questions) {
  if (!questions || questions.length === 0) {
    container.innerHTML = '<p>No quiz available yet.</p>';
    return;
  }

  let qIndex = 0;
  let correctCount = 0;
  let answered = false;

  function renderQuestion() {
    const q = questions[qIndex];
    container.innerHTML = `
      <p class="quiz-progress">Question ${qIndex + 1} / ${questions.length}</p>
      <div class="quiz-question">
        <p class="prompt">${escapeHtml(q.question)}</p>
        <div class="quiz-choices">
          ${q.choices
            .map((choice) => `<button class="quiz-choice" data-choice="${escapeAttrQuiz(choice)}">${escapeHtml(choice)}</button>`)
            .join('')}
        </div>
      </div>
      <button id="quiz-next" hidden></button>
    `;

    answered = false;
    const choiceButtons = container.querySelectorAll('.quiz-choice');
    const nextBtn = container.querySelector('#quiz-next');

    choiceButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const isCorrect = btn.dataset.choice === q.answer;
        if (isCorrect) correctCount += 1;

        choiceButtons.forEach((b) => {
          if (b.dataset.choice === q.answer) {
            b.classList.add('correct');
          } else if (b === btn) {
            b.classList.add('incorrect');
          }
        });

        nextBtn.hidden = false;
        nextBtn.textContent = qIndex === questions.length - 1 ? 'See Results' : 'Next Question →';
      });
    });

    nextBtn.addEventListener('click', () => {
      if (qIndex < questions.length - 1) {
        qIndex += 1;
        renderQuestion();
      } else {
        renderResults();
      }
    });
  }

  function renderResults() {
    container.innerHTML = `
      <div class="quiz-result">You scored ${correctCount} / ${questions.length}</div>
      <button id="quiz-retake" class="secondary">Retake Quiz</button>
    `;
    container.querySelector('#quiz-retake').addEventListener('click', () => {
      qIndex = 0;
      correctCount = 0;
      renderQuestion();
    });
  }

  renderQuestion();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function escapeAttrQuiz(str) {
  return String(str).replace(/"/g, '&quot;');
}
