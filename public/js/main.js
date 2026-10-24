async function loadClasses() {
  const grid = document.getElementById('class-grid');
  try {
    const res = await fetch('/api/classes');
    const classes = await res.json();
    grid.innerHTML = classes.map(renderCard).join('');
  } catch (err) {
    grid.innerHTML = '<p>Could not load classes. Please refresh.</p>';
  }
}

function renderCard(cls) {
  // A tile with no number (e.g. the Listening Revision) isn't part of the
  // numbered 1-12 sequence, so it gets a plain label instead of "Class N".
  const numberLabel = typeof cls.number === 'number' ? `Class ${cls.number}` : 'Extra';
  if (!cls.available) {
    return `
      <div class="class-card locked">
        <div class="class-number">${numberLabel}</div>
        <h3>${escapeHtml(cls.title)}</h3>
        <p>Content coming soon</p>
      </div>
    `;
  }
  return `
    <a class="class-card" href="/class/${cls.id}">
      <div class="class-number">${numberLabel}</div>
      <h3>${escapeHtml(cls.title)}</h3>
      <p>${escapeHtml(cls.theme)}</p>
    </a>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

loadClasses();
