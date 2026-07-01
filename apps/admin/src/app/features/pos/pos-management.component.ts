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
  template: `
    <div class="page-header">
      <div class="title-group">
        <h2>POS Terminals</h2>
        <p>Manage point-of-sale devices connected to this branch.</p>
      </div>
      <button class="btn-add-branch" (click)="openAddModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add POS
      </button>
    </div>

    <div class="settings-card" style="padding:0;overflow:hidden;">
      <table class="branch-table" *ngIf="terminals().length > 0; else emptyState">
        <thead>
          <tr>
            <th>Label</th>
            <th>Status</th>
            <th style="width:140px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let terminal of terminals()">
            <td>
              <div class="cell-branch-name">
                <div class="branch-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <div class="branch-info">
                  <span class="branch-title">{{ terminal.label }}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="status-badge" [class.status-active]="terminal.is_active" [class.status-inactive]="!terminal.is_active">
                {{ terminal.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="branch-actions">
                <button class="btn-action btn-edit" (click)="editTerminal(terminal)" title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                </button>
                <button class="btn-action btn-delete" (click)="deleteTerminal(terminal.id)" title="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <ng-template #emptyState>
        <div class="branch-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;color:#d1d5db;margin-bottom:16px;">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <p style="color:#9ca3af;margin:0;font-size:0.9375rem;">No POS terminals yet.</p>
        </div>
      </ng-template>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal-overlay" *ngIf="showModal()" (click)="showModal.set(false)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingTerminal() ? 'Edit POS Terminal' : 'Add POS Terminal' }}</h3>
          <button class="modal-close" (click)="showModal.set(false)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px;height:20px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="config-label">LABEL</label>
            <input type="text" [(ngModel)]="formLabel" class="config-input" placeholder="e.g. POS 1">
          </div>
          <div class="form-group" style="flex-direction:row;align-items:center;gap:10px;">
            <input type="checkbox" id="pos-active" [(ngModel)]="formActive" style="width:18px;height:18px;">
            <label for="pos-active" style="font-size:0.875rem;font-weight:600;color:#0f172a;">Active</label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="showModal.set(false)">Cancel</button>
          <button class="btn-save" (click)="saveTerminal()" [disabled]="!formLabel()">
            {{ editingTerminal() ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .title-group h2 {
      margin: 0;
      font-weight: 700;
      font-size: 1.5rem;
      color: #0b1c30;
    }
    .title-group p {
      margin: 4px 0 0;
      font-size: 0.875rem;
      color: #64748b;
    }
    .btn-add-branch {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: #0b1c30;
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
    }
    .btn-add-branch:hover { background: #1e293b; }
  `]
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
