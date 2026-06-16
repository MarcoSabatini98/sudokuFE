import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

import { CrosswordService } from '../../core/services/crossword/crossword.service';
import {
  Crossword,
  CrosswordDifficulty,
  CrosswordDirection,
  CrosswordEntry,
  CROSSWORD_DIFFICULTIES,
  CROSSWORD_DIFFICULTY_LABELS,
} from '../../shared/models/crossword.model';

interface CellPos {
  row: number;
  col: number;
}

const ACCENTS: Record<string, string> = {
  À: 'A', Á: 'A', È: 'E', É: 'E', Ì: 'I', Í: 'I', Ò: 'O', Ó: 'O', Ù: 'U', Ú: 'U',
};

@Component({
  selector: 'app-crossword',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule],
  templateUrl: './crossword.component.html',
  styleUrl: './crossword.component.css',
})
export class CrosswordComponent implements OnDestroy {
  private readonly api = inject(CrosswordService);

  readonly difficulties = CROSSWORD_DIFFICULTIES;
  readonly difficultyLabels = CROSSWORD_DIFFICULTY_LABELS;
  readonly difficulty = signal<CrosswordDifficulty>('medium');

  readonly crossword = signal<Crossword | null>(null);
  readonly loading = signal(false);
  readonly userGrid = signal<string[][]>([]);
  readonly selected = signal<CellPos | null>(null);
  readonly direction = signal<CrosswordDirection>('across');
  /** Quando true, le lettere errate vengono evidenziate. */
  readonly showErrors = signal(false);

  /** Cronometro della partita corrente e miglior tempo personale per difficoltà. */
  readonly elapsed = signal(0);
  readonly bestTime = signal<number | null>(null);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private saved = false;

  readonly acrossEntries = computed(() => this.entriesByDir('across'));
  readonly downEntries = computed(() => this.entriesByDir('down'));

  readonly activeEntry = computed<CrosswordEntry | null>(() => {
    const sel = this.selected();
    const cw = this.crossword();
    if (!sel || !cw) return null;
    const dir = this.direction();
    return cw.entries.find((e) => e.direction === dir && this.cellInEntry(e, sel.row, sel.col)) ?? null;
  });

  readonly solved = computed(() => {
    const cw = this.crossword();
    if (!cw) return false;
    return cw.cells.every((row, r) =>
      row.every((cell, c) => !cell || this.userGrid()[r]?.[c] === cell.solution)
    );
  });

