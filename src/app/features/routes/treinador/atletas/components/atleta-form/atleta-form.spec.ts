import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNgxMask } from 'ngx-mask';

import { AtletaForm } from './atleta-form';

describe('AtletaForm', () => {
  let fixture: ComponentFixture<AtletaForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtletaForm],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNgxMask()],
    }).compileComponents();
    fixture = TestBed.createComponent(AtletaForm);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
