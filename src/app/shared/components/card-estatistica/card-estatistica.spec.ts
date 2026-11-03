import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardEstatistica } from './card-estatistica';

describe('CardEstatistica', () => {
  let fixture: ComponentFixture<CardEstatistica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardEstatistica] }).compileComponents();
    fixture = TestBed.createComponent(CardEstatistica);
    fixture.componentRef.setInput('rotulo', 'Pontos');
    fixture.componentRef.setInput('valor', 12.5);
    await fixture.whenStable();
  });

  it('mostra o valor', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('12,5');
  });
});
