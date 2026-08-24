using System;
using System.Collections.Generic;
using System.Text;
using SupportTicketSystem.Localization;
using Volo.Abp.Application.Services;

namespace SupportTicketSystem;

/* Inherit your application services from this class.
 */
public abstract class SupportTicketSystemAppService : ApplicationService
{
    protected SupportTicketSystemAppService()
    {
        LocalizationResource = typeof(SupportTicketSystemResource);
    }
}
