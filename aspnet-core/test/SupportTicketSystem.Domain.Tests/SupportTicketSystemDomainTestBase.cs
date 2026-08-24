using Volo.Abp.Modularity;

namespace SupportTicketSystem;

/* Inherit from this class for your domain layer tests. */
public abstract class SupportTicketSystemDomainTestBase<TStartupModule> : SupportTicketSystemTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
