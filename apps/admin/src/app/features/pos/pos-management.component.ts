import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PosTerminal {
  id: string;
  label: string;
  is_active: boolean;
}

@Component({
  selector: 'app-pos-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos-management.component.html',
  styleUrls: ['./pos-management.component.scss'],
})
export class PosManagementComponent implements OnInit {
  private http = inject(HttpClient);

  terminals = signal<PosTerminal[]>([]);
  showModal = signal(false);
  editingTerminal = signal<PosTerminal | null>(null);
  formLabel = signal('');
  formActive = signal(true);

  ngOnInit() { this.loadTerminals(); }

  loadTerminals() {
    this.http.get<PosTerminal[]>('/api/v1/pos/terminals').subscribe(data => {
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
    this.formActive.set(t.is_active);
    this.showModal.set(true);
  }

  saveTerminal() {
    const body = { label: this.formLabel(), is_active: this.formActive() };
    const req = this.editingTerminal()
      ? this.http.patch('/api/v1/pos/terminals/' + this.editingTerminal()!.id, body)
      : this.http.post('/api/v1/pos/terminals', body);
    req.subscribe(() => {
      this.showModal.set(false);
      this.loadTerminals();
    });
  }

  deleteTerminal(id: string) {
    if (confirm('Delete this POS terminal?'))
      this.http.delete('/api/v1/pos/terminals/' + id).subscribe(() => this.loadTerminals());
  }
}
