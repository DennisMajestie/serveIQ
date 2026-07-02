import { Component, OnInit, OnDestroy, inject, signal, computed, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BillsApiService, TablesApiService } from '@serveiq/shared/data-access';
import { OrderItem, Table } from '@serveiq/shared/models';

interface ConfettiParticle { x: number; y: number; r: number; color: string; d: number; tilt: number; tiltAngle: number; }

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt.component.html',
  styleUrls: ['./receipt.component.scss']
})
export class ReceiptComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private billsApi = inject(BillsApiService);
  private tableService = inject(TablesApiService);

  tabId = signal('');
  receipt = signal<any>(null);
  table = signal<Table | null>(null);
  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');

  businessName = computed(() => this.receipt()?.business?.name ?? 'ServeIQ');
  branchName = computed(() => this.receipt()?.branch?.name ?? '');
  waiterName = computed(() => this.receipt()?.waiter?.fullName ?? this.receipt()?.waiter?.fullName ?? 'Waiter');
  paymentMethod = computed(() => {
    const method = this.receipt()?.bill?.paymentMethod ?? '';
    return method ? method.charAt(0).toUpperCase() + method.slice(1) : '—';
  });
  paymentTerminal = computed(() => this.receipt()?.terminal?.label ?? '');
  amountPaid = computed(() => (this.receipt()?.bill?.totalKobo ?? 0) / 100);
  subtotalNaira = computed(() => (this.receipt()?.bill?.subtotalKobo ?? 0) / 100);
  serviceChargeNaira = computed(() => (this.receipt()?.bill?.serviceChargeKobo ?? 0) / 100);
  discountNaira = computed(() => (this.receipt()?.bill?.discountKobo ?? 0) / 100);
  total = computed(() => (this.receipt()?.bill?.totalKobo ?? 0) / 100);
  vatNaira = computed(() => Math.round((this.receipt()?.bill?.subtotalKobo ?? 0) * 0.075) / 100);
  receiptNumber = computed(() => this.receipt()?.receiptNumber ?? '—');
  date = computed(() => this.receipt()?.bill?.paidAt ? new Date(this.receipt()!.bill!.paidAt!).toLocaleString() : new Date().toLocaleString());
  tableNumber = computed(() => this.table()?.tableNumber ?? this.receipt()?.tab?.tableId ?? '—');
  transactionId = computed(() => this.receipt()?.bill?.id ?? '—');

  items = computed<OrderItem[]>(() => {
    const orders = this.receipt()?.orders ?? [];
    return orders.map((o: any) => ({
      ...o,
      menuItemName: o.menuItemName || o.menuItem?.name || '',
      priceKobo: o.priceKobo || o.unitPriceKobo || 0,
      quantity: o.quantity || o.qty || 1,
    }));
  });

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: ConfettiParticle[] = [];
  private animationId: number | null = null;
  private colors = ['#f97316', '#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#facc15'];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tabId.set(id);
        this.billsApi.getReceipt(id).subscribe({
          next: (r) => { 
            this.receipt.set(r); 
            this.isLoading.set(false);
            if (r?.tab?.tableId) {
              this.tableService.getTable(r.tab.tableId).subscribe({
                next: (table) => this.table.set(table)
              });
            }
          },
          error: (err) => {
            this.isLoading.set(false);
            this.hasError.set(true);
            if (err?.status === 404) {
              this.errorMessage.set('No receipt found for this order. The bill may not have been paid yet.');
            } else {
              this.errorMessage.set('Failed to load receipt. Please try again.');
            }
          }
        });
      }
    });
  }

  ngAfterViewInit() { this.initConfetti(); }
  ngOnDestroy() { this.stopConfetti(); }

  goToTables() { this.router.navigate(['/tables']); }
  printReceipt() { window.print(); }
  whatsAppReceipt() {
    const text = `ServeIQ Receipt #${this.receiptNumber()}\nTotal: ₦${this.total().toLocaleString()}\nDate: ${this.date()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  private initConfetti() {
    this.canvas = document.getElementById('confettiCanvas') as HTMLCanvasElement;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.launchConfetti();
  }

  private resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private launchConfetti() {
    if (!this.canvas) return;
    for (let i = 0; i < 200; i++) {
      this.particles.push({ x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height - this.canvas.height, r: Math.random() * 8 + 4, color: this.colors[Math.floor(Math.random() * this.colors.length)], d: Math.random() * 10 + 5, tilt: Math.random() * 10 - 5, tiltAngle: 0 });
    }
    this.animate();
    setTimeout(() => this.stopConfetti(), 5000);
  }

  private animate() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const p of this.particles) {
      p.tiltAngle += 0.1; p.y += p.d; p.tilt = Math.sin(p.tiltAngle) * 15;
      this.ctx.beginPath(); this.ctx.lineWidth = p.r; this.ctx.strokeStyle = p.color;
      this.ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      this.ctx.lineTo(p.x + p.tilt - p.r / 2, p.y + p.tilt + p.r / 2);
      this.ctx.stroke();
    }
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private stopConfetti() {
    if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
  }
}
