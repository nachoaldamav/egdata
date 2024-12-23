import { ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import type { OfferPosition } from '@/types/collections';
import { cn } from '@/lib/utils';

interface PerformanceCardProps {
  position: number;
  change: number;
  date: string;
}

function PerformanceCard({ position, change, date }: PerformanceCardProps) {
  const getChangeIcon = () => {
    if (change < 0) return <ChevronUp className="w-4 h-4" />;
    if (change > 0) return <ChevronDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getChangeText = () => {
    if (change === 0) return '';
    return Math.abs(change);
  };

  const getBackgroundClass = () => {
    if (change < 0) return 'bg-gradient-to-b from-green-700/50 to-card';
    if (change > 0) return 'bg-gradient-to-b from-red-800/50 to-card';
    return 'bg-card';
  };

  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center p-6 text-white min-w-[150px]',
        getBackgroundClass(),
      )}
    >
      <div className="text-2xl font-bold mb-2">Top {position}</div>
      <div className="flex items-center gap-1">
        {getChangeIcon()}
        <span>{getChangeText()}</span>
      </div>
      <div className="text-sm mt-4">
        {new Date(date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </div>
    </Card>
  );
}

interface StatsBarProps {
  data: OfferPosition | undefined;
  onChange?: (value: string) => void;
}

function StatsBar({ data }: StatsBarProps) {
  if (!data) return null;

  return (
    <div className="flex justify-between px-4 py-3 bg-card border-white/10 border rounded-lg mt-4">
      <div>
        Top 1: <span className="font-bold">{data.timesInTop1} days</span>
      </div>
      <div>
        Top 5: <span className="font-bold">{data.timesInTop5} days</span>
      </div>
      <div>
        Top 10: <span className="font-bold">{data.timesInTop10} days</span>
      </div>
      <div>
        Top 50: <span className="font-bold">{data.timesInTop50} days</span>
      </div>
      <div>
        Top 100: <span className="font-bold">{data.timesInTop100} days</span>
      </div>
    </div>
  );
}

export function PerformanceTable({
  data,
  onChange,
}: { data: OfferPosition | undefined; onChange: (value: string) => void }) {
  return (
    <div className="w-full p-6 bg-card rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Performance Table</h2>
        {/* <Select defaultValue="7">
          <SelectTrigger className="w-[180px] bg-gray-800 text-white border-gray-700">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select> */}
      </div>

      <Tabs
        defaultValue="top-sellers"
        className="w-full"
        onValueChange={onChange}
      >
        <TabsList className="bg-gray-800 text-gray-400 mb-6">
          <TabsTrigger value="top-sellers">Top Sellers</TabsTrigger>
          <TabsTrigger value="most-played">Most Played</TabsTrigger>
          <TabsTrigger value="top-wishlisted">Top Wishlisted</TabsTrigger>
          <TabsTrigger value="top-new-releases">Top New Releases</TabsTrigger>
          <TabsTrigger value="top-player-reviewed">
            Top Player Reviewed
          </TabsTrigger>
          <TabsTrigger value="most-popular">Most Popular</TabsTrigger>
          <TabsTrigger value="top-demos">Top Demos</TabsTrigger>
          <TabsTrigger value="top-free-to-play">Top Free to Play</TabsTrigger>
          <TabsTrigger value="top-add-ons">Top Add-ons</TabsTrigger>
        </TabsList>

        {data && data.positions.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {data?.positions.slice(0, 7).map((pos, idx) => (
              <PerformanceCard
                key={pos._id}
                position={pos.position}
                change={
                  idx === 0
                    ? 0
                    : pos.position - data.positions[idx - 1].position
                }
                date={pos.date}
              />
            ))}
          </div>
        )}

        {/** Show that there are no data if the data is not available */}
        {!data && (
          <div className="flex justify-center items-center h-60">
            <p className="text-gray-500">No data found</p>
          </div>
        )}

        <StatsBar data={data} />
      </Tabs>
    </div>
  );
}
