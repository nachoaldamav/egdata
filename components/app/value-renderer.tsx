import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { calculateSize } from '@/lib/calculate-size';
import { type JsonValue, JsonVisualizer } from './json-tree';
import { Link } from '@tanstack/react-router';

export function ValueToString(
  value: unknown,
  query: string,
  field?: string,
  type?: 'before' | 'after',
) {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-500 text-gray-900">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  if (field === 'keyImages' && value !== null) {
    const typedValue = value as { url: string; type: string; md5: string };
    return (
      <Tooltip>
        <TooltipTrigger className="relative group">
          <span className="underline decoration-dotted underline-offset-4">
            {typedValue.type} ({typedValue.md5.slice(0, 8)})
          </span>
        </TooltipTrigger>
        <TooltipContent
          className="flex flex-col items-start justify-center bg-card rounded-lg p-4"
          side={type === 'before' ? 'left' : 'right'}
        >
          <img
            src={typedValue.url}
            alt={typedValue.type}
            className="w-60 h-auto border border-gray-300"
          />
          <span className="w-full text-center text-foreground">
            {typedValue.type}
          </span>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (field?.includes('Date') && typeof value === 'string') {
    const formattedDate = new Date(value).toLocaleString('en-UK', {
      weekday: undefined,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    return <span className="font-semibold text-gray-300">{formattedDate}</span>;
  }

  if (field === 'tags' && value !== null) {
    const typedValue = value as { id: string; name: string };
    return (
      <Link
        to="/search"
        search={{
          tags: typedValue.id,
        }}
      >
        <Badge variant="secondary" className="bg-gray-700 text-gray-200">
          {typedValue.name}
        </Badge>
      </Link>
    );
  }

  if (field?.includes('Bytes')) {
    return (
      <span className="font-mono font-semibold text-gray-300">
        {calculateSize(value as number)}
      </span>
    );
  }

  if (typeof value === 'number') {
    return (
      <span className="font-mono text-gray-300">{value.toLocaleString()}</span>
    );
  }

  if (typeof value === 'string') {
    return (
      <span className="break-all text-gray-300">
        {highlightText(value, query)}
      </span>
    );
  }

  if (typeof value === 'object') {
    return <JsonVisualizer data={value as JsonValue} />;
  }

  return value?.toString() || 'N/A';
}
