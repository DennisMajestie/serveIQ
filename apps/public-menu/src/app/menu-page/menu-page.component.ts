import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublicMenuApiService, PublicMenuData } from '@serveiq/shared/data-access';
import { normalizeCategory, groupCategoryNames } from '@serveiq/shared/models';
import { CartService, OrderType } from '../services/cart.service';
import { CallWaiterComponent } from '../call-waiter/call-waiter.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CallWaiterComponent],
  templateUrl: './menu-page.component.html',
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
  showTypeChooser = signal(false);
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
    this.showTypeChooser.set(true);
  }

  chooseType(type: OrderType) {
    this.cartService.setOrderType(type);
    this.showTypeChooser.set(false);
    this.updateReadOnly();
  }

  continueWithoutType() {
    this.showTypeChooser.set(false);
    this.updateReadOnly();
  }

  private updateReadOnly() {
    // Dine-in is waiter-served — only takeaway self-service adds items to the
    // cart. Dine-in customers view the menu read-only and the waiter takes the
    // order. A scanned table QR does not enable self-ordering for dine-in.
    this.readOnly.set(this.cartService.orderType() !== 'takeaway');
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