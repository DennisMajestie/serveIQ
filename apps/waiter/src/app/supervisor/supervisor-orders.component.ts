import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrdersApiService, DepartmentsApiService, TablesApiService, TabsApiService, ShiftsApiService, UserApiService, showApiErrorToast, AuthService } from '@serveiq/shared/data-access';
import { Order, Department, Table, Shift, User, Tab } from '@serveiq/shared/models';
import Swal from 'sweetalert2';
import { interval, Subscription, forkJoin } from 'rxjs';

type QueueTab = 'pending' | 'preparing' | 'ready';

interface JournalEntry {
  id: string;
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-waiter-supervisor-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="supervisor-dashboard">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Order Management</h1>
          <p class="subtitle">Supervisor Workflow — Approve, track, and fulfill orders</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="goBack()">
            <span class="material-symbols-outlined">arrow_back</span>
            <span class="btn-label">Back</span>
          </button>
          <button class="btn btn-outline" (click)="logout()">
            <span class="material-symbols-outlined">logout</span>
            <span class="btn-label">Logout</span>
          </button>
          <button class="btn btn-outline" (click)="refreshAll()" [disabled]="isRefreshing()">
            <span class="material-symbols-outlined">{{ isRefreshing() ? 'sync' : 'refresh' }}</span>
            <span class="btn-label">Refresh</span>
          </button>
        </div>
      </div>

      <!-- Live Summary Bar -->
      <div class="summary-bar">
        <div class="stat-card pending-stat">
          <div class="stat-value">{{ pendingOrders().length }}</div>
          <div class="stat-label">Pending</div>
          <div class="stat-icon"><span class="material-symbols-outlined">hourglass_empty</span></div>
        </div>
        <div class="stat-card preparing-stat">
          <div class="stat-value">{{ preparingOrders().length }}</div>
          <div class="stat-label">In Progress</div>
          <div class="stat-icon"><span class="material-symbols-outlined">cooking</span></div>
        </div>
        <div class="stat-card ready-stat">
          <div class="stat-value">{{ readyOrders().length }}</div>
          <div class="stat-label">Ready</div>
          <div class="stat-icon"><span class="material-symbols-outlined">checklist</span></div>
        </div>
        <div class="stat-card time-stat">
          <div class="stat-value">{{ avgApprovalTime() }}</div>
          <div class="stat-label">Avg Approval</div>
          <div class="stat-icon"><span class="material-symbols-outlined">speed</span></div>
        </div>
      </div>

      <!-- Two-Column Widgets -->
      <div class="widgets-row">
        <!-- Table Floor Map -->
        <div class="widget table-map-widget">
          <div class="widget-header">
            <h2><span class="material-symbols-outlined">table_restaurant</span> Table Floor Map</h2>
            <span class="widget-subtitle">{{ tables().length }} tables</span>
          </div>
          <div class="table-grid">
            @for (table of tables(); track table.id) {
              <div class="table-cell" [class]="getTableStatusClass(table)" [title]="getTableTooltip(table)">
                <span class="table-number">{{ table.tableNumber }}</span>
                <span class="table-cap">{{ table.capacity }}p</span>
                @if (getTableOrderStatus(table)) {
                  <span class="table-order-dot" [class]="'dot-' + getTableOrderStatus(table)"></span>
                }
              </div>
            } @empty {
              <div class="no-tables">No tables loaded</div>
            }
          </div>
        </div>

