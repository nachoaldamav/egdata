import * as React from 'react';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { client } from '~/lib/client';
import { useCountry } from '~/hooks/use-country';

async function getCountries(): Promise<string[]> {
  const response = await client.get<string[]>('/countries');
  return response.data;
}

export function CountriesSelector() {
  const [open, setOpen] = React.useState(false);
  const [countries, setCountries] = React.useState<string[]>([]);
  const { country, setCountry } = useCountry();

  React.useEffect(() => {
    getCountries().then(setCountries);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[100px] justify-between"
        >
          {country}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search countries..." className="h-9" />
          <CommandList>
            <CommandEmpty>No countries found</CommandEmpty>
            <CommandGroup>
              {countries.map((c) => (
                <CommandItem
                  key={c}
                  value={c}
                  onSelect={(currentCountry: string) => {
                    setCountry(currentCountry);
                    setOpen(false);
                  }}
                >
                  {c}
                  <CheckIcon
                    className={cn(
                      'ml-auto h-4 w-4',
                      c === country ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
