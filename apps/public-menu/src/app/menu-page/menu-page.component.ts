import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublicMenuApiService, PublicMenuData, showApiErrorToast } from '@serveiq/shared/data-access';
import { CartService, OrderType } from '../services/cart.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
  selectedCategory = signal<string | null>(null);
  addedItemId = signal<string | null>(null);
  showTypeChooser = signal(false);

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

    this.menuApi.getMenu(branchId).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (menu) => {
        this.data.set(menu);
        this.applyBrandColors(menu);
        const cats = [...new Set(menu.items.map(i => i.category))];
        this.categories.set(cats);
        this.selectedCategory.set(cats[0] ?? null);
        this.maybeShowTypeChooser();
      },
      error: () => this.error.set(true),
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
    if (type === 'dine_in' && !this.cartService.hasTable()) {
      showApiErrorToast(
        { message: 'Please scan the QR code at your table to order dine-in, or choose Takeaway.' },
        'Table required',
      );
      return;
    }
    this.cartService.setOrderType(type);
    this.showTypeChooser.set(false);
  }

  private applyBrandColors(menu: PublicMenuData): void {
    const root = document.documentElement;
    if (menu.brandPrimaryColor) root.style.setProperty('--primary', menu.brandPrimaryColor);
    if (menu.brandAccentColor) root.style.setProperty('--accent', menu.brandAccentColor);
  }

  groupItems(category: string) {
    return this.data()?.items.filter(i => i.category === category) ?? [];
  }

  addToCart(item: { id: string; name: string; priceKobo: number }) {
    this.cartService.addItem(item.id, item.name, item.priceKobo);
    this.addedItemId.set(item.id);
    setTimeout(() => this.addedItemId.set(null), 800);
  }
}