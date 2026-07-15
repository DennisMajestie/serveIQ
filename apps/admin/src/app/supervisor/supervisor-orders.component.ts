import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersApiService, DepartmentsApiService, showApiErrorToast } from '@serveiq/shared/data-access';
import { Order, Department } from '@serveiq/shared/models';
import Swal from 'sweetalert2';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

type QueueTab = 'pending' | 'preparing' | 'ready';

@Component({
  selector: 'app-supervisor-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="supervisor-orders">
      <!-- Header -->
      <div class="page-header">
        <h1>Order Management</h1>
        <p class="subtitle">Supervisor Workflow — Approve, track, and fulfill orders</p>
      </div>

      <!-- Queue Tabs -->
      <div class="queue-tabs">
        <button class="queue-tab" [class.active]="activeTab() === 'pending'" (click)="activeTab.set('pending'); loadPending()">
          Pending
          @if (pendingOrders().length > 0) {
            <span class="badge">{{ pendingOrders().length }}</span>
          }
        </button>
        <button class="queue-tab" [class.active]="activeTab() === 'preparing'" (click)="activeTab.set('preparing'); loadPreparing()">
          In Progress
          @if (preparingOrders().length > 0) {
            <span class="badge">{{ preparingOrders().length }}</span>
          }
        </button>
        <button class="queue-tab" [class.active]="activeTab() === 'ready'" (click)="activeTab.set('ready'); loadReady()">
          Ready for Pickup
          @if (readyOrders().length > 0) {
            <span class="badge">{{ readyOrders().length }}</span>
          }
        </button>
      </div>

      <!-- Pending Queue -->
      @if (activeTab() === 'pending') {
        @if (isLoadingPending()) {
          <div class="loading-shimmer"></div>
          <div class="loading-shimmer"></div>
          <div class="loading-shimmer"></div>
        } @else if (pendingOrders().length === 0) {
          <div class="empty-state">
            <span class="material-symbols-outlined">check_circle</span>
            <h3>No Pending Orders</h3>
            <p>All orders have been reviewed.</p>
          </div>
        } @else {
          <div class="order-list">
            @for (order of pendingOrders(); track order.id) {
              <div class="order-card">
                <div class="order-card-header">
                  <div class="table-info">
                    <span class="material-symbols-outlined">table_restaurant</span>
                    <span>Table {{ order.tab?.table?.tableNumber || order.tab?.tableId || '—' }}</span>
                  </div>
                  <span class="order-time">{{ formatTime(order.createdAt) }}</span>
                </div>
                <div class="order-card-body">
                  <div class="waiter-info">
                    <span class="material-symbols-outlined">person</span>
                    <span>{{ order.waiter?.fullName || 'Unknown Waiter' }}</span>
                  </div>
                  <div class="items-summary">
                    <span class="items-count">{{ order.items?.length || 0 }} item(s)</span>
                    <div class="item-tags">
                      @for (item of (order.items || []).slice(0, 4); track item.id) {
                        <span class="item-tag">{{ item.menuItemName || item.menu_item_name || 'Item' }}</span>
                      }
                      @if ((order.items?.length || 0) > 4) {
                        <span class="item-tag more">+{{ (order.items?.length || 0) - 4 }} more</span>
                      }
                    </div>
                  </div>
                </div>
                <div class="order-card-actions">
                  <button class="btn btn-approve" (click)="openApproveModal(order)">
                    <span class="material-symbols-outlined">check_circle</span>
                    Approve
                  </button>
                  <button class="btn btn-decline" (click)="openDeclineModal(order)">
                    <span class="material-symbols-outlined">cancel</span>
                    Decline
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- Preparing Queue -->
      @if (activeTab() === 'preparing') {
        @if (isLoadingPreparing()) {
          <div class="loading-shimmer"></div>
          <div class="loading-shimmer"></div>
        } @else if (preparingOrders().length === 0) {
          <div class="empty-state">
            <span class="material-symbols-outlined">timer_off</span>
            <h3>No Orders In Progress</h3>
            <p>Approved orders will appear here with live countdowns.</p>
          </div>
        } @else {
          <div class="order-list">
            @for (order of preparingOrders(); track order.id) {
              <div class="order-card preparing">
                <div class="order-card-header">
                  <div class="table-info">
                    <span class="material-symbols-outlined">table_restaurant</span>
                    <span>Table {{ order.tab?.table?.tableNumber || order.tab?.tableId || '—' }}</span>
                  </div>
                  <div class="countdown" [class.urgent]="getRemainingSeconds(order) <= 60">
                    <span class="material-symbols-outlined">timer</span>
                    <span>{{ formatCountdown(order) }}</span>
                  </div>
                </div>
                <div class="order-card-body">
                  <div class="waiter-info">
                    <span class="material-symbols-outlined">person</span>
                    <span>{{ order.waiter?.fullName || 'Unknown Waiter' }}</span>
                  </div>
                  @if (order.department) {
                    <div class="dept-badge">{{ order.department.name }}</div>
                  }
                  <div class="items-summary">
                    <span class="items-count">{{ order.items?.length || 0 }} item(s)</span>
                    <div class="item-tags">
                      @for (item of (order.items || []).slice(0, 3); track item.id) {
                        <span class="item-tag">{{ item.menuItemName || item.menu_item_name || 'Item' }}</span>
                      }
                      @if ((order.items?.length || 0) > 3) {
                        <span class="item-tag more">+{{ (order.items?.length || 0) - 3 }} more</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- Ready for Pickup Queue -->
      @if (activeTab() === 'ready') {
        @if (isLoadingReady()) {
          <div class="loading-shimmer"></div>
          <div class="loading-shimmer"></div>
        } @else if (readyOrders().length === 0) {
          <div class="empty-state">
            <span class="material-symbols-outlined">inventory_2</span>
            <h3>No Orders Ready</h3>
            <p>Orders whose timer has expired will appear here.</p>
          </div>
        } @else {
          <div class="order-list">
            @for (order of readyOrders(); track order.id) {
              <div class="order-card ready">
                <div class="order-card-header">
                  <div class="table-info">
                    <span class="material-symbols-outlined">table_restaurant</span>
                    <span>Table {{ order.tab?.table?.tableNumber || order.tab?.tableId || '—' }}</span>
                  </div>
                  <span class="ready-badge">Ready</span>
                </div>
                <div class="order-card-body">
                  <div class="waiter-info">
                    <span class="material-symbols-outlined">person</span>
                    <span>{{ order.waiter?.fullName || 'Unknown Waiter' }}</span>
                  </div>
                  <div class="items-summary">
                    <span class="items-count">{{ order.items?.length || 0 }} item(s)</span>
                    <div class="item-tags">
                      @for (item of (order.items || []).slice(0, 3); track item.id) {
                        <span class="item-tag">{{ item.menuItemName || item.menu_item_name || 'Item' }}</span>
                      }
                      @if ((order.items?.length || 0) > 3) {
                        <span class="item-tag more">+{{ (order.items?.length || 0) - 3 }} more</span>
                      }
                    </div>
                  </div>
                </div>
                <div class="order-card-actions">
                  <button class="btn btn-deliver" (click)="deliverOrder(order)">
                    <span class="material-symbols-outlined">task_alt</span>
                    Mark Delivered
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .supervisor-orders {
      padding: 24px;
      max-width: 960px;
      margin: 0 auto;
    }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 700; margin: 0 0 4px; }
    .subtitle { color: var(--secondary); font-size: 14px; margin: 0; }
    .queue-tabs { display: flex; gap: 8px; margin-bottom: 24px; }
    .queue-tab {
      padding: 10px 20px;
      border-radius: 10px;
      border: 1px solid rgba(64,71,88,0.2);
      background: var(--surface);
      color: var(--on-surface);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      font-family: inherit;
    }
    .queue-tab.active { border-color: var(--primary-container); color: var(--primary-container); }
    .queue-tab .badge {
      background: var(--primary-container);
      color: var(--on-primary-container);
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      line-height: 1.4;
    }
    .queue-tab.active .badge { background: var(--primary-container); }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
      color: var(--secondary);
    }
    .empty-state .material-symbols-outlined { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
    .empty-state h3 { font-size: 18px; font-weight: 600; margin: 0 0 8px; color: var(--on-surface); }
    .empty-state p { font-size: 14px; margin: 0; }
    .order-list { display: flex; flex-direction: column; gap: 12px; }
    .order-card {
      background: var(--surface);
      border: 1px solid rgba(64,71,88,0.2);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .order-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .table-info { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
    .table-info .material-symbols-outlined { font-size: 20px; color: var(--primary-container); }
    .order-time { font-size: 12px; color: var(--secondary); }
    .order-card-body { display: flex; flex-direction: column; gap: 8px; }
    .waiter-info { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--secondary); }
    .waiter-info .material-symbols-outlined { font-size: 16px; }
    .items-summary { display: flex; flex-direction: column; gap: 6px; }
    .items-count { font-size: 12px; color: var(--secondary); font-weight: 500; }
    .item-tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .item-tag {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(64,71,88,0.15);
      color: var(--on-surface);
    }
    .item-tag.more { background: transparent; color: var(--secondary); font-style: italic; }
    .order-card-actions { display: flex; gap: 8px; }
    .btn {
      flex: 1;
      height: 44px;
      border-radius: 10px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }
    .btn:active { transform: scale(0.97); }
    .btn-approve { background: rgba(34,197,94,0.15); color: #22c55e; }
    .btn-approve:hover { background: rgba(34,197,94,0.25); }
    .btn-decline { background: rgba(239,68,68,0.15); color: #ef4444; }
    .btn-decline:hover { background: rgba(239,68,68,0.25); }
    .btn-deliver { background: var(--primary-container); color: var(--on-primary-container); }
    .btn-deliver:hover { opacity: 0.9; }
    .countdown { display: flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: #22c55e; }
    .countdown.urgent { color: #ef4444; }
    .countdown .material-symbols-outlined { font-size: 18px; }
    .dept-badge {
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 999px;
      background: rgba(249,115,22,0.15);
      color: var(--primary-container);
      display: inline-block;
      width: fit-content;
    }
    .ready-badge {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 999px;
      background: rgba(34,197,94,0.15);
      color: #22c55e;
    }
    .order-card.preparing { border-color: rgba(34,197,94,0.3); }
    .order-card.ready { border-color: rgba(249,115,22,0.3); }
    .loading-shimmer {
      height: 120px;
      border-radius: 16px;
      margin-bottom: 12px;
      background: linear-gradient(90deg, var(--surface) 25%, var(--surface-container-high) 50%, var(--surface) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class SupervisorOrdersComponent implements OnInit, OnDestroy {
  private ordersApi = inject(OrdersApiService);
  private departmentsApi = inject(DepartmentsApiService);

  activeTab = signal<QueueTab>('pending');

  pendingOrders = signal<Order[]>([]);
  preparingOrders = signal<Order[]>([]);
  readyOrders = signal<Order[]>([]);

  isLoadingPending = signal(false);
  isLoadingPreparing = signal(false);
  isLoadingReady = signal(false);

  departments = signal<Department[]>([]);

  private pollSub: Subscription | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private remainingMap = new Map<string, number>();

  ngOnInit() {
    this.loadPending();
    this.loadDepartments();
    this.pollSub = interval(15000).subscribe(() => {
      this.loadPending();
      this.loadPreparing();
      this.loadReady();
    });
    this.countdownInterval = setInterval(() => {
      this.preparingOrders.update(orders => [...orders]);
    }, 1000);
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  loadDepartments() {
    this.departmentsApi.getAll().subscribe({
      next: (depts) => this.departments.set(depts || []),
      error: () => {}
    });
  }

  loadPending() {
    this.isLoadingPending.set(true);
    this.ordersApi.getPending().subscribe({
      next: (orders) => { this.pendingOrders.set(orders || []); this.isLoadingPending.set(false); },
      error: () => this.isLoadingPending.set(false)
    });
  }

  loadPreparing() {
    this.isLoadingPreparing.set(true);
    this.ordersApi.getPreparing().subscribe({
      next: (orders) => {
        this.preparingOrders.set(orders || []);
        this.isLoadingPreparing.set(false);
        for (const o of (orders || [])) {
          if (o.timerEndsAt) {
            this.remainingMap.set(o.id, this.calcRemaining(o.timerEndsAt));
          }
        }
      },
      error: () => this.isLoadingPreparing.set(false)
    });
  }

  loadReady() {
    this.isLoadingReady.set(true);
    this.ordersApi.getReadyForPickup().subscribe({
      next: (orders) => { this.readyOrders.set(orders || []); this.isLoadingReady.set(false); },
      error: () => this.isLoadingReady.set(false)
    });
  }

  private calcRemaining(timerEndsAt: string): number {
    const end = new Date(timerEndsAt).getTime();
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  }

  getRemainingSeconds(order: Order): number {
    if (!order.timerEndsAt) return 0;
    return this.calcRemaining(order.timerEndsAt);
  }

  formatCountdown(order: Order): string {
    const secs = this.getRemainingSeconds(order);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  openApproveModal(order: Order) {
    const depts = this.departments();
    let selectedDept = '';
    let selectedTime = 5;

    const timeOptions = [5, 10, 15, 25];
    let customTime = 5;

    const html = `
      <div style="text-align:left;">
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:#888;">Department</label>
          <select id="swal-dept" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(64,71,88,0.3);background:#1A1A1A;color:#fff;font-size:14px;font-family:inherit;">
            <option value="">Select department...</option>
            ${depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
          </select>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:#888;">Estimated Preparation Time</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${timeOptions.map(t => `<button type="button" class="time-opt" data-time="${t}" style="flex:1;min-width:60px;padding:8px 12px;border-radius:8px;border:1px solid rgba(64,71,88,0.3);background:#1A1A1A;color:#fff;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">${t} min</button>`).join('')}
          </div>
          <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
            <label style="font-size:12px;color:#888;">Custom:</label>
            <input id="swal-custom-time" type="number" min="1" max="120" value="${customTime}" style="width:80px;padding:8px 12px;border-radius:8px;border:1px solid rgba(64,71,88,0.3);background:#1A1A1A;color:#fff;font-size:14px;font-family:inherit;">
            <span style="font-size:12px;color:#888;">min</span>
          </div>
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Approve Order',
      html,
      showCancelButton: true,
      confirmButtonText: 'Approve',
      confirmButtonColor: '#22c55e',
      cancelButtonText: 'Cancel',
      background: '#1A1A1A',
      color: '#fff',
      didOpen: () => {
        document.querySelectorAll('.time-opt').forEach(btn => {
          btn.addEventListener('click', (e) => {
            document.querySelectorAll('.time-opt').forEach(b => (b as HTMLElement).style.borderColor = 'rgba(64,71,88,0.3)');
            (e.currentTarget as HTMLElement).style.borderColor = '#22c55e';
            const time = parseInt((e.currentTarget as HTMLElement).getAttribute('data-time') || '5', 10);
            selectedTime = time;
            const customInput = document.getElementById('swal-custom-time') as HTMLInputElement;
            if (customInput) customInput.value = String(time);
          });
        });
        const customInput = document.getElementById('swal-custom-time') as HTMLInputElement;
        if (customInput) {
          customInput.addEventListener('input', () => {
            document.querySelectorAll('.time-opt').forEach(b => (b as HTMLElement).style.borderColor = 'rgba(64,71,88,0.3)');
            const val = parseInt(customInput.value, 10);
            if (val > 0) selectedTime = val;
          });
        }
      },
      preConfirm: () => {
        const deptSelect = document.getElementById('swal-dept') as HTMLSelectElement;
        selectedDept = deptSelect?.value || '';
        const customInput = document.getElementById('swal-custom-time') as HTMLInputElement;
        const val = parseInt(customInput?.value || '5', 10);
        if (val > 0) selectedTime = val;

        if (!selectedDept) {
          Swal.showValidationMessage('Please select a department');
          return false;
        }
        return { departmentId: selectedDept, estimatedTime: selectedTime };
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.ordersApi.approveOrder(order.id, result.value).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Approved', text: 'Order has been approved and sent to preparation.', timer: 1500, showConfirmButton: false, background: '#1A1A1A', color: '#fff' });
            this.pendingOrders.update(list => list.filter(o => o.id !== order.id));
            this.loadPreparing();
          },
          error: (err) => showApiErrorToast(err, 'Failed to approve order')
        });
      }
    });
  }

  openDeclineModal(order: Order) {
    const html = `
      <div style="text-align:left;">
        <div style="margin-bottom:8px;">
          <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:#888;">Reason for declining</label>
          <textarea id="swal-decline-reason" rows="4" placeholder="e.g. Out of stock, Kitchen unavailable, Incorrect order..." style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(64,71,88,0.3);background:#1A1A1A;color:#fff;font-size:14px;font-family:inherit;resize:vertical;box-sizing:border-box;"></textarea>
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Decline Order',
      html,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Decline',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancel',
      background: '#1A1A1A',
      color: '#fff',
      preConfirm: () => {
        const reason = (document.getElementById('swal-decline-reason') as HTMLTextAreaElement)?.value?.trim();
        if (!reason) {
          Swal.showValidationMessage('Please provide a reason');
          return false;
        }
        return { declineReason: reason };
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.ordersApi.declineOrder(order.id, result.value).subscribe({
          next: () => {
            Swal.fire({ icon: 'info', title: 'Declined', text: 'Order has been declined.', timer: 1500, showConfirmButton: false, background: '#1A1A1A', color: '#fff' });
            this.pendingOrders.update(list => list.filter(o => o.id !== order.id));
          },
          error: (err) => showApiErrorToast(err, 'Failed to decline order')
        });
      }
    });
  }

  deliverOrder(order: Order) {
    Swal.fire({
      title: 'Mark as Delivered?',
      text: `Confirm that this order has been delivered to Table ${order.tab?.table?.tableNumber || order.tab?.tableId || '—'}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delivered',
      confirmButtonColor: '#f97316',
      cancelButtonText: 'Cancel',
      background: '#1A1A1A',
      color: '#fff',
    }).then(result => {
      if (result.isConfirmed) {
        this.ordersApi.deliverOrder(order.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Delivered', text: 'Order marked as delivered.', timer: 1500, showConfirmButton: false, background: '#1A1A1A', color: '#fff' });
            this.readyOrders.update(list => list.filter(o => o.id !== order.id));
          },
          error: (err) => showApiErrorToast(err, 'Failed to mark order as delivered')
        });
      }
    });
  }
}
