import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Role } from '../../../../shared/models';
import { AuthService } from '../../../../core/services/auth';

interface ItemMenu {
  rotulo: string;
  icone: string;
  rota: string;
}

/** Itens de menu de cada perfil (RBAC também no menu, não só nas rotas). */
const MENU: Record<Role, ItemMenu[]> = {
  ROLE_ATLETA: [
    { rotulo: 'Menu inicial', icone: 'pi pi-home', rota: '/atleta/dashboard' },
    { rotulo: 'Calendário', icone: 'pi pi-calendar', rota: '/atleta/calendario' },
    { rotulo: 'Meu time', icone: 'pi pi-users', rota: '/atleta/meu-time' },
    { rotulo: 'Desempenho', icone: 'pi pi-chart-line', rota: '/atleta/desempenho' },
    { rotulo: 'Configurações', icone: 'pi pi-cog', rota: '/atleta/configuracoes' },
  ],
  ROLE_TREINADOR: [
    { rotulo: 'Menu inicial', icone: 'pi pi-home', rota: '/treinador/dashboard' },
    { rotulo: 'Calendário', icone: 'pi pi-calendar', rota: '/treinador/calendario' },
    { rotulo: 'Atletas', icone: 'pi pi-id-card', rota: '/treinador/atletas' },
    { rotulo: 'Desempenho', icone: 'pi pi-chart-bar', rota: '/treinador/desempenho' },
    { rotulo: 'Configurações', icone: 'pi pi-cog', rota: '/treinador/configuracoes' },
  ],
};

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  private readonly auth = inject(AuthService);

  /** Avisa o layout para fechar o menu no celular depois de navegar */
  readonly navegou = output<void>();

  protected readonly inicio = computed(() => this.auth.rotaInicial());
  protected readonly itens = computed(() => {
    const perfil = this.auth.perfil();
    return perfil ? MENU[perfil] : [];
  });
}
