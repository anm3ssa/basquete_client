import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendamentoList } from './agendamento-list';

describe('AgendamentoList', () => {
  let component: AgendamentoList;
  let fixture: ComponentFixture<AgendamentoList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendamentoList],
    }).compileComponents();

    fixture = TestBed.createComponent(AgendamentoList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
