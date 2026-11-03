import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNgxMask } from 'ngx-mask';
import { MessageService } from 'primeng/api';

import { Configuracoes } from './configuracoes';

describe('Configuracoes', () => {
  let fixture: ComponentFixture<Configuracoes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Configuracoes],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideNgxMask(), MessageService],
    }).compileComponents();
    fixture = TestBed.createComponent(Configuracoes);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
