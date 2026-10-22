import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';

import { HistoryAndRecordsComponent } from './history-and-records.component';

describe('HistoryAndRecordsComponent', () => {
  it('renders a card linking to each game stats page', async () => {
    await render(HistoryAndRecordsComponent, { providers: [provideRouter([])] });

    expect(screen.getByText('Record e cronologia')).toBeTruthy();

    const links = screen.getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/sudoku/stats');
    expect(hrefs).toContain('/machiavelli/stats');
    expect(hrefs).toContain('/crossword/stats');
  });
});
