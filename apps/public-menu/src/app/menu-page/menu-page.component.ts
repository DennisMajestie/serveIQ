import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublicMenuApiService, PublicMenuData, PublicMenuItem } from '@serveiq/shared/data-access';
import { normalizeCategory, groupCategoryNames } from '@serveiq/shared/models';
import { CartService, OrderType, PickupMode } from '../services/cart.service';
import { CallWaiterComponent } from '../call-waiter/call-waiter.component';
import { finalize } from 'rxjs';

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'grills & proteins': 'Grilled meats and rich protein dishes.',
  'main dish': 'Hearty favourites, made fresh to order.',
  'small chops': 'Bite-sized treats, perfect for sharing.',
};

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CallWaiterComponent],
  templateUrl: './menu-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./menu-page.component.scss'],
})
export class MenuPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private menuApi = inject(PublicMenuApiService);
  cartService = inject(CartService);

  data = signal<PublicMenuData | null>(null);
  loading = signal(true);
  error = signal(false);
  categories = signal<string[]>([]);
  selectedCategory = signal<string>('');
  searchQuery = signal('');
  addedItemId = signal<string | null>(null);
  showSearch = signal(false);
  showTypeChooser = signal(false);
  showPickupStep = signal(false);
  readOnly = signal(false);

  trackingCode = '';
  trackingError = signal('');

  private readonly TRACKING_CODE_REGEX = /^(?:SVQ-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{3}|[A-HJ-NP-Z2-9]{5})$/i;

  filteredItems = computed(() => {
    const items = this.data()?.items ?? [];
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    return items.filter(i => {
      const catOk = !cat || normalizeCategory(i.category) === normalizeCategory(cat);
      const qOk = !q
        || i.name.toLowerCase().includes(q)
        || (i.description?.toLowerCase().includes(q) ?? false);
      return catOk && qOk;
    });
  });

  coverImageUrl = computed(() => {
    const menu = this.data();
    return menu?.coverImageUrl || menu?.logoUrl || null;
  });

  prepTimeLabel = computed(() => {
    const menu = this.data();
    if (!menu) return '';
    const min = menu.prepTimeMinMinutes;
    const max = menu.prepTimeMaxMinutes;
    if (!min && !max) return '';
    if (min && max && min !== max) return `${min}-${max} min`;
    return `${max || min} min`;
  });

  closingTimeLabel = computed(() => {
    const value = this.data()?.closingTime;
    if (!value) return '';
    const [hour, minute] = value.split(':').map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
    const suffix = hour >= 12 ? 'pm' : 'am';
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')}${suffix}`;
  });

  menuGroups = computed(() => {
    const groups = new Map<string, PublicMenuItem[]>();
    for (const item of this.filteredItems()) {
      const category = item.category || 'Menu';
      const list = groups.get(category) ?? [];
      list.push(item);
      groups.set(category, list);
    }
    return [...groups.entries()].map(([category, items]) => ({
      category,
      description:
        CATEGORY_DESCRIPTIONS[category.toLowerCase()] ?? `${items.length} dishes`,
      items,
    }));
  });

  ngOnInit() {
    const branchId = this.route.snapshot.paramMap.get('branchId');
    if (!branchId) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    this.cartService.branchId.set(branchId);
    sessionStorage.setItem('serveiq_branch_id', branchId);

    const tableId = this.route.snapshot.queryParamMap.get('table_id');
    if (tableId) {
      this.cartService.setTableId(tableId);
    }

    // Ask for Dine In / Takeaway before showing the menu.
    this.maybeShowTypeChooser();
    this.updateReadOnly();

    this.menuApi.getMenu(branchId).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (menu) => {
        this.data.set(menu);
        this.applyBrandColors(menu);
        this.cartService.setPricingSettings(
          menu.taxRate ?? 7.5,
          menu.serviceChargePercent ?? 10,
        );
        this.cartService.setDeliveryConfig(
          menu.delivery?.enabled ?? false,
          menu.delivery?.feeKobo ?? 0,
        );
        this.cartService.setCurrency(menu.currency);
        const cats = groupCategoryNames(menu.items.map(i => i.category));
        this.categories.set(cats);
      },
      error: () => this.error.set(true),
    });
  }

  submitTracking() {
    const code = this.trackingCode.trim();
    if (!code) return;
    if (!this.TRACKING_CODE_REGEX.test(code)) {
      this.trackingError.set('Invalid code. Enter 5 characters (e.g. A7KM3) or an SVQ code.');
      return;
    }
    this.trackingError.set('');
    const branchId = this.cartService.branchId();
    this.router.navigate(['/public/track', code.toUpperCase()], {
      queryParams: branchId ? { branch_id: branchId } : {},
    });
  }

  private maybeShowTypeChooser() {
    // Prompt for Dine In / Takeaway on entry unless already chosen or mid-session.
    this.showTypeChooser.set(!this.cartService.tabId() && this.cartService.orderType() === null);
  }

  openTypeChooser() {
    this.showPickupStep.set(false);
    this.showTypeChooser.set(true);
  }

  chooseType(type: OrderType) {
    // Takeaway with delivery enabled: ask Self Pickup vs Home Delivery first.
    if (type === 'takeaway' && this.cartService.deliveryEnabled()) {
      this.showPickupStep.set(true);
      return;
    }
    this.commitType(type, null);
  }

  choosePickup(mode: PickupMode) {
    this.commitType('takeaway', mode);
  }

  private commitType(type: OrderType, pickup: PickupMode | null) {
    this.cartService.setOrderType(type);
    if (pickup) {
      this.cartService.setPickupMode(pickup);
    }
    this.showPickupStep.set(false);
    this.showTypeChooser.set(false);
    this.updateReadOnly();
  }

  continueWithoutType() {
    this.showPickupStep.set(false);
    this.showTypeChooser.set(false);
    this.updateReadOnly();
  }

  goToReserve() {
    this.showPickupStep.set(false);
    this.showTypeChooser.set(false);
    const branchId = this.cartService.branchId();
    this.router.navigate(['/public/menu', branchId, 'reserve']);
  }

  private updateReadOnly() {
    // Dine-in is waiter-served — only takeaway self-service adds items to the
    // cart. Dine-in customers view the menu read-only and the waiter takes the
    // order. A scanned table QR does not enable self-ordering for dine-in.
    this.readOnly.set(this.cartService.orderType() !== 'takeaway');
  }

  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  focusSearch(input: HTMLInputElement) {
    this.showSearch.set(true);
    setTimeout(() => {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private applyBrandColors(menu: PublicMenuData): void {
    const root = document.documentElement;
    if (menu.brandPrimaryColor) root.style.setProperty('--primary', menu.brandPrimaryColor);
    if (menu.brandAccentColor) root.style.setProperty('--accent', menu.brandAccentColor);
  }

  addToCart(item: { id: string; name: string; priceKobo: number }) {
    this.cartService.addItem(item.id, item.name, item.priceKobo);
    this.addedItemId.set(item.id);
    setTimeout(() => this.addedItemId.set(null), 800);
  }
}