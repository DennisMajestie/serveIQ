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
    if (!Array.isArray(items)) return [{ name: 'All', count: 0 }];
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

  deleteItem(item: MenuItem) {
    Swal.fire({
      title: 'Delete item?',
      text: `Remove "${item.name}" from the menu?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
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

  addItem() {
    this.resetForm();
    this.showAddModal.set(true);
  }

  closeModal() {
    this.showAddModal.set(false);
  }

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.imagePreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async submitItem() {
    const name = this.formName().trim();
    const category = this.formCategory().trim();
    const priceNaira = this.formPrice();

    if (!name || !category || !priceNaira) return;

    this.isSubmitting.set(true);
    let imageUrl: string | undefined;

    if (this.selectedFile()) {
      try {
        const uploaded = await this.uploadService.uploadFile(this.selectedFile()!).toPromise();
        imageUrl = uploaded?.url;
      } catch { /* image upload failed silently — item still created */ }
    }

    const payload: any = {
      name,
      category,
      price_kobo: Math.round(priceNaira * 100),
      unit: this.formUnit().trim() || undefined,
      is_available: this.formIsAvailable(),
      ...(imageUrl ? { image_url: imageUrl } : {})
    };

    this.menuService.createItem(payload).subscribe({
      next: (item) => {
        this.items.update(is => [...is, item as any]);
        this.isSubmitting.set(false);
        this.closeModal();
      },
      error: () => this.isSubmitting.set(false)
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

  trackById(_: number, item: MenuItem) {
    return item.id;
  }
}
