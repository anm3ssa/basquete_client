import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../../core/services/auth';
import { ContaService } from '../../../../core/services/conta';

@Component({
  selector: 'app-header',
  imports: [RouterLink, ButtonModule, AvatarModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly auth = inject(AuthService);
  private readonly conta = inject(ContaService).conta;
  /** Foto de perfil (não vem no token) */
  protected readonly foto = computed(() => this.conta()?.fotoUrl ?? null);
  /** Link para a tela de Configurações do perfil */
  protected readonly linkConfiguracoes = computed(() =>
    this.auth.perfil() === 'ROLE_TREINADOR' ? '/treinador/configuracoes' : '/atleta/configuracoes',
  );

  /** Botão de menu (só aparece no celular) */
  readonly abrirMenu = output<void>();

  protected readonly iniciais = computed(() =>
    (this.auth.usuario()?.nome ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join(''),
  );

  protected readonly perfil = computed(() =>
    this.auth.perfil() === 'ROLE_TREINADOR' ? 'Treinador' : 'Atleta',
  );
}
