import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AtletaCalendario } from './calendario';

describe('AtletaCalendario', () => {
  let fixture: ComponentFixture<AtletaCalendario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtletaCalendario],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), MessageService],
    }).compileComponents();
    fixture = TestBed.createComponent(AtletaCalendario);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
