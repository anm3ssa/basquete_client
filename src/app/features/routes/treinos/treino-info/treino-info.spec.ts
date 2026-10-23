import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreinoInfo } from './treino-info';

describe('TreinoInfo', () => {
  let component: TreinoInfo;
  let fixture: ComponentFixture<TreinoInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinoInfo],
    }).compileComponents();

    fixture = TestBed.createComponent(TreinoInfo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
