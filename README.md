# 🔢 Sudoku

[🇮🇹 Italiano](#-italiano) · [🇬🇧 English](#-english)

---

## 🇮🇹 Italiano

### Descrizione

Gioco del Sudoku single-player sviluppato con **Angular 21**. Quattro livelli di difficoltà, timer, note automatiche, modalità timbro, cronologia partite e record personali. Tema chiaro/scuro con persistenza.

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

---

## 🇬🇧 English

### Description

Single-player Sudoku game built with **Angular 21**. Four difficulty levels, timer, automatic notes, stamp mode, game history, and personal records. Light/dark theme with persistence.

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
