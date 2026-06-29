import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TabsApiService } from '@serveiq/shared/data-access';
import { Tab } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tabs-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs-management.component.html',
  styleUrls: ['./tabs-management.component.scss']
})
export class TabsManagementComponent implements OnInit {
  private tabsApi = inject(TabsApiService);
  private router = inject(Router);

  tabs = signal<Tab[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadTabs();
  }

  loadTabs() {
    this.isLoading.set(true);
    this.tabsApi.getAll().subscribe({
      next: (data) => {
        this.tabs.set(Array.isArray(data) ? data : []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to load tabs', confirmButtonColor: '#F97316' });
      }
    });
  }

  viewTab(tab: Tab) {
    this.router.navigate(['/tabs/detail', tab.id]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'open': return 'status-open';
      case 'closed': return 'status-closed';
      case 'voided': return 'status-voided';
      default: return '';
    }
  }

  formatKobo(kobo: number): string {
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  trackById(_index: number, tab: Tab) {
    return tab.id;
  }
}
