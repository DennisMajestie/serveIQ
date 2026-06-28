import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TabsApiService, TablesApiService } from '@serveiq/shared/data-access';
import { OpenTabRequest, Table } from '@serveiq/shared/models';
import Swal from 'sweetalert2';

function getBranchId(): string | null {
  return localStorage.getItem('branchId');
}

@Component({
  selector: 'app-open-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './open-tab.component.html',
  styleUrls: ['./open-tab.component.scss']
})
export class OpenTabComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tabsApi = inject(TabsApiService);
  private tablesApi = inject(TablesApiService);

  tableId = '';
  tableName = 'Table —';
  customerName = '';
  numPeople = 1;
  isLoading = true;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('tableId');
    if (id) {
      this.tableId = id;
      this.tablesApi.getTable(id).subscribe({
        next: (table: Table) => {
          this.tableName = `Table ${table.tableNumber}`;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  cancel() {
    this.router.navigate(['/tables']);
  }

  confirm() {
    if (this.numPeople < 1) {
      Swal.fire({ icon: 'warning', title: 'Invalid', text: 'Party size must be at least 1' });
      return;
    }

    const request: OpenTabRequest = {
      table_id: this.tableId,
      party_size: this.numPeople,
      branch_id: getBranchId() || undefined,
      customer_name: this.customerName || undefined,
    };

    this.tabsApi.createTab(request).subscribe({
      next: (newTab) => {
        if (newTab?.id) {
          this.router.navigate(['/tabs/detail', newTab.id]);
        }
      },
      error: (err) => {
        console.error('Failed to open tab:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to open tab' });
      }
    });
  }
}
