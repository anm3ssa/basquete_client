import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventoForm } from './evento-form';

describe('EventoForm', () => {
  let fixture: ComponentFixture<EventoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventoForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(EventoForm);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
