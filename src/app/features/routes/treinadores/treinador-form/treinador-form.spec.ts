import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreinadorForm } from './treinador-form';

describe('TreinadorForm', () => {
  let component: TreinadorForm;
  let fixture: ComponentFixture<TreinadorForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinadorForm],
    }).compileComponents();

    fixture = TestBed.createComponent(TreinadorForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
