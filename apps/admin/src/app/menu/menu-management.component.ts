import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MenuApiService, UploadApiService, MenuItem } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-management.component.html',
  styleUrls: ['./menu-management.component.scss']
})
export class MenuManagementComponent implements OnInit {
  private menuService = inject(MenuApiService);
  private uploadService = inject(UploadApiService);
  
  selectedCategory = signal('All');
  isLoading = signal(true);
  items = signal<MenuItem[]>([]);

  menuItems = computed(() => {
    const cat = this.selectedCategory();
    return cat === 'All'
      ? this.items()
      : this.items().filter(i => i.category === cat);
  });

  categories = computed(() => {
    const items = this.items();
    const cats = ['All', ...new Set(items.map(i => i.category))];
    return cats.map(c => ({ 
      name: c, 
      count: c === 'All' ? items.length : items.filter(i => i.category === c).length 
    }));
  });

  ngOnInit() {
    this.loadMenu();
  }

  loadMenu() {
    this.isLoading.set(true);
    this.menuService.getAllItems().subscribe({
      next: (items: any) => {
        this.items.set(items);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  selectCategory(name: string) {
    this.selectedCategory.set(name);
  }

  toggleAvailability(item: MenuItem) {
    this.menuService.updateItem(item.id, { isAvailable: !item.isAvailable })
      .subscribe((updated: any) => {
        this.items.update(is => is.map(i => i.id === updated.id ? updated : i));
      });
  }

  addItem() {
    Swal.fire({
      title: 'Add Menu Item',
      html: `
        <input id="mi-name" class="swal2-input" placeholder="Item name">
        <input id="mi-cat" class="swal2-input" placeholder="Category">
        <input id="mi-price" class="swal2-input" placeholder="Price (in Naira)" type="number" step="0.01">
        <input id="mi-unit" class="swal2-input" placeholder="Unit (optional)">
        <select id="mi-is-available" class="swal2-input">
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
      `,
      confirmButtonText: 'Add Item',
      confirmButtonColor: '#F97316',
      showCancelButton: true,
      preConfirm: async () => {
        const name = (document.getElementById('mi-name') as HTMLInputElement).value;
        const category = (document.getElementById('mi-cat') as HTMLInputElement).value;
        const priceNaira = Number((document.getElementById('mi-price') as HTMLInputElement).value);
        const unit = (document.getElementById('mi-unit') as HTMLInputElement).value;
        const isAvailable = (document.getElementById('mi-is-available') as HTMLSelectElement).value === 'true';

        if (!name || !category || !priceNaira) {
          Swal.showValidationMessage('Please fill in all required fields');
          return;
        }

        return {
          name,
          category,
          priceKobo: Math.round(priceNaira * 100),
          unit,
          isAvailable
        };
      }
    }).then(result => {
      if (result.isConfirmed && result.value?.name) {
        this.menuService.createItem(result.value).subscribe(item => {
          this.items.update(is => [...is, item as any]);
          Swal.fire({ icon: 'success', title: 'Item Added', timer: 1500, showConfirmButton: false });
        });
      }
    });
  }

  trackById(_: number, item: MenuItem) {
    return item.id;
  }
}
