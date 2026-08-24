using SupportTicketSystem.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;

namespace SupportTicketSystem.Permissions;

public class SupportTicketSystemPermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var ticketsGroup = context.AddGroup(SupportTicketSystemPermissions.GroupName, L("Permission:Tickets"));

        var ticketsPermission = ticketsGroup.AddPermission(
            SupportTicketSystemPermissions.Tickets.Default, L("Permission:Tickets"));

        ticketsPermission.AddChild(SupportTicketSystemPermissions.Tickets.Create, L("Permission:Tickets.Create"));
        ticketsPermission.AddChild(SupportTicketSystemPermissions.Tickets.Assign, L("Permission:Tickets.Assign"));
        ticketsPermission.AddChild(SupportTicketSystemPermissions.Tickets.Resolve, L("Permission:Tickets.Resolve"));
        ticketsPermission.AddChild(SupportTicketSystemPermissions.Tickets.Reopen, L("Permission:Tickets.Reopen"));
        ticketsPermission.AddChild(SupportTicketSystemPermissions.Tickets.Close, L("Permission:Tickets.Close"));
        ticketsPermission.AddChild(SupportTicketSystemPermissions.Tickets.ChangePriority, L("Permission:Tickets.ChangePriority"));
        ticketsPermission.AddChild(SupportTicketSystemPermissions.Tickets.ViewAll, L("Permission:Tickets.ViewAll"));
        ticketsPermission.AddChild(SupportTicketSystemPermissions.Tickets.ForceReassign, L("Permission:Tickets.ForceReassign"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<SupportTicketSystemResource>(name);
    }
}