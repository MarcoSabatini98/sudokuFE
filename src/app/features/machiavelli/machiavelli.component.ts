import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Card, Meld, Suit } from '../../shared/models/card.model';
import { GameState } from '../../shared/models/machiavelli.model';
import { PlayingCardComponent } from '../../shared/components/playing-card/playing-card.component';
import {
  isValidMeld,
  isValidRun,
  orderMeldCards,
  splitRunWithCard,
  splitRunAtGaps,
  MachiavelliEngineService,
} from '../../core/services/machiavelli/machiavelli-engine.service';
import { MachiavelliAiService } from '../../core/services/machiavelli/machiavelli-ai.service';
import { MachiavelliApiService } from '../../core/services/machiavelli/machiavelli-api.service';
import {
  BotDifficulty,
  BOT_DIFFICULTIES,
  BOT_DIFFICULTY_LABELS,
  BOT_THINK_DELAY_MS,
  HAND_SORT_SUIT_ORDER,
} from '../../core/constants/machiavelli.constants';

const NEW_MELD_ID = 'new-meld';
const HAND_ID = 'hand';

let meldSeed = 0;
function newMeldId(): string {
  meldSeed += 1;
  return `um-${Date.now().toString(36)}-${meldSeed}`;
}

@Component({
  selector: 'app-machiavelli',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    MatButtonModule,
    MatSnackBarModule,
    PlayingCardComponent,
  ],
  templateUrl: './machiavelli.component.html',
  styleUrl: './machiavelli.component.css',
})
export class MachiavelliComponent {
  private readonly engine = inject(MachiavelliEngineService);
  private readonly ai = inject(MachiavelliAiService);
  private readonly api = inject(MachiavelliApiService);
  private readonly snack = inject(MatSnackBar);

  readonly NEW_MELD_ID = NEW_MELD_ID;
  readonly HAND_ID = HAND_ID;
  /** Array tipizzato per la dropzone "nuova combinazione" (resta sempre vuoto). */
  readonly emptyZone: Card[] = [];

  readonly state = signal<GameState>(this.engine.newGame());
  readonly workingTable = signal<Meld[]>([]);
  readonly workingHand = signal<Card[]>([]);
  readonly thinking = signal(false);
  /** Miglior tempo personale (secondi), caricato a fine partita. Null se assente/BE offline. */
  readonly bestTimeSeconds = signal<number | null>(null);
  /** Prossimo criterio applicato dal pulsante "Ordina mano". */
  readonly handSortMode = signal<'suit' | 'rank'>('suit');
  /** Livello di difficoltà dei bot. */
  readonly difficulty = signal<BotDifficulty>('hard');
  readonly difficulties = BOT_DIFFICULTIES;
  readonly difficultyLabels = BOT_DIFFICULTY_LABELS;

  private startTime = Date.now();
  private resultSaved = false;
  /** Carte che l'umano aveva in mano a inizio turno: solo queste possono tornare in mano. */
  private startHandIds = new Set<string>();

  /** Id della scala "presa" col doppio click, in attesa di essere unita a un'altra. */
  readonly carriedMeldId = signal<string | null>(null);
  /** Storico degli stati di lavoro del turno, per annullare l'ultima mossa. */
  private readonly moveHistory = signal<{ table: Meld[]; hand: Card[] }[]>([]);
  readonly canUndoMove = computed(() => this.moveHistory().length > 0);

  readonly opponents = computed(() => this.state().players.filter((p) => p.isAI));
  readonly isHumanTurn = computed(
    () => this.state().currentPlayer === 0 && this.state().phase === 'playing' && !this.thinking()
  );
  readonly isWon = computed(() => this.state().phase === 'won');
  readonly winnerName = computed(() => {
    const w = this.state().winner;
    return w !== null ? this.state().players[w].name : '';
  });

  constructor() {
    this.startHumanTurn();
  }

  /** Copia tavolo e mano nelle aree di lavoro per il turno dell'umano. */
  private startHumanTurn(): void {
    this.workingTable.set(this.state().table.map((m) => ({ id: m.id, cards: [...m.cards] })));
    const hand = [...this.state().players[0].hand];
    this.workingHand.set(hand);
    this.startHandIds = new Set(hand.map((c) => c.id));
    this.carriedMeldId.set(null);
    this.moveHistory.set([]);
  }

  /** Salva lo stato corrente prima di una mossa, così da poterla annullare. */
  private pushHistory(): void {
    this.moveHistory.update((h) => [...h, { table: this.workingTable(), hand: this.workingHand() }]);
  }

