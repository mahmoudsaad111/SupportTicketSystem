import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { TicketService } from '../shared/services/ticket.service';
import { runInZone } from '../shared/utils/run-in-zone';
import {
  TicketDto,
  TicketStatus,
  TicketStatusLabels,
  PriorityLevel,
  PriorityLevelLabels,
} from '../shared/models/ticket.models';

Chart.register(...registerables);

// Cap used when pulling a batch of tickets client-side to derive the priority
// breakdown, since GetTicketListDto has no priority filter on the backend.
// This is an intentional, disclosed limitation (see dashboard.component.html).
const PRIORITY_SAMPLE_SIZE = 200;
const RECENT_TICKETS_COUNT = 6;

interface StatCard {
  label: string;
  value: number;
  icon: string;
  accent: 'blue' | 'amber' | 'red' | 'green';
}

interface StatusSlice {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityChartRef!: ElementRef<HTMLCanvasElement>;

  loading = true;
  loadError = false;

  totalTickets = 0;
  openCount = 0;
  overdueCount = 0;
  resolvedCount = 0;

  statusSlices: StatusSlice[] = [];
  prioritySlices: StatusSlice[] = [];
  priorityTotal = 0;
  prioritySampleCapped = false;

  recentTickets: TicketDto[] = [];

  readonly TicketStatus = TicketStatus;
  readonly TicketStatusLabels = TicketStatusLabels;
  readonly PriorityLevelLabels = PriorityLevelLabels;

  private statusChart?: Chart<'doughnut', number[], string>;
  private priorityChart?: Chart<'doughnut', number[], string>;
  private viewReady = false;
  private dataReady = false;

