import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { NgClass } from '@angular/common';

interface Move { row: number; col: number; prev: number }

@Component({
  selector: 'app-sudoku-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  templateUrl: './sudoku-board.component.html',
  styleUrl: './sudoku-board.component.css',
})
export class SudokuBoardComponent implements OnChanges {
  puzzle = input<number[][]>([]);
  solution = input<number[][]>([]);
  disabled = input<boolean>(false);
  paused = input<boolean>(false);
  notesEnabled = input<boolean>(false);

  boardComplete = output<void>();
  firstMove = output<void>();
  errorOccurred = output<void>();

  readonly digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  readonly userGrid = signal<number[][]>([]);
  readonly selected = signal<[number, number] | null>(null);
  readonly activeDigit = signal<number | null>(null);
  readonly notesMode = signal(false);

  private readonly history = signal<Move[]>([]);
  private readonly hasStarted = signal(false);

  readonly isGiven = computed(() => {
    const p = this.puzzle();
    return p.map((row) => row.map((v) => v !== 0));
  });

  readonly isError = computed(() => {
    const grid = this.userGrid();
    const sol = this.solution();
    if (!sol.length) return Array.from({ length: 9 }, () => Array(9).fill(false));
    return grid.map((row, r) => row.map((v, c) => v !== 0 && v !== sol[r][c]));
  });

  readonly selectedValue = computed(() => {
    const sel = this.selected();
    if (!sel) return 0;
    const [r, c] = sel;
    return this.userGrid()[r]?.[c] ?? 0;
  });

  readonly numberCounts = computed(() => {
    const counts = new Array(10).fill(0);
    this.userGrid().forEach((row) => row.forEach((v) => { if (v >= 1 && v <= 9) counts[v]++; }));
    return counts;
  });

  readonly notes = computed<number[][][]>(() => {
    if (!this.notesEnabled()) return [];
    const grid = this.userGrid();
    if (!grid.length) return [];
    return grid.map((row, r) =>
      row.map((val, c) => {
        if (val !== 0) return [];
        const used = new Set<number>();
        grid[r].forEach(v => used.add(v));
        grid.forEach(ro => used.add(ro[c]));
        const br = Math.floor(r / 3) * 3;
        const bc = Math.floor(c / 3) * 3;
        for (let i = br; i < br + 3; i++)
          for (let j = bc; j < bc + 3; j++)
            used.add(grid[i][j]);
        const candidates: number[] = [];
        for (let n = 1; n <= 9; n++)
          if (!used.has(n)) candidates.push(n);
        return candidates;
      })
    );
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['puzzle'] && this.puzzle().length) {
      this.userGrid.set(this.puzzle().map((row) => [...row]));
      this.selected.set(null);
      this.activeDigit.set(null);
      this.notesMode.set(false);
      this.history.set([]);
      this.hasStarted.set(false);
    }
  }

  onCellClick(row: number, col: number): void {
    if (this.paused()) return;
    this.selected.set([row, col]);
    if (this.disabled() || this.isGiven()[row][col]) return;

    const digit = this.activeDigit();
    if (digit !== null) {
      this.writeCell(row, col, digit);
    }
  }

  onCellFocus(row: number, col: number): void {
    if (!this.paused()) this.selected.set([row, col]);
  }

  onCellKeydown(row: number, col: number, event: KeyboardEvent): void {
    if (this.disabled() || this.paused() || this.isGiven()[row][col]) return;
    const n = parseInt(event.key, 10);
    if (n >= 1 && n <= 9) {
      event.preventDefault();
      this.writeCell(row, col, n);
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      this.writeCell(row, col, 0);
    }
  }

  onDigitSelect(n: number): void {
    this.activeDigit.update((cur) => (cur === n ? null : n));
    this.selected.set(null);
  }

  toggleNotes(): void {
    if (!this.notesEnabled()) return;
    this.notesMode.update(v => !v);
  }

  undo(): void {
    const h = this.history();
    if (!h.length) return;
    const last = h[h.length - 1];
    this.history.update(arr => arr.slice(0, -1));
    this.userGrid.update(grid => {
      const copy = grid.map(r => [...r]);
      copy[last.row][last.col] = last.prev;
      return copy;
    });
  }

  restart(): void {
    this.userGrid.set(this.puzzle().map(row => [...row]));
    this.history.set([]);
    this.selected.set(null);
    this.activeDigit.set(null);
    this.notesMode.set(false);
    this.hasStarted.set(false);
  }

  private writeCell(row: number, col: number, val: number): void {
    if (this.isGiven()[row][col]) return;
    const prev = this.userGrid()[row][col];
    if (prev === val) return;

    this.history.update(h => [...h, { row, col, prev }]);

    if (!this.hasStarted()) {
      this.hasStarted.set(true);
      this.firstMove.emit();
    }

    this.userGrid.update((grid) => {
      const copy = grid.map((r) => [...r]);
      copy[row][col] = val;
      return copy;
    });

    this.emitErrorIfNew(prev, val, row, col);
    this.checkCompletion();
  }

  private emitErrorIfNew(prev: number, val: number, row: number, col: number): void {
    if (val === 0) return;
    const sol = this.solution();
    if (!sol.length) return;
    if (prev !== 0 && prev !== sol[row][col]) return;
    if (val !== sol[row][col]) this.errorOccurred.emit();
  }

  private checkCompletion(): void {
    const grid = this.userGrid();
    const sol = this.solution();
    if (!sol.length) return;
    const complete = grid.every((row, r) => row.every((v, c) => v === sol[r][c]));
    if (complete) this.boardComplete.emit();
  }

  private cellRelation(row: number, col: number): { isSelected: boolean; isHighlighted: boolean } {
    const [sr, sc] = this.selected() ?? [-1, -1];
    const isSelected = row === sr && col === sc;
    const sameBox =
      Math.floor(row / 3) === Math.floor(sr / 3) &&
      Math.floor(col / 3) === Math.floor(sc / 3);
    return {
      isSelected,
      isHighlighted: (row === sr || col === sc || sameBox) && !isSelected,
    };
  }

  private hasSameNumber(row: number, col: number, isSelected: boolean): boolean {
    if (isSelected) return false;
    const cellValue = this.userGrid()[row]?.[col] ?? 0;
    const selValue = this.activeDigit() ?? this.selectedValue();
    return selValue !== 0 && cellValue === selValue;
  }

  // fallow-ignore-next-line complexity
  cellClass(row: number, col: number): Record<string, boolean> {
    const { isSelected, isHighlighted } = this.cellRelation(row, col);
    const cellValue = this.userGrid()[row]?.[col] ?? 0;
    const given = this.isGiven()[row][col];

    return {
      given,
      error: this.isError()[row][col],
      selected: isSelected,
      highlight: isHighlighted,
      'same-number': this.hasSameNumber(row, col, isSelected),
      'stamp-target': !given && !this.disabled() && this.activeDigit() !== null,
      'has-notes': cellValue === 0 && this.notesMode() && (this.notes()[row]?.[col]?.length ?? 0) > 0,
      'thick-right': col === 2 || col === 5,
      'thick-bottom': row === 2 || row === 5,
    };
  }
}
