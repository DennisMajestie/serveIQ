import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NemotronService } from '../nemotron.service';

// ─── DESIGN SYSTEM CONTEXT ─────────────────────────────────────────────────
// Injected into every Screen Forge generation request so Nemotron produces
// exactly the Luminous Engine look without any interpretation loss.
const LUMINOUS_SYSTEM_PROMPT = `
You are a world-class Angular/SCSS UI engineer for the ServeIQ hospitality platform.
You MUST generate pixel-perfect Angular component code (TypeScript + inline template + SCSS styles)
that strictly follows the "Luminous Engine" design system below.

DESIGN SYSTEM — LUMINOUS ENGINE:
- Admin App: Arctic White foundation (#f8f9ff). NO borders anywhere.
  CSS vars: --surface:#f8f9ff, --surface-low:#eff4ff, --surface-container:#e5eeff,
  --on-surface:#0b1c30, --on-surface-muted:#64748b,
  --primary:#F97316, --primary-glow:rgba(249,115,22,0.2),
  --secondary:#0059bb, --radius-lg:24px
- Waiter App: Dark Pulse foundation (#020617). Glassmorphism.
  CSS vars: --ion-background-color:#020617, --ion-color-primary:#F97316,
  --surface-glass:rgba(255,255,255,0.05), --radius-xl:24px
- Typography: 'Space Grotesk' (700 weight) for ALL metrics, headings, table names.
  'Inter' for all body/label text.
- Layout: Bento-grid architecture. Use CSS Grid. No flexbox-only layouts.
- Cards: border-radius:24px; box-shadow:0 8px 32px rgba(11,28,48,0.04); NO border property.
- Glassmorphism: backdrop-filter:blur(32px); background:var(--surface-glass);
- Hover effects: translateY(-4px) + glow shadow using --primary-glow.
- Animations: cubic-bezier(0.4,0,0.2,1) for all transitions.

OUTPUT FORMAT:
Return ONLY the complete Angular component TypeScript file with:
1. All imports at top
2. @Component decorator with selector, standalone:true, imports array, template (inline), styles (inline SCSS array)
3. Full component class with realistic mock data

DO NOT return partial code. DO NOT add explanation text. Return ONLY the TypeScript file contents.
`.trim();

// ─── HOSPITALITY OPERATIONAL QUESTIONS ─────────────────────────────────────
const OPERATIONAL_QUESTIONS = [
  {
    category: 'Revenue Pulse',
    icon: 'payments',
    prompts: [
      'Analyze what KPIs I should track at end-of-shift to catch revenue leakage before it compounds.',
      'What are the top 3 early warning signs that a branch is underperforming this week?',
      'How should I structure a daily revenue standup for a 3-branch operation?',
    ]
  },
  {
    category: 'Table Operations',
    icon: 'table_restaurant',
    prompts: [
      'What is the optimal table-turn strategy for a 40-cover restaurant during Friday dinner rush?',
      'How do I reduce average tab open-to-close time without cutting service quality?',
      'Design a table reservation policy that maximizes covers without walk-in friction.',
    ]
  },
  {
    category: 'Staff & Shift',
    icon: 'people',
    prompts: [
      'What are the most important metrics to review in a waiter performance review?',
      'How should I allocate waiter sections for a 24-table restaurant with 4 staff on duty?',
      'Write a pre-shift briefing script for an evening service of 200+ covers.',
    ]
  },
  {
    category: 'Menu Intelligence',
    icon: 'restaurant_menu',
    prompts: [
      'Which menu engineering principles have the highest ROI for a mid-range Nigerian restaurant?',
      'How do I identify which menu items are "plowhorses" vs "stars" using my tab data?',
      'What pricing psychology should inform my menu redesign?',
    ]
  },
];

