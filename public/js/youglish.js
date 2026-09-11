/**
 * YouGlish widget integration (https://youglish.com/api/doc/widget).
 * Renders a term picker + the official embeddable widget so students can
 * hear native speakers use this class's key phrases. Falls back to a
 * plain link to youglish.com if the widget script can't load, so the
 * required "Powered by YouGlish.com" attribution is always visible.
 */
function mountYouglish(container, terms) {
  const safeTerms = (terms && terms.length ? terms : ['hola']).slice(0, 4);

  container.innerHTML = `
    <div class="youglish-terms" id="youglish-terms"></div>
    <div id="youglish-widget-container"></div>
    <p class="youglish-attribution">
      Powered by <a href="https://youglish.com" target="_blank" rel="noopener">YouGlish.com</a>
    </p>
  `;

  const termsEl = container.querySelector('#youglish-terms');
  const widgetContainer = container.querySelector('#youglish-widget-container');

  termsEl.innerHTML = safeTerms
    .map((term, i) => `<button class="secondary${i === 0 ? ' active' : ''}" data-term="${escapeAttr(term)}">${escapeHtmlLocal(term)}</button>`)
    .join('');

  let widget = null;

  function search(term) {
    termsEl.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.term === term);
    });
    if (widget && typeof widget.fetch === 'function') {
      widget.fetch(term, 'spanish');
    }
  }

  termsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-term]');
    if (btn) search(btn.dataset.term);
  });

  loadYouglishScript()
    .then(() => {
      widget = new window.YG.Widget('youglish-widget-container', {
        width: 640,
        components: 9,
        events: {
          onFetchDone: () => {},
        },
      });
      search(safeTerms[0]);
    })
    .catch(() => {
      widgetContainer.innerHTML = `
        <p>
          The listening widget couldn't load. You can look these phrases up directly on
          <a href="https://youglish.com/pronounce/${encodeURIComponent(safeTerms[0])}/spanish" target="_blank" rel="noopener">YouGlish.com</a>.
        </p>
      `;
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
