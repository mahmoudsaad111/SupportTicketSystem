import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfigStateService, PermissionService } from '@abp/ng.core';
import { finalize } from 'rxjs';
import { TicketService } from '../shared/services/ticket.service';
import { UserService } from '../shared/services/user.service';
import { AgentNameResolverService } from '../shared/services/agent-name-resolver.service';
import { IdentityUserDto } from '../shared/models/user.models';
import { runInZone } from '../shared/utils/run-in-zone';
import { getTicketActionError } from '../shared/utils/ticket-action-error';
import { exportTicketsToCsv } from '../shared/utils/ticket-csv-export';
import {
  TicketDto,
  TicketStatus,
  TicketStatusLabels,
  PriorityLevel,
  PriorityLevelLabels,
} from '../shared/models/ticket.models';

// GetTicketListDto has no "unassigned only" filter on the backend (passing
// assignedAgentId as null/omitted just skips that filter entirely rather
// than narrowing to nulls), so this pulls a batch and filters client-side.
// See the disclosed note in the template.
const FETCH_SIZE = 100;
const SORT_FIELD = 'SlaDeadline';

@Component({
  selector: 'app-unassigned-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './unassigned-tickets.component.html',
  styleUrls: ['./unassigned-tickets.component.scss'],
})
export class UnassignedTicketsComponent implements OnInit {
  readonly TicketStatus = TicketStatus;
  readonly TicketStatusLabels = TicketStatusLabels;
  readonly PriorityLevelLabels = PriorityLevelLabels;
  readonly statusOptions = Object.values(TicketStatus).filter(
    v => typeof v === 'number',
  ) as TicketStatus[];

  allFetched: TicketDto[] = [];
  totalFetched = 0;
  fetchCapped = false;
  loading = true;
  loadError = false;

  statusFilter: TicketStatus | 'all' = 'all';
  currentUserId: string | null = null;

  claimTicket: TicketDto | null = null;
  claimBusy = false;
  claimErrorMessage = '';

  assignTicket: TicketDto | null = null;
  assignAgentId = '';
  assignBusy = false;
  assignErrorMessage = '';
  users: IdentityUserDto[] = [];
  usersLoading = false;

  constructor(
    private ticketService: TicketService,
    private userService: UserService,
    private agentNameResolver: AgentNameResolverService,
    private configState: ConfigStateService,
    private permissionService: PermissionService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.configState.getOne('currentUser')?.id ?? null;
    this.loadUnassigned();
  }

  get unassignedTickets(): TicketDto[] {
    return this.allFetched.filter(t => !t.assignedAgentId);
  }

  loadUnassigned(): void {
    this.loading = true;
    this.loadError = false;

    this.ticketService
      .getList({
        status: this.statusFilter === 'all' ? undefined : this.statusFilter,
        sorting: `${SORT_FIELD} asc`,
        maxResultCount: FETCH_SIZE,
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
          this.allFetched = result.items ?? [];
          this.totalFetched = result.totalCount ?? 0;
          this.fetchCapped = (result.totalCount ?? 0) > FETCH_SIZE;
        },
        error: () => {
          this.loadError = true;
        },
      });
  }

  onStatusFilterChange(): void {
    this.loadUnassigned();
  }

  // ---- CSV export ----
  // allFetched already holds every unassigned candidate currently loaded
  // (see FETCH_SIZE note above) so export uses that directly. Every row's
  // agent is empty by definition here, but names are still resolved for
  // consistency with the other export buttons and in case this list is
  // later changed to include recently-claimed tickets too.
  exporting = false;

  exportCsv(): void {
    if (this.exporting || this.unassignedTickets.length === 0) return;
    this.exporting = true;

    const rows = this.unassignedTickets;

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
          exportTicketsToCsv(`unassigned-tickets-${new Date().toISOString().slice(0, 10)}.csv`, rows, agentNames);
        },
        error: () => {
          this.loadError = true;
        },
      });
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

  trackByTicketId(_index: number, ticket: TicketDto): string {
    return ticket.id;
  }

  // ---- Claim (assign to self) ----

  openClaim(ticket: TicketDto): void {
    this.claimTicket = ticket;
    this.claimErrorMessage = '';
  }

  confirmClaim(): void {
    if (!this.claimTicket || !this.currentUserId || !this.canAssignToOthers) return;
    this.claimBusy = true;
    this.claimErrorMessage = '';
    this.ticketService.assign(this.claimTicket.id, {
      agentId: this.currentUserId,
      resetSlaDeadline: false,
    }).subscribe({
      next: () => {
        this.claimBusy = false;
        this.claimTicket = null;
        this.loadUnassigned();
      },
      error: error => {
        this.claimBusy = false;
        this.claimErrorMessage = getTicketActionError(error, "Couldn't claim this ticket. Please try again.");
        this.cdr.detectChanges();
      },
    });
  }

  cancelClaim(): void {
    this.claimTicket = null;
    this.claimErrorMessage = '';
  }

  // ---- Assign to someone else ----

  get canAssignToOthers(): boolean {
    return this.permissionService.getGrantedPolicy('SupportTicketSystem.Tickets.Assign');
  }

  openAssign(ticket: TicketDto): void {
    if (!this.canAssignToOthers) return;
    this.assignTicket = ticket;
    this.assignAgentId = '';
    this.assignErrorMessage = '';
    this.loadUsers();
  }

  loadUsers(): void {
    this.usersLoading = true;
    this.userService.getList().subscribe({
      next: result => {
        this.users = result.items ?? [];
        this.usersLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.usersLoading = false;
        this.assignErrorMessage = "Couldn't load the user list. Please try again.";
        this.cdr.detectChanges();
      },
    });
  }

  submitAssign(): void {
    if (!this.assignTicket || !this.canAssignToOthers) return;
    if (!this.assignAgentId.trim()) {
      this.assignErrorMessage = 'Please select a user.';
      return;
    }
    this.assignBusy = true;
    this.assignErrorMessage = '';
    this.ticketService.assign(this.assignTicket.id, {
      agentId: this.assignAgentId,
      resetSlaDeadline: false,
    }).subscribe({
      next: () => {
        this.assignBusy = false;
        this.assignTicket = null;
        this.loadUnassigned();
      },
      error: error => {
        this.assignBusy = false;
        this.assignErrorMessage = getTicketActionError(error, "Couldn't assign this ticket. Please try again.");
        this.cdr.detectChanges();
      },
    });
  }

  cancelAssign(): void {
    this.assignTicket = null;
    this.assignErrorMessage = '';
  }
}
