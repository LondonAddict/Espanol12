# Español12 — Spanish Conversation Crash Course

A 12-class beginner Spanish conversation site. Each class page has:

- **Vocabulary** for that class's real-world situation
- **Flashcards** (flip to reveal the translation)
- **Quiz** (multiple choice)
- **AI Speaking Practice** — a chat-style back-and-forth with an AI partner that is
  restricted to that class's exact phrase bank, with voice input and spoken replies
- **Pronunciation** — a 🔊 listen button (browser text-to-speech) on every vocab entry
  and on the flashcard deck, plus a 🎬 link on each vocab entry out to
  [YouGlish](https://youglish.com) to hear real native speakers say it

Class 1 (Greetings & Introductions) is fully built out. Classes 2–12 are scaffolded as
"coming soon" placeholders — see **Adding a new class** below.

## Project structure

```
data/classes/index.json      List of all 12 classes (id, number, title, theme, available)
data/classes/class-01.json   Class 1 content: vocab (with per-word YouGlish links),
                              phrase bank, quiz, speaking-practice scenario
server/                      Express app (serves the site + the AI chat API)
  index.js                   App entry point, plus GET /api/health for deploy diagnostics
  data.js                    Reads class JSON from disk
  routes/classes.js          GET /api/classes, GET /api/classes/:id
  routes/chat.js             POST /api/chat — builds the per-class system prompt and
                              calls the Anthropic API server-side
public/                      Static frontend (plain HTML/CSS/JS, no build step)
  index.html, class.html     Home page and the shared class-page template
  css/style.css              Shared styles
  js/speech.js               Browser text-to-speech helper (pronunciation playback)
  js/flashcards.js           Generic flashcard engine (ES<->EN direction toggle)
  js/quiz.js                 Generic multiple-choice quiz engine (one question at a time)
  js/speaking-practice.js    Chat UI for AI Speaking Practice (voice input + spoken replies)
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
   `id`, `number`, `title`, `theme`, `vocab` (array of `{ es, en, youglish }` — the
   `youglish` link is optional per entry; see below), `phraseBank` (the exact closed
   list of phrases the AI is allowed to use), `quiz` (array of
   `{ question, choices, answer }`), and `speakingPractice` (`scenario`, `goalOrder`,
   `openingLine`).
2. Update that class's entry in `data/classes/index.json`: set `title`, `theme`, and
   `available: true`.
3. Commit and push — no frontend code changes needed.

Per the task brief, classes 2–12 should each land as their own commit/PR once Viktoria
provides that class's content.

### Adding YouGlish links per vocab entry

Each vocab item can carry an optional `youglish` field — a direct link to a YouGlish
results page for that word/phrase, shown as a 🎬 icon next to the word. Two link styles:

- **Curated (preferred when available):** search youglish.com/pronounce/spanish
  yourself, pick a good clip, and copy its "getbyid" URL from the address bar, e.g.
  `https://youglish.com/getbyid/120455/Qu%C3%A9%20tal/spanish/es`.
- **Generic fallback:** `https://youglish.com/pronounce/<Phrase_With_Underscores>/spanish/es`
  — take the phrase, strip punctuation (¿ ¡ ? , etc.), replace spaces with underscores,
  keep accents and original capitalization. E.g. "¿De dónde eres?" → `De_dónde_eres`.

If a vocab entry has no `youglish` field, the icon is simply omitted — it's optional.

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
