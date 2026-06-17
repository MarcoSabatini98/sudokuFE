import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Card, Meld, Rank, Suit } from '../../shared/models/card.model';
import { GameState } from '../../shared/models/machiavelli.model';
import { PlayingCardComponent } from '../../shared/components/playing-card/playing-card.component';
import {
  isValidMeld,
  isValidRun,
  orderMeldCards,
  splitRunWithCard,
  splitRunAtGaps,
  CommitResult,
  MachiavelliEngineService,
} from '../../core/services/machiavelli/machiavelli-engine.service';
import { MachiavelliAiService } from '../../core/services/machiavelli/machiavelli-ai.service';
import { MachiavelliApiService } from '../../core/services/machiavelli/machiavelli-api.service';
import {
  BotDifficulty,
  BOT_DIFFICULTIES,
  BOT_THINK_DELAY_MS,
  BOT_REVEAL_PAUSE_MS,
  HAND_SORT_SUIT_ORDER,
  RANK_LABEL,
  SUIT_SYMBOL,
} from '../../core/constants/machiavelli.constants';

export interface LogEntry {
  id: number;
  who: 'human' | 'bot' | 'system';
  text: string;
}

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
    RouterLink,
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
  private readonly route = inject(ActivatedRoute);

  readonly NEW_MELD_ID = NEW_MELD_ID;
  readonly HAND_ID = HAND_ID;
  /** Array tipizzato per la dropzone "nuova combinazione" (resta sempre vuoto). */
  readonly emptyZone: Card[] = [];
  /** Carta fittizia per disegnare il dorso del mazzo (mai rivelata). */
  readonly cardBack: Card = { id: 'deck-back', suit: null, rank: null, isJoker: false, deckId: 0 };

  readonly state = signal<GameState>(this.engine.newGame());
  readonly workingTable = signal<Meld[]>([]);
  readonly workingHand = signal<Card[]>([]);
  readonly thinking = signal(false);
  /** Miglior tempo personale (secondi), caricato a fine partita. Null se assente/BE offline. */
  readonly bestTimeSeconds = signal<number | null>(null);
  /** Prossimo criterio applicato dal pulsante "Ordina mano". */
  readonly handSortMode = signal<'suit' | 'rank'>('suit');
  /** Livello di difficoltà dei bot (dalla pagina di selezione, via queryParam). */
  readonly difficulty = signal<BotDifficulty>('hard');

  private startTime = Date.now();
  private resultSaved = false;
  /** Carte che l'umano aveva in mano a inizio turno: solo queste possono tornare in mano. */
  private startHandIds = new Set<string>();
  /** Ordine preferito della mano (id carte) impostato con "Ordina mano"; null = ordine di distribuzione. */
  private handOrder: string[] | null = null;

  /** Id della scala "presa" col doppio click, in attesa di essere unita a un'altra. */
  readonly carriedMeldId = signal<string | null>(null);
  /** Storico degli stati di lavoro del turno, per annullare l'ultima mossa. */
  private readonly moveHistory = signal<{ table: Meld[]; hand: Card[] }[]>([]);
  readonly canUndoMove = computed(() => this.moveHistory().length > 0);

  /** Registro mosse (più recenti in alto), per seguire le scelte dei bot. */
  readonly gameLog = signal<LogEntry[]>([]);
  private logSeq = 0;

  readonly opponents = computed(() => this.state().players.filter((p) => p.isAI));
  /** Carte di dorso da impilare per dare l'idea del mazzo (max 3). */
  readonly stockPreview = computed(() =>
    Array.from({ length: Math.min(this.state().stock.length, 3) }, (_, i) => i)
  );
  readonly isHumanTurn = computed(
    () => this.state().currentPlayer === 0 && this.state().phase === 'playing' && !this.thinking()
  );
  /** Si può pescare solo se non hai già calato carte in questo turno. */
  readonly canDraw = computed(
    () => this.isHumanTurn() && this.state().stock.length > 0 && !this.canUndoMove()
  );
  readonly isWon = computed(() => this.state().phase === 'won');

  constructor() {
    const param = this.route.snapshot.queryParamMap.get('difficulty');
    if (param && (BOT_DIFFICULTIES as string[]).includes(param)) {
      this.difficulty.set(param as BotDifficulty);
    }
    // All'apertura la partita è già pronta e tocca all'umano: board in attesa.
    this.initGame();
  }

  /**
   * Avvia/riavvia una partita: carte distribuite, log pulito e turno all'umano.
   * La partita "inizia" davvero quando l'umano conferma la prima mossa (i bot
   * giocano solo dopo).
   */
  private initGame(): void {
    const state = this.engine.newGame();
    state.currentPlayer = 0; // l'umano gioca per primo
    this.state.set(state);
    this.thinking.set(false);
    this.startTime = Date.now();
    this.resultSaved = false;
    this.bestTimeSeconds.set(null);
    this.handOrder = null;
    this.gameLog.set([]);
    this.pushLog('system', 'Nuova partita · tocca a te');
    this.startHumanTurn();
  }

  /** Aggiunge una riga al log (più recente in cima). */
  private pushLog(who: LogEntry['who'], text: string): void {
    this.gameLog.update((l) => [{ id: ++this.logSeq, who, text }, ...l]);
  }

  /** Etichetta breve di una carta per il log: es. "K♠", "7♥", "Jolly". */
  private cardLabel(c: Card): string {
    if (c.isJoker) return 'Jolly';
    return `${RANK_LABEL[c.rank as Rank]}${SUIT_SYMBOL[c.suit as Suit]}`;
  }

  /** Carte uscite dalla mano (calate) confrontando prima/dopo per id. */
  private placedCards(before: Card[], after: Card[]): Card[] {
    return before.filter((c) => !after.some((a) => a.id === c.id));
  }

  /** Riflette lo stato corrente (tavolo + mano umana) nelle aree visibili. */
  private syncWorkingView(): void {
    this.workingTable.set(this.state().table.map((m) => ({ id: m.id, cards: [...m.cards] })));
    this.workingHand.set(this.applyOrder(this.state().players[0].hand));
  }

  /** Copia tavolo e mano nelle aree di lavoro per il turno dell'umano. */
  private startHumanTurn(): void {
    this.workingTable.set(this.state().table.map((m) => ({ id: m.id, cards: [...m.cards] })));
    const hand = this.applyOrder(this.state().players[0].hand);
    this.workingHand.set(hand);
    this.startHandIds = new Set(hand.map((c) => c.id));
    this.carriedMeldId.set(null);
    this.moveHistory.set([]);
  }

  /**
   * Riordina le carte secondo l'ordine preferito dell'utente (handOrder).
   * Le carte non presenti (es. appena pescate) restano in coda nell'ordine dato.
   */
  private applyOrder(cards: Card[]): Card[] {
    const order = this.handOrder;
    if (!order) return [...cards];
    const rank = (id: string) => {
      const i = order.indexOf(id);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return [...cards].sort((a, b) => rank(a.id) - rank(b.id));
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

    this.tryAutoWin(); // ultima carta calata + tavolo valido = vittoria immediata
  }

  // -- Azioni turno ----------------------------------------------------------

  confirmTurn(): void {
    const res = this.engine.commitHumanTurn(this.state(), this.workingTable(), this.workingHand());
    if (!res.ok || !res.state) {
      this.snack.open(res.error ?? 'Mossa non valida.', 'OK', { duration: 3000 });
      return;
    }
    this.applyHumanCommit(res);
    if (res.state.phase === 'won') {
      this.finishGame();
      return;
    }
    void this.runAiTurns();
  }

  /** Applica al gioco un commit umano valido e ne logga le carte calate. */
  private applyHumanCommit(res: CommitResult): void {
    const placed = this.placedCards(this.state().players[0].hand, res.state!.players[0].hand);
    this.state.set(res.state!);
    this.pushLog('human', `Tu cali: ${placed.map((c) => this.cardLabel(c)).join(' ')}`);
  }

  /**
   * Se calando l'ultima carta la mano si svuota e il tavolo è valido, è una
   * vittoria immediata: chiude la partita senza dover premere "Conferma turno".
   */
  private tryAutoWin(): void {
    if (this.workingHand().length !== 0) return;
    const res = this.engine.commitHumanTurn(this.state(), this.workingTable(), this.workingHand());
    if (res.ok && res.state && res.state.phase === 'won') {
      this.applyHumanCommit(res);
      this.finishGame();
    }
  }

  draw(): void {
    // Con carte già calate non si può pescare: prima si annulla il turno.
    if (this.canUndoMove()) {
      this.snack.open('Hai carte in gioco: annulla il turno prima di pescare.', 'OK', {
        duration: 3000,
      });
      return;
    }
    // L'ordine preferito (handOrder) viene riapplicato da startHumanTurn: la
    // carta pescata finisce in coda, il resto resta ordinato.
    const next = this.engine.drawFromStock(this.state(), 0);
    this.state.set(next);
    this.pushLog('human', 'Tu peschi');
    void this.runAiTurns();
  }

  undoTurn(): void {
    this.startHumanTurn();
  }

  /** Ordina la mano: 1° click per seme+rango, 2° click solo per rango, poi alterna. */
  /** Riflettore che segue il cursore sul feltro: scrive le CSS var direttamente
   *  sull'elemento, senza signal/CD ad ogni mousemove. */
  onFeltMove(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
  }

  sortHand(): void {
    const mode = this.handSortMode();
    const cards = [...this.workingHand()];
    cards.sort(mode === 'suit' ? this.bySuitThenRank : this.byRank);
    this.workingHand.set(cards);
    this.handOrder = cards.map((c) => c.id); // ricordato per pesca / annulla turno / giri successivi
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

  newGame(): void {
    this.initGame();
  }

  /**
   * Fa giocare i bot uno alla volta: ognuno "pensa", cala o pesca, e solo dopo
   * tocca al successivo. La mossa di ciascun bot compare subito sul tavolo,
   * con una breve pausa per poterla leggere prima del bot dopo.
   */
  private async runAiTurns(): Promise<void> {
    this.thinking.set(true);
    while (this.state().currentPlayer !== 0 && this.state().phase === 'playing') {
      const idx = this.state().currentPlayer;
      const handBefore = this.state().players[idx].hand;
      const stockBefore = this.state().stock.length;
      await this.delay(BOT_THINK_DELAY_MS[this.difficulty()]);
      this.state.set(this.ai.takeTurn(this.state(), idx, this.difficulty()));
      this.syncWorkingView(); // mostra subito la giocata del bot
      this.logBotMove(idx, handBefore, stockBefore);
      await this.delay(BOT_REVEAL_PAUSE_MS); // pausa per leggerla
    }
    this.thinking.set(false);
    if (this.state().phase === 'playing') this.startHumanTurn();
    else this.finishGame();
  }

  /** Scrive nel log cosa ha fatto il bot: carte calate, pescata o passo. */
  private logBotMove(idx: number, handBefore: Card[], stockBefore: number): void {
    const player = this.state().players[idx];
    const placed = this.placedCards(handBefore, player.hand);
    if (placed.length > 0) {
      this.pushLog('bot', `${player.name} cala: ${placed.map((c) => this.cardLabel(c)).join(' ')}`);
    } else if (this.state().stock.length < stockBefore) {
      this.pushLog('bot', `${player.name} pesca`);
    } else {
      this.pushLog('bot', `${player.name} passa`);
    }
  }

  /** Salva l'esito a fine partita (best-effort: se il BE è offline non blocca il gioco). */
  private finishGame(): void {
    if (this.resultSaved) return;
    this.resultSaved = true;

    const w = this.state().winner;
    if (w !== null) {
      this.pushLog('system', `🏆 ${this.state().players[w].name} ha vinto`);
      const msg = w === 0 ? 'Hai vinto! 🎉' : `${this.state().players[w].name} ha vinto`;
      this.snack.open(msg, 'OK', { duration: 5000 });
    }

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
