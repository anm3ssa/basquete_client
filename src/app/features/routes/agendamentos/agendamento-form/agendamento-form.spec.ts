import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendamentoForm } from './agendamento-form';

describe('AgendamentoForm', () => {
  let component: AgendamentoForm;
  let fixture: ComponentFixture<AgendamentoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendamentoForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AgendamentoForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
