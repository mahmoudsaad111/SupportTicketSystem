using Microsoft.Extensions.Localization;
using SupportTicketSystem.Localization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Ui.Branding;

namespace SupportTicketSystem;

[Dependency(ReplaceServices = true)]
public class SupportTicketSystemBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<SupportTicketSystemResource> _localizer;

    public SupportTicketSystemBrandingProvider(IStringLocalizer<SupportTicketSystemResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];
}
