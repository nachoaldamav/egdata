import { useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { UpdateIcon } from '@radix-ui/react-icons';

export interface Change {
  timestamp: string;
  metadata: Metadata;
  __v: number;
  _id: string;
}

export interface Metadata {
  changes: Change[];
  contextId: string;
  contextType: string;
  context: Context | undefined;
}

export interface Change {
  changeType: string;
  field: string;
  newValue: unknown;
  oldValue: unknown;
}

export interface Context {
  _id: string;
  id: string;
  title: string;
  keyImages: KeyImage[];
  offerType?: string;
}

export interface KeyImage {
  type: string;
  url: string;
  md5: string;
}

const getType = (changes: Change[]) => {
  if (changes.length === 1) {
    return changes[0].changeType === 'insert' ? 'new' : 'update';
  }

  return 'update';
};

const icons = {
  update: (
    <span className="text-yellow-500">
      <UpdateIcon />
    </span>
  ),
  new: <span className="text-green-500">🆕</span>,
};

export function ChangelistModule() {
  const {
    isPending,
    error,
    data: changes,
  } = useQuery({
    queryKey: ['changelist', 'home'],
    queryFn: async () => {
      return (await client.get<Change[]>('/changelist?limit=20')).data;
    },
  });

  if (isPending) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  return (
    <section id="changelist" className="w-full lg:w-3/4 h-full pb-10">
      <h2 className="text-2xl font-bold">Changelist</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead>ID</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Title/ID</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changes.map((change) => (
            <TableRow key={change._id}>
              <TableCell>
                <span role="img" aria-label={getType(change.metadata.changes)}>
                  {icons[getType(change.metadata.changes)]}
                </span>
              </TableCell>
              <TableCell>{change.metadata.contextId.slice(0, 10)}</TableCell>
              <TableCell>{change.metadata.contextType}</TableCell>
              <TableCell>{change.metadata.context?.title || change.metadata.contextId}</TableCell>
              <TableCell className="text-right">
                {new Date(change.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
