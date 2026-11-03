import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Jogo } from '../../../shared/models';
import { EventoItem } from './evento-item';

describe('EventoItem', () => {
  let fixture: ComponentFixture<EventoItem>;

  const jogo: Jogo = {
    id: '1',
    tipo: 'JOGO',
    inicio: '2026-11-07T15:00:00-03:00',
    fim: '2026-11-07T17:00:00-03:00',
    local: 'Ginásio Municipal',
    adversario: 'Tigres',
    mandante: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EventoItem] }).compileComponents();
    fixture = TestBed.createComponent(EventoItem);
    fixture.componentRef.setInput('evento', jogo);
    await fixture.whenStable();
  });

  it('mostra o adversário no título do jogo', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('vs Tigres');
  });
});
