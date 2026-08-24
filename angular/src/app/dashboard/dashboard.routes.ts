import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent),
  },
];
