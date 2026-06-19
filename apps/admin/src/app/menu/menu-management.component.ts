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
  templateUrl: './menu-management.component.html',
  styleUrls: ['./menu-management.component.scss']
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
