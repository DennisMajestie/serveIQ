import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MenuApiService, TablesApiService, TabsApiService } from '@serveiq/shared/data-access';
import { MenuItem, Table, Tab } from '@serveiq/shared/models';

interface Portion { id: string; name: string; price: number; }

interface LocalMenuItem {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly menuApi = inject(MenuApiService);
  private readonly tabsApi = inject(TabsApiService);
  private readonly tablesApi = inject(TablesApiService);

  selectedCategory = 'All';
  categories = signal<string[]>(['All']);
  tableId: string | null = null;
  tabId: string | null = null;
  tableNumber: string | null = null;
  isLoading = signal(true);

  menuItems: LocalMenuItem[] = [];
  selectedItems: CartItem[] = [];
  selectedPortions: Map<string, string> = new Map();

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.tableId = params.get('tableId');
      this.tabId = params.get('tabId');
      if (this.tabId) {
        this.loadTabInfo(this.tabId);
      }
    });

    this.menuApi.getAllItems().subscribe({
      next: (items: any) => {
        if (!Array.isArray(items)) {
          this.isLoading.set(false);
          return;
        }
        this.menuItems = items.map(i => ({
          id: i.id,
          name: i.name,
          category: i.category,
          image: i.imageUrl || '/assets/food/placeholder.png',
          price: (i.priceKobo ?? i.price_kobo ?? 0) / 100
        }));
        const cats = ['All', ...new Set(items.map(i => i.category))];
        this.categories.set(cats);
        this.selectedCategory = cats[0] ?? 'All';
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadTabInfo(tabId: string) {
    this.tabsApi.getTab(tabId).subscribe({
      next: (tab: Tab) => {
        if (tab.tableId) {
          this.tablesApi.getTable(tab.tableId).subscribe({
            next: (table: Table) => {
              this.tableNumber = table.tableNumber;
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
      const price = item.portionPrice ?? item.price;
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
    return pid ? this.getPortionPrice(item, pid) : item.price;
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
    const targetId = this.tabId || this.tableId;
    if (targetId) {
      this.router.navigate(['/tabs/detail', targetId], { state: { selectedItems: this.selectedItems } });
    } else {
      this.router.navigate(['/tables']);
    }
  }

  goToTables() { this.router.navigate(['/tables']); }
  goToHistory() { this.router.navigate(['/tabs/history']); }
  goToProfile() { /* future */ }
}
