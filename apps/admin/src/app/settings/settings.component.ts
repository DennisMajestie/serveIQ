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

  ngOnInit() {
    this.branchesApi.list().subscribe({
      next: (b) => { this.branches.set(b); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }
}
