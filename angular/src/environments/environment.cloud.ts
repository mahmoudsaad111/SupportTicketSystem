import { Environment } from '@abp/ng.core';

const baseUrl = 'https://supportticketsystem.runasp.net';

export const environment = {
  production: true,
  application: {
    baseUrl,
    name: 'SupportTicketSystem',
    logoUrl: '/assets/images/logo/support-ticket-logo.svg',
  },
  oAuthConfig: {
    issuer: 'https://supportticketsystem.runasp.net/',
    redirectUri: baseUrl,
    clientId: 'SupportTicketSystem_App',
    responseType: 'code',
    scope: 'offline_access SupportTicketSystem',
    requireHttps: true,
  },
  apis: {
    default: {
      url: 'https://supportticketsystem.runasp.net',
      rootNamespace: 'SupportTicketSystem',
    },
  },
} as Environment;
