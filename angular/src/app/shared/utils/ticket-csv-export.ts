import { TicketDto, TicketStatusLabels, PriorityLevelLabels } from '../models/ticket.models';
import { buildCsv, downloadCsv } from './csv-export';

const CSV_HEADERS = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Assigned Agent', 'SLA Deadline'];

/**
 * Formats an ISO date string for a CSV cell. Falls back to the raw value if
 * it isn't a parseable date, so a malformed value never throws.
 */
function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

/**
 * Builds CSV rows for a list of tickets, resolving each assignedAgentId to a
 * display name via the provided map (falling back to "Unassigned" / the raw
 * id) and triggers a browser download.
 */
export function exportTicketsToCsv(
  filename: string,
  tickets: TicketDto[],
  agentNames: Map<string, string>,
): void {
  const rows = tickets.map(ticket => [
    ticket.id,
    ticket.title,
    ticket.description,
    TicketStatusLabels[ticket.status],
    PriorityLevelLabels[ticket.priority],
    ticket.assignedAgentId ? (agentNames.get(ticket.assignedAgentId) ?? ticket.assignedAgentId) : 'Unassigned',
    formatDate(ticket.slaDeadline),
  ]);

  downloadCsv(filename, buildCsv(CSV_HEADERS, rows));
}
