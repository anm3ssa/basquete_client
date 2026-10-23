import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreinoAtletas } from './treino-atletas';

describe('TreinoAtletas', () => {
  let component: TreinoAtletas;
  let fixture: ComponentFixture<TreinoAtletas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinoAtletas],
    }).compileComponents();

    fixture = TestBed.createComponent(TreinoAtletas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
