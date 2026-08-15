import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ReviewsApiService, ReviewsResponse, ReviewItem, BranchesApiService } from '@serveiq/shared/data-access';
import { Branch } from '@serveiq/shared/models';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reviews-page">
      <header class="reviews-header">
        <div>
          <h1>Reviews</h1>
          <p class="subtitle">Customer satisfaction across your branches</p>
        </div>
        <div class="avg-card" *ngIf="response() as res">
          <span class="avg-value">{{ res.meta.average.toFixed(1) }} / 5</span>
          <span class="avg-label">{{ res.meta.count }} review{{ res.meta.count === 1 ? '' : 's' }}</span>
        </div>
      </header>

      <div class="filters">
        <select [(ngModel)]="filters.branchId" (ngModelChange)="load(1)">
          <option value="">All branches</option>
          <option *ngFor="let b of branches()" [value]="b.id">{{ b.name }}</option>
        </select>
        <select [(ngModel)]="filters.minRating" (ngModelChange)="load(1)">
          <option value="">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4+ stars</option>
          <option value="3">3+ stars</option>
          <option value="1">1+ star</option>
        </select>
      </div>

      <div class="loading" *ngIf="loading()">Loading reviews…</div>

      <div class="empty" *ngIf="!loading() && reviews().length === 0">
        No reviews yet. Reviews appear here once customers rate their visits.
      </div>

      <div class="review-list" *ngIf="!loading() && reviews().length > 0">
        <div class="review-card" *ngFor="let r of reviews()">
          <div class="review-top">
            <div class="stars">
              <span
                class="star"
                [class.filled]="i <= r.rating - 1"
                *ngFor="let i of [0,1,2,3,4]">★</span>
            </div>
            <span class="rating-badge">{{ r.rating }}/5</span>
            <span class="branch-name" *ngIf="r.branchName">{{ r.branchName }}</span>
            <span class="date">{{ r.createdAt | date:'medium' }}</span>
          </div>
          <p class="comment" *ngIf="r.comment">{{ r.comment }}</p>
          <p class="no-comment" *ngIf="!r.comment">No written comment.</p>
          <div class="items" *ngIf="r.items.length > 0">
            <span class="item-chip" *ngFor="let it of r.items">{{ it.name }} ×{{ it.quantity }}</span>
          </div>
        </div>
      </div>

      <div class="pagination" *ngIf="response() as res">
        <button [disabled]="res.meta.page <= 1" (click)="load(res.meta.page - 1)">
          Previous
        </button>
        <span>Page {{ res.meta.page }} of {{ res.meta.totalPages || 1 }}</span>
        <button [disabled]="res.meta.page >= res.meta.totalPages" (click)="load(res.meta.page + 1)">
          Next
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 24px; font-family: 'Inter', sans-serif; }
    .reviews-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    h1 { margin: 0; font-size: 24px; color: var(--on-surface); }
    .subtitle { margin: 4px 0 0; color: var(--on-surface-variant); font-size: 14px; }
    .avg-card { background: var(--surface-container); border: 1px solid var(--outline-variant); border-radius: 12px; padding: 12px 20px; text-align: center; }
    .avg-value { display: block; font-size: 24px; font-weight: 700; color: var(--primary); }
    .avg-label { font-size: 13px; color: var(--on-surface-variant); }
    .filters { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .filters select {
      padding: 8px 12px; border: 1px solid var(--outline-variant); border-radius: 8px;
      background: var(--surface); color: var(--on-surface); font-size: 14px; font-family: inherit;
    }
    .loading, .empty { text-align: center; color: var(--on-surface-variant); padding: 48px 0; font-size: 14px; }
    .review-list { display: flex; flex-direction: column; gap: 12px; }
    .review-card {
      background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 12px;
      padding: 16px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .review-top { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .stars { color: var(--outline-variant); font-size: 16px; letter-spacing: 2px; }
    .star.filled { color: #f59e0b; }
    .rating-badge { background: var(--surface-container-high); border-radius: 9999px; padding: 2px 10px; font-size: 12px; font-weight: 700; color: var(--on-surface); }
    .branch-name { font-size: 14px; font-weight: 600; color: var(--on-surface); }
    .date { margin-left: auto; font-size: 12px; color: var(--on-surface-variant); }
    .comment { margin: 12px 0 0; font-size: 14px; line-height: 1.5; color: var(--on-surface); }
    .no-comment { margin: 12px 0 0; font-size: 13px; color: var(--on-surface-variant); font-style: italic; }
    .items { margin-top: 12px; display: flex; gap: 6px; flex-wrap: wrap; }
    .item-chip { background: var(--surface-container-low); border: 1px solid var(--outline-variant); border-radius: 9999px; padding: 2px 10px; font-size: 12px; color: var(--on-surface-variant); }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 24px; font-size: 13px; color: var(--on-surface-variant); }
    .pagination button {
      padding: 6px 14px; border: 1px solid var(--outline-variant); border-radius: 8px;
      background: var(--surface); color: var(--on-surface); cursor: pointer; font-family: inherit; font-size: 13px;
    }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
  `],
})
export class ReviewsComponent implements OnInit {
  private reviewsApi = inject(ReviewsApiService);
  private branchesApi = inject(BranchesApiService);

  response = signal<ReviewsResponse | null>(null);
  reviews = signal<ReviewItem[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(true);
  filters: { branchId: string; minRating: string } = { branchId: '', minRating: '' };

  ngOnInit() {
    this.branchesApi.list().subscribe({
      next: (branches) => this.branches.set(branches),
      error: () => {},
    });
    this.load(1);
  }

  load(page: number) {
    this.loading.set(true);
    this.reviewsApi
      .getReviews({
        branchId: this.filters.branchId || undefined,
        minRating: this.filters.minRating || undefined,
        page: String(page || 1),
        limit: '50',
      })
      .subscribe({
        next: (res) => {
          this.response.set(res);
          this.reviews.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}