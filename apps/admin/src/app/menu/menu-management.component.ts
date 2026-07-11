import { Component, signal, computed, inject, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MenuApiService, UploadApiService, MenuItem, ENVIRONMENT_CONFIG, EnvironmentConfig } from '@serveiq/shared/data-access';
import { resolveImageUrl } from '@serveiq/shared/models';
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
  private env = inject(ENVIRONMENT_CONFIG);
  private router = inject(Router);
  
  selectedCategory = signal('All');
  isLoading = signal(true);
  items = signal<MenuItem[]>([]);

  // Category dropdown options
  categoryOptions = [
    { label: 'Starter', value: 'starter' },
    { label: 'Main Course', value: 'main-course' },
    { label: 'Fruit Juice', value: 'fruit-juice' },
    { label: 'Beer', value: 'beer' },
    { label: 'Wine', value: 'wine' },
    { label: 'Tea & Coffee', value: 'tea-coffee' },
    { label: 'Dessert', value: 'dessert' },
    { label: 'Sides', value: 'sides' },
    { label: 'Water & Soft Drinks', value: 'water-soft-drinks' },
  ];

  // Unit dropdown options
  unitOptions = [
    { label: 'Plate', value: 'plate' },
    { label: 'Bowl', value: 'bowl' },
    { label: 'Cup', value: 'cup' },
    { label: 'Glass', value: 'glass' },
    { label: 'Bottle', value: 'bottle' },
    { label: 'Can', value: 'can' },
    { label: 'Piece', value: 'piece' },
    { label: 'Portion', value: 'portion' },
    { label: 'Serving', value: 'serving' },
    { label: 'Half Portion', value: 'half-portion' },
    { label: 'Full Portion', value: 'full-portion' },
  ];

  // Add Item Modal state
  showAddModal = signal(false);
  isSubmitting = signal(false);
  imagePreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  formName = signal('');
  formCategory = signal('');
  formPrice = signal<number | null>(null);
  formUnit = signal('');
  formIsAvailable = signal(true);

  menuItems = computed(() => {
    const cat = this.selectedCategory();
    const items = this.items();
    if (!Array.isArray(items)) return [];
    return cat === 'All'
      ? items
      : items.filter(i => i.category === cat);
  });

  categories = computed(() => {
    const items = this.items();
    if (!Array.isArray(items)) return [{ name: 'All', count: 0, imageUrl: '' }];
    const cats = ['All', ...new Set(items.map(i => i.category))];
    return cats.map(c => {
      const catItems = c === 'All' ? items : items.filter(i => i.category === c);
      const firstWithImage = catItems.find(i => i.imageUrl);
      return {
        name: c,
        count: catItems.length,
        imageUrl: firstWithImage ? resolveImageUrl(firstWithImage.imageUrl, this.env.apiUrl) : ''
      };
    });
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
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to Load Menu' });
      }
    });
  }

  selectCategory(name: string) {
    this.selectedCategory.set(name);
  }

  toggleAvailability(item: MenuItem) {
    this.menuService.toggleAvailability(item.id)
      .subscribe((updated: any) => {
        this.items.update(is => is.map(i => i.id === updated.id ? updated : i));
      });
  }

  importCsv() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      this.menuService.importCsv(file).subscribe({
        next: (result) => {
          Swal.fire({
            icon: 'success',
            title: 'Import Complete',
            text: `${result.imported} items imported.${result.errors?.length ? '\nErrors: ' + result.errors.join(', ') : ''}`,
          });
          this.loadMenu();
        },
        error: () => Swal.fire({ icon: 'error', title: 'Import Failed', text: 'Could not import menu items.' })
      });
    };
    input.click();
  }

  deleteItem(item: MenuItem) {
    Swal.fire({
      title: 'Delete item?',
      text: `Remove "${item.name}" from the menu?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        this.menuService.deleteItem(item.id).subscribe({
          next: () => {
            this.items.update(is => is.filter(i => i.id !== item.id));
            Swal.fire({ title: 'Deleted!', text: 'Menu item has been removed.', icon: 'success', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire({ title: 'Error', text: 'Failed to delete item.', icon: 'error' })
        });
      }
    });
  }

  private resetForm() {
    this.formName.set('');
    this.formCategory.set('');
    this.formPrice.set(null);
    this.formUnit.set('');
    this.formIsAvailable.set(true);
    this.imagePreview.set(null);
    this.selectedFile.set(null);
  }

  getImageSrc(item: MenuItem): string {
    return resolveImageUrl(item.imageUrl, this.env.apiUrl);
  }

  trackById(_: number, item: MenuItem) {
    return item.id;
  }
}
