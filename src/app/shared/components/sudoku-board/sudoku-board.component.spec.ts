import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { SudokuBoardComponent } from './sudoku-board.component';

const MOCK_PUZZLE = Array.from({ length: 9 }, (_, r) =>
  Array.from({ length: 9 }, (_, c) => (r === 0 && c === 0 ? 5 : 0))
);
const MOCK_SOLUTION = Array.from({ length: 9 }, (_, r) =>
  Array.from({ length: 9 }, (_, c) => ((r + c) % 9) + 1)
);

@Component({
  standalone: true,
  imports: [SudokuBoardComponent],
  template: `<app-sudoku-board [puzzle]="puzzle" [solution]="solution" (errorOccurred)="onError()" />`,
})
class HostComponent {
  puzzle = MOCK_PUZZLE;
  solution = MOCK_SOLUTION;
  errorCount = 0;
  onError() { this.errorCount++; }
}

describe('SudokuBoardComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let board: SudokuBoardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    board = fixture.debugElement.query(By.directive(SudokuBoardComponent)).componentInstance;
  });

  it('should render 81 cells', () => {
    const cells = fixture.nativeElement.querySelectorAll('.cell');
    expect(cells.length).toBe(81);
  });

  it('first cell should be given', () => {
    const given = fixture.nativeElement.querySelector('.cell.given');
    expect(given).toBeTruthy();
  });

  it('empty cells should not have given class', () => {
    const cells = fixture.nativeElement.querySelectorAll('.cell:not(.given)');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('given cell should have tabindex -1', () => {
    const givenCell = fixture.nativeElement.querySelector('.cell.given');
    expect(givenCell.getAttribute('tabindex')).toBe('-1');
  });

  it('empty cell should have tabindex 0', () => {
    const emptyCell = fixture.nativeElement.querySelector('.cell:not(.given)');
    expect(emptyCell.getAttribute('tabindex')).toBe('0');
  });

  it('keydown on given cell does not overwrite its value', () => {
    const givenCell: HTMLElement = fixture.nativeElement.querySelector('.cell.given');
    givenCell.dispatchEvent(new KeyboardEvent('keydown', { key: '7', bubbles: true }));
    fixture.detectChanges();
    expect(board.userGrid()[0][0]).toBe(5);
  });

  it('stamp mode click on given cell does not overwrite its value', () => {
    board.onDigitSelect(7);
    board.onCellClick(0, 0);
    fixture.detectChanges();
    expect(board.userGrid()[0][0]).toBe(5);
  });

  it('writeCell on given cell is a no-op', () => {
    const cells: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.cell:not(.given)');
    cells[0].dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true }));
    fixture.detectChanges();
    expect(board.userGrid()[0][0]).toBe(5);
  });

  it('emits errorOccurred when a wrong value is placed in an empty cell', () => {
    // solution[0][1] = (0+1)%9+1 = 2, so placing 3 is wrong
    board.onCellKeydown(0, 1, new KeyboardEvent('keydown', { key: '3' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.errorCount).toBe(1);
  });

  it('does not emit errorOccurred when a correct value is placed', () => {
    // solution[0][1] = 2, placing 2 is correct
    board.onCellKeydown(0, 1, new KeyboardEvent('keydown', { key: '2' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.errorCount).toBe(0);
  });

  it('does not re-emit errorOccurred when replacing one wrong value with another', () => {
    // Place wrong value first (3 instead of 2)
    board.onCellKeydown(0, 1, new KeyboardEvent('keydown', { key: '3' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.errorCount).toBe(1);

    // Replace wrong value with another wrong value (4 instead of 2) — no new error
    board.onCellKeydown(0, 1, new KeyboardEvent('keydown', { key: '4' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.errorCount).toBe(1);
  });
});
