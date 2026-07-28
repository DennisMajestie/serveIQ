import { Component, AfterViewInit, ElementRef, ViewChild, Inject, PLATFORM_ID, HostBinding } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../core/theme.service';

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
  @HostBinding('attr.data-theme') theme = 'dark';
  @ViewChild('luxuryCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  features = [
    {
      icon: 'lock',
      title: 'One waiter, one table',
      desc: 'Enforce strict table ownership. No more staff disputes over tables or confusion during peak hours. Each table is locked to an assigned server.'
    },
    {
      icon: 'history',
      title: 'Every action, on record',
      desc: 'Transparency at every touchpoint. Every edit, void, or discount is logged instantly with the staff member\'s name and a high-resolution timestamp.'
    },
    {
      icon: 'mobile_friendly',
      title: 'Your restaurant, in your pocket',
      desc: 'Freedom from the floor. Monitor live sales, staff performance, and inventory alerts directly from your mobile device, anywhere in the world.'
    }
  ];

  alerts = [
    { icon: 'edit_calendar', color: 'tertiary', title: 'Table 7 bill edited 3 times before payment', desc: 'Potential bill splitting manipulation' },
    { icon: 'person_off', color: 'amber', title: 'Same cashier processed 5 refunds today', desc: 'Unusual refund frequency threshold exceeded' },
    { icon: 'account_balance_wallet', color: 'tertiary', title: 'Cash collected exceeds recorded sales by ₦12,400', desc: 'Discrepancy detected at Shift Close' },
    { icon: 'cancel_presentation', color: 'primary', title: 'One waiter voids far more orders than the rest of the floor', desc: 'Performance anomaly: Waiter ID #402 (John D.)' }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private themeService: ThemeService
  ) {}

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

    let W = window.innerWidth, H = window.innerHeight;
    let scrollProgress = 0;
    const self = this;

    const hex = this.themeService.getCssVar('--primary') || '#4be277';
    const rr = parseInt(hex.slice(1, 3), 16);
    const gg = parseInt(hex.slice(3, 5), 16);
    const bb = parseInt(hex.slice(5, 7), 16);

    const tables: TableDef[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const id = r * 4 + c;
        const foods: FoodParticle[] = [];
        const count = 5 + Math.floor(Math.random() * 5);
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
          pairId: c % 2 === 0 && c < 3 ? id + 1 : (c % 2 === 1 ? id - 1 : -1),
          baseX: 0, baseY: 0,
          targetX: 0, targetY: 0,
          foods,
        });
      }
    }

    const ambientParticles: AmbientParticle[] = [];
    for (let i = 0; i < 50; i++) {
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
      const spacingX = (W - marginX * 2) / 3;
      const spacingY = (H - marginY * 2) / 2;
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
      ctx!.fillStyle = '#0a0a0f';
      ctx!.fillRect(0, 0, W, H);

      const tileSize = 48;
      ctx!.strokeStyle = `rgba(255,255,255,0.02)`;
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

      ctx!.fillStyle = phase > 0.3
        ? `rgb(${Math.min(255, rr + 40)}, ${Math.min(255, gg + 40)}, ${Math.min(255, bb + 40)})`
        : '#1e1e2a';
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

      ctx!.fillStyle = `rgba(255,255,255,0.15)`;
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
        ctx!.fillStyle = `rgba(255,255,255,0.08)`;
        ctx!.fill();
        ctx!.strokeStyle = `rgba(255,255,255,0.12)`;
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

      requestAnimationFrame(animate);
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
    document.querySelectorAll('.feature-card').forEach(card => observer.observe(card));
  }
}
