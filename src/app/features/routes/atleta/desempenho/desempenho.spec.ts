import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AtletaDesempenho } from './desempenho';

describe('AtletaDesempenho', () => {
  let fixture: ComponentFixture<AtletaDesempenho>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtletaDesempenho],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), MessageService],
    }).compileComponents();
    fixture = TestBed.createComponent(AtletaDesempenho);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