        <!-- Shift Snapshot -->
        <div class="widget shift-widget">
          <div class="widget-header">
            <h2><span class="material-symbols-outlined">schedule</span> Shift Snapshot</h2>
            <span class="widget-subtitle" *ngIf="currentShift() as shift">{{ shift.status | titlecase }}</span>
          </div>
          <ng-container *ngIf="currentShift() as shift; else noShift">
            <div class="shift-info">
              <div class="shift-row">
                <span class="shift-label">Opened</span>
                <span class="shift-value">{{ shift.openedAt | date:'short' }}</span>
              </div>
              <div class="shift-row">
                <span class="shift-label">Duration</span>
                <span class="shift-value">{{ getShiftDuration(shift) }}</span>
              </div>
              <div class="shift-row">
                <span class="shift-label">Starting Cash</span>
                <span class="shift-value">{{ formatKobo(shift.startingCashKobo) }}</span>
              </div>
              <div class="shift-divider"></div>
              <div class="shift-row">
                <span class="shift-label">Waiters On Duty</span>
                <span class="shift-value highlight">{{ waitersOnDuty().length }}</span>
              </div>
              <div class="waiter-avatars">
                @for (w of waitersOnDuty().slice(0, 8); track w.id) {
                  <div class="waiter-avatar" [title]="w.fullName">
                    <img [src]="w.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURI(w.fullName) + '&background=F97316&color=fff&size=32'" alt="">
                  </div>
                }
                @if (waitersOnDuty().length > 8) {
                  <div class="waiter-avatar more">+{{ waitersOnDuty().length - 8 }}</div>
                }
              </div>
            </div>
          </ng-container>
          <ng-template #noShift>
            <div class="shift-empty">
              <span class="material-symbols-outlined">sleep</span>
              <p>No active shift</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Queue Tabs -->
      <div class="queue-section">
        <div class="queue-tabs">
          <button class="queue-tab" [class.active]="activeTab() === 'pending'" (click)="switchTab('pending')">
            <span class="material-symbols-outlined">hourglass_empty</span>
            Pending
            @if (pendingOrders().length > 0) {
              <span class="badge">{{ pendingOrders().length }}</span>
            }
          </button>
          <button class="queue-tab" [class.active]="activeTab() === 'preparing'" (click)="switchTab('preparing')">
            <span class="material-symbols-outlined">cooking</span>
            In Progress
            @if (preparingOrders().length > 0) {
              <span class="badge">{{ preparingOrders().length }}</span>
            }
          </button>
          <button class="queue-tab" [class.active]="activeTab() === 'ready'" (click)="switchTab('ready')">
            <span class="material-symbols-outlined">checklist</span>
            Ready
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
                    <button class="btn btn-approve" [disabled]="isProcessingAction()" (click)="openApproveModal(order)">
                      <span class="material-symbols-outlined">check_circle</span>
                      {{ isProcessingAction() ? 'Working...' : 'Approve' }}
                    </button>
                    <button class="btn btn-decline" [disabled]="isProcessingAction()" (click)="openDeclineModal(order)">
                      <span class="material-symbols-outlined">cancel</span>
                      {{ isProcessingAction() ? 'Working...' : 'Decline' }}
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

        <!-- Ready Queue -->
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
                    <button class="btn btn-deliver" [disabled]="isProcessingAction()" (click)="deliverOrder(order)">
                      <span class="material-symbols-outlined">task_alt</span>
                      {{ isProcessingAction() ? 'Working...' : 'Mark Delivered' }}
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>

      <!-- Service Journal -->
      <div class="widget journal-widget">
        <div class="widget-header">
          <h2><span class="material-symbols-outlined">edit_note</span> Service Journal</h2>
          <span class="widget-subtitle">{{ journalEntries().length }} entries</span>
        </div>
        <div class="journal-input-row">
          <input
            type="text"
            [(ngModel)]="journalText"
            (keydown.enter)="addJournalEntry()"
            placeholder="Log an incident or note e.g. Table 4 sent back steak..."
            class="journal-input"
          >
          <button class="btn btn-journal" (click)="addJournalEntry()" [disabled]="!journalText.trim()">
            <span class="material-symbols-outlined">add</span>
          </button>
        </div>
        <div class="journal-list">
          @for (entry of journalEntries(); track entry.id) {
            <div class="journal-entry">
              <div class="journal-bullet"></div>
              <div class="journal-body">
                <p class="journal-text">{{ entry.text }}</p>
                <span class="journal-time">{{ formatJournalTime(entry.timestamp) }}</span>
              </div>
              <button class="journal-delete" (click)="deleteJournalEntry(entry.id)" title="Delete">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          } @empty {
            <div class="journal-empty">
              <span class="material-symbols-outlined">note_add</span>
              <p>No entries yet. Log service incidents or handover notes here.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      --secondary: #575e70;
      --on-primary-container: #582200;
      --primary-container: #f97316;
      --on-secondary-container: #5c6274;
      --background: #f9f9ff;
      --surface: #f9f9ff;
      --on-background: #151c27;
      --on-surface: #151c27;
      --surface-container-low: #f0f3ff;
      --surface-container-high: #e2e8f8;
      --outline-variant: #e0c0b1;
      --on-surface-variant: #584237;
      --on-primary: #ffffff;
      --on-primary-container: #582200;
      --surface-container-lowest: #ffffff;
      --error: #ba1a1a;
      --primary: #9d4300;
    }
    [data-theme="dark"] {
      --primary: #4be277;
      --on-primary: #003915;
      --primary-container: rgba(75, 226, 119, 0.15);
      --on-primary-container: #4be277;
      --secondary: #adc6ff;
      --on-secondary-container: #adc6ff;
      --background: #020617;
      --on-background: #dce1fb;
      --surface: #0f172a;
      --on-surface: #dce1fb;
      --surface-container-low: #0a1022;
      --surface-container-high: #1a2235;
      --surface-container-lowest: #020617;
      --outline-variant: #2a3550;
      --on-surface-variant: rgba(188, 203, 185, 0.4);
      --error: #ffb4ab;
    }
    .material-symbols-outlined { font-size: 20px; vertical-align: middle; }

