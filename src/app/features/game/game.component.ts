import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { SudokuBoardComponent } from '../../shared/components/sudoku-board/sudoku-board.component';
import { TimerComponent } from '../../shared/components/timer/timer.component';
import { SudokuService } from '../../core/services/sudoku/sudoku.service';
import { GameService } from '../../core/services/game/game.service';
import { type Difficulty, DIFFICULTY_LABELS, type SudokuPuzzle } from '../../shared/models/game.model';
import { formatTime } from '../../core/utils/time';

@Component({
  selector: 'app-game',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SudokuBoardComponent,
    TimerComponent,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterLink,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly sudokuService = inject(SudokuService);
  private readonly gameService = inject(GameService);
  private readonly snackBar = inject(MatSnackBar);

  private penaltyInterval?: ReturnType<typeof setInterval>;

  readonly labels = DIFFICULTY_LABELS;
  readonly errorSlots = [0, 1, 2];

  readonly puzzle = signal<SudokuPuzzle | null>(null);
  readonly loading = signal(false);
  readonly completed = signal(false);
  readonly elapsedSeconds = signal(0);
  readonly paused = signal(false);
  readonly timerStarted = signal(false);
  readonly errorCount = signal(0);
  readonly penaltyActive = signal(false);
  readonly penaltySecondsLeft = signal(0);

  readonly timerRunning = computed(
    () => this.timerStarted() && !this.paused() && !this.completed()
  );

  readonly notesEnabled = computed(
    () => this.difficulty === 'easy' || this.difficulty === 'medium'
  );

  readonly gameOverActive = computed(
    () => this.errorCount() >= 3 && !this.penaltyActive()
  );

  readonly boardDisabled = computed(
    () => this.completed() || this.penaltyActive() || this.errorCount() >= 3
  );

  readonly timer = viewChild(TimerComponent);
  readonly board = viewChild(SudokuBoardComponent);

  difficulty: Difficulty = 'easy';

  ngOnInit(): void {
    this.difficulty = (this.route.snapshot.queryParamMap.get('difficulty') as Difficulty) ?? 'easy';
    this.loadPuzzle();
  }

  ngOnDestroy(): void {
    clearInterval(this.penaltyInterval);
  }

  loadPuzzle(): void {
    this.loading.set(true);
    this.completed.set(false);
    this.timerStarted.set(false);
    this.paused.set(false);
    this.elapsedSeconds.set(0);
    this.errorCount.set(0);
    clearInterval(this.penaltyInterval);
    this.penaltyActive.set(false);
    this.timer()?.reset();

    this.sudokuService.generate(this.difficulty).subscribe({
      next: (p) => {
        this.puzzle.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Errore nel caricamento del puzzle', 'OK', { duration: 3000 });
      },
    });
  }

  onFirstMove(): void {
    this.timerStarted.set(true);
  }

  onTimerTick(seconds: number): void {
    this.elapsedSeconds.set(seconds);
  }

  onBoardComplete(): void {
    this.completed.set(true);

    this.gameService.save({
      difficulty: this.difficulty,
      time_seconds: this.elapsedSeconds(),
      completed: true,
    }).subscribe({
      next: () => {
        this.snackBar.open(
          `Completato in ${this.formatTime(this.elapsedSeconds())}! 🎉`,
          'OK',
          { duration: 5000 }
        );
      },
      error: () => {
        this.snackBar.open('Errore nel salvataggio', 'OK', { duration: 3000 });
      },
    });
  }

  onErrorOccurred(): void {
    this.errorCount.update(n => n + 1);
  }

  onContinueAfterErrors(): void {
    this.errorCount.set(2);
    this.penaltyActive.set(true);
    this.penaltySecondsLeft.set(5);

    this.penaltyInterval = setInterval(() => {
      const left = this.penaltySecondsLeft() - 1;
      if (left <= 0) {
        clearInterval(this.penaltyInterval);
        this.penaltyActive.set(false);
      } else {
        this.penaltySecondsLeft.set(left);
      }
    }, 1000);
  }

  onRestartAfterErrors(): void {
    clearInterval(this.penaltyInterval);
    this.penaltyActive.set(false);
    this.errorCount.set(0);
    this.onRestart();
  }

  togglePause(): void {
    this.paused.update(p => !p);
  }

  onUndo(): void {
    this.board()?.undo();
  }

  onRestart(): void {
    this.board()?.restart();
    this.timer()?.reset();
    this.timerStarted.set(false);
    this.paused.set(false);
    this.errorCount.set(0);
    clearInterval(this.penaltyInterval);
    this.penaltyActive.set(false);
  }

  onReplay(): void {
    this.loadPuzzle();
  }

  newGame(): void {
    this.loadPuzzle();
  }

  readonly formatTime = formatTime;
}
