import { Component, signal, computed, inject, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MenuApiService, UploadApiService, BranchesApiService, MenuItem, ENVIRONMENT_CONFIG, EnvironmentConfig, showApiErrorToast } from '@serveiq/shared/data-access';
import { resolveImageUrl, normalizeCategory, displayCategory } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './menu-management.component.html',
  styleUrls: ['./menu-management.component.scss']
})
export class MenuManagementComponent implements OnInit {
  private menuService = inject(MenuApiService);
  private uploadService = inject(UploadApiService);
  private env = inject(ENVIRONMENT_CONFIG);
  private router = inject(Router);
  private branchesService = inject(BranchesApiService);
  
  selectedCategory = signal('All');
  isLoading = signal(true);
  items = signal<MenuItem[]>([]);

  // Default category dropdown options (fallback + seed values)
  readonly DEFAULT_CATEGORIES = [
    'Starter', 'Main Course', 'Fruit Juice', 'Beer', 'Wine', 'Tea & Coffee',
    'Dessert', 'Sides', 'Water & Soft Drinks',
  ];

  // Default unit dropdown options (fallback + seed values)
  readonly DEFAULT_UNITS = [
    'Plate', 'Bowl', 'Cup', 'Glass', 'Bottle', 'Can', 'Piece', 'Portion',
    'Serving', 'Half Portion', 'Full Portion',
  ];

  apiCategories = signal<string[]>([]);
  apiUnits = signal<string[]>([]);

