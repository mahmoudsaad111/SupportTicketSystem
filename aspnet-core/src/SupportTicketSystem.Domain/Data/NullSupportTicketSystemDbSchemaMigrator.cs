using System.Threading.Tasks;
using Volo.Abp.DependencyInjection;

namespace SupportTicketSystem.Data;

/* This is used if database provider does't define
 * ISupportTicketSystemDbSchemaMigrator implementation.
 */
public class NullSupportTicketSystemDbSchemaMigrator : ISupportTicketSystemDbSchemaMigrator, ITransientDependency
{
    public Task MigrateAsync()
    {
        return Task.CompletedTask;
    }
}
