import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNgxMask } from 'ngx-mask';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AtletasLista } from './atletas-lista';

describe('AtletasLista', () => {
  let fixture: ComponentFixture<AtletasLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtletasLista],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNgxMask(), MessageService, ConfirmationService],
    }).compileComponents();
    fixture = TestBed.createComponent(AtletasLista);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
