import { Component, AfterViewInit, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements AfterViewInit {
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

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initCanvas();
      this.initIntersectionObserver();
    }
  }

  private initCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number, height: number;
    const particles: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];

    function init() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particles.length = 0;
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1
        });
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      ctx!.strokeStyle = 'rgba(144, 63, 0, 0.08)';
      ctx!.lineWidth = 0.8;

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(144, 63, 0, 0.15)';
        ctx!.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 250) {
            ctx!.globalAlpha = 1 - (dist / 250);
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(p2.x, p2.y);
            ctx!.stroke();
          }
        }
      });
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', init);
    init();
    draw();
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
