import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreinadorList } from './treinador-list';

describe('TreinadorList', () => {
  let component: TreinadorList;
  let fixture: ComponentFixture<TreinadorList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinadorList],
    }).compileComponents();

    fixture = TestBed.createComponent(TreinadorList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
