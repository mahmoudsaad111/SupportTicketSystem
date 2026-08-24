import { RoutesService, eLayoutType } from '@abp/ng.core';
import { APP_INITIALIZER } from '@angular/core';

export const APP_ROUTE_PROVIDER = [
  { provide: APP_INITIALIZER, useFactory: configureRoutes, deps: [RoutesService], multi: true },
];

function configureRoutes(routesService: RoutesService) {
  return () => {
    routesService.add([
      {
        path: '/dashboard',
        name: 'Dashboard',
        iconClass: 'fas fa-chart-pie',
        order: 2,
        layout: eLayoutType.application,
      },
      {
        path: '/tickets',
        name: 'All Tickets',
        iconClass: 'fas fa-ticket-alt',
        order: 3,
        layout: eLayoutType.application,
      },
      {
        path: '/my-tickets',
        name: 'My Tickets',
        iconClass: 'fas fa-user-check',
        order: 4,
        layout: eLayoutType.application,
      },
      {
        path: '/overdue-tickets',
        name: 'Overdue',
        iconClass: 'fas fa-clock',
        order: 5,
        layout: eLayoutType.application,
      },
      {
        path: '/unassigned-tickets',
        name: 'Unassigned',
        iconClass: 'fas fa-user-slash',
        order: 6,
        layout: eLayoutType.application,
      },
      // Notifications no longer has its own sidebar entry — it's surfaced
      // via the bell dropdown in the toolbar (see
      // notifications/notification-toolbar.provider.ts). The route below
      // is still registered in app.routes.ts for the dropdown's
      // "View all notifications" link, it's just not in the main menu.
    ]);
  };
}
