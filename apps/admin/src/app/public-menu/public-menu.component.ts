import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicMenuApiService, PublicMenuData, PublicMenuItem } from '@serveiq/shared/data-access';

@Component({
  selector: 'app-public-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="public-menu">
      @if (isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading menu...</p>
        </div>
      } @else if (error()) {
        <div class="error">
          <span class="material-symbols-outlined">error_outline</span>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <header class="header">
          <h1>{{ menuData()?.businessName }}</h1>
          <p class="subtitle">{{ menuData()?.branchName }}</p>
        </header>

        <div class="sticky-bar">
          <div class="search-wrapper">
            <span class="search-icon material-symbols-outlined">search</span>
            <input
              type="text"
              class="search-input"
              placeholder="Search menu..."
              [(ngModel)]="searchQuery"
            />
            @if (searchQuery()) {
              <button class="clear-btn" (click)="searchQuery.set('')">
                <span class="material-symbols-outlined">close</span>
              </button>
            }
          </div>

          <div class="category-tabs">
            <button
              class="category-pill"
              [class.active]="selectedCategory() === ''"
              (click)="selectedCategory.set('')"
            >All</button>
            @for (cat of categories(); track cat) {
              <button
                class="category-pill"
                [class.active]="selectedCategory() === cat"
                (click)="selectedCategory.set(cat)"
              >{{ cat }}</button>
            }
          </div>
        </div>

        <main class="content">
          @if (filteredItems().length === 0) {
            <div class="empty-state">
              <span class="material-symbols-outlined">search_off</span>
              <p>No items found</p>
            </div>
          } @else {
            <div class="items-grid">
              @for (item of filteredItems(); track item.id) {
                <div class="menu-card" [class.sold-out]="item.isSoldOut">
                  <div class="card-image">
                    @if (item.imageUrl) {
                      <img
                        [src]="item.imageUrl"
                        [alt]="item.name"
                        loading="lazy"
                        (error)="item.imageUrl = undefined"
                      />
                    } @else {
                      <div class="img-placeholder">&#127860;</div>
                    }
                    @if (item.isSoldOut) {
                      <span class="sold-out-badge">Sold out</span>
                    }
                  </div>
                  <div class="card-body">
                    <h3>{{ item.name }}</h3>
                    @if (item.description) {
                      <p class="description">{{ item.description }}</p>
                    }
                    <div class="card-footer">
                      <span class="price" [class.text-muted]="item.isSoldOut">
                        &#8358;{{ (item.priceKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 }) }}
                      </span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </main>

        <footer class="footer">
          <p>Powered by Lumina Studio</p>
        </footer>
      }
    </div>
  `,
  styles: [`
    .public-menu {
      min-height: 100vh;
      background: #f8f9fa;
      color: #1a1a2e;
      font-family: 'Inter', sans-serif;
    }
    .loading, .error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: 16px;
      color: #6c757d;
    }
    .error { color: #dc3545; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #e9ecef;
      border-top-color: #4be277;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .header {
      text-align: center;
      padding: 40px 24px 24px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
    }
    .header h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 4px;
    }
    .header .subtitle {
      font-size: 14px;
      opacity: 0.7;
      margin: 0;
    }
    .sticky-bar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: #f8f9fa;
      padding: 12px 16px 8px;
      max-width: 800px;
      margin: 0 auto;
    }
    .search-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0 12px;
      margin-bottom: 10px;
    }
    .search-wrapper:focus-within {
      border-color: #4be277;
      box-shadow: 0 0 0 3px rgba(75,226,119,0.15);
    }
    .search-icon {
      font-size: 20px;
      color: #94a3b8;
    }
    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      padding: 10px 0;
      background: transparent;
      color: #1a1a2e;
    }
    .search-input::placeholder { color: #94a3b8; }
    .clear-btn {
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      color: #94a3b8;
    }
    .clear-btn .material-symbols-outlined { font-size: 18px; }
    .category-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .category-tabs::-webkit-scrollbar { display: none; }
    .category-pill {
      flex-shrink: 0;
      padding: 6px 16px;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      background: #fff;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .category-pill.active {
      background: #1a1a2e;
      color: #fff;
      border-color: #1a1a2e;
    }
    .content {
      max-width: 800px;
      margin: 0 auto;
      padding: 8px 16px 80px;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 30vh;
      gap: 12px;
      color: #94a3b8;
    }
    .empty-state .material-symbols-outlined { font-size: 48px; }
    .empty-state p { font-size: 15px; margin: 0; }
    .items-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .menu-card {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .menu-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .menu-card.sold-out {
      opacity: 0.55;
      filter: grayscale(0.8);
    }
    .card-image {
      position: relative;
      height: 160px;
      background: #e9ecef;
      overflow: hidden;
    }
    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .img-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
    }
    .sold-out-badge {
      position: absolute;
      top: 8px; right: 8px;
      background: #dc3545;
      color: #fff;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .card-body {
      padding: 16px;
    }
    .card-body h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px;
    }
    .description {
      font-size: 13px;
      color: #6c757d;
      margin: 0 0 12px;
      line-height: 1.4;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .price {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #2d6a4f;
    }
    .price.text-muted { color: #adb5bd; }
    .footer {
      text-align: center;
      padding: 24px;
      color: #adb5bd;
      font-size: 13px;
    }
  `]
})
export class PublicMenuComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private publicMenuApi = inject(PublicMenuApiService);

  isLoading = signal(true);
  error = signal<string | null>(null);
  menuData = signal<PublicMenuData | null>(null);

  selectedCategory = signal('');
  searchQuery = signal('');

  categories = signal<string[]>([]);
  allItems = signal<PublicMenuItem[]>([]);

  filteredItems = computed(() => {
    let items = this.allItems();
    const cat = this.selectedCategory();
    const q = this.searchQuery().toLowerCase().trim();
    if (cat) {
      items = items.filter(i => i.category === cat);
    }
    if (q) {
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    return items;
  });

  ngOnInit(): void {
    const branchId = this.route.snapshot.paramMap.get('branchId');
    if (!branchId) {
      this.error.set('Invalid menu link');
      this.isLoading.set(false);
      return;
    }
    this.publicMenuApi.getMenu(branchId).subscribe({
      next: (data) => {
        this.menuData.set(data);
        this.allItems.set(data.items);
        const cats = [...new Set(data.items.map(i => i.category))];
        this.categories.set(cats);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Unable to load menu. Please try again later.');
        this.isLoading.set(false);
      },
    });
  }
}
