import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyContextService } from '../../services/currency-context.service';
import { OfflineDataService } from '../../services/offline-data.service';

interface ConfettiParticle { x: number; y: number; r: number; color: string; d: number; tilt: number; tiltAngle: number; }

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private offlineData = inject(OfflineDataService);
  private currency = inject(CurrencyContextService);

  businessName = localStorage.getItem('businessName') || 'ServeIQ';
  tabId = signal('');
  amountPaid = signal<number | null>(null);
  isLoading = signal(true);

  currencySymbol = computed(() => this.currency.getSymbol());
  currencyCode = computed(() => this.currency.getCode());

  private terminalLabel = '';
  private splitAllocations: Array<{ guest: number; amountKobo: number }> = [];

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: ConfettiParticle[] = [];
  private animationId: number | null = null;
  private colors = ['#f97316', '#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#facc15'];

  ngOnInit() {
    const navState = history.state as any;
    this.terminalLabel = navState?.terminalLabel ?? '';
    if (navState?.splitAllocations) {
      this.splitAllocations = navState.splitAllocations;
    }
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tabId.set(id);
        this.loadBill(id);
      }
    });
  }

  private loadBill(tabId: string) {
    this.offlineData.getBill(tabId).subscribe({
      next: (b) => {
        if (b) this.amountPaid.set((b.totalKobo ?? 0) / 100);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  formatAmount(amount: number): string {
    return this.currency.formatPlain(amount);
  }

  viewReceipt() {
    this.router.navigate(['/tabs/receipt', this.tabId()], {
      state: {
        terminalLabel: this.terminalLabel,
        showConfetti: false,
        splitAllocations: this.splitAllocations,
      }
    });
  }

  goToTables() {
    this.router.navigate(['/tables']);
  }

  ngAfterViewInit() { this.initConfetti(); }
  ngOnDestroy() { this.stopConfetti(); }

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