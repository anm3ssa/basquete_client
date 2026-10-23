import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtletaForm } from './atleta-form';

describe('AtletaForm', () => {
  let component: AtletaForm;
  let fixture: ComponentFixture<AtletaForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtletaForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AtletaForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
