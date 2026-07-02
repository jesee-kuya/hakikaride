type StatusPillProps = {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
};

export default function StatusPill({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }: StatusPillProps) {
  return (
    <span className={`badge ${active ? 'badge-success' : 'badge-neutral'}`}>
      <span className="badge-dot" />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
