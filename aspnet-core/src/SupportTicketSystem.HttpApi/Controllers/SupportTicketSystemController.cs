using SupportTicketSystem.Localization;
using Volo.Abp.AspNetCore.Mvc;

namespace SupportTicketSystem.Controllers;

/* Inherit your controllers from this class.
 */
public abstract class SupportTicketSystemController : AbpControllerBase
{
    protected SupportTicketSystemController()
    {
        LocalizationResource = typeof(SupportTicketSystemResource);
    }
}
