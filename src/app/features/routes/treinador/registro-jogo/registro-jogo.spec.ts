import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

import { API_URL } from '../../../../core/services/auth';
import { boxScoreDoRegistro, pontosDosLances } from '../../../../shared/registro';
import { Lance } from '../../../../shared/models';
import { RegistroJogo } from './registro-jogo';

describe('RegistroJogo', () => {
  let fixture: ComponentFixture<RegistroJogo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroJogo],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), MessageService, ConfirmationService],
    }).compileComponents();
    fixture = TestBed.createComponent(RegistroJogo);
    fixture.componentRef.setInput('id', 'e9');
    await fixture.whenStable();
  });

  it('busca o jogo, o registro e o box score ao abrir', () => {
    const http = TestBed.inject(HttpTestingController);
    expect(http.expectOne(`${API_URL}/eventos/e9`).request.method).toBe('GET');
    expect(http.expectOne(`${API_URL}/jogos/e9/registro`).request.method).toBe('GET');
    expect(http.expectOne(`${API_URL}/jogos/e9/estatisticas`).request.method).toBe('GET');
  });
});

describe('boxScoreDoRegistro', () => {
  const lance = (atletaId: string, tipo: Lance['tipo']): Lance => ({ id: crypto.randomUUID(), atletaId, tipo, periodo: 1, registradoEm: '' });

  it('soma os lances de cada atleta no formato do box score', () => {
    const lances = [
      lance('a7', 'TRES_CONVERTIDO'),
      lance('a7', 'TRES_ERRADO'),
      lance('a7', 'DOIS_CONVERTIDO'),
      lance('a7', 'LL_ERRADO'),
      lance('a7', 'REBOTE'),
      lance('a10', 'ASSISTENCIA'),
    ];
    const [lucas, outro] = boxScoreDoRegistro(
      'e9',
      [
        { atletaId: 'a7', atletaNome: 'Lucas', numero: 7 },
        { atletaId: 'a10', atletaNome: 'Rafa', numero: 10 },
      ],
      lances,
      { a7: 28 },
    );
    expect(lucas).toEqual(
      expect.objectContaining({
        minutos: 28,
        tresPontosConvertidos: 1,
        tresPontosTentados: 2,
        doisPontosConvertidos: 1,
        doisPontosTentados: 1,
        lanceLivreConvertidos: 0,
        lanceLivreTentados: 1,
        rebotes: 1,
      }),
    );
    expect(outro.assistencias).toBe(1);
    expect(outro.minutos).toBe(0);
    expect(pontosDosLances(lances)).toBe(5);
  });
});
