import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PublicMenuApiService, PublicMenuData, PublicMenuItem } from '@serveiq/shared/data-access';

@Component({
  selector: 'app-public-menu',
  standalone: true,
  imports: [CommonModule],
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

        <main class="content">
          @for (group of groupedItems(); track group.category) {
            <section class="category-section">
              <h2 class="category-title">{{ group.category }}</h2>
              <div class="items-grid">
                @for (item of group.items; track item.id) {
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
            </section>
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
      padding: 48px 24px 32px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
    }
    .header h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 8px;
    }
    .header .subtitle {
      font-size: 14px;
      opacity: 0.7;
      margin: 0;
    }
    .content {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 16px 80px;
    }
    .category-section {
      margin-bottom: 32px;
    }
    .category-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e9ecef;
    }
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

  groupedItems = signal<{ category: string; items: PublicMenuItem[] }[]>([]);

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
        this.groupedItems.set(this.groupByCategory(data.items));
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Unable to load menu. Please try again later.');
        this.isLoading.set(false);
      },
    });
  }

  private groupByCategory(items: PublicMenuItem[]): { category: string; items: PublicMenuItem[] }[] {
    const map = new Map<string, PublicMenuItem[]>();
    for (const item of items) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }
}
