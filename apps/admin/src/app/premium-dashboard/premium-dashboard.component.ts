import { Component, OnInit, inject, signal, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BranchesApiService, ReportsApiService, TabsApiService, ShiftsApiService } from '@serveiq/shared/data-access';
import { DashboardStats, Tab, PeakHoursEntry, Shift, WaiterPerformance } from '@serveiq/shared/models';
import { catchError, forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';

interface EventItem {
  tx: string;
  status: string;
  statusClass: string;
  desc: string;
  time: string;
}

interface StaffAvatar {
  initial: string;
  color: string;
}

@Component({
  selector: 'app-premium-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './premium-dashboard.component.html',
  styleUrls: ['./premium-dashboard.component.scss']
})
export class PremiumDashboardComponent implements OnInit, AfterViewInit {
  private branchesApi = inject(BranchesApiService);
  private reportsApi = inject(ReportsApiService);
  private tabsApi = inject(TabsApiService);
  private shiftsApi = inject(ShiftsApiService);

  businessName = signal('ServeIQ');
  totalRevenue = signal('₦0');
  revenueGrowth = signal('—');
  staffOnline = signal(0);
  avgTurnaround = signal(0);
  targetTurnaround = signal(45);
  turnaroundPercent = signal(0);
  systemStatus = signal('Offline');
  zoneTag = signal('SYSTEM_IDLE');
  systemTag = signal('LOADING');
  recentEvents = signal<EventItem[]>([]);
  staffAvatars = signal<StaffAvatar[]>([]);
  isLoading = signal(true);

  sparklinePath = signal('');
  healthPath1 = signal('');
  healthPath1Area = signal('');
  healthPath2 = signal('');
  healthPath2Area = signal('');

  private avatarColors = [
    'linear-gradient(135deg, #f97316, #fb923c)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    'linear-gradient(135deg, #06b6d4, #22d3ee)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f43f5e, #fb7185)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    this.businessName.set(localStorage.getItem('businessName') || 'ServeIQ');
    this.loadData();
  }

  private loadData() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const from = thirtyDaysAgo.toISOString().split('T')[0];

    forkJoin({
      stats: this.branchesApi.getStats().pipe(catchError(() => of(null))),
      peakHours: this.reportsApi.getPeakHours(undefined, from, today).pipe(catchError(() => of([]))),
      peakEfficiency: this.reportsApi.getPeakEfficiency(from, today).pipe(catchError(() => of([]))),
      tabs: this.tabsApi.getAllTabsUnpaginated().pipe(catchError(() => of([]))),
      shift: this.shiftsApi.getCurrent().pipe(catchError(() => of(null))),
    }).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: ({ stats, peakHours, peakEfficiency, tabs, shift }) => {
        if (stats) this.updateFromStats(stats);
        if (peakHours.length) this.updateFromPeakHours(peakHours);
        if (peakEfficiency.length) this.updateFromEfficiency(peakEfficiency);
        if (tabs.length) this.updateFromTabs(tabs);
        if (shift) this.updateFromShift(shift);

        if (!stats && !peakHours.length && !tabs.length) {
          this.setMockData();
        }
      },
      error: () => this.setMockData()
    });
  }

  private updateFromStats(stats: DashboardStats) {
    const revenue = stats.dailyRevenue || 0;
    this.totalRevenue.set(`₦${(revenue / 100).toLocaleString()}`);

    const staff = stats.waiterPerformance || [];
    this.staffOnline.set(staff.length);

    this.staffAvatars.set(staff.slice(0, 5).map((w: WaiterPerformance) => ({
      initial: (w.waiter?.fullName || '?').charAt(0).toUpperCase(),
      color: this.avatarColors[staff.indexOf(w) % this.avatarColors.length],
    })));

    if (staff.length > 5) {
      const more = this.staffAvatars();
      more.push({ initial: `+${staff.length - 5}`, color: '' });
      this.staffAvatars.set(more);
    }
  }

  private updateFromPeakHours(data: PeakHoursEntry[]) {
    const counts = data.map(d => d.orderCount);
    if (!counts.length) return;
    this.sparklinePath.set(this.buildSparklinePath(counts, 400, 100));

    this.zoneTag.set(data.some(d => d.orderCount > 5) ? 'ZONE_ALPHA' : 'ZONE_BETA');

    const orderVals = counts.map(c => c * 5);
    const revVals = data.map(d => Math.round(d.revenueKobo / 100000));
    this.healthPath1.set(this.buildLinePath(revVals, 800, 300));
    this.healthPath1Area.set(this.buildAreaPath(revVals, 800, 300));
    this.healthPath2.set(this.buildLinePath(orderVals, 800, 300));
    this.healthPath2Area.set(this.buildAreaPath(orderVals, 800, 300));
  }

  private updateFromEfficiency(data: { hour: number; totalCovers: number; avgDurationMinutes: number }[]) {
    const valid = data.filter(d => d.avgDurationMinutes > 0);
    if (!valid.length) return;
    const avg = Math.round(valid.reduce((s, d) => s + d.avgDurationMinutes, 0) / valid.length);
    this.avgTurnaround.set(avg);
    const target = this.targetTurnaround();
    this.turnaroundPercent.set(target > 0 ? Math.min(Math.round((avg / target) * 100), 100) : 100);
  }

  private updateFromTabs(tabs: Tab[]) {
    const recent = tabs
      .filter(t => t.status !== 'voided')
      .sort((a, b) => new Date(b.closedAt || b.openedAt).getTime() - new Date(a.closedAt || a.openedAt).getTime())
      .slice(0, 4);

    this.recentEvents.set(recent.map(t => {
      const paid = t.status === 'paid';
      const voided = t.status === 'voided';
      return {
        tx: `#${t.id.slice(0, 8).toUpperCase()}`,
        status: paid ? 'Paid' : voided ? 'Void' : 'Pending',
        statusClass: paid ? 'status-paid' : voided ? 'status-void' : 'status-pending',
        desc: `Table ${t.tableId?.slice(0, 4) || '??'} - ${this.formatTabTotal(t)}`,
        time: new Date(t.closedAt || t.openedAt).toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      };
    }));
  }

  private updateFromShift(shift: Shift) {
    if (shift.status === 'open') {
      const start = new Date(shift.openedAt);
      const h = start.getHours().toString().padStart(2, '0');
      const m = start.getMinutes().toString().padStart(2, '0');
      this.systemStatus.set(`Shift Open (${h}:${m} UTC)`);
      this.systemTag.set('SYSTEM_ACTIVE');
    } else {
      this.systemStatus.set('Offline');
      this.systemTag.set('SYSTEM_IDLE');
    }
  }

  private formatTabTotal(tab: Tab): string {
    const items = tab.orderItems || [];
    const total = items.reduce((s, i) => s + (i.priceKobo || 0) * (i.quantity || 0), 0);
    return `₦${(total / 100).toFixed(2)}`;
  }

  private buildSparklinePath(vals: number[], w: number, h: number): string {
    if (!vals.length) return '';
    const max = Math.max(...vals) || 1;
    const min = Math.min(...vals) || 0;
    const range = max - min || 1;
    const step = w / (vals.length - 1);
    const pad = 5;
    const yScale = h - pad * 2;

    let d = `M0,${pad + yScale - ((vals[0] - min) / range) * yScale}`;
    for (let i = 1; i < vals.length; i++) {
      const x = Math.round(i * step);
      const y = Math.round(pad + yScale - ((vals[i] - min) / range) * yScale);
      d += ` L${x},${y}`;
    }
    return d;
  }

  private buildLinePath(vals: number[], w: number, h: number): string {
    if (!vals.length) return '';
    const max = Math.max(...vals) || 1;
    const min = Math.min(...vals) || 0;
    const range = max - min || 1;
    const step = w / (vals.length - 1);
    const pad = 10;
    const yScale = h - pad * 2;

    let d = `M0,${pad + yScale - ((vals[0] - min) / range) * yScale}`;
    for (let i = 1; i < vals.length; i++) {
      const x = Math.round(i * step);
      const y = Math.round(pad + yScale - ((vals[i] - min) / range) * yScale);
      d += ` L${x},${y}`;
    }
    return d;
  }

  private buildAreaPath(vals: number[], w: number, h: number): string {
    const line = this.buildLinePath(vals, w, h);
    if (!line) return '';
    return `${line} L${w},${h} L0,${h} Z`;
  }

  private setMockData() {
    this.totalRevenue.set('₦1.2M');
    this.revenueGrowth.set('+12.5%');
    this.staffOnline.set(6);
    this.avgTurnaround.set(42);
    this.turnaroundPercent.set(93);
    this.systemStatus.set('System Live: Prime Time');
    this.zoneTag.set('ZONE_ALPHA');
    this.systemTag.set('SYSTEM_STABLE');
    this.sparklinePath.set('M0,80 Q50,70 100,85 T200,40 T300,60 T400,20');
    this.healthPath1.set('M0,250 Q100,220 200,240 T400,100 T600,180 T800,50');
    this.healthPath1Area.set('M0,250 Q100,220 200,240 T400,100 T600,180 T800,50 L800,300 L0,300 Z');
    this.healthPath2.set('M0,280 Q150,260 300,270 T500,150 T800,100');
    this.healthPath2Area.set('M0,280 Q150,260 300,270 T500,150 T800,100 L800,300 L0,300 Z');
    this.recentEvents.set([
      { tx: '#TX_8829', status: 'Paid', statusClass: 'status-paid', desc: 'Table 12 - $145.00', time: '14:22:10 UTC' },
      { tx: '#TX_8830', status: 'Pending', statusClass: 'status-pending', desc: 'Table 04 - $82.50', time: '14:25:44 UTC' },
      { tx: '#TX_8831', status: 'Paid', statusClass: 'status-paid', desc: 'Table 22 - $310.00', time: '14:28:12 UTC' },
      { tx: '#TX_VOID', status: 'Void', statusClass: 'status-void', desc: 'Table 01 - Refunded', time: '14:30:01 UTC' }
    ]);
    this.staffAvatars.set([
      { initial: 'A', color: 'linear-gradient(135deg, #f97316, #fb923c)' },
      { initial: 'B', color: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
      { initial: 'C', color: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
      { initial: '+3', color: '' },
    ]);
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initWebGL();
    }
  }

  private initWebGL() {
    const canvas = document.getElementById('shader-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncSize).observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

vec3 hsb2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main() {
    vec2 uv = v_texCoord;
    float orangeBlob = smoothstep(0.6, 0.0, distance(uv, vec2(0.2 + 0.1 * sin(u_time * 0.4), 0.3 + 0.1 * cos(u_time * 0.5))));
    float violetBlob = smoothstep(0.7, 0.0, distance(uv, vec2(0.8 + 0.1 * cos(u_time * 0.3), 0.7 + 0.1 * sin(u_time * 0.4))));
    float tertiaryBlob = smoothstep(0.5, 0.0, distance(uv, vec2(0.5 + 0.2 * sin(u_time * 0.2), 0.5 + 0.2 * cos(u_time * 0.3))));
    vec3 orange = vec3(0.294, 0.886, 0.467);
    vec3 violet = vec3(0.678, 0.776, 1.000);
    vec3 base = vec3(0.008, 0.024, 0.090);
    vec3 color = base;
    color = mix(color, orange, orangeBlob * 0.3);
    color = mix(color, violet, violetBlob * 0.3);
    color = mix(color, orange, tertiaryBlob * 0.1);
    gl_FragColor = vec4(color, 1.0);
}`;

    function cs(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    window.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
        mouse.y = (1.0 - (event.clientY - rect.top) / rect.height) * canvas.height;
      }
    });
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    function render(t: number) {
      syncSize();
      gl!.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes) gl!.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }
    render(0);
  }
}
