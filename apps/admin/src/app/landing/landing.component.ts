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

  heroBadge = 'Open daily · 10am — 10pm';

  heroTitleLead = 'Every plate, made with fire.';
  heroTitleAccent = 'Taste the difference.';

  heroDesc = 'Smoky jollof, char-grilled suya, and drinks that do the talking. Cooked to order, served hot, and priced like your neighbourhood should be.';

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
    eyebrow: 'About the kitchen',
    title: 'Char first. Question nothing.',
    desc: 'We cook over open flame because food built on fire has no room for shortcuts. Every order is prepped the moment it hits the pass — nothing sits, nothing waits.',
    points: [
      'Fire-grilled proteins, made to order',
      'Fresh pepper sauces blended daily',
      'Small-batch cooking for peak freshness'
    ]
  };

  services: ServiceItem[] = [
    { icon: 'restaurant', label: 'Dine-In', desc: 'Comfortable seats, full table service.' },
    { icon: 'delivery_dining', label: 'Delivery', desc: 'Hot food at your door within the hour.' },
    { icon: 'event_seat', label: 'Private Events', desc: 'Birthdays, launches and corporate nights.' },
    { icon: 'local_bar', label: 'Bar & Drinks', desc: 'Chapman, zobo and cold refreshments.' }
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