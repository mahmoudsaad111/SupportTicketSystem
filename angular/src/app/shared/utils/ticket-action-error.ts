const messages: Record<string, string> = {
  'SupportTicketSystem:00002': 'An unassigned ticket cannot be resolved.',
  'SupportTicketSystem:00003': 'Only the assigned agent can resolve this ticket.',
  'SupportTicketSystem:00004': 'This ticket is already resolved or closed.',
  'SupportTicketSystem:00005': 'Comments cannot be added to a closed ticket.',
  'SupportTicketSystem:00006': 'Only resolved or closed tickets can be reopened.',
  'SupportTicketSystem:00007': 'Only resolved tickets can be closed.',
  'SupportTicketSystem:00008': 'A closed ticket priority cannot be changed.',
  'SupportTicketSystem:00011': 'Only the assigned agent can reopen this ticket.',
  'SupportTicketSystem:00012': 'Only the assigned agent can close this ticket.',
  'SupportTicketSystem:00013': 'Only the assigned agent can change this priority.',
  'SupportTicketSystem:00014': 'Only the assigned agent can reassign this ticket.',
};

export function getTicketActionError(error: unknown, fallback: string): string {
  const code = (error as { error?: { code?: string } })?.error?.code;
  return (code && messages[code]) || fallback;
}