  private static dedupeCaseInsensitive(values: string[]): string[] {
    const seen = new Set<string>();
    return values.filter(v => {
      const key = v.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private static normalizeCategory(value: string): string {
    return normalizeCategory(value);
  }

  categoryOptions = computed(() => MenuManagementComponent.dedupeCaseInsensitive([...this.apiCategories(), ...this.DEFAULT_CATEGORIES]));
  unitOptions = computed(() => MenuManagementComponent.dedupeCaseInsensitive([...this.apiUnits(), ...this.DEFAULT_UNITS]));

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
  formPrepType = signal<'instant' | 'cook'>('cook');

  menuItems = computed(() => {
    const cat = this.selectedCategory();
    const items = this.items();
    if (!Array.isArray(items)) return [];
    return cat === 'All'
      ? items
      : items.filter(i => MenuManagementComponent.normalizeCategory(i.category) === MenuManagementComponent.normalizeCategory(cat));
  });

  categories = computed(() => {
    const items = this.items();
    if (!Array.isArray(items)) return [{ name: 'All', count: 0, imageUrl: '', imageUrls: [] as string[] }];
    const byKey = new Map<string, { name: string; items: MenuItem[] }>();
    for (const item of items) {
      const key = MenuManagementComponent.normalizeCategory(item.category);
      if (!key) continue;
      const label = displayCategory(item.category);
      if (!byKey.has(key)) {
        byKey.set(key, { name: label, items: [] });
      }
      byKey.get(key)!.items.push(item);
    }
    const names = ['All', ...[...byKey.values()].map(g => g.name)];
    return names.map((c, idx) => {
      const catItems = idx === 0 ? items : (byKey.get(MenuManagementComponent.normalizeCategory(c))?.items || []);
      const firstWithImage = catItems.find(i => i.imageUrl);
      const imageUrls = idx === 0
        ? [...new Set(items.filter(i => i.imageUrl).map(i => MenuManagementComponent.normalizeCategory(i.category)))]
            .slice(0, 10)
            .map(key => {
              const item = items.find(i => MenuManagementComponent.normalizeCategory(i.category) === key && i.imageUrl);
              return item ? resolveImageUrl(item.imageUrl!, this.env.apiUrl) : '';
            })
            .filter(Boolean)
        : [];
      return {
        name: c,
        count: catItems.length,
        imageUrl: firstWithImage ? resolveImageUrl(firstWithImage.imageUrl, this.env.apiUrl) : '',
        imageUrls: imageUrls.length ? imageUrls : (firstWithImage ? [resolveImageUrl(firstWithImage.imageUrl, this.env.apiUrl)] : [])
      };
    });
  });

  ngOnInit() {
    this.loadMenu();
    this.loadCategoriesAndUnits();
  }

  loadCategoriesAndUnits() {
    this.menuService.getCategories().subscribe({
      next: (cats: any) => this.apiCategories.set((cats || []).map((c: any) => c.name)),
      error: () => {},
    });
    this.menuService.getUnits().subscribe({
      next: (units: any) => this.apiUnits.set((units || []).map((u: any) => u.name)),
      error: () => {},
    });
  }

  onCategoryChange(value: string) {
    if (value === '__add_category__') {
      this.formCategory.set('');
      Swal.fire({
        title: 'New Category',
        input: 'text',
        inputPlaceholder: 'e.g. Seafood',
        showCancelButton: true,
        confirmButtonText: 'Create',
        cancelButtonText: 'Cancel',
        inputValidator: (v) => (!v || !v.trim() ? 'Please enter a category name' : ''),
      }).then((result) => {
        if (result.isConfirmed && result.value?.trim()) {
          const name = result.value.trim();
          const existing = this.apiCategories().find(c => c.toLowerCase() === name.toLowerCase());
          if (existing) {
            this.formCategory.set(existing);
            Swal.fire({ icon: 'info', title: `"${existing}" already exists — selected it`, timer: 1500, showConfirmButton: false });
            return;
          }
          this.menuService.createCategory(name).subscribe({
            next: (cat: any) => {
              this.apiCategories.update(list => [...new Set([...list, cat?.name || name])]);
              this.formCategory.set(cat?.name || name);
              Swal.fire({ icon: 'success', title: 'Category Created', timer: 1200, showConfirmButton: false });
            },
            error: (err) => showApiErrorToast(err, 'Failed to create category'),
          });
        }
      });
      return;
    }
    this.formCategory.set(value);
  }

  onUnitChange(value: string) {
    if (value === '__add_unit__') {
      this.formUnit.set('');
      Swal.fire({
        title: 'New Unit',
        input: 'text',
        inputPlaceholder: 'e.g. Rack',
        showCancelButton: true,
        confirmButtonText: 'Create',
        cancelButtonText: 'Cancel',
        inputValidator: (v) => (!v || !v.trim() ? 'Please enter a unit name' : ''),
      }).then((result) => {
        if (result.isConfirmed && result.value?.trim()) {
          const name = result.value.trim();
          const existing = this.apiUnits().find(u => u.toLowerCase() === name.toLowerCase());
          if (existing) {
            this.formUnit.set(existing);
            Swal.fire({ icon: 'info', title: `"${existing}" already exists — selected it`, timer: 1500, showConfirmButton: false });
            return;
          }
          this.menuService.createUnit(name).subscribe({
            next: (unit: any) => {
              this.apiUnits.update(list => [...new Set([...list, unit?.name || name])]);
              this.formUnit.set(unit?.name || name);
              Swal.fire({ icon: 'success', title: 'Unit Created', timer: 1200, showConfirmButton: false });
            },
            error: (err) => showApiErrorToast(err, 'Failed to create unit'),
          });
        }
      });
      return;
    }
    this.formUnit.set(value);
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

  openAddModal() {
    this.resetForm();
    this.showAddModal.set(true);
  }

  closeModal() {
    this.showAddModal.set(false);
    this.resetForm();
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
    if (!this.formName() || !this.formCategory() || this.formPrice() === null || !this.formUnit()) return;
    this.isSubmitting.set(true);

    let branchId = localStorage.getItem('branchId') || '';
    if (!branchId || branchId === 'undefined' || branchId === 'null') {
      try {
        const branches = await firstValueFrom(this.branchesService.list());
        if (branches.length) {
          branchId = branches[0].id;
          localStorage.setItem('branchId', branchId);
        }
      } catch { /* ignore */ }
    }
    if (!branchId || branchId === 'undefined' || branchId === 'null') {
      this.isSubmitting.set(false);
      Swal.fire({ icon: 'error', title: 'No Branch Found', text: 'Create a branch in Business Setup or Settings first.' });
      return;
    }

    let imageUrl: string | undefined;
    if (this.selectedFile()) {
      try {
        const uploaded = await this.uploadService.uploadFile(this.selectedFile()!).toPromise();
        imageUrl = uploaded?.url;
      } catch { /* silently skip photo */ }
    }

    const payload: any = {
      branchId,
      name: this.formName(),
      category: this.formCategory(),
      priceKobo: Math.round(this.formPrice()! * 100),
      unit: this.formUnit(),
      prepType: this.formPrepType(),
    };
    if (imageUrl) payload.image_url = imageUrl;
    this.menuService.createItem(payload).subscribe({
      next: (item) => {
        this.isSubmitting.set(false);
        this.items.update(is => [...is, item]);
        this.closeModal();
        Swal.fire({ icon: 'success', title: 'Item Created', timer: 1500, showConfirmButton: false });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        showApiErrorToast(err, 'Failed to create menu item');
      }
    });
  }

  private resetForm() {
    this.formName.set('');
    this.formCategory.set('');
    this.formPrice.set(null);
    this.formUnit.set('');
    this.formIsAvailable.set(true);
    this.formPrepType.set('cook');
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
