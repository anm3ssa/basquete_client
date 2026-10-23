import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface ItemMenu {
  rotulo: string;
  icone: string;
  rota: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  protected readonly itens: ItemMenu[] = [
    { rotulo: 'Dashboard', icone: 'pi pi-home', rota: '/dashboard' },
    { rotulo: 'Atletas', icone: 'pi pi-users', rota: '/atletas' },
    { rotulo: 'Treinadores', icone: 'pi pi-id-card', rota: '/treinadores' },
    { rotulo: 'Treinos', icone: 'pi pi-bolt', rota: '/treinos' },
    { rotulo: 'Agendamentos', icone: 'pi pi-calendar', rota: '/agendamentos' },
  ];
}
