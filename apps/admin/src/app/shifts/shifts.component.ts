import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShiftsApiService } from '@serveiq/shared/data-access';
import { Shift, ShiftTemplate, CreateShiftTemplateRequest, OpenShiftRequest, CloseShiftRequest, ShiftReport } from '@serveiq/shared/models';
import { UserApiService } from '@serveiq/shared/data-access';
import { User } from '@serveiq/shared/models';
import { CurrencyContextService } from '../core/currency-context.service';
import Swal from 'sweetalert2';

interface OpenShiftForm {
  templateId: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  startingCash: number;
  assignedStaffIds: string[];
  note: string;
}

interface TemplateForm {
  id?: string;
  name: string;
  type: 'morning' | 'evening' | 'night' | 'split' | 'custom';
  scheduledStartTime: string;
  scheduledEndTime: string;
  daysOfWeek: number[];
  color: string;
}

@Component({
  selector: 'app-shifts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shifts.component.html',
  styleUrls: ['./shifts.component.scss']
})
export class ShiftsComponent implements OnInit {
  private shiftsApi = inject(ShiftsApiService);
  private userApi = inject(UserApiService);
  private currency = inject(CurrencyContextService);

  // Data
  shifts = signal<Shift[]>([]);
  templates = signal<ShiftTemplate[]>([]);
  staff = signal<User[]>([]);
  currentShift = signal<Shift | null>(null);
  selectedShiftForClose = signal<Shift | null>(null);
  selectedReport = signal<ShiftReport | null>(null);

  // UI State
  isLoading = signal(true);
  isSaving = signal(false);

  // Modals
  showOpenModal = signal(false);
  showCloseModal = signal(false);
  showReportModal = signal(false);
  showTemplateModal = signal(false);
  editingTemplate = signal<ShiftTemplate | null>(null);

  // Forms
  openShiftForm = signal<OpenShiftForm>({
    templateId: '',
    scheduledStartTime: '07:00',
    scheduledEndTime: '15:00',
    startingCash: 0,
    assignedStaffIds: [],
    note: ''
  });

  templateForm = signal<TemplateForm>({
    name: '',
    type: 'morning',
    scheduledStartTime: '07:00',
    scheduledEndTime: '15:00',
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    color: '#22c55e'
  });

  // Filters
  dateFrom = signal('');
  dateTo = signal('');
  statusFilter = signal('');

  closeCash = signal(0);
  closeNote = signal('');

