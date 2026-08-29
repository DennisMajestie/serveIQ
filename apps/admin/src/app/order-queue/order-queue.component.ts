import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrdersApiService, DepartmentsApiService, TablesApiService, ShiftsApiService, UserApiService, AuditApiService, BillsApiService } from '@serveiq/shared/data-access';
import { OrderGroup, Department, Table, Shift, User, AuditLog } from '@serveiq/shared/models';
import Swal from 'sweetalert2';
import { interval, Subscription } from 'rxjs';
import { CurrencyContextService } from '../core/currency-context.service';
import { ThemeService } from '../core/theme.service';

type QueueTab = 'pending' | 'preparing' | 'ready' | 'cash';

@Component({
  selector: 'app-order-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './order-queue.component.html',
  styleUrl: './order-queue.component.scss'
})
export class OrderQueueComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private ordersApi = inject(OrdersApiService);
  private departmentsApi = inject(DepartmentsApiService);
  private tablesApi = inject(TablesApiService);
  private shiftsApi = inject(ShiftsApiService);
  private userApi = inject(UserApiService);
  private auditApi = inject(AuditApiService);
  private billsApi = inject(BillsApiService);
  private currency = inject(CurrencyContextService);
  private themeService = inject(ThemeService);

  activeTab = signal<QueueTab>('pending');

  pendingOrders = signal<OrderGroup[]>([]);
  preparingOrders = signal<OrderGroup[]>([]);
  readyOrders = signal<OrderGroup[]>([]);
  cashOrders = signal<OrderGroup[]>([]);

  isLoadingPending = signal(false);
  isLoadingPreparing = signal(false);
  isLoadingReady = signal(false);
  isLoadingCash = signal(false);
  isProcessingAction = signal(false);
  isRefreshing = signal(false);
  isDarkMode = signal(this.themeService.theme() === 'dark');

  private cashProcessingTabId = signal<string | null>(null);

  departments = signal<Department[]>([]);
  tables = signal<Table[]>([]);
  currentShift = signal<Shift | null>(null);
  waiters = signal<User[]>([]);

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

  constructor() {
    effect(() => {
      this.isDarkMode.set(this.themeService.theme() === 'dark');
    });
  }

  ngOnInit() {
    this.loadAll();
    this.pollSub = interval(15000).subscribe(() => {
      this.loadPending();
      this.loadPreparing();
      this.loadReady();
      this.loadCash();
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
    this.router.navigate(['/app/dashboard']);
  }

  refreshAll() {
    this.isRefreshing.set(true);
    this.loadAll();
    setTimeout(() => this.isRefreshing.set(false), 1000);
  }

  switchTab(tab: QueueTab) {
    this.activeTab.set(tab);
    if (tab === 'pending') this.loadPending();
    else if (tab === 'preparing') this.loadPreparing();
    else if (tab === 'ready') this.loadReady();
    else if (tab === 'cash') this.loadCash();
  }

  private loadAll() {
    this.loadPending();
    this.loadPreparing();
    this.loadReady();
    this.loadCash();
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
      error: () => this.departments.set([]),
    });
  }

  loadTables() {
    this.tablesApi.getAllTables().subscribe({
      next: (tables) => this.tables.set(tables || []),
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

  loadCash() {
    this.isLoadingCash.set(true);
    this.ordersApi.getPendingCash().subscribe({
      next: (orders) => { this.cashOrders.set(orders || []); this.isLoadingCash.set(false); },
      error: () => this.isLoadingCash.set(false)
    });
  }

  getTableStatusClass(table: Table): string {
    const status = table.status || 'available';

    const groups = [
      ...this.pendingOrders(),
      ...this.preparingOrders(),
      ...this.readyOrders(),
      ...this.cashOrders(),
    ];
    const match = groups.find(g =>
      g.tableId === table.id || g.tableNumber === table.tableNumber
    );
    if (match) {
      const firstItem = match.items[0];
      return `${status} has-${this.getOrderStatusClass(firstItem?.orderStatus || '')}`;
    }
    return status;
  }

  private getOrderStatusClass(status: string): string {
    if (status === 'PENDING_SUPERVISOR_APPROVAL') return 'pending';
    if (status === 'PENDING_PAYMENT_APPROVAL') return 'pending';
    if (status === 'PREPARING' || status === 'APPROVED' || status === 'ASSIGNED_TO_DEPARTMENT') return 'preparing';
    if (status === 'READY_FOR_PICKUP') return 'ready';
    return status.toLowerCase();
  }

  getTableOrderStatus(table: Table): string | null {
    const groups = [
      ...this.pendingOrders(),
      ...this.preparingOrders(),
      ...this.readyOrders(),
      ...this.cashOrders(),
    ];
    const match = groups.find(g =>
      g.tableId === table.id || g.tableNumber === table.tableNumber
    );
    if (!match) return null;
    const firstItem = match.items[0];
    return this.getOrderStatusClass(firstItem?.orderStatus || '');
  }

  getTableLabel(group: OrderGroup): string {
    if (group.tabType === 'takeaway') return 'Takeaway';
    return group.tableNumber || '—';
  }

  getWaiterLabel(group: OrderGroup): string {
    if (this.isSelfService(group)) return 'Self-service';
    return group.waiterName || 'Unknown Waiter';
  }

  /** A self-service group has no waiter — the tab was opened by the customer
   *  via QR (waiter_id is null). Those orders are closed by the customer
   *  confirming pickup themselves; the supervisor doesn't need to act. */
  isSelfService(group: OrderGroup): boolean {
    return !group.waiterId;
  }

  getTableTooltip(table: Table): string {
    const status = table.status || 'available';
    const groups = [
      ...this.pendingOrders(),
      ...this.preparingOrders(),
      ...this.readyOrders(),
      ...this.cashOrders(),
    ];
    const match = groups.find(g =>
      g.tableId === table.id || g.tableNumber === table.tableNumber
    );
    if (match) {
      const firstItem = match.items[0];
      return `Table ${table.tableNumber} — ${(firstItem?.orderStatus || '').replace(/_/g, ' ')}`;
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
    return this.currency.formatKobo(kobo);
  }

  encodeURI(name: string): string {
    return encodeURIComponent(name || 'U');
  }

  private getRemainingSecondsRaw(timerEndsAt: string): number {
    const end = new Date(timerEndsAt).getTime();
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  }

  getRemainingSeconds(group: OrderGroup): number {
    if (!group.timerEndsAt) return 0;
    return this.getRemainingSecondsRaw(group.timerEndsAt);
  }

  formatCountdown(group: OrderGroup): string {
    const secs = this.getRemainingSeconds(group);
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


  private processingGroupId = signal<string | null>(null);
  private groupProgress = signal<{ total: number; completed: number; failed: boolean; errorMessage?: string } | null>(null);

  private async executeSequentially(
    group: OrderGroup,
    action: 'approve' | 'decline' | 'deliver',
    getBody?: (itemId: string) => any,
  ): Promise<void> {
    if (this.processingGroupId() === group.tabId + group.createdAt) return;
    this.processingGroupId.set(group.tabId + group.createdAt);
    this.groupProgress.set({ total: group.items.length, completed: 0, failed: false });

    const remaining = group.items.filter(i => !i._actionDone);
    const toProcess = remaining.length > 0 ? remaining : group.items;
    let completed = 0;

    for (let i = 0; i < toProcess.length; i++) {
      const item = toProcess[i];
      if (item._actionDone) continue;

      const current = group.items.filter(x => x._actionDone).length;
      this.groupProgress.set({ total: group.items.length, completed: current, failed: false });

      try {
        const body = getBody ? getBody(item.id) : undefined;
        if (action === 'approve') {
          await this.ordersApi.approveOrder(item.id, body).toPromise();
        } else if (action === 'decline') {
          await this.ordersApi.declineOrder(item.id, body).toPromise();
        } else {
          await this.ordersApi.deliverOrder(item.id).toPromise();
        }
        item._actionDone = true;
        completed++;
      } catch (err: any) {
        this.groupProgress.set({
          total: group.items.length,
          completed: group.items.filter(x => x._actionDone).length,
          failed: true,
          errorMessage: err?.error?.message || err?.message || 'An error occurred',
        });
        this.processingGroupId.set(null);
        return;
      }
    }

    this.groupProgress.set({ total: group.items.length, completed: group.items.length, failed: false });
    this.processingGroupId.set(null);

    if (action === 'approve') {
      this.pendingOrders.update(list => list.filter(g => g.tabId !== group.tabId || g.createdAt !== group.createdAt));
    } else if (action === 'deliver') {
      this.readyOrders.update(list => list.filter(g => g.tabId !== group.tabId || g.createdAt !== group.createdAt));
    }
  }

  retryGroup(group: OrderGroup) {
    const remaining = group.items.filter(i => !i._actionDone);
    if (remaining.length === 0) return;
    const progress = this.groupProgress();
    if (progress?.failed) {
      this.groupProgress.set(null);
    }
  }

  get processingGroup(): boolean {
    return this.processingGroupId() !== null;
  }

  isProcessingGroup(group: OrderGroup): boolean {
    return this.processingGroupId() === group.tabId + group.createdAt;
  }

  getGroupProgressText(group: OrderGroup): string {
    const p = this.groupProgress();
    if (!p || this.processingGroupId() !== group.tabId + group.createdAt) return '';
    if (p.failed) {
      return `Failed at ${p.completed + 1} of ${p.total} — ${p.errorMessage || ''}`;
    }
    return `Processing ${p.completed + 1} of ${p.total}...`;
  }

  getGroupProgress(group: OrderGroup): { completed: number; total: number; failed: boolean; errorMessage?: string } | null {
    if (this.processingGroupId() !== group.tabId + group.createdAt) return null;
    return this.groupProgress();
  }

  openApproveModal(group: OrderGroup) {
    if (this.isProcessingAction() || this.isProcessingGroup(group)) return;
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
        const body = result.value;
        this.executeSequentially(group, 'approve', () => body).finally(() => {
          this.isProcessingAction.set(false);
          this.loadPreparing();
        });
      }
    });
  }

  openDeclineModal(group: OrderGroup) {
    if (this.isProcessingAction() || this.isProcessingGroup(group)) return;
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
        const body = result.value;
        this.executeSequentially(group, 'decline', () => body).finally(() => {
          this.isProcessingAction.set(false);
          this.pendingOrders.update(list => list.filter(g => g.tabId !== group.tabId || g.createdAt !== group.createdAt));
        });
      }
    });
  }

  confirmPickup(group: OrderGroup) {
    if (this.isProcessingAction() || this.isProcessingGroup(group)) return;
    Swal.fire({
      title: 'Confirm Waiter Pickup?',
      text: `Has the waiter collected the order for Table ${this.getTableLabel(group)}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Picked Up',
      confirmButtonColor: '#22c55e',
      cancelButtonText: 'Cancel',
      background: '#1A1A1A',
      color: '#fff',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.isProcessingAction.set(true);
      const items = group.items.filter(i => !i._actionDone);
      let completed = 0;
      items.forEach(item => {
        this.ordersApi.confirmPickup(item.id).subscribe({
          next: () => {
            item._actionDone = true;
            completed++;
            if (completed === items.length) {
              this.isProcessingAction.set(false);
              this.readyOrders.update(list => list.filter(g => g.tabId !== group.tabId || g.createdAt !== group.createdAt));
            }
          },
          error: (err) => {
            this.isProcessingAction.set(false);
            Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to confirm pickup' });
          }
        });
      });
    });
  }

  confirmCashPayment(group: OrderGroup) {
    if (this.isProcessingAction() || this.isProcessingGroup(group) || this.isCashProcessing(group)) return;
    const amount = group.billTotalKobo ?? group.totalKobo ?? 0;
    Swal.fire({
      title: 'Confirm Cash Payment?',
      html: `<div style="text-align:left;font-size:14px;color:#ccc;">
        <p style="margin:0 0 8px;">Table <strong>${this.getTableLabel(group)}</strong> has chosen to pay cash at the counter.</p>
        <p style="margin:0;">Expected amount: <strong style="color:#22c55e;">${this.formatKobo(amount)}</strong></p>
        <p style="margin:8px 0 0;font-size:12px;color:#888;">Confirming records the cash payment and sends the held order to the kitchen for approval.</p>
      </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Confirm Cash',
      confirmButtonColor: '#22c55e',
      cancelButtonText: 'Cancel',
      background: '#1A1A1A',
      color: '#fff',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.cashProcessingTabId.set(group.tabId);
      this.billsApi.confirmCash(group.tabId).subscribe({
        next: () => {
          this.cashProcessingTabId.set(null);
          Swal.fire({
            icon: 'success',
            title: 'Payment Confirmed',
            text: 'Cash received — the order has been sent to the kitchen.',
            background: '#1A1A1A',
            color: '#fff',
            confirmButtonColor: '#22c55e',
          });
          this.cashOrders.update(list => list.filter(g => g.tabId !== group.tabId || g.createdAt !== group.createdAt));
          this.loadPending();
          this.loadPreparing();
        },
        error: (err) => {
          this.cashProcessingTabId.set(null);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Failed to confirm cash payment',
            background: '#1A1A1A',
            color: '#fff',
          });
        }
      });
    });
  }

  isCashProcessing(group: OrderGroup): boolean {
    return this.cashProcessingTabId() === group.tabId;
  }

  viewOrderTimeline(group: OrderGroup) {
    const tableNum = this.getTableLabel(group);
    const groupIds = group.items.map(i => i.id);
    Swal.fire({
      title: `Order Timeline — Table ${tableNum}`,
      html: '<div id="timeline-content" style="text-align:left;color:#ccc;min-height:60px;">Loading...</div>',
      showConfirmButton: false,
      showCloseButton: true,
      background: '#1A1A1A',
      color: '#fff',
      didOpen: () => {
        this.auditApi.list({ entity_type: 'order', entity_id: groupIds[0], limit: 50 }).subscribe({
          next: (res: any) => {
            const el = document.getElementById('timeline-content');
            if (!el) return;
            const logs = Array.isArray(res) ? res : (res.data || []);
            const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c);
            if (logs.length === 0) {
              el.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">No activity recorded for this order.</div>';
              return;
            }
            el.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px;">' +
              logs.map((log: any) => `
                <div style="display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,0.03);">
                  <span style="font-size:18px;">${esc(this.getTimelineIcon(log.action))}</span>
                  <div style="flex:1;">
                    <div style="font-size:13px;font-weight:500;color:#e0e0e0;">${esc(this.formatActionName(log.action))}</div>
                    <div style="font-size:11px;color:#888;margin-top:2px;">${esc(this.formatActivityTime(log.createdAt))}</div>
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