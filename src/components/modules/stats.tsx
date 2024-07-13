import { useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';
import { Card, CardContent, CardHeader } from '~/components/ui/card';

export interface Stats {
  offers: number;
  items: number;
  tags: number;
  assets: number;
  priceEngine: number;
  changelog: number;
  sandboxes: number;
  products: number;
  offersYear: number;
  itemsYear: number;
}

export function StatsModule() {
  const { data } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await client.get('/stats');
      return data;
    },
  });

  return (
    <Card className="w-1/2 h-full my-auto">
      <CardHeader className="flex flex-col">
        <h2 className="text-xl font-semibold">Stats</h2>
        <p className="text-sm text-gray-500">Statistics about the platform</p>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4 h-[300px]">
        <Count value={data?.offers ?? 0} label="Offers" />
        <Count value={data?.items ?? 0} label="Items" />
        <Count value={data?.tags ?? 0} label="Tags" />
        <Count value={data?.offersYear ?? 0} label="Offers (Year)" />
        <Count value={data?.itemsYear ?? 0} label="Items (Year)" />
        <Count value={data?.assets ?? 0} label="Assets" />
        <Count value={data?.priceEngine ?? 0} label="Reg. Prices" />
        <Count value={data?.changelog ?? 0} label="Changes" />
        <Count value={data?.sandboxes ?? 0} label="Sandboxes" />
      </CardContent>
    </Card>
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}
