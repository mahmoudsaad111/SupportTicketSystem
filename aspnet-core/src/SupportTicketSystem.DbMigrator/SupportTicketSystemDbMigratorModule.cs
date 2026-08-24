using SupportTicketSystem.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace SupportTicketSystem.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(SupportTicketSystemEntityFrameworkCoreModule),
    typeof(SupportTicketSystemApplicationContractsModule)
    )]
public class SupportTicketSystemDbMigratorModule : AbpModule
{
}
