using System;

namespace SupportTicketSystem.Domain.Tickets;

public class TicketReopenedEvent
{
    public Guid TicketId { get; }
    public Guid ReopenedByUserId { get; }
    public string Reason { get; }

    public TicketReopenedEvent(Guid ticketId, Guid reopenedByUserId, string reason)
    {
        TicketId = ticketId;
        ReopenedByUserId = reopenedByUserId;
        Reason = reason;
    }
}