"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { initLeafletIcons } from "@/lib/leaflet-setup";
import { REGION_CENTERS, LEBANON_CENTER } from "@/lib/constants";
import type { Region } from "@/types";
import "leaflet/dist/leaflet.css";

initLeafletIcons();

function ClickHandler({
  onChange,
}: {
  onChange: (coords: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onChange([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function RecenterMap({ region }: { region?: Region }) {
  const map = useMap();
  const prevRegion = useRef(region);

  useEffect(() => {
    if (region && region !== prevRegion.current) {
      const center = REGION_CENTERS[region];
      if (center) {
        map.setView(center, 11, { animate: true });
      }
    }
    prevRegion.current = region;
  }, [region, map]);

  return null;
}

interface MapPickerInnerProps {
  value: [number, number] | null;
  onChange: (coords: [number, number]) => void;
  region?: Region;
}

export function MapPickerInner({ value, onChange, region }: MapPickerInnerProps) {
  const center = region ? REGION_CENTERS[region] : LEBANON_CENTER;
  const zoom = region ? 11 : 9;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-[300px] w-full rounded-md border z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onChange={onChange} />
      <RecenterMap region={region} />
      {value && (
        <Marker
          position={value}
          draggable
          eventHandlers={{
            dragend(e) {
              const marker = e.target as L.Marker;
              const pos = marker.getLatLng();
              onChange([pos.lat, pos.lng]);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
