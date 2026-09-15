/**
 * Generic flashcard engine. Mounts a flippable Spanish/English flashcard
 * deck into `container` from a `vocab` array of { es, en }. Supports
 * switching direction (Spanish-first or English-first).
 */
function mountFlashcards(container, vocab) {
  if (!vocab || vocab.length === 0) {
    container.innerHTML = '<p>No vocabulary available yet.</p>';
    return;
  }

  let index = 0;
  let flipped = false;
  let direction = 'es-en'; // 'es-en' shows Spanish first, 'en-es' shows English first

  const speechSupported = typeof isSpeechSynthesisSupported === 'function' && isSpeechSynthesisSupported();

  container.innerHTML = `
    <div class="flashcard-controls" style="margin-bottom: 0.75rem;">
      <button class="secondary" id="fc-direction"></button>
      ${speechSupported ? '<button class="secondary" id="fc-speak">🔊 Listen</button>' : ''}
    </div>
    <div class="flashcard" id="fc-card">
      <div class="flashcard-inner">
        <div class="flashcard-face front" id="fc-front"></div>
        <div class="flashcard-face back" id="fc-back"></div>
      </div>
    </div>
    <div class="flashcard-controls">
      <button class="secondary" id="fc-prev">&larr; Prev</button>
      <span class="flashcard-progress" id="fc-progress"></span>
      <button class="secondary" id="fc-next">Next &rarr;</button>
    </div>
  `;

  const card = container.querySelector('#fc-card');
  const front = container.querySelector('#fc-front');
  const back = container.querySelector('#fc-back');
  const progress = container.querySelector('#fc-progress');
  const prevBtn = container.querySelector('#fc-prev');
  const nextBtn = container.querySelector('#fc-next');
  const directionBtn = container.querySelector('#fc-direction');
  const speakBtn = container.querySelector('#fc-speak');

  function render() {
    const item = vocab[index];
    const [firstLang, secondLang] = direction === 'es-en' ? ['es', 'en'] : ['en', 'es'];
    front.textContent = item[firstLang];
    back.textContent = item[secondLang];
    progress.textContent = `${index + 1} / ${vocab.length}`;
    card.classList.toggle('flipped', flipped);
    directionBtn.textContent =
      direction === 'es-en' ? 'Switch to English → Spanish' : 'Switch to Spanish → English';
  }

  card.addEventListener('click', () => {
    flipped = !flipped;
    card.classList.toggle('flipped', flipped);
  });

  prevBtn.addEventListener('click', () => {
    flipped = false;
    index = (index - 1 + vocab.length) % vocab.length;
    render();
  });

  nextBtn.addEventListener('click', () => {
    flipped = false;
    index = (index + 1) % vocab.length;
    render();
  });

  directionBtn.addEventListener('click', () => {
    direction = direction === 'es-en' ? 'en-es' : 'es-en';
    flipped = false;
    render();
  });

  if (speakBtn) {
    speakBtn.addEventListener('click', () => speakSpanish(vocab[index].es));
  }

  render();
}
