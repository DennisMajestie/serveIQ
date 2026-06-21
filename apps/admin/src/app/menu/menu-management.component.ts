import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../services/menu.service';
import { UploadService } from '../services/upload.service';
import { MenuItem } from '../models';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-management.component.html',
  styleUrls: ['./menu-management.component.scss']
})
export class MenuManagementComponent implements OnInit {
  private menuService = inject(MenuService);
  private uploadService = inject(UploadService);
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
    this.menuService.getMenuItems().subscribe({
      next: (items) => { this.allItems.set(items); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  selectCategory(name: string) { this.selectedCategory.set(name); }

  toggleAvailability(item: MenuItem) {
    this.menuService.updateMenuItem(item.id, { is_available: !item.is_available }).subscribe(updated =>
      this.allItems.update(items => items.map(i => i.id === updated.id ? updated : i))
    );
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

        let imageUrl: string | undefined = undefined;
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            try {
              const result = await this.uploadService.uploadFile(file).toPromise();
              imageUrl = result.url;
              Swal.getPopup()?.querySelector('#mi-is-available')?.setAttribute('disabled', 'disabled');
            } catch (error) {
              console.error('Upload failed:', error);
            }
          }
        };
        fileInput.click();

        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              name,
              category,
              price_kobo: Math.round(priceNaira * 100),
              unit,
              is_available: isAvailable,
              image_url: imageUrl
            });
          }, 100);
        });
      }
    }).then(result => {
      if (result.isConfirmed && result.value?.name) {
        this.menuService.createMenuItem(result.value).subscribe(item =>
          this.allItems.update(items => [...items, item])
        );
      }
    });
  }

  trackById(_: number, item: MenuItem) { return item.id; }
}
