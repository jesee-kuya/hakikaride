type StatusBadgeProps = {
  status: string;
};

const STATUS_STYLES: Record<string, string> = {
  in_progress: 'badge-success',
  pending: 'badge-warning',
  completed: 'badge-info',
  cancelled: 'badge-neutral',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const className = STATUS_STYLES[status] ?? 'badge-neutral';
  return (
    <span className={`badge ${className}`}>
      <span className="badge-dot" />
      {status.replace(/_/g, ' ')}
    </span>
  );
}
