import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConvocacaoDialog } from './convocacao-dialog';

describe('ConvocacaoDialog', () => {
  let fixture: ComponentFixture<ConvocacaoDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConvocacaoDialog],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ConvocacaoDialog);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
