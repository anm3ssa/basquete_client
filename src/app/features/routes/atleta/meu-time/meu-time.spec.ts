import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { MeuTime } from './meu-time';

describe('MeuTime', () => {
  let fixture: ComponentFixture<MeuTime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeuTime],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), MessageService],
    }).compileComponents();
    fixture = TestBed.createComponent(MeuTime);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
