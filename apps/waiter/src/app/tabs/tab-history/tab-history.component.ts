import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TabsApiService } from '@serveiq/shared/data-access';
import { Tab } from '@serveiq/shared/models';

@Component({
  selector: 'app-tab-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-history.component.html',
  styleUrls: ['./tab-history.component.scss']
})
export class TabHistoryComponent implements OnInit {
  private router = inject(Router);
  private tabsApi = inject(TabsApiService);

  isLoading = signal(true);
  closedTabs = signal<Tab[]>([]);

  currentDate = new Date().toLocaleDateString('en-NG', { month: 'long', day: 'numeric' });

  shiftTotal = computed(() =>
    this.closedTabs().length
  );

  ngOnInit() {
    this.tabsApi.getAllTabs().subscribe({
      next: (tabs) => {
        // Show closed/paid/voided tabs
        const closed = tabs.filter(t => t.status === 'paid' || t.status === 'voided');
        this.closedTabs.set(closed);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  formatKobo(kobo: number): string {
    return (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }

  getStatusLabel(tab: Tab): string {
    return tab.status === 'paid' ? 'Paid' : tab.status === 'voided' ? 'Voided' : tab.status;
  }

  openTransaction(tab: Tab) {
    this.router.navigate(['/tabs/receipt', tab.id]);
  }

  goBack() {
    this.router.navigate(['/tables']);
  }
}