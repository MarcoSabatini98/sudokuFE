import { render, screen, RenderResult } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { HomeComponent } from './home.component';

async function renderHome(): Promise<RenderResult<HomeComponent>> {
  return render(HomeComponent, {
    providers: [provideRouter([]), provideAnimationsAsync()],
  });
}

/** Renderizza la home, clicca la card indicata e ritorna lo spy di navigate. */
async function clickCard(label: string): Promise<ReturnType<typeof vi.fn>> {
  const navigateSpy = vi.fn();
  const { fixture } = await renderHome();
  const router = fixture.debugElement.injector.get(Router);
  vi.spyOn(router, 'navigate').mockImplementation(navigateSpy);
  await userEvent.click(screen.getByText(label));
  return navigateSpy;
}

describe('HomeComponent (hub)', () => {
  it('should render the three game cards', async () => {
    await renderHome();
    expect(screen.getByText('Sudoku')).toBeTruthy();
    expect(screen.getByText('Macchiavelli')).toBeTruthy();
    expect(screen.getByText('Cruciverba')).toBeTruthy();
    expect(screen.getByText('In creazione')).toBeTruthy(); // badge sul Cruciverba
  });

  it('should navigate to /sudoku on Sudoku card click', async () => {
    expect(await clickCard('Sudoku')).toHaveBeenCalledWith(['/sudoku']);
  });

  it('should navigate to /machiavelli on Macchiavelli card click', async () => {
    expect(await clickCard('Macchiavelli')).toHaveBeenCalledWith(['/machiavelli']);
  });

  it('should navigate to /crossword on Cruciverba card click', async () => {
    expect(await clickCard('Cruciverba')).toHaveBeenCalledWith(['/crossword']);
  });
});
