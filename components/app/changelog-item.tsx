import type { Change } from '@/types/changelog';
import { GitCommit, GitBranch, GitMerge } from 'lucide-react';
import { ValueToString } from './value-renderer';

interface ChangeItemProps {
  change: Change;
  query: string;
}

export function ChangeItem({ change, query }: ChangeItemProps) {
  const getChangeTypeIcon = () => {
    switch (change.changeType) {
      case 'update':
        return <GitCommit className="w-4 h-4 text-blue-400" />;
      case 'insert':
        return <GitBranch className="w-4 h-4 text-green-400" />;
      case 'delete':
        return <GitMerge className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="pl-4 py-2 border-l-2 border-gray-700 transition-all duration-200 ease-in-out hover:border-blue-500">
      <div className="flex items-center gap-2 mb-1">
        {getChangeTypeIcon()}
        <span className="font-mono text-sm font-medium text-gray-300">
          {change.field}
        </span>
      </div>
      <div className="space-y-1 font-mono text-sm">
        {change.oldValue !== null && (
          <div className="flex items-start gap-2">
            <span className="text-red-400 font-bold">-</span>
            <span className="text-red-400 flex-grow">
              {ValueToString(change.oldValue, query, change.field, 'before')}
            </span>
          </div>
        )}
        {change.newValue !== null && (
          <div className="flex items-start gap-2">
            <span className="text-green-400 font-bold">+</span>
            <span className="text-green-400 flex-grow">
              {ValueToString(change.newValue, query, change.field, 'after')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
