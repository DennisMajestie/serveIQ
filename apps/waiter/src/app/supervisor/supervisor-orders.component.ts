import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrdersApiService, DepartmentsApiService, TablesApiService, TabsApiService, ShiftsApiService, UserApiService, AuditApiService, showApiErrorToast, AuthService } from '@serveiq/shared/data-access';
import { Order, Department, Table, Shift, User, Tab, AuditLog } from '@serveiq/shared/models';
import Swal from 'sweetalert2';
import { interval, Subscription, forkJoin } from 'rxjs';

type QueueTab = 'pending' | 'preparing' | 'ready';

@Component({
  selector: 'app-waiter-supervisor-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './supervisor-orders.component.html',
  styleUrl: './supervisor-orders.component.scss'
})
export class SupervisorOrdersComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private ordersApi = inject(OrdersApiService);
  private departmentsApi = inject(DepartmentsApiService);
  private tablesApi = inject(TablesApiService);
  private tabsApi = inject(TabsApiService);
  private shiftsApi = inject(ShiftsApiService);
  private userApi = inject(UserApiService);
  private auditApi = inject(AuditApiService);

  activeTab = signal<QueueTab>('pending');

  pendingOrders = signal<Order[]>([]);
  preparingOrders = signal<Order[]>([]);
  readyOrders = signal<Order[]>([]);

  isLoadingPending = signal(false);
  isLoadingPreparing = signal(false);
  isLoadingReady = signal(false);
  isProcessingAction = signal(false);
  isRefreshing = signal(false);
  isDarkMode = signal(true);

  departments = signal<Department[]>([]);
  tables = signal<Table[]>([]);
  tabs = signal<Tab[]>([]);
  currentShift = signal<Shift | null>(null);
  waiters = signal<User[]>([]);

  businessName = signal(localStorage.getItem('businessName') || 'ServeIQ');
  activityLogs = signal<AuditLog[]>([]);
  isActivityLoading = signal(false);
  currentUser = signal<User | null>(null);

  avgApprovalTime = computed(() => {
    const count = this.pendingOrders().length + this.preparingOrders().length + this.readyOrders().length;
    if (count === 0) return '—';
    return '< 5m';
  });

  waitersOnDuty = computed(() => {
    return this.waiters().filter(w => w.isActive !== false);
  });

  private pollSub: Subscription | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.loadThemePreference();
    this.loadAll();
    this.pollSub = interval(15000).subscribe(() => {
      this.loadPending();
      this.loadPreparing();
      this.loadReady();
      this.loadTables();
      this.loadShift();
      this.loadRecentActivity();
    });
    this.countdownInterval = setInterval(() => {
      this.preparingOrders.update(orders => [...orders]);
    }, 1000);
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  goBack() {
    this.router.navigate(['/tables']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  refreshAll() {
    this.isRefreshing.set(true);
    this.loadAll();
    setTimeout(() => this.isRefreshing.set(false), 1000);
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
    localStorage.setItem('serveiq_waiter_supervisor_theme', this.isDarkMode() ? 'dark' : 'light');
  }

  private loadThemePreference() {
    const saved = localStorage.getItem('serveiq_waiter_supervisor_theme');
    if (saved === 'light') {
      this.isDarkMode.set(false);
    }
  }

  switchTab(tab: QueueTab) {
    this.activeTab.set(tab);
    if (tab === 'pending') this.loadPending();
    else if (tab === 'preparing') this.loadPreparing();
    else if (tab === 'ready') this.loadReady();
  }

  private loadAll() {
    this.loadPending();
    this.loadPreparing();
    this.loadReady();
    this.loadDepartments();
    this.loadTables();
    this.loadShift();
    this.loadWaiters();
    this.userApi.getMe().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.loadRecentActivity();
      },
      error: () => this.loadRecentActivity(),
    });
  }

  loadRecentActivity() {
    this.isActivityLoading.set(true);
    const userId = this.currentUser()?.id;
    if (userId) {
      this.auditApi.list({ user_id: userId, limit: 20 }).subscribe({
        next: (res: any) => { this.activityLogs.set(Array.isArray(res) ? res : (res.data || [])); this.isActivityLoading.set(false); },
        error: () => this.isActivityLoading.set(false),
      });
    } else {
      this.auditApi.recent().subscribe({
        next: (logs) => { this.activityLogs.set(logs); this.isActivityLoading.set(false); },
        error: () => this.isActivityLoading.set(false),
      });
    }
  }

  loadDepartments() {
    this.departmentsApi.getAll().subscribe({
      next: (depts) => this.departments.set(depts || []),
    });
  }

  loadTables() {
    forkJoin({
      tables: this.tablesApi.getAllTables(),
      tabs: this.tabsApi.getAllTabs(),
    }).subscribe({
      next: ({ tables, tabs }) => {
        this.tables.set(tables || []);
        this.tabs.set(tabs || []);
      },
    });
  }

  loadShift() {
    this.shiftsApi.getCurrent().subscribe({
      next: (shift) => this.currentShift.set(shift || null),
      error: () => this.currentShift.set(null),
    });
  }

  loadWaiters() {
    this.userApi.listWaiters().subscribe({
      next: (waiters) => this.waiters.set(waiters || []),
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
      next: (orders) => { this.preparingOrders.set(orders || []); this.isLoadingPreparing.set(false); },
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

  getTableStatusClass(table: Table): string {
    const status = table.status || 'available';

    const orders = [
      ...this.pendingOrders(),
      ...this.preparingOrders(),
      ...this.readyOrders(),
    ];
    const matchingOrder = orders.find(o => {
      const tableId = o.tab?.tableId;
      const tableNum = o.tab?.table?.tableNumber;
      return tableId === table.id || tableNum === table.tableNumber;
    });
    if (matchingOrder) {
      const orderStatus = this.getOrderStatusClass(matchingOrder.status);
      return `${status} has-${orderStatus}`;
    }
    return status;
  }

  private getOrderStatusClass(status: string): string {
    if (status === 'PENDING_SUPERVISOR_APPROVAL') return 'pending';
    if (status === 'PREPARING' || status === 'APPROVED' || status === 'ASSIGNED_TO_DEPARTMENT') return 'preparing';
    if (status === 'READY_FOR_PICKUP') return 'ready';
    return status.toLowerCase();
  }

  getTableOrderStatus(table: Table): string | null {
    const orders = [
      ...this.pendingOrders(),
      ...this.preparingOrders(),
      ...this.readyOrders(),
    ];
    const match = orders.find(o => {
      const tableId = o.tab?.tableId;
      const tableNum = o.tab?.table?.tableNumber;
      return tableId === table.id || tableNum === table.tableNumber;
    });
    if (!match) return null;
    return this.getOrderStatusClass(match.status);
  }

  getTableLabel(order: Order): string {
    if (order.tab?.table?.tableNumber) return order.tab.table.tableNumber;
    const tab = this.tabs().find(t => t.id === order.tabId);
    if (tab) {
      const table = this.tables().find(t => t.id === tab.tableId);
      if (table) return table.tableNumber;
    }
    return order.tab?.tableId || '—';
  }

  getWaiterLabel(order: Order): string {
    if (order.waiter?.fullName) return order.waiter.fullName;
    const waiter = this.waiters().find(w => w.id === order.waiterId);
    return waiter?.fullName || 'Unknown Waiter';
  }

  getTableTooltip(table: Table): string {
    const status = table.status || 'available';
    const orders = [
      ...this.pendingOrders(),
      ...this.preparingOrders(),
      ...this.readyOrders(),
    ];
    const match = orders.find(o => {
      const tableId = o.tab?.tableId;
      const tableNum = o.tab?.table?.tableNumber;
      return tableId === table.id || tableNum === table.tableNumber;
    });
    if (match) {
      return `Table ${table.tableNumber} — ${match.status.replace(/_/g, ' ')}`;
    }
    return `Table ${table.tableNumber} — ${status}`;
  }

  getShiftDuration(shift: Shift): string {
    if (!shift.openedAt) return '—';
    const start = new Date(shift.openedAt).getTime();
    const end = shift.closedAt ? new Date(shift.closedAt).getTime() : Date.now();
    const hours = Math.floor((end - start) / 3600000);
    const minutes = Math.floor(((end - start) % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  formatKobo(kobo: number): string {
    return '₦' + (kobo / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });
  }

  encodeURI(name: string): string {
    return encodeURIComponent(name || 'U');
  }

  private getRemainingSecondsRaw(timerEndsAt: string): number {
    const end = new Date(timerEndsAt).getTime();
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  }

  getRemainingSeconds(order: Order): number {
    if (!order.timerEndsAt) return 0;
    return this.getRemainingSecondsRaw(order.timerEndsAt);
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

  formatActivityTime(date: string): string {
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getActivityIcon(log: AuditLog): { icon: string; type: string } {
    const action = log.action;
    if (action.includes('approve')) return { icon: 'check_circle', type: 'approve' };
    if (action.includes('decline')) return { icon: 'cancel', type: 'decline' };
    if (action.includes('deliver')) return { icon: 'task_alt', type: 'deliver' };
    if (action.includes('PIN') || action.includes('pin')) return { icon: 'lock_reset', type: 'pin' };
    if (action.includes('CREATED') || action.includes('created')) return { icon: 'person_add', type: 'user' };
    if (action.includes('DEACTIVATED') || action.includes('deactivated')) return { icon: 'person_off', type: 'user' };
    if (action.includes('DELETED') || action.includes('deleted')) return { icon: 'delete', type: 'user' };
    if (action.includes('UPDATED') || action.includes('updated')) return { icon: 'edit', type: 'user' };
    return { icon: 'info', type: 'info' };
  }

  formatActivityAction(log: AuditLog): string {
    const actionMap: Record<string, string> = {
      'order.approve': 'Approved order',
      'order.decline': 'Declined order',
      'order.deliver': 'Marked order delivered',
      'STAFF_PIN_RESET': 'Reset staff PIN',
      'WAITER_CREATED': 'Created waiter account',
      'SUPERVISOR_CREATED': 'Created supervisor account',
      'PROFILE_UPDATED': 'Updated profile',
      'USER_DEACTIVATED': 'Deactivated user',
      'USER_DELETED': 'Deleted user',
      'SUPERVISOR_DELETED': 'Deleted supervisor',
    };
    const prefix = actionMap[log.action] || log.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const entityInfo = log.entityType ? ` (${log.entityType})` : '';
    return `${prefix}${entityInfo}`;
  }

  openApproveModal(order: Order) {
    if (this.isProcessingAction()) return;
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
        return { department: selectedDept, estimatedPreparationTimeSeconds: selectedTime * 60 };
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.isProcessingAction.set(true);
        this.ordersApi.approveOrder(order.id, result.value).subscribe({
          next: () => {
            this.isProcessingAction.set(false);
            Swal.fire({ icon: 'success', title: 'Approved', text: 'Order has been approved and sent to preparation.', timer: 1500, showConfirmButton: false, background: '#1A1A1A', color: '#fff' });
            this.pendingOrders.update(list => list.filter(o => o.id !== order.id));
            this.loadPreparing();
            
          },
          error: (err) => {
            this.isProcessingAction.set(false);
            showApiErrorToast(err, 'Failed to approve order');
          }
        });
      }
    });
  }

  openDeclineModal(order: Order) {
    if (this.isProcessingAction()) return;
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
        this.isProcessingAction.set(true);
        this.ordersApi.declineOrder(order.id, result.value).subscribe({
          next: () => {
            this.isProcessingAction.set(false);
            Swal.fire({ icon: 'info', title: 'Declined', text: 'Order has been declined.', timer: 1500, showConfirmButton: false, background: '#1A1A1A', color: '#fff' });
            this.pendingOrders.update(list => list.filter(o => o.id !== order.id));
            
          },
          error: (err) => {
            this.isProcessingAction.set(false);
            showApiErrorToast(err, 'Failed to decline order');
          }
        });
      }
    });
  }

  deliverOrder(order: Order) {
    if (this.isProcessingAction()) return;
    Swal.fire({
      title: 'Mark as Delivered?',
      text: `Confirm that this order has been delivered to Table ${this.getTableLabel(order)}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delivered',
      confirmButtonColor: '#f97316',
      cancelButtonText: 'Cancel',
      background: '#1A1A1A',
      color: '#fff',
    }).then(result => {
      if (result.isConfirmed) {
        this.isProcessingAction.set(true);
        this.ordersApi.deliverOrder(order.id).subscribe({
          next: () => {
            this.isProcessingAction.set(false);
            Swal.fire({ icon: 'success', title: 'Delivered', text: 'Order marked as delivered.', timer: 1500, showConfirmButton: false, background: '#1A1A1A', color: '#fff' });
            this.readyOrders.update(list => list.filter(o => o.id !== order.id));
            
          },
          error: (err) => {
            this.isProcessingAction.set(false);
            showApiErrorToast(err, 'Failed to mark order as delivered');
          }
        });
      }
    });
  }

  viewOrderTimeline(order: Order) {
    const tableNum = this.getTableLabel(order);
    Swal.fire({
      title: `Order Timeline — Table ${tableNum}`,
      html: '<div id="timeline-content" style="text-align:left;color:#ccc;min-height:60px;">Loading...</div>',
      showConfirmButton: false,
      showCloseButton: true,
      background: '#1A1A1A',
      color: '#fff',
      didOpen: () => {
        this.auditApi.list({ entity_type: 'order', entity_id: order.id, limit: 50 }).subscribe({
          next: (res: any) => {
            const el = document.getElementById('timeline-content');
            if (!el) return;
            const logs = Array.isArray(res) ? res : (res.data || []);
            if (logs.length === 0) {
              el.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">No activity recorded for this order.</div>';
              return;
            }
            el.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px;">' +
              logs.map((log: any) => `
                <div style="display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,0.03);">
                  <span style="font-size:18px;">${this.getTimelineIcon(log.action)}</span>
                  <div style="flex:1;">
                    <div style="font-size:13px;font-weight:500;color:#e0e0e0;">${this.formatActionName(log.action)}</div>
                    <div style="font-size:11px;color:#888;margin-top:2px;">${this.formatActivityTime(log.createdAt)}</div>
                  </div>
                </div>
              `).join('') +
              '</div>';
          },
          error: () => {
            const el = document.getElementById('timeline-content');
            if (el) el.innerHTML = '<div style="text-align:center;padding:20px;color:#e57373;">Failed to load timeline.</div>';
          }
        });
      }
    });
  }

  private formatActionName(action: string): string {
    const map: Record<string, string> = {
      'order.approve': 'Approved',
      'order.decline': 'Declined',
      'order.deliver': 'Delivered',
    };
    return map[action] || action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private getTimelineIcon(action: string): string {
    if (action.includes('approve')) return '✅';
    if (action.includes('decline')) return '❌';
    if (action.includes('deliver')) return '📦';
    return '📝';
  }
}
