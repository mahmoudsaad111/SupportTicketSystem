using System;

namespace SupportTicketSystem.Tickets;

public class AssignTicketDto
{
    public Guid AgentId { get; set; }
    public bool ResetSlaDeadline { get; set; }

}