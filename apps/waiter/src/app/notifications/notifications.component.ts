import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationsApiService, OrdersApiService } from '@serveiq/shared/data-access';
import { Notification } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-waiter-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
})
export class WaiterNotificationsComponent implements OnInit {
  private notificationsApi = inject(NotificationsApiService);
  private ordersApi = inject(OrdersApiService);
  private router = inject(Router);

  notifications = signal<Notification[]>([]);
  loading = signal(false);

  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.notificationsApi.list().subscribe({
      next: data => { this.notifications.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  markRead(id: string) {
    this.notificationsApi.markRead(id).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      },
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
        next: () => this.notifications.update(list => list.map(n => ({ ...n, isRead: true }))),
      });
    });
  }

  handleAction(n: Notification) {
    const data = (n as any).data;
    if (data?.order_id) {
      this.router.navigate(['/tabs/detail', data.tab_id || data.order_id]);
    }
  }

  markDelivered(orderId: string, event: Event) {
    event.stopPropagation();
    Swal.fire({
      title: 'Confirm Delivery',
      text: 'Mark this order as delivered to the customer?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delivered',
      cancelButtonText: 'Cancel',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.ordersApi.deliverOrder(orderId).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Delivered!', timer: 1500, showConfirmButton: false });
          this.load();
        },
        error: (err) => {
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to mark delivered' });
        },
      });
    });
  }

  goBack() {
    this.router.navigate(['/tables']);
  }
}
