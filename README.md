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
   `id`, `number`, `title`, `theme`, `vocab` (array of `{ es, en, category, youglish }`
   — `category` is optional but strongly recommended once a class has more than
   ~10-15 items; `youglish` is always optional, see below), `phraseBank` (the exact
   closed list of phrases the AI is allowed to use), `quiz` (array of
   `{ question, choices, answer }`), and `speakingPractice` (`scenario`, `goalOrder`,
   `openingLine`). Two more fields are optional and only render if present (Class 1
   has neither, Class 2 has both — see `class-02.json` for a worked example):
   - `passiveVocab` — same shape as `vocab` (`{ es, en, category, youglish }`), for
     words the student should recognize but isn't drilled on in flashcards/quiz.
     Rendered as an "Also good to recognize" list under the main vocabulary, and
     still included in `phraseBank` if the AI (e.g. playing a shopkeeper) needs to
     say them.
   - `category` — a short topic label (e.g. "Numbers", "Food", "Questions",
     "Greetings") shown as a heading above that group of words in the Vocabulary
     list (see any current class file for examples). Entries are grouped by
     category in first-appearance order, not alphabetically, so items sharing a
     category don't need to be contiguous in the array — put a new category's
     first item wherever makes sense and later items with that same category will
     still land in the same group. `vocab` and `passiveVocab` are grouped
     independently of each other. An entry with no `category` still renders, just
     ungrouped (fine for a short list that doesn't need subdividing). Doesn't
     affect `phraseBank`, flashcards, or quiz — purely a display grouping for the
     Vocabulary section.
   - `dialogues` — array of `{ title, practiced, turns: [{ speaker, role, es }] }`,
     rendered as a read-through "Example Dialogues" section (chat-bubble styling,
     each line gets its own 🔊 replay button) and also fed to the AI's system prompt
     as a model for natural flow. `role` is `"customer"` or `"staff"` and controls
     which side of the chat a turn renders on (falls back to treating the speaker
     literally named "Tú" as the customer if `role` is omitted, for older data).
     `practiced` defaults to `true` when omitted; set it to `false` for a "next
     class" preview dialogue that should be *shown* but not yet usable by the AI —
     with it `false`, that dialogue's exact lines are excluded from both the
     system prompt's example conversations and the AI's permitted phrase list
     (see `class-04.json`). **To "unlock" it later, flip that one field to `true`
     (or delete it)** — its lines are automatically unioned into the AI's phrase
     bank at that point, no other edit needed, *unless* a line uses vocabulary
     that was never taught (e.g. a brand-new phrase that first appears in the
     dialogue itself) — add that to `phraseBank` by hand when you unlock it, since
     the AI still can't say words it's never been given. Omit `dialogues` entirely
     if a class has no scripted example dialogue.
   - `priceExercise` — `{ instructions, items: [{ words, euros, cents }] }` for a
     "type the price you hear/read" drill (e.g. `words: "tres setenta"` →
     `euros: 3, cents: 70`). Rendered as its own "Price Listening Practice" section
     with a 🔊 replay button; accepts the answer with either a comma or a dot as the
     decimal separator. Omit entirely if a class has no price exercise.
   - `timeExercise` — `{ instructions, items: [{ digital, base, daypart,
     requireDaypart }] }` for a "type the time you see" drill (e.g. Class 5's time
     dictation): shows `digital` (a 24-hour clock string like `"18:00"`) and checks
     the typed answer against `base` (e.g. `"a las seis"`). When `requireDaypart` is
     `false`, `base` alone is accepted, with or without any of "de la mañana/tarde/
     noche" appended. When `requireDaypart` is `true`, the student must type `base`
     followed by the exact `daypart` given (e.g. `"a las seis de la tarde"`) — use
     this for times where the 24h-to-12h conversion itself is the point (so a bare
     "a las seis" for 18:00 doesn't count as correct). Matching ignores case, accents,
     and punctuation. Rendered as its own "Time Dictation Practice" section. Omit
     entirely if a class has no time exercise.
   - `timetable` — array of `{ destino, salida, horaEs, via, precio }` (e.g. Class
     5's train station). `salida` is the 24-hour digital time shown to students in
     the on-page timetable table; `horaEs` is that same time already written out
     correctly in Spanish (e.g. `"a las seis de la tarde"`), which is what actually
     gets fed to the AI so it can't mis-convert its own grounding data. `precio` is
     the price per single ticket — the AI is instructed to double it when the student
     asks for two. Rendered as a table next to the AI Speaking Practice chat, and
     passed into the chat system prompt (see `server/routes/chat.js`) so the AI's
     answers about price/time/platform stay consistent for a given destination
     across a whole conversation. Omit entirely if a class's speaking practice
     doesn't need a reference timetable.
   - `numberExercise` — `{ instructions, items: [{ words, number }] }` for a "listen
     to/read the number, type the digits" drill (e.g. Class 6's room/bus/address
     numbers): `words` is the full spoken phrase for context (e.g. `"la habitación
     ciento ocho"`), `number` is the plain integer to check the typed answer against
     (e.g. `108`). Uses its own engine, `public/js/number-exercise.js` (a
     `priceExercise`-style one-at-a-time drill, but checking a bare integer instead
     of euros/cents). Rendered as its own "Numbers Practice" section. Omit entirely
     if a class has no number-dictation drill.
   - `placesTable` — array of `{ place, address, addressEs, bus, busEs, hours,
     openEs, closeEs, directions }` (e.g. Class 6's "places you know as a local").
     `address`/`bus`/`hours` are the human-readable digit forms shown in the
     on-page reference table; `addressEs`/`busEs`/`openEs`/`closeEs` are those same
     values already written out correctly in Spanish, fed to the AI instead of the
     digit forms for the same mis-conversion-proofing reason as `timetable`'s
     `horaEs`. `openEs`/`closeEs` can both be `""` for a place with no published
     hours (the AI is told not to invent any). `directions` is the exact turn-by-turn
     sentence the AI must repeat verbatim for that place. Reuses the same table
     styling as `timetable` next to the AI Speaking Practice chat. A class can have
     both `timetable` and `placesTable` if needed, or just one, or neither — each is
     independently optional and both get folded into the chat system prompt (see
     `server/routes/chat.js`) when present.
   - `openCloseExercise` — same shape as `timeExercise` (`{ instructions, items:
     [{ digital, base, daypart, requireDaypart }] }`) and reuses the exact same
     `mountTimeExercise` engine — `digital` doesn't have to be a bare clock reading,
     it's just the large prompt text shown to the student, so a class can repurpose
     it for a different kind of time-dictation drill (e.g. Class 6's "Abre/Cierra"
     opening-hours practice shows a shop sign + question instead of a plain clock).
     Give it its own section/nav-link ids in `class.html` and its own conditional
     mount block in `class-page.js` (see Class 6) rather than reusing `timeExercise`'s
     ids, so a class can have both drills side by side if it ever needs to. Omit
     entirely if a class has no opening-hours drill.
2. Update that class's entry in `data/classes/index.json`: set `title`, `theme`, and
   `available: true`.
3. Commit and push — no other frontend code changes needed.

**Don't re-list review content in `vocab`/`passiveVocab`/`quiz`.** When a class revises
earlier material (e.g. Class 4 revising Class 3's drinks and numbers before teaching new
restaurant content), put the revised words in that class's own `phraseBank` only — not
in `vocab`/`passiveVocab` — so the AI still has them for a coherent conversation, but
the on-page Vocabulary/Flashcards/Quiz only show what's actually new this lesson. (Class
2 already does this with Class 1's greetings.) `phraseBank` is never required to be a
subset of `vocab` + `passiveVocab` — it's the AI's full permitted vocabulary, while
`vocab`/`passiveVocab` are just this lesson's new/drillable material.

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

**Link the important content word, not the full teaching sentence — and not just
whatever's short.** YouGlish's `pronounce` search looks for that exact text in real
video captions, so a short natural phrase (`la cuenta`, `ahora mismo`, `un cortado`)
usually gets hits, but a sentence stapled together for teaching purposes (e.g. "Cinco
minutos más, por favor.") almost never appears verbatim anywhere and returns nothing.
When a vocab entry's `es` text is a constructed sentence — especially one wrapped
around "por favor"/"gracias"/"sí,"/"no," — point `youglish` at its distinctive core
content word or phrase instead (e.g. `Cinco_minutos_más`, `La_cuenta`, `ahora_mismo`).
That core must itself be meaningful vocabulary, not just short: a bare grammatical
fragment like `Son` (from "Son cuatro treinta") or `Y_tú` (from "Bien, gracias. ¿Y
tú?") teaches nothing on its own and isn't what the student came to hear — shortening
for its own sake isn't the goal, finding real content is. **If nothing in the phrase
is both important and realistically findable (e.g. the only unique content is numbers
already linked elsewhere, as in "Son cuatro treinta"), omit the `youglish` field
entirely** rather than link to a weak fallback — the icon just won't show for that
entry, which is correct. Genuine short phrases, greetings, numbers, and real
menu/dish names don't need shortening at all.

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
