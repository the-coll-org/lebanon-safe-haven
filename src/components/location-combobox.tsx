"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Division } from "@/lib/lebanon-divisions";

interface LocationComboboxProps {
  items: Division[];
  value: string;
  onChange: (slug: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  locale: string;
  disabled?: boolean;
}

export function LocationCombobox({
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  locale,
  disabled,
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedItem = items.find((i) => i.slug === value);
  const displayName = selectedItem
    ? locale === "ar"
      ? selectedItem.ar
      : selectedItem.en
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className={cn(!displayName && "text-muted-foreground")}>
            {displayName || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.slug}
                  value={`${item.ar} ${item.en}`}
                  onSelect={() => {
                    onChange(item.slug === value ? "" : item.slug);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "me-2 h-4 w-4",
                      value === item.slug ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {locale === "ar" ? item.ar : item.en}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
