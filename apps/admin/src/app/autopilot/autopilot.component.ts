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
  templateUrl: './autopilot.component.html',
  styleUrls: ['./autopilot.component.scss']
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
