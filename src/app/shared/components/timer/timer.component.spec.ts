import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { TimerComponent } from './timer.component';

@Component({
  standalone: true,
  imports: [TimerComponent],
  template: `<app-timer [running]="running" />`,
})
class HostComponent {
  running = false;
}

describe('TimerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  const getTimer = (): TimerComponent =>
    fixture.debugElement.query(By.directive(TimerComponent)).componentInstance as TimerComponent;

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show 00:00 initially', () => {
    const el = fixture.nativeElement.querySelector('.timer');
    expect(el.textContent).toBe('00:00');
  });

  it('should format seconds correctly', () => {
    const timer = getTimer();
    timer.seconds.set(65);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.timer');
    expect(el.textContent).toBe('01:05');
  });

  it('should reset seconds to 0', () => {
    const timer = getTimer();
    timer.seconds.set(120);
    timer.reset();
    expect(timer.seconds()).toBe(0);
  });
});
