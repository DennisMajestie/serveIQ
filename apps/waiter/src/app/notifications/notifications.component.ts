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

  openDetail(n: Notification) {
    const data = n.data;
    const html = `
      <div style="text-align:left;padding:8px 0">
        <p style="margin:0 0 4px;font-size:13px;color:#bccbb9">${n.title}</p>
        <p style="margin:0 0 4px;font-size:15px;color:#dce1fb;font-weight:600">${n.message}</p>
        <p style="margin:0;font-size:11px;color:#bccbb9">${new Date(n.createdAt).toLocaleString()}</p>
        ${n.type === 'order_approved' && data?.tracking_code ? `
          <div style="margin-top:12px;padding:10px;background:rgba(75,226,119,0.08);border-radius:8px;text-align:center">
            <p style="margin:0 0 4px;font-size:11px;color:#bccbb9">TRACKING CODE</p>
            <p style="margin:0;font-size:20px;color:#4be277;font-weight:700;letter-spacing:2px">${data.tracking_code}</p>
          </div>
        ` : ''}
        ${n.type === 'order_ready' && (data?.orderId || data?.order_id) ? `
          <div style="margin-top:16px">
            <button id="swal-deliver-btn" style="width:100%;padding:12px;border:none;border-radius:12px;background:#4be277;color:#020617;font-size:15px;font-weight:600;cursor:pointer">Mark Delivered</button>
          </div>
        ` : ''}
      </div>
    `;
    Swal.fire({
      html,
      showCloseButton: true,
      showConfirmButton: false,
      background: '#1e293b',
      color: '#fff',
      customClass: { popup: 'swal-glass' },
      didRender: () => {
        const btn = document.getElementById('swal-deliver-btn');
        if (btn) {
          btn.addEventListener('click', () => {
            Swal.close();
            this.doDeliver(data.orderId || data.order_id);
          });
        }
      },
    }).then(() => this.load());
  }

  private doDeliver(orderId: string) {
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
