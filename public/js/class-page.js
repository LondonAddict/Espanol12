async function initClassPage() {
  const main = document.getElementById('class-main');
  const headingEl = document.getElementById('class-heading');
  const match = window.location.pathname.match(/\/class\/([^/]+)/);
  const classId = match ? match[1] : null;

  if (!classId) {
    main.innerHTML = '<p>Class not found.</p>';
    return;
  }

  let classData;
  try {
    const res = await fetch(`/api/classes/${classId}`);
    if (!res.ok) throw new Error('not found');
    classData = await res.json();
  } catch (err) {
    main.innerHTML = `
      <div class="locked-notice">
        <h2>This class isn't published yet</h2>
        <p>Check back soon, or head <a href="/">back to all classes</a>.</p>
      </div>
    `;
    return;
  }

  // A class with no `number` (e.g. the Listening Revision tile) isn't part
  // of the numbered 1-12 sequence, so skip the "Class N" prefix for it.
  const hasNumber = typeof classData.number === 'number';
  headingEl.textContent = hasNumber ? `Class ${classData.number}` : classData.title;
  document.title = `Español12 — ${hasNumber ? `Class ${classData.number}: ` : ''}${classData.title}`;

  const template = document.getElementById('class-content-template');
  main.innerHTML = '';
  main.appendChild(template.content.cloneNode(true));

  document.getElementById('class-title').textContent = hasNumber
    ? `Class ${classData.number}: ${classData.title}`
    : classData.title;
  document.getElementById('class-theme').textContent = classData.theme || '';

  const speechSupported = isSpeechSynthesisSupported();

  const vocabSection = document.getElementById('section-vocab');
  const vocabNavLink = document.querySelector('#section-menu a[href="#section-vocab"]');
  if (Array.isArray(classData.vocab) && classData.vocab.length) {
    renderVocabList(document.getElementById('vocab-list'), classData.vocab, speechSupported);

    const passiveBlock = document.getElementById('passive-vocab-block');
    if (Array.isArray(classData.passiveVocab) && classData.passiveVocab.length) {
      renderVocabList(document.getElementById('passive-vocab-list'), classData.passiveVocab, speechSupported);
      passiveBlock.hidden = false;
    }
  } else {
    if (vocabSection) vocabSection.remove();
    if (vocabNavLink) vocabNavLink.remove();
  }

  const flashcardsSection = document.getElementById('section-flashcards');
  const flashcardsNavLink = document.querySelector('#section-menu a[href="#section-flashcards"]');
  if (Array.isArray(classData.vocab) && classData.vocab.length) {
    mountFlashcards(document.getElementById('flashcard-container'), classData.vocab);
  } else {
    if (flashcardsSection) flashcardsSection.remove();
    if (flashcardsNavLink) flashcardsNavLink.remove();
  }

  const quizSection = document.getElementById('section-quiz');
  const quizNavLink = document.querySelector('#section-menu a[href="#section-quiz"]');
  if (Array.isArray(classData.quiz) && classData.quiz.length) {
    mountQuiz(document.getElementById('quiz-container'), classData.quiz);
  } else {
    if (quizSection) quizSection.remove();
    if (quizNavLink) quizNavLink.remove();
  }

  const speakingSection = document.getElementById('section-speaking');
  const speakingNavLink = document.querySelector('#section-menu a[href="#section-speaking"]');
  if (classData.speakingPractice) {
    mountSpeakingPractice(document.getElementById('speaking-practice-container'), classData);
  } else {
    if (speakingSection) speakingSection.remove();
    if (speakingNavLink) speakingNavLink.remove();
  }

  const priceSection = document.getElementById('section-price');
  const priceNavLink = document.querySelector('#section-menu a[href="#section-price"]');
  if (classData.priceExercise && Array.isArray(classData.priceExercise.items) && classData.priceExercise.items.length) {
    document.getElementById('price-instructions').textContent =
      classData.priceExercise.instructions ||
      'Read (or listen to) the price in words, then type it in figures, e.g. "tres setenta" → 3,70.';
    mountPriceExercise(document.getElementById('price-exercise-container'), classData.priceExercise);
  } else {
    if (priceSection) priceSection.remove();
    if (priceNavLink) priceNavLink.remove();
  }

  const timeSection = document.getElementById('section-time');
  const timeNavLink = document.querySelector('#section-menu a[href="#section-time"]');
  if (classData.timeExercise && Array.isArray(classData.timeExercise.items) && classData.timeExercise.items.length) {
    document.getElementById('time-instructions').textContent =
      classData.timeExercise.instructions ||
      'Look at the digital time, then type it the Spanish way using "a las…", e.g. 09:30 → "a las nueve y media".';
    mountTimeExercise(document.getElementById('time-exercise-container'), classData.timeExercise);
  } else {
    if (timeSection) timeSection.remove();
    if (timeNavLink) timeNavLink.remove();
  }

  const openCloseSection = document.getElementById('section-openclose');
  const openCloseNavLink = document.querySelector('#section-menu a[href="#section-openclose"]');
  if (classData.openCloseExercise && Array.isArray(classData.openCloseExercise.items) && classData.openCloseExercise.items.length) {
    document.getElementById('openclose-instructions').textContent =
      classData.openCloseExercise.instructions ||
      'Look at the shop\'s hours, then type the opening or closing time using "Abre a las…" / "Cierra a las…".';
    mountTimeExercise(document.getElementById('openclose-exercise-container'), classData.openCloseExercise);
  } else {
    if (openCloseSection) openCloseSection.remove();
    if (openCloseNavLink) openCloseNavLink.remove();
  }

  const numberSection = document.getElementById('section-numbers');
  const numberNavLink = document.querySelector('#section-menu a[href="#section-numbers"]');
  if (classData.numberExercise && Array.isArray(classData.numberExercise.items) && classData.numberExercise.items.length) {
    document.getElementById('number-instructions').textContent =
      classData.numberExercise.instructions ||
      'Listen to (or read) the number, then type just the digits.';
    mountNumberExercise(document.getElementById('number-exercise-container'), classData.numberExercise);
  } else {
    if (numberSection) numberSection.remove();
    if (numberNavLink) numberNavLink.remove();
  }

  const timetableContainer = document.getElementById('timetable-container');
  if (timetableContainer) {
    if (Array.isArray(classData.timetable) && classData.timetable.length) {
      renderTimetable(timetableContainer, classData.timetable);
      timetableContainer.hidden = false;
    } else {
      timetableContainer.remove();
    }
  }

  const placesTableContainer = document.getElementById('places-table-container');
  if (placesTableContainer) {
    if (Array.isArray(classData.placesTable) && classData.placesTable.length) {
      renderPlacesTable(placesTableContainer, classData.placesTable);
      placesTableContainer.hidden = false;
    } else {
      placesTableContainer.remove();
    }
  }

  const listenRecognizeSection = document.getElementById('section-listen-recognize');
  const listenRecognizeNavLink = document.querySelector('#section-menu a[href="#section-listen-recognize"]');
  if (classData.listeningRecognize && Array.isArray(classData.listeningRecognize.items) && classData.listeningRecognize.items.length) {
    document.getElementById('listen-recognize-instructions').textContent =
      classData.listeningRecognize.instructions ||
      'Press Play, listen, and try to recognize the word or phrase before checking the answer.';
    mountListeningRecognize(document.getElementById('listen-recognize-container'), classData.listeningRecognize);
  } else {
    if (listenRecognizeSection) listenRecognizeSection.remove();
    if (listenRecognizeNavLink) listenRecognizeNavLink.remove();
  }

  const listenChoiceSection = document.getElementById('section-listen-choice');
  const listenChoiceNavLink = document.querySelector('#section-menu a[href="#section-listen-choice"]');
  if (classData.listeningChoice && Array.isArray(classData.listeningChoice.items) && classData.listeningChoice.items.length) {
    document.getElementById('listen-choice-instructions').textContent =
      classData.listeningChoice.instructions ||
      'Press Play to hear a question in Spanish, then pick the correct response.';
    mountListeningChoice(document.getElementById('listen-choice-container'), classData.listeningChoice);
  } else {
    if (listenChoiceSection) listenChoiceSection.remove();
    if (listenChoiceNavLink) listenChoiceNavLink.remove();
  }

  const listenAnswerSection = document.getElementById('section-listen-answer');
  const listenAnswerNavLink = document.querySelector('#section-menu a[href="#section-listen-answer"]');
  if (classData.listeningAnswer && Array.isArray(classData.listeningAnswer.items) && classData.listeningAnswer.items.length) {
    document.getElementById('listen-answer-instructions').textContent =
      classData.listeningAnswer.instructions ||
      'Press Play to hear a question in Spanish, come up with your own answer, then reveal an example to check yourself.';
    mountListeningAnswer(document.getElementById('listen-answer-container'), classData.listeningAnswer);
  } else {
    if (listenAnswerSection) listenAnswerSection.remove();
    if (listenAnswerNavLink) listenAnswerNavLink.remove();
  }

  const dialoguesSection = document.getElementById('section-dialogues');
  const dialoguesNavLink = document.querySelector('#section-menu a[href="#section-dialogues"]');
  if (Array.isArray(classData.dialogues) && classData.dialogues.length) {
    renderDialogues(document.getElementById('dialogues-container'), classData.dialogues);
  } else {
    if (dialoguesSection) dialoguesSection.remove();
    if (dialoguesNavLink) dialoguesNavLink.remove();
  }

  setupSectionMenuScrollSpy();
  await setupClassNav(classData.number);
}

