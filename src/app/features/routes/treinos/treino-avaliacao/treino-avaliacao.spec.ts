import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreinoAvaliacao } from './treino-avaliacao';

describe('TreinoAvaliacao', () => {
  let component: TreinoAvaliacao;
  let fixture: ComponentFixture<TreinoAvaliacao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinoAvaliacao],
    }).compileComponents();

    fixture = TestBed.createComponent(TreinoAvaliacao);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
