import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtletaList } from './atleta-list';

describe('AtletaList', () => {
  let component: AtletaList;
  let fixture: ComponentFixture<AtletaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtletaList],
    }).compileComponents();

    fixture = TestBed.createComponent(AtletaList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