function setupSectionMenuScrollSpy() {
  const menu = document.getElementById('section-menu');
  if (!menu || !('IntersectionObserver' in window)) return;

  const links = Array.from(menu.querySelectorAll('a'));
  const sections = links
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = menu.querySelector(`a[href="#${entry.target.id}"]`);
        if (link) {
          links.forEach((l) => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}

async function setupClassNav(currentNumber) {
  try {
    const res = await fetch('/api/classes');
    const classes = await res.json();

    // A class with no number (e.g. the Listening Revision tile) isn't part
    // of the numbered sequence, so it has no prev/next neighbor - both sides
    // just fall back to Home links below.
    const hasNumber = typeof currentNumber === 'number';
    const prev = hasNumber ? classes.find((c) => c.number === currentNumber - 1 && c.available) : null;
    const next = hasNumber ? classes.find((c) => c.number === currentNumber + 1 && c.available) : null;

    const prevLink = document.getElementById('prev-class-link');
    const nextLink = document.getElementById('next-class-link');

    if (prevLink) {
      if (prev) {
        prevLink.href = `/class/${prev.id}`;
        prevLink.textContent = `← Class ${prev.number}: ${prev.title}`;
      } else {
        prevLink.href = '/';
        prevLink.textContent = '← Home';
      }
    }

    if (nextLink) {
      if (next) {
        nextLink.href = `/class/${next.id}`;
        nextLink.textContent = `Class ${next.number}: ${next.title} →`;
      } else {
        nextLink.href = '/';
        nextLink.textContent = 'Back to all classes →';
      }
    }
  } catch (err) {
    // Navigation is a nice-to-have; ignore failures here.
  }
}

function groupByCategory(items) {
  const groups = [];
  const indexByCategory = new Map();
  (items || []).forEach((item) => {
    const cat = item.category || null;
    if (!indexByCategory.has(cat)) {
      indexByCategory.set(cat, groups.length);
      groups.push({ category: cat, items: [] });
    }
    groups[indexByCategory.get(cat)].items.push(item);
  });
  return groups;
}

function renderVocabItem(v, speechSupported) {
  return `
    <li>
      <span class="vocab-es-group">
        <span class="es">${escapeHtmlLocal(v.es)}</span>
        ${speechSupported ? `<button class="speak-btn" data-text="${escapeAttrLocal(v.es)}" title="Listen" aria-label="Listen to pronunciation">🔊</button>` : ''}
        ${v.youglish ? `<a class="youglish-link" href="${escapeAttrLocal(v.youglish)}" target="_blank" rel="noopener" title="Watch on YouGlish.com" aria-label="Watch native speakers say this on YouGlish">🎬</a>` : ''}
      </span>
      <span class="en">${escapeHtmlLocal(v.en)}</span>
    </li>
  `;
}

function renderVocabList(container, items, speechSupported) {
  const groups = groupByCategory(items);

  container.innerHTML = groups
    .map(
      (group) => `
      <div class="vocab-category-group">
        ${group.category ? `<h4 class="vocab-category-heading">${escapeHtmlLocal(group.category)}</h4>` : ''}
        <ul class="vocab-list">
          ${group.items.map((v) => renderVocabItem(v, speechSupported)).join('')}
        </ul>
      </div>
    `
    )
    .join('');

  if (speechSupported) {
    container.querySelectorAll('.speak-btn').forEach((btn) => {
      btn.addEventListener('click', () => speakSpanish(btn.dataset.text));
    });
  }
}

function renderTimetable(container, timetable) {
  container.innerHTML = `
    <h3>Horario</h3>
    <div class="table-scroll">
    <table class="timetable">
      <thead>
        <tr><th>Destino</th><th>Salida</th><th>Vía</th><th>Precio</th></tr>
      </thead>
      <tbody>
        ${timetable
          .map(
            (t) => `
            <tr>
              <td>${escapeHtmlLocal(t.destino)}</td>
              <td>${escapeHtmlLocal(t.salida)}</td>
              <td>${escapeHtmlLocal(t.via)}</td>
              <td>${escapeHtmlLocal(String(t.precio))}€</td>
            </tr>
          `
          )
          .join('')}
      </tbody>
    </table>
    </div>
  `;
}

function renderPlacesTable(container, placesTable) {
  container.innerHTML = `
    <h3>Lugares que conoces</h3>
    <div class="table-scroll">
    <table class="timetable">
      <thead>
        <tr><th>Lugar</th><th>Dirección</th><th>Autobús</th><th>Horario</th></tr>
      </thead>
      <tbody>
        ${placesTable
          .map(
            (p) => `
            <tr>
              <td>${escapeHtmlLocal(p.place)}</td>
              <td>${escapeHtmlLocal(p.address)}</td>
              <td>${escapeHtmlLocal(p.bus)}</td>
              <td>${p.hours ? escapeHtmlLocal(p.hours) : '—'}</td>
            </tr>
          `
          )
          .join('')}
      </tbody>
    </table>
    </div>
  `;
}

function renderDialogues(container, dialogues) {
  const speechSupported = isSpeechSynthesisSupported();

  container.innerHTML = dialogues
    .map(
      (d, i) => `
      <div class="dialogue-block">
        <h3>${escapeHtmlLocal(d.title || `Version ${i + 1}`)}</h3>
        <div class="chat-window dialogue-window">
          ${d.turns
            .map(
              (t) => `
              <div class="chat-bubble ${isCustomerTurn(t) ? 'user' : 'ai'}">
                <span><strong>${escapeHtmlLocal(t.speaker)}:</strong> ${escapeHtmlLocal(t.es)}</span>
                ${speechSupported ? `<button class="speak-btn dialogue-speak-btn" data-text="${escapeAttrLocal(t.es)}" title="Listen" aria-label="Listen to this line">🔊</button>` : ''}
              </div>
            `
            )
            .join('')}
        </div>
      </div>
    `
    )
    .join('');

  if (speechSupported) {
    container.querySelectorAll('.dialogue-speak-btn').forEach((btn) => {
      btn.addEventListener('click', () => speakSpanish(btn.dataset.text));
    });
  }
}

// Turns can say who's speaking (role: "customer" | "staff") for dialogues
// with more than two speakers or non-"Tú" student labels (e.g. "Cliente 1").
// Falls back to the original Tú-vs-everyone-else heuristic when role is
// omitted, so existing dialogues (Class 2) render unchanged.
function isCustomerTurn(t) {
  if (t.role) return t.role === 'customer';
  return t.speaker === 'Tú';
}

function escapeHtmlLocal(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function escapeAttrLocal(str) {
  return String(str || '').replace(/"/g, '&quot;');
}

initClassPage();
