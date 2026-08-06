import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService, FeedbackPayload } from './feedback.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fb-overlay" *ngIf="open" (click)="close()">
      <div class="fb-panel" (click)="$event.stopPropagation()">
        <div class="fb-header">
          <h3>Send Feedback</h3>
          <button class="fb-close" (click)="close()">&times;</button>
        </div>
        <div class="fb-body">
          <label>Category</label>
          <select [(ngModel)]="form.category" name="category">
            <option value="bug">Bug</option>
            <option value="feature">Feature Request</option>
            <option value="ux">UX Improvement</option>
            <option value="performance">Performance</option>
            <option value="other">Other</option>
          </select>
          <label>Message</label>
          <textarea [(ngModel)]="form.message" name="message" rows="4" placeholder="Describe the issue or suggestion..."></textarea>
          <div class="fb-actions">
            <button class="fb-cancel" (click)="close()">Cancel</button>
            <button class="fb-submit" (click)="send()" [disabled]="sending || !form.message.trim()">
              {{ sending ? 'Sending...' : 'Send' }}
            </button>
          </div>
          <div class="fb-msg" [class.fb-msg--ok]="sent" [class.fb-msg--err]="sendError">
            {{ sent ? 'Thank you! Your feedback has been sent.' : sendError || '' }}
          </div>
        </div>
      </div>
    </div>
    <button class="fb-fab" (click)="open = true" title="Send Feedback">
      &#9998;
    </button>
  `,
  styles: [`
    .fb-fab {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: #4f46e5; color: #fff; border: none;
      font-size: 22px; cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,0.4);
      display: flex; align-items: center; justify-content: center;
    }
    .fb-fab:hover { background: #4338ca; }
    .fb-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;
    }
    .fb-panel {
      background: #fff; border-radius: 12px; width: 420px; max-width: 90vw;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;
    }
    .fb-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-bottom: 1px solid #e5e7eb;
    }
    .fb-header h3 { margin: 0; font-size: 16px; }
    .fb-close { background: none; border: none; font-size: 22px; cursor: pointer; color: #6b7280; }
    .fb-body { padding: 20px; }
    .fb-body label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #374151; }
    .fb-body select, .fb-body textarea {
      width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 14px; margin-bottom: 16px; font-family: inherit;
    }
    .fb-body textarea { resize: vertical; }
    .fb-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .fb-cancel { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; cursor: pointer; }
    .fb-submit { padding: 8px 16px; border: none; border-radius: 8px; background: #4f46e5; color: #fff; cursor: pointer; }
    .fb-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .fb-msg { margin-top: 12px; font-size: 13px; }
    .fb-msg--ok { color: #059669; }
    .fb-msg--err { color: #dc2626; }
  `],
})
export class FeedbackComponent implements OnInit {
  feedback = inject(FeedbackService);
  open = false;
  sending = false;
  sent = false;
  sendError = '';
  form: FeedbackPayload = { category: 'bug', message: '' };

  ngOnInit() {}

  close() {
    this.open = false;
    this.sent = false;
    this.sendError = '';
    this.form.message = '';
  }

  async send() {
    if (!this.form.message.trim()) return;
    this.sending = true;
    this.sendError = '';
    this.form.url = window.location.href;
    this.form.userAgent = navigator.userAgent;
    try {
      await this.feedback.submit(this.form).toPromise();
      this.sent = true;
      this.form.message = '';
      setTimeout(() => this.close(), 2500);
    } catch (e) {
      this.sendError = 'Failed to send. Please try again.';
    } finally {
      this.sending = false;
    }
  }
}