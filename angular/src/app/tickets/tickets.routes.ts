import { Routes } from '@angular/router';

export const ticketsRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./tickets-list.component').then(m => m.TicketsListComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./ticket-detail.component').then(m => m.TicketDetailComponent),
  },
];
