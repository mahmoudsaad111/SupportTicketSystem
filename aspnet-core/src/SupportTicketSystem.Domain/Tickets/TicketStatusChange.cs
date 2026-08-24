using SupportTicketSystem.Domain.Shared.Tickets;
using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace SupportTicketSystem.Domain.Tickets;

public class TicketStatusChange : CreationAuditedEntity<Guid>
{
    public Guid TicketId { get; private set; }
    public TicketStatus FromStatus { get; private set; }
    public TicketStatus ToStatus { get; private set; }
    public Guid ChangedByUserId { get; private set; }

    protected TicketStatusChange()
    {
    }

    internal TicketStatusChange(
        Guid id,
        Guid ticketId,
        TicketStatus fromStatus,
        TicketStatus toStatus,
        Guid changedByUserId)
        : base(id)
    {
        TicketId = ticketId;
        FromStatus = fromStatus;
        ToStatus = toStatus;
        ChangedByUserId = changedByUserId;
    }
}