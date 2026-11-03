import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';

import { API_URL } from '../../../../core/services/auth';
import { TreinadorDesempenho } from './desempenho';

describe('TreinadorDesempenho', () => {
  let fixture: ComponentFixture<TreinadorDesempenho>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinadorDesempenho],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService, ConfirmationService],
    }).compileComponents();
    fixture = TestBed.createComponent(TreinadorDesempenho);
    await fixture.whenStable();
  });

  it('busca os jogos realizados ao abrir', () => {
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne((r) => r.url === `${API_URL}/eventos` && r.params.get('tipo') === 'JOGO');
    expect(req.request.method).toBe('GET');
  });
});
