import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsApiService } from '@serveiq/shared/data-access';
import { Notification } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-page">
      <div class="page-header">
        <h1>Notifications</h1>
        <button class="btn btn-outline" (click)="markAllRead()" *ngIf="unreadCount() > 0">
          <span class="material-symbols-outlined">done_all</span>
          Mark all as read
        </button>
      </div>

      <div class="notifications-list" [class.loading]="loading()">
        <div class="notification-card" *ngFor="let n of notifications()" [class.unread]="!n.isRead">
          <div class="notification-icon type-{{ n.type }}">
            <span class="material-symbols-outlined">{{ iconFor(n.type) }}</span>
          </div>
          <div class="notification-body">
            <div class="notification-header">
              <h3>{{ n.title }}</h3>
              <span class="notification-time">{{ n.createdAt | date:'MMM d, h:mm a' }}</span>
            </div>
            <p>{{ n.message }}</p>
          </div>
          <button class="mark-read-btn" *ngIf="!n.isRead" (click)="markRead(n.id)" title="Mark as read">
            <span class="material-symbols-outlined">check_circle</span>
          </button>
        </div>

        <div class="empty-state" *ngIf="notifications().length === 0">
          <span class="material-symbols-outlined">notifications_off</span>
          <p>No notifications yet</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-page { padding: 24px; max-width: 800px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 28px; font-weight: 700; color: var(--on-surface); }
    @media (max-width: 768px) { .page-header h1 { font-size: 22px; } }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s; }
    .btn-outline { background: transparent; border: 1px solid var(--outline-variant); color: var(--secondary); }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); }

    .notifications-list { display: flex; flex-direction: column; gap: 8px; }
    .notifications-list.loading { opacity: 0.5; pointer-events: none; }

    .notification-card { display: flex; align-items: flex-start; gap: 16px; background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 12px; padding: 16px; transition: all 0.2s; }
    .notification-card.unread { border-left: 3px solid var(--primary); background: color-mix(in srgb, var(--primary) 3%, var(--surface)); }

    .notification-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .notification-icon .material-symbols-outlined { font-size: 20px; }
    .notification-icon.type-low_stock { background: color-mix(in srgb, var(--error) 15%, transparent); color: var(--error); }
    .notification-icon.type-payment { background: color-mix(in srgb, var(--primary) 15%, transparent); color: var(--primary); }
    .notification-icon.type-shift_reminder { background: color-mix(in srgb, var(--tertiary) 15%, transparent); color: var(--tertiary); }
    .notification-icon.type-system { background: color-mix(in srgb, var(--secondary) 15%, transparent); color: var(--secondary); }

    .notification-body { flex: 1; min-width: 0; }
    .notification-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
    .notification-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--on-surface); }
    .notification-time { font-size: 12px; color: var(--on-surface-variant); white-space: nowrap; }
    .notification-body p { margin: 0; font-size: 14px; color: var(--secondary); line-height: 1.5; }

    .mark-read-btn { background: transparent; border: none; color: var(--on-surface-variant); cursor: pointer; padding: 4px; border-radius: 50%; transition: all 0.2s; }
    .mark-read-btn:hover { color: var(--primary); background: color-mix(in srgb, var(--primary) 10%, transparent); }

    .empty-state { text-align: center; padding: 60px 24px; color: var(--on-surface-variant); display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .empty-state .material-symbols-outlined { font-size: 48px; opacity: 0.4; }
    .empty-state p { font-size: 16px; margin: 0; }
  `]
})
export class NotificationsComponent implements OnInit {
  private notificationsApi = inject(NotificationsApiService);

  notifications = signal<Notification[]>([]);
  loading = signal(false);

  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  ngOnInit() {
    this.loadNotifications();
  }

  private loadNotifications() {
    this.loading.set(true);
    this.notificationsApi.list().subscribe({
      next: data => { this.notifications.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  markRead(id: string) {
    this.notificationsApi.markRead(id).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      },
      error: () => {}
    });
  }

  markAllRead() {
    Swal.fire({
      title: 'Mark all as read?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.notificationsApi.markAllRead().subscribe({
        next: () => {
          this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
        },
        error: () => {}
      });
    });
  }

  iconFor(type: string): string {
    switch (type) {
      case 'low_stock': return 'inventory';
      case 'shift_reminder': return 'schedule';
      case 'payment': return 'payments';
      default: return 'notifications';
    }
  }
}
