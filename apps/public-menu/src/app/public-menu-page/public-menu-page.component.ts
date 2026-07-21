import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PublicMenuApiService, PublicMenuData } from '@serveiq/shared/data-access';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-public-menu-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-menu-page.component.html',
  styleUrls: ['./public-menu-page.component.scss'],
})
export class PublicMenuPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private menuApi = inject(PublicMenuApiService);

  data = signal<PublicMenuData | null>(null);
  loading = signal(true);
  error = signal(false);
  categories = signal<string[]>([]);
  selectedCategory = signal<string | null>(null);

  ngOnInit() {
    const branchId = this.route.snapshot.paramMap.get('branchId');
    if (!branchId) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    this.menuApi.getMenu(branchId).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (menu) => {
        this.data.set(menu);
        this.applyBrandColors(menu);
        const cats = [...new Set(menu.items.map(i => i.category))];
        this.categories.set(cats);
        this.selectedCategory.set(cats[0] ?? null);
      },
      error: () => this.error.set(true),
    });
  }

  private applyBrandColors(menu: PublicMenuData): void {
    const root = document.documentElement;
    if (menu.brandPrimaryColor) root.style.setProperty('--primary', menu.brandPrimaryColor);
    if (menu.brandAccentColor) root.style.setProperty('--accent', menu.brandAccentColor);
  }

  groupItems(category: string) {
    return this.data()?.items.filter(i => i.category === category) ?? [];
  }
}
