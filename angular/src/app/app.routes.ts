import { Routes } from '@angular/router';
import { authGuard } from '@abp/ng.core';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.dashboardRoutes),
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    loadChildren: () => import('./tickets/tickets.routes').then(m => m.ticketsRoutes),
  },
  {
    path: 'my-tickets',
    canActivate: [authGuard],
    loadComponent: () => import('./my-tickets/my-tickets.component').then(m => m.MyTicketsComponent),
  },
  {
    path: 'overdue-tickets',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./overdue-tickets/overdue-tickets.component').then(m => m.OverdueTicketsComponent),
  },
  {
    path: 'unassigned-tickets',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./unassigned-tickets/unassigned-tickets.component').then(m => m.UnassignedTicketsComponent),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./notifications/notifications.component').then(m => m.NotificationsComponent),
  },
  {
    path: 'account',
    loadChildren: () => import('@abp/ng.account').then(m => m.createRoutes()),
  },
  {
    path: 'identity',
    canActivate: [authGuard],
    loadChildren: () => import('@abp/ng.identity').then(m => m.createRoutes()),
  },
  {
    path: 'tenant-management',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@abp/ng.tenant-management').then(m => m.createRoutes()),
  },
  {
    path: 'setting-management',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@abp/ng.setting-management').then(m => m.createRoutes()),
  },
];
