import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ENVIRONMENT_CONFIG, PosApiService } from '@serveiq/shared/data-access';
import { firstValueFrom } from 'rxjs';

interface PosTerminal {
  id: string;
  label: string;
  isActive: boolean;
}

@Component({
  selector: 'app-pos-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos-management.component.html',
  styleUrls: ['./pos-management.component.scss'],
})
export class PosManagementComponent implements OnInit {
  private posApi = inject(PosApiService);

  terminals = signal<PosTerminal[]>([]);
  showModal = signal(false);
  editingTerminal = signal<PosTerminal | null>(null);
  formLabel = signal('');
  formActive = signal(true);

  ngOnInit() { this.loadTerminals(); }

  loadTerminals() {
    this.posApi.getAll().subscribe(data => {
      this.terminals.set(Array.isArray(data) ? data : []);
    });
  }

  openAddModal() {
    this.editingTerminal.set(null);
    this.formLabel.set('');
    this.formActive.set(true);
    this.showModal.set(true);
  }

  editTerminal(t: PosTerminal) {
    this.editingTerminal.set(t);
    this.formLabel.set(t.label);
    this.formActive.set(t.isActive);
    this.showModal.set(true);
  }

  saveTerminal() {
    const body = { label: this.formLabel(), is_active: this.formActive() };
    const obs = this.editingTerminal()
      ? this.posApi.update(this.editingTerminal()!.id, body)
      : this.posApi.create(body);
    obs.subscribe(() => {
      this.showModal.set(false);
      this.loadTerminals();
    });
  }

  deleteTerminal(id: string) {
    if (confirm('Delete this POS terminal?'))
      this.posApi.remove(id).subscribe(() => this.loadTerminals());
  }
}
