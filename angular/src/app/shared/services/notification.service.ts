import { Injectable, NgZone } from '@angular/core';
import { RestService } from '@abp/ng.core';
import { Subject, interval, merge, of } from 'rxjs';
import { catchError, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { runInZone } from '../utils/run-in-zone';
import type { ListResultDto, NotificationDto } from '../models/notification.models';

// Talks to SupportTicketSystem.Notifications.NotificationAppService (aspnet-core)
// via ABP's auto-generated dynamic API controller conventions. Route mapping:
//   GetMyNotificationsAsync  -> GET  /api/app/notification/my-notifications
//   GetUnreadCountAsync      -> GET  /api/app/notification/unread-count
//   MarkAsReadAsync(id)      -> POST /api/app/notification/{id}/mark-as-read
//   MarkAllAsReadAsync       -> POST /api/app/notification/mark-all-as-read
@Injectable({ providedIn: 'root' })
export class NotificationService {
  apiName = 'Default';

  constructor(
    private restService: RestService,
    private ngZone: NgZone,
  ) {}

  /**
   * Shared unread count so the toolbar bell badge and the dropdown panel
   * stay in sync (e.g. marking a notification as read from the dropdown
   * immediately updates the badge, not just after the next poll).
   *
   * IMPORTANT: this must stay lazy (cold until subscribed). ABP's
   * EnvironmentService/RestService config isn't populated yet during
   * APP_INITIALIZER, so calling getUnreadCount() eagerly at that point
   * throws ("Cannot read properties of undefined (reading 'Default')")
   * and hangs app bootstrap. Subscription only happens once the toolbar
   * actually renders the badge (async pipe), which is safely after
   * bootstrap completes.
   */
  private readonly manualUnreadCount$ = new Subject<number>();
  private readonly polledUnreadCount$ = interval(30_000).pipe(
    startWith(0),
    switchMap(() => this.getUnreadCount().pipe(catchError(() => of(0)))),
  );
  readonly unreadCount$ = merge(this.polledUnreadCount$, this.manualUnreadCount$).pipe(
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: count => this.manualUnreadCount$.next(count),
      error: () => {},
    });
  }

  setUnreadCount(count: number): void {
    this.manualUnreadCount$.next(Math.max(0, count));
  }

  getMyNotifications = () =>
    this.restService.request<any, ListResultDto<NotificationDto>>(
      { method: 'GET', url: '/api/app/notification/my-notifications' },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone));

  getUnreadCount = () =>
    this.restService.request<any, number>(
      { method: 'GET', url: '/api/app/notification/unread-count' },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone));

  markAsRead = (id: string) =>
    this.restService.request<any, void>(
      { method: 'POST', url: `/api/app/notification/${id}/mark-as-read` },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone));

  markAllAsRead = () =>
    this.restService.request<any, void>(
      { method: 'POST', url: '/api/app/notification/mark-all-as-read' },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone));
}
