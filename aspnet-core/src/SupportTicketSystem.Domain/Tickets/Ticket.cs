using SupportTicketSystem.Domain.Shared.Tickets;
using System;
using System.Collections.Generic;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.MultiTenancy;

namespace SupportTicketSystem.Domain.Tickets;

public class Ticket : FullAuditedAggregateRoot<Guid>, IMultiTenant
{
    public Guid? TenantId { get; private set; }

    public string Title { get; private set; }
    public string Description { get; private set; }
    public TicketStatus Status { get; private set; }
    public Guid? AssignedAgentId { get; private set; }
    public TicketPriority Priority { get; private set; }
    public DateTime SlaDeadline { get; private set; }

    public DateTime? SlaBreachedAt { get; private set; }

    private readonly List<TicketComment> _comments = new();
    public IReadOnlyCollection<TicketComment> Comments => _comments;

    private readonly List<TicketStatusChange> _statusHistory = new();
    public IReadOnlyCollection<TicketStatusChange> StatusHistory => _statusHistory;

    protected Ticket()
    {
    }

    internal Ticket(
        Guid id,
        Guid? tenantId,
        string title,
        string description,
        TicketPriority priority)
        : base(id)
    {
        TenantId = tenantId;
        Title = title;
        Description = description;
        Priority = priority;
        SlaDeadline = priority.CalculateDeadline(DateTime.UtcNow);
        Status = TicketStatus.Open;
    }
     public static Ticket Create(
     Guid id,
     Guid? tenantId,
     string title,
     string description,
     TicketPriority priority)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Title is required.", nameof(title));
        }

        if (title.Length > 150)
        {
            throw new ArgumentException("Title cannot exceed 150 characters.", nameof(title));
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("Description is required.", nameof(description));
        }

        return new Ticket(id, tenantId, title, description, priority);
    }
    public void Resolve(Guid agentId)
    {
        if (AssignedAgentId is null)
        {
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketCannotResolveUnassignedTicket);
        }

        if (AssignedAgentId != agentId)
        {
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketOnlyAssignedAgentCanResolve);
        }

        if (Status == TicketStatus.Resolved || Status == TicketStatus.Closed)
        {
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketAlreadyResolvedOrClosed);
        }

        ChangeStatus(TicketStatus.Resolved, agentId);

        AddLocalEvent(new TicketResolvedEvent(Id, agentId));
    }
    public void AddComment(Guid authorId, string text)
    {
        if (Status == TicketStatus.Closed)
        {
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketCannotCommentOnClosedTicket);
        }

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new ArgumentException("Comment text cannot be empty.", nameof(text));
        }

        var comment = new TicketComment(Guid.NewGuid(), Id, authorId, text);
        _comments.Add(comment);

        AddLocalEvent(new TicketCommentAddedEvent(Id, comment.Id, authorId));
    }
    public void AssignTo(Guid assignedByUserId, Guid agentId)
    {
        if (Status == TicketStatus.Closed)
        {
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketCannotAssignClosedTicket);
        }

        if (Status == TicketStatus.Resolved)
        {
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketCannotAssignResolvedTicket);
        }

        var isClaimingUnassignedTicket = AssignedAgentId == null;

        if (!isClaimingUnassignedTicket)
        {
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketOnlyAssignedAgentCanReassign);
        }

        AssignedAgentId = agentId;

        if (Status == TicketStatus.Open)
        {
            ChangeStatus(TicketStatus.InProgress, agentId);
        }

        AddLocalEvent(new TicketAssignedEvent(Id, agentId));
    }
    public void ForceReassignTo(Guid agentId, bool resetSla = false)
    {
        if (Status == TicketStatus.Closed)
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketCannotAssignClosedTicket);

        if (Status == TicketStatus.Resolved)
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketCannotAssignResolvedTicket);

        AssignedAgentId = agentId;

        if (Status == TicketStatus.Open)
            ChangeStatus(TicketStatus.InProgress, agentId);

        if (resetSla)
            ResetSla();

        AddLocalEvent(new TicketAssignedEvent(Id, agentId));
    }

  

    public void Reopen(Guid reopenedByUserId, string reason)
    {
        if (AssignedAgentId != reopenedByUserId)
        {
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketOnlyAssignedAgentCanReopen);
        }

        if (Status != TicketStatus.Resolved && Status != TicketStatus.Closed)
        {
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketOnlyResolvedOrClosedCanReopen);
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("A reason is required to reopen a ticket.", nameof(reason));
        }

        ChangeStatus(TicketStatus.Reopened, reopenedByUserId);
        AddLocalEvent(new TicketReopenedEvent(Id, reopenedByUserId, reason));
    }

    public void Close(Guid closedByUserId)
    {
        if (AssignedAgentId != closedByUserId)
        {
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketOnlyAssignedAgentCanClose);
        }

        if (Status != TicketStatus.Resolved)
        {
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketOnlyResolvedCanBeClosed);
        }

        ChangeStatus(TicketStatus.Closed, closedByUserId);
        AddLocalEvent(new TicketClosedEvent(Id, closedByUserId));
    }

    public void ChangePriority(Guid changedByUserId, TicketPriority newPriority)
    {
        if (AssignedAgentId != changedByUserId)
        {
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketOnlyAssignedAgentCanChangePriority);
        }

        if (Status == TicketStatus.Closed)
        {
            throw new BusinessException(SupportTicketSystemDomainErrorCodes.TicketCannotChangePriorityOnClosedTicket);
        }

        Priority = newPriority;
        SlaDeadline = newPriority.CalculateDeadline(CreationTime);
    }

    public void MarkSlaBreached()
    {
        if (SlaBreachedAt.HasValue)
            return;

        SlaBreachedAt = DateTime.UtcNow;

        AddLocalEvent(
            new TicketSlaBreachedEvent(
                Id,
                SlaDeadline));
    }

    private void ChangeStatus(TicketStatus newStatus, Guid changedByUserId)
    {
        var change = new TicketStatusChange(Guid.NewGuid(), Id, Status, newStatus, changedByUserId);
        _statusHistory.Add(change);
        Status = newStatus;
    }
    public void ResetSla()
    {
        SlaDeadline = Priority.CalculateDeadline(DateTime.UtcNow);
        SlaBreachedAt = null;
    }
}