  readonly daysOfWeek = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ];

  // Computed
  todaysScheduledShifts = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.shifts().filter(s => 
      s.scheduledStartTime && 
      s.status === 'scheduled' && 
      new Date(s.openedAt).toISOString().split('T')[0] === today
    );
  });

  shiftToClose = computed(() => this.selectedShiftForClose() || this.currentShift());

  closeCashKobo = computed(() => Math.round(this.closeCash() * 100));

  paymentBreakdownEntries = computed(() => 
    Object.entries(this.selectedReport()?.paymentBreakdown || {})
  );

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.loadStaff();
    this.loadTemplates();
    this.loadShifts();
    this.loadCurrentShift();
  }

  loadStaff() {
    this.userApi.listWaiters().subscribe({
      next: (data) => this.staff.set(data || []),
      error: () => this.staff.set([])
    });
  }

  loadTemplates() {
    this.shiftsApi.listTemplates().subscribe({
      next: (data) => this.templates.set(data || []),
      error: () => this.templates.set([])
    });
  }

  loadShifts() {
    this.isLoading.set(true);
    const df = this.dateFrom() || undefined;
    const dt = this.dateTo() || undefined;
    const status = this.statusFilter() || undefined;

    this.shiftsApi.list({ dateFrom: df, dateTo: dt, status }).subscribe({
      next: (data) => {
        this.shifts.set(data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to load shifts' });
      }
    });
  }

  loadCurrentShift() {
    this.shiftsApi.getCurrent().subscribe({
      next: (shift) => this.currentShift.set(shift),
      error: () => this.currentShift.set(null)
    });
  }

  // --- Template Actions ---
  openShiftFromTemplate(template: ShiftTemplate) {
    this.openShiftForm.set({
      templateId: template.id,
      scheduledStartTime: template.scheduledStartTime,
      scheduledEndTime: template.scheduledEndTime,
      startingCash: 0,
      assignedStaffIds: [],
      note: ''
    });
    this.showOpenModal.set(true);
  }

  openScheduledShift(shift: Shift) {
    this.isSaving.set(true);
    const payload: OpenShiftRequest = {
      templateId: shift.templateId,
      scheduledStartTime: shift.scheduledStartTime,
      scheduledEndTime: shift.scheduledEndTime,
      starting_cash_kobo: shift.startingCashKobo,
      assigned_staff_ids: shift.assignedStaffIds,
      note: shift.note
    };

    this.shiftsApi.open(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.loadShifts();
        this.loadCurrentShift();
        Swal.fire({ icon: 'success', title: 'Shift Started', timer: 1500, showConfirmButton: false });
      },
      error: () => {
        this.isSaving.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to start shift' });
      }
    });
  }

  // --- Open Shift ---
  openShift() {
    const form = this.openShiftForm();
    if (form.startingCash <= 0) {
      Swal.fire({ icon: 'error', title: 'Starting cash must be greater than 0' });
      return;
    }

    this.isSaving.set(true);
    const payload: OpenShiftRequest = {
      templateId: form.templateId || undefined,
      scheduledStartTime: form.scheduledStartTime,
      scheduledEndTime: form.scheduledEndTime,
      starting_cash_kobo: Math.round(form.startingCash * 100),
      assigned_staff_ids: form.assignedStaffIds.length > 0 ? form.assignedStaffIds : undefined,
      note: form.note || undefined
    };

    this.shiftsApi.open(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showOpenModal.set(false);
        this.resetOpenForm();
        this.loadShifts();
        this.loadCurrentShift();
        Swal.fire({ icon: 'success', title: 'Shift Opened', timer: 1500, showConfirmButton: false });
      },
      error: () => {
        this.isSaving.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to open shift' });
      }
    });
  }

  // --- Close Shift ---
  closeShift(shift: Shift) {
    if (this.closeCash() <= 0) {
      Swal.fire({ icon: 'error', title: 'Actual cash must be greater than 0' });
      return;
    }

    const actualCashKobo = this.closeCashKobo();
    const expectedKobo = shift.expectedCashKobo || 0;

    if (actualCashKobo !== expectedKobo) {
      const explanation = this.varianceExplanationFor(shift, actualCashKobo);
      Swal.fire({
        icon: 'warning',
        title: 'Cash variance detected!',
        html: `<p>${explanation}</p><p style="margin-top:8px;">Continue closing?</p>`,
        showCancelButton: true,
        confirmButtonText: 'Yes, close shift',
      }).then((result) => {
        if (result.isConfirmed) {
          this.performCloseShift(shift, actualCashKobo);
        }
      });
      return;
    }

    this.performCloseShift(shift, actualCashKobo);
  }

  performCloseShift(shift: Shift, actualCashKobo: number) {
    this.isSaving.set(true);
    const payload: CloseShiftRequest = {
      actual_cash_kobo: actualCashKobo,
      note: this.closeNote() || undefined
    };

    this.shiftsApi.close(shift.id, payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showCloseModal.set(false);
        this.resetCloseForm();
        this.loadShifts();
        this.loadCurrentShift();
        const explanation = this.varianceExplanationFor({ ...shift, actualCashKobo });
        Swal.fire({
          icon: actualCashKobo === (shift.expectedCashKobo || 0) ? 'success' : 'info',
          title: actualCashKobo === (shift.expectedCashKobo || 0) ? 'Shift Closed' : 'Shift Closed with Variance',
          html: `<p>${explanation}</p>`,
          timer: 3000,
          showConfirmButton: false,
        });
      },
      error: () => {
        this.isSaving.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to close shift' });
      }
    });
  }

  // --- Shift Report ---
  viewShiftReport(shift: Shift) {
    if (shift.status !== 'closed') {
      Swal.fire({ icon: 'info', title: 'Report only available for closed shifts' });
      return;
    }
    this.shiftsApi.getShiftReport(shift.id).subscribe({
      next: (report) => {
        this.selectedReport.set(report);
        this.showReportModal.set(true);
      },
      error: () => Swal.fire({ icon: 'error', title: 'Failed to load shift report' })
    });
  }

  // --- Template Management ---
  editTemplate(template: ShiftTemplate) {
    this.editingTemplate.set(template);
    this.templateForm.set({
      id: template.id,
      name: template.name,
      type: template.type,
      scheduledStartTime: template.scheduledStartTime,
      scheduledEndTime: template.scheduledEndTime,
      daysOfWeek: [...template.daysOfWeek],
      color: template.color
    });
  }

  cancelTemplateEdit() {
    this.editingTemplate.set(null);
    this.templateForm.set({
      name: '',
      type: 'morning',
      scheduledStartTime: '07:00',
      scheduledEndTime: '15:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      color: '#22c55e'
    });
  }

  saveTemplate() {
    const form = this.templateForm();
    if (!form.name.trim()) return;

    this.isSaving.set(true);
    const payload: CreateShiftTemplateRequest = {
      name: form.name,
      type: form.type,
      scheduledStartTime: form.scheduledStartTime,
      scheduledEndTime: form.scheduledEndTime,
      daysOfWeek: form.daysOfWeek,
      color: form.color
    };

    const request = form.id 
      ? this.shiftsApi.updateTemplate(form.id, payload)
      : this.shiftsApi.createTemplate(payload);

    request.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cancelTemplateEdit();
        this.loadTemplates();
        Swal.fire({ icon: 'success', title: form.id ? 'Template Updated' : 'Template Created', timer: 1500, showConfirmButton: false });
      },
      error: () => {
        this.isSaving.set(false);
        Swal.fire({ icon: 'error', title: 'Failed to save template' });
      }
    });
  }

  deleteTemplate(template: ShiftTemplate) {
    Swal.fire({
      title: 'Delete Template?',
      text: `This will delete "${template.name}". Shifts using this template will not be affected.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete'
    }).then((result) => {
      if (result.isConfirmed) {
        this.shiftsApi.deleteTemplate(template.id).subscribe({
          next: () => {
            this.loadTemplates();
            Swal.fire({ icon: 'success', title: 'Template Deleted', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Failed to delete template' })
        });
      }
    });
  }

  // --- Form Helpers ---
  resetOpenForm() {
    this.openShiftForm.set({
      templateId: '',
      scheduledStartTime: '07:00',
      scheduledEndTime: '15:00',
      startingCash: 0,
      assignedStaffIds: [],
      note: ''
    });
  }

  resetCloseForm() {
    this.closeCash.set(0);
    this.closeNote.set('');
    this.selectedShiftForClose.set(null);
  }

  toggleStaff(staffId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.openShiftForm.update(f => ({
      ...f,
      assignedStaffIds: checked 
        ? [...f.assignedStaffIds, staffId] 
        : f.assignedStaffIds.filter(id => id !== staffId)
    }));
  }

  toggleDay(dayValue: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.templateForm.update(f => ({
      ...f,
      daysOfWeek: checked 
        ? [...f.daysOfWeek, dayValue] 
        : f.daysOfWeek.filter(d => d !== dayValue)
    }));
  }

  getDaysString(days: number[]): string {
    if (days.length === 7) return 'Daily';
    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Mon-Fri';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
    return days.map(d => this.daysOfWeek.find(w => w.value === d)?.label).join(', ');
  }

  getPaymentKey(index: number): string {
    return this.paymentBreakdownEntries()[index]?.[0] || '';
  }

  getPaymentValue(index: number): number {
    return this.paymentBreakdownEntries()[index]?.[1] || 0;
  }

  // --- Formatting & Helpers ---
  formatKobo(kobo: number): string {
    return this.currency.formatKobo(kobo);
  }

  getVariance(shift: Shift): number {
    return (shift.actualCashKobo || 0) - (shift.expectedCashKobo || 0);
  }

  getVariancePrefix(shift: Shift): string {
    return this.getVariance(shift) >= 0 ? '+' : '';
  }

  getVarianceColor(shift: Shift): string {
    return this.getVariance(shift) >= 0 ? '#22c55e' : '#dc2626';
  }

  getVarianceColorHint(): string {
    const shift = this.shiftToClose();
    if (!shift) return '#22c55e';
    return this.getVariance(shift) >= 0 ? '#22c55e' : '#dc2626';
  }

  varianceExplanationFor(shift: Shift, actualKoboOverride?: number): string {
    const actualKobo = actualKoboOverride ?? shift.actualCashKobo ?? 0;
    const expectedKobo = shift.expectedCashKobo || 0;
    const startKobo = shift.startingCashKobo;
    const varianceKobo = actualKobo - expectedKobo;
    const fs = this.formatKobo(startKobo);
    const fe = this.formatKobo(expectedKobo);
    const fa = this.formatKobo(actualKobo);
    if (varianceKobo === 0) {
      return `Started with ${fs}. Expected ${fe}. Actual matched exactly.`;
    } else if (varianceKobo > 0) {
      return `Started with ${fs}. Expected ${fe}. Actual ${fa} — ${this.formatKobo(varianceKobo)} over.`;
    } else {
      return `Started with ${fs}. Expected ${fe}. Actual ${fa} — ${this.formatKobo(Math.abs(varianceKobo))} short.`;
    }
  }

  getShiftStatusColor(status: string): string {
    switch (status) {
      case 'open': return '#22c55e';
      case 'closed': return '#94a3b8';
      case 'scheduled': return '#3b82f6';
      case 'cancelled': return '#dc2626';
      default: return '#94a3b8';
    }
  }
}