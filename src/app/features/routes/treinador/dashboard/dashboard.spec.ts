import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TreinadorDashboard } from './dashboard';

describe('TreinadorDashboard', () => {
  let fixture: ComponentFixture<TreinadorDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinadorDashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(TreinadorDashboard);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
