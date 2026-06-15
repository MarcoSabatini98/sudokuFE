import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { HomeComponent } from './home.component';

describe('HomeComponent (hub)', () => {
  it('should render the two game cards', async () => {
    await render(HomeComponent, {
      providers: [provideRouter([]), provideAnimationsAsync()],
    });

    expect(screen.getByText('Sudoku')).toBeTruthy();
    expect(screen.getByText('Macchiavelli')).toBeTruthy();
    expect(screen.getByText('In creazione')).toBeTruthy();
  });

  it('should navigate to /sudoku on Sudoku card click', async () => {
    const navigateSpy = vi.fn();
    const { fixture } = await render(HomeComponent, {
      providers: [provideRouter([]), provideAnimationsAsync()],
    });

    const router = fixture.debugElement.injector.get(Router);
    vi.spyOn(router, 'navigate').mockImplementation(navigateSpy);

    await userEvent.click(screen.getByText('Sudoku'));
    expect(navigateSpy).toHaveBeenCalledWith(['/sudoku']);
  });

  it('should navigate to /machiavelli on Macchiavelli card click', async () => {
    const navigateSpy = vi.fn();
    const { fixture } = await render(HomeComponent, {
      providers: [provideRouter([]), provideAnimationsAsync()],
    });

    const router = fixture.debugElement.injector.get(Router);
    vi.spyOn(router, 'navigate').mockImplementation(navigateSpy);

    await userEvent.click(screen.getByText('Macchiavelli'));
    expect(navigateSpy).toHaveBeenCalledWith(['/machiavelli']);
  });
});
