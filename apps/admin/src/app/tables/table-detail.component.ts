import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

interface OrderItem {
  name: string;
  notes?: string;
  qty: number;
  unitPrice: number;
  icon: string;
}

@Component({
  selector: 'app-table-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-content">
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-title-section">
          <button class="icon-btn" routerLink="/tables">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 class="page-title">{{ tableTitle() }}</h2>
          <span class="status-badge open">
            <span class="status-dot"></span>
            Open Status
          </span>
        </div>
        <div class="page-actions">
          <button class="page-action-btn">
            <span class="material-symbols-outlined">history</span>
            View History
          </button>
          <button class="page-action-btn">
            <span class="material-symbols-outlined">edit</span>
            Edit Table
          </button>
        </div>
      </div>

      <!-- Two Column Grid -->
      <div class="grid-layout">
        <!-- Left Column - Order -->
        <div class="column left">
          <div class="order-card">
            <div class="card-header">
              <h3 class="card-title">Current Order</h3>
              <button class="add-item-btn">
                <span class="material-symbols-outlined">add</span>
                Add Item
              </button>
            </div>
            <div class="table-wrapper">
              <table class="order-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="table-row" *ngFor="let item of orderItems(); let i = index">
                    <td>
                      <div class="item-cell">
                        <div class="item-icon">
                          <span class="material-symbols-outlined">{{ item.icon }}</span>
                        </div>
                        <div class="item-details">
                          <p class="item-name">{{ item.name }}</p>
                          <p class="item-notes" *ngIf="item.notes">{{ item.notes }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="text-center">{{ item.qty }}</td>
                    <td class="text-right">₦{{ item.unitPrice.toLocaleString('en-US', {minimumFractionDigits: 2}) }}</td>
                    <td class="text-right total">₦{{ (item.qty * item.unitPrice).toLocaleString('en-US', {minimumFractionDigits: 2}) }}</td>
                    <td class="text-center">
                      <button class="delete-btn">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Column - Summary -->
        <div class="column right">
          <div class="summary-card">
            <div class="card-header">
              <h3 class="card-title">Order Summary</h3>
            </div>
            <div class="summary-content">
              <div class="summary-row">
                <span class="label">Subtotal</span>
                <span class="value">₦{{ subtotal().toLocaleString('en-US', {minimumFractionDigits: 2}) }}</span>
              </div>
              <div class="summary-row">
                <span class="label">VAT (7.5%)</span>
                <span class="value">₦{{ vat().toLocaleString('en-US', {minimumFractionDigits: 2}) }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Service Charge</span>
                <span class="value">₦{{ serviceCharge().toLocaleString('en-US', {minimumFractionDigits: 2}) }}</span>
              </div>
              <div class="summary-row total">
                <span class="label">Total Amount</span>
                <span class="value">₦{{ totalAmount().toLocaleString('en-US', {minimumFractionDigits: 2}) }}</span>
              </div>
            </div>
            <div class="summary-footer">
              <button class="close-tab-btn">Close Tab</button>
              <button class="print-bill-btn">Print Bill</button>
            </div>
          </div>
          <button class="void-btn">
            <span class="material-symbols-outlined">cancel</span>
            Void Order
          </button>
        </div>
      </div>

      <!-- Footer -->
      <footer class="page-footer">
        <div class="footer-left">
          <span class="material-symbols-outlined">schedule</span>
          <span>Opened by Sarah J. • 42 Minutes ago</span>
        </div>
        <div class="footer-right">
          RestoAdmin v2.4.1 • Server Node 04
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      background: var(--background);
      color: var(--on-surface);
      font-family: 'Inter', sans-serif;
      --on-secondary-fixed: #141b2b;
      --on-surface: #151c27;
      --tertiary-container: #00a2f4;
      --error-container: #ffdad6;
      --surface: #f9f9ff;
      --on-primary-fixed-variant: #783200;
      --inverse-on-surface: #ebf1ff;
      --tertiary-fixed: #cde5ff;
      --background: #f9f9ff;
      --surface-container-highest: #dce2f3;
      --primary-fixed-dim: #ffb690;
      --on-background: #151c27;
      --surface-container-low: #f0f3ff;
      --on-tertiary-fixed-variant: #004b74;
      --primary-container: #f97316;
      --surface-container: #e7eefe;
      --on-error-container: #93000a;
      --on-primary-fixed: #341100;
      --on-tertiary-container: #003554;
      --on-error: #ffffff;
      --on-tertiary-fixed: #001d32;
      --on-primary: #ffffff;
      --surface-container-high: #e2e8f8;
      --on-secondary: #ffffff;
      --surface-container-lowest: #ffffff;
      --on-secondary-container: #5c6274;
      --surface-tint: #9d4300;
      --secondary: #575e70;
      --tertiary-fixed-dim: #93ccff;
      --surface-dim: #d3daea;
      --secondary-fixed-dim: #c0c6db;
      --outline: #8c7164;
      --inverse-surface: #2a313d;
      --on-tertiary: #ffffff;
      --on-surface-variant: #584237;
      --error: #ba1a1a;
      --tertiary: #006398;
      --outline-variant: #e0c0b1;
      --on-primary-container: #582200;
      --primary-fixed: #ffdbca;
      --secondary-container: #d9dff5;
      --primary: #9d4300;
      --surface-variant: #dce2f3;
      --surface-bright: #f9f9ff;
      --secondary-fixed: #dce2f7;
      --on-secondary-fixed-variant: #404758;
      --inverse-primary: #ffb690;
    }

    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      vertical-align: middle;
    }

    .page-content {
      padding: 32px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .page-title-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .page-title {
      font-size: 32px;
      line-height: 40px;
      font-weight: 700;
      margin: 0;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      line-height: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .status-badge.open {
      background: rgba(34, 197, 94, 0.1);
      color: rgb(21, 128, 61);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 9999px;
      background: rgb(34, 197, 94);
    }

    .page-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: var(--secondary);
      cursor: pointer;
      padding: 8px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;
    }

    .icon-btn:hover {
      background: var(--surface-container-high);
    }

    .page-action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: transparent;
      border: none;
      color: var(--secondary);
      font-size: 14px;
      line-height: 20px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .page-action-btn:hover {
      background: var(--surface-container-high);
    }

    .grid-layout {
      display: grid;
      grid-template-columns: 8fr 4fr;
      gap: 32px;
      align-items: flex-start;
    }

    .column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .order-card, .summary-card {
      background: var(--surface-container-lowest);
      border-radius: 16px;
      border: 1px solid var(--outline-variant);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--outline-variant);
      background: white;
    }

    .card-title {
      font-size: 18px;
      line-height: 28px;
      font-weight: 700;
      margin: 0;
    }

    .add-item-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(157, 67, 0, 0.05);
      color: var(--primary);
      border: 1px solid rgba(157, 67, 0, 0.2);
      border-radius: 8px;
      font-size: 14px;
      line-height: 20px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .add-item-btn:hover {
      background: rgba(157, 67, 0, 0.1);
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .order-table {
      width: 100%;
      border-collapse: collapse;
    }

    .order-table thead tr {
      background: var(--surface-container-low);
    }

    .order-table th {
      font-size: 14px;
      line-height: 20px;
      font-weight: 600;
      color: var(--secondary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 16px 24px;
      text-align: left;
    }

    .order-table th:nth-child(2),
    .order-table th:nth-child(5) {
      text-align: center;
    }

    .order-table th:nth-child(3),
    .order-table th:nth-child(4) {
      text-align: right;
    }

    .table-row {
      transition: all 0.2s ease;
    }

    .table-row:nth-child(even) {
      background: var(--surface);
    }

    .table-row:hover {
      background: rgba(249, 115, 22, 0.05);
      transform: translateX(4px);
    }

    .item-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .item-icon {
      width: 48px;
      height: 48px;
      background: var(--surface-container);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .item-icon .material-symbols-outlined {
      color: var(--primary);
      font-size: 24px;
    }

    .item-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-name {
      font-size: 16px;
      line-height: 24px;
      font-weight: 700;
      margin: 0;
    }

    .item-notes {
      font-size: 12px;
      line-height: 16px;
      color: var(--secondary);
      margin: 0;
    }

    .order-table td {
      padding: 20px 24px;
      font-size: 14px;
      line-height: 20px;
    }

    .text-center {
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
    }

    .text-right {
      text-align: right;
      font-family: 'JetBrains Mono', monospace;
    }

    .total {
      font-weight: 700;
    }

    .delete-btn {
      background: transparent;
      border: none;
      color: var(--secondary);
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s ease;
      padding: 4px;
    }

    .table-row:hover .delete-btn {
      opacity: 1;
    }

    .delete-btn:hover {
      color: var(--error);
    }

    .summary-content {
      padding: 24px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .summary-row:last-of-type {
      margin-bottom: 0;
    }

    .summary-row .label {
      font-size: 16px;
      line-height: 24px;
      font-weight: 400;
      color: var(--secondary);
    }

    .summary-row .value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      line-height: 20px;
      font-weight: 600;
    }

    .summary-row.total {
      padding-top: 16px;
      border-top: 1px solid var(--outline-variant);
      margin-top: 16px;
      align-items: flex-end;
    }

    .summary-row.total .label {
      font-size: 24px;
      line-height: 32px;
      font-weight: 700;
      color: var(--primary);
    }

    .summary-row.total .value {
      font-size: 24px;
      line-height: 32px;
      font-weight: 700;
      color: var(--on-surface);
    }

    .summary-footer {
      padding: 24px;
      background: var(--surface-container-low);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .close-tab-btn {
      width: 100%;
      height: 56px;
      background: var(--primary-container);
      color: var(--on-primary-container);
      border: none;
      border-radius: 12px;
      font-size: 16px;
      line-height: 24px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(157, 67, 0, 0.15);
    }

    .close-tab-btn:active {
      transform: scale(0.98);
    }

    .print-bill-btn {
      width: 100%;
      height: 56px;
      background: white;
      color: var(--primary);
      border: 2px solid var(--primary);
      border-radius: 12px;
      font-size: 16px;
      line-height: 24px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .print-bill-btn:hover {
      background: rgba(157, 67, 0, 0.05);
    }

    .print-bill-btn:active {
      transform: scale(0.98);
    }

    .void-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: transparent;
      color: var(--error);
      border: none;
      padding: 12px;
      font-size: 14px;
      line-height: 20px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .void-btn:hover {
      background: rgba(186, 26, 26, 0.1);
    }

    .page-footer {
      padding: 24px;
      margin-top: 32px;
      border-top: 1px solid var(--outline-variant);
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--secondary);
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      line-height: 20px;
    }

    .footer-right {
      font-size: 12px;
      line-height: 16px;
    }
  `]
})
export class TableDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);

  tableId = signal('5');
  customerName = signal('Alice');
  tableTitle = computed(() => `Table ${this.tableId()} — ${this.customerName()}`);

  orderItems = signal<OrderItem[]>([
    {
      name: 'Spicy Suya',
      notes: 'Extra onions, hot spice',
      qty: 2,
      unitPrice: 3500,
      icon: 'lunch_dining'
    },
    {
      name: 'Jollof Rice Special',
      notes: 'With fried plantain',
      qty: 1,
      unitPrice: 5500,
      icon: 'ramen_dining'
    },
    {
      name: 'Chapman',
      notes: 'Classic chilled',
      qty: 3,
      unitPrice: 2000,
      icon: 'local_bar'
    }
  ]);

  subtotal = computed(() => {
    const items = this.orderItems();
    return Array.isArray(items) ? items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0) : 0;
  });
  vat = computed(() => this.subtotal() * 0.075);
  serviceCharge = signal(0);
  totalAmount = computed(() => this.subtotal() + this.vat() + this.serviceCharge());

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tableId.set(id);
      }
    });
  }
}
