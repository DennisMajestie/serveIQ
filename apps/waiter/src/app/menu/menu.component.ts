import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MenuApiService, TablesApiService, TabsApiService, ENVIRONMENT_CONFIG, OfflineCacheService } from '@serveiq/shared/data-access';
import { MenuItem, Table, Tab, resolveImageUrl } from '@serveiq/shared/models';
import { CurrencyContextService } from '../services/currency-context.service';
import { OfflineDataService } from '../services/offline-data.service';

interface Portion { id: string; name: string; price: number; }

interface LocalMenuItem {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  isAvailable: boolean;
  portions?: Portion[];
  defaultPortionId?: string;
}

interface CartItem extends LocalMenuItem {
  qty: number;
  selectedPortionId?: string;
  portionName?: string;
  portionPrice?: number;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  businessName = localStorage.getItem('businessName') || 'ServeIQ';
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly menuApi = inject(MenuApiService);
  private readonly tabsApi = inject(TabsApiService);
  private readonly tablesApi = inject(TablesApiService);
  private readonly env = inject(ENVIRONMENT_CONFIG);
  private readonly currency = inject(CurrencyContextService);
  private readonly offlineData = inject(OfflineDataService);
  private readonly cache = inject(OfflineCacheService);

  currencySymbol = computed(() => this.currency.getSymbol());
  formatAmount = (amount: number) => this.currency.formatAmount(amount);

  selectedCategory = 'All';
  categories = signal<string[]>(['All']);
  tableId: string | null = null;
  tabId: string | null = null;
  tableNumber: string | null = null;
  isVipTable = signal(false);
  isLoading = signal(true);

  /** VIP price multiplier = 1 + vipSurchargePercent/100, applied only on VIP tables. */
  vipMultiplier = computed(() =>
    this.isVipTable() ? 1 + (this.currency.vipSurchargePercent() || 0) / 100 : 1,
  );

  menuItems: LocalMenuItem[] = [];
  selectedItems: CartItem[] = [];
  selectedPortions: Map<string, string> = new Map();
  showReview = signal(false);

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.tableId = params.get('tableId');
      this.tabId = params.get('tabId');
      if (this.tabId) {
        this.loadTabInfo(this.tabId);
      }
    });

    this.cache.getCached<any>('menu').subscribe(cached => {
      if (cached.length > 0) {
        this.processMenuItems(cached);
      }
    });
    this.offlineData.getMenu().subscribe({
      next: (items: any) => this.processMenuItems(items),
      error: () => this.isLoading.set(false),
    });
  }

  private processMenuItems(items: any[]): void {
    if (!Array.isArray(items)) { this.isLoading.set(false); return; }
    this.menuItems = items.map(i => {
      const isManuallyAvailable = (i.isAvailable ?? i.is_available ?? i.available ?? true) !== false;
      const trackStock = i.trackStock ?? i.track_stock ?? false;
      const stock = parseFloat(i.quantityInStock ?? i.quantity_in_stock ?? '0');
      const outOfStock = trackStock && stock <= 0;
      return {
        id: i.id,
        name: i.name,
        category: i.category,
        image: resolveImageUrl(i.imageUrl, this.env.apiUrl),
        price: (i.priceKobo ?? i.price_kobo ?? 0) / 100,
        isAvailable: isManuallyAvailable && !outOfStock,
      };
    });
    const cats = ['All', ...new Set(items.map(i => i.category))];
    this.categories.set(cats);
    this.selectedCategory = cats[0] ?? 'All';
    this.isLoading.set(false);
  }

  loadTabInfo(tabId: string) {
    this.tabsApi.getTab(tabId).subscribe({
      next: (tab: Tab) => {
        if (tab.tableId) {
          this.tablesApi.getTable(tab.tableId).subscribe({
            next: (table: Table) => {
              this.tableNumber = table.tableNumber;
              this.isVipTable.set(!!table.isVip);
            }
          });
        }
      }
    });
  }

  get filteredItems(): LocalMenuItem[] {
    return this.selectedCategory === 'All'
      ? this.menuItems
      : this.menuItems.filter(i => i.category === this.selectedCategory);
  }

  get selectionTotal(): number {
    if (!Array.isArray(this.selectedItems)) return 0;
    return this.selectedItems.reduce((sum, item) => {
      const price = this.vipMultiplier() * (item.portionPrice ?? item.price);
      return sum + (price * item.qty);
    }, 0);
  }

  getItemQty(itemId: string): number {
    return this.selectedItems.find(i => i.id === itemId)?.qty ?? 0;
  }

  getSelectedPortion(itemId: string): string {
    return this.selectedPortions.get(itemId) ?? '';
  }

  setSelectedPortion(itemId: string, portionId: string) {
    this.selectedPortions.set(itemId, portionId);
  }

  getPortionPrice(item: LocalMenuItem, portionId: string): number {
    return item.portions?.find(p => p.id === portionId)?.price ?? item.price;
  }

  getDisplayPrice(item: LocalMenuItem): number {
    const pid = this.getSelectedPortion(item.id);
    const base = pid ? this.getPortionPrice(item, pid) : item.price;
    return base * this.vipMultiplier();
  }

  addToSelection(item: LocalMenuItem) {
    const pid = item.portions ? this.getSelectedPortion(item.id) : undefined;
    const portion = item.portions?.find(p => p.id === pid);
    const key = item.id + (pid ? `-${pid}` : '');
    const existing = this.selectedItems.find(i => (i.id + (i.selectedPortionId ? `-${i.selectedPortionId}` : '')) === key);
    if (existing) {
      existing.qty++;
    } else {
      this.selectedItems.push({ ...item, qty: 1, selectedPortionId: pid, portionName: portion?.name, portionPrice: portion?.price });
    }
  }

  removeFromSelection(itemId: string, portionId?: string) {
    const key = itemId + (portionId ? `-${portionId}` : '');
    const idx = this.selectedItems.findIndex(i => (i.id + (i.selectedPortionId ? `-${i.selectedPortionId}` : '')) === key);
    if (idx !== -1) {
      this.selectedItems[idx].qty--;
      if (this.selectedItems[idx].qty <= 0) this.selectedItems.splice(idx, 1);
    }
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  confirmSelection() {
    if (this.selectedItems.length === 0) {
      this.goToTables();
      return;
    }
    this.showReview.set(true);
  }

  sendOrder() {
    this.showReview.set(false);
    const targetId = this.tabId || this.tableId;
    if (targetId) {
      this.router.navigate(['/tabs/detail', targetId], { state: { selectedItems: this.selectedItems } });
    } else {
      this.router.navigate(['/tables']);
    }
  }

  getLineTotal(item: CartItem): number {
    const price = this.vipMultiplier() * (item.portionPrice ?? item.price);
    return price * item.qty;
  }

  goToTables() { this.router.navigate(['/tables']); }
  goToHistory() { this.router.navigate(['/tabs/history']); }
  goToProfile() { this.router.navigate(['/profile']); }
  openNotifications() {
    this.router.navigate(['/notifications']);
  }
}
