import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Type } from '@angular/core';

export function setupHttpServiceTest<T>(serviceClass: Type<T>) {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  return {
    service: () => TestBed.inject(serviceClass),
    mock: () => TestBed.inject(HttpTestingController),
  };
}