  constructor() {
    this.newPuzzle();
    // Salva il completamento una sola volta, quando la griglia diventa corretta.
    effect(() => {
      if (this.crossword() && this.solved() && !this.saved) {
        this.saved = true;
        this.stopTimer();
        this.recordCompletion();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  newPuzzle(): void {
    this.loading.set(true);
    this.api.generate(this.difficulty()).subscribe({
      next: (cw) => this.loadCrossword(cw),
      error: () => this.loading.set(false),
    });
  }

  setDifficulty(level: CrosswordDifficulty): void {
    if (level === this.difficulty()) return;
    this.difficulty.set(level);
    this.newPuzzle();
  }

  private loadCrossword(cw: Crossword): void {
    this.crossword.set(cw);
    this.userGrid.set(cw.cells.map((row) => row.map(() => '')));
    this.showErrors.set(false);
    this.direction.set('across');
    this.selected.set(this.firstWhiteCell(cw));
    this.loading.set(false);
    this.saved = false;
    this.bestTime.set(null);
    this.startTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.elapsed.set(0);
    this.intervalId = setInterval(() => this.elapsed.update((s) => s + 1), 1000);
  }

  private stopTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** A fine partita salva il tempo (best-effort) e carica il miglior tempo. */
  private recordCompletion(): void {
    this.api
      .saveGame({ difficulty: this.difficulty(), time_seconds: Math.max(1, this.elapsed()) })
      .subscribe({ next: () => this.loadBestTime(), error: () => undefined });
  }

  private loadBestTime(): void {
    this.api.getRecords().subscribe({
      next: (records) => {
        const record = records.find((r) => r.difficulty === this.difficulty());
        this.bestTime.set(record ? record.best_time_seconds : null);
      },
      error: () => undefined,
    });
  }

  formatTime(seconds: number): string {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  // -- Stato celle -----------------------------------------------------------

  isBlack(row: number, col: number): boolean {
    return !this.crossword()?.cells[row]?.[col];
  }

  cellNumber(row: number, col: number): number | null {
    return this.crossword()?.cells[row]?.[col]?.number ?? null;
  }

  letterAt(row: number, col: number): string {
    return this.userGrid()[row]?.[col] ?? '';
  }

  isSelected(row: number, col: number): boolean {
    const sel = this.selected();
    return !!sel && sel.row === row && sel.col === col;
  }

  isHighlighted(row: number, col: number): boolean {
    const entry = this.activeEntry();
    return !!entry && this.cellInEntry(entry, row, col);
  }

  isWrong(row: number, col: number): boolean {
    if (!this.showErrors()) return false;
    const cell = this.crossword()?.cells[row]?.[col];
    const value = this.letterAt(row, col);
    return !!cell && value !== '' && value !== cell.solution;
  }

  // -- Interazione -----------------------------------------------------------

  onCellClick(row: number, col: number): void {
    if (this.isBlack(row, col)) return;
    if (this.isSelected(row, col)) {
      this.toggleDirection();
      return;
    }
    this.selected.set({ row, col });
  }

  onClueClick(entry: CrosswordEntry): void {
    this.direction.set(entry.direction);
    this.selected.set({ row: entry.row, col: entry.col });
  }

  isClueActive(entry: CrosswordEntry): boolean {
    return this.activeEntry() === entry;
  }

  toggleDirection(): void {
    this.direction.update((d) => (d === 'across' ? 'down' : 'across'));
  }

  onKeydown(event: KeyboardEvent): void {
    const sel = this.selected();
    if (!sel) return;
    if (this.handleNavigation(event, sel)) return;
    this.handleEdit(event, sel);
  }

  private handleEdit(event: KeyboardEvent, sel: CellPos): void {
    if (event.key === 'Backspace') {
      event.preventDefault();
      this.backspace(sel);
      return;
    }
    if (event.key === 'Delete') {
      event.preventDefault();
      this.writeLetter(sel, '');
      return;
    }
    const letter = this.toLetter(event.key);
    if (!letter) return;
    event.preventDefault();
    this.writeLetter(sel, letter);
    this.advance(sel);
  }

  private handleNavigation(event: KeyboardEvent, sel: CellPos): boolean {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0],
    };
    const delta = moves[event.key];
    if (!delta) return false;
    event.preventDefault();
    this.direction.set(delta[0] === 0 ? 'across' : 'down');
    this.moveTo(sel.row + delta[0], sel.col + delta[1]);
    return true;
  }

  // -- Azioni ----------------------------------------------------------------

  check(): void {
    this.showErrors.set(true);
  }

  reveal(): void {
    const cw = this.crossword();
    if (!cw) return;
    this.userGrid.set(cw.cells.map((row) => row.map((cell) => (cell ? cell.solution : ''))));
    this.showErrors.set(false);
  }

  clear(): void {
    const cw = this.crossword();
    if (!cw) return;
    this.userGrid.set(cw.cells.map((row) => row.map(() => '')));
    this.showErrors.set(false);
  }

  // -- Helper privati --------------------------------------------------------

  private entriesByDir(dir: CrosswordDirection): CrosswordEntry[] {
    return (this.crossword()?.entries ?? [])
      .filter((e) => e.direction === dir)
      .sort((a, b) => a.number - b.number);
  }

  private cellInEntry(entry: CrosswordEntry, row: number, col: number): boolean {
    if (entry.direction === 'across') {
      return row === entry.row && col >= entry.col && col < entry.col + entry.length;
    }
    return col === entry.col && row >= entry.row && row < entry.row + entry.length;
  }

  private writeLetter(sel: CellPos, letter: string): void {
    this.userGrid.update((grid) => {
      const copy = grid.map((r) => [...r]);
      copy[sel.row][sel.col] = letter;
      return copy;
    });
  }

  private backspace(sel: CellPos): void {
    if (this.letterAt(sel.row, sel.col) !== '') {
      this.writeLetter(sel, '');
      return;
    }
    const prev = this.step(sel, -1);
    if (prev) {
      this.writeLetter(prev, '');
      this.selected.set(prev);
    }
  }

  private advance(sel: CellPos): void {
    const next = this.step(sel, 1);
    if (next) this.selected.set(next);
  }

  /** Cella adiacente nella direzione corrente, se bianca e dentro la griglia. */
  private step(sel: CellPos, dir: 1 | -1): CellPos | null {
    const d = this.direction() === 'across' ? { dr: 0, dc: dir } : { dr: dir, dc: 0 };
    const row = sel.row + d.dr;
    const col = sel.col + d.dc;
    return this.isWhite(row, col) ? { row, col } : null;
  }

  private moveTo(row: number, col: number): void {
    if (this.isWhite(row, col)) this.selected.set({ row, col });
  }

  private isWhite(row: number, col: number): boolean {
    const cw = this.crossword();
    return !!cw && row >= 0 && col >= 0 && row < cw.rows && col < cw.cols && !!cw.cells[row][col];
  }

  private firstWhiteCell(cw: Crossword): CellPos | null {
    for (let r = 0; r < cw.rows; r++) {
      for (let c = 0; c < cw.cols; c++) {
        if (cw.cells[r][c]) return { row: r, col: c };
      }
    }
    return null;
  }

  private toLetter(key: string): string | null {
    if (key.length !== 1) return null;
    const upper = key.toUpperCase();
    const letter = ACCENTS[upper] ?? upper;
    return letter >= 'A' && letter <= 'Z' ? letter : null;
  }
}
