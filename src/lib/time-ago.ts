export function timeAgo(date: Date): string {
  const now = new Date();
  const isPastDate = date < now;
  const diff = Math.abs(date.getTime() - now.getTime());
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (seconds < 60) {
    return rtf.format(isPastDate ? -seconds : seconds, 'second');
  }

  if (minutes < 60) {
    return rtf.format(isPastDate ? -minutes : minutes, 'minute');
  }

  if (hours < 24) {
    return rtf.format(isPastDate ? -hours : hours, 'hour');
  }

  if (days < 30) {
    return rtf.format(isPastDate ? -days : days, 'day');
  }

  if (months < 12) {
    return rtf.format(isPastDate ? -months : months, 'month');
  }

  return rtf.format(isPastDate ? -years : years, 'year');
}
