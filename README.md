# Español12 — Spanish Conversation Crash Course

A 12-class beginner Spanish conversation site. Each class page has:

- **Vocabulary** for that class's real-world situation
- **Flashcards** (flip to reveal the translation)
- **Quiz** (multiple choice)
- **AI Speaking Practice** — a chat-style back-and-forth with an AI partner that is
  restricted to that class's exact phrase bank
- **Listening Practice** — an embedded [YouGlish](https://youglish.com) widget showing
  native speakers using the class's key phrases in real YouTube clips

Class 1 (Greetings & Introductions) is fully built out. Classes 2–12 are scaffolded as
"coming soon" placeholders — see **Adding a new class** below.

## Project structure

```
data/classes/index.json      List of all 12 classes (id, number, title, theme, available)
data/classes/class-01.json   Class 1 content: vocab, phrase bank, quiz, speaking-practice
                              scenario, YouGlish search terms
server/                      Express app (serves the site + the AI chat API)
  index.js                   App entry point
  data.js                    Reads class JSON from disk
  routes/classes.js          GET /api/classes, GET /api/classes/:id
  routes/chat.js             POST /api/chat — builds the per-class system prompt and
                              calls the Anthropic API server-side
public/                      Static frontend (plain HTML/CSS/JS, no build step)
  index.html, class.html     Home page and the shared class-page template
  css/style.css              Shared styles
  js/flashcards.js           Generic flashcard engine
  js/quiz.js                 Generic multiple-choice quiz engine
  js/speaking-practice.js    Chat UI for AI Speaking Practice
  js/youglish.js             YouGlish widget integration
  js/class-page.js           Loads a class's JSON and wires up the sections above
```

The frontend is data-driven: every class page uses the same `class.html` template and
`class-page.js` script, which fetch `/api/classes/:id` and render whatever that class's
JSON contains. Adding a class means adding data, not new pages or components.

## Running locally

```bash
npm install
cp .env.example .env   # then fill in ANTHROPIC_API_KEY
npm start              # http://localhost:3000
```

Without `ANTHROPIC_API_KEY` set, the site works fully except the AI Speaking Practice
chat, which will show a friendly "not configured yet" message instead of crashing.

## Deploying (Railway)

1. Push this repo to GitHub and connect it in Railway.
2. Railway will run `npm install` then `npm start` (Node/Express, per `package.json`).
3. Set environment variables in the Railway project: `ANTHROPIC_API_KEY` (required for
   Speaking Practice), and optionally `ANTHROPIC_MODEL`. Railway sets `PORT` itself.
4. The Anthropic API key is only ever read server-side in `server/routes/chat.js` — it
   is never sent to the browser.

## Adding a new class (2–12)

1. Add a `data/classes/class-XX.json` file following the shape of `class-01.json`:
   `id`, `number`, `title`, `theme`, `vocab` (array of `{ es, en }`), `phraseBank`
   (the exact closed list of phrases the AI is allowed to use), `quiz` (array of
   `{ question, choices, answer }`), `youglishTerms` (2–4 key words/phrases), and
   `speakingPractice` (`scenario`, `goalOrder`, `openingLine`).
2. Update that class's entry in `data/classes/index.json`: set `title`, `theme`, and
   `available: true`.
3. Commit and push — no frontend code changes needed.

Per the task brief, classes 2–12 should each land as their own commit/PR once Viktoria
provides that class's content.

## How AI Speaking Practice stays "closed vocabulary"

`server/routes/chat.js` builds a system prompt per request from that class's
`phraseBank` and `speakingPractice` fields (never from anything the client sends), and
instructs the model to use only those phrases, follow a natural conversational order,
and gently steer the student back on-script rather than lecturing or introducing new
vocabulary. This keeps a single source of truth (the class JSON) for both the on-page
vocabulary list and what the AI is allowed to say.

## Open questions for Viktoria

- **AI provider / API key.** This build defaults to the **Anthropic API** (a fast,
  low-cost model, configurable via `ANTHROPIC_MODEL`) since no provider was specified.
  Swapping providers only requires changes inside `server/routes/chat.js`. Please
  confirm this is the provider/account you want to use, and provide (or generate) the
  API key to set as `ANTHROPIC_API_KEY` in Railway.
- **Content for Classes 2–12.** Only Class 1's phrase bank/vocab was provided. Please
  send each remaining class's material (theme + phrase list, same format as Class 1) so
  it can be added one class at a time.
- **YouGlish widget details.** The integration in `public/js/youglish.js` follows
  YouGlish's documented widget pattern (`youglish.com/api/doc/widget`: load
  `widget.js`, instantiate `YG.Widget`, call `widget.fetch(term, "spanish")`), with a
  graceful fallback link if the widget script fails to load. Live docs couldn't be
  fetched from this environment to double check the exact current snippet — worth a
  quick manual check against `youglish.com/api/doc/widget` before relying on it in
  production.
- **Voice input.** The brief calls out voice input as a stretch goal; the current
  Speaking Practice UI is text-only (type your reply). Let us know if voice input
  should be prioritized for a follow-up class or added now.
