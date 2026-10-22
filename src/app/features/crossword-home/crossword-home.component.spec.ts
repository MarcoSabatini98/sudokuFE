import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { CrosswordHomeComponent } from './crossword-home.component';
import { CROSSWORD_DIFFICULTY_LABELS } from '../../shared/models/crossword.model';

describe('CrosswordHomeComponent', () => {
  it('should render the three difficulty cards', async () => {
    await render(CrosswordHomeComponent, {
      providers: [provideRouter([]), provideAnimationsAsync()],
    });

    expect(screen.getByText(CROSSWORD_DIFFICULTY_LABELS['easy'])).toBeTruthy();
    expect(screen.getByText(CROSSWORD_DIFFICULTY_LABELS['medium'])).toBeTruthy();
    expect(screen.getByText(CROSSWORD_DIFFICULTY_LABELS['hard'])).toBeTruthy();
  });

  it('should navigate to the game with the chosen difficulty', async () => {
    const navigateSpy = vi.fn();
    const { fixture } = await render(CrosswordHomeComponent, {
      providers: [provideRouter([]), provideAnimationsAsync()],
    });

    const router = fixture.debugElement.injector.get(Router);
    vi.spyOn(router, 'navigate').mockImplementation(navigateSpy);

    await userEvent.click(screen.getByText(CROSSWORD_DIFFICULTY_LABELS['hard']));
    expect(navigateSpy).toHaveBeenCalledWith(['/crossword/game'], {
      queryParams: { difficulty: 'hard' },
    });
  });
});
