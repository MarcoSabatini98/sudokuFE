import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from '../../shared/models/game.model';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatCardModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  readonly difficulties = DIFFICULTIES;
  readonly labels = DIFFICULTY_LABELS;

  private readonly router = inject(Router);
  private readonly announcer = inject(LiveAnnouncer);

  readonly revealClicks = signal<Record<string, number>>({ hard: 0, extreme: 0 });

  readonly difficultyNotes: Record<Difficulty, string> = {
    easy: '45 celle visibili — perfetto per iniziare. Le note sono attive!',
    medium: '35 celle visibili — una sfida equilibrata. Le note sono attive!',
    hard: '30 celle visibili. Niente note, niente pietà.',
    extreme: '25 celle visibili. Solo per i senza paura. Buona fortuna.',
  };

  private readonly revealMessages: Record<string, string[]> = {
    hard: [
      'Sicuro? I veri campioni non hanno bisogno di suggerimenti...',
      'Ancora?! Ci siamo quasi. Ma sei DAVVERO sicuro?',
      'Ok ok, eccolo. Non dire che non ti avevo avvertito.',
    ],
    extreme: [
      "Stai cercando un consiglio per l'estremo? Molto coraggioso...",
      'Potevi fermarti prima. Ma hai cliccato ancora. Rispetto.',
      'Ultima chance. Ormai è troppo tardi — eccolo.',
    ],
  };

  startGame(difficulty: Difficulty): void {
    this.router.navigate(['/game'], { queryParams: { difficulty } });
  }

  isRevealed(diff: string): boolean {
    return (this.revealClicks()[diff] ?? 0) >= 3;
  }

  revealNote(diff: string, event: Event): void {
    event.stopPropagation();
    const current = this.revealClicks()[diff] ?? 0;
    if (current >= 3) return;

    const next = current + 1;
    this.revealClicks.update(c => ({ ...c, [diff]: next }));

    const message = this.revealMessages[diff]?.[current];
    if (message) this.announcer.announce(message, 'polite');
  }

  revealButtonLabel(diff: string): string {
    const clicks = this.revealClicks()[diff] ?? 0;
    if (clicks === 0) return '👁 Mostra consiglio';
    if (clicks === 1) return '👁 Sei sicuro?';
    return '👁 Ultima chance';
  }
}
