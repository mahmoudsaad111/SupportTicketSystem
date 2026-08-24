using Volo.Abp.Modularity;

namespace SupportTicketSystem;

[DependsOn(
    typeof(SupportTicketSystemApplicationModule),
    typeof(SupportTicketSystemDomainTestModule)
)]
public class SupportTicketSystemApplicationTestModule : AbpModule
{

}
