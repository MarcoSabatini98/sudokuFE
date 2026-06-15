# Cruciverba — Contesto per il "punto 7" (lavoro backend)

> Questo file è un **handoff** per un agente che riprende il lavoro da zero.
> Il file vive nel repo **frontend** (`sudokuFE`) per comodità, ma **il lavoro
> del punto 7 è quasi tutto nel repo backend `sudokuBE`** (stessa cartella padre).

## 1. Quadro generale

App con tre giochi: **Sudoku**, **Macchiavelli**, **Cruciverba** (il terzo, in
sviluppo). Due repository nella stessa cartella padre:

- `sudokuFE` — Angular 21 (standalone, signals, OnPush), porta 4200.
- `sudokuBE` — Node.js CommonJS, Express 5, Sequelize 6, MariaDB. Porta 3000.
  Architettura: **Routes → Controller → Service → Repository → Model**.

Convenzioni (valgono per entrambi):

- **Git**: mai committare su `develop`/`main`. Branch da develop `feat/<nome>`,
  push del solo branch, poi PR su GitHub → develop. Commit in inglese, formato
  `tipo: descrizione`, **senza** `Co-Authored-By`. ⚠️ Il launcher
  `launch-sudoku.ps1` fa `git checkout develop` nei repo: **verifica sempre
  `git branch --show-current` prima di committare**.
- **BE qualità**: `npm run lint` (ESLint, `eqeqeq` strict, no-unused), `npx fallow`
  (tieni `dead 0%`, decomponi funzioni sopra soglia, `// fallow-ignore-next-line
  complexity` solo se inevitabile). Test: **jest** in `__tests__/`. I route-test
  mockano DB/modelli con `__tests__/helpers/appMocks.js`. `.fallowrc.json` ha
  `scripts/*.js` tra gli `entry`.
- `CLAUDE.md` in ogni repo è **gitignored** (contesto locale per l'agente).

## 2. Cosa è GIÀ fatto (cruciverba)

### Backend (`sudokuBE`)

- **Dizionario** `src/data/crossword-dictionary.json` — 43.181 voci
  `{ word, clue, common }`. Parole italiane definibili (incluse rare:
  luculliano, smargiasso…), **escluse le forme flesse**. Tier `common` = parola
  presente in `src/data/wordlist-it.json` (1124 parole comuni).
  - Generato offline da `scripts/build-dictionary.js` (parser **streaming** del
    dump di it.wiktionary; testato in `__tests__/build-dictionary.test.js`).
    Rigenerazione: `curl -sL https://dumps.wikimedia.org/itwiktionary/latest/itwiktionary-latest-pages-articles.xml.bz2 -o dump.bz2 && bzip2 -dc dump.bz2 | node scripts/build-dictionary.js`
  - Loader `src/services/dictionary.service.js`: `allEntries()`, `clueFor(word)`,
    `wordsByLength({ commonOnly })`.
  - Licenze: wordlist comune = napolux/paroleitaliane (MIT); definizioni =
    Wikizionario (**CC BY-SA**). Vedi `src/data/WORDLIST_SOURCE.md`.
- **Compilatore denso** (rettangolo pieno con caselle nere, stile cruciverba):
  - `src/services/crossword/pattern.js` — pattern di nere a **simmetria 180°**
    (niente run da 2, niente celle orfane), estrazione slot orizzontali/verticali.
  - `src/services/crossword/fill.js` — indice dizionario per lunghezza + fill a
    **backtracking** con ordine **MRV** e **forward-checking** su domini mantenuti.
  - `src/services/crossword.service.js` — `generateCrossword({ difficulty })`:
    prova vari pattern finché uno si riempie; numera le celle; costruisce le
    `entries` con `clueFor`.
  - `src/constants/crossword.constants.js` — `DIFFICULTY_CONFIG`
    (easy 9×11 black 0.32, medium 11×13 black 0.30, hard 13×15 black 0.28),
    `MAX_PATTERN_ATTEMPTS=120`, `MAX_FILL_STEPS=4000`.
  - Endpoint **`GET /api/v1/crossword/generate?difficulty=easy|medium|hard`**
    (`src/controllers/crossword.controller.js`, `src/routes/crossword.routes.js`,
    registrato in `src/routes/index.js`).
  - Output: `{ rows, cols, difficulty, cells, entries }` dove
    `cells[r][c]` = `null` (nera) o `{ solution: 'A', number: n|null }`, ed
    `entries[]` = `{ number, direction:'across'|'down', row, col, length, clue, answer }`.
  - Branch attuale (da mergiare): **`feat/crossword-compiler`**.

### Frontend (`sudokuFE`)

- `src/app/features/crossword/` — pagina interattiva (griglia, input tastiera,
  liste Orizzontali/Verticali, Verifica/Soluzione/Cancella/Nuovo schema,
  selettore difficoltà). `src/app/core/services/crossword/crossword.service.ts`
  → `generate(difficulty)`. Model `src/app/shared/models/crossword.model.ts`.
  - Già su develop: scaffold + rendering. Branch da mergiare: **`feat/crossword-difficulty`**.

## 3. Vincoli/lezioni importanti (NON ripeterle)

- **Perf fill**: più caselle nere = slot corti = fill velocissimo. Il `blackRatio`
  basso (slot lunghi 10-13) è il vero killer (fa esplodere il backtracking).
- **Bias "parole comuni"**: forzare le comuni nel fill **live** causa thrashing
  (il pool comune ~1100 è troppo piccolo → over-constrained, fino a 20s). È stato
  **rimosso**. Per questo, **a runtime** la difficoltà è solo la **dimensione
  griglia** e il vocabolario è ricco (anche rare) a TUTTI i livelli.
- Conseguenza: il **tiering vocabolario per difficoltà** (easy = parole comuni/
  familiari) si fa **solo con la pre-generazione offline** (vedi Task B), dove un
  fill lento e common-biased è accettabile.

## 4. Punto 7 — cosa fare (tutto in `sudokuBE`)

### Task A — Ollama opzionale per definizioni migliori
- L'utente ha **Ollama con `llama3.2:3b`** in locale (casa e lavoro), API su
  `http://localhost:11434`.
- **Detection non bloccante**: prova `GET http://localhost:11434/api/tags`; se
  raggiungibile e il modello c'è → abilitato, altrimenti **salta** (un collega
  senza Ollama deve giocare lo stesso: le definizioni del dump sono la base).