// ─── SCREEN FORGE SPECS ─────────────────────────────────────────────────────
const FORGE_SCREENS = [
  { id: 'admin-dashboard', label: 'Admin Dashboard', app: 'Admin', icon: 'dashboard', prompt: 'Generate the Admin Dashboard component. Show 4 KPI bento-cards (Total Revenue ₦1.24M, Active Tabs 12, Total Orders 340, Avg Order ₦3,647). Below: a 2/3 + 1/3 bento grid with a Revenue Overview chart card (left) and Recent Transactions card (right). Use sidebar navigation with links: Dashboard, Tables, Menu, Staff, ⚡ Autopilot, Settings.' },
  { id: 'admin-analytics', label: 'Sales Analytics', app: 'Admin', icon: 'analytics', prompt: 'Generate the Sales Analytics component. Show a full-width Line Chart bento-card for weekly revenue trend. Below: 3 bento-cards side by side: Top Items (ranked list), Hourly Heatmap (peak hours grid), Branch Comparison (horizontal bar chart). Use Arctic White tonal layering.' },
  { id: 'admin-staff', label: 'Staff Management', app: 'Admin', icon: 'people', prompt: 'Generate the Staff Management / Waiter Management component. Show a searchable data table of 6 waiters with columns: Name, Role, Section, Active Tabs, Total Sales Today, Status. Include a "Add Staff" button with Luminous Green glow. Status chips should be green/amber/red dots (no borders).' },
  { id: 'admin-tables', label: 'Table Management', app: 'Admin', icon: 'table_restaurant', prompt: 'Generate the Admin Table Management component. Show a bento-grid of 12 table cards (4x3). Each card: Table number in 3rem Space Grotesk, status tag (Available=green, Occupied=azure, Reserved=amber), occupancy %, current tab total. A floor plan toggle button in the header.' },
  { id: 'admin-menu', label: 'Menu Management', app: 'Admin', icon: 'restaurant_menu', prompt: 'Generate the Admin Menu Management component. Show a 3-column bento-grid of menu item cards. Each card: food image placeholder (200px height, surface-low bg with restaurant_menu icon), item name, category chip, price in Space Grotesk, stock status. Floating "+" Luminous Green button bottom-right.' },
  { id: 'admin-settings', label: 'Settings', app: 'Admin', icon: 'settings', prompt: 'Generate the Admin Settings component with tabs: Branch Identity, Operational Hours, Billing Config. Branch Identity tab shows glassmorphic form fields for Branch Name, Address, Phone. A "Save Changes" button with Luminous Green glow. Pure tonal layering, no form borders.' },
  { id: 'waiter-tables', label: 'Tables Home', app: 'Waiter', icon: 'grid_view', prompt: 'Generate the Waiter Tables home component using Ionic Angular (ion-header, ion-content). Dark Pulse aesthetic (#020617). 2-column grid of table cards using luminous-glass style (backdrop-filter:blur(32px)). Each card: Table name in 2rem Space Grotesk, status (Available=green glow, Occupied=azure glow, Reserved=amber). Tabbar footer: Tables, Active Tabs, History, Profile.' },
  { id: 'waiter-tab-detail', label: 'Tab Detail', app: 'Waiter', icon: 'receipt', prompt: 'Generate the Waiter Tab Detail component using Ionic Angular. Dark Pulse style. Header: Table name + Open since time. Order list: glassmorphic cards per order item (name, qty, price). Footer row: Subtotal, Tax, Total in Space Grotesk with Luminous Green total. "Add Item" and "Settle Bill" action buttons with glows.' },
  { id: 'waiter-menu', label: 'Menu Browser', app: 'Waiter', icon: 'restaurant_menu', prompt: 'Generate the Waiter Menu Browser using Ionic Angular. Dark Pulse style. Category chips row at top (Starters, Mains, Drinks, Desserts). Menu item cards in 2-column grid: image placeholder, item name, price in Space Grotesk with green accent, "Add to Tab" tinted button. Search bar with frosted glass look.' },
  { id: 'waiter-billing', label: 'Billing & Settle', app: 'Waiter', icon: 'credit_card', prompt: 'Generate the Waiter Billing component using Ionic Angular. Dark Pulse style. Large glassmorphic card showing: Table 5, itemized list, subtotal, 7.5% VAT, service charge, TOTAL in 2.5rem Space Grotesk with Luminous Green glow. Payment method selector (Cash/POS/Split). "Process Payment" primary button with intense green bloom.' },
  { id: 'waiter-login', label: 'Waiter Login', app: 'Waiter', icon: 'lock', prompt: 'Generate the Waiter Login component using Ionic Angular. Dark Pulse style. ServeIQ logo at top. PIN pad grid (3x4 numpad) with glassmorphic digit buttons. PIN dots row (4 circles that fill Luminous Green as PIN is entered). "Enter PIN" instruction in muted text. Background: Dark mesh gradient with soft violet and emerald glow blobs.' },
  { id: 'waiter-receipt', label: 'Payment Receipt', app: 'Waiter', icon: 'check_circle', prompt: 'Generate the Waiter Payment Success / Receipt component using Ionic Angular. Dark Pulse style. Top: large Luminous Green checkmark with intense outer glow. "TRANSACTION VERIFIED" label. Total amount ₦19,887.50 in 3rem Space Grotesk. Receipt detail card (glassmorphic): date, waiter, items count, VAT, payment method. "Start Next Table" primary button with bloom.' },
];

