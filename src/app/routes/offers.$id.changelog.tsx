import type { LoaderFunctionArgs } from '@remix-run/node';
import { type ClientLoaderFunctionArgs, Link, useLoaderData } from '@remix-run/react';
import type { Change } from '~/components/modules/changelist';
import { Skeleton } from '~/components/ui/skeleton';
import { client } from '~/lib/client';
import { GitPullRequestClosedIcon, GitPullRequestIcon, PlusIcon } from '@primer/octicons-react';
import { ArrowRightIcon } from '@radix-ui/react-icons';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const data = await client.get<Change[]>(`/offers/${params.id}/changelog`).then((res) => res.data);
  return {
    data,
  };
};

export const clientLoader = async ({ params }: ClientLoaderFunctionArgs) => {
  const data = await client.get<Change[]>(`/offers/${params.id}/changelog`).then((res) => res.data);

  return {
    data,
  };
};

export function HydrateFallback() {
  return (
    <div className="flex flex-col gap-4 mt-6">
      <h2 className="text-2xl font-bold">Related Offers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: This is a fallback component
          <Skeleton key={index} className="w-full h-72" />
        ))}
      </div>
    </div>
  );
}

const icons: {
  [key in Change['changeType']]: JSX.Element;
} = {
  update: <GitPullRequestIcon size={16} className="text-blue-600" />,
  insert: <PlusIcon size={16} className="text-green-500" />,
  delete: <GitPullRequestClosedIcon size={16} className="text-red-500" />,
};

export default function OfferChangelog() {
  const { data } = useLoaderData<typeof loader | typeof clientLoader>();
  return (
    <section className="flex flex-col gap-4 mt-6">
      <div className="inline-flex justify-between items-center">
        <h2 className="text-2xl font-bold">Changelog</h2>
      </div>
      <div className="flex flex-col w-full gap-4">
        {data
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .map((changelist) => (
            <article
              key={changelist._id}
              className="flex flex-col border border-gray-400 w-full rounded-xl"
            >
              <header className="p-2 bg-slate-900 rounded-t-xl inline-flex">
                <h6 className="text-gray-300 font-semibold underline decoration-dotted underline-offset-4">
                  {changelist._id.slice(0, 10)}
                </h6>
                <span className="text-gray-300 ml-auto font-semibold">
                  {new Date(changelist.timestamp).toLocaleDateString('en-UK', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </span>
              </header>
              <div className="px-4 py-4 rounded-b-xl">
                <ul className="list-inside">
                  {changelist.metadata.changes.map((change, i) => (
                    <li
                      key={`${changelist}-${
                        // biome-ignore lint/suspicious/noArrayIndexKey: The index is the ID for each change in the list
                        i
                      }`}
                      className="flex flex-row gap-2 items-center justify-start my-1"
                    >
                      <span className="inline-flex items-center justify-center w-6 h-6 border rounded-md my-1">
                        {icons[change.changeType]}
                      </span>
                      <i className="text-gray-300 font-mono">{change.field}:</i>
                      <span className="text-red-500 line-through font-mono">
                        {valueToText(change.oldValue, change.field) || 'N/A'}
                      </span>
                      <ArrowRightIcon className="text-gray-500" />
                      <span className="text-green-400 font-mono">
                        {valueToText(change.newValue, change.field)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}

function valueToText(value: unknown, field: string) {
  if (value === null) return 'N/A';
  if (typeof value === 'object') {
    if (field === 'keyImages') {
      const typedValue = value as { url: string; type: string; md5: string };
      return typedValue.type;
    }
    if (field === 'tags') {
      const typedValue = value as { id: string; name: string };
      return typedValue.name;
    }
    if (field === 'customAttributes') {
      const typedValue = value as { key: string; value: string };
      return typedValue.key;
    }
  }
  if (field.includes('Date'))
    return new Date(value as string).toLocaleDateString('en-UK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  return value?.toString() as string;
}
