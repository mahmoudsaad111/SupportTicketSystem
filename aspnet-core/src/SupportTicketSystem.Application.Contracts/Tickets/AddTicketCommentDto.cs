using System.ComponentModel.DataAnnotations;

namespace SupportTicketSystem.Tickets;

public class AddTicketCommentDto
{
    [Required]
    public string Text { get; set; } = string.Empty;
}