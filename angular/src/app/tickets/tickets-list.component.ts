import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfigStateService, PermissionService } from '@abp/ng.core';
import { finalize } from 'rxjs';
import { NgZone } from '@angular/core';
import { TicketService } from '../shared/services/ticket.service';
import { UserService } from '../shared/services/user.service';
import { IdentityUserDto } from '../shared/models/user.models';
import { runInZone } from '../shared/utils/run-in-zone';
import { getTicketActionError } from '../shared/utils/ticket-action-error';
import {
  TicketDto,
  TicketStatus,
  TicketStatusLabels,
  PriorityLevel,
  PriorityLevelLabels,
} from '../shared/models/ticket.models';

const PAGE_SIZE = 10;
// Entity property name used for server-side sorting. TicketDto exposes
// camelCase `slaDeadline`, but ABP's dynamic-LINQ sorting is case-sensitive
// and matches the backend entity's PascalCase property name.
const SORT_FIELD = 'SlaDeadline';

type ActionMode = 'create' | 'reopen' | 'assign' | null;

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tickets-list.component.html',
  styleUrls: ['./tickets-list.component.scss'],
})
export class TicketsListComponent implements OnInit {
  readonly TicketStatus = TicketStatus;
  readonly PriorityLevel = PriorityLevel;
  readonly TicketStatusLabels = TicketStatusLabels;
  readonly PriorityLevelLabels = PriorityLevelLabels;
  readonly statusOptions = Object.values(TicketStatus).filter(
    v => typeof v === 'number',
  ) as TicketStatus[];
  readonly priorityOptions = Object.values(PriorityLevel).filter(
    v => typeof v === 'number',
  ) as PriorityLevel[];

  tickets: TicketDto[] = [];
  totalCount = 0;
  loading = true;
  loadError = false;

  statusFilter: TicketStatus | 'all' = 'all';
  priorityFilter: PriorityLevel | 'all' = 'all';
  currentPage = 1;
  readonly pageSize = PAGE_SIZE;

  // Row-level action state (kept minimal since there's no dialog/modal
  // library wired up yet — this is a lightweight inline panel instead).
  actionMode: ActionMode = null;
  actionTicket: TicketDto | null = null;
  actionBusy = false;
  actionErrorMessage = '';

  reopenReason = '';
  assignAgentId = '';
  resetSlaDeadline = false;
  users: IdentityUserDto[] = [];
  usersLoading = false;

  newTicket = { title: '', description: '', priority: PriorityLevel.Medium };
  creating = false;
  createErrorMessage = '';
  currentUserId: string | null = null;

