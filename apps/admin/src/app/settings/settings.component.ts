import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchesApiService } from '@serveiq/shared/data-access';
import { Branch } from '@serveiq/shared/models';



@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <div class="settings-layout">
        
        <!-- Sidebar Navigation -->
        <aside class="settings-sidebar">
          <nav class="settings-nav">
            <button class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
              <span>General</span>
            </button>
            <button class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              <span>Business Profile</span>
            </button>
            <button class="nav-item active">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              <span>Branch Setup</span>
            </button>
            <button class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span>Tax & VAT</span>
            </button>
            <button class="nav-item">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <path d="M2 12h20"/>
              </svg>
              <span>Branding</span>
            </button>
          </nav>

          <div class="support-card">
            <h3 class="support-title inter-font">Need assistance?</h3>
            <p class="support-text inter-font">
              Our support team is available 24/7 to help you configure your multi-branch ecosystem.
            </p>
            <button class="btn-support inter-font">Chat Support</button>
            <!-- Support face illustration overlay -->
            <div class="support-face-overlay"></div>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="settings-content">
          <header class="content-header">
            <div class="title-group">
              <h1 class="page-title space-font">Branch Setup</h1>
              <p class="page-subtitle inter-font">Manage your restaurant locations, addresses, and operational status.</p>
            </div>
          </header>

          <!-- Main Table Card -->
          <div class="settings-card branch-table-card">
            <div class="table-wrapper">
              <table class="branch-table inter-font">
                <thead>
                  <tr>
                    <th scope="col">Branch Name</th>
                    <th scope="col">Manager</th>
                    <th scope="col">Hours / Sync</th>
                    <th scope="col">Capacity</th>
                    <th scope="col">Performance</th>
                    <th scope="col" class="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let branch of branches()">
                    <td class="cell-branch-name">
                      <div class="branch-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                      </div>
                      <div class="branch-info">
                        <span class="branch-title">{{ branch.name }}</span>
                        <span class="branch-id">ID: {{ branch.id }}</span>
                      </div>
                    </td>
                    <td class="cell-manager">
                      <div class="manager-layout">
                        <span class="manager-name">{{ branch.address }}</span>
                      </div>
                    </td>
                    <td class="cell-hours">
                      <span class="hours-text">{{ branch.phoneNumber }}</span>
                      <span class="sync-text">{{ branch.location || 'Nigeria' }}</span>
                    </td>
                    <td class="cell-capacity">
                      <div class="capacity-bar-layout">
                        <div class="capacity-track">
                          <div class="capacity-fill" style="width: 80%"></div>
                        </div>
                        <span class="capacity-text">Active</span>
                      </div>
                    </td>
                    <td class="cell-performance">
                      <div class="mini-chart">
                        <div class="chart-bar h-1"></div>
                        <div class="chart-bar h-3"></div>
                        <div class="chart-bar h-2"></div>
                        <div class="chart-bar h-5"></div>
                      </div>
                    </td>
                    <td class="text-right">
                       <span class="status-indicator" style="background: #ea580c"></span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <footer class="table-footer inter-font">
              <div class="staff-summary">
                <div class="staff-avatars">
                  <img src="https://ui-avatars.com/api/?name=E+R&background=0b1c30&color=fff" class="avatar-sm" />
                  <img src="https://ui-avatars.com/api/?name=M+C&background=0b1c30&color=fff" class="avatar-sm" />
                  <span class="avatar-more">+12</span>
                </div>
                <span class="staff-text">15 Total Staff across branches</span>
              </div>
            </footer>
          </div>

          <!-- Global Configurations Section -->
          <div class="settings-card configurations-card">
            <h3 class="config-header inter-font">
              <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" class="config-icon">
                <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
              </svg>
              Global Branch Configurations
            </h3>
            
            <div class="config-form-grid">
              <div class="form-group">
                <label class="config-label">DEFAULT TAX RATE</label>
                <div class="input-wrapper">
                  <input type="text" value="7.5%" class="config-input">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                </div>
              </div>
              <div class="form-group">
                <label class="config-label">BASE CURRENCY</label>
                <div class="input-wrapper">
                  <select class="config-select">
                    <option>NGN (₦)</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="config-label">TIMEZONE</label>
                <div class="input-wrapper">
                  <select class="config-select">
                    <option>GMT+1 (West Africa)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Cards -->
          <div class="action-cards-row">
            <div class="action-card card-outline-orange">
              <div class="action-card-content">
                <h4 class="action-card-title">Default Settings</h4>
                <p class="action-card-desc">Inherited by new branches</p>
                <a href="#" class="action-link-orange">Configure defaults →</a>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-card-icon text-orange">
                <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9"/>
              </svg>
            </div>

             <div class="action-card card-outline-blue">
              <div class="action-card-content">
                <h4 class="action-card-title">Regional Insights</h4>
                <p class="action-card-desc">View performance by location</p>
                <a href="#" class="action-link-blue">Open Analytics →</a>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-card-icon text-blue">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 40px 48px; max-width: 1600px; margin: 0 auto;
      min-height: 100vh; background: #fdfdfd; font-family: 'Inter', sans-serif;
    }

    .space-font { font-family: 'Space Grotesk', sans-serif; }
    .inter-font { font-family: 'Inter', sans-serif; }

    .settings-layout { display: grid; grid-template-columns: 280px 1fr; gap: 40px; }

    /* ===== SIDEBAR NAV ===== */
    .settings-nav { display: flex; flex-direction: column; gap: 8px; }
    .nav-item {
      display: flex; align-items: center; gap: 16px; padding: 14px 20px;
      background: transparent; border: none; border-radius: 12px;
      font-weight: 600; font-size: 0.9375rem; color: #475569;
      cursor: pointer; transition: all 0.2s; text-align: left;
      
      &:hover:not(.active) { background: #f8fafc; color: #1e293b; }
      &.active { background: #fee7d6; color: #92400e; }
    }
    .nav-icon { width: 20px; height: 20px; }

    /* Support Card */
    .support-card {
      background: #e0e7ff; border-radius: 20px; padding: 24px; position: relative; overflow: hidden;
      margin-top: 24px;
    }
    .support-title { margin: 0 0 8px; font-weight: 700; font-size: 1rem; color: #1e293b; }
    .support-text { margin: 0 0 20px; font-size: 0.8125rem; color: #475569; line-height: 1.5; }
    .btn-support {
      background: white; border: none; padding: 10px 16px; border-radius: 10px;
      font-weight: 700; font-size: 0.8125rem; color: #1e293b; cursor: pointer;
    }

    /* ===== MAIN CONTENT ===== */
    .settings-content { display: flex; flex-direction: column; gap: 32px; }
    .title-group { display: flex; flex-direction: column; gap: 8px; }
    .page-title { margin: 0; font-weight: 700; font-size: 2rem; color: #0b1c30; letter-spacing: -0.02em; }
    .page-subtitle { margin: 0; font-size: 1rem; color: #64748b; }

    /* ===== TABLE CARD ===== */
    .settings-card {
      background: white; border-radius: 20px; border: 1px solid #f1f5f9;
      box-shadow: 0 4px 24px rgba(11, 28, 48, 0.04); overflow: hidden;
    }
    
    .table-wrapper { padding: 0; }
    .branch-table { width: 100%; border-collapse: collapse; }
    .branch-table th {
      text-align: left; padding: 24px 32px; font-weight: 700; font-size: 0.75rem;
      color: #475569; background: #f8fafc; border-bottom: 2px solid #f1f5f9;
    }
    .branch-table td { padding: 24px 32px; border-bottom: 1.5px solid #f8fafc; vertical-align: top; }
    
    .cell-branch-name { display: flex; align-items: flex-start; gap: 16px; }
    .branch-icon {
      width: 44px; height: 44px; border-radius: 12px; background: #eff6ff; color: #0ea5e9;
      display: flex; align-items: center; justify-content: center;
      svg { width: 22px; height: 22px; }
    }
    .branch-info { display: flex; flex-direction: column; gap: 4px; padding-top: 2px; }
    .branch-title { font-weight: 700; font-size: 1rem; color: #0b1c30; }
    .branch-id { font-size: 0.75rem; font-weight: 600; color: #94a3b8; }

    .manager-layout { display: flex; align-items: center; gap: 10px; }
    .manager-avatar { width: 28px; height: 28px; border-radius: 50%; }
    .manager-name { font-size: 0.875rem; font-weight: 600; color: #0b1c30; }

    .cell-hours { display: flex; flex-direction: column; gap: 4px; }
    .hours-text { font-size: 0.8125rem; font-weight: 700; color: #0b1c30; }
    .sync-text { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }

    .capacity-bar-layout { display: flex; align-items: center; gap: 12px; }
    .capacity-track { width: 50px; height: 4px; background: #f1f5f9; border-radius: 2px; }
    .capacity-fill { height: 100%; background: #92400e; border-radius: 2px; }
    .capacity-text { font-size: 0.8125rem; font-weight: 600; color: #475569; }

    .mini-chart { display: flex; align-items: flex-end; gap: 4px; height: 20px; }
    .chart-bar { width: 4px; background: #d97706; border-radius: 1px; }
    .h-1 { height: 40%; opacity: 0.4; } .h-3 { height: 60%; opacity: 0.6; }
    .h-2 { height: 50%; opacity: 0.8; } .h-5 { height: 100%; }

    .status-indicator { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
    .text-right { text-align: right; }

    /* ===== FOOTER ===== */
    .table-footer { padding: 20px 32px; background: #fffcfb; display: flex; align-items: center; }
    .staff-summary { display: flex; align-items: center; gap: 16px; }
    .staff-avatars { display: flex; align-items: center; }
    .avatar-sm { width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; margin-left: -8px; &:first-child { margin-left: 0; } }
    .avatar-more {
      width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; margin-left: -8px;
      background: #e2e8f0; color: #475569; display: flex; align-items: center; justify-content: center;
      font-size: 0.65rem; font-weight: 700;
    }
    .staff-text { font-size: 0.8125rem; font-weight: 600; color: #64748b; }

    /* ===== GLOBAL CONFIGS ===== */
    .configurations-card { padding: 32px; }
    .config-header { display: flex; align-items: center; gap: 12px; margin: 0 0 24px; font-size: 1.125rem; color: #0b1c30; }
    .config-icon { width: 22px; height: 22px; }

    .config-form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .config-label { font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; }
    
    .input-wrapper { position: relative; }
    .config-input { width: 100%; padding: 14px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-weight: 600; font-family: 'Inter', sans-serif; color: #0f172a; outline: none; }
    .config-select { width: 100%; padding: 14px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-weight: 600; font-family: 'Inter', sans-serif; color: #0f172a; outline: none; appearance: none; background: transparent; }
    .input-icon { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8; pointer-events: none; }

    /* ===== ACTION CARDS ===== */
    .action-cards-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .action-card {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 24px; background: white; border-radius: 16px; border-left: 4px solid;
      box-shadow: 0 4px 16px rgba(11,28,48,0.03);
    }
    .card-outline-orange { border-left-color: #d97706; }
    .card-outline-blue { border-left-color: #0ea5e9; }

    .action-card-content { display: flex; flex-direction: column; gap: 6px; }
    .action-card-title { margin: 0; font-size: 1.05rem; font-weight: 700; color: #0f172a; }
    .action-card-desc { margin: 0 0 8px; font-size: 0.8125rem; color: #64748b; }
    
    .action-link-orange { font-size: 0.8125rem; font-weight: 700; color: #d97706; text-decoration: none; }
    .action-link-blue { font-size: 0.8125rem; font-weight: 700; color: #0ea5e9; text-decoration: none; }
    
    .action-card-icon { width: 24px; height: 24px; opacity: 0.8; }
    .text-orange { color: #d97706; }
    .text-blue { color: #0ea5e9; }
  `]
})
export class SettingsComponent implements OnInit {
  private branchesApi = inject(BranchesApiService);
  branches = signal<Branch[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.branchesApi.list().subscribe({
      next: (b) => { this.branches.set(b); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }
}
