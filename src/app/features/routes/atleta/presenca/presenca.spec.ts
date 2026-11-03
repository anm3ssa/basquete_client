import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Presenca } from './presenca';

describe('Presenca', () => {
  let fixture: ComponentFixture<Presenca>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Presenca],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Presenca);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