type AppMode = 'hub' | 'ops' | 'forge';

@Component({
  selector: 'app-autopilot',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="autopilot-root">
      <!-- ── HEADER ─────────────────────────────────── -->
      <header class="ap-header">
        <div class="header-brand">
          <div class="energy-orb" [class.active]="isThinking()"></div>
          <span class="space-font">NEMOTRON AUTOPILOT</span>
          <span class="badge" [class.live]="isThinking()">{{ isThinking() ? 'LIVE' : 'READY' }}</span>
        </div>
        <nav class="mode-nav">
          <button [class.active]="mode() === 'hub'" (click)="setMode('hub')">
            <mat-icon>hub</mat-icon> Hub
          </button>
          <button [class.active]="mode() === 'ops'" (click)="setMode('ops')">
            <mat-icon>psychology</mat-icon> Operational Q
          </button>
          <button [class.active]="mode() === 'forge'" (click)="setMode('forge')">
            <mat-icon>code</mat-icon> Screen Forge
          </button>
        </nav>
      </header>

      <!-- ── HUB MODE ─────────────────────────────── -->
      <div class="ap-body" *ngIf="mode() === 'hub'">
        <div class="hub-grid">
          <div class="luminous-card hub-card" (click)="setMode('ops')">
            <mat-icon>psychology</mat-icon>
            <h3 class="space-font">Operational Pulse</h3>
            <p>Ask Nemotron-3 Ultra expert hospitality management questions — revenue, tables, staff, menu strategy.</p>
          </div>
          <div class="luminous-card hub-card forge" (click)="setMode('forge')">
            <mat-icon>code</mat-icon>
            <h3 class="space-font">Screen Forge</h3>
            <p>Generate verbatim Angular/SCSS code for any ServeIQ screen with perfect Luminous Engine fidelity — bypassing the Stitch translation gap.</p>
          </div>
        </div>
        <p class="hub-sub">Powered by <strong>Nemotron-3 Ultra 550B</strong> with extended chain-of-thought reasoning</p>
      </div>

      <!-- ── OPS MODE ─────────────────────────────── -->
      <div class="ap-body ops-layout" *ngIf="mode() === 'ops'">
        <!-- Question Sidebar -->
        <div class="luminous-card question-sidebar">
          <div class="card-header">
            <h3 class="space-font">Question Bank</h3>
          </div>
          <div class="q-scroll">
            <div *ngFor="let cat of operationalQuestions">
              <div class="q-category">
                <mat-icon>{{ cat.icon }}</mat-icon>
                <span>{{ cat.category }}</span>
              </div>
              <button class="q-item" *ngFor="let q of cat.prompts" (click)="selectPrompt(q)">
                {{ q }}
              </button>
            </div>
          </div>
        </div>

        <!-- Response Panel -->
        <div class="luminous-card response-panel">
          <div class="card-header">
            <h3 class="space-font">Reasoning Stream</h3>
            <span class="status-badge" *ngIf="isThinking()">● Thought Stream Active</span>
          </div>
          <div class="stream-scroll">
            <div class="reasoning-bubble" *ngIf="reasoning()">
              <div class="label">INTERNAL CHAIN-OF-THOUGHT</div>
              <p>{{ reasoning() }}</p>
            </div>
            <div class="content-bubble" *ngIf="content()">
              <div class="label">MISSION RESPONSE</div>
              <p style="white-space: pre-wrap">{{ content() }}</p>
            </div>
            <div class="empty-state" *ngIf="!content() && !reasoning() && !isThinking()">
              <mat-icon>psychology</mat-icon>
              <span>Select a question or type your own mission below</span>
            </div>
          </div>
          <!-- Terminal -->
          <div class="command-bar luminous-glass">
            <mat-icon>terminal</mat-icon>
            <input [(ngModel)]="userPrompt" (keyup.enter)="runOps()"
              placeholder="OR TYPE YOUR OWN QUESTION..." [disabled]="isThinking()"/>
            <button mat-icon-button (click)="runOps()" [disabled]="isThinking() || !userPrompt.trim()">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- ── SCREEN FORGE MODE ─────────────────────── -->
      <div class="ap-body forge-layout" *ngIf="mode() === 'forge'">
        <!-- Screen Picker -->
        <div class="luminous-card screen-picker">
          <div class="card-header">
            <h3 class="space-font">Screen Library</h3>
          </div>
          <div class="screen-list">
            <div class="app-label">ADMIN APP</div>
            <button class="screen-btn" *ngFor="let s of forgeScreens"
              [class.selected]="selectedScreen()?.id === s.id"
              [class.admin]="s.app === 'Admin'"
              [class.waiter]="s.app === 'Waiter'"
              (click)="selectScreen(s)">
              <mat-icon>{{ s.icon }}</mat-icon>
              <span>{{ s.label }}</span>
              <div class="app-pill" [class.waiter-pill]="s.app === 'Waiter'">{{ s.app }}</div>
            </button>
          </div>
        </div>

        <!-- Code Output Panel -->
        <div class="luminous-card code-panel">
          <div class="card-header">
            <h3 class="space-font" *ngIf="selectedScreen()">{{ selectedScreen()!.label }}</h3>
            <h3 class="space-font" *ngIf="!selectedScreen()">Select a Screen</h3>
            <button class="forge-btn" *ngIf="selectedScreen()" (click)="runForge()" [disabled]="isThinking()">
              <mat-icon>{{ isThinking() ? 'sync' : 'auto_awesome' }}</mat-icon>
              {{ isThinking() ? 'Generating...' : 'Forge with Nemotron' }}
            </button>
          </div>

          <div class="forge-thinking" *ngIf="isThinking() && reasoning()">
            <div class="label">PLANNING LAYOUT</div>
            <p>{{ reasoning() }}</p>
          </div>

          <div class="code-output" *ngIf="content()">
            <div class="code-toolbar">
              <div class="label">GENERATED COMPONENT CODE</div>
              <button mat-icon-button (click)="copyCode()" title="Copy to clipboard">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
            <pre><code>{{ content() }}</code></pre>
          </div>

          <div class="empty-state" *ngIf="!content() && !isThinking()">
            <mat-icon>code_blocks</mat-icon>
            <span *ngIf="selectedScreen()">Press "Forge with Nemotron" to generate exact Angular/SCSS code</span>
            <span *ngIf="!selectedScreen()">Select a screen from the library to begin</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }

    .autopilot-root {
      height: 100vh;
      background: var(--surface);
      display: flex;
      flex-direction: column;
      font-family: 'Inter', sans-serif;
    }

    /* ── HEADER ── */
    .ap-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 40px;
      height: 72px;
      background: var(--surface-low);
      flex-shrink: 0;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.1em;
    }

    .energy-orb {
      width: 14px; height: 14px;
      border-radius: 50%;
      background: var(--on-surface-muted);
      transition: all 0.4s ease;
      &.active {
        background: var(--primary);
        box-shadow: 0 0 12px var(--primary);
        animation: orb-pulse 1.5s infinite;
      }
    }

    @keyframes orb-pulse {
      0%,100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }

    .badge {
      font-size: 0.7rem; padding: 3px 10px; border-radius: 20px;
      background: var(--surface-container); color: var(--on-surface-muted);
      &.live { background: var(--primary-glow); color: var(--primary); }
    }

    .mode-nav {
      display: flex; gap: 8px;
      button {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 18px; border-radius: 12px; border: none;
        background: transparent; color: var(--on-surface-muted);
        cursor: pointer; font-family: 'Inter', sans-serif;
        font-weight: 600; transition: all 0.2s;
        &:hover { background: var(--surface-container); }
        &.active { background: var(--surface-container); color: var(--primary); }
      }
    }

    /* ── BODY ── */
    .ap-body {
      flex: 1; overflow: hidden; padding: 32px 40px;
    }

    /* ── HUB ── */
    .hub-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      max-width: 900px;
      margin: 80px auto 0;
    }

    .hub-card {
      cursor: pointer; transition: all 0.3s;
      padding: 48px; text-align: center;
      mat-icon { font-size: 56px; width: 56px; height: 56px; color: var(--on-surface-muted); margin-bottom: 16px; }
      h3 { font-size: 1.5rem; margin: 0 0 12px; }
      p { color: var(--on-surface-muted); line-height: 1.6; margin: 0; }
      &:hover { transform: translateY(-6px); box-shadow: 0 16px 40px var(--primary-glow); }
      &.forge {
        mat-icon { color: var(--secondary); }
        &:hover { box-shadow: 0 16px 40px var(--secondary-glow); }
      }
    }

    .hub-sub {
      text-align: center; margin-top: 48px;
      color: var(--on-surface-muted); font-size: 0.9rem;
    }

    /* ── OPS LAYOUT ── */
    .ops-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 32px;
    }

    .question-sidebar {
      display: flex; flex-direction: column; overflow: hidden; padding: 0;
      .card-header { padding: 24px 24px 0; }
    }

    .q-scroll { flex: 1; overflow-y: auto; padding: 16px 0 24px; }

    .q-category {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 24px; font-size: 0.7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--on-surface-muted);
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .q-item {
      width: 100%; text-align: left; padding: 12px 24px;
      background: transparent; border: none; cursor: pointer;
      font-family: 'Inter', sans-serif; font-size: 0.85rem;
      color: var(--on-surface); line-height: 1.4;
      transition: background 0.15s;
      &:hover { background: var(--surface-low); color: var(--primary); }
    }

    .response-panel {
      display: flex; flex-direction: column; overflow: hidden;
      .card-header { flex-shrink: 0; }
    }

    .stream-scroll {
      flex: 1; overflow-y: auto; padding: 0 32px 32px;
    }

    /* ── FORGE LAYOUT ── */
    .forge-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 32px;
    }

    .screen-picker { overflow: hidden; display: flex; flex-direction: column; padding: 0; }
    .screen-list { flex: 1; overflow-y: auto; padding: 8px 0 16px; }

    .app-label {
      font-size: 0.65rem; font-weight: 700; letter-spacing: 0.12em;
      color: var(--on-surface-muted); padding: 16px 20px 4px;
    }

    .screen-btn {
      width: 100%; text-align: left; padding: 12px 20px;
      background: transparent; border: none; cursor: pointer;
      font-family: 'Inter', sans-serif; font-size: 0.875rem;
      color: var(--on-surface); display: flex; align-items: center; gap: 12px;
      transition: background 0.15s;
      mat-icon { font-size: 18px; color: var(--on-surface-muted); }
      .app-pill {
        margin-left: auto; font-size: 0.6rem; padding: 2px 8px;
        border-radius: 20px; background: var(--surface-container);
        color: var(--secondary); font-weight: 700;
        &.waiter-pill { color: var(--primary); }
      }
      &:hover { background: var(--surface-low); }
      &.selected { background: var(--surface-container); color: var(--primary); mat-icon { color: var(--primary); } }
    }

    .code-panel {
      display: flex; flex-direction: column; overflow: hidden;
      .card-header { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    }

    .forge-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 12px; border: none;
      background: var(--primary); color: #000; font-weight: 700;
      cursor: pointer; font-family: 'Inter', sans-serif;
      transition: all 0.2s;
      mat-icon { font-size: 18px; }
      &:hover { box-shadow: 0 0 20px var(--primary-glow); }
      &:disabled { opacity: 0.5; cursor: not-allowed; mat-icon { animation: spin 1.5s linear infinite; } }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .forge-thinking {
      margin: 0 32px; padding: 16px; border-radius: 12px;
      background: var(--surface-low); margin-bottom: 16px; flex-shrink: 0;
      p { font-size: 0.85rem; color: var(--on-surface-muted); margin: 8px 0 0; }
    }

    .code-output {
      flex: 1; overflow: hidden; display: flex; flex-direction: column;
      margin: 0 32px 32px;
    }

    .code-toolbar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 8px;
    }

    pre {
      flex: 1; overflow-y: auto; margin: 0;
      background: var(--surface-low); padding: 24px; border-radius: 16px;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 0.8rem; line-height: 1.6;
      color: var(--on-surface); white-space: pre-wrap; word-break: break-all;
    }

    /* ── SHARED ── */
    .card-header {
      padding: 24px 32px 16px;
      h3 { margin: 0; font-size: 1.1rem; }
    }

    .label {
      font-size: 0.65rem; font-weight: 700; letter-spacing: 0.15em;
      color: var(--on-surface-muted); margin-bottom: 8px;
    }

    .status-badge {
      font-size: 0.7rem; color: var(--primary); font-weight: 600;
      animation: blink 1.5s steps(2) infinite;
    }

    @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

    .reasoning-bubble {
      background: var(--surface-low); padding: 20px; border-radius: 16px;
      margin-bottom: 24px; font-style: italic;
      color: var(--on-surface-muted); font-size: 0.85rem;
      max-height: 150px; overflow-y: auto;
    }

    .content-bubble { font-size: 1rem; line-height: 1.7; }

    .command-bar {
      display: flex; align-items: center; gap: 16px;
      padding: 12px 24px; margin: 16px 24px 24px; border-radius: 16px;
      background: var(--surface-low);
      input {
        flex: 1; background: transparent; border: none;
        color: var(--on-surface); font-family: 'Inter', sans-serif;
        font-size: 0.95rem; outline: none;
        &::placeholder { color: var(--on-surface-muted); }
        &:disabled { opacity: 0.5; }
      }
      mat-icon { color: var(--on-surface-muted); }
    }

    .empty-state {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: var(--on-surface-muted); gap: 16px; text-align: center;
      mat-icon { font-size: 64px; width: 64px; height: 64px; opacity: 0.15; }
    }
  `]
})
export class AutopilotComponent {
  private nemotron = inject(NemotronService);

  mode = signal<AppMode>('hub');
  userPrompt = '';
  isThinking = signal(false);
  reasoning = signal('');
  content = signal('');
  selectedScreen = signal<typeof FORGE_SCREENS[0] | null>(null);

  operationalQuestions = OPERATIONAL_QUESTIONS;
  forgeScreens = FORGE_SCREENS;

  setMode(m: AppMode) {
    if (!this.isThinking()) this.mode.set(m);
  }

  selectPrompt(q: string) {
    this.userPrompt = q;
    this.runOps();
  }

  selectScreen(s: typeof FORGE_SCREENS[0]) {
    this.selectedScreen.set(s);
    this.content.set('');
    this.reasoning.set('');
  }

  async runOps() {
    if (!this.userPrompt.trim() || this.isThinking()) return;
    const prompt = this.userPrompt;
    this.userPrompt = '';
    this.content.set('');
    this.reasoning.set('');
    this.isThinking.set(true);
    try {
      await this.nemotron.askNemotron(
        prompt,
        (text, logic) => {
          if (logic) this.reasoning.update(p => p + logic);
          if (text) this.content.update(p => p + text);
        },
        'You are the world\'s leading hospitality management consultant and restaurant operations expert. Provide clear, structured, actionable advice tailored to Nigerian restaurant operations. Use data-driven insights and practical examples.'
      );
    } finally {
      this.isThinking.set(false);
    }
  }

  async runForge() {
    const screen = this.selectedScreen();
    if (!screen || this.isThinking()) return;
    this.content.set('');
    this.reasoning.set('');
    this.isThinking.set(true);
    try {
      await this.nemotron.askNemotron(
        screen.prompt,
        (text, logic) => {
          if (logic) this.reasoning.update(p => p + logic);
          if (text) this.content.update(p => p + text);
        },
        LUMINOUS_SYSTEM_PROMPT
      );
    } finally {
      this.isThinking.set(false);
    }
  }

  copyCode() {
    navigator.clipboard.writeText(this.content()).catch(() => {});
  }
}
