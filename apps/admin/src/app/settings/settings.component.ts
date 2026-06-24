import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchesApiService } from '@serveiq/shared/data-access';
import { Branch } from '@serveiq/shared/models';



@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private branchesApi = inject(BranchesApiService);
  branches = signal<Branch[]>([]);
  isLoading = signal(true);
  copiedBranchId = signal<string | null>(null);

  ngOnInit() {
    this.branchesApi.list().subscribe({
      next: (b) => { this.branches.set(b); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  copyBranchId(branchId: string) {
    navigator.clipboard.writeText(branchId);
    this.copiedBranchId.set(branchId);
    setTimeout(() => this.copiedBranchId.set(null), 2000);
  }

  isCopied(branchId: string): boolean {
    return this.copiedBranchId() === branchId;
  }
}
