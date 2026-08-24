using System;

namespace SupportTicketSystem.Domain.Tickets;    
public class TicketClosedEvent
{
    public Guid TicketId { get; }
    public Guid ClosedByUserId { get; }

    public TicketClosedEvent(Guid ticketId, Guid closedByUserId)
    {
        TicketId = ticketId;
        ClosedByUserId = closedByUserId;
    }
}