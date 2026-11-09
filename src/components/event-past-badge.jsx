export function EventPastBadge({ dateTime }) {
  if (!(Date.parse(dateTime) <= Date.now())) return null;
  return <span className="status-badge">Evento passado</span>;
}
