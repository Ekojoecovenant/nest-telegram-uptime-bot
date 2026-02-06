import { WebsiteStatus } from 'src/domain/website.entity';

export function getStatusEmoji(status: WebsiteStatus): string {
  switch (status) {
    case WebsiteStatus.UP:
      return '🟢';
    case WebsiteStatus.DOWN:
      return '🔴';
    case WebsiteStatus.PENDING:
      return '⌛';
    default:
      return '⚪';
  }
}

export function timeAgo(date: Date | null): string {
  if (!date) return 'Never';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}
