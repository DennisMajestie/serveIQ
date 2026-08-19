import { Component, AfterViewInit, ElementRef, ViewChild, Inject, PLATFORM_ID, Signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService, Theme } from '../core/theme.service';

interface FoodParticle {
  angle: number;
  radius: number;
  size: number;
  hue: number;
  sat: number;
  light: number;
  delay: number;
}

interface TableDef {
  id: number;
  col: number;
  row: number;
  pairId: number;
  baseX: number;
  baseY: number;
  targetX: number;
  targetY: number;
  foods: FoodParticle[];
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements AfterViewInit {
  @ViewChild('luxuryCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  theme!: Signal<Theme>;

  mobileMenuOpen = false;
  openFaq: number | null = 0;
  activeShowcaseTab = 0;

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }

  setShowcaseTab(index: number): void {
    this.activeShowcaseTab = index;
  }

  leaks = [
    {
      icon: 'edit_off',
      title: 'Bill edits before payment',
      desc: 'Prices quietly changed on checks at the last second — a classic walkout-style leak that never appears on reports.',
      amount: '960'
    },
    {
      icon: 'restaurant',
      title: 'Voided orders',
      desc: 'Meals served, then voided after the fact. Food leaves the kitchen, but nothing reaches the till.',
      amount: '2,100'
    },
    {
      icon: 'payments',
      title: 'Cash vs. card gaps',
      desc: 'Cash collected at the table rarely matches recorded sales. The difference disappears with the shift.',
      amount: '1,400'
    },
    {
      icon: 'currency_exchange',
      title: 'Refund frequency',
      desc: 'The same cashier or waiter refunding again and again — sometimes for orders that were never paid for.',
      amount: '780'
    },
    {
      icon: 'person_off',
      title: 'Unassigned orders',
      desc: 'Food served with no waiter on record means no one owns the table — and no one answers for the money.',
      amount: '1,150'
    },
    {
      icon: 'inventory_2',
      title: 'Inventory shrinkage',
      desc: 'Stock consumed with no matching order. Portioning, theft, or waste — invisible until ServeIQ ties it to orders.',
      amount: '890'
    }
  ];

  showcaseTabs = [
    {
      id: 'catch',
      icon: 'sensors',
      label: 'Catch',
      title: 'Catch leaks the moment they happen',
      desc: 'Every suspicious action — a bill edited three times, a refund spike, cash that doesn\u2019t match — is flagged instantly to the right person.',
      points: [
        'Real-time alerts, not end-of-month surprises',
        'Thresholds tuned to your floor',
        'Alerts routed to owner, manager, or shift lead'
      ],
      rows: [
        { icon: 'edit_calendar', label: 'Table 7 bill edited 3 times before payment', meta: '2 min ago · Waiter #402', value: '$84', status: 'Caught', state: 'danger' },
        { icon: 'person_off', label: 'Same cashier processed 5 refunds today', meta: 'Today · Cashier #118', value: '5×', status: 'Flagged', state: 'warn' },
        { icon: 'account_balance_wallet', label: 'Cash exceeds recorded sales', meta: 'Shift close · Branch A', value: '$212', status: 'Flagged', state: 'warn' },
        { icon: 'verified', label: 'All other orders reconciled', meta: 'Last 60 min', value: '$3,410', status: 'Secure', state: 'ok' }
      ]
    },
    {
      id: 'trace',
      icon: 'history',
      label: 'Trace',
      title: 'Every action has an owner',
      desc: 'Edits, voids, refunds, and discounts carry a high-resolution timestamp and the staff member who did it. No more guessing who to ask.',
      points: [
        'Full audit trail per action',
        'Instant staff attribution',
        'Disputes settle in seconds'
      ],
      rows: [
        { icon: 'edit_note', label: 'Bill edit', meta: 'Waiter #402 · John D. · 14:32:08', value: '-$12', status: 'Tracked', state: 'warn' },
        { icon: 'delete', label: 'Order void', meta: 'Waiter #211 · Ada O. · 13:05:44', value: '-$36', status: 'Tracked', state: 'warn' },
        { icon: 'sell', label: 'Discount applied', meta: 'Manager · K. Smith · 12:18:03', value: '-$8', status: 'Tracked', state: 'info' },
        { icon: 'receipt_long', label: 'Order closed', meta: 'Waiter #402 · John D. · 14:31:59', value: '$210', status: 'Tracked', state: 'ok' }
      ]
    },
    {
      id: 'recover',
      icon: 'savings',
      label: 'Recover',
      title: 'Close the shift with the till on the books',
      desc: 'Shift-close reports reconcile cash, cards, and recorded sales — so discrepancies are caught before they become losses.',
      points: [
        'Cash vs. recorded sales checks',
        'Refund & void anomaly alerts',
        'Discrepancy detection at shift close'
      ],
      rows: [
        { icon: 'account_balance_wallet', label: 'Cash reconciled', meta: 'Branch A · Night shift', value: '$4,220', status: 'Matched', state: 'ok' },
        { icon: 'credit_card', label: 'Card payments reconciled', meta: 'Branch A · Night shift', value: '$2,190', status: 'Matched', state: 'ok' },
        { icon: 'warning', label: 'Cash gap flagged', meta: 'Branch B · Day shift', value: '-$145', status: 'Escalated', state: 'danger' },
        { icon: 'savings', label: 'Recovered this month', meta: 'All branches', value: '$1,900', status: 'Protected', state: 'ok' }
      ]
    }
  ];

  features = [
    {
      icon: 'lock',
      title: 'One waiter, one table',
      desc: 'Enforce strict table ownership. No more staff disputes over tables or confusion during peak hours.',
      points: ['Table locking to assigned servers', 'No double-ordering, ever', 'Fair shift distribution']
    },
    {
      icon: 'history',
      title: 'Every action, on record',
      desc: 'Transparency at every touchpoint. Every edit, void, or discount is logged instantly with the staff member\'s name.',
      points: ['High-resolution timestamps', 'Full audit trail per action', 'Instant staff attribution']
    },
    {
      icon: 'mobile_friendly',
      title: 'Your restaurant, in your pocket',
      desc: 'Freedom from the floor. Monitor live sales, staff performance, and inventory alerts from your mobile device.',
      points: ['Live sales anywhere', 'Staff performance tracking', 'Inventory alerts in real time']
    },
    {
      icon: 'account_balance',
      title: 'Cash & card reconciliation',
      desc: 'Shift-close reports that catch discrepancies before they hit your bottom line.',
      points: ['Cash vs. recorded sales checks', 'Refund frequency alerts', 'Shift-close discrepancy detection']
    },
    {
      icon: 'group',
      title: 'Staff performance analytics',
      desc: 'Spot top performers and flag anomalies. Know exactly who drives sales — and who leaks them.',
      points: ['Per-waiter sales breakdown', 'Void & refund anomaly alerts', 'Ranked performance dashboards']
    },
    {
      icon: 'inventory_2',
      title: 'Inventory without the guesswork',
      desc: 'Track stock movements tied to real orders so shrinkage is caught the moment it happens.',
      points: ['Order-linked stock tracking', 'Shrinkage detection alerts', 'Live inventory levels']
    }
  ];

  steps = [
    {
      icon: 'settings',
      title: 'Connect your floor',
      desc: 'Import your menu, tables, and staff in minutes. No hardware or training marathon required.'
    },
    {
      icon: 'monitor_heart',
      title: 'Go live & monitor',
      desc: 'Orders, payments, and staff actions flow through one system you can watch from anywhere.'
    },
    {
      icon: 'savings',
      title: 'Recover your revenue',
      desc: 'Get flagged on leakage as it happens — edits, voids, refunds, and cash gaps — and fix it instantly.'
    }
  ];

  testimonials = [
    {
      quote: 'We found $1.2M in lost revenue in our first month. The refund and void alerts alone paid for the subscription ten times over.',
      name: 'Adaeze Okonkwo',
      role: 'Owner, Naija Grills Lekki',
      color: '#4be277'
    },
    {
      quote: 'No more arguing over who took which table. The one-table-one-waiter lock ended every shift dispute we had.',
      name: 'Kunle Adeyemi',
      role: 'GM, Lagos Bistro Co.',
      color: '#93ccff'
    },
    {
      quote: 'I run two branches from my phone now. Cash reconciliation at shift close finally lines up with what\'s in the till.',
      name: 'Tunde Bakare',
      role: 'Director, Suya Republic',
      color: '#adc6ff'
    }
  ];

  plans = [
    {
      name: 'Starter',
      price: '49',
      tagline: 'For single-location restaurants getting a grip on leakage.',
      features: ['1 branch', '10 staff seats', 'Table ownership & audit trail', 'Shift-close reports', 'Email support'],
      cta: 'Start free trial',
      featured: false
    },
    {
      name: 'Growth',
      price: '99',
      tagline: 'For growing operations that want full revenue visibility.',
      features: ['3 branches', 'Unlimited staff seats', 'Everything in Starter', 'Live revenue monitoring', 'Refund & void anomaly alerts', 'Priority support'],
      cta: 'Start free trial',
      featured: true
    },
    {
      name: 'Enterprise',
      price: 'Let\'s talk',
      tagline: 'For multi-brand groups with custom needs.',
      features: ['Unlimited branches', 'Custom roles & permissions', 'Everything in Growth', 'Dedicated success manager', 'API access & SSO', 'On-site onboarding'],
      cta: 'Contact sales',
      featured: false
    }
  ];

  faqs = [
    {
      question: 'How fast can I set up ServeIQ?',
      answer: 'Most restaurants go live in under an hour. Import your menu and staff, assign tables, and you\'re operating on the same shift. No dedicated hardware needed — it runs on the devices your team already uses.'
    },
    {
      question: 'Does ServeIQ work with our existing POS?',
      answer: 'Yes. ServeIQ layers on top of your current setup, reconciling cash, cards, and recorded sales at shift close. You keep your hardware; we bring the visibility and audit trail.'
    },
    {
      question: 'What counts as "leakage" that ServeIQ catches?',
      answer: 'Anything that moves money off your books: bill edits before payment, voids, refunds, cash collected vs. recorded sales, and orders that never reach a till. Each gets flagged to the right person instantly.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Every action is logged with a timestamp and staff attribution, and access is locked down by role-based permissions. Your data is encrypted in transit and at rest.'
    }
  ];

  alerts = [
    { icon: 'edit_calendar', color: 'tertiary', title: 'Table 7 bill edited 3 times before payment', desc: 'Potential bill splitting manipulation' },
    { icon: 'person_off', color: 'amber', title: 'Same cashier processed 5 refunds today', desc: 'Unusual refund frequency threshold exceeded' },
    { icon: 'account_balance_wallet', color: 'tertiary', title: 'Cash collected exceeds recorded sales by $212', desc: 'Discrepancy detected at Shift Close' },
    { icon: 'cancel_presentation', color: 'primary', title: 'One waiter voids far more orders than the rest of the floor', desc: 'Performance anomaly: Waiter ID #402 (John D.)' }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private themeService: ThemeService
  ) {
    this.theme = themeService.theme;
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initRestaurantScene();
      this.initIntersectionObserver();
    }
  }

