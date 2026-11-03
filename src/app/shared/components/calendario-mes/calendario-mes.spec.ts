import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarioMes } from './calendario-mes';

describe('CalendarioMes', () => {
  let fixture: ComponentFixture<CalendarioMes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CalendarioMes] }).compileComponents();
    fixture = TestBed.createComponent(CalendarioMes);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
