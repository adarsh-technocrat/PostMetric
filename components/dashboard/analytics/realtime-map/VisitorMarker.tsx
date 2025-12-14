"use client";

import { useState } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import {
  generateVisitorName,
  getAvatarUrl,
  getConversionScoreColor,
  createPopupContent,
  getVisitorCoordinates,
  type Visitor,
} from "@/utils/realtime-map";

interface VisitorMarkerProps {
  visitor: Visitor;
}

export function VisitorMarker({ visitor }: VisitorMarkerProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [lng, lat] = getVisitorCoordinates(visitor);
  const visitorName = generateVisitorName(visitor.visitorId, visitor.userId);
  const avatarUrl = getAvatarUrl(visitor.visitorId, visitor.country);
  const scoreColor = getConversionScoreColor(visitor.conversionScore);

  return (
    <>
      <Marker
        longitude={lng}
        latitude={lat}
        anchor="bottom"
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          setShowPopup(true);
        }}
      >
        <div className="relative cursor-pointer">
          <div
            className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: scoreColor }}
          />
          <img
            src={avatarUrl}
            alt={visitorName}
            className="rounded-full ring-2 transition-all duration-100 bg-white shadow-lg ring-gray-200 size-14 object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = `data:image/svg+xml;utf8,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="50" fill="#8dcdff" />
                  <text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-size="40" fill="white">${visitorName
                    .charAt(0)
                    .toUpperCase()}</text>
                </svg>`
              )}`;
            }}
          />
        </div>
      </Marker>
      {showPopup && (
        <Popup
          longitude={lng}
          latitude={lat}
          anchor="bottom"
          onClose={() => setShowPopup(false)}
          closeButton={true}
          closeOnClick={true}
          className="mapbox-popup-custom"
          offset={25}
        >
          <div
            dangerouslySetInnerHTML={{
              __html: createPopupContent(visitor),
            }}
            className="min-w-[200px]"
          />
        </Popup>
      )}
    </>
  );
}