  constructor(
    private ticketService: TicketService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.dataReady) {
      this.renderCharts();
    }
  }

  ngOnDestroy(): void {
    this.statusChart?.destroy();
    this.priorityChart?.destroy();
  }

  private loadDashboard(): void {
    this.loading = true;
    this.loadError = false;

    forkJoin({
      open: this.ticketService.getList({ status: TicketStatus.Open, maxResultCount: 1 }),
      inProgress: this.ticketService.getList({ status: TicketStatus.InProgress, maxResultCount: 1 }),
      resolved: this.ticketService.getList({ status: TicketStatus.Resolved, maxResultCount: 1 }),
      reopened: this.ticketService.getList({ status: TicketStatus.Reopened, maxResultCount: 1 }),
      closed: this.ticketService.getList({ status: TicketStatus.Closed, maxResultCount: 1 }),
      overdue: this.ticketService.getOverdueTickets(),
      recent: this.ticketService.getList({ maxResultCount: RECENT_TICKETS_COUNT }),
      prioritySample: this.ticketService.getList({ maxResultCount: PRIORITY_SAMPLE_SIZE }),
    })
      .pipe(
        runInZone(this.ngZone),
        finalize(() => {
          this.loading = false;
          this.dataReady = true;
          // The status/priority panels only enter the DOM once `loading`
          // flips to false and Angular re-renders the `@else` branch of the
          // template (that's where the <canvas> elements live). Calling
          // renderCharts() synchronously here — in the same tick that sets
          // `loading` — runs before that re-render happens, so the
          // @ViewChild canvas refs can still point at nothing and the
          // charts silently never get created (no error, they just don't
          // appear). Deferring to a macrotask lets change detection finish
          // updating the DOM first.
          if (this.viewReady) {
            setTimeout(() => this.renderCharts());
          }
          // Force this component to repaint immediately, regardless of
          // whether the zone-run above actually got Angular to schedule a
          // tick on its own.
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: results => {
          try {
            this.applyDashboardData(results);
          } catch (err) {
            console.error('[Dashboard] Failed to process ticket data:', err);
            this.loadError = true;
          }
        },
        error: err => {
          console.error('[Dashboard] Failed to load ticket data:', err);
          this.loadError = true;
        },
      });
  }

  private applyDashboardData(results: {
    open: { totalCount?: number };
    inProgress: { totalCount?: number };
    resolved: { totalCount?: number };
    reopened: { totalCount?: number };
    closed: { totalCount?: number };
    overdue: { items?: TicketDto[] };
    recent: { items?: TicketDto[] };
    prioritySample: { totalCount?: number; items?: TicketDto[] };
  }): void {
    const { open, inProgress, resolved, reopened, closed, overdue, recent, prioritySample } = results;

    this.openCount = open.totalCount ?? 0;
    this.resolvedCount = resolved.totalCount ?? 0;
    this.overdueCount = overdue.items?.length ?? 0;
    this.totalTickets =
      (open.totalCount ?? 0) +
      (inProgress.totalCount ?? 0) +
      (resolved.totalCount ?? 0) +
      (reopened.totalCount ?? 0) +
      (closed.totalCount ?? 0);

    this.statusSlices = [
      { label: TicketStatusLabels[TicketStatus.Open], value: open.totalCount ?? 0, color: '#3b82f6' },
      { label: TicketStatusLabels[TicketStatus.InProgress], value: inProgress.totalCount ?? 0, color: '#a5b4fc' },
      { label: TicketStatusLabels[TicketStatus.Resolved], value: resolved.totalCount ?? 0, color: '#22c55e' },
      { label: TicketStatusLabels[TicketStatus.Reopened], value: reopened.totalCount ?? 0, color: '#f97316' },
      { label: TicketStatusLabels[TicketStatus.Closed], value: closed.totalCount ?? 0, color: '#9ca3af' },
    ].filter(s => s.value > 0);

    this.recentTickets = recent.items ?? [];

    this.prioritySampleCapped = (prioritySample.totalCount ?? 0) > PRIORITY_SAMPLE_SIZE;
    const priorityCounts = new Map<PriorityLevel, number>();
    for (const ticket of prioritySample.items ?? []) {
      priorityCounts.set(ticket.priority, (priorityCounts.get(ticket.priority) ?? 0) + 1);
    }
    const priorityColors: Record<PriorityLevel, string> = {
      [PriorityLevel.Low]: '#22c55e',
      [PriorityLevel.Medium]: '#f59e0b',
      [PriorityLevel.High]: '#ef4444',
      [PriorityLevel.Critical]: '#7c3aed',
    };
    this.prioritySlices = Array.from(priorityCounts.entries())
      .map(([priority, value]) => ({
        label: PriorityLevelLabels[priority],
        value,
        color: priorityColors[priority],
      }))
      .filter(s => s.value > 0);
    this.priorityTotal = prioritySample.items?.length ?? 0;
  }

  private renderCharts(): void {
    try {
      this.statusChart?.destroy();
      this.priorityChart?.destroy();
    } catch (err) {
      console.error('[Dashboard] Failed to destroy previous chart instance:', err);
    }

    try {
      // Chart.js doughnut charts don't render anything meaningful for a
      // fully empty dataset (e.g. a brand-new system with zero tickets in
      // every status). Skip chart creation entirely in that case rather
      // than handing it an empty [] — the template already shows a plain
      // "0" total, so there's nothing useful to chart.
      if (this.statusChartRef?.nativeElement && this.statusSlices.length > 0) {
        this.statusChart = new Chart(this.statusChartRef.nativeElement, {
          type: 'doughnut',
          data: {
            labels: this.statusSlices.map(s => s.label),
            datasets: [
              {
                data: this.statusSlices.map(s => s.value),
                backgroundColor: this.statusSlices.map(s => s.color),
                borderWidth: 0,
              },
            ],
          },
          options: {
            cutout: '68%',
            plugins: { legend: { display: false } },
          },
        });
      }

      if (this.priorityChartRef?.nativeElement && this.prioritySlices.length > 0) {
        this.priorityChart = new Chart(this.priorityChartRef.nativeElement, {
          type: 'doughnut',
          data: {
            labels: this.prioritySlices.map(s => s.label),
            datasets: [
              {
                data: this.prioritySlices.map(s => s.value),
                backgroundColor: this.prioritySlices.map(s => s.color),
                borderWidth: 0,
              },
            ],
          },
          options: {
            cutout: '68%',
            plugins: { legend: { display: false } },
          },
        });
      }
    } catch (err) {
      console.error('[Dashboard] Failed to render charts:', err);
    }
  }

  statusBadgeClass(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.Open:
        return 'badge badge--blue';
      case TicketStatus.InProgress:
        return 'badge badge--purple';
      case TicketStatus.Resolved:
      case TicketStatus.Closed:
        return 'badge badge--green';
      case TicketStatus.Reopened:
        return 'badge badge--orange';
      default:
        return 'badge';
    }
  }

  priorityBadgeClass(priority: PriorityLevel): string {
    switch (priority) {
      case PriorityLevel.Low:
        return 'badge badge--green';
      case PriorityLevel.Medium:
        return 'badge badge--orange';
      case PriorityLevel.High:
        return 'badge badge--red';
      case PriorityLevel.Critical:
        return 'badge badge--purple';
      default:
        return 'badge';
    }
  }

  trackByTicketId(_index: number, ticket: TicketDto): string {
    return ticket.id;
  }

  trackBySliceLabel(_index: number, slice: StatusSlice): string {
    return slice.label;
  }
}
