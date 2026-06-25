import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MenuApiService } from '@serveiq/shared/data-access';
import { MenuItem } from '@serveiq/shared/models';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

@Component({
  selector: 'app-menu-browser',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-browser.component.html',
  styleUrls: ['./menu-browser.component.scss']
})
export class MenuBrowserComponent implements OnInit {
  private menuService = inject(MenuApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  allItems = signal<MenuItem[]>([]);
  selectedCategory = signal<string>('All');
  searchQuery = signal('');
  isLoading = signal(true);
  error = signal<string | null>(null);
  cart = signal<CartItem[]>([]);
  showCart = signal(false);
  tabId = signal<string>('');

  categories = computed(() => {
    const items = this.allItems();
    if (!Array.isArray(items)) return ['All'];
    const cats = ['All', ...new Set(items.map(i => i.category).filter(Boolean))];
    return cats;
  });

  filteredItems = computed(() => {
    const items = this.allItems();
    if (!Array.isArray(items)) return [];

    let result = items.filter(i => i.isAvailable);

    const cat = this.selectedCategory();
    if (cat !== 'All') {
      result = result.filter(i => i.category === cat);
    }

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      result = result.filter(i =>
        i.name.toLowerCase().includes(query) ||
        i.category.toLowerCase().includes(query)
      );
    }

    return result;
  });

  cartItemCount = computed(() =>
    this.cart().reduce((sum, item) => sum + item.quantity, 0)
  );

  cartTotal = computed(() =>
    this.cart().reduce((sum, item) => sum + (item.menuItem.priceKobo * item.quantity), 0)
  );

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tabId']) {
        this.tabId.set(params['tabId']);
      }
    });
    this.loadMenuItems();
  }

  loadMenuItems() {
    this.isLoading.set(true);
    this.error.set(null);
    this.menuService.getAllItems().subscribe({
      next: (items) => {
        this.allItems.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load menu items');
        this.isLoading.set(false);
      }
    });
  }

  selectCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
  }

  addToCart(item: MenuItem) {
    const existing = this.cart().find(c => c.menuItem.id === item.id);
    if (existing) {
      this.cart.update(c => c.map(i =>
        i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      this.cart.update(c => [...c, { menuItem: item, quantity: 1, notes: '' }]);
    }
    this.showCart.set(true);
  }

  updateQuantity(itemId: string, delta: number) {
    this.cart.update(c => c.map(i => {
      if (i.menuItem.id !== itemId) return i;
      const newQty = Math.max(1, i.quantity + delta);
      return { ...i, quantity: newQty };
    }));
  }

  updateNotes(itemId: string, notes: string) {
    this.cart.update(c => c.map(i =>
      i.menuItem.id === itemId ? { ...i, notes: notes.trim() } : i
    ));
  }

  removeFromCart(itemId: string) {
    this.cart.update(c => c.filter(i => i.menuItem.id !== itemId));
    if (this.cart().length === 0) {
      this.showCart.set(false);
    }
  }

  clearCart() {
    this.cart.set([]);
    this.showCart.set(false);
  }

  async confirmOrder() {
    if (this.cart().length === 0 || !this.tabId()) return;

    const items = this.cart().map(c => ({
      menuItemId: c.menuItem.id,
      quantity: c.quantity,
      notes: c.notes
    }));

    this.router.navigate(['/tabs/detail', this.tabId()], {
      state: { orderItems: items }
    });
  }

  goBack() {
    if (this.tabId()) {
      this.router.navigate(['/tabs/detail', this.tabId()]);
    } else {
      this.router.navigate(['/tables']);
    }
  }

  formatPrice(kobo: number): string {
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }

  getCategoryCount(cat: string): number {
    if (cat === 'All') return this.allItems().filter(i => i.isAvailable).length;
    return this.allItems().filter(i => i.isAvailable && i.category === cat).length;
  }
}