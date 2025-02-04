import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/components/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { symbolsDisplayInfo } from "@/constants";

type Props = {
  value?: string;
  onValueChange?: (value: string) => void;
};

export function SymbolsCombobox({ value, onValueChange }: Props) {
  const [open, setOpen] = React.useState(false);

  const renderSymbolValue = () => {
    const symbol = value ? symbolsDisplayInfo[value] : null;

    if (!symbol) return "Select symbol...";

    return (
      <div className="flex items-center gap-1.5">
        <img className="size-6" src={symbol.logo} />
        <span>{value}</span>
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[180px] justify-between"
        >
          {renderSymbolValue()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0">
        <Command>
          <CommandInput placeholder="Search symbol..." />
          <CommandList>
            <CommandEmpty>No symbol found.</CommandEmpty>
            <CommandGroup>
              {Object.entries(symbolsDisplayInfo).map(
                ([symbol, displayInfo]) => (
                  <CommandItem
                    key={symbol}
                    value={symbol}
                    onSelect={(currentValue) => {
                      setOpen(false);

                      if (currentValue === value) return;

                      onValueChange?.(currentValue);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === symbol ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex items-center gap-1.5">
                      <img className="size-5" src={displayInfo.logo} />
                      <span>{symbol}</span>
                    </div>
                  </CommandItem>
                ),
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default SymbolsCombobox;
