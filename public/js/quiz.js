/**
 * Generic multiple-choice quiz engine. Mounts into `container` from a
 * `questions` array of { question, choices, answer }.
 */
function mountQuiz(container, questions) {
  if (!questions || questions.length === 0) {
    container.innerHTML = '<p>No quiz available yet.</p>';
    return;
  }

  const answers = new Array(questions.length).fill(null);

  container.innerHTML = questions
    .map(
      (q, qIndex) => `
      <div class="quiz-question" data-qindex="${qIndex}">
        <p class="prompt">${qIndex + 1}. ${escapeHtml(q.question)}</p>
        <div class="quiz-choices">
          ${q.choices
            .map(
              (choice, cIndex) => `
              <button class="quiz-choice" data-cindex="${cIndex}">${escapeHtml(choice)}</button>
            `
            )
            .join('')}
        </div>
      </div>
    `
    )
    .join('') + `
      <button id="quiz-submit">Check Answers</button>
      <div class="quiz-result" id="quiz-result"></div>
    `;

  container.querySelectorAll('.quiz-question').forEach((qEl) => {
    const qIndex = Number(qEl.dataset.qindex);
    qEl.querySelectorAll('.quiz-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        answers[qIndex] = btn.textContent;
        qEl.querySelectorAll('.quiz-choice').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        btn.style.outline = '2px solid #c1440e';
        qEl.querySelectorAll('.quiz-choice').forEach((b) => {
          if (b !== btn) b.style.outline = 'none';
        });
      });
    });
  });

  container.querySelector('#quiz-submit').addEventListener('click', () => {
    let correctCount = 0;
    questions.forEach((q, qIndex) => {
      const qEl = container.querySelector(`.quiz-question[data-qindex="${qIndex}"]`);
      const isCorrect = answers[qIndex] === q.answer;
      if (isCorrect) correctCount += 1;
      qEl.querySelectorAll('.quiz-choice').forEach((btn) => {
        if (btn.textContent === q.answer) {
          btn.classList.add('correct');
        } else if (btn.textContent === answers[qIndex]) {
          btn.classList.add('incorrect');
        }
      });
    });
    const resultEl = container.querySelector('#quiz-result');
    resultEl.textContent = `You scored ${correctCount} / ${questions.length}`;
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
