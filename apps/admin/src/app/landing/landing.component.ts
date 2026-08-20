import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, Signal, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService, Theme } from '../core/theme.service';
import { PublicMenuApiService, PublicBusiness } from '@serveiq/shared/data-access';

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
  heroSlides: string[] = [
    '/assets/brand/hero-1.png',
    '/assets/brand/hero-2.jpg',
    '/assets/brand/hero-3.jpg',
    '/assets/brand/hero-4.jpg'
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

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }

  stats: StatItem[] = [
    { value: '120+', label: 'restaurants on ServeIQ' },
    { value: '₦1.9M', label: 'recovered per location / month' },
    { value: '4–8%', label: 'of revenue leaks caught' }
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

  heroProof = 'Trusted by 120+ restaurants keeping their revenue safe';

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
      icon: 'monitoring',
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
    { icon: 'monitoring', label: 'Staff Analytics', desc: 'Per-waiter sales and audit trail.' }
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
    }
  }

  ngOnDestroy() {
    this.stopAutoplay();
    this.stopHeroSlides();
    window.removeEventListener('resize', this.onResize);
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
            entry.target.classList.add('animate-fade-up');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.module-card, .feature-copy, .service-item, .step-card, .restaurant-card, .faq-item').forEach(card => observer.observe(card));
  }
}