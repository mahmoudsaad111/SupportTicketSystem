import { ChangeDetectorRef, Component, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { NotificationService } from '../shared/services/notification.service';
import { NotificationDto } from '../shared/models/notification.models';
import { runInZone } from '../shared/utils/run-in-zone';

// A right-side sliding panel that hosts the notification list. It is shown
// (slid in) by default and can be toggled open/closed with the edge tab /
// header close button. This replaces the old top-toolbar bell entirely.
@Component({
  selector: 'app-notification-drawer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notification-drawer.component.html',
  styleUrls: ['./notification-drawer.component.scss'],
})
export class NotificationDrawerComponent implements OnDestroy {
  // Closed by default: the little edge tab (with unread badge) still shows,
  // the user opens the full panel on demand instead of it sliding in
  // automatically every time the site loads.
  open = false;
  notifications: NotificationDto[] = [];
  loading = true;
  loadError = false;
  markingAllRead = false;
  markingReadId: string | null = null;
  loaded = false;

  readonly unreadCount$ = this.notificationService.unreadCount$;

  private readonly destroyed$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {
    this.load();
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(count => {
        if (this.loaded && count !== this.unreadCount) {
          this.load();
        }
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open && !this.loaded) {
      this.load();
    }
  }

  close(): void {
    this.open = false;
  }

  openDrawer(): void {
    this.open = true;
    if (!this.loaded) {
      this.load();
    }
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.notificationService
      .getMyNotifications()
      .pipe(
        runInZone(this.ngZone),
        takeUntil(this.destroyed$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: result => {
          this.loaded = true;
          this.notifications = [...(result.items ?? [])].sort(
            (a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime(),
          );
          this.notificationService.setUnreadCount(this.unreadCount);
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadError = true;
          this.cdr.detectChanges();
        },
      });
  }

  onNotificationClick(notification: NotificationDto): void {
    if (!notification.isRead) {
      this.markAsRead(notification);
    }
    if (notification.ticketId) {
      this.router.navigate(['/tickets', notification.ticketId]);
    }
    this.close();
  }

  markAsRead(notification: NotificationDto): void {
    if (notification.isRead || this.markingReadId) return;
    this.markingReadId = notification.id;
    this.notificationService
      .markAsRead(notification.id)
      .pipe(runInZone(this.ngZone), takeUntil(this.destroyed$))
      .subscribe({
        next: () => {
          notification.isRead = true;
          this.markingReadId = null;
          this.notificationService.setUnreadCount(this.unreadCount);
          this.cdr.detectChanges();
        },
        error: () => {
          this.markingReadId = null;
        },
      });
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    if (this.markingAllRead || this.unreadCount === 0) return;
    this.markingAllRead = true;
    this.notificationService
      .markAllAsRead()
      .pipe(runInZone(this.ngZone), takeUntil(this.destroyed$))
      .subscribe({
        next: () => {
          this.notifications.forEach(n => (n.isRead = true));
          this.markingAllRead = false;
          this.notificationService.setUnreadCount(0);
          this.cdr.detectChanges();
        },
        error: () => {
          this.markingAllRead = false;
        },
      });
  }

  trackByNotificationId(_index: number, notification: NotificationDto): string {
    return notification.id;
  }

  timeAgo(creationTime: string): string {
    const diffMs = Date.now() - new Date(creationTime).getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