  /** Annulla l'ultima mossa (non l'intero turno). */
  undoMove(): void {
    const history = this.moveHistory();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    this.moveHistory.set(history.slice(0, -1));
    this.workingTable.set(prev.table);
    this.workingHand.set(prev.hand);
    this.carriedMeldId.set(null);
  }

  isMeldValid(meld: Meld): boolean {
    return isValidMeld(meld.cards);
  }

  isRunMeld(meld: Meld): boolean {
    return isValidRun(meld.cards);
  }

  // -- Unione scale: doppio click per "prendere", click per attaccare --

  /** Doppio click su una scala: la seleziona per l'unione (o annulla se già presa). */
  onMeldDblClick(meld: Meld): void {
    if (!this.isHumanTurn() || !this.isRunMeld(meld)) return;
    if (this.carriedMeldId() === meld.id) {
      this.carriedMeldId.set(null);
      return;
    }
    this.carriedMeldId.set(meld.id);
    this.snack.open('Scala selezionata: clicca una scala dello stesso seme per unirle.', 'OK', {
      duration: 3000,
    });
  }

  /** Click su una scala: se c'è una scala "presa", prova a unirle. */
  onMeldClick(meld: Meld): void {
    const carried = this.carriedMeldId();
    if (!carried || meld.id === carried) return;
    this.mergeRuns(carried, meld.id);
    this.carriedMeldId.set(null);
  }

  private mergeRuns(carriedId: string, targetId: string): void {
    const table = this.workingTable();
    const carried = table.find((m) => m.id === carriedId);
    const target = table.find((m) => m.id === targetId);
    if (!carried || !target) return;

    if (!this.isRunMeld(carried) || !this.isRunMeld(target)) {
      this.snack.open('Puoi unire solo due scale.', 'OK', { duration: 2500 });
      return;
    }
    const cSuit = carried.cards.find((c) => !c.isJoker)?.suit;
    const tSuit = target.cards.find((c) => !c.isJoker)?.suit;
    if (cSuit !== tSuit) {
      this.snack.open('Le due scale devono essere dello stesso seme.', 'OK', { duration: 2800 });
      return;
    }

    const merged = orderMeldCards([...target.cards, ...carried.cards]);
    if (!isValidRun(merged)) {
      this.snack.open('Le due scale non combaciano.', 'OK', { duration: 2800 });
      return;
    }

    this.pushHistory();
    this.workingTable.set(
      table
        .filter((m) => m.id !== carriedId)
        .map((m) => (m.id === targetId ? { id: m.id, cards: merged } : m))
    );
  }

  // -- Drag & drop -----------------------------------------------------------

  drop(event: CdkDragDrop<Card[]>): void {
    const fromId = event.previousContainer.id;
    const toId = event.container.id;
    const dragged = event.item.data as Card | undefined;
    if (!dragged) return;

    // In mano possono tornare solo le carte calate in questo turno (non quelle dei turni passati)
    if (toId === HAND_ID && fromId !== HAND_ID && !this.startHandIds.has(dragged.id)) {
      this.snack.open('Puoi rimettere in mano solo le carte calate in questo turno.', 'OK', {
        duration: 2800,
      });
      return;
    }

    const hand = [...this.workingHand()];
    const table = this.workingTable().map((m) => ({ id: m.id, cards: [...m.cards] }));

    // Rimuovi la carta dalla sorgente per identità (mai per indice: il CDK non è affidabile)
    if (fromId === HAND_ID) {
      const i = hand.findIndex((c) => c.id === dragged.id);
      if (i === -1) return;
      hand.splice(i, 1);
    } else {
      const src = table.find((m) => m.id === fromId);
      const i = src ? src.cards.findIndex((c) => c.id === dragged.id) : -1;
      if (!src || i === -1) return;
      src.cards.splice(i, 1);
    }

    // Inserisci nel target
    if (toId === HAND_ID) {
      hand.push(dragged);
    } else if (toId === NEW_MELD_ID) {
      table.push({ id: newMeldId(), cards: [dragged] });
    } else {
      const meld = table.find((m) => m.id === toId);
      if (meld) {
        const split = splitRunWithCard(meld.cards, dragged);
        if (split) {
          const idx = table.indexOf(meld);
          table.splice(idx, 1, { id: meld.id, cards: split[0] }, { id: newMeldId(), cards: split[1] });
        } else {
          meld.cards.push(dragged); // la posizione la sistema orderMeldCards
        }
      } else {
        hand.push(dragged); // fallback di sicurezza
      }
    }

    // Rimuovendo una carta dal centro di una scala, separa i segmenti contigui
    if (fromId !== HAND_ID && fromId !== NEW_MELD_ID && fromId !== toId) {
      const srcIdx = table.findIndex((m) => m.id === fromId);
      if (srcIdx !== -1) {
        const segs = splitRunAtGaps(table[srcIdx].cards);
        if (segs.length > 1) {
          const replacement = segs.map((cards, i) => ({
            id: i === 0 ? fromId : newMeldId(),
            cards,
          }));
          table.splice(srcIdx, 1, ...replacement);
        }
      }
    }

    this.pushHistory();
    this.workingHand.set(hand);
    this.workingTable.set(
      table.filter((m) => m.cards.length > 0).map((m) => ({ id: m.id, cards: orderMeldCards(m.cards) }))
    );
  }

