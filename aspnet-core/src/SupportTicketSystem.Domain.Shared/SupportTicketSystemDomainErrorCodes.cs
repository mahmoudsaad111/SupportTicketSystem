namespace SupportTicketSystem;

public static class SupportTicketSystemDomainErrorCodes
{
    public const string TicketCannotAssignClosedTicket = "SupportTicketSystem:00001";
    public const string TicketCannotResolveUnassignedTicket = "SupportTicketSystem:00002";
    public const string TicketOnlyAssignedAgentCanResolve = "SupportTicketSystem:00003";
    public const string TicketAlreadyResolvedOrClosed = "SupportTicketSystem:00004";
    public const string TicketCannotCommentOnClosedTicket = "SupportTicketSystem:00005";
    public const string TicketOnlyResolvedOrClosedCanReopen = "SupportTicketSystem:00006";
    public const string TicketOnlyResolvedCanBeClosed = "SupportTicketSystem:00007";
    public const string TicketCannotChangePriorityOnClosedTicket = "SupportTicketSystem:00008";
    public const string InvalidPriorityLevel = "SupportTicketSystem:00009";
    public const string TicketOnlyAssignedAgentCanReopen = "SupportTicketSystem:00011";
    public const string TicketOnlyAssignedAgentCanClose = "SupportTicketSystem:00012";
    public const string TicketOnlyAssignedAgentCanChangePriority = "SupportTicketSystem:00013";
    public const string TicketOnlyAssignedAgentCanReassign = "SupportTicketSystem:00014";

    public const string TicketCannotAssignResolvedTicket = "SupportTicketSystem:00015";
}

