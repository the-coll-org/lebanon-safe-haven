"use client";

import dynamic from "next/dynamic";
import type { Region } from "@/types";

const MapPickerInner = dynamic(
  () => import("./map-picker-inner").then((m) => m.MapPickerInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full rounded-md border bg-muted animate-pulse" />
    ),
  }
);

interface MapPickerProps {
  value: [number, number] | null;
  onChange: (coords: [number, number]) => void;
  region?: Region;
}

export function MapPicker({ value, onChange, region }: MapPickerProps) {
  return <MapPickerInner value={value} onChange={onChange} region={region} />;
}
