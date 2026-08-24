namespace SupportTicketSystem.Permissions;

public static class SupportTicketSystemPermissions
{
    public const string GroupName = "SupportTicketSystem";

    public static class Tickets
    {
        public const string Default = GroupName + ".Tickets";
        public const string Create = Default + ".Create";
        public const string Assign = Default + ".Assign";
        public const string Resolve = Default + ".Resolve";
        public const string Reopen = Default + ".Reopen";
        public const string Close = Default + ".Close";
        public const string ChangePriority = Default + ".ChangePriority";
        public const string ViewAll = Default + ".ViewAll";
        public const string ForceReassign = Default + ".ForceReassign";
    }
}