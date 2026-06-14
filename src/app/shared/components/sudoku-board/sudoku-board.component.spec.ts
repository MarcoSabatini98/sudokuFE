import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
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
  template: `<app-sudoku-board [puzzle]="puzzle" [solution]="solution" />`,
})
class HostComponent {
  puzzle = MOCK_PUZZLE;
  solution = MOCK_SOLUTION;
}

describe('SudokuBoardComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
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
});
