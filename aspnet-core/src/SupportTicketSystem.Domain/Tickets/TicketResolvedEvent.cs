using System;

namespace SupportTicketSystem.Domain.Tickets;

public class TicketResolvedEvent
{
    public Guid TicketId { get; }
    public Guid ResolvedByAgentId { get; }

    public TicketResolvedEvent(Guid ticketId, Guid resolvedByAgentId)
    {
        TicketId = ticketId;
        ResolvedByAgentId = resolvedByAgentId;
    }
}