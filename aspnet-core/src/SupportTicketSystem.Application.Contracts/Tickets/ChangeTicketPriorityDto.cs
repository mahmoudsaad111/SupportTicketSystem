using SupportTicketSystem.Domain.Shared.Tickets;

namespace SupportTicketSystem.Tickets;

public class ChangeTicketPriorityDto
{
    public PriorityLevel Priority { get; set; }
}