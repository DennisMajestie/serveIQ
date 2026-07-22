import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdsApiService, Ad, UploadApiService, BranchesApiService, Branch } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Advertisements</h1>
        <button class="btn-primary" (click)="openCreateModal()">
          <span class="material-symbols-outlined">add</span>
          New Ad
        </button>
      </div>

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
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Sort Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (ad of ads(); track ad.id) {
                <tr>
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
                  <td class="cell-branch">{{ branchName(ad.branchId) }}</td>
                  <td>
                    <span class="status-badge" [class.active]="ad.isActive !== false" [class.inactive]="ad.isActive === false">
                      {{ ad.isActive === false ? 'Inactive' : 'Active' }}
                    </span>
                  </td>
                  <td class="cell-order">{{ ad.sortOrder }}</td>
                  <td class="cell-actions">
                    <button class="btn-icon" (click)="openEditModal(ad)" title="Edit">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="btn-icon btn-danger-icon" (click)="deleteAd(ad)" title="Delete">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
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
              <label>Branch</label>
              <select [(ngModel)]="formBranchId" class="form-input">
                @for (b of branches(); track b.id) {
                  <option [value]="b.id">{{ b.name }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Sort Order</label>
              <input type="number" [(ngModel)]="formSortOrder" class="form-input" style="width:100px" />
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
    .page-container { padding: 24px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border: none; border-radius: 10px; background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }
    .btn-secondary { padding: 10px 20px; border: 1px solid #333; border-radius: 10px; background: transparent; color: #ccc; font-size: 14px; cursor: pointer; }
    .btn-icon { background: none; border: none; color: #888; cursor: pointer; padding: 4px; border-radius: 6px; }
    .btn-icon:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .btn-danger-icon:hover { background: rgba(239,68,68,0.1); color: #ef4444; }
    .loading-shimmer { display: flex; flex-direction: column; gap: 12px; }
    .shimmer-row { height: 48px; border-radius: 8px; background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .empty-state { text-align: center; padding: 60px 16px; color: #666; }
    .empty-state .material-symbols-outlined { font-size: 48px; margin-bottom: 12px; }
    .empty-state h3 { margin: 0 0 8px; color: #999; }
    .empty-state p { margin: 0; font-size: 14px; }
    .table-wrap { border: 1px solid #2a2a2a; border-radius: 12px; overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; background: #1a1a1a; border-bottom: 1px solid #2a2a2a; }
    .data-table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #222; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: rgba(255,255,255,0.02); }
    .cell-name { font-weight: 500; color: #e0e0e0; }
    .cell-order { color: #888; font-size: 13px; }
    .cell-branch { color: #aaa; font-size: 13px; }
    .cell-actions { display: flex; gap: 4px; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
    .status-badge.active { background: rgba(76,175,80,0.15); color: #81c784; }
    .status-badge.inactive { background: rgba(158,158,158,0.15); color: #bdbdbd; }
    .thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
    .thumb-placeholder { width: 48px; height: 48px; border-radius: 8px; background: #2a2a2a; display: flex; align-items: center; justify-content: center; }
    .thumb-placeholder .material-symbols-outlined { font-size: 20px; color: #555; }
    .preview-img { margin-top: 8px; max-width: 200px; max-height: 120px; border-radius: 8px; object-fit: cover; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-card { background: #1a1a1a; border-radius: 16px; width: 480px; max-width: 90vw; border: 1px solid #2a2a2a; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 0; }
    .modal-header h2 { margin: 0; font-size: 18px; }
    .btn-close { background: none; border: none; color: #888; font-size: 24px; cursor: pointer; }
    .modal-body { padding: 20px 24px; max-height: 60vh; overflow-y: auto; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 0 24px 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #888; margin-bottom: 6px; }
    .form-input { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid #333; background: #111; color: #e0e0e0; font-size: 14px; box-sizing: border-box; }
    .form-input:focus { outline: none; border-color: #f97316; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #e0e0e0; cursor: pointer; }
    .checkbox-label input { width: 16px; height: 16px; }
    .form-error { background: rgba(239,68,68,0.1); color: #ef4444; padding: 8px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
  `]
})
export class AdsComponent implements OnInit {
  private adsApi = inject(AdsApiService);
  private uploadService = inject(UploadApiService);
  private branchesApi = inject(BranchesApiService);

  ads = signal<Ad[]>([]);
  branches = signal<Branch[]>([]);
  isLoading = signal(true);

  showModal = signal(false);
  editingAd = signal<Ad | null>(null);
  formTitle = '';
  formLinkUrl = '';
  formSortOrder = 0;
  formBranchId = '';
  formIsActive = true;
  formImagePreview = signal<string | null>(null);
  private selectedFile: File | null = null;
  formError = signal('');
  formSubmitting = signal(false);

  ngOnInit() {
    this.loadAds();
    this.branchesApi.list().subscribe({
      next: (b) => {
        this.branches.set(b);
        if (b.length > 0 && !this.formBranchId) {
          this.formBranchId = b[0].id;
        }
      }
    });
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
    this.formBranchId = localStorage.getItem('branchId') || (this.branches().length > 0 ? this.branches()[0].id : '');
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
    this.formBranchId = ad.branchId || '';
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

    const branchId = this.formBranchId || localStorage.getItem('branchId') || '';

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
        branch_id: branchId,
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

  branchName(id: string): string {
    return this.branches().find(b => b.id === id)?.name || id.slice(0, 8) + '...';
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
