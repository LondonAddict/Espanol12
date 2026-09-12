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

  headingEl.textContent = `Class ${classData.number}`;
  document.title = `Español12 — Class ${classData.number}: ${classData.title}`;

  const template = document.getElementById('class-content-template');
  main.innerHTML = '';
  main.appendChild(template.content.cloneNode(true));

  document.getElementById('class-title').textContent = `Class ${classData.number}: ${classData.title}`;
  document.getElementById('class-theme').textContent = classData.theme || '';

  const vocabList = document.getElementById('vocab-list');
  vocabList.innerHTML = (classData.vocab || [])
    .map((v) => `<li><span class="es">${escapeHtmlLocal(v.es)}</span><span class="en">${escapeHtmlLocal(v.en)}</span></li>`)
    .join('');

  mountFlashcards(document.getElementById('flashcard-container'), classData.vocab);
  mountQuiz(document.getElementById('quiz-container'), classData.quiz);
  mountSpeakingPractice(document.getElementById('speaking-practice-container'), classData);
  mountYouglish(document.getElementById('youglish-container'), classData.youglishTerms);

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

    const prev = classes.find((c) => c.number === currentNumber - 1 && c.available);
    const next = classes.find((c) => c.number === currentNumber + 1 && c.available);

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

function escapeHtmlLocal(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

initClassPage();
