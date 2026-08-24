import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize, takeUntil } from 'rxjs';
import { NotificationService } from '../shared/services/notification.service';
import { NotificationDto } from '../shared/models/notification.models';
import { Subject } from 'rxjs';
import { runInZone } from '../shared/utils/run-in-zone';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationDto[] = [];
  loading = true;
  loadError = false;

  markingAllRead = false;
  markingReadId: string | null = null;
  private readonly destroyed$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    this.load();
    this.notificationService.unreadCount$
      .pipe(runInZone(this.ngZone), takeUntil(this.destroyed$))
      .subscribe(count => {
        if (count !== this.unreadCount) {
          this.load();
        }
      });
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.notificationService
      .getMyNotifications()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: result => {
          this.notifications = [...(result.items ?? [])].sort(
            (a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime(),
          );
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadError = true;
          this.cdr.detectChanges();
        },
      });
  }

  markAsRead(notification: NotificationDto): void {
    if (notification.isRead || this.markingReadId) return;
    this.markingReadId = notification.id;
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;
        this.markingReadId = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.markingReadId = null;
      },
    });
  }

  markAllAsRead(): void {
    if (this.markingAllRead || this.unreadCount === 0) return;
    this.markingAllRead = true;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => (n.isRead = true));
        this.markingAllRead = false;
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
