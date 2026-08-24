using Volo.Abp.Modularity;

namespace SupportTicketSystem;

[DependsOn(
    typeof(SupportTicketSystemDomainModule),
    typeof(SupportTicketSystemTestBaseModule)
)]
public class SupportTicketSystemDomainTestModule : AbpModule
{

}