  constructor(
    private ticketService: TicketService,
    private userService: UserService,
    private configState: ConfigStateService,
    private permissionService: PermissionService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.configState.getOne('currentUser')?.id ?? null;
    this.loadTickets();
    this.loadUsers();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get visibleTickets(): TicketDto[] {
    if (this.priorityFilter === 'all') {
      return this.tickets;
    }
    return this.tickets.filter(t => t.priority === this.priorityFilter);
  }

  loadTickets(): void {
    this.loading = true;
    this.loadError = false;

    this.ticketService
      .getList({
        status: this.statusFilter === 'all' ? undefined : this.statusFilter,
        sorting: `${SORT_FIELD} asc`,
        skipCount: (this.currentPage - 1) * this.pageSize,
        maxResultCount: this.pageSize,
      })
      .pipe(
        runInZone(this.ngZone),
        finalize(() => {
          this.loading = false;
          // Belt-and-suspenders: runInZone gets this callback executing
          // inside NgZone, but that alone hasn't proven reliable enough to
          // guarantee Angular actually repaints afterward. Explicitly
          // forcing a check on this component removes that uncertainty.
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

  // Priority has no server-side filter on GetTicketListDto, so this only
  // narrows the tickets already loaded on the current page.
  onPriorityFilterChange(): void {
    // no reload needed — filtered client-side via visibleTickets
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadTickets();
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

  userDisplayName(userId: string | null | undefined): string {
    if (!userId) return 'Unassigned';
    const user = this.users.find(item => item.id.toLowerCase() === userId.toLowerCase());
    if (!user) return 'Unknown user';
    return user.name || user.surname
      ? `${user.name ?? ''} ${user.surname ?? ''}`.trim()
      : user.userName;
  }

  // ---- Create ----

  get canCreateTicket(): boolean {
    return this.permissionService.getGrantedPolicy('SupportTicketSystem.Tickets.Create');
  }

  openCreate(): void {
    if (!this.canCreateTicket) return;
    this.newTicket = { title: '', description: '', priority: PriorityLevel.Medium };
    this.createErrorMessage = '';
    this.actionMode = 'create';
  }

  submitCreate(): void {
    if (!this.canCreateTicket) return;
    if (!this.newTicket.title.trim() || !this.newTicket.description.trim()) {
      this.createErrorMessage = 'Title and description are required.';
      return;
    }
    this.creating = true;
    this.createErrorMessage = '';
    this.ticketService.create(this.newTicket).subscribe({
      next: () => {
        this.creating = false;
        this.closeAction();
        this.currentPage = 1;
        this.loadTickets();
      },
      error: () => {
        this.creating = false;
        this.createErrorMessage = "Couldn't create the ticket. Please try again.";
        this.cdr.detectChanges();
      },
    });
  }

  // ---- Row actions ----

  resolve(ticket: TicketDto): void {
    if (this.actionBusy || !this.canManageTicket(ticket)) return;
    this.updateTicket(ticket.id, { status: TicketStatus.Resolved });
    this.runAction(this.ticketService.resolve(ticket.id));
  }

  close(ticket: TicketDto): void {
    if (this.actionBusy || !this.canManageTicket(ticket)) return;
    this.updateTicket(ticket.id, { status: TicketStatus.Closed });
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
    this.runAction(
      this.ticketService.reopen(this.actionTicket.id, { reason: this.reopenReason }),
    );
  }

  openAssign(ticket: TicketDto): void {
    if (!this.canAssignTicket(ticket)) return;
    this.actionTicket = ticket;
    this.assignAgentId = ticket.assignedAgentId ?? '';
    this.resetSlaDeadline = !!ticket.assignedAgentId;
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
    if (!this.actionTicket || !this.canAssignTicket(this.actionTicket)) return;
    if (!this.assignAgentId.trim()) {
      this.actionErrorMessage = 'Please select a user.';
      return;
    }
    this.runAction(
      this.ticketService.assign(this.actionTicket.id, {
        agentId: this.assignAgentId,
        resetSlaDeadline: this.resetSlaDeadline,
      }),
    );
  }

  closeAction(): void {
    this.actionMode = null;
    this.actionTicket = null;
    this.actionErrorMessage = '';
    this.resetSlaDeadline = false;
  }

  private runAction(request: ReturnType<TicketService['resolve']>): void {
    this.actionBusy = true;
    this.actionErrorMessage = '';
    request.pipe(runInZone(this.ngZone)).subscribe({
      next: updated => {
        if (updated?.id) {
          this.tickets = this.tickets.map(ticket =>
            ticket.id === updated.id ? updated : ticket,
          );
        }
        this.actionBusy = false;
        this.closeAction();
        this.loadTickets();
        this.cdr.detectChanges();
      },
      error: error => {
        this.actionBusy = false;
        this.actionErrorMessage = getTicketActionError(error, "That action couldn't be completed. Please try again.");
        this.loadTickets();
        this.cdr.detectChanges();
      },
    });
  }

  private updateTicket(ticketId: string, changes: Partial<TicketDto>): void {
    this.tickets = this.tickets.map(ticket =>
      ticket.id === ticketId ? { ...ticket, ...changes } : ticket,
    );
    this.cdr.detectChanges();
  }

  canManageTicket(ticket: TicketDto): boolean {
    const currentUserId = this.configState.getOne('currentUser')?.id ?? null;
    return this.hasSameUserId(ticket.assignedAgentId, currentUserId);
  }

  canAssignTicket(ticket: TicketDto): boolean {
    const permission = ticket.assignedAgentId
      ? 'SupportTicketSystem.Tickets.ForceReassign'
      : 'SupportTicketSystem.Tickets.Assign';

    if (!this.permissionService.getGrantedPolicy(permission)) {
      return false;
    }

    return ticket.status !== TicketStatus.Closed && ticket.status !== TicketStatus.Resolved;
  }

  private hasSameUserId(assignedAgentId: string | null | undefined, userId: string | null): boolean {
    return !!assignedAgentId && !!userId && assignedAgentId.trim().toLowerCase() === userId.trim().toLowerCase();
  }
}
