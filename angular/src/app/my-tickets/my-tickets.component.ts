import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfigStateService } from '@abp/ng.core';
import { finalize } from 'rxjs';
import { NgZone } from '@angular/core';
import { TicketService } from '../shared/services/ticket.service';
import { AgentNameResolverService } from '../shared/services/agent-name-resolver.service';
import { runInZone } from '../shared/utils/run-in-zone';
import { exportTicketsToCsv } from '../shared/utils/ticket-csv-export';
import {
  TicketDto,
  TicketStatus,
  TicketStatusLabels,
  PriorityLevel,
  PriorityLevelLabels,
} from '../shared/models/ticket.models';

const PAGE_SIZE = 10;
const SORT_FIELD = 'SlaDeadline';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './my-tickets.component.html',
  styleUrls: ['./my-tickets.component.scss'],
})
export class MyTicketsComponent implements OnInit {
  readonly TicketStatus = TicketStatus;
  readonly TicketStatusLabels = TicketStatusLabels;
  readonly PriorityLevelLabels = PriorityLevelLabels;
  readonly statusOptions = Object.values(TicketStatus).filter(
    v => typeof v === 'number',
  ) as TicketStatus[];

  currentUserId: string | null = null;
  tickets: TicketDto[] = [];
  totalCount = 0;
  loading = true;
  loadError = false;
  noUserId = false;

  statusFilter: TicketStatus | 'all' = 'all';
  currentPage = 1;
  readonly pageSize = PAGE_SIZE;

  constructor(
    private ticketService: TicketService,
    private agentNameResolver: AgentNameResolverService,
    private configState: ConfigStateService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const currentUser = this.configState.getOne('currentUser');
    this.currentUserId = currentUser?.id ?? null;

    if (!this.currentUserId) {
      // Not signed in, or (more likely here) signed in but the logged-in
      // account isn't wired up as an "agent" on any ticket yet.
      this.noUserId = true;
      this.loading = false;
      return;
    }

    this.loadTickets();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  loadTickets(): void {
    if (!this.currentUserId) return;
    this.loading = true;
    this.loadError = false;

    this.ticketService
      .getList({
        assignedAgentId: this.currentUserId,
        status: this.statusFilter === 'all' ? undefined : this.statusFilter,
        sorting: `${SORT_FIELD} asc`,
        skipCount: (this.currentPage - 1) * this.pageSize,
        maxResultCount: this.pageSize,
      })
      .pipe(
        runInZone(this.ngZone),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: result => {
          this.tickets = result.items ?? [];
          this.totalCount = result.totalCount ?? 0;
        },
        error: () => {
          this.loadError = true;
        },
      });
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadTickets();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadTickets();
  }

  // ---- CSV export ----
  // Pulls the full filtered set (all pages, capped at 1000) in one call,
  // not just what's currently on screen -- consistent with the other
  // ticket-list export buttons. Every row here is already assigned to the
  // current user, so agent-name resolution mostly just confirms "you", but
  // it's kept for consistency and to correctly label any edge case where a
  // ticket shows here without loading its own agent's exact display name.
  exporting = false;

  exportCsv(): void {
    if (this.exporting || !this.currentUserId) return;
    this.exporting = true;

    this.ticketService
      .getList({
        assignedAgentId: this.currentUserId,
        status: this.statusFilter === 'all' ? undefined : this.statusFilter,
        sorting: `${SORT_FIELD} asc`,
        maxResultCount: 1000,
      })
      .pipe(runInZone(this.ngZone))
      .subscribe({
        next: result => {
          const rows = result.items ?? [];

          this.agentNameResolver
            .resolveNames(rows.map(t => t.assignedAgentId))
            .pipe(
              runInZone(this.ngZone),
              finalize(() => {
                this.exporting = false;
                this.cdr.detectChanges();
              }),
            )
            .subscribe({
              next: agentNames => {
                exportTicketsToCsv(`my-tickets-${new Date().toISOString().slice(0, 10)}.csv`, rows, agentNames);
              },
              error: () => {
                this.loadError = true;
              },
            });
        },
        error: () => {
          this.exporting = false;
          this.loadError = true;
          this.cdr.detectChanges();
        },
      });
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
}
