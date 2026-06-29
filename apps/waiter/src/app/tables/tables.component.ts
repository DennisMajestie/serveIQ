import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TablesApiService, TabsApiService } from '@serveiq/shared/data-access';
import { Table, Tab } from '@serveiq/shared/models';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit, OnDestroy {
  private tablesApi = inject(TablesApiService);
  private tabsApi = inject(TabsApiService);
  private router = inject(Router);

  branchName = 'Main Dining Room';
  isSynced = signal(false);
  isLoading = signal(true);

  tables = signal<Table[]>([]);
  openTabs = signal<Tab[]>([]);

  stats = computed(() => {
    const t = this.tables();
    if (!Array.isArray(t)) return { totalTables: 0, available: 0, occupied: 0 };
    return {
      totalTables: t.length,
      available: t.filter(x => x.status === 'available').length,
      occupied: t.filter(x => x.status === 'occupied').length
    };
  });

  private pollSub?: Subscription;

  ngOnInit() {
    this.loadTables();
    this.loadOpenTabs();
    // Poll every 5 seconds for live updates
    this.pollSub = interval(5000).pipe(
      switchMap(() => this.tablesApi.getAllTables())
    ).subscribe(tables => {
      if (Array.isArray(tables)) this.tables.set(tables);
      this.isSynced.set(true);
      this.loadOpenTabs();
    });
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  loadTables() {
    this.tablesApi.getAllTables().subscribe({
      next: (tables) => {
        this.tables.set(tables);
        this.isLoading.set(false);
        this.isSynced.set(true);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadOpenTabs() {
    this.tabsApi.getAllTabs().subscribe({
      next: (tabs) => {
        this.openTabs.set(Array.isArray(tabs) ? tabs.filter(t => t.status === 'open') : []);
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'occupied': return '#EF4444';
      case 'available': return '#22C55E';
      case 'reserved': return '#EAB308';
      default: return '#94a3b8';
    }
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  async onTableClick(table: Table) {
    if (table.status === 'available') {
      await this.router.navigate(['/tabs/create', table.id]);
    } else {
      const tabs = await this.tabsApi.getAllTabs().toPromise();
      const openTab = (tabs || []).find(t => t.tableId === table.id && t.status === 'open');
      if (openTab) {
        await this.router.navigate(['/tabs/detail', openTab.id]);
      } else {
        await this.router.navigate(['/tabs/create', table.id]);
      }
    }
  }

  async onSeatTable(table: Table) {
    // Same logic as onTableClick
    await this.onTableClick(table);
  }
}
