import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { useLocale } from '@/hooks/use-locale';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  step: number;
  defaultValue: [number, number];
  onValueChange?: (value: [number, number]) => void;
}

export function PriceRangeSlider({
  min,
  max,
  step,
  defaultValue,
  onValueChange,
}: PriceRangeSliderProps) {
  const { locale } = useLocale();
  const [localValue, setLocalValue] =
    React.useState<[number, number]>(defaultValue);

  const fmtr = Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="flex justify-between">
        <span className="text-sm font-medium">
          {fmtr.format(localValue[0] / 100)}
        </span>
        <span className="text-sm font-medium">
          {fmtr.format(localValue[1] / 100)}
        </span>
      </div>
      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onValueChange={(value) => {
          // Update the local state for immediate visual feedback
          setLocalValue(value as [number, number]);
        }}
        onValueCommit={(value) => {
          // Trigger the form update only when the user releases the thumb
          onValueChange?.(value as [number, number]);
        }}
        aria-label="Price range"
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          aria-label="Minimum price"
        />
        <SliderPrimitive.Thumb
          className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          aria-label="Maximum price"
        />
      </SliderPrimitive.Root>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{fmtr.format(min / 100)}</span>
        <span>{fmtr.format(max / 100)}</span>
      </div>
    </div>
  );
}
