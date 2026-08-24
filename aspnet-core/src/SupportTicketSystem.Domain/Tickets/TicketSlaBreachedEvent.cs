using System;
using Volo.Abp.EventBus;

namespace SupportTicketSystem.Domain.Tickets;

[EventName("SupportTicketSystem.Tickets.SlaBreached")]
public class TicketSlaBreachedEvent
{
    public Guid TicketId { get; }
    public DateTime SlaDeadline { get; }

    public TicketSlaBreachedEvent(Guid ticketId, DateTime slaDeadline)
    {
        TicketId = ticketId;
        SlaDeadline = slaDeadline;
    }
}