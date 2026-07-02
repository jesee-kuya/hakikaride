import { type ReactNode } from 'react';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  text?: string;
};

export default function EmptyState({ icon, title, text }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon}
      <div className="empty-state-title">{title}</div>
      {text && <div className="empty-state-text">{text}</div>}
    </div>
  );
}
