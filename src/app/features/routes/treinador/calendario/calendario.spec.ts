import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';

import { TreinadorCalendario } from './calendario';

describe('TreinadorCalendario', () => {
  let fixture: ComponentFixture<TreinadorCalendario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinadorCalendario],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService, ConfirmationService],
    }).compileComponents();
    fixture = TestBed.createComponent(TreinadorCalendario);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