    .supervisor-dashboard {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .page-header h1 { font-size: 24px; font-weight: 700; margin: 0 0 4px; }
    .subtitle { color: var(--secondary); font-size: 14px; margin: 0; }
    .header-actions { display: flex; gap: 8px; }
    .btn-outline {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 10px;
      border: 1px solid var(--outline-variant);
      background: var(--surface); color: var(--on-surface);
      font-size: 13px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: all 0.2s;
    }
    .btn-outline:hover { background: var(--surface-container-high); }
    .btn-outline:disabled { opacity: 0.6; cursor: wait; }
    .btn-label { display: inline; }

    /* Summary Bar */
    .summary-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      position: relative;
      background: var(--surface);
      border: 1px solid var(--outline-variant);
      border-radius: 16px;
      padding: 20px;
      overflow: hidden;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 13px;
      color: var(--secondary);
      font-weight: 500;
    }
    .stat-icon {
      position: absolute;
      right: 16px;
      top: 16px;
      opacity: 0.15;
    }
    .stat-icon .material-symbols-outlined { font-size: 40px; }
    .pending-stat .stat-value { color: #f59e0b; }
    .preparing-stat .stat-value { color: #22c55e; }
    .ready-stat .stat-value { color: #3b82f6; }
    .time-stat .stat-value { color: #a855f7; }

    /* Widgets */
    .widgets-row {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 16px;
      margin-bottom: 20px;
    }
    .widget {
      background: var(--surface);
      border: 1px solid var(--outline-variant);
      border-radius: 16px;
      padding: 20px;
    }
    .widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .widget-header h2 {
      font-size: 15px;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .widget-header h2 .material-symbols-outlined { color: var(--primary-container); font-size: 20px; }
    .widget-subtitle { font-size: 12px; color: var(--secondary); }

    /* Table Floor Map */
    .table-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
      gap: 8px;
    }
    .table-cell {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px 6px;
      border-radius: 10px;
      border: 2px solid var(--outline-variant);
      background: var(--surface-container-low);
      cursor: default;
      transition: all 0.2s;
      min-height: 56px;
    }
    .table-cell:hover { transform: scale(1.05); }
    .table-number { font-size: 13px; font-weight: 700; line-height: 1; }
    .table-cap { font-size: 9px; color: var(--secondary); margin-top: 2px; }
    .table-order-dot {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-pending { background: #f59e0b; box-shadow: 0 0 4px #f59e0b; }
    .dot-preparing { background: #22c55e; box-shadow: 0 0 4px #22c55e; }
    .dot-ready { background: #3b82f6; box-shadow: 0 0 4px #3b82f6; }
    .table-cell.occupied { border-color: #f59e0b; background: rgba(245,158,11,0.08); }
    .table-cell.available { border-color: var(--outline-variant); }
    .table-cell.reserved { border-color: #a855f7; background: rgba(168,85,247,0.08); }
    .table-cell.has-pending { border-color: #f59e0b; box-shadow: 0 0 0 1px #f59e0b; }
    .table-cell.has-preparing { border-color: #22c55e; }
    .table-cell.has-ready { border-color: #3b82f6; }
    .no-tables { grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--secondary); font-size: 13px; }

    /* Shift Snapshot */
    .shift-info { display: flex; flex-direction: column; gap: 8px; }
    .shift-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
    .shift-label { color: var(--secondary); }
    .shift-value { font-weight: 600; }
    .shift-value.highlight { color: var(--primary-container); font-size: 18px; }
    .shift-divider { height: 1px; background: var(--outline-variant); margin: 4px 0; }
    .waiter-avatars { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
    .waiter-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      overflow: hidden; border: 2px solid var(--surface);
    }
    .waiter-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .waiter-avatar.more {
      display: flex; align-items: center; justify-content: center;
      background: var(--surface-container-high); font-size: 10px;
      font-weight: 700; color: var(--secondary);
    }
    .shift-empty {
      display: flex; flex-direction: column; align-items: center;
      padding: 24px; color: var(--secondary); text-align: center;
    }
    .shift-empty .material-symbols-outlined { font-size: 36px; opacity: 0.4; margin-bottom: 8px; }
    .shift-empty p { margin: 0; font-size: 13px; }

    /* Queue Tabs */
    .queue-section {
      background: var(--surface);
      border: 1px solid var(--outline-variant);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .queue-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .queue-tab {
      padding: 10px 16px;
      border-radius: 10px;
      border: 1px solid var(--outline-variant);
      background: transparent;
      color: var(--on-surface);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      font-family: inherit;
      white-space: nowrap;
    }
    .queue-tab .material-symbols-outlined { font-size: 18px; }
    .queue-tab.active {
      border-color: var(--primary-container);
      color: var(--primary-container);
      background: rgba(249,115,22,0.08);
    }
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

    /* Order Cards */
    .order-list { display: flex; flex-direction: column; gap: 12px; }
    .order-card {
      background: var(--surface-container-low);
      border: 1px solid var(--outline-variant);
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
    .order-card.preparing { border-color: rgba(34,197,94,0.3); }
    .order-card.ready { border-color: rgba(249,115,22,0.3); }

    /* Buttons */
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
    .btn:disabled { opacity: 0.7; cursor: wait; transform: none; }
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

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      text-align: center;
      color: var(--secondary);
    }
    .empty-state .material-symbols-outlined { font-size: 48px; margin-bottom: 12px; opacity: 0.5; }
    .empty-state h3 { font-size: 16px; font-weight: 600; margin: 0 0 6px; color: var(--on-surface); }
    .empty-state p { font-size: 13px; margin: 0; }

    /* Service Journal */
    .journal-widget { margin-bottom: 24px; }
    .journal-input-row {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    .journal-input {
      flex: 1;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid var(--outline-variant);
      background: var(--surface-container-low);
      color: var(--on-surface);
      font-size: 13px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    .journal-input:focus { border-color: var(--primary-container); }
    .journal-input::placeholder { color: var(--secondary); opacity: 0.6; }
    .btn-journal {
      flex: none;
      width: 44px; height: 44px;
      padding: 0;
      border-radius: 10px;
      border: none;
      background: var(--primary-container);
      color: var(--on-primary-container);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-journal:hover { opacity: 0.9; }
    .btn-journal:disabled { opacity: 0.5; cursor: not-allowed; }
    .journal-list { display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto; }
    .journal-entry {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--surface-container-low);
      transition: background 0.2s;
    }
    .journal-entry:hover { background: var(--surface-container-high); }
    .journal-bullet {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--primary-container);
      margin-top: 6px;
      flex-shrink: 0;
    }
    .journal-body { flex: 1; min-width: 0; }
    .journal-text { margin: 0; font-size: 13px; line-height: 1.4; word-wrap: break-word; }
    .journal-time { font-size: 11px; color: var(--secondary); }
    .journal-delete {
      flex: none;
      width: 24px; height: 24px;
      border: none;
      background: transparent;
      color: var(--secondary);
      cursor: pointer;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all 0.2s;
    }
    .journal-entry:hover .journal-delete { opacity: 1; }
    .journal-delete:hover { background: rgba(239,68,68,0.15); color: #ef4444; }
    .journal-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      color: var(--secondary);
      text-align: center;
    }
    .journal-empty .material-symbols-outlined { font-size: 32px; opacity: 0.4; margin-bottom: 8px; }
    .journal-empty p { margin: 0; font-size: 13px; }

    .loading-shimmer {
      height: 100px;
      border-radius: 16px;
      margin-bottom: 12px;
      background: linear-gradient(90deg, var(--surface-container-low) 25%, var(--surface-container-high) 50%, var(--surface-container-low) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* === Mobile Responsive === */
    @media (max-width: 768px) {
      .supervisor-dashboard { padding: 12px; }
      .page-header h1 { font-size: 20px; }
      .btn-label { display: none; }
      .summary-bar { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 14px; }
      .stat-value { font-size: 24px; }
      .stat-icon { right: 10px; top: 10px; }
      .stat-icon .material-symbols-outlined { font-size: 28px; }
      .widgets-row { grid-template-columns: 1fr; }
      .table-grid { grid-template-columns: repeat(auto-fill, minmax(52px, 1fr)); gap: 6px; }
      .table-cell { min-height: 44px; padding: 8px 4px; }
      .table-number { font-size: 11px; }
      .table-cap { font-size: 8px; }
      .queue-section { padding: 12px; }
      .queue-tabs { gap: 4px; }
      .queue-tab { padding: 8px 12px; font-size: 12px; }
      .queue-tab .material-symbols-outlined { font-size: 16px; }
      .order-card { padding: 12px; }
      .order-card-actions { flex-direction: column; }
      .btn { height: 40px; font-size: 13px; }
    }
    @media (max-width: 480px) {
      .summary-bar { grid-template-columns: repeat(2, 1fr); }
      .stat-value { font-size: 20px; }
      .table-grid { grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 4px; }
      .table-cell { min-height: 36px; padding: 6px 2px; }
      .table-number { font-size: 10px; }
      .table-cap { display: none; }
      .table-order-dot { width: 6px; height: 6px; top: 2px; right: 2px; }
    }
  `]
})
export class SupervisorOrdersComponent implements OnInit, OnDestroy {
  private ordersApi = inject(OrdersApiService);
  private departmentsApi = inject(DepartmentsApiService);
  private tablesApi = inject(TablesApiService);
  private tabsApi = inject(TabsApiService);
  private shiftsApi = inject(ShiftsApiService);
  private userApi = inject(UserApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  activeTab = signal<QueueTab>('pending');

  pendingOrders = signal<Order[]>([]);
  preparingOrders = signal<Order[]>([]);
  readyOrders = signal<Order[]>([]);

  isLoadingPending = signal(false);
  isLoadingPreparing = signal(false);
  isLoadingReady = signal(false);
  isProcessingAction = signal(false);
  isRefreshing = signal(false);

  departments = signal<Department[]>([]);
  tables = signal<Table[]>([]);
  tabs = signal<Tab[]>([]);
  currentShift = signal<Shift | null>(null);
  waiters = signal<User[]>([]);

  journalText = '';
  journalEntries = signal<JournalEntry[]>([]);

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
    this.loadAll();
    this.loadJournalFromStorage();
    this.pollSub = interval(15000).subscribe(() => {
      this.loadPending();
      this.loadPreparing();
      this.loadReady();
      this.loadTables();
      this.loadShift();
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

  formatJournalTime(date: Date): string {
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  addJournalEntry() {
    const text = this.journalText.trim();
    if (!text) return;
    const entry: JournalEntry = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      text,
      timestamp: new Date(),
    };
    this.journalEntries.update(entries => [entry, ...entries]);
    this.journalText = '';
    this.saveJournalToStorage();
  }

  deleteJournalEntry(id: string) {
    this.journalEntries.update(entries => entries.filter(e => e.id !== id));
    this.saveJournalToStorage();
  }

  private STORAGE_KEY = 'serveiq_supervisor_journal';

  private saveJournalToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.journalEntries()));
    } catch {}
  }

  private loadJournalFromStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const entries = JSON.parse(raw) as JournalEntry[];
        this.journalEntries.set(entries);
      }
    } catch {}
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
        return { departmentId: selectedDept, estimatedTime: selectedTime };
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
            this.addJournalEntryText(`Approved order for Table ${order.tab?.table?.tableNumber || order.tab?.tableId || '—'} (${order.items?.length || 0} items)`);
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
            this.addJournalEntryText(`Declined order for Table ${order.tab?.table?.tableNumber || order.tab?.tableId || '—'} — ${result.value.declineReason}`);
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
        this.isProcessingAction.set(true);
        this.ordersApi.deliverOrder(order.id).subscribe({
          next: () => {
            this.isProcessingAction.set(false);
            Swal.fire({ icon: 'success', title: 'Delivered', text: 'Order marked as delivered.', timer: 1500, showConfirmButton: false, background: '#1A1A1A', color: '#fff' });
            this.readyOrders.update(list => list.filter(o => o.id !== order.id));
            this.addJournalEntryText(`Delivered order to Table ${order.tab?.table?.tableNumber || order.tab?.tableId || '—'}`);
          },
          error: (err) => {
            this.isProcessingAction.set(false);
            showApiErrorToast(err, 'Failed to mark order as delivered');
          }
        });
      }
    });
  }

  private addJournalEntryText(text: string) {
    const entry: JournalEntry = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      text,
      timestamp: new Date(),
    };
    this.journalEntries.update(entries => [entry, ...entries]);
    this.saveJournalToStorage();
  }
}
