import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { InventoryApiService, MenuApiService } from '@serveiq/shared/data-access';
import { RecipeItem, AddRecipeItemRequest, UpdateRecipeItemRequest, Ingredient, IngredientUnit, MenuItem } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recipe-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-builder.component.html',
  styleUrls: ['./recipe-builder.component.scss'],
})
export class RecipeBuilderComponent implements OnInit {
  private inventoryApi = inject(InventoryApiService);
  private menuApi = inject(MenuApiService);

  IngredientUnit = IngredientUnit;
  unitOptions = Object.values(IngredientUnit);

  // Menu item selector
  menuItems = signal<MenuItem[]>([]);
  selectedMenuItemId = signal('');
  selectedMenuItemName = signal('');

  // Recipe items
  recipeItems = signal<RecipeItem[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);

  // All ingredients (for picker)
  allIngredients = signal<Ingredient[]>([]);
  availableIngredients = signal<Ingredient[]>([]);

  // Add form
  showAddForm = signal(false);
  formIngredientId = signal('');
  formQuantity = signal(0);
  formUnit = signal<IngredientUnit>(IngredientUnit.KG);
  formWastePercent = signal<number | undefined>(undefined);
  formError = signal('');

  // Edit state
  editingId = signal('');
  editQuantity = signal(0);
  editUnit = signal<IngredientUnit>(IngredientUnit.KG);
  editWastePercent = signal<number | undefined>(undefined);

  ngOnInit() {
    this.menuApi.getAllItems().subscribe({
      next: (items) => this.menuItems.set(items),
      error: () => Swal.fire({ icon: 'error', title: 'Failed to load menu items' }),
    });
    this.inventoryApi.list().subscribe({
      next: (ings) => {
        this.allIngredients.set(ings);
        this.updateAvailableIngredients();
      },
    });
  }

  onMenuItemChange(menuItemId: string) {
    this.selectedMenuItemId.set(menuItemId);
    const item = this.menuItems().find(m => m.id === menuItemId);
    this.selectedMenuItemName.set(item?.name ?? '');
    if (menuItemId) this.loadRecipe(menuItemId);
    else this.recipeItems.set([]);
  }

  loadRecipe(menuItemId: string) {
    this.isLoading.set(true);
    this.inventoryApi.getRecipe(menuItemId).subscribe({
      next: (items) => { this.recipeItems.set(items); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); Swal.fire({ icon: 'error', title: 'Failed to load recipe' }); },
    });
  }

  private updateAvailableIngredients() {
    this.availableIngredients.set(
      this.allIngredients().filter(ing => !ing.menuItemId || ing.menuItemId === this.selectedMenuItemId())
    );
  }

  isIngredientUnavailable(ingredientId: string): boolean {
    const ing = this.allIngredients().find(i => i.id === ingredientId);
    return !!ing?.menuItemId && ing.menuItemId !== this.selectedMenuItemId();
  }

  getUnavailableReason(ingredientId: string): string {
    const ing = this.allIngredients().find(i => i.id === ingredientId);
    if (ing?.menuItemId) return 'Direct-linked ingredient — cannot be used in recipes';
    return '';
  }

  getIngredientName(id: string): string {
    return this.allIngredients().find(i => i.id === id)?.name ?? id;
  }

  getIngredientUnit(id: string): IngredientUnit | undefined {
    return this.allIngredients().find(i => i.id === id)?.unit;
  }

  // Add
  openAddForm() {
    this.updateAvailableIngredients();
    this.formIngredientId.set('');
    this.formQuantity.set(0);
    this.formUnit.set(IngredientUnit.KG);
    this.formWastePercent.set(undefined);
    this.formError.set('');
    this.showAddForm.set(true);
  }

  closeAddForm() { this.showAddForm.set(false); this.formError.set(''); }

  onIngredientSelect(ingredientId: string) {
    this.formIngredientId.set(ingredientId);
    const ing = this.allIngredients().find(i => i.id === ingredientId);
    if (ing) this.formUnit.set(ing.unit);
  }

  submitAdd() {
    const menuItemId = this.selectedMenuItemId();
    const ingredientId = this.formIngredientId();
    const quantity = this.formQuantity();
    if (!menuItemId || !ingredientId || quantity <= 0) return;

    if (this.isIngredientUnavailable(ingredientId)) {
      this.formError.set(this.getUnavailableReason(ingredientId));
      return;
    }

    this.isSaving.set(true);
    this.formError.set('');

    const payload: AddRecipeItemRequest = {
      ingredientId,
      quantityRequired: quantity,
      unit: this.formUnit(),
      wastePercent: this.formWastePercent(),
    };

    this.inventoryApi.addRecipeItem(menuItemId, payload).subscribe({
      next: (created) => {
        this.recipeItems.update(items => [...items, created]);
        this.isSaving.set(false);
        this.closeAddForm();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        if (err.status === 400 && err.error?.message) {
          this.formError.set(err.error.message);
        } else {
          Swal.fire({ icon: 'error', title: 'Failed to add ingredient' });
        }
      },
    });
  }

  // Edit
  startEdit(item: RecipeItem) {
    this.editingId.set(item.id);
    this.editQuantity.set(item.quantityRequired);
    this.editUnit.set(item.unit);
    this.editWastePercent.set(item.wastePercent);
  }

  cancelEdit() { this.editingId.set(''); }

  saveEdit(item: RecipeItem) {
    const payload: UpdateRecipeItemRequest = {
      quantityRequired: this.editQuantity(),
      unit: this.editUnit(),
      wastePercent: this.editWastePercent(),
    };
    this.inventoryApi.updateRecipeItem(item.id, payload).subscribe({
      next: (updated) => {
        this.recipeItems.update(items => items.map(i => i.id === updated.id ? updated : i));
        this.editingId.set('');
      },
      error: () => Swal.fire({ icon: 'error', title: 'Failed to update' }),
    });
  }

  // Delete
  removeItem(item: RecipeItem) {
    Swal.fire({
      title: 'Remove ingredient?',
      text: `Remove ${this.getIngredientName(item.ingredientId)} from recipe?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove',
    }).then(r => {
      if (r.isConfirmed) {
        this.inventoryApi.removeRecipeItem(item.id).subscribe({
          next: () => this.recipeItems.update(items => items.filter(i => i.id !== item.id)),
          error: () => Swal.fire({ icon: 'error', title: 'Failed to remove' }),
        });
      }
    });
  }

  trackById(_: number, item: RecipeItem) { return item.id; }
}