  private initRestaurantScene() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    let W = window.innerWidth, H = window.innerHeight;
    let scrollProgress = 0;
    const self = this;

    const themeColors = () => {
      const dark = self.theme() === 'dark';
      return {
        floor: dark ? '#0a0a0f' : '#eef1f8',
        floorGrid: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)',
        tableInactive: dark ? '#1e1e2a' : '#dfe5f2',
        text: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.25)',
        seat: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)',
        seatStroke: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
      };
    };

    const hex = this.themeService.getCssVar('--primary') || '#4be277';
    const rr = parseInt(hex.slice(1, 3), 16);
    const gg = parseInt(hex.slice(3, 5), 16);
    const bb = parseInt(hex.slice(5, 7), 16);

    const gridCols = isMobile ? 2 : 4;
    const gridRows = isMobile ? 2 : 3;

    const tables: TableDef[] = [];
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const id = r * gridCols + c;
        const foods: FoodParticle[] = [];
        const count = isMobile ? 3 : 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < count; i++) {
          foods.push({
            angle: (i / count) * Math.PI * 2 + Math.random() * 0.3,
            radius: 6 + Math.random() * 10,
            size: 2.5 + Math.random() * 3.5,
            hue: 15 + Math.random() * 45,
            sat: 65 + Math.random() * 35,
            light: 45 + Math.random() * 35,
            delay: Math.random() * 0.4,
          });
        }
        tables.push({
          id,
          col: c,
          row: r,
          pairId: c % 2 === 0 && c < gridCols - 1 ? id + 1 : (c % 2 === 1 ? id - 1 : -1),
          baseX: 0, baseY: 0,
          targetX: 0, targetY: 0,
          foods,
        });
      }
    }

    const ambientCount = isMobile ? 20 : 50;
    const ambientParticles: AmbientParticle[] = [];
    for (let i = 0; i < ambientCount; i++) {
      ambientParticles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        hue: 120 + Math.random() * 60,
      });
    }

    let frame = 0;

    function layout() {
      const marginX = W * 0.12;
      const marginY = H * 0.18;
      const spacingX = (W - marginX * 2) / (gridCols - 1 || 1);
      const spacingY = (H - marginY * 2) / (gridRows - 1 || 1);
      for (const t of tables) {
        t.baseX = marginX + t.col * spacingX;
        t.baseY = marginY + t.row * spacingY;
        t.targetX = t.baseX;
        t.targetY = t.baseY;
      }
    }

    function resize() {
      W = canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      H = canvas.height = window.innerHeight;
      layout();
      for (const p of ambientParticles) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
      }
    }

    window.addEventListener('resize', resize);

    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    function easeInOutCubic(t: number): number {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function drawFloor() {
      const c = themeColors();
      ctx!.fillStyle = c.floor;
      ctx!.fillRect(0, 0, W, H);

      const tileSize = 48;
      ctx!.strokeStyle = c.floorGrid;
      ctx!.lineWidth = 1;
      for (let x = 0; x < W; x += tileSize) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, H);
        ctx!.stroke();
      }
      for (let y = 0; y < H; y += tileSize) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(W, y);
        ctx!.stroke();
      }

      const grad = ctx!.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
      grad.addColorStop(0, `rgba(${rr},${gg},${bb},0.04)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);
    }

    function drawConnections(phase: number) {
      for (const t of tables) {
        if (t.pairId < 0) continue;
        const partner = tables[t.pairId];
        if (!partner || t.id > partner.id) continue;

        const midX = (t.targetX + partner.targetX) / 2;
        const midY = (t.targetY + partner.targetY) / 2;

        if (phase < 0.01) continue;

        const lineWidth = phase * 3;
        const alpha = phase * 0.4;

        for (let i = 0; i < 3; i++) {
          const offset = (frame * 0.02 + i * 0.33) % 1;
          const lx = t.targetX + (partner.targetX - t.targetX) * offset;
          const ly = t.targetY + (partner.targetY - t.targetY) * offset;

          const glowGrad = ctx!.createRadialGradient(lx, ly, 0, lx, ly, 12 * phase);
          glowGrad.addColorStop(0, `rgba(${rr},${gg},${bb},${alpha * 0.6})`);
          glowGrad.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
          ctx!.fillStyle = glowGrad;
          ctx!.beginPath();
          ctx!.arc(lx, ly, 12 * phase, 0, Math.PI * 2);
          ctx!.fill();
        }

        ctx!.strokeStyle = `rgba(${rr},${gg},${bb},${alpha})`;
        ctx!.lineWidth = lineWidth;
        ctx!.setLineDash([8, 12]);
        ctx!.lineDashOffset = -frame * 0.5;
        ctx!.beginPath();
        ctx!.moveTo(t.targetX, t.targetY);
        ctx!.lineTo(partner.targetX, partner.targetY);
        ctx!.stroke();
        ctx!.setLineDash([]);

        const pulseGrad = ctx!.createRadialGradient(midX, midY, 0, midX, midY, 30 * phase);
        pulseGrad.addColorStop(0, `rgba(${rr},${gg},${bb},${phase * 0.15})`);
        pulseGrad.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
        ctx!.fillStyle = pulseGrad;
        ctx!.beginPath();
        ctx!.arc(midX, midY, 30 * phase, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawTable(t: TableDef, phase: number) {
      const tableW = 52;
      const tableH = 36;
      const x = t.targetX - tableW / 2;
      const y = t.targetY - tableH / 2;

      const glowRadius = 40 + phase * 10;
      const glowGrad = ctx!.createRadialGradient(t.targetX, t.targetY, 0, t.targetX, t.targetY, glowRadius);
      glowGrad.addColorStop(0, `rgba(${rr},${gg},${bb},${0.08 + phase * 0.12})`);
      glowGrad.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
      ctx!.fillStyle = glowGrad;
      ctx!.beginPath();
      ctx!.arc(t.targetX, t.targetY, glowRadius, 0, Math.PI * 2);
      ctx!.fill();

      const c = themeColors();
      ctx!.fillStyle = phase > 0.3
        ? `rgb(${Math.min(255, rr + 40)}, ${Math.min(255, gg + 40)}, ${Math.min(255, bb + 40)})`
        : c.tableInactive;
      ctx!.strokeStyle = `rgba(${rr},${gg},${bb},${0.3 + phase * 0.4})`;
      ctx!.lineWidth = 1.5;
      self.roundRect(ctx!, x, y, tableW, tableH, 6);
      ctx!.fill();
      ctx!.stroke();

      const innerGrad = ctx!.createLinearGradient(x, y, x, y + tableH);
      innerGrad.addColorStop(0, `rgba(255,255,255,0.06)`);
      innerGrad.addColorStop(1, `rgba(0,0,0,0.1)`);
      ctx!.fillStyle = innerGrad;
      self.roundRect(ctx!, x + 2, y + 2, tableW - 4, tableH - 4, 4);
      ctx!.fill();

      ctx!.fillStyle = c.text;
      ctx!.font = '8px "Plus Jakarta Sans", sans-serif';
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillText(`T${t.id + 1}`, t.targetX, t.targetY + 12);

      const seatRadius = 4;
      const seatDistance = Math.max(tableW, tableH) / 2 + 8;
      for (let s = 0; s < 4; s++) {
        const sa = (s / 4) * Math.PI * 2 + Math.PI / 4;
        const sx = t.targetX + Math.cos(sa) * seatDistance;
        const sy = t.targetY + Math.sin(sa) * seatDistance;
        ctx!.beginPath();
        ctx!.arc(sx, sy, seatRadius, 0, Math.PI * 2);
        ctx!.fillStyle = c.seat;
        ctx!.fill();
        ctx!.strokeStyle = c.seatStroke;
        ctx!.lineWidth = 0.5;
        ctx!.stroke();
      }
    }

    function drawFood(t: TableDef, phase: number) {
      if (!t.foods.length) return;
      const partner = t.pairId >= 0 ? tables[t.pairId] : null;
      const pCenterX = partner ? partner.targetX : t.targetX;
      const pCenterY = partner ? partner.targetY : t.targetY;

      for (const food of t.foods) {
        const restX = t.targetX + Math.cos(food.angle) * food.radius;
        const restY = t.targetY - 4 + Math.sin(food.angle) * food.radius;

        const v = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
        const raw = Math.max(0, Math.min(1, (v - food.delay) / (1 - food.delay)));
        const travel = easeInOutCubic(raw);

        const fx = restX + (pCenterX - restX) * travel;
        const fy = restY + (pCenterY - restY) * travel;

        ctx!.beginPath();
        ctx!.arc(fx, fy, food.size, 0, Math.PI * 2);
        ctx!.fillStyle = `hsl(${food.hue}, ${food.sat}%, ${food.light}%)`;
        ctx!.fill();

        if (travel > 0.01) {
          const trailGrad = ctx!.createRadialGradient(fx, fy, 0, fx, fy, food.size * 2.5);
          trailGrad.addColorStop(0, `hsla(${food.hue}, ${food.sat}%, ${food.light}%, 0.2)`);
          trailGrad.addColorStop(1, `hsla(${food.hue}, ${food.sat}%, ${food.light}%, 0)`);
          ctx!.fillStyle = trailGrad;
          ctx!.beginPath();
          ctx!.arc(fx, fy, food.size * 2.5, 0, Math.PI * 2);
          ctx!.fill();

          ctx!.beginPath();
          ctx!.arc(restX, restY, food.size * 0.4, 0, Math.PI * 2);
          ctx!.fillStyle = `hsla(${food.hue}, ${food.sat}%, ${food.light}%, ${0.1 + travel * 0.2})`;
          ctx!.fill();
        }
      }
    }

    function drawAmbient(phase: number) {
      for (const p of ambientParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        const pulse = 0.6 + 0.4 * Math.sin(frame * 0.02 + p.x * 0.01 + p.y * 0.01);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue}, 60%, 70%, ${p.alpha * pulse * (0.5 + phase * 0.5)})`;
        ctx!.fill();
      }
    }

    const animate = () => {
      frame++;
      ctx!.clearRect(0, 0, W, H);

      const rawPhase = Math.sin(scrollProgress * Math.PI);
      const phase = Math.max(0, Math.min(1, rawPhase));

      drawFloor();

      for (const t of tables) {
        if (t.pairId >= 0 && t.pairId < tables.length) {
          const partner = tables[t.pairId];
          if (partner) {
            const midX = (t.baseX + partner.baseX) / 2;
            const midY = (t.baseY + partner.baseY) / 2;
            const eased = easeInOutCubic(phase);
            t.targetX = t.baseX + (midX - t.baseX) * eased;
            t.targetY = t.baseY + (midY - t.baseY) * eased;
          }
        }
      }

      drawConnections(phase);

      for (const t of tables) {
        drawTable(t, phase);
      }

      for (let pass = 0; pass < 2; pass++) {
        for (const t of tables) {
          if (pass === 0) {
            const partner = t.pairId >= 0 ? tables[t.pairId] : null;
            if (!partner || t.id < partner.id) drawFood(t, phase);
          } else {
            const partner = t.pairId >= 0 ? tables[t.pairId] : null;
            if (partner && t.id > partner.id) drawFood(t, phase);
          }
        }
      }

      drawAmbient(phase);

      if (!prefersReducedMotion && !document.hidden) {
        requestAnimationFrame(animate);
      }
    };

    resize();
    onScroll();

    animate();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private initIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.feature-card, .step-card, .testimonial-card, .plan-card, .leak-card').forEach(card => observer.observe(card));
  }
}