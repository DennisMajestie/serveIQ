import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import {
  Ingredient,
  CreateIngredientRequest,
  UpdateIngredientRequest,
  StockMovement,
  AddStockRequest,
  BestsellerReport,
  RecipeItem,
  AddRecipeItemRequest,
  UpdateRecipeItemRequest,
} from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class InventoryApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  list(): Observable<Ingredient[]> {
    return this.get<Ingredient[]>(API_CONFIG.endpoints.inventory.list);
  }

  getById(id: string): Observable<Ingredient> {
    return this.get<Ingredient>(buildUrl(API_CONFIG.endpoints.inventory.get, { id }));
  }

  create(data: CreateIngredientRequest): Observable<Ingredient> {
    return this.post<Ingredient>(API_CONFIG.endpoints.inventory.create, data);
  }

  update(id: string, data: UpdateIngredientRequest): Observable<Ingredient> {
    return this.patch<Ingredient>(buildUrl(API_CONFIG.endpoints.inventory.update, { id }), data);
  }

  removeById(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.inventory.delete, { id }));
  }

  addStock(id: string, data: AddStockRequest): Observable<StockMovement> {
    return this.post<StockMovement>(buildUrl(API_CONFIG.endpoints.inventory.stock, { id }), data);
  }

  getMovements(id: string): Observable<StockMovement[]> {
    return this.get<StockMovement[]>(buildUrl(API_CONFIG.endpoints.inventory.movements, { id }));
  }

  getAlerts(): Observable<Ingredient[]> {
    return this.get<Ingredient[]>(API_CONFIG.endpoints.inventory.alerts);
  }

  getBestsellers(dateFrom?: string, dateTo?: string): Observable<BestsellerReport> {
    return this.get<BestsellerReport>(API_CONFIG.endpoints.inventory.bestsellers, undefined, { dateFrom, dateTo } as any);
  }

  getStockVariance(): Observable<any> {
    return this.get<any>(API_CONFIG.endpoints.inventory.stockVariance);
  }

  // Recipe / BOM
  getRecipe(menuItemId: string): Observable<RecipeItem[]> {
    return this.get<RecipeItem[]>(buildUrl(API_CONFIG.endpoints.recipe.list, { menuItemId }));
  }

  addRecipeItem(menuItemId: string, data: AddRecipeItemRequest): Observable<RecipeItem> {
    return this.post<RecipeItem>(buildUrl(API_CONFIG.endpoints.recipe.create, { menuItemId }), data);
  }

  updateRecipeItem(id: string, data: UpdateRecipeItemRequest): Observable<RecipeItem> {
    return this.patch<RecipeItem>(buildUrl(API_CONFIG.endpoints.recipeItems.update, { id }), data);
  }

  removeRecipeItem(id: string): Observable<void> {
    return this.delete<void>(buildUrl(API_CONFIG.endpoints.recipeItems.delete, { id }));
  }
}
