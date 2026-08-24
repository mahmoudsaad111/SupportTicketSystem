using SupportTicketSystem.Domain.Shared.Tickets;
using System;
using System.Collections.Generic;
using Volo.Abp.Application.Dtos;

namespace SupportTicketSystem.Tickets;

public class TicketDto : EntityDto<Guid>
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketStatus Status { get; set; }
    public PriorityLevel Priority { get; set; }
    public Guid? AssignedAgentId { get; set; }
    public DateTime SlaDeadline { get; set; }
    public List<TicketCommentDto> Comments { get; set; } = new();
}