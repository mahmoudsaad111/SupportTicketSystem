import { Component } from '@angular/core';
import { InternetConnectionStatusComponent, LoaderBarComponent } from '@abp/ng.theme.shared';
import { AuthService, DynamicLayoutComponent } from '@abp/ng.core';
import { NotificationDrawerComponent } from './notifications/notification-drawer.component';

@Component({
  selector: 'app-root',
  template: `
    <abp-loader-bar />
    <abp-dynamic-layout />
    <abp-internet-status />
    @if (authService.isAuthenticated) {
      <app-notification-drawer />
    }
  `,
  imports: [
    LoaderBarComponent,
    DynamicLayoutComponent,
    InternetConnectionStatusComponent,
    NotificationDrawerComponent,
  ],
})
export class AppComponent {
  constructor(public authService: AuthService) {}
}
