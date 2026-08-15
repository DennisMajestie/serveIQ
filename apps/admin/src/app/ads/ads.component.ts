import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdsApiService, Ad, UploadApiService } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <header class="page-header">
        <div class="header-content">
          <div class="title-group">
            <h1 class="page-title">Advertisements</h1>
            <p class="page-subtitle">Promote offers and announcements on customer tracking pages.</p>
          </div>
          <button class="btn-primary" (click)="openCreateModal()">
            <span class="material-symbols-outlined">add</span>
            New Ad
          </button>
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading-shimmer">
          <div class="shimmer-row"></div>
          <div class="shimmer-row"></div>
          <div class="shimmer-row"></div>
        </div>
      } @else if (ads().length === 0) {
        <div class="empty-state">
          <span class="material-symbols-outlined">campaign</span>
          <h3>No Advertisements Yet</h3>
          <p>Create ads to promote offers and announcements on customer tracking pages.</p>
        </div>
      } @else {
        <section class="table-card">
          <div class="table-header">
            <h2>All Advertisements</h2>
          </div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Scope</th>
                  <th>Status</th>
                  <th>Sort Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (ad of ads(); track ad.id) {
                  <tr class="data-row">
                    <td>
                      @if (ad.imageUrl) {
                        <img [src]="ad.imageUrl" [alt]="ad.title" class="thumb" />
                      } @else {
                        <div class="thumb-placeholder">
                          <span class="material-symbols-outlined">image</span>
                        </div>
                      }
                    </td>
                    <td class="cell-name">{{ ad.title }}</td>
                    <td class="cell-branch">{{ ad.branchId ? 'Branch' : 'All Branches' }}</td>
                    <td>
                      <span class="status-badge" [class.active]="ad.isActive !== false" [class.inactive]="ad.isActive === false">
                        {{ ad.isActive === false ? 'Inactive' : 'Active' }}
                      </span>
                    </td>
                    <td class="cell-order">{{ ad.sortOrder }}</td>
                    <td class="cell-actions">
                      <button class="action-icon-btn" (click)="openEditModal(ad)" title="Edit">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                      <button class="action-icon-btn action-icon-btn--danger" (click)="deleteAd(ad)" title="Delete">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingAd() ? 'Edit Ad' : 'New Ad' }}</h2>
            <button class="btn-close" (click)="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            @if (formError()) {
              <div class="form-error">{{ formError() }}</div>
            }
            <div class="form-group">
              <label>Title</label>
              <input type="text" [(ngModel)]="formTitle" placeholder="e.g. Happy Hour Special" class="form-input" autofocus />
            </div>
            <div class="form-group">
              <label>Image</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onImageSelected($event)" class="form-input" />
              @if (formImagePreview()) {
                <img [src]="formImagePreview()" class="preview-img" />
              }
            </div>
            <div class="form-group">
              <label>Link URL (optional)</label>
              <input type="url" [(ngModel)]="formLinkUrl" placeholder="https://example.com/offer" class="form-input" />
            </div>
            <div class="form-group">
              <label>Sort Order</label>
              <input type="number" [(ngModel)]="formSortOrder" class="form-input form-input--sm" />
            </div>
            @if (editingAd()) {
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formIsActive" />
                  Active
                </label>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" (click)="saveAd()" [disabled]="formSubmitting()">
              {{ formSubmitting() ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; padding: 32px; }
    .admin-page { }
    .page-header { margin-bottom: 28px; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .page-title { font-size: 20px; font-weight: 700; color: var(--on-surface); margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: var(--secondary); margin: 0; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border: none; border-radius: 10px; background: var(--primary); color: var(--on-primary); font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 25%, transparent); }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }
    .btn-secondary { padding: 10px 20px; border: 1px solid var(--outline-variant); border-radius: 10px; background: transparent; color: var(--secondary); font-size: 14px; cursor: pointer; }
    .btn-secondary:hover { background: var(--surface-container-high); }
    .loading-shimmer { display: flex; flex-direction: column; gap: 12px; }
    .shimmer-row { height: 48px; border-radius: 8px; background: linear-gradient(90deg, var(--surface-container-high) 25%, var(--surface-container-highest) 50%, var(--surface-container-high) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .empty-state { text-align: center; padding: 60px 16px; color: var(--secondary); }
    .empty-state .material-symbols-outlined { font-size: 48px; margin-bottom: 12px; color: var(--primary); }
    .empty-state h3 { margin: 0 0 8px; color: var(--on-surface); }
    .empty-state p { margin: 0; font-size: 14px; }
    .table-card { background: var(--surface-container-lowest); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
    .table-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--outline-variant); }
    .table-header h2 { font-size: 16px; font-weight: 700; color: var(--on-surface); margin: 0; }
    .table-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; background: var(--surface-container-low); border-bottom: 1px solid var(--outline-variant); }
    .data-table td { padding: 14px 16px; font-size: 14px; color: var(--secondary); border-bottom: 1px solid var(--outline-variant); }
    .data-table tr:last-child td { border-bottom: none; }
    .data-row:hover { background: var(--surface-container-low); }
    .cell-name { font-weight: 500; color: var(--on-surface); }
    .cell-order { color: var(--secondary); font-size: 13px; }
    .cell-branch { color: var(--secondary); font-size: 13px; }
    .cell-actions { display: flex; gap: 4px; }
    .action-icon-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; color: var(--secondary); transition: all 0.15s; }
    .action-icon-btn:hover { background: var(--surface-container-low); color: var(--primary); }
    .action-icon-btn .material-symbols-outlined { font-size: 20px; }
    .action-icon-btn--danger:hover { background: var(--error-container); color: var(--error); }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status-badge.active { background: color-mix(in srgb, var(--primary) 15%, transparent); color: var(--primary); }
    .status-badge.inactive { background: var(--error-container); color: var(--on-error-container); }
    .thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
    .thumb-placeholder { width: 48px; height: 48px; border-radius: 8px; background: var(--surface-container-high); display: flex; align-items: center; justify-content: center; }
    .thumb-placeholder .material-symbols-outlined { font-size: 20px; color: var(--secondary); }
    .preview-img { margin-top: 8px; max-width: 200px; max-height: 120px; border-radius: 8px; object-fit: cover; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(2px); }
    .modal-card { background: var(--surface-container-lowest); border-radius: 16px; width: 480px; max-width: 90vw; border: 1px solid var(--outline-variant); box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 0; }
    .modal-header h2 { margin: 0; font-size: 18px; color: var(--on-surface); }
    .btn-close { background: none; border: none; color: var(--secondary); font-size: 24px; cursor: pointer; }
    .btn-close:hover { color: var(--on-surface); }
    .modal-body { padding: 20px 24px; max-height: 60vh; overflow-y: auto; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 0 24px 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--secondary); margin-bottom: 6px; }
    .form-input { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--outline); background: var(--surface-container-low); color: var(--on-surface); font-size: 14px; box-sizing: border-box; }
    .form-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent); }
    .form-input--sm { width: 100px; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--on-surface); cursor: pointer; }
    .checkbox-label input { width: 16px; height: 16px; }
    .form-error { background: var(--error-container); color: var(--on-error-container); padding: 8px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
  `]
})
export class AdsComponent implements OnInit {
  private adsApi = inject(AdsApiService);
  private uploadService = inject(UploadApiService);

  ads = signal<Ad[]>([]);
  isLoading = signal(true);

  showModal = signal(false);
  editingAd = signal<Ad | null>(null);
  formTitle = '';
  formLinkUrl = '';
  formSortOrder = 0;
  formIsActive = true;
  formImagePreview = signal<string | null>(null);
  private selectedFile: File | null = null;
  formError = signal('');
  formSubmitting = signal(false);

  ngOnInit() {
    this.loadAds();
  }

  loadAds() {
    this.isLoading.set(true);
    this.adsApi.getAll().subscribe({
      next: (data) => {
        this.ads.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to load advertisements' });
      }
    });
  }

  openCreateModal() {
    this.formTitle = '';
    this.formLinkUrl = '';
    this.formSortOrder = 0;
    this.formIsActive = true;
    this.formImagePreview.set(null);
    this.selectedFile = null;
    this.formError.set('');
    this.editingAd.set(null);
    this.showModal.set(true);
  }

  openEditModal(ad: Ad) {
    this.formTitle = ad.title;
    this.formLinkUrl = ad.linkUrl || '';
    this.formSortOrder = ad.sortOrder || 0;
    this.formIsActive = ad.isActive !== false;
    this.formImagePreview.set(null);
    this.selectedFile = null;
    this.formError.set('');
    this.editingAd.set(ad);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingAd.set(null);
  }

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => this.formImagePreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async saveAd() {
    const title = this.formTitle.trim();
    if (!title) {
      this.formError.set('Title is required');
      return;
    }
    this.formSubmitting.set(true);
    this.formError.set('');

    let imageUrl = this.editingAd()?.imageUrl || '';
    if (this.selectedFile) {
      try {
        const uploaded = await this.uploadService.uploadFile(this.selectedFile).toPromise();
        if (uploaded?.url) imageUrl = uploaded.url;
      } catch {
        this.formError.set('Failed to upload image');
        this.formSubmitting.set(false);
        return;
      }
    }

    if (this.editingAd()) {
      const id = this.editingAd()!.id;
      this.adsApi.update(id, {
        title,
        image_url: imageUrl || undefined,
        link_url: this.formLinkUrl || undefined,
        is_active: this.formIsActive,
        sort_order: this.formSortOrder,
      }).subscribe({
        next: (updated) => {
          this.formSubmitting.set(false);
          this.ads.update(list => list.map(a => a.id === updated.id ? updated : a));
          this.closeModal();
          Swal.fire({ icon: 'success', title: 'Ad Updated', timer: 1500, showConfirmButton: false });
        },
        error: (err) => {
          this.formSubmitting.set(false);
          this.formError.set(err.error?.message || 'Failed to update ad');
        }
      });
    } else {
      this.adsApi.create({
        title,
        image_url: imageUrl || undefined,
        link_url: this.formLinkUrl || undefined,
        sort_order: this.formSortOrder,
      }).subscribe({
        next: (saved) => {
          this.formSubmitting.set(false);
          this.ads.update(list => [...list, saved]);
          this.closeModal();
          Swal.fire({ icon: 'success', title: 'Ad Created', timer: 1500, showConfirmButton: false });
        },
        error: (err) => {
          this.formSubmitting.set(false);
          this.formError.set(err.error?.message || 'Failed to create ad');
        }
      });
    }
  }

  deleteAd(ad: Ad) {
    Swal.fire({
      title: 'Delete Ad',
      text: `Are you sure you want to delete "${ad.title}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444',
    }).then((result) => {
      if (result.isConfirmed) {
        this.adsApi.remove(ad.id).subscribe({
          next: () => {
            this.ads.set(this.ads().filter(a => a.id !== ad.id));
            Swal.fire({ icon: 'success', title: 'Ad Deleted', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Delete Failed' })
        });
      }
    });
  }
}