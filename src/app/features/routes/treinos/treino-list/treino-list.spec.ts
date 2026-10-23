import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreinoList } from './treino-list';

describe('TreinoList', () => {
  let component: TreinoList;
  let fixture: ComponentFixture<TreinoList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinoList],
    }).compileComponents();

    fixture = TestBed.createComponent(TreinoList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
