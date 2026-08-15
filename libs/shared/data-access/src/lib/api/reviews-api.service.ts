import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG } from './api.config';

export interface ReviewItem {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  branchId?: string;
  branchName: string;
  tabId: string;
  tabType: string;
  items: { name: string; quantity: number }[];
}

export interface ReviewsResponse {
  data: ReviewItem[];
  meta: {
    total: number;
    average: number;
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class ReviewsApiService extends BaseApiService {
  getReviews(query: {
    branchId?: string;
    rating?: string;
    minRating?: string;
    page?: string;
    limit?: string;
  } = {}): Observable<ReviewsResponse> {
    const params: Record<string, string> = {};
    if (query.branchId) params['branchId'] = query.branchId;
    if (query.rating) params['rating'] = query.rating;
    if (query.minRating) params['minRating'] = query.minRating;
    if (query.page) params['page'] = query.page;
    if (query.limit) params['limit'] = query.limit;
    return this.getPaginated<ReviewsResponse>(API_CONFIG.endpoints.reviews.list, {}, params);
  }
}