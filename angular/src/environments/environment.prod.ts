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
    requireHttps: false,
  },
  apis: {
    default: {
      url: 'http://supportticketsystem.runasp.net',
      rootNamespace: 'SupportTicketSystem',
    },
  },
} as Environment;
