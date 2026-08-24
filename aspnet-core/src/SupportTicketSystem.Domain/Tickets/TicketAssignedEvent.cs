using System;

namespace SupportTicketSystem.Domain.Tickets;

public class TicketAssignedEvent
{
    public Guid TicketId { get; }
    public Guid AgentId { get; }

    public TicketAssignedEvent(Guid ticketId, Guid agentId)
    {
        TicketId = ticketId;
        AgentId = agentId;
    }
}