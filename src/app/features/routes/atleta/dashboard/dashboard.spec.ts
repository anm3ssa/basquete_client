import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AtletaDashboard } from './dashboard';

describe('AtletaDashboard', () => {
  let fixture: ComponentFixture<AtletaDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtletaDashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), MessageService],
    }).compileComponents();
    fixture = TestBed.createComponent(AtletaDashboard);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
