import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, Signal, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService, Theme } from '../core/theme.service';
import { PublicMenuApiService, PublicBusiness } from '@serveiq/shared/data-access';
import gsap from 'gsap';

interface ModuleItem {
  icon: string;
  name: string;
  desc: string;
  metric: string;
  metricLabel: string;
  tag: string;
}

interface FeatureItem {
  eyebrow: string;
  title: string;
  desc: string;
  points: string[];
}

interface ServiceItem {
  icon: string;
  label: string;
  desc: string;
}

interface PaymentPartner {
  name: string;
  image: string;
  desc: string;
}

interface StatItem {
  value: string;
  label: string;
}

interface RestaurantItem {
  id: string;
  name: string;
  type: string;
  address?: string;
  logoUrl?: string;
  brandPrimaryColor?: string;
  branchCount: number;
  createdAt?: Date;
}

interface StepItem {
  icon: string;
  title: string;
  desc: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  theme!: Signal<Theme>;
  mobileMenuOpen = false;

  carouselIndex = signal(0);
  itemsPerView = signal(3);
  isPaused = signal(false);
  openFaq: number | null = 0;
  heroSlide = signal(0);
  heroSlides: { url: string; position: string }[] = [
    { url: '/assets/brand/hero-1.png', position: 'center' },
    { url: '/assets/brand/hero-2.jpg', position: 'center' },
    { url: '/assets/brand/hero-3.jpg', position: 'center' },
    { url: '/assets/brand/hero-4.jpg', position: 'center' },
    { url: '/assets/brand/hero-5.jpg', position: 'center' }
  ];
  private autoplayTimer: ReturnType<typeof setInterval> | null = null;
  private heroTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private themeService: ThemeService,
    private publicApi: PublicMenuApiService
  ) {
    this.theme = themeService.theme;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }

  stats: StatItem[] = [
    { value: '3', label: 'core modules, one connected system' },
    { value: '2.4s', label: 'avg order-to-kitchen-screen time' },
    { value: '100%', label: 'of orders accounted for at shift close' }
  ];

  restaurants: RestaurantItem[] = [];
  restaurantsLoaded = signal(false);

  private loadRestaurants(): void {
    this.publicApi.getBusinesses().subscribe({
      next: (businesses: PublicBusiness[]) => {
        this.restaurants = businesses.map((b) => ({
          id: b.id,
          name: b.name,
          type: b.type,
          address: b.address,
          logoUrl: b.logoUrl,
          brandPrimaryColor: b.brandPrimaryColor,
          branchCount: b.branchCount,
          createdAt: b.createdAt
        }));
        this.restaurantsLoaded.set(true);
        this.carouselIndex.set(0);
      },
      error: () => {
        this.restaurantsLoaded.set(true);
      }
    });
  }

  steps: StepItem[] = [
    {
      icon: 'settings',
      title: 'Connect your floor',
      desc: 'Import your menu, tables, and staff in minutes. No new hardware or training marathon.'
    },
    {
      icon: 'monitor_heart',
      title: 'Go live & monitor',
      desc: 'Orders, payments, and staff actions flow through one system you can watch from anywhere.'
    },
    {
      icon: 'savings',
      title: 'Recover & scale',
      desc: 'Catch leakage as it happens, close every shift reconciled, and open your next branch with confidence.'
    }
  ];

  faqs: FaqItem[] = [
    {
      question: 'How fast can I set up ServeIQ?',
      answer: 'Most restaurants go live in under an hour. Import your menu and staff, assign tables, and you are operating on the same shift — no dedicated hardware required.'
    },
    {
      question: 'Does ServeIQ work with our existing POS and payments?',
      answer: 'Yes. ServeIQ layers on top of your current setup and settles through the payment partners your market already uses — OPay, Moniepoint, and Paystack included.'
    },
    {
      question: 'What counts as leakage that ServeIQ catches?',
      answer: 'Anything that moves money off your books: bill edits before payment, voids, refunds, cash collected vs recorded sales, and orders that never reach a till.'
    },
    {
      question: 'Do I need special hardware?',
      answer: 'No. ServeIQ runs on the devices your team already uses — phones, tablets, and standard kitchen displays. No proprietary terminals required.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Every action is logged with a timestamp and staff attribution, and access is locked down by role-based permissions. Your data is encrypted in transit and at rest.'
    }
  ];

  navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Modules', href: '#modules' },
    { label: 'Platform', href: '#platform' }
  ];

  heroBadge = 'Powered by ServeIQ';

  heroTitleLead = 'One system for the whole restaurant.';
  heroTitleAccent = 'From till to stockroom.';

  heroDesc = 'ServeIQ connects the point of sale, the kitchen display, the floor plan, and the inventory — so orders, stock, and cash never slip between them.';

  heroProof = 'Now onboarding pilot restaurants across Nigeria';

  floorTiles = [
    true, false, true, false,
    true, true, false, true,
    false, true, false, false
  ];

  modules: ModuleItem[] = [
    {
      icon: 'point_of_sale',
      name: 'Point of Sale',
      desc: 'Fast, reliable checkout at the till — on any device your team already uses.',
      metric: '99.9%',
      metricLabel: 'uptime',
      tag: 'Core module'
    },
    {
      icon: 'restaurant',
      name: 'Kitchen Display',
      desc: 'Orders land on the kitchen screen the second they hit the pass, with timers and routing.',
      metric: '2.4s',
      metricLabel: 'avg ticket time',
      tag: 'Kitchen'
    },
    {
      icon: 'analytics',
      name: 'Ops Analytics',
      desc: 'Live sales, efficiency, and staff performance for every shift — in a single view.',
      metric: 'Live',
      metricLabel: 'revenue',
      tag: 'Analytics'
    }
  ];

  feature: FeatureItem = {
    eyebrow: 'Built for the floor',
    title: 'Infrastructure your kitchen can rely on',
    desc: 'ServeIQ wires the till, the kitchen display, the floor plan, and the stockroom into one system — so every order is accounted for, start to finish.',
    points: [
      'Floor plan that mirrors the room in real time',
      'Kitchen display that never loses an order',
      'Stock and cash reconciled at every shift close'
    ]
  };

  services: ServiceItem[] = [
    { icon: 'point_of_sale', label: 'Point of Sale', desc: 'Fast, reliable checkout from any device.' },
    { icon: 'table_restaurant', label: 'Table & Floor', desc: 'Live floor plan and table ownership.' },
    { icon: 'inventory_2', label: 'Inventory', desc: 'Stock linked to real orders, caught live.' },
    { icon: 'analytics', label: 'Staff Analytics', desc: 'Per-waiter sales and audit trail.' }
  ];

  paymentPartners: PaymentPartner[] = [
    { name: 'OPay', image: 'assets/payments/opay.webp', desc: 'Mobile wallets & transfers' },
    { name: 'Moniepoint', image: 'assets/payments/moniepoint.webp', desc: 'POS & card terminals' },
    { name: 'Paystack', image: 'assets/payments/paystack.webp', desc: 'Card & bank payments' }
  ];

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRestaurants();
      this.initIntersectionObserver();
      this.updateItemsPerView();
      window.addEventListener('resize', this.onResize);
      this.startAutoplay();
      this.startHeroSlides();
      this.animateHeroText();
      this.animateOpsCard();
    }
  }

  ngOnDestroy() {
    this.stopAutoplay();
    this.stopHeroSlides();
    window.removeEventListener('resize', this.onResize);
  }

  private animateHeroText(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const content = document.querySelector('.hero-content');
    if (!content) {
      return;
    }
    const badge = content.querySelector('.hero-badge');
    const title = content.querySelector('.hero-title');
    const desc = content.querySelector('.hero-desc');
    const actions = content.querySelector('.hero-actions');
    const proof = content.querySelector('.hero-proof');

    gsap.set([badge, title, desc, actions, proof], { autoAlpha: 0, y: 28 });

    const tl = gsap.timeline({ delay: 0.3 });
    tl.to(badge, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' })
      .to(title, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3')
      .to(desc, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.45')
      .to(actions, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.4')
      .to(proof, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3');
  }

  private animateOpsCard(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const panel = document.querySelector<HTMLElement>('.hero-panel-wrap');
    if (!panel) {
      return;
    }
    const kpis = Array.from(panel.querySelectorAll('.ops-kpi'));
    const tiles = Array.from(panel.querySelectorAll('.ops-table'));
    const orders = Array.from(panel.querySelectorAll('.ops-order'));

    gsap.set(panel, { autoAlpha: 0, y: 48, scale: 0.94, rotateX: -8 });
    gsap.set(kpis, { autoAlpha: 0, y: 24 });
    gsap.set(tiles, { autoAlpha: 0, scale: 0.4, rotate: gsap.utils.random(-180, 180) });
    gsap.set(orders, { autoAlpha: 0, x: gsap.utils.random(-40, 40), y: 16 });

    const tl = gsap.timeline({ delay: 0.5 });

    tl.to(panel, { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, duration: 1.1, ease: 'power3.out' })
      .to(kpis, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.7, ease: 'back.out(1.7)' }, '-=0.55')
      .to(tiles, { autoAlpha: 1, scale: 1, rotate: 0, stagger: 0.045, duration: 0.55, ease: 'back.out(2)', onStart: this.sparkTiles }, '-=0.3')
      .to(orders, { autoAlpha: 1, x: 0, y: 0, stagger: 0.12, duration: 0.6, ease: 'power3.out' }, '-=0.25')
      .add(() => this.countUpKpis(panel))
      .add(() => this.pulseLiveDot(panel))
      .add(() => this.floatTiles(panel), '+=1.6')
      .add(() => this.shimmerBadge(panel), '<');
  }

  private countUpKpis(panel: HTMLElement): void {
    const fmt = new Intl.NumberFormat('en-US');
    panel.querySelectorAll<HTMLElement>('.ops-kpi-value').forEach((el, i) => {
      const raw = el.textContent?.trim() ?? '';
      const isMoney = raw.startsWith('₦');
      const isPct = raw.endsWith('%');
      const target = parseFloat(raw.replace(/[^\d.-]/g, ''));
      if (Number.isNaN(target)) {
        return;
      }
      const obj = { v: 0 };
      const step = target >= 100000 ? 500 : target >= 10000 ? 100 : target >= 1000 ? 10 : 1;
      let shown = -1;
      gsap.to(obj, {
        v: target,
        duration: 2,
        delay: i * 0.18,
        ease: 'power1.inOut',
        onUpdate: () => {
          const n = Math.round(obj.v / step) * step;
          if (n === shown) {
            return;
          }
          shown = n;
          el.textContent = (isMoney ? '₦' : '') + fmt.format(n) + (isPct ? '%' : '');
        },
        onComplete: () => {
          el.textContent = raw;
          gsap.fromTo(el,
            { scale: 1 },
            { scale: 1.15, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.out' }
          );
        }
      });
    });
  }

  private pulseLiveDot(panel: HTMLElement): void {
    const dot = panel.querySelector('.live-dot');
    if (!dot) {
      return;
    }
    gsap.to(dot, { scale: 1.5, opacity: 0.4, repeat: -1, yoyo: true, duration: 0.8, ease: 'sine.inOut' });
  }

  private sparkTiles(): void {
    const tiles = Array.from(document.querySelectorAll('.ops-table'));
    tiles.forEach((t, i) => {
      if (i % 3 === 0) {
        gsap.fromTo(t, { boxShadow: '0 0 0 rgba(255,255,255,0)' }, {
          boxShadow: '0 0 24px color-mix(in srgb, var(--primary) 60%, transparent)',
          duration: 0.5,
          yoyo: true,
          repeat: 1,
          ease: 'power1.out'
        });
      }
    });
  }

  private floatTiles(panel: HTMLElement): void {
    panel.querySelectorAll('.ops-table').forEach((tile, i) => {
      gsap.to(tile, {
        y: (i % 2 === 0 ? -4 : 4),
        repeat: -1,
        yoyo: true,
        duration: 1.6 + (i % 4) * 0.3,
        ease: 'sine.inOut'
      });
    });
  }

  private shimmerBadge(panel: HTMLElement): void {
    const badge = panel.querySelector('.hero-panel-badge');
    if (!badge) {
      return;
    }
    gsap.fromTo(badge, { backgroundPosition: '200% 0' }, {
      backgroundPosition: '-200% 0',
      duration: 3.5,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  private startHeroSlides(): void {
    this.stopHeroSlides();
    this.heroTimer = setInterval(() => {
      this.heroSlide.update(i => (i + 1) % this.heroSlides.length);
    }, 6000);
  }

  private stopHeroSlides(): void {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
      this.heroTimer = null;
    }
  }

  private onResize = (): void => {
    this.updateItemsPerView();
    const max = this.maxIndex();
    if (this.carouselIndex() > max) {
      this.carouselIndex.set(max);
    }
  };

  private updateItemsPerView(): void {
    const w = window.innerWidth;
    this.itemsPerView.set(w < 640 ? 1 : w < 1024 ? 2 : 3);
  }

  private maxIndex(): number {
    return Math.max(0, this.restaurants.length - this.itemsPerView());
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      if (this.isPaused()) return;
      const max = this.maxIndex();
      if (max <= 0) return;
      this.carouselIndex.update(i => (i >= max ? 0 : i + 1));
    }, 4200);
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  carouselTransform(): string {
    const pv = this.itemsPerView();
    const gap = 24;
    return `translateX(calc(-${this.carouselIndex()} * ((100% - ${(pv - 1) * gap}px) / ${pv} + ${gap}px)))`;
  }

  carouselDots(): number[] {
    return Array.from({ length: this.maxIndex() + 1 }, (_, i) => i);
  }

  nextRestaurants(): void {
    const max = this.maxIndex();
    this.carouselIndex.update(i => (i >= max ? 0 : i + 1));
  }

  prevRestaurants(): void {
    const max = this.maxIndex();
    this.carouselIndex.update(i => (i <= 0 ? max : i - 1));
  }

  goToRestaurant(index: number): void {
    this.carouselIndex.set(index);
  }

  pauseAutoplay(): void {
    this.isPaused.set(true);
  }

  resumeAutoplay(): void {
    this.isPaused.set(false);
  }

  private initIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            this.animateReveal(entry.target as HTMLElement);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.module-card, .feature-copy, .service-item, .step-card, .faq-item, .partner-card').forEach(card => observer.observe(card));
    const stats = document.querySelector('.stats-bar');
    if (stats) {
      observer.observe(stats);
    }
  }

  private animateReveal(el: HTMLElement): void {
    if (el.classList.contains('stats-bar')) {
      this.countUpStats(el);
      return;
    }
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 40, scale: 0.96 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
    );
  }

  private countUpStats(bar: HTMLElement): void {
    const values = Array.from(bar.querySelectorAll<HTMLElement>('.stat-value'));
    gsap.fromTo(
      bar.querySelectorAll('.stat-item'),
      { autoAlpha: 0, y: 30 },
      { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.7, ease: 'back.out(1.7)' }
    );
    values.forEach((el) => {
      const raw = el.textContent?.trim() ?? '';
      const match = raw.match(/^([^\d]*)([\d.,]+)([^\d]*)$/);
      if (!match) {
        return;
      }
      const [, prefix, numPart, suffix] = match;
      const decimals = numPart.includes('.') ? numPart.split('.')[1].length : 0;
      const target = parseFloat(numPart.replace(/,/g, ''));
      if (Number.isNaN(target)) {
        return;
      }
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = prefix + obj.v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
        }
      });
    });
  }
}