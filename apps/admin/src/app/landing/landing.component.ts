import { Component, AfterViewInit, Inject, PLATFORM_ID, Signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService, Theme } from '../core/theme.service';

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

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements AfterViewInit {
  theme!: Signal<Theme>;
  mobileMenuOpen = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private themeService: ThemeService
  ) {
    this.theme = themeService.theme;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

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

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initIntersectionObserver();
    }
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
    document.querySelectorAll('.module-card, .feature-copy, .service-item').forEach(card => observer.observe(card));
  }
}