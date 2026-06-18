import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuApiService } from '@serveiq/shared/data-access';
import { MenuItem } from '@serveiq/shared/models';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="menu-management-container">
      <!-- Header Section -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-group">
            <h1 class="page-title">Menu Management</h1>
            <p class="page-subtitle">Configure your restaurant's digital menu and availability.</p>
          </div>
            <button class="btn-primary add-item-btn" (click)="addItem()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Add Item</span>
          </button>
        </div>
      </header>

      <div class="main-layout">
        <!-- Sidebar Navigation -->
        <aside class="sidebar-nav">
          <div class="nav-card category-card">
            <h2 class="card-title">CATEGORIES</h2>
            <nav class="category-list">
              <button *ngFor="let cat of categories()" 
                      class="category-item" 
                      [class.active]="selectedCategory() === cat.name"
                      (click)="selectCategory(cat.name)">
                <div class="category-info">
                  <span class="category-name">{{ cat.name }}</span>
                </div>
                <span class="category-count">{{ cat.count }}</span>
              </button>
            </nav>
          </div>

          <div class="nav-card specials-card">
            <div class="specials-content">
              <h2 class="specials-title">Daily Specials</h2>
              <p class="specials-subtitle">Current promotional items</p>
              <div class="specials-overlays">
                <div class="overlay-circle" style="background: #ffedd5"></div>
                <div class="overlay-circle" style="background: #ebf5ff"></div>
                <div class="overlay-circle" style="background: #e0f2fe"></div>
                <div class="overlay-star">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="content-area">
          <div class="table-card">
            <div class="table-actions-header">
              <div class="filters-group">
                <button class="btn-secondary filter-btn">
                  <svg class="btn-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="7" y2="12" x2="17" y2="12" />
                    <line x1="10" y1="18" x2="14" y2="18" />
                  </svg>
                  <span>Filter</span>
                </button>
                <button class="btn-secondary sort-btn">
                  <svg class="btn-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3" y2="18" />
                  </svg>
                  <span>Sort by Price</span>
                </button>
              </div>
              <span class="showing-text inter-font">Showing 1-3 of 12 items</span>
            </div>

            <div class="table-wrapper">
              <table class="menu-table">
                <thead>
                  <tr>
                    <th scope="col">Photo</th>
                    <th scope="col">Item Name</th>
                    <th scope="col">Category</th>
                    <th scope="col">Price</th>
                    <th scope="col">Availability</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="data-row" *ngFor="let item of menuItems(); trackBy: trackById">
                    <td class="cell-photo">
                      <div class="photo-thumb">
                        <img [src]="item.imageUrl || '/assets/food/placeholder.png'" [alt]="item.name" />
                      </div>
                    </td>
                    <td class="cell-name">
                      <span class="item-name">{{ item.name }}</span>
                    </td>
                    <td class="cell-category">
                      <span class="category-pill" [class]="item.category.toLowerCase()">
                        {{ item.category }}
                      </span>
                    </td>
                    <td class="cell-price">
                      <span class="price-value">₦{{ (item.priceKobo / 100) | number:'1.0-0' }}</span>
                    </td>
                    <td class="cell-availability">
                      <button class="toggle-switch" 
                              [class.active]="item.isAvailable"
                              (click)="toggleAvailability(item)">
                        <span class="toggle-thumb"></span>
                      </button>
                    </td>
                    <td class="cell-actions">
                      <button class="action-btn" aria-label="Edit item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <footer class="pagination-footer">
              <div class="pagination-controls">
                <button class="pag-nav-btn" [disabled]="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </button>
                <button class="pag-num active">1</button>
                <button class="pag-num">2</button>
                <button class="pag-num">3</button>
                <button class="pag-nav-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="m9 18 6-6 6-6"/>
                  </svg>
                </button>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .menu-management-container {
      padding: 40px 48px;
      max-width: 1600px;
      margin: 0 auto;
      font-family: 'Inter', sans-serif;
      color: #0b1c30;
      background: #fdfdfd;
      min-height: 100vh;
    }

    /* ===== PAGE HEADER ===== */
    .page-header { margin-bottom: 40px; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-end; }
    .title-group { display: grid; gap: 8px; }
    .page-title { margin: 0; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 2.75rem; letter-spacing: -0.02em; }
    .page-subtitle { margin: 0; font-size: 1.1rem; color: #64748b; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 10px; padding: 14px 28px;
      background: #F97316; color: white; border: none; border-radius: 12px;
      font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.2s;
      box-shadow: 0 4px 16px rgba(249, 115, 22, 0.2);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(249, 115, 22, 0.3); }

    /* ===== LAYOUT ===== */
    .main-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 32px;
    }

    /* ===== SIDEBAR ===== */
    .sidebar-nav { display: flex; flex-direction: column; gap: 24px; }
    .nav-card {
      background: white; border-radius: 20px; border: 1.5px solid #f8fafc;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02); overflow: hidden;
    }
    .card-title {
      padding: 24px 28px 16px; margin: 0; font-size: 0.875rem; font-weight: 800;
      color: #94a3b8; letter-spacing: 0.1em;
    }

    .category-list { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 4px; }
    .category-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border: none; background: transparent; border-radius: 12px;
      cursor: pointer; transition: all 0.2s; color: #64748b; font-weight: 600;
      &.active {
        background: #F97316; color: white;
        .category-count { background: rgba(255, 255, 255, 0.2); color: white; }
        .category-name { color: white; }
      }
      &:hover:not(.active) { background: #f8fafc; color: #1e293b; }
    }
    .category-info { display: flex; align-items: center; gap: 12px; }
    .category-icon { width: 22px; height: 22px; display: flex; align-items: center; }
    .category-name { font-size: 1rem; }
    .category-count {
      padding: 2px 10px; background: #f1f5f9; border-radius: 200px;
      font-size: 0.75rem; font-weight: 700; color: #94a3b8;
    }

    /* Daily Specials Card */
    .specials-card {
      padding: 24px 28px; background: white; position: relative;
    }
    .specials-title { font-size: 1.125rem; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .specials-subtitle { font-size: 0.875rem; color: #94a3b8; margin: 0 0 20px; }
    .specials-overlays { display: flex; align-items: center; position: relative; height: 40px; }
    .overlay-circle {
      width: 36px; height: 36px; border-radius: 50%; border: 3px solid white;
      margin-left: -12px; &:first-child { margin-left: 0; }
    }
    .overlay-star {
      position: absolute; right: 0; color: #f1f5f9; width: 40px; height: 40px;
      transform: rotate(15deg);
    }

    /* ===== TABLE CARD ===== */
    .content-area { }
    .table-card {
      background: white; border-radius: 24px; border: 1.5px solid #f1f5f9;
      box-shadow: 0 12px 48px rgba(11, 28, 48, 0.04); overflow: hidden;
    }
    .table-actions-header {
      padding: 20px 32px; background: #fffcfb; display: flex; justify-content: space-between;
      align-items: center; border-bottom: 1.5px solid #f1f5f9;
    }
    .filters-group { display: flex; gap: 12px; }
    .btn-secondary {
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px;
      background: #eff6ff; border: none; border-radius: 100px; color: #92400e;
      font-weight: 700; font-size: 0.9375rem; cursor: pointer; transition: all 0.2s;
      .btn-icon-small { width: 18px; height: 18px; color: #64748b; }
      &:hover { background: #e0f2fe; }
    }
    .showing-text { font-size: 0.8125rem; font-weight: 600; color: #94a3b8; }

    .table-wrapper { padding: 0; }
    .menu-table { width: 100%; border-collapse: collapse; }
    .menu-table th {
      text-align: left; padding: 24px 32px; font-weight: 700; font-size: 0.75rem;
      text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;
    }
    .menu-table td { padding: 20px 32px; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
    
    .data-row:nth-child(even) { background: #fafcff; }
    .data-row:hover { background: #fcfdfe; }

    /* Cells */
    .photo-thumb {
      width: 48px; height: 48px; border-radius: 12px; overflow: hidden;
      background: #f1f5f9; border: 1px solid #e2e8f0;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .item-name { font-weight: 700; font-size: 1.05rem; color: #1e293b; }
    
    .category-pill {
      display: inline-block; padding: 6px 14px; border-radius: 12px; font-size: 0.75rem; font-weight: 800;
      &.starter { background: #fff1e6; color: #d9480f; }
      &.main { background: #eef2ff; color: #4338ca; }
      &.drink { background: #e0f2fe; color: #0369a1; }
    }

    .price-value { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.125rem; color: #1e293b; }

    /* Toggle Switch */
    .toggle-switch {
      width: 44px; height: 24px; background: #e2e8f0; border-radius: 100px; border: none;
      position: relative; cursor: pointer; transition: background 0.3s;
      &.active { background: #92400e; .toggle-thumb { transform: translateX(20px); } }
    }
    .toggle-thumb {
      width: 18px; height: 18px; background: white; border-radius: 50%;
      position: absolute; left: 3px; top: 3px; transition: transform 0.3s;
    }

    .action-btn {
      background: transparent; border: none; color: #94a3b8; cursor: pointer;
      transition: color 0.2s; padding: 8px;
      svg { width: 22px; height: 22px; }
      &:hover { color: #F97316; }
    }

    /* Pagination */
    .pagination-footer { padding: 32px; display: flex; justify-content: center; }
    .pagination-controls { display: flex; align-items: center; gap: 8px; }
    .pag-nav-btn {
      width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid #f1f5f9;
      background: white; color: #64748b; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
      svg { width: 20px; height: 20px; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
      &:hover:not(:disabled) { border-color: #F97316; color: #F97316; }
    }
    .pag-num {
      width: 40px; height: 40px; border-radius: 50%; border: none; background: transparent;
      font-weight: 700; color: #64748b; cursor: pointer;
      &.active { background: #92400e; color: white; }
    }
  `]
})
export class MenuManagementComponent implements OnInit {
  private menuApi = inject(MenuApiService);
  selectedCategory = signal('All');
  isLoading = signal(true);

  allItems = signal<MenuItem[]>([]);

  menuItems = computed(() => {
    const cat = this.selectedCategory();
    return cat === 'All'
      ? this.allItems()
      : this.allItems().filter(i => i.category === cat);
  });

  categories = computed(() => {
    const items = this.allItems();
    const cats = ['All', ...new Set(items.map(i => i.category))];
    return cats.map(c => ({ name: c, count: c === 'All' ? items.length : items.filter(i => i.category === c).length }));
  });

  ngOnInit() {
    this.menuApi.getAllItems().subscribe({
      next: (items) => { this.allItems.set(items); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  selectCategory(name: string) { this.selectedCategory.set(name); }

  toggleAvailability(item: MenuItem) {
    this.menuApi.updateItem(item.id, { isAvailable: !item.isAvailable }).subscribe(updated =>
      this.allItems.update(items => items.map(i => i.id === updated.id ? updated : i))
    );
  }

  addItem() {
    Swal.fire({
      title: 'Add Menu Item',
      html: `
        <input id="mi-name" class="swal2-input" placeholder="Item name">
        <input id="mi-cat" class="swal2-input" placeholder="Category">
        <input id="mi-price" class="swal2-input" placeholder="Price (in kobo)" type="number">
      `,
      confirmButtonText: 'Add Item',
      confirmButtonColor: '#F97316',
      showCancelButton: true,
      preConfirm: () => ({
        name: (document.getElementById('mi-name') as HTMLInputElement).value,
        category: (document.getElementById('mi-cat') as HTMLInputElement).value,
        priceKobo: Number((document.getElementById('mi-price') as HTMLInputElement).value)
      })
    }).then(result => {
      if (result.isConfirmed && result.value?.name) {
        this.menuApi.getAllItems().subscribe(items => {
          const branchId = items[0]?.branchId;
          if (!branchId) return;
          this.menuApi.createItem({ ...result.value, branchId, isAvailable: true }).subscribe(item =>
            this.allItems.update(is => [...is, item])
          );
        });
      }
    });
  }

  trackById(_: number, item: MenuItem) { return item.id; }
}
