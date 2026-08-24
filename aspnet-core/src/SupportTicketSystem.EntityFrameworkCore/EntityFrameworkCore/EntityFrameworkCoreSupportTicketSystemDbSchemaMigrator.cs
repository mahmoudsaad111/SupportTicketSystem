using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SupportTicketSystem.Data;
using Volo.Abp.DependencyInjection;

namespace SupportTicketSystem.EntityFrameworkCore;

public class EntityFrameworkCoreSupportTicketSystemDbSchemaMigrator
    : ISupportTicketSystemDbSchemaMigrator, ITransientDependency
{
    private readonly IServiceProvider _serviceProvider;

    public EntityFrameworkCoreSupportTicketSystemDbSchemaMigrator(
        IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task MigrateAsync()
    {
        /* We intentionally resolve the SupportTicketSystemDbContext
         * from IServiceProvider (instead of directly injecting it)
         * to properly get the connection string of the current tenant in the
         * current scope.
         */

        await _serviceProvider
            .GetRequiredService<SupportTicketSystemDbContext>()
            .Database
            .MigrateAsync();
    }
}
