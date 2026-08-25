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

type ActionMode = 'reopen' | 'assign' | null;

@Component({
  selector: 'app-overdue-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './overdue-tickets.component.html',
  styleUrls: ['./overdue-tickets.component.scss'],
})
export class OverdueTicketsComponent implements OnInit {
  readonly TicketStatus = TicketStatus;
  readonly TicketStatusLabels = TicketStatusLabels;
  readonly PriorityLevelLabels = PriorityLevelLabels;

  tickets: TicketDto[] = [];
  loading = true;
  loadError = false;

  actionMode: ActionMode = null;
  actionTicket: TicketDto | null = null;
  actionBusy = false;
  actionErrorMessage = '';
  reopenReason = '';
  assignAgentId = '';
  resetSlaDeadline = false;
  users: IdentityUserDto[] = [];
  usersLoading = false;
  currentUserId: string | null = null;

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
    this.loadOverdue();
    this.loadUsers();
  }

  loadOverdue(): void {
    this.loading = true;
    this.loadError = false;

    // GetOverdueTicketsAsync has no server-side pagination — it's expected
    // to return the full overdue set, which we sort client-side by how
    // overdue each ticket is (soonest/oldest SLA deadline first).
    this.ticketService
      .getOverdueTickets()
      .pipe(
        runInZone(this.ngZone),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: result => {
          this.tickets = [...(result.items ?? [])].sort(
            (a, b) => new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime(),
          );
        },
        error: () => {
          this.loadError = true;
        },
      });
  }

  overdueBy(slaDeadline: string): string {
    const diffMs = Date.now() - new Date(slaDeadline).getTime();
    if (diffMs <= 0) return 'just now';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return 'under an hour';
    if (hours < 24) return `${hours}h overdue`;
    const days = Math.floor(hours / 24);
    return `${days}d overdue`;
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

  userDisplayName(userId: string | null | undefined): string {
    if (!userId) return 'Unassigned';
    const user = this.users.find(item => item.id.toLowerCase() === userId.toLowerCase());
    if (!user) return 'Unknown user';
    return user.name || user.surname
      ? `${user.name ?? ''} ${user.surname ?? ''}`.trim()
      : user.userName;
  }

  // ---- CSV export ----
  // The overdue list is already fully loaded client-side (no pagination),
  // so export just resolves agent names for what's on screen -- no extra
  // fetch needed. Uses IdentityUserLookupService (permission-light) rather
  // than the AbpIdentity.Users-gated `users` list above, so non-admin
  // Agents exporting this page still get real names, not "Unknown user".
  exporting = false;

  exportCsv(): void {
    if (this.exporting || this.tickets.length === 0) return;
    this.exporting = true;

    this.agentNameResolver
      .resolveNames(this.tickets.map(t => t.assignedAgentId))
      .pipe(
        runInZone(this.ngZone),
        finalize(() => {
          this.exporting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: agentNames => {
          exportTicketsToCsv(`overdue-tickets-${new Date().toISOString().slice(0, 10)}.csv`, this.tickets, agentNames);
        },
        error: () => {
          this.actionErrorMessage = 'Export failed. Please try again.';
        },
      });
  }

  resolve(ticket: TicketDto): void {
    if (this.actionBusy || !this.canManageTicket(ticket)) return;
    this.removeTicket(ticket.id);
    this.runAction(this.ticketService.resolve(ticket.id));
  }

  close(ticket: TicketDto): void {
    if (this.actionBusy || !this.canManageTicket(ticket)) return;
    this.removeTicket(ticket.id);
    this.runAction(this.ticketService.close(ticket.id));
  }

  openReopen(ticket: TicketDto): void {
    this.actionTicket = ticket;
    this.reopenReason = '';
    this.actionErrorMessage = '';
    this.actionMode = 'reopen';
  }

  submitReopen(): void {
    if (!this.actionTicket || !this.canManageTicket(this.actionTicket)) return;
    if (!this.reopenReason.trim()) {
      this.actionErrorMessage = 'Please give a reason for reopening.';
      return;
    }
    this.runAction(this.ticketService.reopen(this.actionTicket.id, { reason: this.reopenReason }));
  }

  get canAssignToOthers(): boolean {
    return this.permissionService.getGrantedPolicy('SupportTicketSystem.Tickets.ForceReassign');
  }

  openAssign(ticket: TicketDto): void {
    if (!this.canAssignToOthers || this.actionBusy) return;
    this.actionTicket = ticket;
    this.assignAgentId = ticket.assignedAgentId ?? '';
    this.resetSlaDeadline = true;
    this.actionErrorMessage = '';
    this.actionMode = 'assign';
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
        this.actionErrorMessage = "Couldn't load the user list. Please try again.";
        this.cdr.detectChanges();
      },
    });
  }

  submitAssign(): void {
    if (!this.actionTicket || !this.canAssignToOthers) return;
    if (!this.assignAgentId.trim()) {
      this.actionErrorMessage = 'Please select a user.';
      return;
    }

    this.actionBusy = true;
    this.actionErrorMessage = '';
    this.ticketService.assign(this.actionTicket.id, {
      agentId: this.assignAgentId,
      resetSlaDeadline: this.resetSlaDeadline,
    }).subscribe({
      next: () => {
        this.actionBusy = false;
        this.closeAction();
        this.loadOverdue();
      },
      error: error => {
        this.actionBusy = false;
        this.actionErrorMessage = getTicketActionError(error, "Couldn't assign this ticket. Please try again.");
        this.cdr.detectChanges();
      },
    });
  }

  closeAction(): void {
    this.actionMode = null;
    this.actionTicket = null;
    this.actionErrorMessage = '';
    this.assignAgentId = '';
    this.resetSlaDeadline = false;
  }

  private runAction(request: ReturnType<TicketService['resolve']>): void {
    this.actionBusy = true;
    this.actionErrorMessage = '';
    request.pipe(runInZone(this.ngZone)).subscribe({
      next: updated => {
        this.actionBusy = false;
        this.closeAction();
        // Resolving/closing/reopening changes overdue membership, so refresh the list.
        this.loadOverdue();
        this.cdr.detectChanges();
      },
      error: error => {
        this.actionBusy = false;
        this.actionErrorMessage = getTicketActionError(error, "That action couldn't be completed. Please try again.");
        this.loadOverdue();
        this.cdr.detectChanges();
      },
    });
  }

  private removeTicket(ticketId: string): void {
    this.tickets = this.tickets.filter(ticket => ticket.id !== ticketId);
    this.cdr.detectChanges();
  }

  canManageTicket(ticket: TicketDto): boolean {
    const currentUserId = this.configState.getOne('currentUser')?.id ?? null;
    return (
      !!ticket.assignedAgentId &&
      !!currentUserId &&
      ticket.assignedAgentId.trim().toLowerCase() === currentUserId.trim().toLowerCase()
    );
  }
}
