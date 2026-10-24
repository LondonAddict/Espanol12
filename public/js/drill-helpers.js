/**
 * Small helpers shared by the listening drills (listening-recognize.js,
 * listening-choice.js, listening-answer.js): shuffling item order, HTML
 * escaping, and the row of numbered jump buttons that lets a student skip
 * straight to a specific item instead of only moving via Next (e.g. "I did
 * 1-10 already, let me jump to 11").
 */
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

function escapeAttrListen(str) {
  return String(str || '').replace(/"/g, '&quot;');
}

function renderJumpRow(total, currentIndex) {
  let buttons = '';
  for (let i = 0; i < total; i++) {
    buttons += `<button class="jump-btn secondary${i === currentIndex ? ' active' : ''}" data-index="${i}">${i + 1}</button>`;
  }
  return `<div class="jump-row">${buttons}</div>`;
}

function wireJumpRow(container, onJump) {
  container.querySelectorAll('.jump-btn').forEach((btn) => {
    btn.addEventListener('click', () => onJump(parseInt(btn.dataset.index, 10)));
  });
}
