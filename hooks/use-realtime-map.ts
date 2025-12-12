import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import {
  type Visitor,
  DEFAULT_COORDS,
  getCountryCoordinates,
  createMarkerElement,
  createPopupContent,
} from "@/utils/realtime-map";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const POLL_INTERVAL = 5000; // 5 seconds
const INIT_MAP_DELAY = 100; // ms

interface UseRealtimeMapProps {
  open: boolean;
  websiteId: string;
  mapContainer: React.RefObject<HTMLDivElement | null>;
}

export function useRealtimeMap({
  open,
  websiteId,
  mapContainer,
}: UseRealtimeMapProps) {
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const mapStyle = useMemo(() => {
    if (typeof window === "undefined") return "mapbox://styles/mapbox/dark-v11";
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDark
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/light-v11";
  }, []);

  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      if (map.current) {
        map.current.resize();
      }
    }, 150);
  }, []);

  // Simulate progress for loading
  useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }
    if (isMapLoaded && !isLoading) {
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Cap at 90% until fully loaded
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [open, isMapLoaded, isLoading]);

  // Initialize map
  useEffect(() => {
    if (!open) {
      setIsMapLoaded(false);
      setProgress(0);
      return;
    }
    if (!mapContainer.current || map.current) return;

    if (!MAPBOX_TOKEN) {
      console.error("Mapbox token is not configured");
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const initMap = () => {
      if (!mapContainer.current || map.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: DEFAULT_COORDS,
        zoom: 2,
        attributionControl: false,
      });

      map.current.on("load", () => {
        map.current?.resize();
        setIsMapLoaded(true);
        setProgress(95); // Almost done when map loads
      });

      map.current.on("error", (e) => {
        console.error("Mapbox error:", e);
      });
    };

    const hasDimensions =
      mapContainer.current.offsetWidth > 0 &&
      mapContainer.current.offsetHeight > 0;

    if (!hasDimensions) {
      const timer = setTimeout(() => {
        initMap();
        window.addEventListener("resize", handleResize);
      }, INIT_MAP_DELAY);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", handleResize);
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
        setIsMapLoaded(false);
      };
    }

    initMap();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setIsMapLoaded(false);
    };
  }, [open, mapStyle, handleResize, mapContainer]);

  // Fetch visitors - only start polling after map is loaded
  useEffect(() => {
    if (!open || !websiteId || !isMapLoaded) {
      if (!open || !websiteId) {
        setIsLoading(true);
      }
      return;
    }

    let isMounted = true;

    const fetchVisitors = async () => {
      try {
        const response = await fetch(
          `/api/websites/${websiteId}/realtime/visitors`
        );
        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setVisitors(data.visitors || []);
        }
        setIsLoading(false);
        setProgress(100); // Complete when visitors are loaded
      } catch (error) {
        console.error("Error fetching visitors:", error);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchVisitors();
    const interval = setInterval(fetchVisitors, POLL_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [open, websiteId, isMapLoaded]);

  // Update map markers
  useEffect(() => {
    if (!map.current || !visitors.length) {
      // Clear markers if no visitors
      if (map.current && visitors.length === 0) {
        markers.current.forEach((marker) => marker.remove());
        markers.current.clear();
      }
      return;
    }

    const updateMarkers = () => {
      if (!map.current) return;

      // Remove old markers
      markers.current.forEach((marker) => marker.remove());
      markers.current.clear();

      // Batch create markers
      visitors.forEach((visitor) => {
        const [lng, lat] = getCountryCoordinates(visitor.country);
        const el = createMarkerElement(visitor);
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);

        // Create popup with anchor to keep marker position fixed
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: true,
          className: "mapbox-popup-custom",
          anchor: "bottom", // Anchor popup to bottom of marker to keep marker position fixed
        }).setHTML(createPopupContent(visitor));

        // Set popup on marker - this keeps the marker position intact
        marker.setPopup(popup);

        markers.current.set(visitor.visitorId, marker);
      });
    };

    if (!map.current.loaded()) {
      const onLoad = () => {
        updateMarkers();
        map.current?.off("load", onLoad);
      };
      map.current.on("load", onLoad);
      return () => {
        map.current?.off("load", onLoad);
      };
    }

    updateMarkers();
  }, [visitors]);

  return {
    visitors,
    isLoading,
    isMapLoaded,
    progress,
  };
}
