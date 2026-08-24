import { Environment } from '@abp/ng.core';

const baseUrl = 'http://localhost:4200';

export const environment = {
  production: true,
  application: {
    baseUrl,
    name: 'SupportTicketSystem',
    logoUrl: '/assets/images/logo/support-ticket-logo.svg',
  },
  oAuthConfig: {
    issuer: 'https://localhost:44376/',
    redirectUri: baseUrl,
    clientId: 'SupportTicketSystem_App',
    responseType: 'code',
    scope: 'offline_access SupportTicketSystem',
    requireHttps: true
  },
  apis: {
    default: {
      url: 'https://localhost:44376',
      rootNamespace: 'SupportTicketSystem',
    },
  },
} as Environment;
