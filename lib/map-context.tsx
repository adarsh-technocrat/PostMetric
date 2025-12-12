"use client";

import { createContext, useContext, useRef, ReactNode } from "react";
import mapboxgl from "mapbox-gl";

interface MapContextType {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  mapContainer: React.MutableRefObject<HTMLDivElement | null>;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
}

interface MapProviderProps {
  children: ReactNode;
}

export function MapProvider({ children }: MapProviderProps) {
  const map = useRef<mapboxgl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);

  return (
    <MapContext.Provider value={{ map, mapContainer }}>
      {children}
    </MapContext.Provider>
  );
}
