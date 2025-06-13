import * as React from 'react';
import { addDays, format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

export function DateRangePicker({
  handleChange,
}: { handleChange: (dates: { from: Date; to: Date | undefined }) => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<{
    from: Date;
    to: Date | undefined;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });

  const quickSelections = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ];

  const handleQuickSelection = (days: number) => {
    const to = new Date();
    const from = addDays(to, -days);
    setDateRange({ from, to });
  };

  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    return 'Select Date Range';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[300px] justify-start text-left font-normal',
            !dateRange && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex w-full max-w-3xl mx-auto rounded-lg border bg-card p-4">
          <div className="grid gap-4 w-full">
            <div className="flex justify-between">
              <div className="w-[calc(50%-0.5rem)]">
                <div className="mb-2 text-sm text-foreground">From</div>
                <div className="rounded-md border px-3 py-2 w-full">
                  {dateRange.from
                    ? format(dateRange.from, 'dd-MM-yyyy')
                    : 'Select Date'}
                </div>
              </div>
              <div className="w-[calc(50%-0.5rem)]">
                <div className="mb-2 text-sm text-foreground">To</div>
                <div className="rounded-md border px-3 py-2 w-full">
                  {dateRange.to
                    ? format(dateRange.to, 'dd-MM-yyyy')
                    : 'Select Date'}
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-between">
              <Calendar
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(newDateRange) => {
                  setDateRange(
                    newDateRange as { from: Date; to: Date | undefined },
                  );
                }}
                numberOfMonths={2}
                className="rounded-md border flex-grow"
              />
              <div className="grid gap-2 min-w-[150px]">
                {quickSelections.map((selection) => (
                  <Button
                    key={selection.label}
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleQuickSelection(selection.days)}
                  >
                    {selection.label}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="justify-start text-blue-600 hover:text-blue-700"
                >
                  Custom Range
                </Button>
                <Button
                  className="mt-auto"
                  onClick={() => {
                    handleChange?.(dateRange);
                    setIsOpen(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
