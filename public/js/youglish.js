/**
 * YouGlish widget integration (https://youglish.com/api/doc/widget,
 * https://youglish.com/api/doc/js-api). Renders a term picker; the actual
 * widget script and video are only loaded the first time a student clicks
 * a term, and each click rebuilds a fresh widget instance and calls
 * widget.fetch(term, "spanish") so switching between phrases is reliable.
 */
function mountYouglish(container, terms) {
  const safeTerms = (terms && terms.length ? terms : ['hola']).slice(0, 4);

  container.innerHTML = `
    <div class="youglish-terms" id="youglish-terms"></div>
    <div id="youglish-widget-container">
      <p class="youglish-placeholder">Click a phrase above to load a video clip.</p>
    </div>
    <p class="youglish-attribution">
      Powered by <a href="https://youglish.com" target="_blank" rel="noopener">YouGlish.com</a>
    </p>
  `;

  const termsEl = container.querySelector('#youglish-terms');
  const widgetContainer = container.querySelector('#youglish-widget-container');

  termsEl.innerHTML = safeTerms
    .map((term) => `<button class="secondary" data-term="${escapeAttr(term)}">${escapeHtmlLocal(term)}</button>`)
    .join('');

  function setActiveButton(term) {
    termsEl.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.term === term);
    });
  }

  function loadTerm(term) {
    setActiveButton(term);
    widgetContainer.innerHTML = '<p>Loading video…</p>';

    loadYouglishScript()
      .then(() => {
        // Rebuild the widget from scratch for every search so switching
        // terms reliably loads a new clip instead of re-fetching a stale
        // instance.
        widgetContainer.innerHTML = '';
        const widget = new window.YG.Widget('youglish-widget-container', {
          width: 640,
          components: 9,
          events: { onFetchDone: () => {} },
        });
        widget.fetch(term, 'spanish');
      })
      .catch(() => {
        widgetContainer.innerHTML = `
          <p>
            The listening widget couldn't load. You can look this phrase up directly on
            <a href="https://youglish.com/pronounce/${encodeURIComponent(term)}/spanish" target="_blank" rel="noopener">YouGlish.com</a>.
          </p>
        `;
      });
  }

  termsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-term]');
    if (btn) loadTerm(btn.dataset.term);
  });
}

let youglishScriptPromise = null;
function loadYouglishScript() {
  if (window.YG) return Promise.resolve();
  if (youglishScriptPromise) return youglishScriptPromise;

  youglishScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://youglish.com/public/emb/widget.js';
    script.async = true;
    const timeout = setTimeout(() => reject(new Error('YouGlish script load timed out')), 8000);
    window.onYouglishAPIReady = () => {
      clearTimeout(timeout);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('YouGlish script failed to load'));
    };
    document.head.appendChild(script);
  });

  return youglishScriptPromise;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

function escapeHtmlLocal(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
