using SupportTicketSystem.Domain.Shared.Tickets;
using System;
using Volo.Abp.Application.Dtos;

namespace SupportTicketSystem.Tickets;

public class GetTicketListDto : PagedAndSortedResultRequestDto
{
    public TicketStatus? Status { get; set; }
    public Guid? AssignedAgentId { get; set; }
}