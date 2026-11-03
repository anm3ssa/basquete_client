import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Jogo } from '../../../../../../shared/models';
import { PlacarJogo } from './placar-jogo';

describe('PlacarJogo', () => {
  let fixture: ComponentFixture<PlacarJogo>;
  const jogo: Jogo = {
    id: 'e9',
    tipo: 'JOGO',
    inicio: '2026-10-31T15:00:00',
    fim: '2026-10-31T17:00:00',
    local: 'Ginásio Municipal de Assis',
    adversario: 'Presidente Prudente',
    mandante: false,
  } as Jogo;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PlacarJogo] }).compileComponents();
    fixture = TestBed.createComponent(PlacarJogo);
    fixture.componentRef.setInput('jogo', jogo);
    fixture.componentRef.setInput('pontosTime', 42);
    fixture.componentRef.setInput('pontosAdversario', 38);
    await fixture.whenStable();
  });

  it('mostra o adversário sem "@" nem "vs" e o mando à parte', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Presidente Prudente');
    expect(texto).toContain('Fora');
    expect(texto).not.toContain('@');
    expect(texto).not.toContain('vs ');
  });

  it('avisa quando o treinador soma pontos do adversário', () => {
    const emitidos: number[] = [];
    fixture.componentInstance.alterarAdversario.subscribe((v) => emitidos.push(v));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.btn-adv')!.click();
    expect(emitidos).toEqual([1]);
  });
});
