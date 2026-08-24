using Volo.Abp.Modularity;

namespace SupportTicketSystem;

public abstract class SupportTicketSystemApplicationTestBase<TStartupModule> : SupportTicketSystemTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