- Uso: generare definizioni in **stile cruciverba** (brevi, argute) in italiano,
  via `POST /api/generate { model, prompt, stream:false }`. Preferibile farlo in
  **preparazione/offline** (arricchire/sostituire le clue in
  `crossword-dictionary.json` o in una cache `word→clue`), **non live** (latenza).
- Acceptance: con Ollama spento, generazione e gioco invariati; con Ollama acceso,
  le clue migliorano dove applicato. Coprire con test la parte di detection
  (mockando la fetch).

### Task B — Pre-generazione offline + persistenza + tiering vocabolario
- **Perché**: abilita easy con parole comuni (fill lento ma offline = ok) e
  risposte istantanee a runtime.
- Script prep (es. `scripts/build-puzzles.js`) che genera **N schemi per
  difficoltà** con **tiering vocabolario**: easy = solo/bias parole `common`
  (riusa il path common-biased rimosso dal live, con budget più alto), hard =
  anche rare. Salva gli schemi.
- **Persistenza** (come gli altri giochi): migrazione Sequelize + modello
  `CrosswordPuzzle` (id, difficulty ENUM, payload JSON, created_at) +
  repository. Comandi: `npx sequelize-cli db:migrate`. DB `sudoku`, user `user`,
  pwd `1234`, host localhost:3306.
- L'endpoint `/crossword/generate` serve uno schema **salvato a caso** per
  difficoltà (fallback alla generazione live se la tabella è vuota).
- Acceptance: easy mostra parole comuni; risposta endpoint < 50ms; test su
  repository/endpoint (mock DB con `appMocks`).

### Task C — Record/cronologia (opzionale)
- Come Sudoku/Macchiavelli: salvare tempo di completamento e miglior tempo per
  difficoltà (tabella + endpoint + FE). Vedi `src/services/record.service.js` e
  `machiavelli` come riferimento.

## 5. Come avviare / testare (BE)
- Dipendenze: `npm install`. Avvio: `npm run dev` (porta 3000).
- Test: `npx jest`. Lint: `npm run lint`. Qualità: `npx fallow`.
- Prova endpoint: `curl "http://localhost:3000/api/v1/crossword/generate?difficulty=hard"`.

## 6. Ordine consigliato
1. Task B (pre-generazione + persistenza + tiering) — dà il valore maggiore
   (difficoltà reali sul vocabolario) e sblocca easy "facile".
2. Task A (Ollama) — migliora la qualità delle clue, opzionale.
3. Task C (record) — rifinitura.

Buon lavoro 🙂

## NOTE FINALI
- Mentre l'utente stava correggendo questo file, in contemporanea l'agente AI stava ricostruendo la lista delle definizioni orizzontali e verticali nel cruciverba ma non ha finito per via dei limiti di sessione. Come prima cosa chiedi all'utente se vuole finire con quelle modifiche e in base alla risposta procedi come ti viene indicato.
- Alla fine del punto 7, se l'utente non ha altre richieste e il lavoro è finito, puoi procedere ad eliminare autonomamente questo file (crossword-point7-context.md).
