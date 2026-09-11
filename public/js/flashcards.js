/**
 * Generic flashcard engine. Mounts a flippable Spanish/English flashcard
 * deck into `container` from a `vocab` array of { es, en }.
 */
function mountFlashcards(container, vocab) {
  if (!vocab || vocab.length === 0) {
    container.innerHTML = '<p>No vocabulary available yet.</p>';
    return;
  }

  let index = 0;
  let flipped = false;

  container.innerHTML = `
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

  function render() {
    const item = vocab[index];
    front.textContent = item.es;
    back.textContent = item.en;
    progress.textContent = `${index + 1} / ${vocab.length}`;
    card.classList.toggle('flipped', flipped);
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

  render();
}
