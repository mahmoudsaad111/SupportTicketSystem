import { Environment } from '@abp/ng.core';

const baseUrl = 'http://supportticketsystem.runasp.net';

export const environment = {
  production: true,
  application: {
    baseUrl,
    name: 'SupportTicketSystem',
    logoUrl: '/assets/images/logo/support-ticket-logo.svg',
  },
  oAuthConfig: {
    issuer: 'http://supportticketsystem.runasp.net/',
    redirectUri: baseUrl,
    clientId: 'SupportTicketSystem_App',
    responseType: 'code',
    scope: 'offline_access SupportTicketSystem',
    // The site is plain HTTP (no SSL configured on this host yet) --
    // requireHttps: true would make the OAuth library reject the issuer
    // outright and break login entirely. Set this back to true once you
    // add HTTPS/a custom domain with SSL on MonsterASP.
    requireHttps: false
  },
  apis: {
    default: {
      url: 'http://supportticketsystem.runasp.net',
      rootNamespace: 'SupportTicketSystem',
    },
  },
} as Environment;
