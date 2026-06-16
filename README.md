# 🔢 Sudoku

[🇮🇹 Italiano](#-italiano) · [🇬🇧 English](#-english)

---

## 🇮🇹 Italiano

### Descrizione

Raccolta di giochi sviluppata con **Angular 21**. Dalla home si scelgono tre giochi:

- **Sudoku** single-player: quattro livelli di difficoltà, timer, note automatiche, modalità timbro, cronologia partite e record personali.
- **Macchiavelli** (gioco di carte): 1 umano contro 3 bot, con drag & drop delle carte. Motore di gioco e AI interamente lato frontend; il backend salva solo l'esito delle partite e il miglior tempo di vittoria.
- **Cruciverba**: schema denso generato dal dizionario italiano, tre difficoltà (dimensione griglia), cronometro e miglior tempo per difficoltà.

Tema chiaro/scuro con persistenza.

### Macchiavelli — come si gioca

Dalla home apri la card **Macchiavelli**. Hai 13 carte; trascina combinazioni valide sul tavolo:

- **Scala**: 3+ carte stesso seme, ranghi consecutivi (asso alto o basso).
- **Tris/Poker**: 3+ carte stesso valore, semi diversi.
- **Jolly**: sostituisce qualsiasi carta mancante.

Puoi riorganizzare liberamente il tavolo, ma a fine turno ogni combinazione deve avere almeno 3 carte e devi aver calato almeno una carta dalla tua mano (altrimenti **Pesca**). Svuota la mano per vincere. Le carte sono disegnate via CSS: nessun asset esterno, funziona offline.

### Cruciverba — come si gioca

Dalla home apri la card **Cruciverba** e scegli la difficoltà (**Facile/Medio/Difficile**, cambia la dimensione della griglia). Lo schema è denso, in stile cruciverba da giornale, con definizioni in italiano dal dizionario.

1. Clicca una casella e digita le lettere; le frecce o un secondo click sulla casella cambiano direzione (orizzontale/verticale).
2. Le liste **Orizzontali** e **Verticali** a lato mostrano le definizioni: clicca una voce per saltare a quella parola.
3. **Verifica** evidenzia le lettere errate, **Soluzione** rivela tutto, **Cancella** svuota, **Nuovo schema** ne genera un altro.
4. Un cronometro misura il tempo: completando lo schema la partita viene salvata e viene mostrato il **miglior tempo** per quella difficoltà.

---

### Come giocare

1. Dalla **Home** scegli la difficoltà: **Facile**, **Medio**, **Difficile** o **Estremo**.
2. Il timer parte al **primo numero inserito**.
3. Clicca una cella vuota e digita un numero (1–9) dalla tastiera, oppure usa la **barra numeri** in basso.
4. Completa la griglia 9×9 rispettando le regole del Sudoku:
   - ogni riga deve contenere i numeri 1–9 senza ripetizioni
   - ogni colonna deve contenere i numeri 1–9 senza ripetizioni
   - ogni riquadro 3×3 deve contenere i numeri 1–9 senza ripetizioni
5. Le celle con errori vengono evidenziate in rosso.
6. Quando la griglia è completa e corretta, la partita viene salvata automaticamente.

---

### Barra numeri (1–9)

Sotto la griglia è presente una barra con i numeri dall'1 al 9.

- Il **contatore** sotto ogni numero indica quante volte manca ancora (es. `3` significa che quel numero va inserito ancora 3 volte).
- Quando un numero è stato inserito tutte e 9 le volte, la sua tile diventa **grigia** e opaca.
- Cliccando su un numero si attiva la **modalità timbro**: cliccando qualsiasi cella vuota si inserisce quel numero direttamente, senza usare la tastiera.
- Cliccando di nuovo lo stesso numero si **disattiva** la modalità timbro.
- Quando un numero è attivo nella barra, **tutte le celle** che già contengono quel numero vengono evidenziate in blu.

---

### Pulsanti laterali

| Pulsante | Funzione |
|---|---|
| ⏸ **Pausa** / ▶ **Riprendi** | Mette in pausa il timer e oscura la griglia (anti-imbroglio). Riprende il gioco. |
| ↩ **Annulla** | Annulla l'ultima mossa. Può essere premuto più volte per tornare indietro di più passi. |
| ↺ **Ricomincia** | Riporta la griglia allo stato iniziale del puzzle corrente e azzera il timer. |
| ✦ **Nuova partita** | Genera un nuovo puzzle alla stessa difficoltà. |
| ✏️ **Note** | Attiva/disattiva le note automatiche *(solo Facile e Medio)*. |
| ▶ **Rigioca** | Appare dopo la vittoria. Genera un nuovo puzzle alla stessa difficoltà. |

---

### Modalità Note *(Facile e Medio)*

Disponibile solo nelle difficoltà più basse per non togliere la sfida ai livelli avanzati.

- Premi **✏️ Note** per attivarle (il pulsante diventa blu).
- Nelle celle vuote compaiono i **numeri candidati**, cioè i numeri che possono stare in quella cella secondo le regole del Sudoku (eliminazione per riga, colonna e riquadro 3×3).
- Le note si **aggiornano automaticamente**: quando inserisci un numero in una cella, i candidati corrispondenti scompaiono dalle celle della stessa riga, colonna e riquadro.
- Il tasto Note rimane **disabilitato** finché non inserisci il primo numero (per non poter vedere i candidati prima di iniziare).

---

### Evidenziazione celle

Selezionando una cella (o attivando un numero nella barra):

- **Blu chiaro** — celle della stessa riga, colonna e riquadro 3×3
- **Blu medio** — celle che contengono lo stesso numero della cella selezionata (o il numero attivo nella barra)
- **Blu scuro** — cella selezionata
- **Rosso** — celle con un valore errato rispetto alla soluzione

---

### Cronologia

Accessibile dal menu **Cronologia** in alto. Mostra tutte le partite giocate con:

- Data e ora
- Difficoltà (badge colorato)
- Tempo impiegato
- Esito (Completata / Abbandonata)

Filtrabile per difficoltà. Le partite sono paginate (15 per pagina).

---

### Record

Accessibile dal menu **Record** in alto. Mostra il **miglior tempo** raggiunto per ciascuna difficoltà, con la data in cui è stato ottenuto.

---

### Tema chiaro / scuro

Il pulsante 🌙 / ☀️ nella barra di navigazione alterna il tema. La preferenza viene **salvata** e ripristinata al prossimo accesso.

---

### Difficoltà

| Livello | Celle date | Note |
|---|---|---|
| Facile | 45 | Disponibili |
| Medio | 35 | Disponibili |
| Difficile | 30 | Disabilitate |
| Estremo | 25 | Disabilitate |

I puzzle hanno **soluzione unica** garantita (verifica con backtracking).

---

### Setup tecnico

**Prerequisiti:** Node.js 18+, npm, backend in esecuzione su `http://localhost:3000`

```bash
# Installa dipendenze
npm install

# Avvia in sviluppo (porta 4200)
ng serve

# Build produzione
ng build

# Test
ng test --watch=false

# Lint
ng lint
```

### Web App Desktop (Windows)

Per avviare il gioco con un doppio click dal Desktop, senza aprire terminali manualmente.

**Prerequisito:** clona entrambe le repo nella stessa cartella (es. `sudokuM/sudokuFE` e `sudokuM/sudokuBE`). Se le cloni in cartelle separate, apri `launch-sudoku.ps1` e modifica la variabile `$BE_PATH` con il path corretto del backend.

**Setup (una volta sola):**

```powershell
powershell -ExecutionPolicy Bypass -File "create-shortcut.ps1"
```

Crea il collegamento **Sudoku** sul Desktop con l'icona del gioco.

**Utilizzo:** doppio click su `Sudoku` → backend e frontend partono in background → il browser si apre automaticamente su `http://localhost:4200`.

> Se backend e frontend sono già in esecuzione, apre direttamente il browser senza riavviarli.

---

## 🇬🇧 English

### Description

A collection of games built with **Angular 21**. From the home you pick one of three games:

- **Sudoku** single-player: four difficulty levels, timer, automatic notes, stamp mode, game history and personal records.
- **Machiavelli** (card game): 1 human vs 3 bots, drag & drop. Game engine and AI fully on the frontend; the backend only stores results and the best winning time.
- **Crossword**: a dense grid generated from the Italian dictionary, three difficulties (grid size), a stopwatch and a best time per difficulty.

Light/dark theme with persistence.

### Machiavelli — how to play

Open the **Machiavelli** card from the home. You have 13 cards; drag valid melds onto the table:

- **Run**: 3+ cards of the same suit, consecutive ranks (ace high or low).
- **Set**: 3+ cards of the same rank, different suits.
- **Joker**: stands in for any missing card.

You may rearrange the table freely, but at the end of your turn every meld must have at least 3 cards and you must have played at least one card from your hand (otherwise **Draw**). Empty your hand to win. Cards are drawn in CSS: no external assets, works offline.

### Crossword — how to play

Open the **Crossword** card and pick a difficulty (**Easy/Medium/Hard**, which changes the grid size). The grid is dense, newspaper-style, with Italian clues from the dictionary.

1. Click a cell and type letters; arrow keys or a second click on a cell switch direction (across/down).
2. The **Across** and **Down** lists show the clues: click an entry to jump to that word.
3. **Verifica** highlights wrong letters, **Soluzione** reveals everything, **Cancella** clears, **Nuovo schema** generates another.
4. A stopwatch tracks your time: completing the grid saves the game and shows the **best time** for that difficulty.

---

### How to play

1. From the **Home** screen choose a difficulty: **Easy**, **Medium**, **Hard**, or **Extreme**.
2. The timer starts on your **first move**.
3. Click an empty cell and type a number (1–9) from the keyboard, or use the **number bar** below the grid.
4. Fill the 9×9 grid following Sudoku rules:
   - each row must contain the numbers 1–9 without repetition
   - each column must contain the numbers 1–9 without repetition
   - each 3×3 box must contain the numbers 1–9 without repetition
5. Incorrect cells are highlighted in red.
6. When the grid is complete and correct, the game is saved automatically.

---

### Number bar (1–9)

Below the grid there is a bar with tiles for numbers 1 through 9.

- The **counter** below each number shows how many times it still needs to be placed (e.g. `3` means that number must be placed 3 more times).
- When a number has been placed all 9 times, its tile turns **grey and faded**.
- Clicking a number activates **stamp mode**: clicking any empty cell places that number directly, without using the keyboard.
- Clicking the same number again **deactivates** stamp mode.
- When a number is active in the bar, **all cells** already containing that number are highlighted in blue.

---

### Side buttons

| Button | Function |
|---|---|
| ⏸ **Pause** / ▶ **Resume** | Pauses the timer and blurs the grid (anti-cheat). Resumes the game. |
| ↩ **Undo** | Undoes the last move. Can be pressed multiple times to go back several steps. |
| ↺ **Restart** | Resets the grid to the initial state of the current puzzle and resets the timer. |
| ✦ **New game** | Generates a new puzzle at the same difficulty. |
| ✏️ **Notes** | Toggles automatic notes *(Easy and Medium only)*. |
| ▶ **Play again** | Appears after winning. Generates a new puzzle at the same difficulty. |

---

### Notes mode *(Easy and Medium)*

Available only on lower difficulties to preserve the challenge at advanced levels.

- Press **✏️ Notes** to enable them (the button turns blue).
- Empty cells display **candidate numbers** — the numbers that can go in that cell according to Sudoku rules (elimination by row, column, and 3×3 box).
- Notes **update automatically**: when you place a number in a cell, the corresponding candidates disappear from cells in the same row, column, and box.
- The Notes button stays **disabled** until you place your first number (so you can't see candidates before starting).

---

### Cell highlighting

When a cell is selected (or a number is active in the bar):

- **Light blue** — cells in the same row, column, and 3×3 box
- **Medium blue** — cells containing the same number as the selected cell (or the active bar number)
- **Dark blue** — the selected cell
- **Red** — cells with a value that doesn't match the solution

---

### History

Accessible from the **Cronologia** (History) menu at the top. Shows all games played with:

- Date and time
- Difficulty (colored badge)
- Time taken
- Result (Completed / Abandoned)

Can be filtered by difficulty. Games are paginated (15 per page).

---

### Records

Accessible from the **Record** menu at the top. Shows the **best time** achieved for each difficulty level, along with the date it was set.

---

### Light / dark theme

The 🌙 / ☀️ button in the navigation bar toggles the theme. The preference is **saved** and restored on the next visit.

---

### Difficulty levels

| Level | Given cells | Notes |
|---|---|---|
| Easy | 45 | Available |
| Medium | 35 | Available |
| Hard | 30 | Disabled |
| Extreme | 25 | Disabled |

All puzzles have a **guaranteed unique solution** (backtracking uniqueness check).

---

### Technical setup

**Prerequisites:** Node.js 18+, npm, backend running on `http://localhost:3000`

```bash
# Install dependencies
npm install

# Start development server (port 4200)
ng serve

# Production build
ng build

# Run tests
ng test --watch=false

# Lint
ng lint
```

### Desktop Web App (Windows)

Launch the game with a double-click from the Desktop, without opening terminals manually.

**Prerequisite:** clone both repos in the same folder (e.g. `sudokuM/sudokuFE` and `sudokuM/sudokuBE`). If you clone them in different locations, open `launch-sudoku.ps1` and update the `$BE_PATH` variable to point to your backend folder.

**One-time setup:**

```powershell
powershell -ExecutionPolicy Bypass -File "create-shortcut.ps1"
```

Creates a **Sudoku** shortcut on the Desktop with the game icon.

**Usage:** double-click `Sudoku` → backend and frontend start in the background → browser opens automatically at `http://localhost:4200`.

> If backend and frontend are already running, it opens the browser directly without restarting them.