  // -- Azioni turno ----------------------------------------------------------

  confirmTurn(): void {
    const res = this.engine.commitHumanTurn(this.state(), this.workingTable(), this.workingHand());
    if (!res.ok || !res.state) {
      this.snack.open(res.error ?? 'Mossa non valida.', 'OK', { duration: 3000 });
      return;
    }
    this.state.set(res.state);
    if (res.state.phase === 'won') {
      this.finishGame();
      return;
    }
    void this.runAiTurns();
  }

  draw(): void {
    const next = this.engine.drawFromStock(this.state(), 0);
    this.state.set(next);
    void this.runAiTurns();
  }

  undoTurn(): void {
    this.startHumanTurn();
  }

  /** Ordina la mano: 1° click per seme+rango, 2° click solo per rango, poi alterna. */
  sortHand(): void {
    const mode = this.handSortMode();
    const cards = [...this.workingHand()];
    cards.sort(mode === 'suit' ? this.bySuitThenRank : this.byRank);
    this.workingHand.set(cards);
    this.handSortMode.set(mode === 'suit' ? 'rank' : 'suit');
  }

  private readonly bySuitThenRank = (a: Card, b: Card): number => {
    if (a.isJoker || b.isJoker) return Number(a.isJoker) - Number(b.isJoker); // jolly in coda
    const sa = HAND_SORT_SUIT_ORDER.indexOf(a.suit as Suit);
    const sb = HAND_SORT_SUIT_ORDER.indexOf(b.suit as Suit);
    return sa !== sb ? sa - sb : (a.rank as number) - (b.rank as number);
  };

  private readonly byRank = (a: Card, b: Card): number => {
    if (a.isJoker || b.isJoker) return Number(a.isJoker) - Number(b.isJoker); // jolly in coda
    return (a.rank as number) - (b.rank as number);
  };

  setDifficulty(level: BotDifficulty): void {
    if (level === this.difficulty()) return;
    this.difficulty.set(level);
    this.newGame();
  }

  newGame(): void {
    this.state.set(this.engine.newGame());
    this.thinking.set(false);
    this.startTime = Date.now();
    this.resultSaved = false;
    this.bestTimeSeconds.set(null);
    this.startHumanTurn();
  }

  /** Fa giocare in sequenza i bot fino a tornare all'umano o a fine partita. */
  private async runAiTurns(): Promise<void> {
    this.thinking.set(true);
    while (this.state().currentPlayer !== 0 && this.state().phase === 'playing') {
      await this.delay(BOT_THINK_DELAY_MS[this.difficulty()]);
      const idx = this.state().currentPlayer;
      this.state.set(this.ai.takeTurn(this.state(), idx, this.difficulty()));
    }
    this.thinking.set(false);
    if (this.state().phase === 'playing') this.startHumanTurn();
    else this.finishGame();
  }

  /** Salva l'esito a fine partita (best-effort: se il BE è offline non blocca il gioco). */
  private finishGame(): void {
    if (this.resultSaved) return;
    this.resultSaved = true;

    const duration = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
    const won = this.state().winner === 0;

    this.api.saveGame({ won, duration_seconds: duration }).subscribe({
      next: () => this.loadRecord(),
      error: () => undefined,
    });
  }

  private loadRecord(): void {
    this.api.getRecord().subscribe({
      next: (r) => this.bestTimeSeconds.set(r.best_time_seconds),
      error: () => undefined,
    });
  }

  formatTime(seconds: number): string {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
