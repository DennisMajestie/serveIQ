import { Component, AfterViewInit, Inject, PLATFORM_ID, Signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService, Theme } from '../core/theme.service';

interface Dish {
  image: string;
  name: string;
  desc: string;
  price: number;
  rating: number;
  reviews: number;
}

interface FeatureItem {
  image: string;
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
    { label: 'Menu', href: '#menu' },
    { label: 'About', href: '#about' }
  ];

  heroBadge = 'Powered by ServeIQ';

  heroTitleLead = 'This kitchen runs on ServeIQ.';
  heroTitleAccent = 'So can yours.';

  heroDesc = 'The restaurant you see here — its orders, tables, stock, and cash — all runs through ServeIQ. One platform for the whole operation, so owners focus on the food.';

  dishes: Dish[] = [
    {
      image: 'assets/food/jollof.png',
      name: 'Smoky Jollof Rice',
      desc: 'Long-grain basmati simmered in fire-roasted peppers with grilled chicken.',
      price: 4500,
      rating: 4.9,
      reviews: 128
    },
    {
      image: 'assets/food/suya.png',
      name: 'Spicy Suya Skewers',
      desc: 'Beef skewers dusted in yaji spice, finished with onions and fresh tomato.',
      price: 3800,
      rating: 4.8,
      reviews: 96
    },
    {
      image: 'assets/food/chapman.png',
      name: 'Zesty Chapman',
      desc: 'Our signature citrus mocktail with grenadine and a whisper of bitters.',
      price: 1800,
      rating: 4.7,
      reviews: 74
    }
  ];

  feature: FeatureItem = {
    image: 'assets/food/suya.png',
    eyebrow: 'One platform',
    title: 'The whole restaurant, running on one system',
    desc: 'The kitchen in these photos runs on ServeIQ. Orders from the floor, stock in the store, and cash in the till are all connected — no loose ends, no guesswork.',
    points: [
      'POS that never slows down a busy night',
      'Table & floor management with a full audit trail',
      'Inventory tied to every order placed'
    ]
  };

  services: ServiceItem[] = [
    { icon: 'point_of_sale', label: 'Point of Sale', desc: 'Fast, reliable checkout from any device.' },
    { icon: 'table_restaurant', label: 'Table & Floor', desc: 'Live floor plan and table ownership.' },
    { icon: 'inventory_2', label: 'Inventory', desc: 'Stock linked to real orders, caught live.' },
    { icon: 'monitoring', label: 'Staff Analytics', desc: 'Per-waiter sales and audit trail.' }
  ];

  addToOrder(dish: Dish): void {
    console.log('Added to order:', dish.name);
  }

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
    document.querySelectorAll('.dish-card, .feature-copy, .service-item').forEach(card => observer.observe(card));
  }
}