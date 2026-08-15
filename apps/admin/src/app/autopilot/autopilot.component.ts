import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiApiService, GenerateLogicResponse, AnalyzeApiResponse } from '@serveiq/shared/data-access';
import Swal from 'sweetalert2';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-autopilot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="autopilot-page">
      <!-- Hero Stats -->
      <div class="hero-stats">
        <div class="stat-card">
          <div class="stat-icon stats-psi">
            <span class="material-symbols-outlined">psychology</span>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ stats().analyses }}</span>
            <span class="stat-label">AI Analyses</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stats-cpu">
            <span class="material-symbols-outlined">memory</span>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ stats().chats }}</span>
            <span class="stat-label">Chat Sessions</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stats-check">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ stats().successRate }}%</span>
            <span class="stat-label">Success Rate</span>
          </div>
        </div>
      </div>

      <!-- Bento Grid -->
      <div class="bento-grid">
        <!-- Generate Logic / Chat -->
        <section class="bento-card reasoning-stream">
          <div class="bento-header">
            <span class="material-symbols-outlined">psychology</span>
            <h2>AI Reasoning</h2>
            <span class="status-badge live" *ngIf="!aiLoading()">LIVE</span>
            <span class="status-badge busy" *ngIf="aiLoading()">THINKING</span>
          </div>
          <div class="chat-stream" #chatStream>
            <div class="message" *ngFor="let msg of messages()" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
              <div class="msg-avatar">
                <span class="material-symbols-outlined">{{ msg.role === 'user' ? 'person' : 'smart_toy' }}</span>
              </div>
              <div class="msg-content">
                <p>{{ msg.content }}</p>
                <span class="msg-time">{{ msg.timestamp | date:'HH:mm:ss' }}</span>
              </div>
            </div>
            <div class="empty-chat" *ngIf="messages().length === 0">
              <span class="material-symbols-outlined">bolt</span>
              <p>Ask the AI to generate business logic, analyze operations, or suggest improvements.</p>
            </div>
          </div>
          <div class="chat-input">
            <input type="text" [(ngModel)]="prompt" (keyup.enter)="sendPrompt()" placeholder="Ask the AI to generate logic or analyze..." [disabled]="aiLoading()">
            <button (click)="sendPrompt()" [disabled]="aiLoading() || !prompt().trim()">
              <span class="material-symbols-outlined">send</span>
            </button>
          </div>
        </section>

        <!-- Status Core -->
        <section class="bento-card status-core">
          <div class="core-visual">
            <div class="core-ring" [class.active]="!aiLoading()">
              <div class="core-dot"></div>
            </div>
          </div>
          <div class="core-info">
            <h3>Nemotron v1.0</h3>
            <p class="core-status" [class.online]="!aiLoading()" [class.thinking]="aiLoading()">
              {{ aiLoading() ? 'Processing...' : 'Online & Ready' }}
            </p>
          </div>
          <div class="core-metrics">
            <div class="metric">
              <span class="metric-value">{{ responseTime() }}ms</span>
              <span class="metric-label">Avg Response</span>
            </div>
            <div class="metric">
              <span class="metric-value">{{ messages().length }}</span>
              <span class="metric-label">Messages</span>
            </div>
          </div>
        </section>

        <!-- Plan Manifest / API Analysis -->
        <section class="bento-card plan-manifest">
          <div class="bento-header">
            <span class="material-symbols-outlined">assignment_turned_in</span>
            <h2>API Analysis</h2>
            <button class="btn-icon" (click)="analyzeApi()" [disabled]="aiLoading()" title="Run API Analysis">
              <span class="material-symbols-outlined">{{ aiLoading() ? 'hourglass_top' : 'refresh' }}</span>
            </button>
          </div>
          <div class="analysis-content">
            <div class="analysis-placeholder" *ngIf="!analysisResult() && !aiLoading()">
              <span class="material-symbols-outlined">analytics</span>
              <p>Click refresh to analyze the ServeIQ API architecture.</p>
            </div>
            <div class="analysis-placeholder" *ngIf="aiLoading() && !analysisResult()">
              <span class="material-symbols-outlined">hourglass_top</span>
              <p>Analyzing API structure...</p>
            </div>
            <div class="analysis-result" *ngIf="analysisResult()">
              <div class="result-text">{{ analysisResult() }}</div>
              <button class="btn-outline" (click)="analysisResult.set(null)">
                <span class="material-symbols-outlined">close</span>
                Clear
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .autopilot-page { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
    .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }

    /* Hero Stats */
    .hero-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .stat-card { background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .stat-icon .material-symbols-outlined { font-size: 24px; }
    .stats-psi { background: color-mix(in srgb, var(--primary) 15%, transparent); color: var(--primary); }
    .stats-cpu { background: color-mix(in srgb, var(--tertiary) 15%, transparent); color: var(--tertiary); }
    .stats-check { background: color-mix(in srgb, #22c55e 15%, transparent); color: #22c55e; }
    .stat-body { display: flex; flex-direction: column; gap: 2px; }
    .stat-value { font-size: clamp(20px, 1vw + 16px, 24px); font-weight: 700; color: var(--on-surface); line-height: 1; word-break: break-word; }
    .stat-label { font-size: 13px; color: var(--secondary); font-weight: 500; }

    /* Bento Grid */
    .bento-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
    .bento-card { background: var(--surface); border: 1px solid var(--outline-variant); border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; }
    .bento-header { display: flex; align-items: center; gap: 10px; padding: 20px 24px; border-bottom: 1px solid var(--outline-variant); }
    .bento-header .material-symbols-outlined { font-size: 20px; color: var(--primary); }
    .bento-header h2 { margin: 0; font-size: 16px; font-weight: 700; color: var(--on-surface); flex: 1; }
    .bento-header .btn-icon { background: transparent; border: none; color: var(--secondary); cursor: pointer; padding: 6px; border-radius: 8px; transition: all 0.2s; }
    .bento-header .btn-icon:hover { background: var(--surface-container-low); color: var(--primary); }
    .bento-header .btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }

    .status-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 999px; }
    .status-badge.live { background: color-mix(in srgb, #22c55e 15%, transparent); color: #22c55e; }
    .status-badge.busy { background: color-mix(in srgb, var(--primary) 15%, transparent); color: var(--primary); }

    /* Reasoning Stream */
    .reasoning-stream { grid-column: 1 / -1; }
    .chat-stream { flex: 1; padding: 16px 24px; overflow-y: auto; max-height: 360px; display: flex; flex-direction: column; gap: 12px; }
    .message { display: flex; gap: 12px; align-items: flex-start; }
    .message.user { flex-direction: row-reverse; }
    .msg-avatar { width: 32px; height: 32px; border-radius: 50%; background: color-mix(in srgb, var(--primary) 12%, transparent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .message.user .msg-avatar { background: color-mix(in srgb, var(--tertiary) 12%, transparent); }
    .msg-avatar .material-symbols-outlined { font-size: 16px; color: var(--primary); }
    .message.user .msg-avatar .material-symbols-outlined { color: var(--tertiary); }
    .msg-content { max-width: 70%; background: var(--surface-container-low); border-radius: 12px; padding: 12px 16px; }
    .message.user .msg-content { background: color-mix(in srgb, var(--primary) 8%, var(--surface)); }
    .msg-content p { margin: 0; font-size: 14px; line-height: 1.5; color: var(--on-surface); white-space: pre-wrap; }
    .msg-time { font-size: 11px; color: var(--on-surface-variant); margin-top: 4px; display: block; }

    .empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--on-surface-variant); padding: 40px; text-align: center; }
    .empty-chat .material-symbols-outlined { font-size: 40px; opacity: 0.3; }
    .empty-chat p { margin: 0; font-size: 14px; max-width: 300px; }

    .chat-input { display: flex; gap: 8px; padding: 16px 24px; border-top: 1px solid var(--outline-variant); }
    .chat-input input { flex: 1; padding: 12px 16px; border: 1px solid var(--outline-variant); border-radius: 10px; background: var(--surface-container-low); color: var(--on-surface); font-size: 14px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
    .chat-input input:focus { border-color: var(--primary); }
    .chat-input input:disabled { opacity: 0.5; }
    .chat-input button { width: 44px; height: 44px; border-radius: 10px; border: none; background: var(--primary); color: var(--on-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .chat-input button:hover { opacity: 0.9; transform: scale(1.05); }
    .chat-input button:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
    .chat-input button .material-symbols-outlined { font-size: 20px; }

    /* Status Core */
    .status-core { align-items: center; text-align: center; padding: 32px 24px; gap: 20px; }
    .core-visual { position: relative; width: 140px; height: 140px; }
    .core-ring { width: 140px; height: 140px; border-radius: 50%; border: 3px solid var(--outline-variant); display: flex; align-items: center; justify-content: center; transition: all 0.5s ease; }
    .core-ring.active { border-color: #22c55e; box-shadow: 0 0 30px rgba(34, 197, 94, 0.2); }
    .core-ring.active .core-dot { background: #22c55e; box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); }
    .core-dot { width: 24px; height: 24px; border-radius: 50%; background: var(--on-surface-variant); transition: all 0.5s ease; }
    .core-info h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--on-surface); }
    .core-status { margin: 4px 0 0; font-size: 14px; font-weight: 600; }
    .core-status.online { color: #22c55e; }
    .core-status.thinking { color: var(--primary); }
    .core-metrics { display: flex; gap: 32px; }
    .metric { text-align: center; }
    .metric-value { display: block; font-size: 20px; font-weight: 700; color: var(--on-surface); }
    .metric-label { font-size: 12px; color: var(--secondary); font-weight: 500; }

    /* Plan Manifest */
    .plan-manifest { grid-column: 1 / -1; }
    .analysis-content { flex: 1; padding: 24px; overflow-y: auto; max-height: 360px; }
    .analysis-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--on-surface-variant); padding: 40px; text-align: center; }
    .analysis-placeholder .material-symbols-outlined { font-size: 40px; opacity: 0.3; }
    .analysis-placeholder p { margin: 0; font-size: 14px; }
    .analysis-result { display: flex; flex-direction: column; gap: 16px; }
    .result-text { font-size: 14px; line-height: 1.6; color: var(--on-surface); white-space: pre-wrap; }
    .btn-outline { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid var(--outline-variant); border-radius: 8px; background: transparent; color: var(--secondary); font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s; align-self: flex-start; }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
  `]
})
export class AutopilotComponent {
  private aiApi = inject(AiApiService);

  prompt = signal('');
  messages = signal<ChatMessage[]>([]);
  aiLoading = signal(false);
  analysisResult = signal<string | null>(null);
  responseTime = signal(0);

  stats = computed(() => ({
    analyses: this.analysisResult() ? 1 : 0,
    chats: this.messages().length,
    successRate: 100,
  }));

  sendPrompt() {
    const text = this.prompt().trim();
    if (!text || this.aiLoading()) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date() };
    this.messages.update(m => [...m, userMsg]);
    this.prompt.set('');
    this.aiLoading.set(true);

    const start = performance.now();
    this.aiApi.generateLogic(text).subscribe({
      next: (res) => {
        const elapsed = Math.round(performance.now() - start);
        this.responseTime.set(elapsed);
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: res.data || 'No response generated.',
          timestamp: new Date(),
        };
        this.messages.update(m => [...m, assistantMsg]);
        this.aiLoading.set(false);
      },
      error: () => {
        const elapsed = Math.round(performance.now() - start);
        this.responseTime.set(elapsed);
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: 'Error: Could not reach the AI service.',
          timestamp: new Date(),
        }]);
        this.aiLoading.set(false);
      }
    });
  }

  analyzeApi() {
    if (this.aiLoading()) return;
    this.aiLoading.set(true);
    this.analysisResult.set(null);

    const start = performance.now();
    this.aiApi.analyzeApi().subscribe({
      next: (res) => {
        const elapsed = Math.round(performance.now() - start);
        this.responseTime.set(elapsed);
        this.analysisResult.set(res.data || 'No analysis data returned.');
        this.aiLoading.set(false);
      },
      error: () => {
        const elapsed = Math.round(performance.now() - start);
        this.responseTime.set(elapsed);
        this.analysisResult.set('Error: Could not analyze the API.');
        this.aiLoading.set(false);
      }
    });
  }
}
