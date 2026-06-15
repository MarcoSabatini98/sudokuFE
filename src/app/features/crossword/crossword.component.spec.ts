import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { CrosswordComponent } from './crossword.component';

describe('CrosswordComponent', () => {
  it('mostra il titolo e lo stato "in creazione"', async () => {
    await render(CrosswordComponent, {
      providers: [provideRouter([]), provideAnimationsAsync()],
    });

    expect(screen.getByText('Cruciverba')).toBeTruthy();
    expect(screen.getByText('In creazione')).toBeTruthy();
    expect(screen.getByText('Torna ai giochi')).toBeTruthy();
  });
});
